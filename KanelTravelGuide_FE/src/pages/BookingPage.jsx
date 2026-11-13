// CN13: Booking form for Tours, Transport, and Accommodation
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { createBooking } from '../api/bookingApi.js'
import { getRoutes, getSchedules } from '../api/transportApi.js'
import './pages.css'

export default function BookingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialType = searchParams.get('type') || 'Tour'
  const initialTourId = searchParams.get('tourId') || ''
  const initialTourName = searchParams.get('tourName') || ''
  const initialServiceItemId = searchParams.get('serviceItemId') || ''
  const initialItemName = searchParams.get('itemName') || ''
  const initialPrice = parseFloat(searchParams.get('price') || searchParams.get('unitPrice') || '0')
  const initialProviderName = searchParams.get('providerName') || ''

  const [bookingType, setBookingType] = useState(
    ['Tour', 'Transport', 'Accommodation'].includes(initialType) ? initialType : 'Tour'
  )

  // Customer form fields
  const [customerName, setCustomerName] = useState(user?.fullName || '')
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  )
  const [totalPassengers, setTotalPassengers] = useState(1)
  const [promoCode, setPromoCode] = useState('')
  const [notes, setNotes] = useState('')

  // Service item state
  const [selectedServiceItemId, setSelectedServiceItemId] = useState(initialServiceItemId)
  const [selectedItemName, setSelectedItemName] = useState(initialItemName)
  const [selectedTourId, setSelectedTourId] = useState(initialTourId)
  const [selectedTourName, setSelectedTourName] = useState(initialTourName)
  const [unitPrice, setUnitPrice] = useState(initialPrice || 500000)

  // Transport state
  const [routes, setRoutes] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [schedules, setSchedules] = useState([])
  const [selectedScheduleId, setSelectedScheduleId] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successBooking, setSuccessBooking] = useState(null)

  // Update user info when user logs in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.fullName || user.username || '')
      if (!customerEmail) setCustomerEmail(user.email || '')
      if (!customerPhone && user.phone) setCustomerPhone(user.phone)
    }
  }, [user])

  // Load routes if booking type is Transport
  useEffect(() => {
    if (bookingType === 'Transport') {
      getRoutes()
        .then((data) => setRoutes(Array.isArray(data) ? data : []))
        .catch(() => {})
    }
  }, [bookingType])

  // Load schedules when route selected
  useEffect(() => {
    if (selectedRouteId) {
      getSchedules({ routeId: selectedRouteId })
        .then((data) => {
          const list = Array.isArray(data) ? data : []
          setSchedules(list)
          if (list.length > 0) {
            setSelectedScheduleId(list[0].scheduleId)
            setUnitPrice(list[0].ticketPrice || 0)
          }
        })
        .catch(() => {})
    }
  }, [selectedRouteId])

  function formatPrice(num) {
    if (num == null) return '0 VND'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  const subtotal = (unitPrice || 0) * (totalPassengers || 1)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setError('Please provide full name, contact phone, and email.')
      return
    }

    if (!startDate) {
      setError('Please select a valid start date.')
      return
    }

    // Build booking detail
    const detail = {
      quantity: totalPassengers,
      unitPrice: unitPrice,
    }

    if (bookingType === 'Tour') {
      detail.tourId = selectedTourId ? parseInt(selectedTourId) : 1
    } else if (bookingType === 'Transport') {
      if (!selectedScheduleId) {
        setError('Please select a travel schedule.')
        return
      }
      detail.scheduleId = parseInt(selectedScheduleId)
    } else {
      // Accommodation
      detail.serviceItemId = selectedServiceItemId ? parseInt(selectedServiceItemId) : 1
    }

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      bookingType: bookingType,
      startDate: startDate,
      totalPassengers: parseInt(totalPassengers) || 1,
      notes: notes.trim() || null,
      promoCode: promoCode.trim() || null,
      details: [detail],
    }

    setLoading(true)
    try {
      const res = await createBooking(payload)
      setSuccessBooking(res)
    } catch (err) {
      setError(err.message || 'Failed to submit booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (successBooking) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm border-0 p-5 text-center mx-auto" style={{ maxWidth: '650px' }}>
          <div className="text-success display-3 mb-3">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <h2 className="fw-bold mb-2">Booking Placed Successfully!</h2>
          <p className="text-muted">
            Thank you, <strong>{customerName}</strong>. Your reservation request has been received.
          </p>

          <div className="bg-light p-3 rounded my-3 text-start">
            <div className="row mb-1">
              <span className="col-5 text-muted">Booking Reference:</span>
              <strong className="col-7 text-primary">{successBooking.bookingCode}</strong>
            </div>
            <div className="row mb-1">
              <span className="col-5 text-muted">Service Type:</span>
              <span className="col-7">{successBooking.bookingType}</span>
            </div>
            <div className="row mb-1">
              <span className="col-5 text-muted">Total Amount:</span>
              <strong className="col-7 text-success">{formatPrice(successBooking.totalAmount)}</strong>
            </div>
            <div className="row">
              <span className="col-5 text-muted">Booking Status:</span>
              <span className="col-7 badge bg-warning text-dark w-auto align-self-start">
                {successBooking.bookingStatus}
              </span>
            </div>
          </div>

          <p className="small text-muted mb-4">
            Our support team will contact you shortly via email or phone to confirm details.
          </p>

          <div className="d-flex justify-content-center gap-3">
            <Link to="/my-bookings" className="btn btn-primary px-4">
              <i className="bi bi-journal-check me-1"></i> View My Bookings
            </Link>
            <Link to="/" className="btn btn-outline-secondary px-4">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      <div className="mb-4 text-center">
        <h1 className="fw-bold">Book Travel Services</h1>
        <p className="text-muted">
          Fast and convenient online booking for tours, transport coaches, and hotel rooms.
        </p>
      </div>

      {/* Booking Type Selector */}
      <div className="card shadow-sm border-0 p-3 mb-4 bg-light">
        <label className="form-label fw-bold text-secondary mb-2">Select Service Category</label>
        <div className="row g-2">
          <div className="col-md-4">
            <button
              type="button"
              className={`btn w-100 py-2 ${
                bookingType === 'Tour' ? 'btn-primary' : 'btn-outline-primary'
              }`}
              onClick={() => {
                setBookingType('Tour')
                setUnitPrice(1200000)
              }}
            >
              <i className="bi bi-compass me-2"></i> Guided Tour
            </button>
          </div>
          <div className="col-md-4">
            <button
              type="button"
              className={`btn w-100 py-2 ${
                bookingType === 'Transport' ? 'btn-primary' : 'btn-outline-primary'
              }`}
              onClick={() => {
                setBookingType('Transport')
                setUnitPrice(250000)
              }}
            >
              <i className="bi bi-bus-front me-2"></i> Transport Route
            </button>
          </div>
          <div className="col-md-4">
            <button
              type="button"
              className={`btn w-100 py-2 ${
                bookingType === 'Accommodation' ? 'btn-primary' : 'btn-outline-primary'
              }`}
              onClick={() => {
                setBookingType('Accommodation')
                setUnitPrice(initialPrice || 800000)
              }}
            >
              <i className="bi bi-building me-2"></i> Stay & Dining
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left Column: Customer details */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0 p-4 mb-4">
              <h5 className="fw-bold mb-3 border-bottom pb-2">
                <i className="bi bi-person-circle me-2 text-primary"></i> Contact Information
              </h5>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="e.g. Nguyen Cong Tien"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="form-control"
                    placeholder="e.g. 0901234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Departure / Check-in Date *</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    {bookingType === 'Accommodation' ? 'Number of Guests / Rooms' : 'Passengers / Tickets'} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    className="form-control"
                    value={totalPassengers}
                    onChange={(e) => setTotalPassengers(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Special Requests / Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Any dietary requirements, seat preference, or special timing..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* Service-specific options */}
            <div className="card shadow-sm border-0 p-4">
              <h5 className="fw-bold mb-3 border-bottom pb-2">
                <i className="bi bi-gear-fill me-2 text-primary"></i> Service Selection
              </h5>

              {bookingType === 'Tour' && (
                <div>
                  <label className="form-label small fw-semibold">Tour Package</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Tour name"
                    value={selectedTourName || 'Standard Discovery Tour'}
                    onChange={(e) => setSelectedTourName(e.target.value)}
                  />
                  <div className="form-text small">
                    Selected Tour ID: #{selectedTourId || 1}
                  </div>
                </div>
              )}

              {bookingType === 'Transport' && (
                <div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Route</label>
                    <select
                      className="form-select"
                      value={selectedRouteId}
                      onChange={(e) => setSelectedRouteId(e.target.value)}
                    >
                      <option value="">-- Choose Intercity Route --</option>
                      {routes.map((r) => (
                        <option key={r.routeId} value={r.routeId}>
                          {r.departureLocationName} ➔ {r.destinationLocationName} ({r.distanceKm} km)
                        </option>
                      ))}
                    </select>
                  </div>

                  {schedules.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Select Schedule</label>
                      <select
                        className="form-select"
                        value={selectedScheduleId}
                        onChange={(e) => {
                          setSelectedScheduleId(e.target.value)
                          const sch = schedules.find((s) => s.scheduleId === parseInt(e.target.value))
                          if (sch) setUnitPrice(sch.ticketPrice)
                        }}
                      >
                        {schedules.map((s) => (
                          <option key={s.scheduleId} value={s.scheduleId}>
                            Departs {s.departureTime} (Price: {formatPrice(s.ticketPrice)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {bookingType === 'Accommodation' && (
                <div>
                  {initialProviderName && (
                    <p className="mb-2 text-primary fw-semibold">
                      <i className="bi bi-building me-1"></i> Provider: {initialProviderName}
                    </p>
                  )}
                  <label className="form-label small fw-semibold">Room / Table Item</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="e.g. Deluxe Ocean View Room"
                    value={selectedItemName || 'Standard Room / Table'}
                    onChange={(e) => setSelectedItemName(e.target.value)}
                  />
                  <div className="form-text small">
                    Item ID: #{selectedServiceItemId || 1}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing & Confirmation */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 p-4 sticky-top" style={{ top: '20px' }}>
              <h5 className="fw-bold mb-3 border-bottom pb-2">Order Summary</h5>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Service:</span>
                <span className="fw-semibold">{bookingType}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Unit Price:</span>
                <span>{formatPrice(unitPrice)}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Quantity:</span>
                <span>x {totalPassengers}</span>
              </div>

              <div className="d-flex justify-content-between mb-3 pt-2 border-top">
                <span className="text-muted">Subtotal:</span>
                <strong className="text-dark">{formatPrice(subtotal)}</strong>
              </div>

              {/* Promo code input */}
              <div className="mb-3">
                <label className="form-label small fw-semibold">Promo Code / Voucher</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-sm text-uppercase"
                    placeholder="e.g. SUMMER2026"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                </div>
                <div className="form-text small">Discount applied upon verification.</div>
              </div>

              <div className="p-3 bg-light rounded mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="h6 mb-0 fw-bold">Estimated Total:</span>
                  <span className="h4 mb-0 fw-bold text-primary">{formatPrice(subtotal)}</span>
                </div>
                <small className="text-muted d-block mt-1">Payment upon confirmation.</small>
              </div>

              {error && (
                <div className="alert alert-danger small p-2 mb-3" role="alert">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-100 fw-semibold"
              >
                {loading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </span>
                ) : (
                  <span>
                    <i className="bi bi-lock-fill me-1"></i> Confirm & Book
                  </span>
                )}
              </button>

              <p className="text-center text-muted small mt-2 mb-0">
                Free cancellation up to 48 hours prior to start date.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
