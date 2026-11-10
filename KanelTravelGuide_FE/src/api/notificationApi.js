// In-site notifications for signed-in users (CN16, Notifications table).
// Assumptions about the backend (to be confirmed with Giáp):
//   GET /notifications?page=&pageSize=&type=BOOKING|PROMOTION|SYSTEM   (omit type = all)
//       -> { items: [{ notificationId, title, message, notificationType, referenceId, isRead, createdAt }],
//            total, unreadCount }
//   PUT /notifications/{id}/read
//   PUT /notifications/read-all
import { request } from './http.js'

function withQuery(path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) query.set(key, value)
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

export const listNotifications = (params) => request(withQuery('/notifications', params))
export const markNotificationRead = (id) => request(`/notifications/${id}/read`, { method: 'PUT' })
export const markAllNotificationsRead = () => request('/notifications/read-all', { method: 'PUT' })
