// CN06, CN07, CN08: Details page for Hotel, Restaurant, or Resort
// Maintained by Tiến (recca279)
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getServiceById } from '../api/servicesApi.js'
import '../styles/services.css'
import './pages.css'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [provider, setProvider] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getServiceById(id)
      .then((data) => {
        setProvider(data)
        if (data?.gallery && data.gallery.length > 0) {
          setSelectedPhoto(data.gallery[0])
        } else if (data?.imageUrl) {
          setSelectedPhoto(data.imageUrl)
        }
      })
      .catch((err) => setError(err.message || 'Service provider not found.'))
      .finally(() => setLoading(false))
  }, [id])

  function formatPrice(num) {
    if (num == null || num === 0) return 'Contact for price'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  function handleBookItem(item) {
    navigate(
      `/booking?type=Accommodation&serviceItemId=${item.itemId}&itemName=${encodeURIComponent(
        item.itemName || item.ItemName
      )}&unitPrice=${item.price}&providerName=${encodeURIComponent(
        provider.providerName
      )}&providerId=${provider.providerId}`
    )
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

  const galleryImages =
    provider.gallery && provider.gallery.length > 0
      ? provider.gallery
      : [
          provider.imageUrl ||
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'
        ]

  const amenitiesList =
    provider.amenities && provider.amenities.length > 0
      ? provider.amenities
      : [
          'High-Speed Wi-Fi',
          'Complimentary Breakfast',
          'Infinity Swimming Pool',
          'Luxury Spa & Wellness',
          'Airport Shuttle Service',
          '24/7 Concierge Desk'
        ]

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
                  {Array.from({ length: provider.starRating || 5 }).map((_, i) => (
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
                <div className="fw-bold text-dark">Exceptional</div>
                <div className="small text-muted">{provider.reviewCount || 240} verified reviews</div>
              </div>
              <div
                className="bg-primary text-white fw-bold d-flex align-items-center justify-content-center rounded-3 shadow-sm"
                style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}
              >
                {provider.reviewScore || 9.4}
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
                  <img src={img} alt={`Preview ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Booking / Summary Card */}
          <div className="col-lg-4">
            <div className="ktg-card h-100 d-flex flex-column justify-content-between p-4">
              <div>
                <span className="ktg-eyebrow">Price Guarantee</span>
                <h4 className="ktg-serif-title mb-3">Best Rate Available</h4>
                <div className="mb-3">
                  <span className="text-muted small d-block">Indicative rate from</span>
                  <span className="h2 fw-bold text-primary mb-0">
                    {formatPrice(provider.minPrice)}
                  </span>
                  <span className="text-muted small"> / unit / night</span>
                </div>

                <div className="border-top pt-3 mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2 text-success small fw-semibold">
                    <i className="bi bi-shield-check fs-5"></i> 100% Verified by Karnel Travels
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2 text-success small fw-semibold">
                    <i className="bi bi-clock-history fs-5"></i> Instant Reservation Confirmation
                  </div>
                  <div className="d-flex align-items-center gap-2 text-success small fw-semibold">
                    <i className="bi bi-calendar-check fs-5"></i> Free Cancellation Options
                  </div>
                </div>
              </div>

              <a href="#rooms-section" className="ktg-btn-teal w-100 justify-content-center py-3">
                <i className="bi bi-calendar-week"></i> Select Rooms & Reserve
              </a>
            </div>
          </div>
        </div>

        {/* Highlights & Amenities */}
        <div className="mb-5">
          <span className="ktg-eyebrow">Property Amenities</span>
          <h3 className="ktg-serif-title mb-4">Key Facilities & Services</h3>
          <div className="row g-3">
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
            {provider.description ||
              `${provider.providerName} is a premier destination located in the heart of ${provider.locationName}. Equipped with state-of-the-art facilities, elegant decor, and warm hospitality, we provide travelers with an unforgettable retreat.`}
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
              <p className="text-muted small mb-0">Select your preferred unit to proceed with booking.</p>
            </div>
          </div>

          {!provider.items || provider.items.length === 0 ? (
            <div className="ktg-card text-center py-5">
              <i className="bi bi-info-circle text-muted" style={{ fontSize: '2.5rem' }}></i>
              <h5 className="mt-3">No specific rooms listed online</h5>
              <p className="text-muted small mb-3">
                Please contact the property directly via phone at {provider.phone || 'our helpline'} for immediate booking.
              </p>
              <button
                type="button"
                className="ktg-btn-navy"
                onClick={() =>
                  navigate(
                    `/booking?type=Accommodation&itemName=${encodeURIComponent(
                      provider.providerName
                    )}&unitPrice=${provider.minPrice || 1500000}&providerName=${encodeURIComponent(
                      provider.providerName
                    )}`
                  )
                }
              >
                Inquire & Book Now
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {provider.items.map((item) => (
                <div key={item.itemId} className="col-lg-4 col-md-6">
                  <div className="ktg-room-card h-100">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h4 className="ktg-serif-title mb-0" style={{ fontSize: '1.25rem' }}>
                          {item.itemName || item.ItemName}
                        </h4>
                        <span
                          className={`badge ${
                            item.isAvailable !== false ? 'bg-success' : 'bg-secondary'
                          }`}
                        >
                          {item.isAvailable !== false ? 'Available' : 'Sold Out'}
                        </span>
                      </div>

                      <div className="text-muted small mb-3">
                        <div className="mb-1">
                          <i className="bi bi-people-fill text-primary me-2"></i> Max Guests:{' '}
                          <strong>{item.capacity || 2} Persons</strong>
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

                      <div className="bg-light p-2 rounded-3 small mb-3">
                        <div className="text-success fw-semibold mb-1">
                          <i className="bi bi-check-circle-fill me-1"></i> Free Wi-Fi & Breakfast
                        </div>
                        <div className="text-success fw-semibold">
                          <i className="bi bi-check-circle-fill me-1"></i> Free cancellation up to 48h
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                      <div>
                        <span className="small text-muted d-block" style={{ fontSize: '0.72rem' }}>
                          Price per night
                        </span>
                        <div className="fw-bold text-primary fs-5">{formatPrice(item.price)}</div>
                      </div>
                      <button
                        type="button"
                        disabled={item.isAvailable === false}
                        className="ktg-btn-teal"
                        onClick={() => handleBookItem(item)}
                      >
                        Book Now
                      </button>
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
              <ul className="list-unstyled mb-0 small text-secondary">
                <li className="mb-2 pb-2 border-bottom d-flex justify-content-between">
                  <strong>Check-in Time:</strong> <span>14:00 onwards</span>
                </li>
                <li className="mb-2 pb-2 border-bottom d-flex justify-content-between">
                  <strong>Check-out Time:</strong> <span>Until 12:00</span>
                </li>
                <li className="mb-2 pb-2 border-bottom d-flex justify-content-between">
                  <strong>Cancellation:</strong> <span>Free cancellation up to 48 hours prior</span>
                </li>
                <li className="d-flex justify-content-between">
                  <strong>Children & Extra Beds:</strong> <span>Children under 6 stay free of charge</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="ktg-card p-4 h-100">
              <span className="ktg-eyebrow">Verified Guest Feedback</span>
              <h4 className="ktg-serif-title mb-3">Recent Reviews</h4>
              <div className="mb-3 pb-3 border-bottom">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong className="text-dark">Minh Anh T.</strong>
                  <span className="badge bg-success">10/10</span>
                </div>
                <p className="text-muted small mb-0">
                  "Exceeded our expectations! The service was immaculate, rooms were spotless with breathtaking views. We will definitely return!"
                </p>
              </div>
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong className="text-dark">David Miller</strong>
                  <span className="badge bg-success">9.5/10</span>
                </div>
                <p className="text-muted small mb-0">
                  "Prime location and friendly staff. Breakfast buffet had a fantastic variety of both Western and Vietnamese delicacies."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
