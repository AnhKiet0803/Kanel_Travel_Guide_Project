// CN13: Booking form for Tours, Transport, and Accommodation
// Maintained by Tiến (recca279)
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { createBooking } from '../api/bookingApi.js'
import { getSchedules, transportModeFor } from '../api/transportApi.js'
import { listTourDepartures } from '../api/tourDepartureApi.js'
import { getServiceById, getServices } from '../api/servicesApi.js'
import { createPayPalOrder, getPayPalOptions, paymentLabels } from '../api/payPalApi.js'
import { listTourPromotions, tourService } from '../services/tourService.js'
import '../styles/services.css'
import './pages.css'

export default function BookingPage() {
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const transport = pathname === '/transport/booking' || (!params.has('type') && !params.has('serviceItemId'))
  return <ServiceBookingPage key={pathname + params.toString()} transport={transport} />
}

function ServiceBookingPage({ transport }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [selectedItemId, setSelectedItemId] = useState(searchParams.get('serviceItemId') || '')
  const [providerId, setProviderId] = useState(searchParams.get('providerId') || '')
  const [providers, setProviders] = useState([])
  const [tours, setTours] = useState([])
  const [selectedTourId, setSelectedTourId] = useState(searchParams.get('tourId') || '')
  const [selectedDepartureId, setSelectedDepartureId] = useState(searchParams.get('departureId') || '')
  const [tourSchedule, setTourSchedule] = useState(null)
  const [adults, setAdults] = useState(() => Math.max(1, Math.min(30, Number(searchParams.get('adults')) || 2)))
  const [childAges, setChildAges] = useState(() => Array.from(
    { length: Math.max(0, Math.min(29, parseInt(searchParams.get('children'), 10) || 0)) }, () => ''
  ))
  const requestedScheduleId = Number(searchParams.get('scheduleId'))
  const [provider, setProvider] = useState(null)
  const requestedType = searchParams.get('type')
  const [bookingType, setBookingType] = useState(requestedType === 'Tour' || selectedTourId ? 'Tour'
    : requestedType === 'Dining' ? 'Dining' : transport || requestedType === 'Transport' || requestedScheduleId ? 'Transport' : 'Accommodation')
  const isTour = bookingType === 'Tour'
  const isTransport = bookingType === 'Transport'

  const [customerName, setCustomerName] = useState(user?.fullName || '')
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' }).format(new Date())
  const [startDate, setStartDate] = useState(searchParams.get('date') || today)
  const [totalPassengers, setTotalPassengers] = useState(() => Math.max(1, Math.min(30, Number(searchParams.get('quantity')) || 1)))
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [checkingPromo, setCheckingPromo] = useState(false)
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('PayAfterConfirmation')
  const [paypalOptions, setPaypalOptions] = useState(null)
  const [selectedMode, setSelectedMode] = useState(searchParams.get('mode') || '')
  const [selectedRouteId, setSelectedRouteId] = useState(Number(searchParams.get('routeId')) || '')
  const [schedules, setSchedules] = useState([])
  const [selectedScheduleId, setSelectedScheduleId] = useState(requestedScheduleId || '')
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successBooking, setSuccessBooking] = useState(null)

  useEffect(() => {
    if (!user) return
    setCustomerName((value) => value || user.fullName || user.username || '')
    setCustomerEmail((value) => value || user.email || '')
    setCustomerPhone((value) => value || user.phone || '')
  }, [user])

  useEffect(() => {
    getPayPalOptions().then(setPaypalOptions).catch(() => setPaypalOptions(null))
  }, [])

  useEffect(() => {
    if (bookingType === 'Transport') return
    let active = true
    const load = bookingType === 'Tour'
      ? tourService.list().then(items => { if (active) setTours(items) })
      : getServices(bookingType === 'Dining' ? { type: 'Restaurant' } : {})
        .then(items => {
          if (active) setProviders(items.filter(item => bookingType === 'Dining'
            ? item.serviceType === 'Restaurant' : ['Hotel', 'Resort'].includes(item.serviceType)))
        })
    load.catch(failure => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [bookingType])

  useEffect(() => {
    if (!providerId || !['Dining', 'Accommodation'].includes(bookingType)) return
    let active = true
    getServiceById(providerId, startDate ? { date: startDate } : undefined)
      .then(data => { if (active) setProvider({ ...data, availabilityDate: startDate }) })
      .catch(failure => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [providerId, bookingType, startDate])

  function changeCategory(type) {
    if (bookingType === type) return
    setError(null)
    setProviders([])
    setProvider(null)
    setProviderId('')
    setSelectedItemId('')
    setAppliedPromo(null)
    setPromoCodeInput('')
    setPromoError('')
    setBookingType(type)
  }

  useEffect(() => {
    if (!isTour || !selectedTourId) return
    let active = true
    listTourDepartures(selectedTourId)
      .then(items => { if (active) setTourSchedule({ tourId: selectedTourId, items }) })
      .catch(failure => { if (active) setTourSchedule({ tourId: selectedTourId, error: failure.message }) })
    return () => { active = false }
  }, [isTour, selectedTourId])

  useEffect(() => {
    if (!isTransport || !startDate) return
    let active = true
    setLoadingSchedules(true)
    setSchedules([])
    getSchedules({ status: 'Running', date: startDate })
      .then(data => { if (active) setSchedules(data) })
      .catch(failure => { if (active) setError(failure.message) })
      .finally(() => { if (active) setLoadingSchedules(false) })
    return () => { active = false }
  }, [isTransport, startDate])

  const serviceItems = provider?.items?.filter(item => item.isAvailable && (item.remainingQuantity ?? item.totalQuantity) > 0) ?? []
  const serviceItem = serviceItems.find(item => String(item.itemId) === selectedItemId)
  const selectedTour = tours.find(tour => String(tour.id) === selectedTourId)
  const tourDepartures = tourSchedule?.tourId === selectedTourId ? tourSchedule.items ?? [] : []
  const departure = tourDepartures.find(item => String(item.tourDepartureId) === selectedDepartureId && item.seatsLeft > 0)
  const bookingDate = isTour ? departure?.departureDate : startDate
  const quantity = isTour ? adults + childAges.length : totalPassengers
  const linkedSchedule = schedules.find(item => item.scheduleId === Number(selectedScheduleId))
  const transportMode = selectedMode || transportModeFor(linkedSchedule?.vehicleType)
  const modeSchedules = schedules.filter(item => transportModeFor(item.vehicleType) === transportMode)
  const routes = [...new Map(modeSchedules.map(item => [item.routeId, item])).values()]
  const routeId = routes.some(item => item.routeId === Number(selectedRouteId)) ? Number(selectedRouteId) : routes[0]?.routeId
  const routeSchedules = modeSchedules.filter(item => item.routeId === routeId)
  const schedule = routeSchedules.find(item => item.scheduleId === Number(selectedScheduleId))
    ?? routeSchedules.find(item => item.remainingSeats !== 0)
  const selectedItemName = serviceItem?.itemName ?? ''
  const returnParams = new URLSearchParams({ type: bookingType, date: bookingDate || startDate, quantity })
  if (isTour) {
    returnParams.set('tourId', selectedTourId)
    returnParams.set('departureId', selectedDepartureId)
    returnParams.set('adults', adults)
    returnParams.set('children', childAges.length)
  } else if (isTransport) {
    returnParams.set('mode', transportMode)
    if (routeId) returnParams.set('routeId', routeId)
    if (schedule) returnParams.set('scheduleId', schedule.scheduleId)
  } else {
    if (providerId) returnParams.set('providerId', providerId)
    if (selectedItemId) returnParams.set('serviceItemId', selectedItemId)
  }
  const unitPrice = (bookingType === 'Transport' ? schedule?.ticketPrice : serviceItem?.price) ?? 0
  const maxQuantity = isTour ? departure?.seatsLeft : isTransport ? schedule?.remainingSeats : serviceItem?.remainingQuantity ?? serviceItem?.totalQuantity
  const validSelection = isTour ? Boolean(departure) : isTransport ? !loadingSchedules && Boolean(schedule)
    : Boolean(serviceItem && provider.availabilityDate === startDate && (bookingType === 'Dining') === (provider.serviceType === 'Restaurant'))
  const validQuantity = Number.isInteger(quantity) && quantity >= 1 && quantity <= 30
    && (maxQuantity == null || quantity <= maxQuantity) && (!isTour || Number.isInteger(adults) && adults >= 1)
  const validChildAges = !isTour || childAges.every(age => /^[2-9]$|^1[0-7]$/.test(age))

  function formatPrice(num) {
    return Number(num ?? 0).toLocaleString('vi-VN') + ' VND'
  }

  async function handleApplyPromo(e) {
    e.preventDefault()
    setPromoError('')
    const code = promoCodeInput.trim().toUpperCase()
    if (!code || checkingPromo) return
    setCheckingPromo(true)
    try {
      const promo = (await listTourPromotions()).find((item) => item.promoCode.toUpperCase() === code)
      if (!promo) {
        setPromoError('Invalid or expired promotion code.')
        return
      }
      setAppliedPromo({ code: promo.promoCode, discountPercent: promo.discountPercent, discountFixed: promo.discountAmount, label: promo.title })
    } catch (failure) {
      setPromoError(failure.message)
    } finally {
      setCheckingPromo(false)
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null)
    setPromoCodeInput('')
    setPromoError('')
  }

  const subtotal = isTour
    ? (departure?.adultPrice ?? 0) * adults + (departure?.childPrice ?? 0) * childAges.length
    : unitPrice * totalPassengers
  const discountAmount = Math.min(subtotal, appliedPromo?.discountPercent > 0
    ? Math.round(subtotal * appliedPromo.discountPercent) / 100 : appliedPromo?.discountFixed ?? 0)
  const grandTotal = Math.max(0, subtotal - discountAmount)
  const noPaymentDue = validSelection && grandTotal === 0
  const canPayPal = Boolean(validSelection && paypalOptions?.enabled && user && grandTotal > 0)
  const chosenMethod = paymentMethod === 'PayPalSandbox' && !canPayPal || paymentMethod === 'BankTransfer' && grandTotal <= 0
    ? 'PayAfterConfirmation' : paymentMethod

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setError(null)
    if (!user) {
      setError('Sign in to save your reservation in My Bookings.')
      return
    }
    if (!validSelection || !validQuantity || !validChildAges || !bookingDate || bookingDate < today) {
      setError('Choose an available option, quantity and date.')
      return
    }

    const bookingKind = isTour ? 'Tour' : isTransport ? 'Transport' : 'Service'
    const detail = isTour ? { tourId: Number(selectedTourId) }
      : isTransport ? { scheduleId: schedule.scheduleId } : { serviceItemId: serviceItem.itemId }

    setLoading(true)
    try {
      const result = await createBooking({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        bookingType: bookingKind,
        startDate: bookingDate,
        totalPassengers: quantity,
        ...(isTour ? { tourDepartureId: departure.tourDepartureId, adultCount: adults, childAges: childAges.map(Number) } : {}),
        paymentMethod: chosenMethod,
        notes: notes.trim() || null,
        promoCode: appliedPromo?.code ?? null,
        details: [{ ...detail, quantity }],
      })
      setSuccessBooking(result)
      if (result.paymentMethod === 'PayPalSandbox') {
        try {
          const order = await createPayPalOrder(result.bookingId)
          if (order.approvalUrl) window.location.assign(order.approvalUrl)
          else navigate('/tours/payment-return?bookingId=' + result.bookingId + '&resume=1')
        } catch (failure) {
          setError(failure.message)
        }
      }
    } catch (failure) {
      setError(failure.message || 'Failed to submit reservation. Please try again.')
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
              <h2 className="ktg-serif-title text-white mb-1">Reservation received</h2>
              <p className="text-white-50 mb-0">
                Thank you, {customerName}. Your reservation is awaiting confirmation or payment.
              </p>
            </div>

            <div className="p-4 p-md-5 bg-white">
              <div className="alert alert-light border rounded-3 text-center mb-4">
                <span className="small text-muted d-block text-uppercase fw-bold letter-spacing-1">
                  Booking Reference Code
                </span>
                <span className="h3 fw-bold text-primary mb-0 font-monospace">
                  {successBooking.bookingCode}
                </span>
              </div>

              <div className="row g-3 small text-secondary mb-4">
                <div className="col-6">
                  <span className="text-muted d-block">Service Type:</span>
                  <strong className="text-dark">{bookingType}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Travel / Check-in Date:</span>
                  <strong className="text-dark">{bookingDate}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">{isTour ? 'Number of travelers' : isTransport ? 'Number of tickets' : bookingType === 'Dining' ? 'Number of options' : 'Number of rooms (one night)'}:</span>
                  <strong className="text-dark">{quantity}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block">Payment Status:</span>
                  <span className="badge bg-secondary">{successBooking.totalAmount === 0 ? 'No payment due' : successBooking.paymentStatus}</span>
                  {successBooking.totalAmount > 0 && <span className="d-block">{paymentLabels[successBooking.paymentMethod]}</span>}
                </div>
              </div>

              <div className="border-top pt-3 d-flex justify-content-between align-items-center mb-4">
                <span className="fw-bold fs-5 text-dark">Total Amount:</span>
                <span className="fw-bold fs-4 text-primary">{formatPrice(successBooking.totalAmount)}</span>
              </div>

              {error && <p className="text-danger" role="alert">{error}</p>}
              {successBooking.paymentMethod === 'PayPalSandbox' && (
                <Link className="ktg-btn-teal mb-3" to={'/tours/payment-return?bookingId=' + successBooking.bookingId + '&resume=1'}>
                  {loading ? 'Opening PayPal…' : 'Continue to PayPal Sandbox'}
                </Link>
              )}
              {successBooking.paymentMethod === 'BankTransfer' && <p>Wait for booking confirmation and transfer instructions before paying.</p>}
              {successBooking.paymentMethod === 'PayAfterConfirmation' && <p>{successBooking.totalAmount === 0 ? 'No online payment is due for this reservation.' : 'Check My Bookings for confirmation and payment instructions.'}</p>}
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
                      onClick={() => changeCategory('Accommodation')} aria-pressed={bookingType === 'Accommodation'}
                    >
                      <i className="bi bi-building"></i> Hotel & Resort
                    </button>
                    <button type="button" className={`ktg-pill-tab ${bookingType === 'Dining' ? 'active' : ''}`} onClick={() => changeCategory('Dining')} aria-pressed={bookingType === 'Dining'}>
                      <i className="bi bi-cup-hot"></i> Dining
                    </button>
                    <button type="button" className={`ktg-pill-tab ${bookingType === 'Tour' ? 'active' : ''}`}
                      onClick={() => changeCategory('Tour')} aria-pressed={bookingType === 'Tour'}>
                      <i className="bi bi-compass"></i> Guided Tour
                    </button>
                    <button
                      type="button"
                      className={`ktg-pill-tab ${bookingType === 'Transport' ? 'active' : ''}`}
                      onClick={() => changeCategory('Transport')} aria-pressed={bookingType === 'Transport'}
                    >
                      <i className="bi bi-bus-front"></i> Transport Ticket
                    </button>
                  </div>
                </div>

                {/* Specific Fields depending on Category */}
                <div className="bg-light p-3 rounded-4 mb-4 border">
                  {['Dining', 'Accommodation'].includes(bookingType) && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary" htmlFor="booking-provider">
                          {bookingType === 'Dining' ? 'Restaurant' : 'Hotel or resort'}
                        </label>
                        <select id="booking-provider" className="form-select" value={providerId} onChange={event => {
                          setError(null)
                          setProvider(null)
                          setProviderId(event.target.value)
                          setSelectedItemId('')
                        }}>
                          <option value="">Choose a provider</option>
                          {providers.map(item => <option key={item.providerId} value={item.providerId}>{item.providerName}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary" htmlFor="booking-item">
                          {bookingType === 'Dining' ? 'Dining option' : 'Room or villa'}
                        </label>
                        <select id="booking-item" className="form-select" value={serviceItem ? selectedItemId : ''}
                          disabled={!serviceItems.length || provider?.availabilityDate !== startDate}
                          onChange={event => setSelectedItemId(event.target.value)}>
                          <option value="">{provider && !serviceItems.length ? 'No options for this date' : 'Choose an option'}</option>
                          {serviceItems.map(item => <option key={item.itemId} value={item.itemId}>{item.itemName} · {formatPrice(item.price)}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  {bookingType === 'Tour' && (
                    <div className="row g-3 align-items-end">
                      <div className="col-md-7">
                        <label className="form-label small fw-bold text-secondary" htmlFor="booking-tour">Tour</label>
                        <select id="booking-tour" className="form-select" value={selectedTourId} onChange={event => {
                          setSelectedTourId(event.target.value)
                          setSelectedDepartureId('')
                          setTourSchedule(null)
                        }}>
                          <option value="">Choose a tour</option>
                          {tours.map(tour => <option key={tour.id} value={tour.id}>{tour.title}</option>)}
                        </select>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label small fw-bold text-secondary" htmlFor="booking-departure">Departure</label>
                        <select id="booking-departure" className="form-select" value={selectedDepartureId}
                          disabled={!tourDepartures.some(item => item.seatsLeft > 0)}
                          onChange={event => setSelectedDepartureId(event.target.value)}>
                          <option value="">{!selectedTourId ? 'Choose a tour first' : !tourSchedule
                            ? 'Loading departures…' : !tourDepartures.length ? 'No upcoming departures' : 'Choose a departure'}</option>
                          {tourDepartures.map(item => <option key={item.tourDepartureId} value={item.tourDepartureId}
                            disabled={item.seatsLeft <= 0}>
                            {item.departureDate}{item.departureTime ? ' ' + item.departureTime.slice(0, 5) : ''} – {item.returnDate} · {item.seatsLeft > 0 ? item.seatsLeft + ' seats left' : 'Sold out'}
                          </option>)}
                        </select>
                        {tourSchedule?.error && <p className="text-danger small mt-2 mb-0" role="alert">{tourSchedule.error}</p>}
                      </div>
                    </div>
                  )}

                  {isTransport && (
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-bold text-secondary" htmlFor="booking-transport-mode">Transport type</label>
                        <select id="booking-transport-mode" className="form-select" value={transportMode} onChange={event => {
                          setSelectedMode(event.target.value)
                          setSelectedRouteId('')
                          setSelectedScheduleId('')
                        }}>
                          <option value="bus">Bus / Limousine</option>
                          <option value="flight">Flight</option>
                          <option value="train">Train</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary">
                          Travel Route
                        </label>
                        <select
                          className="form-select"
                          value={routeId ?? ''}
                          disabled={!routes.length}
                          onChange={(e) => {
                            setSelectedScheduleId('')
                            setSelectedRouteId(e.target.value)
                          }}
                        >
                          {!routes.length && <option value="">{loadingSchedules ? 'Loading routes…' : 'No routes for this transport type'}</option>}
                          {routes.map((r) => (
                            <option key={r.routeId} value={r.routeId}>
                              {r.departureLocationName} ➔ {r.destinationLocationName}
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
                          value={schedule?.scheduleId ?? ''}
                          onChange={(e) => setSelectedScheduleId(e.target.value)}
                          disabled={loadingSchedules || !routeSchedules.length}
                        >
                          {!schedule && <option value="">{loadingSchedules ? 'Loading…' : routeSchedules.length ? 'Select a departure' : 'No schedules'}</option>}
                          {routeSchedules.map((s) => (
                            <option key={s.scheduleId} value={s.scheduleId} disabled={s.remainingSeats === 0}>
                              {s.departureTime?.slice(0, 5)} · {s.vehicleName} · {formatPrice(s.ticketPrice)}{s.remainingSeats != null ? ' · ' + s.remainingSeats + ' seats left' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {isTour ? (
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small" htmlFor="booking-adults">Adults (18+)</label>
                      <input id="booking-adults" className="form-control" type="number" min="1" max="30" required
                        value={adults || ''} onChange={event => setAdults(Number(event.target.value))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold small" htmlFor="booking-children">Children (2–17)</label>
                      <select id="booking-children" className="form-select" value={childAges.length} onChange={event => {
                        const count = Number(event.target.value)
                        setChildAges(ages => Array.from({ length: count }, (_, index) => ages[index] ?? ''))
                      }}>
                        {Array.from({ length: 30 }, (_, count) => <option key={count} value={count}>{count}</option>)}
                      </select>
                    </div>
                    {childAges.map((age, index) => (
                      <div className="col-md-4" key={index}>
                        <label className="form-label small fw-bold" htmlFor={`booking-child-age-${index}`}>Child {index + 1} age at departure</label>
                        <select id={`booking-child-age-${index}`} className="form-select" value={age} required
                          onChange={event => {
                            const value = event.target.value
                            setChildAges(ages => ages.map((previous, i) => i === index ? value : previous))
                          }}>
                          <option value="">Select age</option>
                          {Array.from({ length: 16 }, (_, offset) => <option key={offset} value={offset + 2}>{offset + 2}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                ) : (
                <>
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
                      min={today}
                      onChange={(e) => {
                        setSchedules([])
                        setStartDate(e.target.value)
                      }}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-dark small">
                      <i className="bi bi-people-fill me-1 text-primary"></i> {bookingType === 'Transport' ? 'Number of tickets' : bookingType === 'Dining' ? 'Number of options' : 'Number of rooms (one night)'}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="30"
                      value={totalPassengers}
                      onChange={(e) => setTotalPassengers(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                </>)}
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
                  {noPaymentDue ? 'No payment due' : 'Payment Preference'}
                </h4>

                {noPaymentDue ? (
                  <p className="text-muted mb-4" role="status">
                    {bookingType === 'Dining' && unitPrice === 0
                      ? 'There is no fee to reserve this table. Pay for food and drinks at the restaurant.'
                      : 'You can submit this reservation without making a payment.'}
                  </p>
                ) : <div className="d-flex flex-column gap-2 mb-4">
                  {[
                    ['PayPalSandbox', 'PayPal Sandbox', canPayPal ? 'Test checkout in USD' : !user ? 'Sign in to use PayPal' : !paypalOptions?.enabled ? 'Currently unavailable' : 'Available for a positive balance'],
                    ['BankTransfer', 'Bank transfer', 'Instructions after confirmation'],
                    ['PayAfterConfirmation', 'Pay after confirmation', 'No upfront charge'],
                  ].map(([method, label, description]) => (
                    <label key={method} className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${chosenMethod === method ? 'border-primary bg-light' : ''}`}>
                      <span className="d-flex align-items-center gap-2">
                        <input type="radio" name="payMethod" value={method} checked={chosenMethod === method}
                          disabled={method === 'PayPalSandbox' && !canPayPal || method === 'BankTransfer' && grandTotal <= 0} onChange={() => setPaymentMethod(method)} />
                        <span className="fw-semibold text-dark">{label}</span>
                      </span>
                      <span className="text-muted small">{description}</span>
                    </label>
                  ))}
                </div>}

                {!user && <p><Link to="/login" state={{ returnTo: location.pathname + '?' + returnParams }}>Sign in</Link> to save your reservation.</p>}
                {validSelection && !validQuantity && <p className="text-danger" role="status">The selected option does not have enough availability for this quantity.</p>}
                <button
                  type="submit"
                  disabled={loading || !validSelection || !validQuantity || !validChildAges || !user}
                  className="ktg-btn-teal w-100 justify-content-center py-3 fs-5"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span> Confirming...
                    </>
                  ) : (
                    <>
                      <i className={noPaymentDue ? 'bi bi-calendar-check' : 'bi bi-shield-lock-fill'} aria-hidden="true" />
                      {noPaymentDue
                        ? bookingType === 'Dining' ? 'Reserve table' : 'Confirm Reservation'
                        : 'Confirm Reservation (' + formatPrice(grandTotal) + ')'}
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
                  {bookingType === 'Tour' ? selectedTour?.title || 'Choose a tour' : bookingType === 'Transport'
                    ? schedule?.vehicleName || 'Transport ticket' : selectedItemName || 'Choose an option'}
                </h5>
                {bookingDate && <span className="text-muted small">
                  <i className="bi bi-calendar3 me-1"></i> Date: {bookingDate}{isTour && departure?.departureTime ? ' · ' + departure.departureTime.slice(0, 5) : ''}
                </span>}
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
                    <button type="submit" disabled={checkingPromo} className="btn btn-sm btn-outline-primary">
                      Apply
                    </button>
                  </form>
                )}
                {promoError && <div className="text-danger small mt-1">{promoError}</div>}
              </div>

              {/* Price rows */}
              <div className="small text-secondary mb-3">
                {isTour ? <>
                  <div className="d-flex justify-content-between py-1">
                    <span>Adults × {adults}</span><strong>{departure ? formatPrice(departure.adultPrice * adults) : '—'}</strong>
                  </div>
                  {childAges.length > 0 && <div className="d-flex justify-content-between py-1">
                    <span>Children × {childAges.length}</span><strong>{departure ? formatPrice(departure.childPrice * childAges.length) : '—'}</strong>
                  </div>}
                </> : <div className="d-flex justify-content-between py-1">
                  <span>Unit Price:</span>
                  <span className="text-dark fw-semibold">{validSelection ? formatPrice(unitPrice) : '—'}</span>
                </div>}
                <div className="d-flex justify-content-between py-1">
                  <span>Quantity / Persons:</span>
                  <span className="text-dark fw-semibold">x {quantity}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span>Subtotal:</span>
                  <span className="text-dark fw-semibold">{validSelection ? formatPrice(subtotal) : '—'}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between py-1 text-success fw-bold">
                    <span>Discount:</span>
                    <span>- {formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between py-1">
                  <span>Payment method</span>
                  <span className="fw-semibold">{noPaymentDue ? 'No payment due' : paymentLabels[chosenMethod]}</span>
                </div>
              </div>

              <div className="border-top pt-3 d-flex justify-content-between align-items-end mb-4">
                <div>
                  <span className="small text-muted d-block">Grand Total</span>
                  <div className="ktg-serif-title fs-3 text-primary mb-0">
                    {validSelection ? formatPrice(grandTotal) : '—'}
                  </div>
                </div>
                <span className="badge bg-light text-secondary border">VND</span>
              </div>

              <div className="text-muted small">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-shield-check text-success fs-5"></i>
                  <span>See booking terms before paying</span>
                </div>
                {!noPaymentDue && <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-lock-fill text-primary fs-5"></i>
                  <span>Online payment is handled by PayPal</span>
                </div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
