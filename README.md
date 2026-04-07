# Calendar Booking API

[![Actions Status](https://github.com/1g0rbm/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/1g0rbm/ai-for-developers-project-386/actions) [![e2e](https://github.com/1g0rbm/ai-for-developers-project-386/actions/workflows/e2e.yml/badge.svg)](https://github.com/1g0rbm/ai-for-developers-project-386/actions)

Монорепозиторий вокруг HTTP API «календарь бронирований»: контракт в **TypeSpec** (`spec/`), сгенерированный **OpenAPI** — `spec/openapi/openapi.yaml`, фронтенд в **`front/`**, бэкенд в **`back/`**, интеграционные тесты — **`e2e/`**. Версии инструментов и именованные команды заданы в [`.mise.toml`](.mise.toml); подробнее о контракте и соглашениях — в [`AGENTS.md`](AGENTS.md).

## Зависимости

| Слой | Инструменты и библиотеки |
|------|---------------------------|
| **Репозиторий** | [mise](https://mise.jdx.dev/): **Node.js 22**, **Python 3.12** — единая точка для версий и задач (`mise run …`). |
| **Контракт** (`spec/`) | TypeSpec: `@typespec/compiler`, `@typespec/http`, `@typespec/openapi3`, `@typespec/versioning`. |
| **Фронтенд** (`front/`) | Vite, React, TypeScript, Mantine, React Router; типы клиента генерируются из OpenAPI (`openapi-typescript`). |
| **Бэкенд** (`back/`) | FastAPI, Uvicorn (см. `requirements.txt`). |
| **E2E** (`e2e/`) | Playwright. |
| **Мок API при разработке** | Prism CLI (`@stoplight/prism-cli`), поднимается на порту `4010`. |

Перед работой из корня репозитория: `mise install`.

## Запуск

### Спецификация (TypeSpec → OpenAPI)

```bash
mise run spec:build
```

Альтернатива: `cd spec && npm ci && npm run build`. Результат — `spec/openapi/openapi.yaml`. Версия API задаётся в `spec/main.tsp` (`CalendarApiVersions`); в OpenAPI попадает в `info.version`.

### Фронтенд с моком API

В одном терминале мок по контракту, в другом — Vite:

```bash
mise run front:install
mise run prism:mock
# отдельный терминал:
mise run front:dev
```

Откройте URL из вывода Vite (обычно `http://localhost:5173`). Production-сборка: `mise run front:build`. Переменные окружения — [`front/.env.example`](front/.env.example), см. также [`AGENTS.md`](AGENTS.md).

### Бэкенд

```bash
mise run back:install
mise run back:dev
```

Сервер по умолчанию: `http://127.0.0.1:8000`.

### Фронт + бэк одной командой

```bash
mise run dev
```

### E2E-тесты

Из корня: `mise install`. Тесты поднимают API и `vite preview` (через `mise run e2e:serve`).

- Первый раз (Chromium): `mise run e2e:browsers`. На Linux без нужных `.so` один раз: `cd e2e && npx playwright install --with-deps chromium` (нужен `sudo`).
- Обычный прогон: `mise run e2e:test`.
- Как в CI: `mise run e2e:ci`.

Сценарии: [`e2e/SCENARIOS.md`](e2e/SCENARIOS.md). Полный список задач — [`.mise.toml`](.mise.toml).
