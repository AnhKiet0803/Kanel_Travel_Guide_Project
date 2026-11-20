import { API_BASE, request } from './http.js'

const toViewModel = (record) => {
  const fields = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key[0].toUpperCase() + key.slice(1), value])
  )
  if (fields.ThumbnailUrl?.startsWith('/api/tourist-spots/')) {
    fields.ThumbnailUrl = API_BASE + fields.ThumbnailUrl.slice('/api'.length)
  }
  return fields
}

const send = (path, method, data) => request(path, { method, body: JSON.stringify(data) })

export async function listSpots({ locationId } = {}) {
  const query = locationId == null ? '' : '?locationId=' + encodeURIComponent(locationId)
  return (await request('/tourist-spots' + query)).map(toViewModel)
}
export const getSpot = async (id) => toViewModel(await request(`/tourist-spots/${encodeURIComponent(id)}`))
export const getLocation = async (id) => toViewModel(await request(`/locations/${encodeURIComponent(id)}`))
export const listLocations = async () => (await request('/locations')).map(toViewModel)
export const listCategories = async () => (await request('/category-types')).map(toViewModel)
export const createLocation = async (data) => toViewModel(await send('/locations', 'POST', data))
export const createCategory = async (data) => toViewModel(await send('/category-types', 'POST', data))
export const saveSpotRecord = (data, id) => id === undefined
  ? send('/tourist-spots', 'POST', data)
  : send(`/tourist-spots/${encodeURIComponent(id)}`, 'PUT', data)
export const deleteSpot = (id) => request(`/tourist-spots/${encodeURIComponent(id)}`, { method: 'DELETE' })
