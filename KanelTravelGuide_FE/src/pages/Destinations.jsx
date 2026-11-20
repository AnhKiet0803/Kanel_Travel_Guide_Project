
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { listCategories, listLocations, listSpots } from '../api/touristSpotsApi.js';
import '../styles/destinations/Destinations.css';

// Reference points for the areas currently supplied by the Locations API.
const AREA_COORDINATES = new Map([
    ['da nang', [16.04, 108.21]],
    ['quang nam', [15.57, 108.47]],
    ['thua thien hue', [16.46, 107.58]],
    ['khanh hoa', [12.22, 109.20]],
]);

function getMapPins(spots) {
    const pins = new Map();
    for (const spot of spots) {
        if (!spot.coordinates) continue;
        const key = spot.coordinates.join(',');
        if (!pins.has(key)) pins.set(key, { key, coordinates: spot.coordinates, spots: [] });
        pins.get(key).spots.push(spot);
    }
    return [...pins.values()];
}

async function loadDestinations() {
    const [records, locations, categories] = await Promise.all([
        listSpots(), listLocations(), listCategories(),
    ]);
    const locationsById = new Map(locations.map((location) => [location.LocationId, location]));
    const spots = records.map((record) => {
        const location = locationsById.get(record.LocationId);
        const exactCoordinates = Number.isFinite(record.Latitude) && Number.isFinite(record.Longitude)
            ? [record.Latitude, record.Longitude]
            : null;
        const area = (location?.LocationName || record.LocationName || '').trim().toLowerCase();
        return {
            id: record.SpotId,
            name: record.SpotName,
            location: record.LocationName,
            locationId: String(record.LocationId),
            featured: record.IsFeatured,
            description: record.Description || '',
            image: record.ThumbnailUrl,
            category: String(record.CategoryId),
            categoryLabel: record.CategoryName,
            coordinates: exactCoordinates ?? AREA_COORDINATES.get(area),
            approximate: !exactCoordinates,
            rating: record.AverageRating,
            reviewCount: record.ReviewCount,
        };
    });
    return {
        spots,
        locations: locations.map((item) => ({ id: String(item.LocationId), label: item.LocationName })),
        categories: categories.map((item) => ({ id: String(item.CategoryId), label: item.CategoryName })),
    };
}

function DestinationImage({ src, name }) {
    const [failed, setFailed] = useState(false);
    return src && !failed
        ? <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} />
        : <span className="dest-image-empty">No image available</span>;
}

const PAGE_SIZE = 9;
const EMPTY_LIST = [];

