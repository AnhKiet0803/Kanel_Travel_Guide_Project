// CN22: Admin Bookings and Order Management
import { useEffect, useState } from 'react'
import { adminListBookings, adminUpdateBookingStatus, getBookingById } from '../../api/bookingApi.js'
import '../../components/admin.css'

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  // View / Edit Modal
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newBookingStatus, setNewBookingStatus] = useState('Pending')
  const [newPaymentStatus, setNewPaymentStatus] = useState('Unpaid')

  useEffect(() => {
    loadBookings()
  }, [statusFilter, paymentFilter])

  async function loadBookings() {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (statusFilter) params.bookingStatus = statusFilter
      if (paymentFilter) params.paymentStatus = paymentFilter
      if (searchKeyword.trim()) params.q = searchKeyword.trim()

      const data = await adminListBookings(params)
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    loadBookings()
  }

  async function handleOpenDetail(id) {
    setLoadingDetail(true)
    try {
      const data = await getBookingById(id)
      setSelectedBooking(data)
      setNewBookingStatus(data.bookingStatus)
      setNewPaymentStatus(data.paymentStatus)
    } catch (err) {
      alert(err.message || 'Cannot fetch booking details.')
    } finally {
      setLoadingDetail(false)
    }
  }

  async function handleSaveStatus(e) {
    e.preventDefault()
    if (!selectedBooking) return
    setUpdatingStatus(true)
    try {
      await adminUpdateBookingStatus(selectedBooking.bookingId, {
        bookingStatus: newBookingStatus,
        paymentStatus: newPaymentStatus,
      })
      alert('Booking status updated successfully.')
      setSelectedBooking(null)
      loadBookings()
    } catch (err) {
      alert(err.message || 'Failed to update booking status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  function formatPrice(num) {
    if (num == null) return '0 VND'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  function getStatusBadge(status) {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-success'
      case 'completed':
        return 'bg-primary'
      case 'cancelled':
        return 'bg-danger'
      default:
        return 'bg-warning text-dark'
    }
  }

  return (
    <div className="ktg-admin-page">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Bookings & Orders Management (CN22)</h2>
        <p className="text-muted mb-0">Track reservations, update payment status, and process cancellations</p>
      </div>

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 p-3 mb-4 bg-light">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label small fw-semibold text-secondary">Search Customer / Code</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. BK20261113-001 or Tien..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold text-secondary">Booking Status</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold text-secondary">Payment Status</label>
            <select
              className="form-select form-select-sm"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="">All Payments</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div className="col-md-2 d-grid">
            <button type="submit" className="btn btn-sm btn-primary">
              <i className="bi bi-search me-1"></i> Search
            </button>
          </div>
        </form>
      </div>

      {loading && <p className="text-muted">Loading bookings...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className="alert alert-light border text-center py-4">No bookings found.</div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Booking Code</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Travel Date</th>
                  <th>Guests</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.bookingId}>
                    <td>
                      <strong className="text-primary">{b.bookingCode}</strong>
                      <span className="d-block small text-muted">
                        {new Date(b.bookingDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <strong>{b.customerName}</strong>
                      <span className="d-block small text-muted">{b.customerPhone}</span>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{b.bookingType}</span>
                    </td>
                    <td>{b.startDate}</td>
                    <td>{b.totalPassengers}</td>
                    <td className="fw-bold">{formatPrice(b.totalAmount)}</td>
                    <td>
                      <span
                        className={`badge ${
                          b.paymentStatus === 'Paid' ? 'bg-success' : 'bg-light text-dark border'
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(b.bookingStatus)}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleOpenDetail(b.bookingId)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail / Status Modal */}
      {selectedBooking && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <form onSubmit={handleSaveStatus}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    Booking Management: {selectedBooking.bookingCode}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setSelectedBooking(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Customer:</span>
                      <strong>{selectedBooking.customerName}</strong>
                      <span className="d-block small">{selectedBooking.customerPhone}</span>
                      <span className="d-block small text-muted">{selectedBooking.customerEmail}</span>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Booking Information:</span>
                      <span>Type: <strong>{selectedBooking.bookingType}</strong></span>
                      <span className="d-block">Travel / Check-in: <strong>{selectedBooking.startDate}</strong></span>
                      <span className="d-block">Passengers / Units: <strong>{selectedBooking.totalPassengers}</strong></span>
                    </div>
                  </div>

                  {selectedBooking.notes && (
                    <div className="alert alert-light border small mb-3">
                      <strong>Customer Notes / Cancel Reason:</strong> {selectedBooking.notes}
                    </div>
                  )}

                  <h6 className="fw-bold mb-2">Order Line Items</h6>
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBooking.details?.map((d) => (
                        <tr key={d.detailId}>
                          <td>
                            {d.tourId && `Tour #${d.tourId}`}
                            {d.scheduleId && `Schedule #${d.scheduleId}`}
                            {d.serviceItemId && `Service Item #${d.serviceItemId}`}
                          </td>
                          <td>{d.quantity}</td>
                          <td>{formatPrice(d.unitPrice)}</td>
                          <td className="text-end">{formatPrice(d.quantity * d.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="text-end mb-4">
                    <span className="text-muted small me-2">Grand Total:</span>
                    <strong className="h5 text-primary">{formatPrice(selectedBooking.totalAmount)}</strong>
                  </div>

                  {/* Status Edit Controls */}
                  <div className="card bg-light border-0 p-3">
                    <h6 className="fw-bold mb-3">Update Order Status</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Booking Status</label>
                        <select
                          className="form-select"
                          value={newBookingStatus}
                          onChange={(e) => setNewBookingStatus(e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Payment Status</label>
                        <select
                          className="form-select"
                          value={newPaymentStatus}
                          onChange={(e) => setNewPaymentStatus(e.target.value)}
                        >
                          <option value="Unpaid">Unpaid</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Close
                  </button>
                  <button type="submit" disabled={updatingStatus} className="btn btn-primary">
                    {updatingStatus ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
