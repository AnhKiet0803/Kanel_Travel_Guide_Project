
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

import { destinations } from '../components/home/HomeData';
import { promotionsDemo } from '../data/promotionsDemo';
import { getSpots, getLocations, getCategories } from '../data/adminTouristSpotsStore';
import '../styles/destinations/Destinations.css';

// Demo metadata for TouristSpots, CategoryTypes and Locations.
const DEMO_METADATA = {
    1: { category: 'nature', coordinates: [20.9101, 107.1839] },
    2: { category: 'culture', coordinates: [15.8801, 108.338] },
    3: { category: 'beach', coordinates: [-8.4095, 115.1889] },
};

const BASE_CATEGORIES = [
    { id: 'nature', label: 'Nature' },
    { id: 'culture', label: 'Culture & Heritage' },
    { id: 'beach', label: 'Beaches & Islands' },
    { id: 'historical', label: 'Historical Sites' },
];

function categorySlug(name = '') {
    const text = String(name).trim().toLowerCase();
    if (text.includes('nature')) return 'nature';
    if (text.includes('culture') || text.includes('heritage')) return 'culture';
    if (text.includes('beach') || text.includes('island')) return 'beach';
    if (text.includes('historical')) return 'historical';
    return `custom:${text}`;
}

function countryFromLocation(location) {
    const name = String(location?.LocationName || '');
    const region = String(location?.Region || '');
    if (/indonesia|bali/i.test(`${name} ${region}`)) return 'Indonesia';
    if (/vietnam|viet nam|quang|northern|central|southern|hoi an|ha long/i.test(`${name} ${region}`)) return 'Vietnam';
    return region || 'Other destinations';
}

function getAdminDestinationData() {
    const locations = getLocations();
    const categories = getCategories();
    const locationsById = new Map(locations.map(x => [Number(x.LocationId), x]));
    const categoriesById = new Map(categories.map(x => [Number(x.CategoryId), x]));
    const spots = getSpots().map(item => {
        const location = locationsById.get(Number(item.LocationId));
        const category = categoriesById.get(Number(item.CategoryId));
        const categoryName = category?.CategoryName || 'Other';
        const original = destinations.find(x => Number(x.id) === Number(item.SpotId));
        const coordinates = original && original.name?.toLowerCase() === item.SpotName?.toLowerCase() ? (DEMO_METADATA[item.SpotId]?.coordinates || null) : null;
        return {
            id: item.SpotId,
            name: item.SpotName,
            country: countryFromLocation(location),
            description: item.Description || '',
            image: item.ThumbnailUrl || original?.image || '',
            category: categorySlug(categoryName),
            categoryLabel: categoryName,
            coordinates,
            promotion: getSpotPromotion(item.SpotId),
            createdAt: item.CreatedAt || '',
        };
    });
    const availableCategories = [
        { id: 'all', label: 'All types' },
        ...Array.from(new Map([
            ...BASE_CATEGORIES,
            ...categories.map(c => ({ id: categorySlug(c.CategoryName), label: c.CategoryName })),
        ].map(c => [c.id, c])).values()),
    ];
    return { spots, availableCategories };
}

const PAGE_SIZE = 9;

