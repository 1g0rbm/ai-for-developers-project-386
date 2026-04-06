"""HTTP API календаря бронирований по OpenAPI-контракту."""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from datetime import timedelta
from typing import Annotated, Literal

from fastapi import FastAPI, Query, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.db import connection, init_connection, with_lock
from app.timeutil import add_minutes, format_utc, intervals_overlap, parse_utc, utc_now

DEFAULT_SLOT_STEP_MINUTES = 15


def api_error(status_code: int, message: str, code: int | None = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"code": code if code is not None else status_code, "message": message},
    )


# --- Pydantic (имена полей = JSON camelCase по контракту) ---


class Profile(BaseModel):
    id: str
    displayName: str
    email: str
    role: Literal["Owner"]


class EventType(BaseModel):
    id: str
    name: str
    description: str
    durationMinutes: int = Field(ge=1)


class CreateEventTypeRequest(BaseModel):
    id: str
    name: str
    description: str
    durationMinutes: int = Field(ge=1)


class ReplaceEventTypeRequest(BaseModel):
    name: str
    description: str
    durationMinutes: int = Field(ge=1)


class Booking(BaseModel):
    id: str
    eventTypeId: str
    start: str
    guestName: str
    guestEmail: str


class EventTypeSummary(BaseModel):
    id: str
    name: str
    durationMinutes: int = Field(ge=1)


class BookingListItem(BaseModel):
    id: str
    eventTypeId: str
    start: str
    guestName: str
    guestEmail: str
    eventType: EventTypeSummary


class CreateBookingRequest(BaseModel):
    eventTypeId: str
    start: str
    guestName: str
    guestEmail: str


class AvailabilityResponse(BaseModel):
    slotStepMinutes: int = Field(ge=1)
    availableStarts: list[str]


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_connection()
    yield


