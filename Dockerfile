# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS frontend
WORKDIR /app/front
COPY front/package.json front/package-lock.json front/.npmrc ./
RUN npm ci
COPY front/ ./
RUN npm run build

FROM python:3.12-slim-bookworm
WORKDIR /app/back

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV STATIC_ROOT=/app/static

COPY back/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY back/ .

COPY --from=frontend /app/front/dist /app/static

EXPOSE 8000

CMD ["sh", "-c", "exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
