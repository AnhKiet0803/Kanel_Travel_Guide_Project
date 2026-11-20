import { useState } from 'react'
import { createUser, deleteUser, listUsers, setUserActive, updateUser } from '../../api/adminApi.js'
import Pagination from '../../components/Pagination.jsx'
import { useAuth } from '../../auth/useAuth.js'
import { usePagedList } from '../../hooks/usePagedList.js'
import '../../components/admin.css'

const PAGE_SIZE = 10
const emptyAccount = {
  username: '', fullName: '', email: '', phone: '', address: '',
  role: 'User', isActive: true, password: '',
}
const fields = [
  { name: 'username', label: 'Username', required: true, pattern: '[A-Za-z0-9_.]{3,50}', maxLength: 50 },
  { name: 'fullName', label: 'Full name', required: true, maxLength: 100 },
  { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 100 },
  { name: 'phone', label: 'Phone', type: 'tel', maxLength: 20 },
  { name: 'address', label: 'Address', maxLength: 255 },
]

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const list = usePagedList(listUsers, { page, pageSize: PAGE_SIZE, search })
  const editingSelf = form?.userId != null && form.userId === currentUser?.userId

  function handleSearch(event) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function openForm(account) {
    setError('')
    setNotice('')
    setForm({ ...emptyAccount, ...account, password: '' })
  }

  async function runAction(action, message, afterSuccess) {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      afterSuccess?.()
      setNotice(message)
      list.reload()
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setBusy(false)
    }
  }

  function saveAccount(event) {
    event.preventDefault()
    const { userId, createdAt, ...account } = form
    const payload = {
      ...account,
      username: account.username.trim(), fullName: account.fullName.trim(), email: account.email.trim(),
      phone: account.phone?.trim() || null, address: account.address?.trim() || null,
      password: account.password || null,
    }

    return runAction(
      () => userId ? updateUser(userId, payload) : createUser(payload),
      userId ? 'Account updated.' : 'Account created.',
      () => {
        setForm(null)
        if (!userId) {
          setSearchInput('')
          setSearch('')
          setPage(1)
        }
      },
    )
  }

  function toggleActive(item) {
    const action = item.isActive ? 'lock' : 'unlock'
    if (!window.confirm(`Are you sure you want to ${action} "${item.username}"?`)) return
    return runAction(() => setUserActive(item.userId, !item.isActive), item.isActive ? 'Account locked.' : 'Account unlocked.')
  }

  function removeAccount(item) {
    if (!window.confirm(`Permanently delete the account "${item.username}"?`)) return
    return runAction(() => deleteUser(item.userId), 'Account deleted.', () => {
      if (list.items.length === 1 && page > 1) setPage(page - 1)
    })
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="mb-0">Account Management</h1>
        <button type="button" className="ktg-button" disabled={busy || Boolean(form)} onClick={() => openForm()}>
          Add account
        </button>
      </div>

      <form className="ktg-toolbar" onSubmit={handleSearch} role="search">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by username, full name, email"
          aria-label="Search accounts"
        />
        <button type="submit" className="ktg-button ktg-button-small">Search</button>
      </form>

      {notice && <p className="ktg-notice" role="status">{notice}</p>}
      {!form && error && <p className="ktg-notice ktg-error-box" role="alert">{error}</p>}

      {form && (
        <form className="card p-3 mb-4" onSubmit={saveAccount} aria-label={form.userId ? 'Edit account' : 'New account'}>
          <h2 className="h5">{form.userId ? 'Edit account' : 'New account'}</h2>
          <fieldset disabled={busy} className="row g-3">
            {fields.map(({ name, label, ...props }) => (
              <label className="col-md-6" key={name}>
                <span className="form-label">{label}</span>
                <input
                  {...props}
                  className="form-control"
                  value={form[name] ?? ''}
                  onChange={(event) => setForm({ ...form, [name]: event.target.value })}
                />
              </label>
            ))}
            <label className="col-md-6">
              <span className="form-label">{form.userId ? 'New password (optional)' : 'Password'}</span>
              <input
                className="form-control"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required={!form.userId}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              <small className="text-muted">Use at least 8 characters, including letters and digits.</small>
            </label>
            <label className="col-md-6">
              <span className="form-label">Role</span>
              <select
                className="form-select"
                value={form.role}
                disabled={editingSelf}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <label className="col-12">
              <input
                className="form-check-input me-2"
                type="checkbox"
                checked={form.isActive}
                disabled={editingSelf}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              />
              Active
            </label>
          </fieldset>
          {error && <p className="ktg-error-box mt-3" role="alert">{error}</p>}
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="ktg-button ktg-button-small" disabled={busy}>
              {busy ? 'Saving…' : 'Save account'}
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={() => { setForm(null); setError('') }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {list.loading && <p>Loading…</p>}
      {list.error && <p className="ktg-error" role="alert">{list.error}</p>}
      {!list.loading && !list.error && list.items.length === 0 && <p>No accounts found.</p>}
      {list.items.length > 0 && (
        <div className="ktg-table-wrap">
          <table className="ktg-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((item) => {
                const isSelf = item.userId === currentUser?.userId
                const disabled = busy || Boolean(form) || list.loading
                return (
                  <tr key={item.userId}>
                    <td>{item.username}</td>
                    <td>{item.fullName}</td>
                    <td>{item.email}</td>
                    <td>{item.role}</td>
                    <td>
                      <span className={item.isActive ? 'ktg-badge ktg-badge-ok' : 'ktg-badge'}>
                        {item.isActive ? 'Active' : 'Locked'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-sm btn-outline-primary" disabled={disabled} onClick={() => openForm(item)}>Edit</button>
                        <button type="button" className="btn btn-sm btn-outline-secondary text-nowrap" disabled={disabled || isSelf} onClick={() => toggleActive(item)}>
                          {item.isActive ? 'Lock' : 'Unlock'}
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger" disabled={disabled || isSelf} onClick={() => removeAccount(item)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} onChange={setPage} />
    </div>
  )
}
