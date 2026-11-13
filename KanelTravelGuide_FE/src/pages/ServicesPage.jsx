// CN06, CN07, CN08: Hotels, Restaurants, and Resorts Directory
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getServices, getLocations } from '../api/servicesApi.js'
import './pages.css'

export default function ServicesPage({ defaultType = '' }) {
  const location = useLocation()
  
  // Determine active category from defaultType or path
  const currentPath = location.pathname.toLowerCase()
  let initialType = defaultType
  if (!initialType) {
    if (currentPath.includes('hotel')) initialType = 'Hotel'
    else if (currentPath.includes('restaurant')) initialType = 'Restaurant'
    else if (currentPath.includes('resort')) initialType = 'Resort'
  }

  const [activeType, setActiveType] = useState(initialType)
  const [locationsList, setLocationsList] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [starRating, setStarRating] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getLocations()
      .then((data) => setLocationsList(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (initialType) setActiveType(initialType)
  }, [initialType])

  useEffect(() => {
    loadServices()
  }, [activeType, selectedLocation, starRating])

  async function loadServices() {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (activeType) params.type = activeType
      if (selectedLocation) params.locationId = selectedLocation
      if (starRating) params.starRating = starRating
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (searchKeyword.trim()) params.q = searchKeyword.trim()

      const data = await getServices(params)
      setServices(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load services.')
    } finally {
      setLoading(false)
    }
  }

  function handleFilterSubmit(e) {
    e.preventDefault()
    loadServices()
  }

  function formatPrice(num) {
    if (num == null) return 'N/A'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="fw-bold">
          {activeType === 'Hotel' && 'Hotels & Accommodations'}
          {activeType === 'Restaurant' && 'Restaurants & Dining'}
          {activeType === 'Resort' && 'Resorts & Retreats'}
          {!activeType && 'Stay & Dining Services'}
        </h1>
        <p className="text-muted">
          Discover top-rated places to stay and dine with high quality and transparent pricing.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="d-flex justify-content-center mb-4">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${!activeType ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveType('')}
          >
            All Services
          </button>
          <button
            type="button"
            className={`btn ${activeType === 'Hotel' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveType('Hotel')}
          >
            <i className="bi bi-building me-1"></i> Hotels
          </button>
          <button
            type="button"
            className={`btn ${activeType === 'Restaurant' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveType('Restaurant')}
          >
            <i className="bi bi-cup-hot me-1"></i> Restaurants
          </button>
          <button
            type="button"
            className={`btn ${activeType === 'Resort' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveType('Resort')}
          >
            <i className="bi bi-tree me-1"></i> Resorts
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleFilterSubmit} className="card p-3 mb-4 shadow-sm border-0 bg-light">
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-semibold text-secondary">Search Name or Address</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. Grand Hotel, Da Nang..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label small fw-semibold text-secondary">Location</label>
            <select
              className="form-select form-select-sm"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">All Destinations</option>
              {locationsList.map((loc) => (
                <option key={loc.locationId} value={loc.locationId}>
                  {loc.locationName} ({loc.region})
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold text-secondary">Minimum Rating</label>
            <select
              className="form-select form-select-sm"
              value={starRating}
              onChange={(e) => setStarRating(e.target.value)}
            >
              <option value="">Any Rating</option>
              <option value="5">★★★★★ (5 Stars)</option>
              <option value="4">★★★★☆ (4+ Stars)</option>
              <option value="3">★★★☆☆ (3+ Stars)</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold text-secondary">Max Budget (VND)</label>
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="e.g. 2000000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
          <div className="col-md-2 d-grid">
            <button type="submit" className="btn btn-sm btn-primary">
              <i className="bi bi-funnel me-1"></i> Filter
            </button>
          </div>
        </div>
      </form>

      {/* Content State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading providers...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {!loading && !error && services.length === 0 && (
        <div className="text-center py-5 bg-white rounded shadow-sm">
          <i className="bi bi-search text-muted display-4"></i>
          <h4 className="mt-3">No matching services found</h4>
          <p className="text-muted">Try adjusting your filters or search keyword.</p>
        </div>
      )}

      {/* Service Cards Grid */}
      {!loading && !error && services.length > 0 && (
        <div className="row g-4">
          {services.map((item) => (
            <div key={item.providerId} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm border-0 overflow-hidden">
                <div style={{ height: '200px', backgroundColor: '#e9ecef', position: 'relative' }}>
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                    alt={item.providerName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'
                    }}
                  />
                  <span
                    className="badge bg-dark bg-opacity-75 position-absolute top-0 end-0 m-2 text-capitalize"
                  >
                    {item.serviceType}
                  </span>
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0 fw-bold">{item.providerName}</h5>
                  </div>

                  <div className="text-warning mb-2 small">
                    {Array.from({ length: item.starRating || 0 }).map((_, i) => (
                      <i key={i} className="bi bi-star-fill me-1"></i>
                    ))}
                    <span className="text-muted ms-1">({item.starRating} / 5)</span>
                  </div>

                  <p className="card-text text-muted small mb-2">
                    <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                    {item.locationName} — {item.address}
                  </p>

                  {item.phone && (
                    <p className="card-text text-muted small mb-3">
                      <i className="bi bi-telephone-fill text-secondary me-1"></i>
                      {item.phone}
                    </p>
                  )}

                  <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted small d-block">Price range</span>
                      <strong className="text-primary">
                        {item.minPrice ? formatPrice(item.minPrice) : 'Contact'}
                        {item.maxPrice ? ` - ${formatPrice(item.maxPrice)}` : ''}
                      </strong>
                    </div>
                    <Link
                      to={`/services/${item.providerId}`}
                      className="btn btn-outline-primary btn-sm px-3"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
