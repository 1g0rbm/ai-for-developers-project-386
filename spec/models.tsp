namespace CalendarBooking {
  @doc("Роль владельца календаря.")
  enum OwnerRole {
    Owner: "Owner",
  }

  @doc("Профиль владельца календаря (сейчас синглтон; схему можно расширять при эволюции API).")
  model Profile {
    @doc("Стабильный идентификатор профиля.")
    id: string;

    @doc("Отображаемое имя.")
    displayName: string;

    @doc("Контактный email.")
    email: string;

    role: OwnerRole;
  }

  @doc("Тип события: публичное представление и ресурс CRUD.")
  model EventType {
    @doc("Уникальный id; задаётся клиентом при создании (URL-safe строка).")
    id: string;

    name: string;
    description: string;

    @doc("Длительность встречи в минутах (> 0 на стороне сервера).")
    @minValue(1)
    durationMinutes: int32;
  }

  @doc("Тело создания типа события (все поля ресурса, включая id).")
  model CreateEventTypeRequest {
    id: string;
    name: string;
    description: string;

    @minValue(1)
    durationMinutes: int32;
  }

  @doc("Тело полной замены типа события (PUT); id только в пути.")
  model ReplaceEventTypeRequest {
    name: string;
    description: string;

    @minValue(1)
    durationMinutes: int32;
  }

  @doc("Краткие данные типа в списке бронирований.")
  model EventTypeSummary {
    id: string;
    name: string;

    @minValue(1)
    durationMinutes: int32;
  }

  @doc("Бронирование.")
  model Booking {
    id: string;
    eventTypeId: string;

    @doc("Начало в UTC (ISO 8601).")
    start: utcDateTime;

    guestName: string;
    guestEmail: string;
  }

  @doc("Создание бронирования гостем.")
  model CreateBookingRequest {
    eventTypeId: string;
    start: utcDateTime;
    guestName: string;
    guestEmail: string;
  }

  @doc("Элемент списка предстоящих бронирований с вложенным типом события.")
  model BookingListItem {
    id: string;
    eventTypeId: string;
    start: utcDateTime;
    guestName: string;
    guestEmail: string;
    eventType: EventTypeSummary;
  }

  @doc("Свободные слоты: моменты начала + параметр сетки, согласованный с сервером.")
  model AvailabilityResponse {
    @doc("Шаг сетки слотов в минутах (например 15). Должен совпадать с query или значением по умолчанию.")
    @minValue(1)
    slotStepMinutes: int32;

    @doc("Допустимые моменты начала слота в UTC; каждый слот занимает duration выбранного типа.")
    availableStarts: utcDateTime[];
  }
}
