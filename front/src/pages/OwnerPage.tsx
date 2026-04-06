import {
  Button,
  Grid,
  Group,
  NumberInput,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createEventType,
  getOwner,
  listBookings,
  listEventTypes,
  type BookingListItem,
  type EventType,
  type Profile,
} from '../api/calendarApi'
import { notifyError } from '../notifyError'

export function OwnerPage() {
  const [owner, setOwner] = useState<Profile | null>(null)
  const [types, setTypes] = useState<EventType[]>([])
  const [bookings, setBookings] = useState<BookingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingFrom, setBookingFrom] = useState<string | null>(null)
  const [bookingTo, setBookingTo] = useState<string | null>(null)
  const [loadingBookings, setLoadingBookings] = useState(false)

  const [newId, setNewId] = useState('')
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDuration, setNewDuration] = useState<number | ''>(30)
  const [creating, setCreating] = useState(false)

  const refreshTypes = async () => {
    const data = await listEventTypes()
    setTypes(data)
  }

  const loadBookings = async () => {
    setLoadingBookings(true)
    try {
      const data = await listBookings({
        from: bookingFrom ? new Date(bookingFrom).toISOString() : undefined,
        to: bookingTo ? new Date(bookingTo).toISOString() : undefined,
      })
      setBookings(data)
    } catch (e) {
      notifyError(e)
    } finally {
      setLoadingBookings(false)
    }
  }

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const [o, t, b] = await Promise.all([getOwner(), listEventTypes(), listBookings()])
        setOwner(o)
        setTypes(t)
        setBookings(b)
      } catch (e) {
        notifyError(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleCreateType = async () => {
    if (!newId.trim() || !newName.trim() || !newDescription.trim() || newDuration === '') {
      notifications.show({ message: 'Заполните id, название, описание и длительность', color: 'yellow' })
      return
    }
    setCreating(true)
    try {
      await createEventType({
        id: newId.trim(),
        name: newName.trim(),
        description: newDescription.trim(),
        durationMinutes: Number(newDuration),
      })
      notifications.show({ title: 'Создано', message: 'Тип события добавлен', color: 'green' })
      setNewId('')
      setNewName('')
      setNewDescription('')
      setNewDuration(30)
      await refreshTypes()
    } catch (e) {
      notifyError(e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Stack gap="xl">
      <Title order={2}>Кабинет владельца</Title>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="sm">
          Профиль
        </Title>
        {loading || !owner ? (
          <Text c="dimmed">Загрузка…</Text>
        ) : (
          <Stack gap={4}>
            <Text>
              <strong>Имя:</strong> {owner.displayName}
            </Text>
            <Text>
              <strong>Email:</strong> {owner.email}
            </Text>
            <Text size="sm" c="dimmed">
              id: {owner.id} · роль: {owner.role}
            </Text>
          </Stack>
        )}
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="sm">
          Типы встреч
        </Title>
        <Text size="sm" c="dimmed" mb="md">
          Просмотр и редактирование типа — по кнопке «Открыть».
        </Text>

        <Table striped highlightOnHover withTableBorder mb="lg">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>id</Table.Th>
              <Table.Th>Название</Table.Th>
              <Table.Th>Минуты</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {types.map((t) => (
              <Table.Tr key={t.id}>
                <Table.Td>{t.id}</Table.Td>
                <Table.Td>{t.name}</Table.Td>
                <Table.Td>{t.durationMinutes}</Table.Td>
                <Table.Td>
                  <Button component={Link} to={`/event-types/${encodeURIComponent(t.id)}`} size="xs" variant="light">
                    Открыть
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Title order={5} mb="sm">
          Новый тип
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput label="id (клиентский)" value={newId} onChange={(e) => setNewId(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput label="Название" value={newName} onChange={(e) => setNewName(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput
              label="Описание"
              value={newDescription}
              onChange={(e) => setNewDescription(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <NumberInput
              label="Длительность (мин)"
              min={1}
              value={newDuration}
              onChange={(v) => setNewDuration(typeof v === 'number' ? v : '')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Button mt={24} onClick={() => void handleCreateType()} loading={creating}>
              Создать тип
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="sm">
          Предстоящие бронирования
        </Title>
        <Group align="flex-end" mb="md">
          <DateTimePicker
            label="from (UTC на сервере — из локального времени)"
            value={bookingFrom}
            onChange={setBookingFrom}
            clearable
          />
          <DateTimePicker label="to (опционально)" value={bookingTo} onChange={setBookingTo} clearable />
          <Button onClick={() => void loadBookings()} loading={loadingBookings}>
            Обновить список
          </Button>
        </Group>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Начало (UTC)</Table.Th>
              <Table.Th>Гость</Table.Th>
              <Table.Th>Тип</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {bookings.map((b) => (
              <Table.Tr key={b.id}>
                <Table.Td>{b.start}</Table.Td>
                <Table.Td>
                  {b.guestName} ({b.guestEmail})
                </Table.Td>
                <Table.Td>
                  {b.eventType.name} ({b.eventType.durationMinutes} мин)
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  )
}
