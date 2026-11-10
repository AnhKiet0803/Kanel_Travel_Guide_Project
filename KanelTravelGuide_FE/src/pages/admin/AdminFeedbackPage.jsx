// CN23: Customer feedback (Feedbacks) and contact request (Contacts) management for Admin.
// - Feedback: approve to show publicly (is_approved) / hide / delete.
// - Contact: mark as responded to the customer (is_responded) / delete.
// Place inside <AdminLayout> and <RequireAdmin>.
import { useState } from 'react'
import {
  deleteContact,
  deleteFeedback,
  listContacts,
  listFeedbacks,
  setContactResponded,
  setFeedbackApproval,
} from '../../api/adminApi.js'
import Pagination from '../../components/Pagination.jsx'
import { usePagedList } from '../../hooks/usePagedList.js'
import '../../components/admin.css'

const PAGE_SIZE = 10

function formatDate(value) {
  return value ? new Date(value).toLocaleString('en-GB') : ''
}

// Run one action (approve/hide/delete), show the error if any, then reload the list.
function useRowAction(reload) {
  const [error, setError] = useState('')
  async function run(action, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return
    setError('')
    try {
      await action()
      reload()
    } catch (failure) {
      setError(failure.message)
    }
  }
  return { error, run }
}

function ListState({ loading, error, empty }) {
  if (loading) return <p>Loading...</p>
  if (error) return <p className="ktg-error">{error}</p>
  if (empty) return <p>No data.</p>
  return null
}

function FeedbackPanel() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const list = usePagedList(listFeedbacks, { page, pageSize: PAGE_SIZE, status })
  const { error: actionError, run } = useRowAction(list.reload)

  return (
    <>
      <div className="ktg-toolbar">
        <label>
          Status{' '}
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All</option>
            <option value="pending">Pending approval</option>
            <option value="approved">Approved</option>
          </select>
        </label>
      </div>

      {actionError && <p className="ktg-notice ktg-error-box" role="alert">{actionError}</p>}
      <ListState loading={list.loading} error={list.error} empty={!list.loading && !list.error && list.items.length === 0} />

      {list.items.length > 0 && (
        <div className="ktg-table-wrap">
          <table className="ktg-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Rating</th>
                <th>Content</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((item) => (
                <tr key={item.feedbackId}>
                  <td>
                    {item.fullName}
                    <br />
                    <small>{item.email}</small>
                  </td>
                  <td>{item.rating ? `${item.rating} ★` : '—'}</td>
                  <td>
                    {item.title && <strong>{item.title}</strong>}
                    <p>{item.content}</p>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <span className={item.isApproved ? 'ktg-badge ktg-badge-ok' : 'ktg-badge'}>
                      {item.isApproved ? 'Approved' : 'Pending approval'}
                    </span>
                  </td>
                  <td>
                    <div className="ktg-actions">
                      <button
                        type="button"
                        className="ktg-button ktg-button-small"
                        onClick={() => run(() => setFeedbackApproval(item.feedbackId, !item.isApproved))}
                      >
                        {item.isApproved ? 'Hide' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="ktg-button ktg-button-secondary ktg-button-small"
                        onClick={() => run(() => deleteFeedback(item.feedbackId), 'Delete this feedback?')}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} onChange={setPage} />
    </>
  )
}

function ContactPanel() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const list = usePagedList(listContacts, { page, pageSize: PAGE_SIZE, status })
  const { error: actionError, run } = useRowAction(list.reload)

  return (
    <>
      <div className="ktg-toolbar">
        <label>
          Status{' '}
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">All</option>
            <option value="pending">Not handled</option>
            <option value="responded">Responded</option>
          </select>
        </label>
      </div>

      {actionError && <p className="ktg-notice ktg-error-box" role="alert">{actionError}</p>}
      <ListState loading={list.loading} error={list.error} empty={!list.loading && !list.error && list.items.length === 0} />

      {list.items.length > 0 && (
        <div className="ktg-table-wrap">
          <table className="ktg-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Content</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((item) => (
                <tr key={item.contactId}>
                  <td>{item.fullName}</td>
                  <td>
                    {item.email}
                    {item.phone && (
                      <>
                        <br />
                        <small>{item.phone}</small>
                      </>
                    )}
                  </td>
                  <td>
                    {item.subject && <strong>{item.subject}</strong>}
                    <p>{item.message}</p>
                  </td>
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <span className={item.isResponded ? 'ktg-badge ktg-badge-ok' : 'ktg-badge'}>
                      {item.isResponded ? 'Responded' : 'Not handled'}
                    </span>
                  </td>
                  <td>
                    <div className="ktg-actions">
                      <button
                        type="button"
                        className="ktg-button ktg-button-small"
                        onClick={() => run(() => setContactResponded(item.contactId, !item.isResponded))}
                      >
                        {item.isResponded ? 'Unmark' : 'Responded'}
                      </button>
                      <button
                        type="button"
                        className="ktg-button ktg-button-secondary ktg-button-small"
                        onClick={() => run(() => deleteContact(item.contactId), 'Delete this contact request?')}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} onChange={setPage} />
    </>
  )
}

export default function AdminFeedbackPage() {
  const [tab, setTab] = useState('feedbacks')

  return (
    <div>
      <h1>Feedback & Contact</h1>
      <div className="ktg-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'feedbacks'}
          className={tab === 'feedbacks' ? 'ktg-tab active' : 'ktg-tab'}
          onClick={() => setTab('feedbacks')}
        >
          Customer feedback
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'contacts'}
          className={tab === 'contacts' ? 'ktg-tab active' : 'ktg-tab'}
          onClick={() => setTab('contacts')}
        >
          Contact requests
        </button>
      </div>
      {tab === 'feedbacks' ? <FeedbackPanel /> : <ContactPanel />}
    </div>
  )
}
