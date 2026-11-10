// User account management (Admin): search, lock / unlock accounts (Users.is_active).
// An Admin cannot lock their own account.
import { useState } from 'react'
import { listUsers, setUserActive } from '../../api/adminApi.js'
import Pagination from '../../components/Pagination.jsx'
import { useAuth } from '../../auth/useAuth.js'
import { usePagedList } from '../../hooks/usePagedList.js'
import '../../components/admin.css'

const PAGE_SIZE = 10

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState('')
  const list = usePagedList(listUsers, { page, pageSize: PAGE_SIZE, search })

  function handleSearch(event) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  async function toggleActive(target) {
    const action = target.isActive ? 'lock' : 'unlock'
    if (!window.confirm(`Are you sure you want to ${action} the account "${target.username}"?`)) return
    setActionError('')
    try {
      await setUserActive(target.userId, !target.isActive)
      list.reload()
    } catch (error) {
      setActionError(error.message)
    }
  }

  return (
    <div>
      <h1>Account Management</h1>

      <form className="ktg-toolbar" onSubmit={handleSearch} role="search">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by username, full name, email"
          aria-label="Search accounts"
        />
        <button type="submit" className="ktg-button ktg-button-small">
          Search
        </button>
      </form>

      {actionError && <p className="ktg-notice ktg-error-box" role="alert">{actionError}</p>}
      {list.loading && <p>Loading...</p>}
      {list.error && <p className="ktg-error">{list.error}</p>}
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
              {list.items.map((item) => (
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
                    <button
                      type="button"
                      className="ktg-button ktg-button-small"
                      disabled={item.userId === currentUser?.userId}
                      title={item.userId === currentUser?.userId ? 'You cannot lock your own account' : undefined}
                      onClick={() => toggleActive(item)}
                    >
                      {item.isActive ? 'Lock' : 'Unlock'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} onChange={setPage} />
    </div>
  )
}
