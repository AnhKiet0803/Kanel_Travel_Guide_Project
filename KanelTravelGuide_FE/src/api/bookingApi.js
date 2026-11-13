// API client for Bookings & Orders
// Corresponds to BookingsController in BE (CN13, CN22)
import { request } from './http.js'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) query.set(key, value)
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

// Customer / Public APIs
export const createBooking = (data) =>
  request('/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const getMyBookings = () => request('/bookings')

export const getBookingById = (id) => request(`/bookings/${id}`)

export const cancelBooking = (id, reason) =>
  request(`/bookings/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify({ reason: reason || 'Cancelled by user' }),
  })

// Admin APIs (CN22)
export const adminListBookings = (params) => request(withQuery('/bookings/manage', params))

export const adminUpdateBookingStatus = (id, data) =>
  request(`/bookings/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
