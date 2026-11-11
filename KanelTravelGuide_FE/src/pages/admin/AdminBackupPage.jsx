// CN24: Data backup. The Admin clicks "Backup now" so the BE backs up the database;
// the result is written to SystemLogs and shown in the history table below (PDF section 7: record the backup result).
import { useState } from 'react'
import { listBackups, runBackup } from '../../api/adminApi.js'
import Pagination from '../../components/Pagination.jsx'
import { usePagedList } from '../../hooks/usePagedList.js'
import '../../components/admin.css'

const PAGE_SIZE = 10

export default function AdminBackupPage() {
  const [page, setPage] = useState(1)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null) // { type: 'success' | 'error', text }
  const list = usePagedList(listBackups, { page, pageSize: PAGE_SIZE })

  async function handleBackup() {
    if (!window.confirm('Start a database backup now?')) return
    setRunning(true)
    setResult(null)
    try {
      const done = await runBackup()
      setResult({ type: 'success', text: done?.message ?? 'Backup completed successfully.' })
      setPage(1)
      list.reload()
    } catch (error) {
      setResult({ type: 'error', text: error.message })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <h1>Data Backup</h1>
      <p>Regular database backups protect your data in case of an incident. Back up before making major changes.</p>

      <div className="ktg-toolbar">
        <button type="button" className="ktg-button ktg-button-primary" onClick={handleBackup} disabled={running}>
          {running ? 'Backing up...' : 'Backup now'}
        </button>
      </div>

      {result && (
        <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
          {result.text}
        </p>
      )}

      <h2>Backup History</h2>
      {list.loading && <p>Loading...</p>}
      {list.error && <p className="ktg-error">{list.error}</p>}
      {!list.loading && !list.error && list.items.length === 0 && <p>No backups yet.</p>}

      {list.items.length > 0 && (
        <div className="ktg-table-wrap">
          <table className="ktg-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Performed by</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((item) => (
                <tr key={item.logId}>
                  <td>{new Date(item.createdAt).toLocaleString('en-GB')}</td>
                  <td>{item.username ?? '—'}</td>
                  <td>{item.actionDescription}</td>
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
