import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTourPromotions, money, tourService } from '../../services/tourService.js';
import '../../styles/admin/AdminTours.css';

const TOURS_PER_PAGE = 5;
const EMPTY_FILTERS = {
    destination: '', duration: '', promotion: '', featured: '', itinerary: '',
    minStandard: '', maxStandard: '', minSale: '', maxSale: '',
};
const PRICE_FILTERS = [
    ['minStandard', 'Min. standard price (VND)'],
    ['maxStandard', 'Max. standard price (VND)'],
    ['minSale', 'Min. sale price (VND)'],
    ['maxSale', 'Max. sale price (VND)'],
];

function inPriceRange(price, min, max) {
    if (!min && !max) return true;
    return price != null && (!min || price >= Number(min)) && (!max || price <= Number(max));
}

const normalizeSearch = (value) => String(value ?? '').toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').trim();

export default function AdminToursPage() {
    const [tours, setTours] = useState(null);
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [promotions, setPromotions] = useState([]);
    const [page, setPage] = useState(1);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        let active = true;
        tourService.list()
            .then((items) => { if (active) setTours(items); })
            .catch((failure) => { if (active) setError(failure.message); });
        listTourPromotions({ activeOnly: false })
            .then((items) => { if (active) setPromotions(items); })
            .catch(() => {}); // Linked promotion IDs remain filterable if their labels are unavailable.
        return () => { active = false; };
    }, []);

    async function remove(tour) {
        if (deleting || !window.confirm(`Delete “${tour.title}”?`)) return;
        setDeleting(tour.id);
        setError('');
        try {
            await tourService.remove(tour.id);
            setTours((items) => items.filter((item) => item.id !== tour.id));
        } catch (failure) {
            setError(failure.message);
        } finally {
            setDeleting(null);
        }
    }

    const keyword = normalizeSearch(query);
    const itinerary = normalizeSearch(filters.itinerary);
    const destinations = new Map((tours ?? []).filter(tour => tour.spotId != null)
        .map(tour => [String(tour.spotId), tour.destination || 'Destination #' + tour.spotId]));
    const durations = [...new Set((tours ?? []).map(tour => tour.duration).filter(Boolean))].sort();
    const promotionNames = new Map(promotions.map(promotion => [String(promotion.promotionId),
        [promotion.title, promotion.promoCode].filter(Boolean).join(' · ')]));
    const linkedPromotions = [...new Set((tours ?? []).filter(tour => tour.promotionId != null)
        .map(tour => String(tour.promotionId)))];
    const hasFilters = Boolean(keyword || Object.values(filters).some(Boolean));

    const matches = tours?.filter((tour) => {
        const promotionLabel = promotionNames.get(String(tour.promotionId));
        const searchable = [tour.title, tour.destination, tour.id, tour.duration, promotionLabel, tour.itineraryDetail];
        return normalizeSearch(searchable.join(' ')).includes(keyword)
            && (!filters.destination || filters.destination === String(tour.spotId ?? 'none'))
            && (!filters.duration || filters.duration === tour.duration)
            && (!filters.promotion || filters.promotion === String(tour.promotionId ?? 'none'))
            && (!filters.featured || tour.isFeatured === (filters.featured === 'yes'))
            && (!itinerary || normalizeSearch(tour.itineraryDetail).includes(itinerary))
            && inPriceRange(tour.standardPrice, filters.minStandard, filters.maxStandard)
            && inPriceRange(tour.salePrice, filters.minSale, filters.maxSale);
    });
    const pageCount = Math.max(1, Math.ceil((matches?.length ?? 0) / TOURS_PER_PAGE));
    const currentPage = Math.min(page, pageCount);
    const offset = (currentPage - 1) * TOURS_PER_PAGE;
    const visible = matches?.slice(offset, offset + TOURS_PER_PAGE);

    function changeQuery(value) {
        setQuery(value);
        setPage(1);
    }

    function changeFilter(name, value) {
        setFilters(previous => ({ ...previous, [name]: value }));
        setPage(1);
    }

    function resetFilters() {
        setFilters(EMPTY_FILTERS);
        changeQuery('');
    }

    return (
        <main className="at-page">
            <header className="at-head">
                <div><h1>Tours</h1><p>Manage the tours shown on the website.</p></div>
                <Link className="at-primary" to="/admin/tours/new">Add tour</Link>
            </header>
            <section className="at-panel">
                <div className="at-list-heading"><h2>All tours</h2>{matches && <span>{matches.length} results</span>}</div>
                <div className="at-filter-grid">
                    <label><span>Search tours</span><input type="search" value={query}
                        placeholder="Tour name, destination or ID" onChange={(event) => changeQuery(event.target.value)} /></label>
                    <label><span>Destination</span><select value={filters.destination}
                        onChange={(event) => changeFilter('destination', event.target.value)}>
                        <option value="">All destinations</option>
                        <option value="none">No linked destination</option>
                        {[...destinations].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select></label>
                    <label><span>Duration</span><select value={filters.duration}
                        onChange={(event) => changeFilter('duration', event.target.value)}>
                        <option value="">Any duration</option>
                        {durations.map(duration => <option key={duration} value={duration}>{duration}</option>)}
                    </select></label>
                    <label><span>Linked promotion</span><select value={filters.promotion}
                        onChange={(event) => changeFilter('promotion', event.target.value)}>
                        <option value="">All promotions</option>
                        <option value="none">No linked promotion</option>
                        {linkedPromotions.map(id => <option key={id} value={id}>{promotionNames.get(id) || 'Promotion #' + id}</option>)}
                    </select></label>
                    <label><span>Featured</span><select value={filters.featured}
                        onChange={(event) => changeFilter('featured', event.target.value)}>
                        <option value="">All tours</option>
                        <option value="yes">Featured</option>
                        <option value="no">Not featured</option>
                    </select></label>
                    <label><span>Itinerary</span><input type="search" value={filters.itinerary}
                        placeholder="Keyword in the itinerary" onChange={(event) => changeFilter('itinerary', event.target.value)} /></label>
                    {PRICE_FILTERS.map(([key, label]) => (
                        <label key={key}><span>{label}</span><input type="number" min="0" step="any" value={filters[key]}
                            onChange={(event) => changeFilter(key, event.target.value)} /></label>
                    ))}
                    <div className="align-self-end">
                        <button type="button" className="at-secondary" disabled={!hasFilters} onClick={resetFilters}>Reset filters</button>
                    </div>
                </div>
                {error && <p className="at-error" role="alert">{error}</p>}
                {!tours && !error && <p className="at-empty" role="status">Loading tours…</p>}
                {visible?.length === 0 && <p className="at-empty" role="status">{hasFilters ? 'No matching tours.' : 'No tours yet.'}</p>}
                {visible?.length > 0 && (
                    <div className="at-table-wrap">
                        <table className="at-table">
                            <thead><tr><th>Tour</th><th>Destination</th><th>Duration</th><th>Price</th><th>Featured</th><th>Actions</th></tr></thead>
                            <tbody>
                                {visible.map((tour) => (
                                    <tr key={tour.id}>
                                        <td><Link to={`/admin/tours/${tour.id}`}>{tour.title}</Link></td>
                                        <td>{tour.destination || '—'}</td><td>{tour.duration}</td>
                                        <td><strong>{money(tour.price)}</strong></td><td>{tour.isFeatured ? 'Yes' : '—'}</td>
                                        <td><div className="at-actions">
                                            <Link to={`/admin/tours/${tour.id}`}>View</Link>
                                            <Link to={`/admin/tours/${tour.id}/edit`}>Edit</Link>
                                            <button type="button" disabled={deleting != null} onClick={() => remove(tour)}>{deleting === tour.id ? 'Deleting…' : 'Delete'}</button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {visible?.length > 0 && (
                    <nav className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-top p-3"
                        aria-label="Tours pagination">
                        <span className="small text-muted" role="status">
                            Showing {offset + 1}–{offset + visible.length} of {matches.length} tours
                        </span>
                        {pageCount > 1 && <div className="d-flex align-items-center gap-2">
                            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1}
                                onClick={() => setPage(currentPage - 1)}>Previous</button>
                            <span className="small">Page {currentPage} of {pageCount}</span>
                            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={currentPage === pageCount}
                                onClick={() => setPage(currentPage + 1)}>Next</button>
                        </div>}
                    </nav>
                )}
            </section>
        </main>
    );
}