const markerIcon = L.divIcon({
    className: 'dest-map-pin',
    html: '<span>●</span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

function FitMapToPins({ pins }) {
    const map = useMap();

    useEffect(() => {
        const points = pins.map((pin) => pin.coordinates);

        if (points.length === 1) {
            map.setView(points[0], 9);
        } else if (points.length > 1) {
            map.fitBounds(points, {
                padding: [35, 35],
                maxZoom: 9,
            });
        } else {
            map.setView([12, 108], 4);
        }
    }, [map, pins]);

    return null;
}

export default function Destinations() {
    const [searchParams] = useSearchParams();

    const [keyword, setKeyword] = useState(
        searchParams.get('search') || ''
    );
    const [location, setLocation] = useState(searchParams.get('location') || 'all');
    const [rating, setRating] = useState('');
    const [category, setCategory] = useState('all');
    const [sort, setSort] = useState('default');
    const [page, setPage] = useState(1);
    const [showMap, setShowMap] = useState(true);
    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const value = searchParams.get('search') || '';
        setKeyword(value);
        setLocation(searchParams.get('location') || 'all');
        setPage(1);
    }, [searchParams]);

    useEffect(() => {
        const refresh = () => setRetry((version) => version + 1);
        window.addEventListener('focus', refresh);
        return () => window.removeEventListener('focus', refresh);
    }, []);

    useEffect(() => {
        let active = true;
        loadDestinations()
            .then((result) => {
                if (!active) return;
                setData(result);
                setLoadError('');
            })
            .catch(() => {
                if (active) setLoadError('Unable to load destinations. Please try again.');
            });
        return () => { active = false; };
    }, [retry]);

    const categories = data?.categories ?? EMPTY_LIST;
    const spots = data?.spots ?? EMPTY_LIST;
    const hasRatings = spots.some((spot) => Number.isFinite(spot.rating));
    const mapVisible = showMap;

    const locations = data?.locations ?? EMPTY_LIST;

    const filtered = useMemo(() => {
        const q = keyword.trim().toLocaleLowerCase();

        const result = spots.filter((item) => {
            const categoryLabel =
                item.categoryLabel || '';

            const haystack = [
                item.name,
                item.location,
                item.description,
                categoryLabel,
            ]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase();

            return (
                haystack.includes(q) &&
                (location === 'all' || item.locationId === location) &&
                (category === 'all' || item.category === category) &&
                (!rating || (Number.isFinite(item.rating) && item.rating >= Number(rating)))
            );
        });

        if (sort === 'az') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (sort === 'za') {
            result.sort((a, b) => b.name.localeCompare(a.name));
        }

        return result;
    }, [spots, keyword, location, category, rating, sort]);

    const mapPins = useMemo(() => getMapPins(filtered), [filtered]);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const currentPage = Math.min(page, Math.max(totalPages, 1));
    const visible = filtered.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const changeFilter = (setter, value) => {
        setter(value);
        setPage(1);
    };

    const clearFilters = () => {
        setKeyword('');
        setLocation('all');
        setCategory('all');
        setRating('');
        setSort('default');
        setPage(1);
    };

    return (
        <main className="dest-page">
            <div className="dest-container">
            </div>
            <section className="dest-hero">
                <div className="dest-container">
                    <div className="dest-breadcrumb">Home / Destinations</div>
                    <span className="dest-eyebrow">KARNEL TRAVELS · DISCOVER MORE</span>
                    <h1>Explore destinations</h1>
                    <p>Find your next adventure and explore remarkable places around the world.</p>
                </div>
            </section>
            <div className="dest-container dest-main">
                <div className="dest-search-panel">
                    <div className="dest-search-grid">
                        <label className="dest-search">
                            <span><i className="bi bi-search" /> Keyword</span>
                            <input type="search" placeholder="Search destinations..." value={keyword} onChange={e => changeFilter(setKeyword, e.target.value)} />
                        </label>
                        <label className="dest-search">
                            <span><i className="bi bi-geo-alt-fill" /> Destination</span>
                            <select value={location} onChange={e => changeFilter(setLocation, e.target.value)}>
                                <option value="all">All locations</option>
                                {locations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                            </select>
                        </label>
                        <label className="dest-search">
                            <span><i className="bi bi-compass" /> Travel type</span>
                            <select value={category} onChange={e => changeFilter(setCategory, e.target.value)}>
                                <option value="all">All types</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </label>
                        {hasRatings && (
                            <label className="dest-search">
                                <span><i className="bi bi-star-fill" /> Rating</span>
                                <select value={rating} onChange={e => changeFilter(setRating, e.target.value)}>
                                    <option value="">All ratings</option>
                                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n}+ Stars)</option>)}
                                </select>
                            </label>
                        )}
                        <button type="button" className="dest-reset-button" onClick={clearFilters} title="Reset filters" aria-label="Reset filters"><i className="bi bi-arrow-counterclockwise" /></button>
                    </div>
                </div>
                <div className="dest-filter-actions dest-secondary-actions">
                    <select aria-label="Sort destinations" value={sort} onChange={e => changeFilter(setSort, e.target.value)}>
                        <option value="default">Recommended</option>
                        <option value="az">Name A - Z</option>
                        <option value="za">Name Z - A</option>
                    </select>
                    <button type="button" className="dest-map-toggle" onClick={() => setShowMap(v => !v)}>
                        <i className="bi bi-map" /> {showMap ? 'Hide map' : 'Show map'}
                    </button>
                </div>
                <div className="dest-results-heading">
                    <h2>Discover amazing places</h2>

                    <span aria-live="polite">
                        {filtered.length}{' '}
                        {filtered.length === 1
                            ? 'destination'
                            : 'destinations'}
                    </span>
                </div>

                <div
                    className={`dest-layout ${mapVisible ? '' : 'no-map'
                        }`}
                >
                    <div className="dest-list-column">
                        {loadError ? (
                            <div className="dest-empty">
                                <p role="alert">{loadError}</p>
                                <button type="button" className="dest-empty-reset" onClick={() => {
                                    setLoadError('');
                                    setRetry((value) => value + 1);
                                }}>Try again</button>
                            </div>
                        ) : !data ? (
                            <p className="dest-empty" role="status">Loading destinations…</p>
                        ) : visible.length ? (
                            <div className="dest-grid">
                                {visible.map((item) => (
                                    <Link
                                        to={`/destinations/${item.id}`}
                                        className="dest-card"
                                        key={item.id}
                                    >
                                        <div className="dest-card-image">
                                            <DestinationImage key={item.image} src={item.image} name={item.name} />

                                            {item.featured && <span className="dest-featured">Featured</span>}
                                            <span className="dest-card-arrow">
                                                <i className="bi bi-arrow-up-right" />
                                            </span>

                                        </div>

                                        <div className="dest-card-info">
                                            <span className="dest-card-country">
                                                <i className="bi bi-geo-alt" />
                                                {item.location}
                                            </span>

                                            <h3>{item.name}</h3>
                                            {Number.isFinite(item.reviewCount) && <small>
                                                {item.reviewCount > 0 ? <>
                                                    <i className="bi bi-star-fill text-warning me-1" aria-hidden="true" />
                                                    {item.rating.toFixed(1)} / 5 · {item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'}
                                                </> : 'No reviews yet'}
                                            </small>}

                                            <span className="dest-card-category">
                                                <i
                                                    className="bi bi-compass"
                                                    aria-hidden="true"
                                                />
                                                {item.categoryLabel || 'Other'}
                                            </span>

                                            {item.description && <p>{item.description}</p>}
                                            <span className="dest-card-details">View details <i className="bi bi-arrow-right" aria-hidden="true" /></span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="dest-empty">
                                <i
                                    className="bi bi-search"
                                    aria-hidden="true"
                                />

                                <h3>No destinations found</h3>

                                <p>
                                    Try another keyword, location,
                                    or travel type.
                                </p>

                                <button
                                    type="button"
                                    className="dest-empty-reset"
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}

                        {!loadError && totalPages > 1 && (
                            <nav
                                className="dest-pagination"
                                aria-label="Pagination"
                            >
                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                ).map((number) => (
                                    <button
                                        type="button"
                                        key={number}
                                        aria-current={
                                            currentPage === number
                                                ? 'page'
                                                : undefined
                                        }
                                        className={
                                            currentPage === number
                                                ? 'is-active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setPage(number)
                                        }
                                    >
                                        {number}
                                    </button>
                                ))}
                            </nav>
                        )}
                    </div>

                    {mapVisible && (
                        <aside className="dest-map-column">
                            <div className="dest-map-heading">
                                <i className="bi bi-geo-alt-fill" />
                                Explore on map
                            </div>

                            {data && !loadError && mapPins.length === 0 && (
                                <p className="dest-map-note">No mapped locations for these results.</p>
                            )}
                            <MapContainer
                                center={[12, 108]}
                                zoom={4}
                                scrollWheelZoom={false}
                                className="dest-leaflet-map"
                            >
                                <TileLayer
                                    attribution="&copy; OpenStreetMap contributors"
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                <FitMapToPins pins={mapPins} />

                                {mapPins.map((pin) => (
                                    <Marker key={pin.key} position={pin.coordinates} icon={markerIcon}>
                                        <Popup>
                                            <div className="dest-map-popup">
                                                {pin.spots.map((item) => (
                                                    <div key={item.id}>
                                                        <strong>{item.name}</strong>
                                                        <p>{item.location}{item.approximate && ' · Approximate area'}</p>
                                                        <Link to={`/destinations/${item.id}`}>View details</Link>
                                                    </div>
                                                ))}
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </aside>
                    )}
                </div>
            </div>
        </main>
    );
}
