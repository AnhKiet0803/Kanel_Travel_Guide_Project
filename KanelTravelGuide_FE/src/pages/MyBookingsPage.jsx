// User booking history and cancellation page (CN13, CN22)
// Maintained by Tiến (recca279)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { getMyBookings, getBookingById, cancelBooking } from '../api/bookingApi.js'
import { paymentLabels } from '../api/payPalApi.js'
import '../styles/services.css'
import './pages.css'

const BOOKINGS_PER_PAGE = 5

const normalizeSearch = (value) => String(value ?? '').toLowerCase()
  .normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').trim()

function describeReservedItem(item) {
  if (item.tourName) return { title: item.tourName, category: 'Tour' }
  if (item.scheduleInfo) return {
    title: item.scheduleInfo,
    subtitle: [item.vehicleName, item.departureTime].filter(Boolean).join(' · '),
    category: 'Transportation',
  }
  if (item.providerName || item.serviceItemName) return {
    title: item.providerName || item.serviceItemName,
    subtitle: item.providerName ? item.serviceItemName : null,
    category: item.serviceType === 'Restaurant' ? 'Dining' : item.serviceType || 'Service',
  }
  return null
}

function BookingServices({ booking }) {
  const items = (booking.details ?? []).map(describeReservedItem).filter(Boolean)
  const unique = items.filter((item, index) => items.findIndex((other) =>
    item.title === other.title && item.subtitle === other.subtitle && item.category === other.category
  ) === index)
  if (unique.length === 0) return <span className="badge bg-light text-dark border me-1">{booking.bookingType}</span>

  return unique.map(({ title, subtitle, category }, index) => (
    <div key={index} className="mb-2">
      <span className="badge bg-light text-dark border">{category}</span>
      <div className="fw-bold text-dark text-break">{title}</div>
      {subtitle && <small className="text-muted d-block text-break">{subtitle}</small>}
    </div>
  ))
}

function canContinuePayPal(booking) {
  return booking.paymentMethod === 'PayPalSandbox'
    && booking.paymentStatus === 'Unpaid' && booking.bookingStatus !== 'Cancelled'
}

const paymentUrl = (id) => '/tours/payment-return?bookingId=' + encodeURIComponent(id) + '&resume=1'

