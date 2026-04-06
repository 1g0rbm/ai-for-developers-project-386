### Hexlet tests and linter status:
[![Actions Status](https://github.com/1g0rbm/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/1g0rbm/ai-for-developers-project-386/actions)

### E2e (Playwright)

[![e2e](https://github.com/1g0rbm/ai-for-developers-project-386/actions/workflows/e2e.yml/badge.svg)](https://github.com/1g0rbm/ai-for-developers-project-386/actions)

Из корня: `mise install`. Тесты сами поднимают API и `vite preview` (через `mise run e2e:serve`).

- Первый раз (браузер Chromium): `mise run e2e:browsers`. На Linux без нужных `.so` один раз выполните `cd e2e && npx playwright install --with-deps chromium` (нужен `sudo`).
- Обычный прогон: `mise run e2e:test`.
- Как в CI (включая `CI=true`): `mise run e2e:ci`.

Сценарии: [`e2e/SCENARIOS.md`](e2e/SCENARIOS.md). Полный список задач — [`.mise.toml`](.mise.toml) и [`AGENTS.md`](AGENTS.md).

### OpenAPI (TypeSpec)

Исходники контракта в каталоге `spec/`. Сборка: из корня `mise install` и `mise run spec:build`, либо `cd spec && npm ci && npm run build`. Результат: `spec/openapi/openapi.yaml`. Версия API задаётся через `@typespec/versioning` (`CalendarApiVersions` в `main.tsp`); в OpenAPI попадает в `info.version`.

### Фронтенд

Из корня: `mise run front:install`, затем в одном терминале `mise run prism:mock`, в другом `mise run front:dev`. Откройте URL, который выведет Vite (обычно `http://localhost:5173`). Production-сборка: `mise run front:build`. Подробности и переменные окружения — в [`AGENTS.md`](AGENTS.md).
