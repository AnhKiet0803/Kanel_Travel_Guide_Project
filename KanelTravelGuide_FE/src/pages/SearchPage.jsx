// CN10, CN11: Basic and Advanced Search Page
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { basicSearch, advancedSearch } from '../api/searchApi.js'
import { getLocations } from '../api/servicesApi.js'
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
  const [sortBy, setSortBy] = useState('')

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'services' | 'tours' | 'spots'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [searchResults, setSearchResults] = useState({
    spots: [],
    tours: [],
    services: [],
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
      // If advanced filters are applied, use advanced search
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
        
        // Also get basic search if there is a query string for spots/tours
        let basicData = { spots: [], tours: [], services: [] }
        if (q) {
          basicData = await basicSearch(q).catch(() => ({ spots: [], tours: [], services: [] }))
        }

        setSearchResults({
          spots: basicData.spots || [],
          tours: basicData.tours || [],
          services: Array.isArray(advServices) ? advServices : [],
        })
      } else {
        // Standard basic search
        const data = await basicSearch(q)
        setSearchResults({
          spots: data.spots || [],
          tours: data.tours || [],
          services: data.services || [],
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

  function formatPrice(num) {
    if (num == null) return 'N/A'
    return Number(num).toLocaleString('vi-VN') + ' VND'
  }

  const totalResults =
    searchResults.spots.length + searchResults.tours.length + searchResults.services.length

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <h1 className="fw-bold">Search Travel & Services</h1>
        <p className="text-muted">
          Find tourist attractions, guided tours, hotels, restaurants, and resorts across the country.
        </p>
      </div>

      {/* Search Bar & Advanced Filter Form */}
      <div className="card shadow-sm border-0 p-4 mb-4 bg-light">
        <form onSubmit={handleSearchSubmit}>
          <div className="input-group input-group-lg mb-3">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by spot name, tour, hotel, restaurant..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button className="btn btn-primary px-4 fw-semibold" type="submit">
              Search
            </button>
          </div>

          {/* Advanced Filters (CN11) */}
          <div className="row g-2 pt-2 border-top">
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-secondary">Service Type</label>
              <select
                className="form-select form-select-sm"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              >
                <option value="">All Services</option>
                <option value="Hotel">Hotel</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Resort">Resort</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-semibold text-secondary">Destination</label>
              <select
                className="form-select form-select-sm"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.locationId} value={loc.locationId}>
                    {loc.locationName} ({loc.region})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-semibold text-secondary">Rating</label>
              <select
                className="form-select form-select-sm"
                value={starRating}
                onChange={(e) => setStarRating(e.target.value)}
              >
                <option value="">Any</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-semibold text-secondary">Max Budget</label>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="VND"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small fw-semibold text-secondary">Sort By</label>
              <select
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'all' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Results ({totalResults})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'services' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Stay & Dining ({searchResults.services.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'tours' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('tours')}
          >
            Tours ({searchResults.tours.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'spots' ? 'active fw-bold' : ''}`}
            onClick={() => setActiveTab('spots')}
          >
            Attractions ({searchResults.spots.length})
          </button>
        </li>
      </ul>

      {/* Status */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Searching...</span>
          </div>
          <p className="mt-2 text-muted">Searching database...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && totalResults === 0 && (
        <div className="text-center py-5 bg-white rounded shadow-sm">
          <i className="bi bi-search text-muted display-4"></i>
          <h4 className="mt-3">No matching results found</h4>
          <p className="text-muted">Try using different search keywords or clearing your filters.</p>
        </div>
      )}

      {/* Results List */}
      {!loading && !error && totalResults > 0 && (
        <div className="d-flex flex-column gap-4">
          {/* Services Section */}
          {(activeTab === 'all' || activeTab === 'services') && searchResults.services.length > 0 && (
            <div>
              <h5 className="fw-bold mb-3 text-secondary">
                <i className="bi bi-building me-2"></i> Stay & Dining ({searchResults.services.length})
              </h5>
              <div className="row g-3">
                {searchResults.services.map((item) => (
                  <div key={item.providerId} className="col-md-6 col-lg-4">
                    <div className="card h-100 shadow-sm border-0">
                      <div style={{ height: '160px', backgroundColor: '#eee' }}>
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80'}
                          alt={item.providerName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80'
                          }}
                        />
                      </div>
                      <div className="card-body">
                        <span className="badge bg-primary text-uppercase mb-1">{item.serviceType}</span>
                        <h6 className="fw-bold mb-1">{item.providerName}</h6>
                        <p className="small text-muted mb-2">
                          <i className="bi bi-geo-alt me-1"></i>
                          {item.locationName}
                        </p>
                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                          <strong className="text-primary small">
                            {formatPrice(item.minPrice)}
                          </strong>
                          <Link to={`/services/${item.providerId}`} className="btn btn-sm btn-outline-primary">
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tours Section */}
          {(activeTab === 'all' || activeTab === 'tours') && searchResults.tours.length > 0 && (
            <div>
              <h5 className="fw-bold mb-3 text-secondary">
                <i className="bi bi-compass me-2"></i> Guided Tours ({searchResults.tours.length})
              </h5>
              <div className="row g-3">
                {searchResults.tours.map((tour) => (
                  <div key={tour.tourId} className="col-md-6 col-lg-4">
                    <div className="card h-100 shadow-sm border-0 p-3">
                      <h6 className="fw-bold text-dark">{tour.tourName}</h6>
                      <p className="small text-muted mb-1">
                        <i className="bi bi-clock me-1"></i> Duration: {tour.duration || 'Full day'}
                      </p>
                      {tour.spotName && (
                        <p className="small text-muted mb-2">
                          <i className="bi bi-geo-alt me-1"></i> Spot: {tour.spotName}
                        </p>
                      )}
                      <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-success">
                          {formatPrice(tour.salePrice || tour.standardPrice)}
                        </span>
                        <Link
                          to={`/booking?type=Tour&tourId=${tour.tourId}&tourName=${encodeURIComponent(
                            tour.tourName
                          )}&price=${tour.salePrice || tour.standardPrice}`}
                          className="btn btn-sm btn-primary"
                        >
                          Book Tour
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tourist Spots Section */}
          {(activeTab === 'all' || activeTab === 'spots') && searchResults.spots.length > 0 && (
            <div>
              <h5 className="fw-bold mb-3 text-secondary">
                <i className="bi bi-geo-alt me-2"></i> Tourist Attractions ({searchResults.spots.length})
              </h5>
              <div className="row g-3">
                {searchResults.spots.map((spot) => (
                  <div key={spot.spotId} className="col-md-6 col-lg-4">
                    <div className="card h-100 shadow-sm border-0 p-3">
                      <h6 className="fw-bold text-dark mb-1">{spot.spotName}</h6>
                      <span className="badge bg-secondary w-auto mb-2 align-self-start">
                        {spot.categoryName || 'Sightseeing'}
                      </span>
                      <p className="small text-muted mb-2">
                        <i className="bi bi-pin-map me-1"></i>
                        {spot.locationName}
                      </p>
                      <p className="small text-muted text-truncate mb-2">{spot.description}</p>
                      <div className="mt-auto pt-2 border-top">
                        <Link to={`/destinations/${spot.spotId}`} className="btn btn-sm btn-outline-secondary w-100">
                          View Destination
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
