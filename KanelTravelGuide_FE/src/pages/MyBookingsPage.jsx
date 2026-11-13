// User booking history and cancellation page (CN13, CN22)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { getMyBookings, getBookingById, cancelBooking } from '../api/bookingApi.js'
import './pages.css'

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal detail & cancel
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelTargetId, setCancelTargetId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyBookings()
      setBookings(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load your bookings.')
    } finally {
      setLoading(false)
    }
  }

  async function handleViewDetail(id) {
    setLoadingDetail(true)
    try {
      const data = await getBookingById(id)
      setSelectedBooking(data)
    } catch (err) {
      alert(err.message || 'Cannot load booking details.')
    } finally {
      setLoadingDetail(false)
    }
  }

  function openCancelDialog(id) {
    setCancelTargetId(id)
    setCancelReason('')
    setShowCancelModal(true)
  }

  async function handleConfirmCancel() {
    if (!cancelTargetId) return
    setCancelling(true)
    try {
      await cancelBooking(cancelTargetId, cancelReason)
      setShowCancelModal(false)
      loadBookings()
      if (selectedBooking && selectedBooking.bookingId === cancelTargetId) {
        setSelectedBooking(null)
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.')
    } finally {
      setCancelling(false)
    }
  }

  function formatPrice(num) {
    if (num == null) return '0 VND'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  function getStatusBadgeClass(status) {
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
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">My Bookings</h1>
          <p className="text-muted mb-0">Track and manage your reservations and orders</p>
        </div>
        <Link to="/booking" className="btn btn-primary">
          <i className="bi bi-plus-circle me-1"></i> New Booking
        </Link>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading your bookings...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="text-center py-5 bg-white rounded shadow-sm">
          <i className="bi bi-journal-x text-muted display-4"></i>
          <h4 className="mt-3">No bookings placed yet</h4>
          <p className="text-muted">You haven't made any reservations or orders.</p>
          <Link to="/" className="btn btn-primary mt-2">
            Explore Services
          </Link>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Booking Code</th>
                  <th>Service Type</th>
                  <th>Start Date</th>
                  <th>Passengers</th>
                  <th>Total Amount</th>
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
                      <span className={`badge ${getStatusBadgeClass(b.bookingStatus)}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleViewDetail(b.bookingId)}
                      >
                        Details
                      </button>
                      {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Completed' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => openCancelDialog(b.bookingId)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  Booking Details: {selectedBooking.bookingCode}
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
                    <strong>{selectedBooking.customerName}</strong> ({selectedBooking.customerPhone})
                  </div>
                  <div className="col-md-6">
                    <span className="text-muted small d-block">Email:</span>
                    <span>{selectedBooking.customerEmail}</span>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small d-block">Booking Date:</span>
                    <span>{new Date(selectedBooking.bookingDate).toLocaleString()}</span>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small d-block">Travel / Check-in Date:</span>
                    <strong>{selectedBooking.startDate}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small d-block">Booking Status:</span>
                    <span className={`badge ${getStatusBadgeClass(selectedBooking.bookingStatus)}`}>
                      {selectedBooking.bookingStatus}
                    </span>
                  </div>
                </div>

                <h6 className="fw-bold mt-4 mb-2">Booked Items</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Item Details</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBooking.details?.map((d) => (
                        <tr key={d.detailId}>
                          <td>
                            {d.tourId && `Tour Package #${d.tourId}`}
                            {d.scheduleId && `Transport Schedule #${d.scheduleId}`}
                            {d.serviceItemId && `Service Item #${d.serviceItemId}`}
                          </td>
                          <td>{d.quantity}</td>
                          <td>{formatPrice(d.unitPrice)}</td>
                          <td className="text-end fw-bold">
                            {formatPrice(d.quantity * d.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                  <div>
                    {selectedBooking.discountAmount > 0 && (
                      <span className="text-success small d-block">
                        Discount Voucher: -{formatPrice(selectedBooking.discountAmount)}
                      </span>
                    )}
                    {selectedBooking.notes && (
                      <span className="text-muted small">Notes: {selectedBooking.notes}</span>
                    )}
                  </div>
                  <div className="text-end">
                    <span className="text-muted small d-block">Total Paid / Payable:</span>
                    <span className="h4 text-primary fw-bold">
                      {formatPrice(selectedBooking.totalAmount)}
                    </span>
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-danger">Cancel Booking</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCancelModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to cancel this booking?</p>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Reason for Cancellation:</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="e.g. Schedule change, emergency..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowCancelModal(false)}
                >
                  Go Back
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  className="btn btn-danger"
                  onClick={handleConfirmCancel}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
