import { notifications } from '@mantine/notifications'
import { ApiHttpError } from './api/client'

export function notifyError(err: unknown, title = 'Ошибка') {
  const message =
    err instanceof ApiHttpError
      ? `${err.message}${err.code != null ? ` (код ${err.code})` : ''} — HTTP ${err.status}`
      : err instanceof Error
        ? err.message
        : String(err)
  notifications.show({ title, message, color: 'red' })
}
