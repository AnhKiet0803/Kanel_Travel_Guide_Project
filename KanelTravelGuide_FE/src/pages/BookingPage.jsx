// CN13: Booking form for Tours, Transport, and Accommodation
// Maintained by Tiến (recca279)
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { createBooking } from '../api/bookingApi.js'
import { getRoutes, getSchedules } from '../api/transportApi.js'
import '../styles/services.css'
import './pages.css'

export default function BookingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialType = searchParams.get('type') || 'Accommodation'
  const initialTourId = searchParams.get('tourId') || ''
  const initialTourName = searchParams.get('tourName') || ''
  const initialServiceItemId = searchParams.get('serviceItemId') || ''
  const initialItemName = searchParams.get('itemName') || ''
  const initialPrice = parseFloat(searchParams.get('price') || searchParams.get('unitPrice') || '0')
  const initialProviderName = searchParams.get('providerName') || ''

  const [bookingType, setBookingType] = useState(
    ['Tour', 'Transport', 'Accommodation'].includes(initialType) ? initialType : 'Accommodation'
  )

  // Customer form fields
  const [customerName, setCustomerName] = useState(user?.fullName || '')
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  )
  const [totalPassengers, setTotalPassengers] = useState(1)
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')

  // Service item state
  const [selectedServiceItemId, setSelectedServiceItemId] = useState(initialServiceItemId)
  const [selectedItemName, setSelectedItemName] = useState(initialItemName || 'Deluxe Ocean View Room')
  const [selectedTourId, setSelectedTourId] = useState(initialTourId)
  const [selectedTourName, setSelectedTourName] = useState(initialTourName || 'Full Day Da Nang City & Marble Mountain')
  const [unitPrice, setUnitPrice] = useState(initialPrice || 1850000)
  const [providerName, setProviderName] = useState(initialProviderName || 'Karnel Beach Luxury Hotel')

  // Transport state
  const [routes, setRoutes] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [schedules, setSchedules] = useState([])
  const [selectedScheduleId, setSelectedScheduleId] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successBooking, setSuccessBooking] = useState(null)

  // Update user info if logged in
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
        .then((data) => {
          const list = Array.isArray(data) ? data : []
          setRoutes(list)
          if (list.length > 0 && !selectedRouteId) {
            setSelectedRouteId(list[0].routeId)
          }
        })
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
            setUnitPrice(list[0].ticketPrice || 150000)
          }
        })
        .catch(() => {})
    }
  }, [selectedRouteId])

  function formatPrice(num) {
    if (num == null) return '0 VND'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  function handleApplyPromo(e) {
    e.preventDefault()
    setPromoError('')
    const code = promoCodeInput.trim().toUpperCase()
    if (!code) return

    if (code === 'KARNEL10') {
      setAppliedPromo({ code, discountPercent: 10, label: '10% Exclusive Discount' })
    } else if (code === 'WELCOME') {
      setAppliedPromo({ code, discountFixed: 100000, label: '100,000 VND Welcome Voucher' })
    } else {
      setPromoError('Invalid promotion code. Try "KARNEL10" or "WELCOME".')
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null)
    setPromoCodeInput('')
    setPromoError('')
  }

  // Calculate totals
  const subtotal = (unitPrice || 0) * (parseInt(totalPassengers) || 1)
  let discountAmount = 0
  if (appliedPromo) {
    if (appliedPromo.discountPercent) {
      discountAmount = (subtotal * appliedPromo.discountPercent) / 100
    } else if (appliedPromo.discountFixed) {
      discountAmount = Math.min(subtotal, appliedPromo.discountFixed)
    }
  }
  const grandTotal = Math.max(0, subtotal - discountAmount)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setError('Please provide your full name, contact phone number, and email address.')
      return
    }

    if (!startDate) {
      setError('Please select a valid travel or check-in date.')
      return
    }

    // Build booking detail
    const detail = {
      quantity: parseInt(totalPassengers) || 1,
      unitPrice: unitPrice
    }

    if (bookingType === 'Tour') {
      detail.tourId = selectedTourId ? parseInt(selectedTourId) : 1
    } else if (bookingType === 'Transport') {
      if (!selectedScheduleId) {
        setError('Please select a travel departure schedule.')
        return
      }
      detail.scheduleId = parseInt(selectedScheduleId)
    } else {
      detail.serviceItemId = selectedServiceItemId ? parseInt(selectedServiceItemId) : 101
    }

    const payload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      bookingType: bookingType,
      startDate: startDate,
      totalPassengers: parseInt(totalPassengers) || 1,
      notes: notes.trim() || null,
      promoCode: appliedPromo ? appliedPromo.code : null,
      details: [detail]
    }

    setLoading(true)
    try {
      const result = await createBooking(payload)
      setSuccessBooking(result || { bookingCode: 'KTG-' + Math.floor(100000 + Math.random() * 900000) })
    } catch (err) {
      setError(err.message || 'Failed to submit reservation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Success Confirmation Screen
  if (successBooking) {
    return (
      <div className="ktg-services-wrapper py-5">
        <div className="container" style={{ maxWidth: '680px' }}>
          <div className="ktg-card p-0 overflow-hidden shadow-lg border-0">
            <div className="ktg-receipt-header text-center">
              <div
                className="bg-white text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow"
                style={{ width: '64px', height: '64px', fontSize: '2rem' }}
              >
                <i className="bi bi-check-lg"></i>
              </div>
              <h2 className="ktg-serif-title text-white mb-1">Reservation Confirmed!</h2>
              <p className="text-white-50 mb-0">
                Thank you, {customerName}. Your booking voucher has been issued.
              </p>
            </div>

            <div className="p-4 p-md-5 bg-white">
              <div className="alert alert-light border rounded-3 text-center mb-4">
                <span className="small text-muted d-block text-uppercase fw-bold letter-spacing-1">
                  Booking Reference Code
                </span>
                <span className="h3 fw-bold text-primary mb-0 font-monospace">
                  {successBooking.bookingCode || 'KTG-839214'}
                </span>
              </div>

              <div className="row g-3 small text-secondary mb-4">
                <div className="col-6">
                  <span className="text-muted d-block">Service Type:</span>
                  <strong className="text-dark">{bookingType}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Travel / Check-in Date:</span>
                  <strong className="text-dark">{startDate}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Number of Guests / Units:</span>
                  <strong className="text-dark">{totalPassengers}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Payment Status:</span>
                  <span className="badge bg-success">Confirmed (Pay at Check-in)</span>
                </div>
              </div>

              <div className="border-top pt-3 d-flex justify-content-between align-items-center mb-4">
                <span className="fw-bold fs-5 text-dark">Total Amount:</span>
                <span className="fw-bold fs-4 text-primary">{formatPrice(grandTotal)}</span>
              </div>

              <div className="d-flex gap-3">
                <Link to="/my-bookings" className="ktg-btn-navy flex-grow-1 justify-content-center py-3">
                  <i className="bi bi-journal-bookmark-fill"></i> View In My Bookings
                </Link>
                <Link to="/" className="ktg-btn-outline-navy justify-content-center py-3">
                  Explore More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ktg-services-wrapper py-4">
      <div className="container">
        {/* Step Progress Bar */}
        <div className="ktg-step-indicator mb-4">
          <div className="ktg-step-item active">
            <span className="ktg-booking-step-badge">1</span>
            <span>1. Service Details</span>
          </div>
          <div className="d-none d-md-block text-muted">
            <i className="bi bi-chevron-right"></i>
          </div>
          <div className="ktg-step-item active">
            <span className="ktg-booking-step-badge">2</span>
            <span>2. Guest Details</span>
          </div>
          <div className="d-none d-md-block text-muted">
            <i className="bi bi-chevron-right"></i>
          </div>
          <div className="ktg-step-item active">
            <span className="ktg-booking-step-badge">3</span>
            <span>3. Confirmation</span>
          </div>
        </div>

        <div className="row g-4">
          {/* Main Booking Form */}
          <div className="col-lg-8">
            <div className="ktg-card p-4 p-md-5 mb-4">
              <span className="ktg-eyebrow">Reservation Form</span>
              <h2 className="ktg-serif-title mb-4">Complete Your Reservation</h2>

              {error && (
                <div className="alert alert-danger rounded-4 shadow-sm mb-4" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Service Type Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-dark small text-uppercase letter-spacing-1">
                    Select Reservation Category
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`ktg-pill-tab ${bookingType === 'Accommodation' ? 'active' : ''}`}
                      onClick={() => setBookingType('Accommodation')}
                    >
                      <i className="bi bi-building"></i> Hotel & Resort
                    </button>
                    <button
                      type="button"
                      className={`ktg-pill-tab ${bookingType === 'Tour' ? 'active' : ''}`}
                      onClick={() => setBookingType('Tour')}
                    >
                      <i className="bi bi-compass"></i> Guided Tour
                    </button>
                    <button
                      type="button"
                      className={`ktg-pill-tab ${bookingType === 'Transport' ? 'active' : ''}`}
                      onClick={() => setBookingType('Transport')}
                    >
                      <i className="bi bi-bus-front"></i> Transport Ticket
                    </button>
                  </div>
                </div>

                {/* Specific Fields depending on Category */}
                <div className="bg-light p-3 rounded-4 mb-4 border">
                  {bookingType === 'Accommodation' && (
                    <div className="row g-3">
                      <div className="col-md-7">
                        <label className="form-label small fw-bold text-secondary">
                          Property / Room Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedItemName}
                          onChange={(e) => setSelectedItemName(e.target.value)}
                          placeholder="e.g. Deluxe Ocean View Room"
                          required
                        />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label small fw-bold text-secondary">
                          Nightly Rate (VND)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {bookingType === 'Tour' && (
                    <div className="row g-3">
                      <div className="col-md-7">
                        <label className="form-label small fw-bold text-secondary">
                          Tour Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={selectedTourName}
                          onChange={(e) => setSelectedTourName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label small fw-bold text-secondary">
                          Rate per Person (VND)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {bookingType === 'Transport' && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          Travel Route
                        </label>
                        <select
                          className="form-select"
                          value={selectedRouteId}
                          onChange={(e) => setSelectedRouteId(e.target.value)}
                        >
                          {routes.map((r) => (
                            <option key={r.routeId} value={r.routeId}>
                              {r.origin} ➔ {r.destination} ({r.transportType})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          Departure Schedule
                        </label>
                        <select
                          className="form-select"
                          value={selectedScheduleId}
                          onChange={(e) => {
                            setSelectedScheduleId(e.target.value)
                            const sch = schedules.find((s) => s.scheduleId === parseInt(e.target.value))
                            if (sch) setUnitPrice(sch.ticketPrice || 0)
                          }}
                        >
                          {schedules.map((s) => (
                            <option key={s.scheduleId} value={s.scheduleId}>
                              {s.departureTime?.slice(0, 5)} - {formatPrice(s.ticketPrice)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date & Guests */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small">
                      <i className="bi bi-calendar-check me-1 text-primary"></i> Travel / Check-in Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small">
                      <i className="bi bi-people-fill me-1 text-primary"></i> Number of Guests / Units
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="30"
                      value={totalPassengers}
                      onChange={(e) => setTotalPassengers(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>

                {/* Primary Guest Contact Information */}
                <h4 className="ktg-serif-title mb-3 fs-5 pt-2 border-top">
                  Guest Contact Details
                </h4>

                <div className="row g-3 mb-4">
                  <div className="col-md-12">
                    <label className="form-label small fw-bold text-secondary">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Nguyen Cong Tien"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 0905 123 456"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-secondary">
                      Email Address (for confirmation ticket)
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. name@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold text-secondary">
                      Special Requests / Dietary Requirements (optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="e.g. High floor room, non-smoking, late check-in..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                {/* Payment Selection */}
                <h4 className="ktg-serif-title mb-3 fs-5 pt-2 border-top">
                  Payment Preference
                </h4>

                <div className="d-flex flex-column gap-2 mb-4">
                  <label className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${paymentMethod === 'card' ? 'border-primary bg-light' : ''}`}>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="radio"
                        name="payMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span className="fw-semibold text-dark">International Card / Credit Card</span>
                    </div>
                    <span className="text-muted small">Visa, MasterCard, JCB</span>
                  </label>

                  <label className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${paymentMethod === 'qr' ? 'border-primary bg-light' : ''}`}>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="radio"
                        name="payMethod"
                        value="qr"
                        checked={paymentMethod === 'qr'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span className="fw-semibold text-dark">VNPAY QR / Banking App / Momo</span>
                    </div>
                    <span className="badge bg-success">Instant 0% Fee</span>
                  </label>

                  <label className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${paymentMethod === 'later' ? 'border-primary bg-light' : ''}`}>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="radio"
                        name="payMethod"
                        value="later"
                        checked={paymentMethod === 'later'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span className="fw-semibold text-dark">Pay at Property / Check-in Counter</span>
                    </div>
                    <span className="text-muted small">No upfront charge</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ktg-btn-teal w-100 justify-content-center py-3 fs-5"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span> Confirming...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-lock-fill"></i> Confirm Reservation ({formatPrice(grandTotal)})
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sticky Order Summary Sidebar */}
          <div className="col-lg-4">
            <div className="ktg-order-summary-card p-4">
              <span className="ktg-eyebrow">Price Breakdown</span>
              <h4 className="ktg-serif-title mb-3">Order Summary</h4>

              <div className="bg-light p-3 rounded-3 mb-3 border">
                <span className="badge bg-primary text-uppercase mb-1">{bookingType}</span>
                <h5 className="fw-bold mb-1 text-dark">
                  {bookingType === 'Accommodation'
                    ? selectedItemName
                    : bookingType === 'Tour'
                    ? selectedTourName
                    : 'Transport Travel Ticket'}
                </h5>
                <span className="text-muted small">
                  <i className="bi bi-calendar3 me-1"></i> Date: {startDate}
                </span>
              </div>

              {/* Promo Code Form */}
              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary mb-1">
                  Have a Promo Voucher?
                </label>
                {appliedPromo ? (
                  <div className="d-flex justify-content-between align-items-center p-2 rounded bg-success bg-opacity-10 text-success border border-success">
                    <span className="small fw-bold">
                      <i className="bi bi-ticket-perforated-fill me-1"></i> {appliedPromo.label} ({appliedPromo.code})
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={handleRemovePromo}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control form-control-sm text-uppercase"
                      placeholder="e.g. KARNEL10"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-sm btn-outline-primary">
                      Apply
                    </button>
                  </form>
                )}
                {promoError && <div className="text-danger small mt-1">{promoError}</div>}
              </div>

              {/* Price rows */}
              <div className="small text-secondary mb-3">
                <div className="d-flex justify-content-between py-1">
                  <span>Unit Price:</span>
                  <span className="text-dark fw-semibold">{formatPrice(unitPrice)}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span>Quantity / Persons:</span>
                  <span className="text-dark fw-semibold">x {totalPassengers}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span>Subtotal:</span>
                  <span className="text-dark fw-semibold">{formatPrice(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between py-1 text-success fw-bold">
                    <span>Discount:</span>
                    <span>- {formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between py-1">
                  <span>Taxes & Service Charge:</span>
                  <span className="text-success fw-semibold">Included</span>
                </div>
              </div>

              <div className="border-top pt-3 d-flex justify-content-between align-items-end mb-4">
                <div>
                  <span className="small text-muted d-block">Grand Total</span>
                  <div className="ktg-serif-title fs-3 text-primary mb-0">
                    {formatPrice(grandTotal)}
                  </div>
                </div>
                <span className="badge bg-light text-secondary border">VND</span>
              </div>

              <div className="text-muted small">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-shield-check text-success fs-5"></i>
                  <span>Free cancellation up to 48 hours</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-lock-fill text-primary fs-5"></i>
                  <span>Encrypted 256-bit secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
