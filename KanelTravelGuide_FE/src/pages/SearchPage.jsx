// CN10, CN11: Basic and Advanced Search Page
// Maintained by Tiến (recca279)
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { basicSearch, advancedSearch } from '../api/searchApi.js'
import { getLocations } from '../api/servicesApi.js'
import '../styles/services.css'
import './pages.css'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialKeyword = searchParams.get('q') || searchParams.get('search') || ''
  const initialLocation = searchParams.get('destination') || searchParams.get('locationId') || ''
  const initialType = searchParams.get('type') || searchParams.get('serviceType') || ''

  const [keyword, setKeyword] = useState(initialKeyword)
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(initialLocation)
  const [serviceType, setServiceType] = useState(initialType)
  const [starRating, setStarRating] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('recommended')

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'services' | 'tours' | 'spots'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [searchResults, setSearchResults] = useState({
    spots: [],
    tours: [],
    services: []
  })

  useEffect(() => {
    getLocations()
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    executeSearch()
  }, [searchParams])

  async function executeSearch() {
    setLoading(true)
    setError(null)
    const q = searchParams.get('q') || searchParams.get('search') || ''

    try {
      const hasAdvancedFilters =
        selectedLocation || serviceType || starRating || minPrice || maxPrice || sortBy

      if (hasAdvancedFilters) {
        const advParams = {}
        if (q) advParams.q = q
        if (selectedLocation) advParams.locationId = selectedLocation
        if (serviceType) advParams.serviceType = serviceType
        if (starRating) advParams.starRating = starRating
        if (minPrice) advParams.minPrice = minPrice
        if (maxPrice) advParams.maxPrice = maxPrice
        if (sortBy) advParams.sort = sortBy

        const advServices = await advancedSearch(advParams)

        let basicData = { spots: [], tours: [], services: [] }
        if (q) {
          basicData = await basicSearch(q).catch(() => ({ spots: [], tours: [], services: [] }))
        }

        setSearchResults({
          spots: basicData.spots || [],
          tours: basicData.tours || [],
          services: Array.isArray(advServices) ? advServices : []
        })
      } else {
        const data = await basicSearch(q)
        setSearchResults({
          spots: data.spots || [],
          tours: data.tours || [],
          services: data.services || []
        })
      }
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    const nextParams = new URLSearchParams()
    if (keyword.trim()) nextParams.set('q', keyword.trim())
    if (selectedLocation) nextParams.set('locationId', selectedLocation)
    if (serviceType) nextParams.set('serviceType', serviceType)
    setSearchParams(nextParams)
  }

  function handleQuickChip(term, loc = '', type = '') {
    setKeyword(term)
    if (loc) setSelectedLocation(loc)
    if (type) setServiceType(type)
    const nextParams = new URLSearchParams()
    if (term) nextParams.set('q', term)
    if (loc) nextParams.set('locationId', loc)
    if (type) nextParams.set('serviceType', type)
    setSearchParams(nextParams)
  }

  function formatPrice(num) {
    if (num == null || num === 0) return 'Free / Inquire'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  const totalResults =
    searchResults.spots.length + searchResults.tours.length + searchResults.services.length

  return (
    <div className="ktg-services-wrapper">
      {/* Search Hero */}
      <section className="ktg-services-hero">
        <div className="container">
          <span className="ktg-eyebrow" style={{ color: '#5eead4' }}>
            Comprehensive Travel Search
          </span>
          <h1>Explore Vietnam Your Way</h1>
          <p>
            Instantly search tourist attractions, guided excursions, top-rated hotels, and authentic dining across Vietnam.
          </p>

          {/* Quick Search Chips */}
          <div className="d-flex flex-wrap gap-2 pt-2">
            <span className="small text-white-50 align-self-center me-1">Popular:</span>
            <button
              type="button"
              className="ktg-chip"
              onClick={() => handleQuickChip('Beach', '1', 'Resort')}
            >
              🌊 Da Nang Beachfront
            </button>
            <button
              type="button"
              className="ktg-chip"
              onClick={() => handleQuickChip('Heritage', '2', 'Hotel')}
            >
              🏮 Hoi An Ancient Town
            </button>
            <button
              type="button"
              className="ktg-chip"
              onClick={() => handleQuickChip('Imperial', '3', 'Restaurant')}
            >
              👑 Hue Royal Dining
            </button>
            <button
              type="button"
              className="ktg-chip"
              onClick={() => handleQuickChip('Luxury', '', 'Hotel')}
            >
              ⭐ 5-Star Luxury
            </button>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginTop: '16px' }}>
        {/* Main Search & Filter Form */}
        <div className="ktg-filter-card">
          <form onSubmit={handleSearchSubmit}>
            <div className="input-group input-group-lg mb-3 shadow-none">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-primary"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search by keywords, place name, hotel, or cuisine..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button className="ktg-btn-teal px-4" type="submit">
                Search Now
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="row g-3 pt-3 border-top">
              <div className="col-md-3">
                <label className="form-label small fw-bold text-secondary mb-1">
                  Category Type
                </label>
                <select
                  className="form-select form-select-sm"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Hotel">Hotels & Stays</option>
                  <option value="Restaurant">Restaurants & Dining</option>
                  <option value="Resort">Resorts & Villas</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label small fw-bold text-secondary mb-1">
                  Destination Region
                </label>
                <select
                  className="form-select form-select-sm"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">All Destinations</option>
                  {locations.map((loc) => (
                    <option key={loc.locationId} value={loc.locationId}>
                      {loc.locationName} ({loc.region})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label small fw-bold text-secondary mb-1">
                  Min Rating
                </label>
                <select
                  className="form-select form-select-sm"
                  value={starRating}
                  onChange={(e) => setStarRating(e.target.value)}
                >
                  <option value="">Any Star</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label small fw-bold text-secondary mb-1">
                  Max Budget (VND)
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="e.g. 2000000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button
                  type="submit"
                  className="ktg-btn-navy w-100 justify-content-center py-2"
                >
                  <i className="bi bi-funnel-fill"></i> Apply
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results Navigation Tabs */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div className="d-flex gap-2">
            <button
              type="button"
              className={`ktg-pill-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Results <span className="badge bg-secondary ms-1">{totalResults}</span>
            </button>
            <button
              type="button"
              className={`ktg-pill-tab ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              Stays & Dining{' '}
              <span className="badge bg-secondary ms-1">{searchResults.services.length}</span>
            </button>
            <button
              type="button"
              className={`ktg-pill-tab ${activeTab === 'tours' ? 'active' : ''}`}
              onClick={() => setActiveTab('tours')}
            >
              Tours <span className="badge bg-secondary ms-1">{searchResults.tours.length}</span>
            </button>
            <button
              type="button"
              className={`ktg-pill-tab ${activeTab === 'spots' ? 'active' : ''}`}
              onClick={() => setActiveTab('spots')}
            >
              Attractions{' '}
              <span className="badge bg-secondary ms-1">{searchResults.spots.length}</span>
            </button>
          </div>

          <div className="text-muted small mt-2 mt-sm-0">
            Showing results for: <strong>"{keyword || 'All Destinations'}"</strong>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-3 text-muted fw-semibold">Searching curated travel guide database...</p>
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
        {!loading && !error && totalResults === 0 && (
          <div className="ktg-card text-center py-5">
            <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
            <h4 className="ktg-serif-title mt-3">No matching records found</h4>
            <p className="text-muted small" style={{ maxWidth: '400px', margin: '0 auto 20px' }}>
              We couldn't find any results matching your search terms. Try searching for "Da Nang", "Hotel", or clearing specific filters.
            </p>
            <button
              type="button"
              className="ktg-btn-navy"
              onClick={() => {
                setKeyword('')
                setSelectedLocation('')
                setServiceType('')
                setStarRating('')
                setMaxPrice('')
                setSearchParams(new URLSearchParams())
              }}
            >
              Clear All Searches
            </button>
          </div>
        )}

        {/* Results Presentation */}
        {!loading && !error && totalResults > 0 && (
          <div className="row g-4">
            {/* Services (Hotels, Restaurants, Resorts) */}
            {(activeTab === 'all' || activeTab === 'services') &&
              searchResults.services.map((svc) => (
                <div key={`svc-${svc.providerId}`} className="col-md-6 col-lg-4">
                  <div className="ktg-service-card">
                    <div className="ktg-card-media">
                      <img
                        src={
                          svc.imageUrl ||
                          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={svc.providerName}
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'
                        }}
                      />
                      <span className="ktg-badge-type">{svc.serviceType}</span>
                      <span className="ktg-badge-rating">
                        <i className="bi bi-star-fill"></i> {svc.reviewScore || 9.2}
                      </span>
                    </div>
                    <div className="ktg-card-body">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="ktg-stars">
                          {Array.from({ length: svc.starRating || 5 }).map((_, i) => (
                            <i key={i} className="bi bi-star-fill"></i>
                          ))}
                        </div>
                        <span className="badge bg-light text-secondary border">
                          {svc.locationName}
                        </span>
                      </div>
                      <h4 className="ktg-card-title">
                        <Link to={`/services/${svc.providerId}`}>{svc.providerName}</Link>
                      </h4>
                      <p className="ktg-location-text text-truncate">{svc.address}</p>
                      <div className="ktg-price-row">
                        <div>
                          <div className="ktg-price-label">Price from</div>
                          <div className="ktg-price-val">{formatPrice(svc.minPrice)}</div>
                        </div>
                        <Link to={`/services/${svc.providerId}`} className="ktg-btn-navy">
                          Details <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* Tours */}
            {(activeTab === 'all' || activeTab === 'tours') &&
              searchResults.tours.map((tour) => (
                <div key={`tour-${tour.tourId}`} className="col-md-6 col-lg-4">
                  <div className="ktg-service-card">
                    <div className="ktg-card-media">
                      <img
                        src={
                          tour.imageUrl ||
                          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={tour.tourName}
                      />
                      <span className="ktg-badge-type" style={{ background: 'rgba(14, 153, 150, 0.95)' }}>
                        Tour
                      </span>
                    </div>
                    <div className="ktg-card-body">
                      <h4 className="ktg-card-title">{tour.tourName}</h4>
                      <p className="ktg-location-text">
                        <i className="bi bi-clock-history me-1"></i> Duration:{' '}
                        <strong>{tour.duration || 'Full day'}</strong>
                      </p>
                      <div className="ktg-price-row">
                        <div>
                          <div className="ktg-price-label">Price per person</div>
                          <div className="ktg-price-val">{formatPrice(tour.price)}</div>
                        </div>
                        <Link
                          to={`/booking?type=Tour&tourId=${tour.tourId}&tourName=${encodeURIComponent(
                            tour.tourName
                          )}&price=${tour.price}`}
                          className="ktg-btn-teal"
                        >
                          Book Tour
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* Tourist Spots */}
            {(activeTab === 'all' || activeTab === 'spots') &&
              searchResults.spots.map((spot) => (
                <div key={`spot-${spot.spotId}`} className="col-md-6 col-lg-4">
                  <div className="ktg-service-card">
                    <div className="ktg-card-media">
                      <img
                        src={
                          spot.imageUrl ||
                          'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={spot.spotName}
                      />
                      <span className="ktg-badge-type" style={{ background: 'rgba(100, 116, 139, 0.95)' }}>
                        Attraction
                      </span>
                    </div>
                    <div className="ktg-card-body">
                      <h4 className="ktg-card-title">{spot.spotName}</h4>
                      <p className="ktg-location-text text-truncate">
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                        {spot.locationName || spot.address}
                      </p>
                      <div className="ktg-price-row">
                        <div>
                          <div className="ktg-price-label">Entry ticket</div>
                          <div className="ktg-price-val">{formatPrice(spot.entryFee)}</div>
                        </div>
                        <span className="badge bg-light text-secondary border p-2">
                          Must Visit
                        </span>
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
