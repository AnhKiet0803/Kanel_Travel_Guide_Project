// Simple pagination: Previous / Page x of y / Next. page starts at 1.
import './admin.css'

export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null

  return (
    <nav className="ktg-pagination" aria-label="Pagination">
      <button type="button" className="ktg-button ktg-button-secondary ktg-button-small" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button type="button" className="ktg-button ktg-button-secondary ktg-button-small" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  )
}
