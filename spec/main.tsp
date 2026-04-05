import "@typespec/http";
import "@typespec/versioning";
import "./common_models.tsp";
import "./models.tsp";
import "./routes.tsp";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service(#{ title: "Calendar Booking API" })
@versioned(CalendarApiVersions)
@doc("""
Календарь бронирований без регистрации гостей.

## Инварианты
- В системе ровно один пользователь с ролью Owner; ресурс `GET /api/owner` возвращает единственного владельца календаря.
- Все моменты времени в API — UTC (ISO 8601, `date-time`).
- Два бронирования не могут пересекаться по времени, даже если типы событий разные.
- `POST /api/event-types` с уже существующим `id` возвращает 409 Conflict.
- `POST /api/bookings` при пересечении интервала `[start, start + duration)` с любым существующим бронированием — 409 Conflict.
- `GET /api/availability` возвращает только такие моменты начала слота, для которых интервал слота не пересекается ни с одним существующим бронированием (глобально).

Аутентификация в API не используется.
""")
@route("/api")
namespace CalendarBooking {
  @doc("Версии публичного HTTP API.")
  enum CalendarApiVersions {
    @doc("Версия 1.0.0 — текущий контракт календаря бронирований.")
    v1: "1.0.0",
  }
}
