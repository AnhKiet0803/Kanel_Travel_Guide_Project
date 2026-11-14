
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../components/admin.css'
import '../../styles/admin/AdminTouristSpots.css'

const SPOTS_KEY = 'karnel-admin-tourist-spots-demo'
const LOCATIONS_KEY = 'karnel-admin-locations-demo'
const CATEGORIES_KEY = 'karnel-admin-categories-demo'

const DEFAULT_LOCATIONS = [
    { LocationId: 1, LocationName: 'Ha Long Bay', Region: 'Northern Vietnam' },
    { LocationId: 2, LocationName: 'Hoi An', Region: 'Central Vietnam' },
    { LocationId: 3, LocationName: 'Bali', Region: 'Indonesia' },
]

const DEFAULT_CATEGORIES = [
    { CategoryId: 1, CategoryName: 'Nature' },
    { CategoryId: 2, CategoryName: 'Culture & Heritage' },
    { CategoryId: 3, CategoryName: 'Beaches & Islands' },
    { CategoryId: 4, CategoryName: 'Historical Sites' },
]

const DEFAULT_SPOTS = [
    {
        SpotId: 1,
        SpotName: 'Ha Long Bay',
        LocationId: 1,
        CategoryId: 1,
        ThumbnailUrl: '',
        Description: 'Limestone islands and emerald waters.',
        DetailedContent: '',
        IsFeatured: true,
        CreatedAt: '2026-11-12T09:00:00',
    },
    {
        SpotId: 2,
        SpotName: 'Hoi An Ancient Town',
        LocationId: 2,
        CategoryId: 2,
        ThumbnailUrl: '',
        Description: 'Historic streets and traditional architecture.',
        DetailedContent: '',
        IsFeatured: true,
        CreatedAt: '2026-11-10T14:30:00',
    },
    {
        SpotId: 3,
        SpotName: 'Bali',
        LocationId: 3,
        CategoryId: 3,
        ThumbnailUrl: '',
        Description: 'Beautiful beaches and tropical landscapes.',
        DetailedContent: '',
        IsFeatured: false,
        CreatedAt: '2026-11-08T10:15:00',
    },
]

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key)
        if (value !== null) {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) return parsed
        }
    } catch (error) {
        console.error('Cannot read demo data:', error)
    }

    return fallback
}

function saveStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
        console.error('Cannot save demo data:', error)
        throw new Error('Unable to save demo data in this browser.')
    }
}

function getCreatedAt(spot) {
    return spot.CreatedAt ?? spot.createdAt ?? null
}

function getTimestamp(spot) {
    const value = getCreatedAt(spot)
    if (!value) return 0

    const time = new Date(value).getTime()
    return Number.isNaN(time) ? 0 : time
}

function formatDate(value) {
    if (!value) return 'Not available'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Not available'

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date)
}

function getLocalDateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function matchesDateFilter(spot, filter, startDate, endDate) {
    if (filter === 'all') return true

    const timestamp = getTimestamp(spot)
    if (!timestamp) return false

    const created = new Date(timestamp)
    const today = new Date()
    const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    )

    if (filter === 'today') {
        return created >= todayStart && created <= today
    }

    if (filter === '7days' || filter === '30days') {
        const days = filter === '7days' ? 7 : 30
        const start = new Date(todayStart)
        start.setDate(start.getDate() - (days - 1))
        return created >= start && created <= today
    }

    if (filter === 'custom') {
        if (startDate) {
            const start = new Date(`${startDate}T00:00:00`)
            if (created < start) return false
        }

        if (endDate) {
            const end = new Date(`${endDate}T23:59:59.999`)
            if (created > end) return false
        }
    }

    return true
}

