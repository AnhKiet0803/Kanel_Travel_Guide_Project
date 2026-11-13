// API client for Transport Routes, Vehicles, and Schedules
// Corresponds to RoutesController, VehiclesController, SchedulesController in BE (CN05, CN20)
import { request } from './http.js'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) query.set(key, value)
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

// Routes
export const getRoutes = (params) => request(withQuery('/routes', params))
export const getRouteById = (id) => request(`/routes/${id}`)
export const createRoute = (data) =>
  request('/routes', { method: 'POST', body: JSON.stringify(data) })
export const updateRoute = (id, data) =>
  request(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteRoute = (id) =>
  request(`/routes/${id}`, { method: 'DELETE' })

// Vehicles
export const getVehicles = () => request('/vehicles')
export const getVehicleById = (id) => request(`/vehicles/${id}`)
export const createVehicle = (data) =>
  request('/vehicles', { method: 'POST', body: JSON.stringify(data) })
export const updateVehicle = (id, data) =>
  request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteVehicle = (id) =>
  request(`/vehicles/${id}`, { method: 'DELETE' })

// Schedules
export const getSchedules = (params) => request(withQuery('/schedules', params))
export const getScheduleById = (id) => request(`/schedules/${id}`)
export const createSchedule = (data) =>
  request('/schedules', { method: 'POST', body: JSON.stringify(data) })
export const updateSchedule = (id, data) =>
  request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteSchedule = (id) =>
  request(`/schedules/${id}`, { method: 'DELETE' })
