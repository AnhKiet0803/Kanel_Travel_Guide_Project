// CN16: the user's notifications page (booking confirmations, promotions, system notices).
// Unread notifications are highlighted; click "Mark as read" or "Mark all as read".
// onOpen(item) (optional): used by the router to open the related screen, e.g. booking details via item.referenceId.
import { useState } from 'react'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notificationApi.js'
import Pagination from '../components/Pagination.jsx'
import { usePagedList } from '../hooks/usePagedList.js'
import '../components/admin.css'

const PAGE_SIZE = 10
const TYPE_LABELS = { BOOKING: 'Booking', PROMOTION: 'Promotion', SYSTEM: 'System' }

export default function NotificationsPage({ onOpen }) {
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [actionError, setActionError] = useState('')
  const list = usePagedList(listNotifications, { page, pageSize: PAGE_SIZE, type })
  const unreadCount = list.data?.unreadCount ?? 0

  async function run(action) {
    setActionError('')
    try {
      await action()
      list.reload()
    } catch (error) {
      setActionError(error.message)
    }
  }

  return (
    <section className="ktg-page">
      <header className="ktg-page-header">
        <span className="ktg-eyebrow">Inbox</span>
        <h1>Notifications</h1>
        <p>{unreadCount > 0 ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}.` : 'You are all caught up.'}</p>
      </header>

      <div className="ktg-toolbar">
        <label>
          Type{' '}
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="ktg-button ktg-button-small"
          disabled={unreadCount === 0}
          onClick={() => run(markAllNotificationsRead)}
        >
          Mark all as read
        </button>
      </div>

      {actionError && <p className="ktg-notice ktg-error-box" role="alert">{actionError}</p>}
      {list.loading && <p>Loading...</p>}
      {list.error && <p className="ktg-error">{list.error}</p>}
      {!list.loading && !list.error && list.items.length === 0 && <p>No notifications yet.</p>}

      <ul className="ktg-notify-list">
        {list.items.map((item) => (
          <li key={item.notificationId} className={item.isRead ? 'ktg-notify' : 'ktg-notify unread'}>
            <div className="ktg-notify-head">
              <span className="ktg-badge">{TYPE_LABELS[item.notificationType] ?? item.notificationType}</span>
              <strong>{item.title}</strong>
              <small>{new Date(item.createdAt).toLocaleString('en-GB')}</small>
            </div>
            <p>{item.message}</p>
            <div className="ktg-actions">
              {!item.isRead && (
                <button
                  type="button"
                  className="ktg-button ktg-button-secondary ktg-button-small"
                  onClick={() => run(() => markNotificationRead(item.notificationId))}
                >
                  Mark as read
                </button>
              )}
              {onOpen && item.referenceId && (
                <button type="button" className="ktg-button ktg-button-small" onClick={() => onOpen(item)}>
                  View details
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} onChange={setPage} />
    </section>
  )
}