export default function AdminTouristSpotsPage() {
    const navigate = useNavigate()

    const [spots, setSpots] = useState(() =>
        readStorage(SPOTS_KEY, DEFAULT_SPOTS)
    )
    const [locations, setLocations] = useState(() =>
        readStorage(LOCATIONS_KEY, DEFAULT_LOCATIONS)
    )
    const [categories, setCategories] = useState(() =>
        readStorage(CATEGORIES_KEY, DEFAULT_CATEGORIES)
    )

    const [search, setSearch] = useState('')
    const [locationFilter, setLocationFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [timeFilter, setTimeFilter] = useState('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [sortOrder, setSortOrder] = useState('newest')
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [error, setError] = useState('')

    // Reload local demo data when returning from Add/Edit pages.
    useEffect(() => {
        setSpots(readStorage(SPOTS_KEY, DEFAULT_SPOTS))
        setLocations(readStorage(LOCATIONS_KEY, DEFAULT_LOCATIONS))
        setCategories(readStorage(CATEGORIES_KEY, DEFAULT_CATEGORIES))
    }, [])

    const locationMap = useMemo(
        () =>
            new Map(
                locations.map((item) => [
                    Number(item.LocationId),
                    item.LocationName,
                ])
            ),
        [locations]
    )

    const categoryMap = useMemo(
        () =>
            new Map(
                categories.map((item) => [
                    Number(item.CategoryId),
                    item.CategoryName,
                ])
            ),
        [categories]
    )

    const filteredSpots = useMemo(() => {
        const keyword = search.trim().toLowerCase()

        return spots
            .filter((spot) => {
                const locationName =
                    locationMap.get(Number(spot.LocationId)) || ''

                const categoryName =
                    categoryMap.get(Number(spot.CategoryId)) || ''

                const searchableText = [
                    spot.SpotName,
                    spot.Description,
                    locationName,
                    categoryName,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()

                const matchesSearch = searchableText.includes(keyword)

                const matchesLocation =
                    locationFilter === 'all' ||
                    Number(spot.LocationId) === Number(locationFilter)

                const matchesCategory =
                    categoryFilter === 'all' ||
                    Number(spot.CategoryId) === Number(categoryFilter)

                const matchesTime = matchesDateFilter(
                    spot,
                    timeFilter,
                    startDate,
                    endDate
                )

                return (
                    matchesSearch &&
                    matchesLocation &&
                    matchesCategory &&
                    matchesTime
                )
            })
            .sort((a, b) => {
                const difference = getTimestamp(b) - getTimestamp(a)

                if (sortOrder === 'oldest') return -difference
                if (sortOrder === 'name-asc') {
                    return (a.SpotName || '').localeCompare(b.SpotName || '')
                }
                if (sortOrder === 'name-desc') {
                    return (b.SpotName || '').localeCompare(a.SpotName || '')
                }

                return difference || Number(b.SpotId) - Number(a.SpotId)
            })
    }, [
        spots,
        search,
        locationFilter,
        categoryFilter,
        timeFilter,
        startDate,
        endDate,
        sortOrder,
        locationMap,
        categoryMap,
    ])

    const totalPages = Math.max(
        1,
        Math.ceil(filteredSpots.length / pageSize)
    )

    const currentPage = Math.min(page, totalPages)
    const startIndex = (currentPage - 1) * pageSize

    const visibleSpots = filteredSpots.slice(
        startIndex,
        startIndex + pageSize
    )

    const featuredCount = spots.filter(
        (spot) => spot.IsFeatured
    ).length

    function changeFilter(setter, value) {
        setter(value)
        setPage(1)
    }

    function resetFilters() {
        setSearch('')
        setLocationFilter('all')
        setCategoryFilter('all')
        setTimeFilter('all')
        setStartDate('')
        setEndDate('')
        setSortOrder('newest')
        setPage(1)
    }

    function handleDelete(spot) {
        if (
            !window.confirm(
                `Are you sure you want to delete "${spot.SpotName}"?`
            )
        ) {
            return
        }

        try {
            const updated = spots.filter(
                (item) => Number(item.SpotId) !== Number(spot.SpotId)
            )

            saveStorage(SPOTS_KEY, updated)
            setSpots(updated)
            setError('')
            setPage(1)
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="ats-page">
            <div className="ats-heading">
                <div>
                    <span className="ats-eyebrow">
                        CONTENT MANAGEMENT
                    </span>
                    <h1>Tourist Spots Management</h1>
                    <p>
                        Manage tourist spots, destinations and travel information.
                    </p>
                </div>

                <button
                    type="button"
                    className="ktg-button"
                    onClick={() => navigate('/admin/spots/new')}
                >
                    + Add Tourist Spot
                </button>
            </div>

            <div className="ats-stats">
                <div className="ats-stat">
                    <span>Total Tourist Spots</span>
                    <strong>{spots.length}</strong>
                </div>

                <div className="ats-stat">
                    <span>Featured Spots</span>
                    <strong>{featuredCount}</strong>
                </div>

                <div className="ats-stat">
                    <span>Locations</span>
                    <strong>{locations.length}</strong>
                </div>

                <div className="ats-stat">
                    <span>Categories</span>
                    <strong>{categories.length}</strong>
                </div>
            </div>

            {error && (
                <p className="ats-form-error" role="alert">
                    {error}
                </p>
            )}

            <div className="ats-panel">
                <div className="ats-panel-heading">
                    <div>
                        <h2>All Tourist Spots</h2>
                        <p>
                            Search, filter and manage destinations.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ktg-button ktg-button-secondary ktg-button-small"
                        onClick={resetFilters}
                    >
                        Reset Filters
                    </button>
                </div>

                <div className="ktg-toolbar ats-toolbar">
                    <input
                        type="search"
                        placeholder="Search tourist spots..."
                        value={search}
                        onChange={(event) =>
                            changeFilter(setSearch, event.target.value)
                        }
                        aria-label="Search tourist spots"
                    />

                    <select
                        value={locationFilter}
                        onChange={(event) =>
                            changeFilter(setLocationFilter, event.target.value)
                        }
                        aria-label="Filter by location"
                    >
                        <option value="all">All Locations</option>
                        {locations.map((location) => (
                            <option
                                key={location.LocationId}
                                value={location.LocationId}
                            >
                                {location.LocationName}
                            </option>
                        ))}
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(event) =>
                            changeFilter(setCategoryFilter, event.target.value)
                        }
                        aria-label="Filter by category"
                    >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                            <option
                                key={category.CategoryId}
                                value={category.CategoryId}
                            >
                                {category.CategoryName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="ats-filter-row">
                    <div className="ats-filter-group">
                        <label htmlFor="ats-time-filter">Created Date</label>
                        <select
                            id="ats-time-filter"
                            value={timeFilter}
                            onChange={(event) =>
                                changeFilter(setTimeFilter, event.target.value)
                            }
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="custom">Custom Date Range</option>
                        </select>
                    </div>

                    {timeFilter === 'custom' && (
                        <>
                            <div className="ats-filter-group">
                                <label htmlFor="ats-start-date">From</label>
                                <input
                                    id="ats-start-date"
                                    type="date"
                                    value={startDate}
                                    max={endDate || undefined}
                                    onChange={(event) =>
                                        changeFilter(setStartDate, event.target.value)
                                    }
                                />
                            </div>

                            <div className="ats-filter-group">
                                <label htmlFor="ats-end-date">To</label>
                                <input
                                    id="ats-end-date"
                                    type="date"
                                    value={endDate}
                                    min={startDate || undefined}
                                    onChange={(event) =>
                                        changeFilter(setEndDate, event.target.value)
                                    }
                                />
                            </div>
                        </>
                    )}

                    <div className="ats-filter-group">
                        <label htmlFor="ats-sort">Sort By</label>
                        <select
                            id="ats-sort"
                            value={sortOrder}
                            onChange={(event) =>
                                changeFilter(setSortOrder, event.target.value)
                            }
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="name-asc">Name A–Z</option>
                            <option value="name-desc">Name Z–A</option>
                        </select>
                    </div>

                    <div className="ats-filter-group">
                        <label htmlFor="ats-page-size">Rows Per Page</label>
                        <select
                            id="ats-page-size"
                            value={pageSize}
                            onChange={(event) => {
                                setPageSize(Number(event.target.value))
                                setPage(1)
                            }}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                </div>

                <div className="ats-result-count">
                    {filteredSpots.length === 0
                        ? 'No tourist spots found'
                        : `Showing ${startIndex + 1}–${Math.min(
                            startIndex + pageSize,
                            filteredSpots.length
                        )} of ${filteredSpots.length} tourist spots`}
                </div>

                <div className="ktg-table-wrap">
                    <table className="ktg-table ats-table">
                        <thead>
                            <tr>
                                <th>Tourist Spot</th>
                                <th>Location</th>
                                <th>Category</th>
                                <th>Created Date</th>
                                <th>Featured</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {visibleSpots.map((spot) => (
                                <tr key={spot.SpotId}>
                                    <td>
                                        <div className="ats-spot-cell">
                                            {spot.ThumbnailUrl ? (
                                                <img
                                                    src={spot.ThumbnailUrl}
                                                    alt={spot.SpotName}
                                                />
                                            ) : (
                                                <div className="ats-image-placeholder">
                                                    No Image
                                                </div>
                                            )}

                                            <div>
                                                <strong>{spot.SpotName}</strong>
                                                <p>
                                                    {spot.Description || 'No description'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td>
                                        {locationMap.get(Number(spot.LocationId)) ||
                                            'Unknown'}
                                    </td>

                                    <td>
                                        <span className="ats-category-badge">
                                            {categoryMap.get(Number(spot.CategoryId)) ||
                                                'Unknown'}
                                        </span>
                                    </td>

                                    <td className="ats-date-cell">
                                        {formatDate(getCreatedAt(spot))}
                                    </td>

                                    <td>
                                        <span
                                            className={
                                                spot.IsFeatured
                                                    ? 'ktg-badge ktg-badge-ok'
                                                    : 'ktg-badge'
                                            }
                                        >
                                            {spot.IsFeatured ? 'Featured' : 'Standard'}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="ktg-actions">
                                            <Link
                                                className="ats-action"
                                                to={`/admin/spots/${spot.SpotId}`}
                                            >
                                                View
                                            </Link>

                                            <Link
                                                className="ats-action ats-edit"
                                                to={`/admin/spots/${spot.SpotId}/edit`}
                                            >
                                                Edit
                                            </Link>

                                            <button
                                                type="button"
                                                className="ats-action ats-delete"
                                                onClick={() => handleDelete(spot)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {visibleSpots.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="ats-empty">
                                        No tourist spots match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="ats-pagination">
                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setPage(1)}
                    >
                        First
                    </button>

                    <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                    >
                        Previous
                    </button>

                    <span>
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setPage(currentPage + 1)}
                    >
                        Next
                    </button>

                    <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setPage(totalPages)}
                    >
                        Last
                    </button>
                </div>
            </div>
        </div>
    )
}