function ManualPaymentGuidance({ booking }) {
  if (booking.totalAmount <= 0 || booking.paymentStatus !== 'Unpaid'
    || !['BankTransfer', 'PayAfterConfirmation'].includes(booking.paymentMethod)) return null

  if (booking.bookingStatus === 'Pending') {
    return <p className="small text-muted mt-1 mb-0">Wait for the operator to confirm your tour before paying.</p>
  }

  if (booking.bookingStatus !== 'Confirmed') return null

  const instruction = booking.paymentMethod === 'BankTransfer'
    ? 'Contact us for bank transfer details. Include your booking code when paying.'
    : 'Contact us to arrange payment. Have your booking code ready.'

  return (
    <p className="small text-muted mt-1 mb-0">
      {instruction} <Link className="ktg-link" to="/contact">Contact us</Link>
    </p>
  )
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [activeStatusTab, setActiveStatusTab] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
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

  const keyword = normalizeSearch(search)
  const filteredBookings = bookings.filter(booking => {
    if (activeStatusTab !== 'ALL' && booking.bookingStatus?.toUpperCase() !== activeStatusTab) return false
    if (!keyword) return true

    const serviceFields = (booking.details ?? []).flatMap(item => {
      const service = describeReservedItem(item)
      return service ? [service.title, service.subtitle, service.category] : []
    })
    const searchable = [booking.bookingCode || `KTG-${booking.bookingId}`, booking.bookingType, ...serviceFields]
    return normalizeSearch(searchable.filter(Boolean).join(' ')).includes(keyword)
  })
  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE))
  const currentPage = Math.min(page, pageCount)
  const offset = (currentPage - 1) * BOOKINGS_PER_PAGE
  const pageBookings = filteredBookings.slice(offset, offset + BOOKINGS_PER_PAGE)

  function changeStatus(status) {
    if (status === activeStatusTab) return
    setActiveStatusTab(status)
    setPage(1)
  }

  function changeSearch(value) {
    setSearch(value)
    setPage(1)
  }

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
            onClick={() => changeStatus('ALL')}
          >
            All Bookings <span className="badge bg-secondary ms-1">{bookings.length}</span>
          </button>
          <button
            type="button"
            className={`ktg-pill-tab ${activeStatusTab === 'CONFIRMED' ? 'active' : ''}`}
            onClick={() => changeStatus('CONFIRMED')}
          >
            Confirmed
          </button>
          <button
            type="button"
            className={`ktg-pill-tab ${activeStatusTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => changeStatus('PENDING')}
          >
            Pending
          </button>
          <button
            type="button"
            className={`ktg-pill-tab ${activeStatusTab === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => changeStatus('CANCELLED')}
          >
            Cancelled
          </button>
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="booking-search">Search bookings</label>
          <div className="input-group" style={{ maxWidth: '460px' }}>
            <input id="booking-search" className="form-control" type="search" value={search}
              onChange={event => changeSearch(event.target.value)} placeholder="Booking reference or service name" />
            {keyword && <button type="button" className="btn btn-outline-secondary" onClick={() => changeSearch('')}>Clear</button>}
          </div>
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
            <h4 className="ktg-serif-title mt-3">{keyword ? 'No matching bookings' : 'No reservations in this section'}</h4>
            {keyword ? (
              <p className="text-muted small mb-0" role="status">Try another booking reference or service name.</p>
            ) : (
              <>
                <p className="text-muted small">You don't have any bookings matching this status.</p>
                <Link to="/booking" className="ktg-btn-navy">Book a Service</Link>
              </>
            )}
          </div>
        )}

        {/* Bookings List Cards */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="row g-3">
            {pageBookings.map((b) => (
              <div key={b.bookingId} className="col-12">
                <div className="ktg-booking-row">
                  <div className="row align-items-center g-3">
                    <div className="col-lg-3 col-md-4">
                      <BookingServices booking={b} />
                      <span className="small text-muted d-block">Booking Reference</span>
                      <strong className="text-primary font-monospace fs-5">
                        {b.bookingCode || `KTG-${b.bookingId}`}
                      </strong>
                      <div className="mt-1">
                        {getStatusBadge(b.bookingStatus)}
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
                      <small className={b.paymentStatus === 'Paid' ? 'text-success' : 'text-muted'}>
                        {b.totalAmount === 0 ? 'No payment due' : (paymentLabels[b.paymentMethod] ?? b.paymentMethod ?? 'Method not recorded') + ' · ' + (b.paymentStatus ?? 'Status unavailable')}
                      </small>
                      <ManualPaymentGuidance booking={b} />
                    </div>

                    <div className="col-lg-3 col-md-12 d-flex flex-wrap justify-content-lg-end gap-2">
                      {canContinuePayPal(b) && (
                        <Link className="ktg-btn-teal" to={paymentUrl(b.bookingId)}>Continue payment</Link>
                      )}
                      <button
                        type="button"
                        className="ktg-btn-outline-navy"
                        onClick={() => handleViewDetail(b.bookingId)}
                      >
                        <i className="bi bi-receipt"></i> Digital Voucher
                      </button>
                      {b.bookingStatus?.toLowerCase() !== 'cancelled' && (
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

        {!loading && !error && pageBookings.length > 0 && (
          <nav className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4"
            aria-label="Bookings pagination">
            <p className="small text-muted mb-0" role="status">
              Showing {offset + 1}–{offset + pageBookings.length} of {filteredBookings.length} bookings
            </p>
            {pageCount > 1 && <div className="d-flex align-items-center gap-2">
              <button type="button" className="btn btn-outline-secondary btn-sm" disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}>Previous</button>
              <span className="small">Page {currentPage} of {pageCount}</span>
              <button type="button" className="btn btn-outline-secondary btn-sm" disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}>Next</button>
            </div>}
          </nav>
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
                    <div>{getStatusBadge(selectedBooking.bookingStatus)}</div>
                  </div>

                  <div className="mb-3"><BookingServices booking={selectedBooking} /></div>

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
                          <tr key={d.detailId ?? i}>
                            <td className="fw-semibold">
                              {d.travelerType ? d.travelerType + ' fare' : d.tourName || d.serviceItemName || d.scheduleInfo || 'Reserved item'}
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
                      <strong className="text-dark">{paymentLabels[selectedBooking.paymentMethod] ?? selectedBooking.paymentMethod ?? 'Method not recorded'}</strong>
                      <span className={selectedBooking.paymentStatus === 'Paid' ? 'd-block text-success' : 'd-block text-muted'}>
                        {selectedBooking.paymentStatus ?? 'Status unavailable'}
                      </span>
                      <ManualPaymentGuidance booking={selectedBooking} />
                      {canContinuePayPal(selectedBooking) && (
                          <Link className="ktg-btn-teal mt-2" to={paymentUrl(selectedBooking.bookingId)}>Continue to PayPal Sandbox</Link>
                        )}
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
