// User booking history and cancellation page (CN13, CN22)
// Maintained by Tiến (recca279)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { getMyBookings, getBookingById, cancelBooking } from '../api/bookingApi.js'
import '../styles/services.css'
import './pages.css'

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [activeStatusTab, setActiveStatusTab] = useState('ALL')
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
      setError(err.message || 'Failed to load your reservations.')
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
      await loadBookings()
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

  function getStatusBadge(status) {
    const s = status?.toLowerCase()
    if (s === 'confirmed') {
      return <span className="badge bg-success px-3 py-2">Confirmed</span>
    }
    if (s === 'completed') {
      return <span className="badge bg-primary px-3 py-2">Completed</span>
    }
    if (s === 'cancelled') {
      return <span className="badge bg-danger px-3 py-2">Cancelled</span>
    }
    return <span className="badge bg-warning text-dark px-3 py-2">Pending Confirmation</span>
  }

  const filteredBookings = bookings.filter((b) => {
    if (activeStatusTab === 'ALL') return true
    return b.status?.toUpperCase() === activeStatusTab
  })

  return (
    <div className="ktg-services-wrapper py-4">
      <div className="container">
        {/* Header Section */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <span className="ktg-eyebrow">Customer Portal</span>
            <h1 className="ktg-serif-title mb-1" style={{ fontSize: '2.2rem' }}>
              My Bookings & Reservations
            </h1>
            <p className="text-muted mb-0">
              Manage your travel itineraries, view digital confirmation vouchers, and download receipts.
            </p>
          </div>
          <div className="mt-3 mt-sm-0">
            <Link to="/booking" className="ktg-btn-teal">
              <i className="bi bi-plus-circle"></i> Create New Booking
            </Link>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="d-flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            className={`ktg-pill-tab ${activeStatusTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveStatusTab('ALL')}
          >
            All Bookings <span className="badge bg-secondary ms-1">{bookings.length}</span>
          </button>
          <button
            type="button"
            className={`ktg-pill-tab ${activeStatusTab === 'CONFIRMED' ? 'active' : ''}`}
            onClick={() => setActiveStatusTab('CONFIRMED')}
          >
            Confirmed
          </button>
          <button
            type="button"
            className={`ktg-pill-tab ${activeStatusTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveStatusTab('PENDING')}
          >
            Pending
          </button>
          <button
            type="button"
            className={`ktg-pill-tab ${activeStatusTab === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setActiveStatusTab('CANCELLED')}
          >
            Cancelled
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-3 text-muted fw-semibold">Loading your travel reservations...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger rounded-4 shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookings.length === 0 && (
          <div className="ktg-card text-center py-5">
            <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="ktg-serif-title mt-3">No reservations in this section</h4>
            <p className="text-muted small" style={{ maxWidth: '400px', margin: '0 auto 20px' }}>
              You don't have any bookings matching this status. Explore our top hotels, dining, and guided tours.
            </p>
            <Link to="/hotels" className="ktg-btn-navy">
              Explore Hotels & Stays
            </Link>
          </div>
        )}

        {/* Bookings List Cards */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="row g-3">
            {filteredBookings.map((b) => (
              <div key={b.bookingId} className="col-12">
                <div className="ktg-booking-row">
                  <div className="row align-items-center g-3">
                    <div className="col-lg-3 col-md-4">
                      <span className="small text-muted d-block">Booking Reference</span>
                      <strong className="text-primary font-monospace fs-5">
                        {b.bookingCode || `KTG-${b.bookingId}`}
                      </strong>
                      <div className="mt-1">
                        <span className="badge bg-light text-dark border me-1">
                          {b.bookingType}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>
                    </div>

                    <div className="col-lg-3 col-md-4">
                      <span className="small text-muted d-block">Travel / Check-in Date</span>
                      <div className="fw-semibold text-dark">
                        <i className="bi bi-calendar3 me-1 text-primary"></i>
                        {b.startDate ? new Date(b.startDate).toLocaleDateString('en-GB') : 'N/A'}
                      </div>
                      <small className="text-muted">
                        <i className="bi bi-people me-1"></i> {b.totalPassengers} Guest(s)
                      </small>
                    </div>

                    <div className="col-lg-3 col-md-4">
                      <span className="small text-muted d-block">Total Amount</span>
                      <div className="fw-bold text-primary fs-5">
                        {formatPrice(b.totalAmount)}
                      </div>
                      <small className="text-success">
                        <i className="bi bi-check-circle-fill me-1"></i> Pay at Property
                      </small>
                    </div>

                    <div className="col-lg-3 col-md-12 d-flex justify-content-lg-end gap-2">
                      <button
                        type="button"
                        className="ktg-btn-outline-navy"
                        onClick={() => handleViewDetail(b.bookingId)}
                      >
                        <i className="bi bi-receipt"></i> Digital Voucher
                      </button>
                      {b.status?.toLowerCase() !== 'cancelled' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => openCancelDialog(b.bookingId)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Digital Voucher / Detail Modal */}
        {selectedBooking && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(11, 37, 59, 0.65)', backdropFilter: 'blur(4px)' }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="ktg-receipt-header d-flex justify-content-between align-items-center">
                  <div>
                    <span className="badge bg-white text-dark text-uppercase fw-bold mb-1">
                      Official E-Voucher
                    </span>
                    <h3 className="ktg-serif-title text-white mb-0">Karnel Travels Booking</h3>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedBooking(null)}
                  ></button>
                </div>

                <div className="modal-body p-4 p-md-5">
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <div>
                      <span className="small text-muted d-block">Booking Reference Code</span>
                      <strong className="fs-4 text-primary font-monospace">
                        {selectedBooking.bookingCode || `KTG-${selectedBooking.bookingId}`}
                      </strong>
                    </div>
                    <div>{getStatusBadge(selectedBooking.status)}</div>
                  </div>

                  <div className="row g-3 mb-4 small text-secondary">
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Guest Name:</span>
                      <strong className="text-dark">{selectedBooking.customerName}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Contact Phone:</span>
                      <strong className="text-dark">{selectedBooking.customerPhone}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Email Address:</span>
                      <strong className="text-dark">{selectedBooking.customerEmail}</strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Travel / Check-in Date:</span>
                      <strong className="text-dark">
                        {selectedBooking.startDate
                          ? new Date(selectedBooking.startDate).toLocaleDateString('en-GB')
                          : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {/* Reserved Items */}
                  <h5 className="ktg-serif-title mb-2">Reserved Items</h5>
                  <div className="table-responsive mb-4">
                    <table className="table table-bordered align-middle small mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Item / Service</th>
                          <th className="text-center">Quantity</th>
                          <th className="text-end">Unit Price</th>
                          <th className="text-end">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedBooking.details || []).map((d, i) => (
                          <tr key={i}>
                            <td className="fw-semibold">
                              {d.tourName || d.serviceItemName || d.scheduleInfo || 'Accommodation Item'}
                            </td>
                            <td className="text-center">{d.quantity}</td>
                            <td className="text-end">{formatPrice(d.unitPrice)}</td>
                            <td className="text-end fw-bold">
                              {formatPrice(d.totalPrice || d.quantity * d.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                    <div>
                      <span className="small text-muted d-block">Payment Method</span>
                      <strong className="text-dark">Pay at Property / Counter</strong>
                    </div>
                    <div className="text-end">
                      <span className="small text-muted d-block">Grand Total</span>
                      <span className="h3 fw-bold text-primary mb-0">
                        {formatPrice(selectedBooking.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => window.print()}
                  >
                    <i className="bi bi-printer me-1"></i> Print Voucher
                  </button>
                  <button
                    type="button"
                    className="ktg-btn-navy"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Confirmation Dialog */}
        {showCancelModal && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow rounded-4">
                <div className="modal-header">
                  <h5 className="modal-title fw-bold text-danger">Cancel Reservation</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCancelModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted small">
                    Are you sure you want to cancel this booking? Once cancelled, your reserved unit will be released back to other travelers.
                  </p>
                  <label className="form-label small fw-bold text-secondary">
                    Reason for Cancellation (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g. Schedule change, medical reason..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCancelModal(false)}
                  >
                    Keep Booking
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
    </div>
  )
}
