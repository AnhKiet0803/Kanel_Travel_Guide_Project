// Account API: register, sign in, sign out, current user (CN17 and User accounts).
// Assumptions about the backend (to be confirmed with Giáp):
//   POST /auth/register  { username, password, fullName, email, phone?, address? }
//   POST /auth/login     { username, password }  -> { userId, username, fullName, email, role }  (sets the cookie)
//   POST /auth/logout
//   GET  /auth/me        -> same shape as login; 401 if not signed in
import { ApiError, request } from './http.js'

export function register({ username, password, fullName, email, phone, address }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: username.trim(),
      password,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
    }),
  })
}

export async function login({ username, password }) {
  try {
    return await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim(), password }),
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new ApiError('Incorrect username or password.', 401)
    }
    throw error
  }
}

export function logout() {
  return request('/auth/logout', { method: 'POST' })
}

// Profile and password (assumptions, to be confirmed with Giáp):
//   GET  /auth/profile          -> { userId, username, fullName, email, phone, address }
//   PUT  /auth/profile          { fullName, phone, address }
//   POST /auth/change-password  { currentPassword, newPassword }
//   POST /auth/forgot-password  { email }               (backend emails a link containing a token)
//   POST /auth/reset-password   { token, newPassword }
export function getProfile() {
  return request('/auth/profile')
}

export function updateProfile({ fullName, phone, address }) {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({
      fullName: fullName.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
    }),
  })
}

export function changePassword({ currentPassword, newPassword }) {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export function forgotPassword({ email }) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  })
}

export function resetPassword({ token, newPassword }) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  })
}

/** Returns the signed-in user, or null if nobody is signed in. */
export async function getCurrentUser() {
  try {
    return await request('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}
