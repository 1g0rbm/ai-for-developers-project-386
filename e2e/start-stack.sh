#!/usr/bin/env bash
# Поднимает API и vite preview для e2e. Вызывается из mise run e2e:serve (cwd = корень репозитория).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/back"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
UV_PID=$!

cleanup() {
  kill "$UV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 75); do
  if curl -sf http://127.0.0.1:8000/api/owner >/dev/null; then
    break
  fi
  sleep 0.2
done

if ! curl -sf http://127.0.0.1:8000/api/owner >/dev/null; then
  echo "e2e/start-stack.sh: API не поднялся на :8000" >&2
  exit 1
fi

cd "$ROOT/front"
npm run preview -- --host 127.0.0.1 --port 5173
