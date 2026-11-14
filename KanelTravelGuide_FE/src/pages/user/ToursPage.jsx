import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { tourService, money } from '../../services/tourService';
import '../../styles/tours.css';

export default function ToursPage() {
    const [tours, setTours] = useState([]);
    const [query, setQuery] = useState('');
    const [destination, setDestination] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sort, setSort] = useState('recommended');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let alive = true;
        async function load() {
            try {
                const items = await tourService.list();
                if (alive) { setTours(Array.isArray(items) ? items : []); setError(''); }
            } catch (e) {
                if (alive) setError(e?.message || 'Unable to load tours.');
            } finally {
                if (alive) setLoading(false);
            }
        }
        load();
        window.addEventListener('karnel-tours-updated', load);
        window.addEventListener('focus', load);
        return () => {
            alive = false;
            window.removeEventListener('karnel-tours-updated', load);
            window.removeEventListener('focus', load);
        };
    }, []);

    const destinations = useMemo(() => [...new Set(tours.filter(t => t.status === 'active').map(t => t.destination).filter(Boolean))].sort(), [tours]);
    const filtered = useMemo(() => {
        const q = query.trim().toLocaleLowerCase();
        const items = tours.filter(t =>
            t.status === 'active' &&
            `${t.title || ''} ${t.destination || ''} ${t.description || ''}`.toLocaleLowerCase().includes(q) &&
            (!destination || t.destination === destination) &&
            (maxPrice === '' || (Number(maxPrice) >= 0 && Number(t.price) <= Number(maxPrice)))
        );
        if (sort === 'low') items.sort((a, b) => Number(a.price) - Number(b.price));
        if (sort === 'high') items.sort((a, b) => Number(b.price) - Number(a.price));
        if (sort === 'az') items.sort((a, b) => String(a.title).localeCompare(String(b.title)));
        if (sort === 'za') items.sort((a, b) => String(b.title).localeCompare(String(a.title)));
        return items;
    }, [tours, query, destination, maxPrice, sort]);

    const reset = () => { setQuery(''); setDestination(''); setMaxPrice(''); setSort('recommended'); };
    const hasFilters = Boolean(query || destination || maxPrice || sort !== 'recommended');

    return (
        <main className="kt-tour-page">
            <section className="kt-tour-hero">
                <div className="kt-tour-container kt-tour-hero-content">
                    <div className="kt-tour-breadcrumb"><Link to="/">Home</Link><span>/</span> Tours</div>
                    <span className="kt-tour-kicker">KARNEL TRAVELS · DISCOVER MORE</span>
                    <h1>Discover our tours</h1>
                    <p>Find your next unforgettable journey. Explore handpicked experiences and amazing places.</p>
                </div>
            </section>

            <div className="kt-tour-container kt-tour-main">
                <section className="kt-tour-search" aria-label="Filter tours">
                    <div className="kt-tour-search-grid">
                        <label className="kt-tour-field kt-tour-keyword">
                            <span><i className="bi bi-search" /> Tour or destination</span>
                            <input type="search" placeholder="Search tours or destinations..." value={query} onChange={e => setQuery(e.target.value)} />
                        </label>
                        <label className="kt-tour-field">
                            <span><i className="bi bi-geo-alt" /> Destination</span>
                            <select value={destination} onChange={e => setDestination(e.target.value)}>
                                <option value="">All destinations</option>
                                {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </label>
                        <label className="kt-tour-field">
                            <span><i className="bi bi-wallet2" /> Max budget (VND)</span>
                            <input type="number" min="0" placeholder="Any budget" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
                        </label>
                        <label className="kt-tour-field">
                            <span><i className="bi bi-sort-down" /> Sort by</span>
                            <select value={sort} onChange={e => setSort(e.target.value)}>
                                <option value="recommended">Recommended</option>
                                <option value="low">Price: low to high</option>
                                <option value="high">Price: high to low</option>
                                <option value="az">Name A–Z</option>
                                <option value="za">Name Z–A</option>
                            </select>
                        </label>
                        <button className="kt-tour-reset" type="button" onClick={reset} title="Reset filters" aria-label="Reset filters" disabled={!hasFilters}>
                            <i className="bi bi-arrow-counterclockwise" /><span>Reset</span>
                        </button>
                    </div>
                </section>

                <section className="kt-tour-results">
                    <header className="kt-tour-results-head">
                        <div><span className="kt-tour-kicker-dark">EXPLORE YOUR OPTIONS</span><h2>Available tours</h2><p>{filtered.length} tour{filtered.length !== 1 ? 's' : ''} found</p></div>
                        <span className="kt-tour-count">{filtered.length} results</span>
                    </header>
                    <p className="kt-tour-info"><i className="bi bi-info-circle" /> Tours and prices are demo data. Real-time availability requires backend API integration.</p>
                    {error && <p className="kt-tour-error" role="alert">{error}</p>}
                    {loading ? <div className="kt-tour-empty">Loading tours...</div> : (
                        <>
                            <div className="kt-tour-grid">
                                {filtered.map(t => (
                                    <article className="kt-tour-card" key={t.id}>
                                        <Link to={`/tours/${t.id}`} className="kt-tour-card-image" aria-label={`View ${t.title}`}>
                                            {t.image ? <img src={t.image} alt={t.title} loading="lazy" /> : <div className="kt-tour-no-image">No image available</div>}
                                            <span className="kt-tour-image-arrow"><i className="bi bi-arrow-up-right" /></span>
                                        </Link>
                                        <div className="kt-tour-card-body">
                                            <small className="kt-tour-card-meta"><i className="bi bi-geo-alt" /> {t.destination || 'Destination'} <span>·</span> <i className="bi bi-clock" /> {t.duration} days</small>
                                            <h3><Link to={`/tours/${t.id}`}>{t.title}</Link></h3>
                                            <p>{t.description || 'Discover an unforgettable travel experience.'}</p>
                                            <div className="kt-tour-card-footer">
                                                <div><span>From</span><strong>{money(t.price)}</strong></div>
                                                <Link className="kt-tour-button" to={`/tours/${t.id}`}>View details <i className="bi bi-arrow-right" /></Link>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            {!filtered.length && !error && <div className="kt-tour-empty"><i className="bi bi-search" /><h3>No tours found</h3><p>Try a different keyword, destination or budget.</p><button type="button" onClick={reset}>Clear filters</button></div>}
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
