// API client for Basic & Advanced Search
// Corresponds to SearchController in BE (CN10, CN11)
import { request } from './http.js'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) query.set(key, value)
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

export const basicSearch = (q) => request(withQuery('/search', { q }))

export const advancedSearch = (params) => request(withQuery('/search/advanced', params))
