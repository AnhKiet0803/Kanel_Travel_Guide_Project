// CN06, CN07, CN08: Details page for Hotel, Restaurant, or Resort
// Maintained by Tiến (recca279)
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getServiceById } from '../api/servicesApi.js'
import { fallbackServiceImage, serviceIllustration } from '../components/home/HomeData.js'
import '../styles/services.css'
import './pages.css'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const stayDate = searchParams.get('date')
  const guests = Number(searchParams.get('guests'))
  const navigate = useNavigate()
  const [provider, setProvider] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    setError(null)
    setSelectedPhoto('')
    getServiceById(id, stayDate ? { date: stayDate } : undefined)
      .then((data) => {
        if (!active) return
        setProvider(data)
        if (data?.gallery && data.gallery.length > 0) {
          setSelectedPhoto(data.gallery[0])
        } else if (data?.imageUrl) {
          setSelectedPhoto(data.imageUrl)
        }
      })
      .catch((err) => { if (active) setError(err.message || 'Service provider not found.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, stayDate])

  function formatPrice(num) {
    if (num == null || num === 0) return 'Contact for price'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  function handleBookItem(item) {
    const params = new URLSearchParams({ type: provider.serviceType === 'Restaurant' ? 'Dining' : 'Accommodation',
      serviceItemId: item.itemId, providerId: provider.providerId })
    if (stayDate) params.set('date', stayDate)
    navigate('/booking?' + params)
  }

  if (loading) {
    return (
      <div className="ktg-services-wrapper d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status"></div>
          <p className="mt-3 text-muted fw-semibold">Loading service details...</p>
        </div>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger rounded-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || 'Service provider not found.'}
        </div>
        <Link to="/hotels" className="ktg-btn-navy">
          <i className="bi bi-arrow-left"></i> Back to Directory
        </Link>
      </div>
    )
  }

  const isDining = provider.serviceType === 'Restaurant'
  const items = provider.items?.filter(item => isDining || !guests || item.capacity == null || item.capacity >= guests) ?? []
  const galleryImages = [provider.imageUrl || serviceIllustration(provider.serviceType)]
  const amenitiesList = provider.amenities ?? []

  return (
    <div className="ktg-services-wrapper py-4">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none text-muted">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link
                to={`/${provider.serviceType.toLowerCase()}s`}
                className="text-decoration-none text-muted"
              >
                {provider.serviceType}s
              </Link>
            </li>
            <li className="breadcrumb-item active text-dark fw-semibold" aria-current="page">
              {provider.providerName}
            </li>
          </ol>
        </nav>

        {/* Top Header Card */}
        <div className="ktg-detail-header">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary px-3 py-2 text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                  {provider.serviceType}
                </span>
                <span className="badge bg-light text-secondary border px-3 py-2">
                  <i className="bi bi-geo-alt-fill text-danger me-1"></i> {provider.locationName}
                </span>
                <div className="ktg-stars ms-2">
                  {Array.from({ length: provider.starRating || 0 }).map((_, i) => (
                    <i key={i} className="bi bi-star-fill text-warning"></i>
                  ))}
                </div>
              </div>

              <h1 className="ktg-serif-title mb-2" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
                {provider.providerName}
              </h1>

              <div className="text-muted d-flex flex-wrap align-items-center gap-3 small">
                <span>
                  <i className="bi bi-pin-map-fill text-danger me-1"></i>
                  {provider.address}
                </span>
                {provider.phone && (
                  <span>
                    <i className="bi bi-telephone-fill text-success me-1"></i>
                    <a href={`tel:${provider.phone}`} className="text-decoration-none text-muted">
                      {provider.phone}
                    </a>
                  </span>
                )}
                {provider.website && (
                  <span>
                    <i className="bi bi-globe me-1 text-primary"></i>
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-decoration-none text-primary fw-semibold"
                    >
                      Visit Website <i className="bi bi-box-arrow-up-right small"></i>
                    </a>
                  </span>
                )}
              </div>
            </div>

            {/* Rating Score Badge */}
            <div className="d-flex align-items-center gap-3 bg-light p-3 rounded-4 border">
              <div className="text-end">
                <div className="fw-bold text-dark">Provider rating</div>
              </div>
              <div
                className="bg-primary text-white fw-bold d-flex align-items-center justify-content-center rounded-3 shadow-sm"
                style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
              >
                {provider.starRating ? provider.starRating + '★' : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="row g-3 mb-5">
          <div className="col-lg-8">
            <div className="ktg-gallery-main">
              <img
                src={selectedPhoto || galleryImages[0]}
                alt={provider.providerName}
                onError={event => fallbackServiceImage(event, provider.serviceType)}
                onError={(e) => {
                  e.target.src =
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
                }}
              />
            </div>
            {/* Thumbnails */}
            <div className="ktg-thumb-grid">
              {galleryImages.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className={`ktg-thumb-item ${selectedPhoto === img ? 'active' : ''}`}
                  onClick={() => setSelectedPhoto(img)}
                >
                  <img src={img} alt={`Preview ${idx + 1}`} onError={event => fallbackServiceImage(event, provider.serviceType)} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Booking / Summary Card */}
          <div className="col-lg-4">
            <div className="ktg-card h-100 d-flex flex-column justify-content-between p-4">
              <div>
                <span className="ktg-eyebrow">Service rates</span>
                <h4 className="ktg-serif-title mb-3">Book with Karnel Travels</h4>
                <div className="mb-3">
                  <span className="text-muted small d-block">Indicative rate from</span>
                  <span className="h2 fw-bold text-primary mb-0">
                    {formatPrice(provider.minPrice)}
                  </span>
                  <span className="text-muted small"> {isDining ? '/ option' : '/ night'}</span>
                </div>

                <div className="border-top pt-3 mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2 text-success small fw-semibold">
                    <i className="bi bi-shield-check fs-5"></i> Reservation saved with a booking reference
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2 text-success small fw-semibold">
                    <i className="bi bi-clock-history fs-5"></i> Payment and confirmation status in My Bookings
                  </div>
                  <div className="d-flex align-items-center gap-2 text-success small fw-semibold">
                    <i className="bi bi-calendar-check fs-5"></i> Contact the provider for cancellation terms
                  </div>
                </div>
              </div>

              <a href="#rooms-section" className="ktg-btn-teal w-100 justify-content-center py-3">
                <i className="bi bi-calendar-week"></i> {isDining ? 'Select a dining option' : 'Select a room'}
              </a>
            </div>
          </div>
        </div>

        {/* Highlights & Amenities */}
        <div className="mb-5">
          <span className="ktg-eyebrow">Property Amenities</span>
          <h3 className="ktg-serif-title mb-4">Key Facilities & Services</h3>
          <div className="row g-3">
            {!amenitiesList.length && <p className="small text-muted mb-0">Contact the provider for facilities and services.</p>}
            {amenitiesList.map((amenity, index) => (
              <div key={index} className="col-md-4 col-sm-6">
                <div className="ktg-amenity-card">
                  <div className="ktg-amenity-icon">
                    <i className="bi bi-patch-check-fill"></i>
                  </div>
                  <span>{amenity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Description */}
        <div className="ktg-card p-4 p-md-5 mb-5">
          <span className="ktg-eyebrow">Overview</span>
          <h3 className="ktg-serif-title mb-3">About {provider.providerName}</h3>
          <p className="text-secondary leading-relaxed" style={{ fontSize: '1.05rem', lineHeight: '1.75' }}>
            {provider.description || 'Contact the provider for details.'}
          </p>
        </div>

        {/* Available Rooms / Tables Selection Section */}
        <div id="rooms-section" className="mb-5">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <span className="ktg-eyebrow">Availability</span>
              <h3 className="ktg-serif-title mb-1">
                {provider.serviceType === 'Hotel' || provider.serviceType === 'Resort'
                  ? 'Available Rooms & Luxury Suites'
                  : 'Available Tables & Menus'}
              </h3>
              <p className="text-muted small mb-0">{stayDate ? 'Check-in ' + stayDate + (guests ? ' · ' + guests + ' guest(s)' : '') : 'Select your preferred unit to proceed with booking.'}</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="ktg-card text-center py-5">
              <i className="bi bi-info-circle text-muted" style={{ fontSize: '2.5rem' }}></i>
              <h5 className="mt-3">No bookable options listed online</h5>
              <p className="text-muted small mb-3">
                Please contact the property directly via phone at {provider.phone || 'our helpline'} for immediate booking.
              </p>
              {provider.phone && <a className="ktg-btn-navy" href={'tel:' + provider.phone}>Contact provider</a>}
            </div>
          ) : (
            <div className="row g-4">
              {items.map((item) => (
                <div key={item.itemId} className="col-lg-4 col-md-6">
                  <div className="ktg-room-card h-100">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h4 className="ktg-serif-title mb-0" style={{ fontSize: '1.25rem' }}>
                          {item.itemName || item.ItemName}
                        </h4>
                        <span
                          className={`badge ${
                            item.isAvailable && (item.remainingQuantity ?? item.totalQuantity) > 0 ? 'bg-success' : 'bg-secondary'
                          }`}
                        >
                          {!item.isAvailable ? 'Check with provider' : (item.remainingQuantity ?? item.totalQuantity) > 0 ? 'Available' : 'Sold Out'}
                        </span>
                      </div>

                      <div className="text-muted small mb-3">
                        <div className="mb-1">
                          <i className="bi bi-people-fill text-primary me-2"></i> Max Guests:{' '}
                          <strong>{item.capacity == null ? 'Ask provider' : item.capacity + ' persons'}</strong>
                        </div>
                        {item.bed && (
                          <div className="mb-1">
                            <i className="bi bi-moon-stars text-primary me-2"></i> Bed:{' '}
                            <strong>{item.bed}</strong>
                          </div>
                        )}
                        {item.size && (
                          <div>
                            <i className="bi bi-aspect-ratio text-primary me-2"></i> Area:{' '}
                            <strong>{item.size}</strong>
                          </div>
                        )}
                      </div>

                    </div>

                    <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                      <div>
                        <span className="small text-muted d-block" style={{ fontSize: '0.72rem' }}>
                          {isDining ? 'Price per option' : 'Price per night'}
                        </span>
                        <div className="fw-bold text-primary fs-5">{isDining && item.isAvailable && item.price === 0 ? 'No reservation fee' : formatPrice(item.price)}</div>
                      </div>
                      {!item.isAvailable && (provider.website || provider.phone) ? (
                        <a
                          className="ktg-btn-teal"
                          href={provider.website || 'tel:' + provider.phone}
                          target={provider.website ? '_blank' : undefined}
                          rel={provider.website ? 'noopener noreferrer' : undefined}
                        >
                          Contact provider
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled={!item.isAvailable || (item.remainingQuantity ?? item.totalQuantity) <= 0}
                          className="ktg-btn-teal"
                          onClick={() => handleBookItem(item)}
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Policies and Verified Reviews */}
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="ktg-card p-4 h-100">
              <span className="ktg-eyebrow">Good to Know</span>
              <h4 className="ktg-serif-title mb-3">Property Policies</h4>
              <p className="small text-secondary mb-0">Contact the provider for arrival times and cancellation terms.</p>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="ktg-card p-4 h-100">
              <span className="ktg-eyebrow">Guest Feedback</span>
              <h4 className="ktg-serif-title mb-3">Recent Reviews</h4>
              <p className="small text-muted mb-0">No guest reviews published.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
