import type { components } from './schema'
import { requestJson } from './client'

export type EventType = components['schemas']['EventType']
export type Profile = components['schemas']['Profile']
export type Booking = components['schemas']['Booking']
export type BookingListItem = components['schemas']['BookingListItem']
export type AvailabilityResponse = components['schemas']['AvailabilityResponse']
export type CreateBookingRequest = components['schemas']['CreateBookingRequest']
export type CreateEventTypeRequest = components['schemas']['CreateEventTypeRequest']
export type ReplaceEventTypeRequest = components['schemas']['ReplaceEventTypeRequest']

/** getAvailability */
export function getAvailability(params: {
  eventTypeId: string
  from: string
  to: string
  slotStepMinutes?: number
}): Promise<AvailabilityResponse> {
  const qs = new URLSearchParams()
  qs.set('eventTypeId', params.eventTypeId)
  qs.set('from', params.from)
  qs.set('to', params.to)
  if (params.slotStepMinutes != null) {
    qs.set('slotStepMinutes', String(params.slotStepMinutes))
  }
  return requestJson<AvailabilityResponse>(`/api/availability?${qs.toString()}`)
}

/** listBookings */
export function listBookings(params?: { from?: string; to?: string }): Promise<BookingListItem[]> {
  const qs = new URLSearchParams()
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  const q = qs.toString()
  return requestJson<BookingListItem[]>(q ? `/api/bookings?${q}` : '/api/bookings')
}

/** createBooking */
export function createBooking(body: CreateBookingRequest): Promise<Booking> {
  return requestJson<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(body) })
}

/** listEventTypes */
export function listEventTypes(): Promise<EventType[]> {
  return requestJson<EventType[]>('/api/event-types')
}

/** createEventType */
export function createEventType(body: CreateEventTypeRequest): Promise<EventType> {
  return requestJson<EventType>('/api/event-types', { method: 'POST', body: JSON.stringify(body) })
}

/** getEventType */
export function getEventType(id: string): Promise<EventType> {
  return requestJson<EventType>(`/api/event-types/${encodeURIComponent(id)}`)
}

/** replaceEventType */
export function replaceEventType(id: string, body: ReplaceEventTypeRequest): Promise<EventType> {
  return requestJson<EventType>(`/api/event-types/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/** deleteEventType */
export function deleteEventType(id: string): Promise<void> {
  return requestJson<void>(`/api/event-types/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** getOwner */
export function getOwner(): Promise<Profile> {
  return requestJson<Profile>('/api/owner')
}