app = FastAPI(title="Calendar Booking API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    return api_error(400, str(exc.errors()[0]["msg"]) if exc.errors() else "Некорректный запрос", 400)


@app.get("/api/owner")
def get_owner() -> Profile:
    conn = connection()
    with with_lock():
        row = conn.execute("SELECT id, display_name, email, role FROM owner LIMIT 1").fetchone()
    assert row is not None
    return Profile(
        id=row["id"],
        displayName=row["display_name"],
        email=row["email"],
        role=row["role"],
    )


@app.get("/api/event-types", response_model=list[EventType])
def list_event_types() -> list[EventType]:
    conn = connection()
    with with_lock():
        rows = conn.execute(
            "SELECT id, name, description, duration_minutes FROM event_types ORDER BY id"
        ).fetchall()
    return [
        EventType(
            id=r["id"],
            name=r["name"],
            description=r["description"],
            durationMinutes=r["duration_minutes"],
        )
        for r in rows
    ]


@app.post("/api/event-types", response_model=EventType, status_code=201)
def create_event_type(body: CreateEventTypeRequest) -> EventType | JSONResponse:
    conn = connection()
    with with_lock():
        dup = conn.execute("SELECT 1 FROM event_types WHERE id = ?", (body.id,)).fetchone()
        if dup is not None:
            return api_error(409, "Тип события с таким id уже существует", 409)
        conn.execute(
            "INSERT INTO event_types (id, name, description, duration_minutes) VALUES (?, ?, ?, ?)",
            (body.id, body.name, body.description, body.durationMinutes),
        )
        conn.commit()
    return EventType(
        id=body.id,
        name=body.name,
        description=body.description,
        durationMinutes=body.durationMinutes,
    )


@app.get("/api/event-types/{id}", response_model=EventType)
def get_event_type(id: str) -> EventType | JSONResponse:
    conn = connection()
    with with_lock():
        row = conn.execute(
            "SELECT id, name, description, duration_minutes FROM event_types WHERE id = ?",
            (id,),
        ).fetchone()
    if row is None:
        return api_error(404, "Тип события не найден", 404)
    return EventType(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        durationMinutes=row["duration_minutes"],
    )


@app.put("/api/event-types/{id}", response_model=EventType)
def replace_event_type(id: str, body: ReplaceEventTypeRequest) -> EventType | JSONResponse:
    conn = connection()
    with with_lock():
        cur = conn.execute(
            "UPDATE event_types SET name = ?, description = ?, duration_minutes = ? WHERE id = ?",
            (body.name, body.description, body.durationMinutes, id),
        )
        conn.commit()
        if cur.rowcount == 0:
            return api_error(404, "Тип события не найден", 404)
        row = conn.execute(
            "SELECT id, name, description, duration_minutes FROM event_types WHERE id = ?",
            (id,),
        ).fetchone()
    return EventType(
        id=row["id"],
        name=row["name"],
        description=row["description"],
        durationMinutes=row["duration_minutes"],
    )


@app.delete(
    "/api/event-types/{id}",
    response_model=None,
    responses={204: {"description": "Тип удалён"}},
)
def delete_event_type(id: str) -> Response | JSONResponse:
    conn = connection()
    with with_lock():
        row = conn.execute("SELECT 1 FROM event_types WHERE id = ?", (id,)).fetchone()
        if row is None:
            return api_error(404, "Тип события не найден", 404)
        booking = conn.execute(
            "SELECT 1 FROM bookings WHERE event_type_id = ? LIMIT 1", (id,)
        ).fetchone()
        if booking is not None:
            return api_error(409, "Нельзя удалить тип: есть связанные бронирования", 409)
        conn.execute("DELETE FROM event_types WHERE id = ?", (id,))
        conn.commit()
    return Response(status_code=204)


def _load_booking_intervals(conn) -> list[tuple[str, datetime, datetime]]:
    rows = conn.execute(
        """
        SELECT b.id, b.start_iso, et.duration_minutes
        FROM bookings b
        JOIN event_types et ON et.id = b.event_type_id
        """
    ).fetchall()
    out: list[tuple[str, datetime, datetime]] = []
    for r in rows:
        start = parse_utc(r["start_iso"])
        end = add_minutes(start, r["duration_minutes"])
        out.append((r["id"], start, end))
    return out


@app.get("/api/bookings", response_model=list[BookingListItem])
def list_bookings(
    from_: Annotated[str | None, Query(alias="from")] = None,
    to: Annotated[str | None, Query()] = None,
) -> list[BookingListItem] | JSONResponse:
    try:
        lower = parse_utc(from_) if from_ is not None else utc_now()
        upper = parse_utc(to) if to is not None else None
    except ValueError:
        return api_error(400, "Некорректный формат date-time", 400)

    conn = connection()
    with with_lock():
        rows = conn.execute(
            """
            SELECT b.id, b.event_type_id, b.start_iso, b.guest_name, b.guest_email,
                   et.id AS et_id, et.name AS et_name, et.duration_minutes AS et_dur
            FROM bookings b
            JOIN event_types et ON et.id = b.event_type_id
            ORDER BY b.start_iso ASC
            """
        ).fetchall()

    items: list[BookingListItem] = []
    for r in rows:
        try:
            start = parse_utc(r["start_iso"])
        except ValueError:
            continue
        if start < lower:
            continue
        if upper is not None and start >= upper:
            continue
        items.append(
            BookingListItem(
                id=r["id"],
                eventTypeId=r["event_type_id"],
                start=r["start_iso"],
                guestName=r["guest_name"],
                guestEmail=r["guest_email"],
                eventType=EventTypeSummary(
                    id=r["et_id"],
                    name=r["et_name"],
                    durationMinutes=r["et_dur"],
                ),
            )
        )
    return items


@app.post("/api/bookings", response_model=Booking, status_code=201)
def create_booking(body: CreateBookingRequest) -> Booking | JSONResponse:
    try:
        start = parse_utc(body.start)
    except ValueError:
        return api_error(400, "Некорректный формат start", 400)

    now = utc_now()
    if start < now:
        return api_error(422, "Нельзя бронировать слот в прошлом", 422)

    conn = connection()
    with with_lock():
        et = conn.execute(
            "SELECT id, duration_minutes FROM event_types WHERE id = ?",
            (body.eventTypeId,),
        ).fetchone()
        if et is None:
            return api_error(404, "Тип события не найден", 404)

        duration = int(et["duration_minutes"])
        new_end = add_minutes(start, duration)

        for _bid, b0, b1 in _load_booking_intervals(conn):
            if intervals_overlap(start, new_end, b0, b1):
                return api_error(409, "Слот пересекается с существующей бронью", 409)

        bid = str(uuid.uuid4())
        conn.execute(
            """
            INSERT INTO bookings (id, event_type_id, start_iso, guest_name, guest_email)
            VALUES (?, ?, ?, ?, ?)
            """,
            (bid, body.eventTypeId, format_utc(start), body.guestName, body.guestEmail),
        )
        conn.commit()

    return Booking(
        id=bid,
        eventTypeId=body.eventTypeId,
        start=format_utc(start),
        guestName=body.guestName,
        guestEmail=body.guestEmail,
    )


@app.get("/api/availability", response_model=AvailabilityResponse)
def get_availability(
    eventTypeId: str,
    from_: Annotated[str, Query(alias="from")],
    to: str,
    slotStepMinutes: Annotated[int | None, Query()] = None,
) -> AvailabilityResponse | JSONResponse:
    step = slotStepMinutes if slotStepMinutes is not None else DEFAULT_SLOT_STEP_MINUTES
    if step < 1:
        return api_error(400, "slotStepMinutes должен быть >= 1", 400)

    try:
        frm = parse_utc(from_)
        until = parse_utc(to)
    except ValueError:
        return api_error(400, "Некорректный формат date-time", 400)

    if until <= frm:
        return api_error(400, "Интервал [from, to) должен быть непустым", 400)

    conn = connection()
    with with_lock():
        et = conn.execute(
            "SELECT id, duration_minutes FROM event_types WHERE id = ?",
            (eventTypeId,),
        ).fetchone()
        if et is None:
            return api_error(404, "Тип события не найден", 404)

        duration = int(et["duration_minutes"])
        intervals = _load_booking_intervals(conn)

    available: list[str] = []
    t = frm
    delta_dur = timedelta(minutes=duration)

    while t + delta_dur <= until:
        new_end = add_minutes(t, duration)
        busy = False
        for _id, b0, b1 in intervals:
            if intervals_overlap(t, new_end, b0, b1):
                busy = True
                break
        if not busy:
            available.append(format_utc(t))
        t = add_minutes(t, step)

    return AvailabilityResponse(slotStepMinutes=step, availableStarts=available)
