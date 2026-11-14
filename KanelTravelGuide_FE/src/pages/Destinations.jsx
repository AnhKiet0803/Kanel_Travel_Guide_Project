
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { destinations } from '../components/home/HomeData';
import '../styles/destinations/Destinations.css';

const coordinates = {
    1: [20.9101, 107.1839],
    2: [15.8801, 108.3380],
    3: [-8.4095, 115.1889],
};

const markerIcon = L.divIcon({
    className: 'dest-map-pin',
    html: '<span>●</span>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

const PAGE_SIZE = 9;

export default function Destinations() {
    const [searchParams] = useSearchParams();
    const [keyword, setKeyword] = useState(
        searchParams.get('search') || ''
    );
    const [country, setCountry] = useState('All');
    const [sort, setSort] = useState('default');
    const [page, setPage] = useState(1);
    const [showMap, setShowMap] = useState(true);

    const countries = [
        'All',
        ...new Set(destinations.map(d => d.country)),
    ];

    const filtered = useMemo(() => {
        const search = keyword.trim().toLowerCase();

        const result = destinations.filter(item => {
            const text = [
                item.name,
                item.country,
                item.description,
            ].join(' ').toLowerCase();

            return text.includes(search) &&
                (country === 'All' || item.country === country);
        });

        if (sort === 'az') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (sort === 'za') {
            result.sort((a, b) => b.name.localeCompare(a.name));
        }

        return result;
    }, [keyword, country, sort]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

    const visible = filtered.slice(
        (page - 1) * PAGE_SIZE,
        page * PAGE_SIZE
    );

    const updateKeyword = value => {
        setKeyword(value);
        setPage(1);
    };

    const updateCountry = value => {
        setCountry(value);
        setPage(1);
    };

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
                            Find your next adventure and explore
                            remarkable places around the world.
                        </p>
                    </div>

                    <div className="dest-search">
                        <i className="bi bi-search" />
                        <input
                            type="search"
                            placeholder="Where would you like to go?"
                            aria-label="Search destinations"
                            value={keyword}
                            onChange={e => updateKeyword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="dest-filters">
                    <div className="dest-country-filters">
                        {countries.map(item => (
                            <button
                                key={item}
                                type="button"
                                className={
                                    country === item ? 'is-active' : ''
                                }
                                onClick={() => updateCountry(item)}
                            >
                                {item === 'All' ? 'All destinations' : item}
                            </button>
                        ))}
                    </div>

                    <div className="dest-filter-actions">
                        <select
                            aria-label="Sort destinations"
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                        >
                            <option value="default">Recommended</option>
                            <option value="az">Name A - Z</option>
                            <option value="za">Name Z - A</option>
                        </select>

                        <button
                            type="button"
                            className="dest-map-toggle"
                            onClick={() => setShowMap(!showMap)}
                        >
                            <i className="bi bi-map" />
                            {showMap ? 'Hide map' : 'Show map'}
                        </button>
                    </div>
                </div>

                <div className="dest-results-heading">
                    <h2>Discover amazing places</h2>
                    <span>{filtered.length} destinations</span>
                </div>

                <div className={
                    `dest-layout ${showMap ? '' : 'no-map'}`
                }>
                    <div className="dest-list-column">
                        {visible.length > 0 ? (
                            <div className="dest-grid">
                                {visible.map(item => (
                                    <Link
                                        to={`/destinations/${item.id}`}
                                        className="dest-card"
                                        key={item.id}
                                    >
                                        <div className="dest-card-image">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                loading="lazy"
                                            />
                                            <span className="dest-card-arrow">
                                                <i className="bi bi-arrow-up-right" />
                                            </span>
                                        </div>

                                        <div className="dest-card-info">
                                            <span className="dest-card-country">
                                                <i className="bi bi-geo-alt" />
                                                {item.country}
                                            </span>
                                            <h3>{item.name}</h3>
                                            <p>{item.description}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="dest-empty">
                                <i className="bi bi-search" />
                                <h3>No destinations found</h3>
                                <p>Try another destination or country.</p>
                            </div>
                        )}

                        {totalPages > 1 && (
                            <nav className="dest-pagination" aria-label="Pagination">
                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1
                                ).map(number => (
                                    <button
                                        key={number}
                                        type="button"
                                        className={
                                            page === number ? 'is-active' : ''
                                        }
                                        onClick={() => setPage(number)}
                                    >
                                        {number}
                                    </button>
                                ))}
                            </nav>
                        )}
                    </div>

                    {showMap && (
                        <div className="dest-map-column">
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
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {filtered.map(item => {
                                    const position = coordinates[item.id];
                                    if (!position) return null;

                                    return (
                                        <Marker
                                            key={item.id}
                                            position={position}
                                            icon={markerIcon}
                                        >
                                            <Popup>
                                                <div className="dest-map-popup">
                                                    <strong>{item.name}</strong>
                                                    <p>{item.country}</p>
                                                    <Link to={`/destinations/${item.id}`}>
                                                        View details
                                                    </Link>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MapContainer>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
