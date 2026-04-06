import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { EventTypeDetailPage } from './pages/EventTypeDetailPage'
import { GuestPage } from './pages/GuestPage'
import { OwnerPage } from './pages/OwnerPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<GuestPage />} />
        <Route path="owner" element={<OwnerPage />} />
        <Route path="event-types/:id" element={<EventTypeDetailPage />} />
      </Route>
    </Routes>
  )
}
