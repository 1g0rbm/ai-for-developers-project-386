import "@typespec/http";
import "./common_models.tsp";

using TypeSpec.Http;

namespace CalendarBooking {
  @get
  @route("/owner")
  @doc("Возвращает единственного владельца календаря (синглтон).")
  op getOwner(): CalendarOk<Profile>;

  @get
  @route("/event-types")
  @doc("Список типов событий (для владельца и для страницы гостя).")
  op listEventTypes(): CalendarOk<EventType[]>;

  @post
  @route("/event-types")
  @doc("Создание типа события. Клиент задаёт `id`; при дубле — 409.")
  op createEventType(@body body: CreateEventTypeRequest): CalendarCreated<EventType>;

  @get
  @route("/event-types/{id}")
  op getEventType(@path id: string): CalendarOk<EventType>;

  @put
  @route("/event-types/{id}")
  @doc("Полная замена полей типа (id только в пути).")
  op replaceEventType(
    @path id: string,
    @body body: ReplaceEventTypeRequest,
  ): CalendarOk<EventType>;

  @delete
  @route("/event-types/{id}")
  @doc("Удаление типа; при невозможности (например есть брони) — 409.")
  op deleteEventType(@path id: string): CalendarNoContent;

  @get
  @route("/bookings")
  @doc("""
Предстоящие бронирования всех типов в одном списке.
Если `from` не передан, сервер использует текущий момент (UTC).
Сортировка по `start` по возрастанию.
""")
  op listBookings(
    @query
    @doc("Нижняя граница (UTC). По умолчанию — «сейчас» на сервере.")
    from?: utcDateTime,

    @query
    @doc("Верхняя граница (UTC), опционально.")
    to?: utcDateTime,
  ): CalendarOk<BookingListItem[]>;

  @post
  @route("/bookings")
  @doc("Создание брони; пересечение с любой существующей записью — 409.")
  op createBooking(@body body: CreateBookingRequest): CalendarCreated<Booking>;

  @get
  @route("/availability")
  @doc("""
Свободные моменты начала слотов для выбранного типа на [from, to).
Длительность слота = durationMinutes типа. Учитываются все бронирования календаря.
""")
  op getAvailability(
    @query
    eventTypeId: string,

    @query
    from: utcDateTime,

    @query
    to: utcDateTime,

    @query
    @doc("Шаг сетки в минутах; если не указан — значение по умолчанию на сервере (отражается в ответе).")
    slotStepMinutes?: int32,
  ): CalendarOk<AvailabilityResponse>;
}
