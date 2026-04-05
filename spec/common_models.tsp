import "@typespec/http";

using TypeSpec.Http;

@error
@doc("Тело ошибки API.")
model ApiError {
  @doc("Прикладной или HTTP-ориентированный код.")
  code: int32;

  @doc("Человекочитаемое описание.")
  message: string;
}

@doc("400 — неверные параметры или тело запроса.")
model BadRequestError extends ApiError {
  @statusCode statusCode: 400;
}

@doc("404 — ресурс не найден.")
model NotFoundError extends ApiError {
  @statusCode statusCode: 404;
}

@doc("409 — конфликт (дубль id типа, пересечение брони и т.п.).")
model ConflictError extends ApiError {
  @statusCode statusCode: 409;
}

@doc("422 — семантически неверный запрос (например слот вне сетки или в прошлом).")
model UnprocessableEntityError extends ApiError {
  @statusCode statusCode: 422;
}

@doc("500 — внутренняя ошибка сервера.")
model InternalServerError extends ApiError {
  @statusCode statusCode: 500;
}

@doc("Ответ 201 Created.")
model CreatedJson<T> {
  @statusCode statusCode: 201;
  @body body: T;
}

@doc("Ответ 200 OK с JSON-телом.")
model OkJson<T> {
  @statusCode statusCode: 200;
  @body body: T;
}

@doc("Ответ 204 No Content (без тела).")
model EmptyNoContent {
  @statusCode statusCode: 204;
}

alias CalendarErrors =
  | BadRequestError
  | NotFoundError
  | ConflictError
  | UnprocessableEntityError
  | InternalServerError;

alias CalendarOk<T> = OkJson<T> | CalendarErrors;
alias CalendarCreated<T> = CreatedJson<T> | CalendarErrors;
alias CalendarNoContent = EmptyNoContent | CalendarErrors;