const markerIcon = L.divIcon({
    className: 'dest-map-pin',
    html: '<span>●</span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

function FitMapToSpots({ spots }) {
    const map = useMap();

    useEffect(() => {
        const points = spots
            .map((spot) => spot.coordinates)
            .filter(Boolean);

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
    }, [map, spots]);

    return null;
}

// Check whether a promotion is currently valid.
function isPromotionActive(promotion) {
    if (!promotion?.IsActive) return false;

    const now = new Date();
    const start = new Date(promotion.StartDate);
    const end = new Date(promotion.EndDate);

    return (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        now >= start &&
        now <= end
    );
}

// Generate the promotional label.

function getDiscountLabel(promotion) {
    const percent = Number(promotion.DiscountPercent);

    if (percent > 0) {
        return `Save ${percent}% on tours`;
    }

    const amount = Number(promotion.DiscountAmount);

    if (amount > 0) {
        return `Save ${amount.toLocaleString('vi-VN')} VND on tours`;
    }

    return null;
}


// Match promotions to tourist spots through TourPackages.SpotId.
function getSpotPromotion(spotId) {
    const matching = promotionsDemo
        .filter(isPromotionActive)
        .filter((promotion) =>
            promotion.TourPackages?.some(
                (tour) => Number(tour.SpotId) === Number(spotId)
            )
        )
        .map((promotion) => ({
            promotion,
            label: getDiscountLabel(promotion),
        }))
        .filter((item) => item.label);

    return matching[0] || null;
}

export default function Destinations() {
    const [searchParams] = useSearchParams();

    const [keyword, setKeyword] = useState(
        searchParams.get('search') || ''
    );
    const [country, setCountry] = useState('All');
    const [category, setCategory] = useState('all');
    const [sort, setSort] = useState('default');
    const [page, setPage] = useState(1);
    const [showMap, setShowMap] = useState(true);
    const [adminData, setAdminData] = useState(getAdminDestinationData);

    useEffect(() => {
        setKeyword(searchParams.get('search') || '');
        setPage(1);
    }, [searchParams]);

    // Refresh when the user returns from Admin or changes local demo data.
    useEffect(() => {
        const refresh = () => setAdminData(getAdminDestinationData());
        window.addEventListener('focus', refresh);
        window.addEventListener('storage', refresh);
        window.addEventListener('pageshow', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('storage', refresh);
            window.removeEventListener('pageshow', refresh);
        };
    }, []);

    const CATEGORIES = adminData.availableCategories;
    const spots = adminData.spots;

    const countries = useMemo(
        () => [
            'All',
            ...new Set(
                spots.map((item) => item.country).filter(Boolean)
            ),
        ],
        [spots]
    );

    const filtered = useMemo(() => {
        const q = keyword.trim().toLocaleLowerCase();

        const result = spots.filter((item) => {
            const categoryLabel =
                item.categoryLabel || '';

            const haystack = [
                item.name,
                item.country,
                item.description,
                categoryLabel,
            ]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase();

            return (
                haystack.includes(q) &&
                (country === 'All' || item.country === country) &&
                (category === 'all' || item.category === category)
            );
        });

        if (sort === 'az') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (sort === 'za') {
            result.sort((a, b) => b.name.localeCompare(a.name));
        }

        return result;
    }, [spots, keyword, country, category, sort]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const visible = filtered.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const changeFilter = (setter, value) => {
        setter(value);
        setPage(1);
    };

    const clearFilters = () => {
        setKeyword('');
        setCountry('All');
        setCategory('all');
        setSort('default');
        setPage(1);
    };

    const hasFilters = Boolean(
        keyword || country !== 'All' || category !== 'all'
    );

    return (
        <main className="dest-page">
            <div className="dest-container">
                <div className="dest-top">
                    <div>
                        <span className="dest-eyebrow">
                            DISCOVER THE WORLD
                        </span>

                        <h1>Explore destinations</h1>

                        <p>
                            Find your next adventure and explore remarkable
                            places around the world.
                        </p>
                    </div>

                    <label className="dest-search">
                        <i
                            className="bi bi-search"
                            aria-hidden="true"
                        />

                        <input
                            type="search"
                            placeholder="Where would you like to go?"
                            aria-label="Search destinations"
                            value={keyword}
                            onChange={(e) =>
                                changeFilter(setKeyword, e.target.value)
                            }
                        />
                    </label>
                </div>

                <div className="dest-filters">
                    <div
                        className="dest-country-filters"
                        aria-label="Filter by country"
                    >
                        {countries.map((item) => (
                            <button
                                key={item}
                                type="button"
                                className={
                                    country === item ? 'is-active' : ''
                                }
                                aria-pressed={country === item}
                                onClick={() =>
                                    changeFilter(setCountry, item)
                                }
                            >
                                {item === 'All'
                                    ? 'All destinations'
                                    : item}
                            </button>
                        ))}
                    </div>

                    <div className="dest-filter-actions">
                        <select
                            aria-label="Sort destinations"
                            value={sort}
                            onChange={(e) =>
                                changeFilter(setSort, e.target.value)
                            }
                        >
                            <option value="default">
                                Recommended
                            </option>
                            <option value="az">Name A - Z</option>
                            <option value="za">Name Z - A</option>
                        </select>

                        <button
                            type="button"
                            className="dest-map-toggle"
                            onClick={() =>
                                setShowMap((value) => !value)
                            }
                        >
                            <i
                                className="bi bi-map"
                                aria-hidden="true"
                            />

                            {showMap ? 'Hide map' : 'Show map'}
                        </button>
                    </div>
                </div>

                <div className="dest-type-bar">
                    <div className="dest-type-heading">
                        <i
                            className="bi bi-funnel"
                            aria-hidden="true"
                        />
                        <strong>Travel type</strong>
                    </div>

                    <div
                        className="dest-type-options"
                        aria-label="Filter by travel type"
                    >
                        {CATEGORIES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`dest-type-chip ${category === item.id
                                    ? 'is-active'
                                    : ''
                                    }`}
                                aria-pressed={category === item.id}
                                onClick={() =>
                                    changeFilter(setCategory, item.id)
                                }
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            className="dest-clear-btn"
                            onClick={clearFilters}
                        >
                            <i
                                className="bi bi-x-circle"
                                aria-hidden="true"
                            />
                            Clear filters
                        </button>
                    )}
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
                    className={`dest-layout ${showMap ? '' : 'no-map'
                        }`}
                >
                    <div className="dest-list-column">
                        {visible.length ? (
                            <div className="dest-grid">
                                {visible.map((item) => (
                                    <Link
                                        to={`/destinations/${item.id}`}
                                        className="dest-card"
                                        key={item.id}
                                    >
                                        <div className="dest-card-image">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} loading="lazy" />
                                            ) : (
                                                <span className="dest-image-empty">No image available</span>
                                            )}

                                            <span className="dest-card-arrow">
                                                <i className="bi bi-arrow-up-right" />
                                            </span>

                                            {/* NEW: Tour promotion label */}
                                            {item.promotion && (
                                                <span className="dest-promo-badge">
                                                    <i
                                                        className="bi bi-tag-fill"
                                                        aria-hidden="true"
                                                    />
                                                    {item.promotion.label}
                                                </span>
                                            )}
                                        </div>

                                        <div className="dest-card-info">
                                            <span className="dest-card-country">
                                                <i className="bi bi-geo-alt" />
                                                {item.country}
                                            </span>

                                            <h3>{item.name}</h3>

                                            <span className="dest-card-category">
                                                <i
                                                    className="bi bi-compass"
                                                    aria-hidden="true"
                                                />
                                                {item.categoryLabel || 'Other'}
                                            </span>

                                            <p>{item.description}</p>
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
                                    Try another keyword, country,
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

                        {totalPages > 1 && (
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
                                            page === number
                                                ? 'page'
                                                : undefined
                                        }
                                        className={
                                            page === number
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

                    {showMap && (
                        <aside className="dest-map-column">
                            <div className="dest-map-heading">
                                <i className="bi bi-geo-alt-fill" />
                                Explore on map
                            </div>

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

                                <FitMapToSpots spots={filtered} />

                                {filtered.map(
                                    (item) =>
                                        item.coordinates && (
                                            <Marker
                                                key={item.id}
                                                position={item.coordinates}
                                                icon={markerIcon}
                                            >
                                                <Popup>
                                                    <div className="dest-map-popup">
                                                        <strong>{item.name}</strong>

                                                        <p>
                                                            {item.country} ·{' '}
                                                            {item.categoryLabel}
                                                        </p>

                                                        <Link
                                                            to={`/destinations/${item.id}`}
                                                        >
                                                            View details
                                                        </Link>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )
                                )}
                            </MapContainer>
                        </aside>
                    )}
                </div>
            </div>
        </main>
    );
}
