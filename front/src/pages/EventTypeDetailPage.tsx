import { Button, Group, NumberInput, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteEventType, getEventType, replaceEventType, type EventType } from '../api/calendarApi'
import { notifyError } from '../notifyError'

export function EventTypeDetailPage() {
  const { id: rawId } = useParams<{ id: string }>()
  const id = rawId ? decodeURIComponent(rawId) : ''
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<EventType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(30)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    void (async () => {
      setLoading(true)
      try {
        const t = await getEventType(id)
        setData(t)
        setName(t.name)
        setDescription(t.description)
        setDurationMinutes(t.durationMinutes)
      } catch (e) {
        notifyError(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const handleSave = async () => {
    if (!id || durationMinutes === '' || !name.trim() || !description.trim()) {
      notifications.show({ message: 'Заполните все поля', color: 'yellow' })
      return
    }
    setSaving(true)
    try {
      const updated = await replaceEventType(id, {
        name: name.trim(),
        description: description.trim(),
        durationMinutes: Number(durationMinutes),
      })
      setData(updated)
      notifications.show({ title: 'Сохранено', message: 'Тип обновлён', color: 'green' })
    } catch (e) {
      notifyError(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!window.confirm('Удалить тип события? Если есть брони — сервер вернёт 409.')) return
    setDeleting(true)
    try {
      await deleteEventType(id)
      notifications.show({ title: 'Удалено', message: 'Тип удалён', color: 'green' })
      void navigate('/owner')
    } catch (e) {
      notifyError(e)
    } finally {
      setDeleting(false)
    }
  }

  if (!id) {
    return <Text>Не указан id</Text>
  }

  return (
    <Stack gap="lg">
      <Group>
        <Button component={Link} to="/owner" variant="subtle">
          ← К списку
        </Button>
      </Group>
      <Title order={2}>Тип встречи</Title>
      {loading || !data ? (
        <Text c="dimmed">Загрузка…</Text>
      ) : (
        <Paper withBorder p="md" radius="md">
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              id: <strong>{data.id}</strong> (задаётся при создании, в PUT не передаётся)
            </Text>
            <TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} />
            <TextInput
              label="Описание"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />
            <NumberInput
              label="Длительность (мин)"
              min={1}
              value={durationMinutes}
              onChange={(v) => setDurationMinutes(typeof v === 'number' ? v : '')}
            />
            <Group>
              <Button onClick={() => void handleSave()} loading={saving}>
                Сохранить
              </Button>
              <Button color="red" variant="light" onClick={() => void handleDelete()} loading={deleting}>
                Удалить
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}
