// CN06, CN07, CN08: Hotels, Restaurants, and Resorts Directory
// Maintained by Tiến (recca279)
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getServices, getLocations } from '../api/servicesApi.js'
import '../styles/services.css'
import './pages.css'

export default function ServicesPage({ defaultType = '' }) {
  const location = useLocation()

  // Determine active category from defaultType or current path
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
  const [sortBy, setSortBy] = useState('recommended')

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
  }, [activeType, selectedLocation, starRating, sortBy])

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
      let list = Array.isArray(data) ? data : []

      // Client-side sorting
      if (sortBy === 'price-low') {
        list.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0))
      } else if (sortBy === 'price-high') {
        list.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0))
      } else if (sortBy === 'rating') {
        list.sort((a, b) => (b.starRating || 0) - (a.starRating || 0))
      }

      setServices(list)
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

  function handleResetFilters() {
    setSelectedLocation('')
    setStarRating('')
    setMinPrice('')
    setMaxPrice('')
    setSearchKeyword('')
    setSortBy('recommended')
  }

  function formatPrice(num) {
    if (num == null || num === 0) return 'Contact for price'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  const getPageTitle = () => {
    if (activeType === 'Hotel') return 'Hotels & Luxury Accommodations'
    if (activeType === 'Restaurant') return 'Restaurants & Fine Dining'
    if (activeType === 'Resort') return 'Resorts & Tropical Retreats'
    return 'Hotels, Dining & Luxury Resorts'
  }

  const getPageSubtitle = () => {
    if (activeType === 'Hotel')
      return 'Stay in handpicked boutique hotels and 5-star suites with stunning city & ocean views.'
    if (activeType === 'Restaurant')
      return 'Savor Michelin-standard cuisine, authentic local specialties, and romantic waterfront tables.'
    if (activeType === 'Resort')
      return 'Escape to tranquil private beachfronts, overwater villas, and world-class spa facilities.'
    return 'Explore Vietnam’s premier accommodations and gastronomy curated exclusively by Karnel Travels.'
  }

  return (
    <div className="ktg-services-wrapper">
      {/* Hero Header */}
      <section className="ktg-services-hero">
        <div className="container position-relative">
          <span className="ktg-eyebrow" style={{ color: '#5eead4' }}>
            Karnel Travels Exclusive
          </span>
          <h1>{getPageTitle()}</h1>
          <p>{getPageSubtitle()}</p>

          {/* Quick Category Tabs */}
          <div className="d-flex flex-wrap gap-2 pt-3">
            <button
              type="button"
              className={`ktg-pill-tab ${!activeType ? 'active' : ''}`}
              onClick={() => setActiveType('')}
            >
              <i className="bi bi-grid-fill"></i> All Stays & Dining
            </button>
            <button
              type="button"
              className={`ktg-pill-tab ${activeType === 'Hotel' ? 'active' : ''}`}
              onClick={() => setActiveType('Hotel')}
            >
              <i className="bi bi-building"></i> Hotels
            </button>
            <button
              type="button"
              className={`ktg-pill-tab ${activeType === 'Restaurant' ? 'active' : ''}`}
              onClick={() => setActiveType('Restaurant')}
            >
              <i className="bi bi-cup-hot-fill"></i> Restaurants
            </button>
            <button
              type="button"
              className={`ktg-pill-tab ${activeType === 'Resort' ? 'active' : ''}`}
              onClick={() => setActiveType('Resort')}
            >
              <i className="bi bi-water"></i> Resorts
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="container" style={{ marginTop: '16px' }}>
        {/* Floating Search & Filter Bar */}
        <div className="ktg-filter-card">
          <form onSubmit={handleFilterSubmit}>
            <div className="row g-3 align-items-end">
              <div className="col-lg-3 col-md-6">
                <label className="form-label small fw-bold text-secondary mb-1">
                  <i className="bi bi-search me-1 text-primary"></i> Keyword or Brand
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Karnel Beach, Madame Lan..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>

              <div className="col-lg-3 col-md-6">
                <label className="form-label small fw-bold text-secondary mb-1">
                  <i className="bi bi-geo-alt-fill me-1 text-danger"></i> Destination
                </label>
                <select
                  className="form-select"
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

              <div className="col-lg-2 col-md-4">
                <label className="form-label small fw-bold text-secondary mb-1">
                  <i className="bi bi-star-fill me-1 text-warning"></i> Rating
                </label>
                <select
                  className="form-select"
                  value={starRating}
                  onChange={(e) => setStarRating(e.target.value)}
                >
                  <option value="">Any Rating</option>
                  <option value="5">★★★★★ (5 Stars)</option>
                  <option value="4">★★★★☆ (4+ Stars)</option>
                  <option value="3">★★★☆☆ (3+ Stars)</option>
                </select>
              </div>

              <div className="col-lg-2 col-md-4">
                <label className="form-label small fw-bold text-secondary mb-1">
                  <i className="bi bi-cash-stack me-1 text-success"></i> Max Budget
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 3000000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              <div className="col-lg-2 col-md-4 d-flex gap-2">
                <button type="submit" className="ktg-btn-navy flex-grow-1 justify-content-center">
                  <i className="bi bi-funnel-fill"></i> Filter
                </button>
                {(selectedLocation || starRating || maxPrice || searchKeyword) && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    title="Reset filters"
                    onClick={handleResetFilters}
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Results Info & Sort Options */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
          <div>
            <h5 className="ktg-serif-title mb-1">
              Found {services.length} {activeType ? `${activeType.toLowerCase()}s` : 'places'}
            </h5>
            <span className="text-muted small">
              Real-time prices in VND • Complimentary breakfast & cancellation options available
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 mt-2 mt-sm-0">
            <span className="small text-muted fw-semibold">Sort by:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">Recommended & Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Guest Rating</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-semibold">Discovering exceptional stays and dining...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger shadow-sm rounded-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && services.length === 0 && (
          <div className="ktg-card text-center py-5">
            <i className="bi bi-building-slash text-muted" style={{ fontSize: '3.5rem' }}></i>
            <h4 className="ktg-serif-title mt-3">No matching properties found</h4>
            <p className="text-muted" style={{ maxWidth: '420px', margin: '0 auto 20px' }}>
              We couldn't find any services matching your specific criteria. Try adjusting your filters or resetting your search.
            </p>
            <button onClick={handleResetFilters} className="ktg-btn-navy">
              <i className="bi bi-arrow-repeat"></i> Reset All Filters
            </button>
          </div>
        )}

        {/* Service Cards Grid */}
        {!loading && !error && services.length > 0 && (
          <div className="row g-4">
            {services.map((item) => (
              <div key={item.providerId} className="col-md-6 col-lg-4">
                <div className="ktg-service-card">
                  {/* Card Media */}
                  <div className="ktg-card-media">
                    <img
                      src={
                        item.imageUrl ||
                        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={item.providerName}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
                      }}
                    />
                    <span className="ktg-badge-type">{item.serviceType}</span>
                    <span className="ktg-badge-rating">
                      <i className="bi bi-star-fill"></i>
                      <span>{item.reviewScore || 9.2}</span>
                      <small className="text-muted fw-normal">({item.reviewCount || 120})</small>
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="ktg-card-body">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="ktg-stars">
                        {Array.from({ length: item.starRating || 5 }).map((_, i) => (
                          <i key={i} className="bi bi-star-fill"></i>
                        ))}
                      </div>
                      <span className="badge bg-light text-secondary border">
                        {item.locationName}
                      </span>
                    </div>

                    <h3 className="ktg-card-title">
                      <Link to={`/services/${item.providerId}`}>{item.providerName}</Link>
                    </h3>

                    <div className="ktg-location-text">
                      <i className="bi bi-geo-alt-fill text-danger flex-shrink-0"></i>
                      <span className="text-truncate">{item.address}</span>
                    </div>

                    {/* Amenities Tags */}
                    <div className="ktg-tag-list">
                      {(item.amenities || ['Free Wi-Fi', 'Breakfast Included', 'Swimming Pool'])
                        .slice(0, 3)
                        .map((am, idx) => (
                          <span key={idx} className="ktg-tag">
                            <i className="bi bi-check2 text-success"></i> {am}
                          </span>
                        ))}
                    </div>

                    {/* Price and CTA */}
                    <div className="ktg-price-row">
                      <div>
                        <div className="ktg-price-label">Starting from</div>
                        <div className="ktg-price-val">
                          {formatPrice(item.minPrice)}
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                          taxes & fees included
                        </small>
                      </div>

                      <Link to={`/services/${item.providerId}`} className="ktg-btn-navy">
                        Explore <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
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
