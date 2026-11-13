// API client for Accommodation & Dining (Hotels, Restaurants, Resorts)
// Corresponds to ServicesController in BE (CN06, CN07, CN08, CN19)
import { request } from './http.js'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) query.set(key, value)
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

// Public APIs
export const getServices = (params) => request(withQuery('/services', params))
export const getServiceById = (id) => request(`/services/${id}`)
export const getLocations = () => request('/locations')

// Admin APIs (CN19)
export const createService = (data) =>
  request('/services', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateService = (id, data) =>
  request(`/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const deleteService = (id) =>
  request(`/services/${id}`, {
    method: 'DELETE',
  })

// Service Items (Rooms / Tables)
export const createServiceItem = (providerId, data) =>
  request(`/services/${providerId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const updateServiceItem = (providerId, itemId, data) =>
  request(`/services/${providerId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

export const deleteServiceItem = (providerId, itemId) =>
  request(`/services/${providerId}/items/${itemId}`, {
    method: 'DELETE',
  })
