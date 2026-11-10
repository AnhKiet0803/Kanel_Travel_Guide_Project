// Admin API: feedback/contact moderation (CN23), user accounts and backup (CN24).
// Assumptions about the backend (to be confirmed with Giáp). Admin role only; lists return { items, total }.
//   GET    /admin/feedbacks?page=&pageSize=&status=pending|approved   (omit status = all)
//          items: { feedbackId, fullName, email, rating, title, content, isApproved, createdAt }
//   PUT    /admin/feedbacks/{id}/approval   { isApproved }
//   DELETE /admin/feedbacks/{id}
//   GET    /admin/contacts?page=&pageSize=&status=pending|responded
//          items: { contactId, fullName, email, phone, subject, message, isResponded, createdAt }
//   PUT    /admin/contacts/{id}/responded   { isResponded }
//   DELETE /admin/contacts/{id}
//   GET    /admin/users?page=&pageSize=&search=
//          items: { userId, username, fullName, email, role, isActive, createdAt }
//   PUT    /admin/users/{id}/active         { isActive }
//   POST   /admin/backups                 -> { createdAt, message }  (runs a database backup, logged in SystemLogs as 'BACKUP')
//   GET    /admin/backups?page=&pageSize=
//          items: { logId, username, actionDescription, createdAt }  (backup history from SystemLogs)
import { request } from './http.js'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) query.set(key, value)
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) })

export const listFeedbacks = (params) => request(withQuery('/admin/feedbacks', params))
export const setFeedbackApproval = (id, isApproved) => put(`/admin/feedbacks/${id}/approval`, { isApproved })
export const deleteFeedback = (id) => request(`/admin/feedbacks/${id}`, { method: 'DELETE' })

export const listContacts = (params) => request(withQuery('/admin/contacts', params))
export const setContactResponded = (id, isResponded) => put(`/admin/contacts/${id}/responded`, { isResponded })
export const deleteContact = (id) => request(`/admin/contacts/${id}`, { method: 'DELETE' })

export const runBackup = () => request('/admin/backups', { method: 'POST' })
export const listBackups = (params) => request(withQuery('/admin/backups', params))

export const listUsers = (params) => request(withQuery('/admin/users', params))
export const setUserActive = (id, isActive) => put(`/admin/users/${id}/active`, { isActive })
