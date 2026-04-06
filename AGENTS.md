# Руководство для агентов и разработчиков

Краткий ориентир по репозиторию **Calendar Booking API**. Подробности контракта — в [`spec/`](spec/), кратко о сборке — в [`README.md`](README.md).

## Назначение

Монорепозиторий вокруг HTTP API «календарь бронирований»: контракт описан в **TypeSpec** (`spec/`), клиентская часть — в **`front/`**, серверная — в **`back/`**. Каталоги `front/` и `back/` могут появляться по мере разработки. Проект проходит проверки Hexlet; CI — в [`.github/workflows/`](.github/workflows/).

## Структура

| Путь | Содержимое |
|------|------------|
| **`front/`** | Фронтенд (Vite + React + TypeScript, Mantine): UI и HTTP-клиент к API. Сборка и запуск — задачи `front:*` в [`.mise.toml`](.mise.toml). Типы ответов генерируются из OpenAPI: `npm run generate-api-types` в каталоге `front/` (исходник — [`spec/openapi/openapi.yaml`](spec/openapi/openapi.yaml)). В разработке мок API: `mise run prism:mock` (порт `4010`), dev-сервер Vite проксирует `/api` на этот порт. Опционально переменная окружения `VITE_API_BASE_URL` для абсолютного базового URL API (см. [`front/.env.example`](front/.env.example)). Файл [`front/.npmrc`](front/.npmrc) (`legacy-peer-deps=true`) нужен, чтобы `npm ci` при `mise run front:install` согласовывал peer-зависимости `openapi-typescript` с TypeScript 6 из шаблона Vite. |
| **`back/`** | Бэкенд: реализация API и серверная логика. |
| [`spec/main.tsp`](spec/main.tsp) | Сервис, версия API (`CalendarApiVersions`), общий `@doc` с инвариантами. |
| [`spec/routes.tsp`](spec/routes.tsp) | Операции HTTP. |
| [`spec/models.tsp`](spec/models.tsp), [`spec/common_models.tsp`](spec/common_models.tsp) | Модели и обёртки ответов. |
| [`spec/openapi/openapi.yaml`](spec/openapi/openapi.yaml) | **Сгенерированный** OpenAPI (эмиттер `@typespec/openapi3`, см. [`spec/tspconfig.yaml`](spec/tspconfig.yaml)). Не править вручную, если то же можно выразить в TypeSpec. |

## Инструменты и команды

Файл **[`.mise.toml`](.mise.toml)** — **источник истины** для:

- **версий инструментов** — секция `[tools]` (сейчас задан Node); перед работой: `mise install`;
- **именованных команд** — секция `[tasks]`: сборка, линтеры, тесты и т.п.; запуск: `mise run <имя_задачи>`.

Сейчас в `[tasks]` есть, например: `spec:install`, `spec:build`, `front:install`, `front:dev`, `front:build`, `prism:mock`. Для бэкенда по мере появления кода добавляют отдельные задачи. При расхождении с README или с этим файлом **верьте `.mise.toml`**.

Полный перечень версий и задач в этом документе не дублируется — смотрите [`.mise.toml`](.mise.toml).

## Правила для агентов

- Держать фронт в **`front/`**, бэк в **`back/`**; не класть «чужой» слой в соседнюю папку без явной причины (общие типы — по договорённости, когда появятся).
- Перед линтом, тестами и сборкой открывать **`[tasks]`** в [`.mise.toml`](.mise.toml) и вызывать `mise run <task>`, а не угадывать команды.
- Менять контракт в `*.tsp`, затем запускать сборку spec через mise (например `mise run spec:build`) и коммитить обновлённый [`spec/openapi/openapi.yaml`](spec/openapi/openapi.yaml), пока он отслеживается в git.
- **Не удалять и не редактировать** [`.github/workflows/hexlet-check.yml`](.github/workflows/hexlet-check.yml) — он нужен автопроверкам Hexlet.

## Cursor

Детальные соглашения для отдельных типов файлов можно выносить в [`.cursor/rules/*.mdc`](.cursor/rules/). `AGENTS.md` остаётся обзором всего репозитория.

## Язык

Описания в спецификации и в этом файле — **на русском**, в духе существующих `@doc` в TypeSpec.
