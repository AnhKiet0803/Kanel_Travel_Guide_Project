// Shared API request helper.
// The API address comes from the VITE_API_URL env variable (.env.local); default is the local backend.
// Authenticated requests include the JWT issued by /auth/login.

export const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5011/api').replace(/\/$/, '')

const TOKEN_KEY = 'kanel-access-token'

export function setAccessToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token)
  else sessionStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status // 0 = could not reach the server
  }
}

export async function request(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token)

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Please try again later.', 0)
  }

  if (!response.ok) {
    let message = 'Something went wrong. Please try again.'
    try {
      const problem = await response.json()
      // ASP.NET returns { errors: { Field: ['...'] } } for invalid data,
      // or { title, detail } / { message } for other errors.
      const first = problem?.errors && Object.values(problem.errors).flat()[0]
      message = first ?? problem?.detail ?? problem?.message ?? message
    } catch {
      // no JSON body, keep the default message
    }
    throw new ApiError(message, response.status)
  }

  return response.status === 204 ? null : response.json()
}
