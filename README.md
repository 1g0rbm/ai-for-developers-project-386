### Hexlet tests and linter status:
[![Actions Status](https://github.com/1g0rbm/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/1g0rbm/ai-for-developers-project-386/actions)

### OpenAPI (TypeSpec)

Исходники контракта в каталоге `spec/`. Сборка: из корня `mise install` и `mise run spec:build`, либо `cd spec && npm ci && npm run build`. Результат: `spec/openapi/openapi.yaml`. Версия API задаётся через `@typespec/versioning` (`CalendarApiVersions` в `main.tsp`); в OpenAPI попадает в `info.version`.

### Фронтенд

Из корня: `mise run front:install`, затем в одном терминале `mise run prism:mock`, в другом `mise run front:dev`. Откройте URL, который выведет Vite (обычно `http://localhost:5173`). Production-сборка: `mise run front:build`. Подробности и переменные окружения — в [`AGENTS.md`](AGENTS.md).