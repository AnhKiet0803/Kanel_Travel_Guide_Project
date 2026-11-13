// CN06, CN07, CN08: Details page for Hotel, Restaurant, or Resort
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getServiceById } from '../api/servicesApi.js'
import './pages.css'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getServiceById(id)
      .then((data) => setProvider(data))
      .catch((err) => setError(err.message || 'Service provider not found.'))
      .finally(() => setLoading(false))
  }, [id])

  function formatPrice(num) {
    if (num == null) return 'N/A'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  function handleBookItem(item) {
    navigate(
      `/booking?type=Accommodation&serviceItemId=${item.itemId}&itemName=${encodeURIComponent(
        item.itemName
      )}&unitPrice=${item.price}&providerName=${encodeURIComponent(provider.providerName)}`
    )
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading service details...</p>
      </div>
    )
  }

  if (error || !provider) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || 'Service not found'}
        </div>
        <Link to="/hotels" className="btn btn-outline-primary">
          <i className="bi bi-arrow-left me-1"></i> Back to Services
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/${provider.serviceType.toLowerCase()}s`}>
              {provider.serviceType}s
            </Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {provider.providerName}
          </li>
        </ol>
      </nav>

      {/* Main Info Card */}
      <div className="card border-0 shadow-sm overflow-hidden mb-4">
        <div className="row g-0">
          <div className="col-lg-6" style={{ minHeight: '360px', backgroundColor: '#e9ecef' }}>
            <img
              src={
                provider.imageUrl ||
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
              }
              alt={provider.providerName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
              }}
            />
          </div>

          <div className="col-lg-6 p-4 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary text-uppercase px-2 py-1">
                  {provider.serviceType}
                </span>
                <span className="badge bg-secondary">
                  <i className="bi bi-geo-alt me-1"></i>
                  {provider.locationName}
                </span>
              </div>

              <h2 className="fw-bold mb-2">{provider.providerName}</h2>

              <div className="text-warning mb-3">
                {Array.from({ length: provider.starRating || 0 }).map((_, i) => (
                  <i key={i} className="bi bi-star-fill me-1"></i>
                ))}
                <span className="text-muted ms-1">({provider.starRating} Stars)</span>
              </div>

              <div className="mb-3 text-secondary small">
                <p className="mb-1">
                  <i className="bi bi-pin-map-fill text-danger me-2"></i>
                  <strong>Address:</strong> {provider.address}
                </p>
                {provider.phone && (
                  <p className="mb-1">
                    <i className="bi bi-telephone-fill text-success me-2"></i>
                    <strong>Phone:</strong> {provider.phone}
                  </p>
                )}
                {provider.website && (
                  <p className="mb-1">
                    <i className="bi bi-globe me-2 text-info"></i>
                    <strong>Website:</strong>{' '}
                    <a href={provider.website} target="_blank" rel="noreferrer" className="text-decoration-none">
                      {provider.website}
                    </a>
                  </p>
                )}
              </div>

              {provider.description && (
                <div className="mt-3">
                  <h6 className="fw-bold text-dark">About this place</h6>
                  <p className="text-muted small" style={{ whiteSpace: 'pre-line' }}>
                    {provider.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-top d-flex justify-content-between align-items-center">
              <div>
                <span className="small text-muted d-block">Indicative Price</span>
                <span className="h5 text-primary fw-bold mb-0">
                  {provider.minPrice ? formatPrice(provider.minPrice) : 'Contact'}
                  {provider.maxPrice ? ` - ${formatPrice(provider.maxPrice)}` : ''}
                </span>
              </div>
              <a href="#available-items" className="btn btn-primary">
                <i className="bi bi-calendar2-check me-1"></i> Select Room / Table
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Available Items (Rooms / Tables / Menus) */}
      <div id="available-items" className="card border-0 shadow-sm p-4 mb-4">
        <h4 className="fw-bold mb-3">
          Available {provider.serviceType === 'Hotel' || provider.serviceType === 'Resort' ? 'Rooms & Suites' : 'Tables & Menus'}
        </h4>

        {!provider.items || provider.items.length === 0 ? (
          <div className="alert alert-light border text-muted">
            <i className="bi bi-info-circle me-2"></i>
            No specific rooms or tables listed yet. Please contact the provider directly at {provider.phone || 'our helpline'}.
          </div>
        ) : (
          <div className="row g-3">
            {provider.items.map((item) => (
              <div key={item.itemId} className="col-md-6 col-lg-4">
                <div className="card h-100 border p-3 rounded-3 shadow-none bg-light d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-bold mb-0 text-dark">{item.ItemName || item.itemName}</h5>
                      <span
                        className={`badge ${
                          item.isAvailable !== false ? 'bg-success' : 'bg-secondary'
                        }`}
                      >
                        {item.isAvailable !== false ? 'Available' : 'Booked'}
                      </span>
                    </div>

                    <p className="small text-muted mb-2">
                      <i className="bi bi-people me-1"></i> Capacity:{' '}
                      <strong>{item.capacity || 2} persons</strong>
                    </p>
                    {item.totalQuantity && (
                      <p className="small text-muted mb-2">
                        <i className="bi bi-box-seam me-1"></i> Total units: {item.totalQuantity}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-top d-flex justify-content-between align-items-center mt-3">
                    <span className="fw-bold text-primary">
                      {formatPrice(item.price)}
                    </span>
                    <button
                      type="button"
                      disabled={item.isAvailable === false}
                      className="btn btn-sm btn-outline-primary"
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
    </div>
  )
}
