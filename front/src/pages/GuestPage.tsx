import {
  Button,
  Grid,
  Group,
  NumberInput,
  Paper,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { addDays, startOfDay } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import type { DatesRangeValue } from '@mantine/dates'
import {
  createBooking,
  getAvailability,
  listEventTypes,
  type AvailabilityResponse,
  type EventType,
} from '../api/calendarApi'
import { notifyError } from '../notifyError'

function rangeToUtcHalfOpen(range: DatesRangeValue<string>) {
  const [a, b] = range
  if (!a || !b) return null
  const start = new Date(a)
  const end = new Date(b)
  return {
    from: startOfDay(start).toISOString(),
    to: startOfDay(addDays(end, 1)).toISOString(),
  }
}

export function GuestPage() {
  const [types, setTypes] = useState<EventType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [eventTypeId, setEventTypeId] = useState<string | null>(null)
  const [range, setRange] = useState<DatesRangeValue<string>>([null, null])
  const [slotStep, setSlotStep] = useState<number | ''>('')
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedStart, setSelectedStart] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void (async () => {
      setLoadingTypes(true)
      try {
        const data = await listEventTypes()
        setTypes(data)
        if (data.length) {
          setEventTypeId((prev) => prev ?? data[0].id)
        }
      } catch (e) {
        notifyError(e)
      } finally {
        setLoadingTypes(false)
      }
    })()
  }, [])

  const typeOptions = useMemo(
    () => types.map((t) => ({ value: t.id, label: `${t.name} (${t.durationMinutes} мин)` })),
    [types],
  )

  const utcRange = rangeToUtcHalfOpen(range)

  const handleLoadSlots = async () => {
    if (!eventTypeId || !utcRange) {
      notifications.show({ message: 'Выберите тип встречи и диапазон дат', color: 'yellow' })
      return
    }
    setLoadingSlots(true)
    setAvailability(null)
    setSelectedStart(null)
    try {
      const res = await getAvailability({
        eventTypeId,
        from: utcRange.from,
        to: utcRange.to,
        slotStepMinutes: slotStep === '' ? undefined : Number(slotStep),
      })
      setAvailability(res)
    } catch (e) {
      notifyError(e)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleBook = async () => {
    if (!eventTypeId || !selectedStart || !guestName.trim() || !guestEmail.trim()) {
      notifications.show({ message: 'Заполните имя, email и выберите слот', color: 'yellow' })
      return
    }
    setSubmitting(true)
    try {
      await createBooking({
        eventTypeId,
        start: selectedStart,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
      })
      notifications.show({ title: 'Готово', message: 'Бронирование создано', color: 'green' })
      setGuestName('')
      setGuestEmail('')
      setSelectedStart(null)
      void handleLoadSlots()
    } catch (e) {
      notifyError(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Новое бронирование</Title>
      <Text size="sm" c="dimmed">
        Время в API передаётся в UTC; здесь вы выбираете даты в локальной зоне, границы переводятся в
        ISO UTC автоматически.
      </Text>

      <Paper withBorder p="md" radius="md">
        <Stack gap="md">
          <Select
            label="Тип встречи"
            placeholder={loadingTypes ? 'Загрузка…' : 'Выберите тип'}
            data={typeOptions}
            value={eventTypeId}
            onChange={setEventTypeId}
            disabled={loadingTypes}
            searchable
          />
          <DatePickerInput
            type="range"
            label="Период дат (включительно)"
            value={range}
            onChange={setRange}
            data-testid="guest-date-range"
          />
          <NumberInput
            label="Шаг сетки (мин), опционально"
            description="Если не задан — значение по умолчанию на сервере"
            min={1}
            value={slotStep}
            onChange={(v) => setSlotStep(typeof v === 'number' ? v : '')}
          />
          <Button onClick={() => void handleLoadSlots()} loading={loadingSlots}>
            Показать свободные слоты
          </Button>
        </Stack>
      </Paper>

      {availability && (
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Text size="sm">
              Шаг сетки в ответе: <strong>{availability.slotStepMinutes}</strong> мин
            </Text>
            <Text fw={600}>Доступные начала слотов (UTC, ISO)</Text>
            {availability.availableStarts.length === 0 ? (
              <Text c="dimmed">Нет свободных слотов в выбранном диапазоне.</Text>
            ) : (
              <Radio.Group value={selectedStart} onChange={setSelectedStart}>
                <Grid>
                  {availability.availableStarts.map((s) => (
                    <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={s}>
                      <Radio value={s} label={s} />
                    </Grid.Col>
                  ))}
                </Grid>
              </Radio.Group>
            )}
          </Stack>
        </Paper>
      )}

      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="sm">
          Данные гостя
        </Title>
        <Stack gap="md">
          <TextInput label="Имя" value={guestName} onChange={(e) => setGuestName(e.currentTarget.value)} />
          <TextInput
            label="Email"
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.currentTarget.value)}
          />
          <Group>
            <Button onClick={() => void handleBook()} loading={submitting} disabled={!selectedStart}>
              Забронировать
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  )
}
