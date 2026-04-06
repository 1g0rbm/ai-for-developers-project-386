"""SQLite in-memory (shared cache) и схема; синглтон владельца при инициализации."""

from __future__ import annotations

import sqlite3
import threading
import uuid

SQLITE_URI = "file:calendar_booking?mode=memory&cache=shared"

_lock = threading.Lock()
_conn: sqlite3.Connection | None = None


def init_connection() -> sqlite3.Connection:
    global _conn
    with _lock:
        if _conn is not None:
            return _conn
        conn = sqlite3.connect(SQLITE_URI, uri=True, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.executescript(
            """
            CREATE TABLE owner (
                id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role = 'Owner')
            );

            CREATE TABLE event_types (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 1)
            );

            CREATE TABLE bookings (
                id TEXT PRIMARY KEY,
                event_type_id TEXT NOT NULL REFERENCES event_types (id),
                start_iso TEXT NOT NULL,
                guest_name TEXT NOT NULL,
                guest_email TEXT NOT NULL
            );
            """
        )
        owner_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO owner (id, display_name, email, role) VALUES (?, ?, ?, 'Owner')",
            (owner_id, "Владелец календаря", "owner@example.com"),
        )
        conn.commit()
        _conn = conn
        return conn


def connection() -> sqlite3.Connection:
    return init_connection()


def with_lock():
    return _lock
