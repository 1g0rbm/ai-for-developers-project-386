# GitHub Actions

В репозитории используются несколько workflow под разные сценарии. Файл `hexlet-check.yml` трогать нельзя: он нужен автопроверкам Hexlet.

## Основные workflow

- `hexlet-check.yml` — обязательная проверка Hexlet, не удалять и не редактировать.
- `e2e.yml` — интеграционные e2e-тесты Playwright для `push` в `main` и `pull_request` в `main`.
- `cursor-triage.yml` — triage новых `issue` по событию `issues: opened`.
- `cursor-pr-interactive.yml` — реакция на общие комментарии `issue_comment` в issue и pull request.
- `cursor-pr-line-comment.yml` — реакция на комментарии к конкретным строкам diff по событию `pull_request_review_comment`.
- `cursor-pr-review.yml` — автоматический предварительный review pull request по событию `pull_request`.

## Cursor workflow

Для workflow Cursor нужен секрет `CURSOR_API_KEY`.

Поддерживаемые slash-команды в комментариях:

- `/cursor`
- `/oc`
- `/opencode`

Режимы:

- по умолчанию `explain`;
- `fix` включает режим правки файлов и коммита, если workflow это допускает.

### `cursor-pr-interactive.yml`

- Триггер: `issue_comment: created`
- Назначение: обработка общих комментариев к issue и PR
- Поведение:
  - `explain` отвечает обычным комментарием;
  - `fix` может внести изменения, закоммитить их в ветку PR или создать отдельную ветку и PR.

### `cursor-pr-line-comment.yml`

- Триггер: `pull_request_review_comment: created`
- Назначение: работа с комментариями к конкретным строкам diff
- Поведение:
  - получает `path`, `line`, `diff_hunk` и review-thread автоматически;
  - `fix` может подготовить правку по локальному замечанию.

### `cursor-pr-review.yml`

- Триггер: `pull_request` (`opened`, `reopened`, `synchronize`, `ready_for_review`)
- Назначение: автоматический предварительный технический review PR
- Поведение:
  - анализирует описание PR и изменённые файлы;
  - публикует review через Pull Request Review API;
  - не меняет код, не делает коммиты и не открывает новые PR.

## Ограничения

- Автоматический AI review предварительный и не заменяет человеческий review.
- `cursor-pr-review.yml` комментирует PR, но не вносит изменения в код.
- Структура workflow разделена по сценариям GitHub events: `issue_comment`, `pull_request_review_comment`, `pull_request`.
