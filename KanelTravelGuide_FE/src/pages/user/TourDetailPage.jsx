import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { tourService, money } from '../../services/tourService';
import '../../styles/tour-detail.css';

const notes = [
    ['What’s included', 'Transportation, accommodation, and services explicitly listed in the itinerary. Please confirm inclusions before booking.'],
    ['What’s not included', 'Personal expenses and services not explicitly included in the itinerary.'],
    ['Children’s pricing', 'Children’s rates depend on age and the specific tour policy. Please confirm before booking.'],
    ['Payment terms', 'Payment schedules will be confirmed during the booking process.'],
    ['Booking requirements', 'Please provide traveler details and any required documents.'],
    ['Cancellation policy', 'Cancellation terms depend on the selected tour and booking date.'],
    ['Force majeure', 'The itinerary may change due to weather or operational conditions.'],
    ['Contact', 'Contact Karnel Travels to confirm tour details and availability.'],
];
const fallbackImage = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200';
const dateLabel = date => { const d = new Date(`${date}T00:00:00`); return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }); };
function normalizeItinerary(items) {
    return (Array.isArray(items) ? items : []).map((item, i) => typeof item === 'string'
        ? { title: item, description: 'Detailed itinerary information will be updated soon.' }
        : { title: item.title || `Day ${i + 1}`, description: item.description || item.content || 'Detailed itinerary information will be updated soon.' });
}
function normalizeReviews(tour) {
    // Supported optional shape: tour.reviews = [{ id, name, rating, comment, date }].
    // No sample reviews are invented when the API does not return any.
    const raw = Array.isArray(tour?.reviews) ? tour.reviews : [];
    return raw.map((r, i) => ({
        id: r.id ?? i,
        name: String(r.name || r.customerName || r.userName || 'Traveler'),
        rating: Number(r.rating ?? r.stars ?? r.score),
        comment: String(r.comment || r.content || r.text || ''),
        date: r.date || r.createdAt || ''
    })).filter(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5);
}
export default function TourDetailPage() {
    const { id } = useParams();
    const [tour, setTour] = useState(null);
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [photo, setPhoto] = useState(0);
    const [month, setMonth] = useState(0);
    const [selectedDate, setSelectedDate] = useState('');
    const [openDays, setOpenDays] = useState([]);
    useEffect(() => {
        let mounted = true;
        setLoading(true); setError(''); setTour(null); setPhoto(0); setMonth(0); setSelectedDate(''); setOpenDays([]);
        Promise.all([tourService.get(id), tourService.list()])
            .then(([current, items]) => { if (mounted) { setTour(current); setAll(Array.isArray(items) ? items : []); } })
            .catch(e => { if (mounted) setError(e.message || 'Unable to load tour information'); })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [id]);
    const photos = useMemo(() => tour ? [...new Set([tour.image, ...(Array.isArray(tour.images) ? tour.images : [])].filter(Boolean))] : [], [tour]);
    const itinerary = useMemo(() => normalizeItinerary(tour?.itinerary), [tour]);
    const departures = useMemo(() => (Array.isArray(tour?.departures) ? tour.departures : [])
        .filter(d => d && (typeof d === 'string' || d.date))
        .map(d => typeof d === 'string' ? { date: d } : d)
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d.date)), [tour]);
    const months = useMemo(() => [...new Set(departures.map(d => d.date.slice(0, 7)))].sort(), [departures]);
    const visibleDepartures = departures.filter(d => d.date.startsWith(months[month] || '---'));
    const reviews = useMemo(() => normalizeReviews(tour), [tour]);
    const rating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
    const related = all.filter(t => String(t.id) !== String(id) && t.status === 'active').slice(0, 3);
    if (loading) return <main className="ktd-state">Loading tour details...</main>;
    if (error) return <main className="ktd-state" role="alert">Unable to load tour: {error}</main>;
    if (!tour || tour.status !== 'active') return <main className="ktd-state">Tour not found. <Link to="/tours">Browse tours</Link></main>;
    const chosen = departures.find(d => d.date === selectedDate);
    const bookingUrl = `/tours/booking?tourId=${encodeURIComponent(tour.id)}&tour=${encodeURIComponent(tour.title)}${selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ''}`;
    return <main className="ktd-page">
        <div className="ktd-container">
            <nav className="ktd-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/tours">Tours</Link><span>/</span><span>{tour.title}</span></nav>
            <header className="ktd-header">
                <div><span className="ktd-eyebrow">KARNEL TRAVELS · TOUR EXPERIENCE</span><h1>{tour.title}</h1>
                    <div className="ktd-meta"><span>📍 {tour.destination}</span><span>◷ {tour.duration} days</span><span>✦ Tour code KT-{String(tour.id).padStart(4, '0')}</span></div></div>
                <div className="ktd-rating-summary">{rating !== null ? <><strong>{rating.toFixed(1)} <span>/ 5</span></strong><span className="ktd-stars">★★★★★</span><small>{reviews.length} reviews</small></> : <><strong>—</strong><small>No reviews yet</small></>}</div>
            </header>
            <div className="ktd-top-grid">
                <section className="ktd-gallery" aria-label="Tour photos">
                    <div className="ktd-photo-wrap"><img className="ktd-photo" src={photos[photo] || fallbackImage} alt={tour.title} /></div>
                    {photos.length > 1 && <div className="ktd-thumbs">{photos.map((src, i) => <button type="button" key={src} className={photo === i ? 'active' : ''} onClick={() => setPhoto(i)} aria-label={`View photo ${i + 1}`} aria-pressed={photo === i}><img src={src} alt={`Tour photo ${i + 1}`} /></button>)}</div>}
                </section>
                <aside className="ktd-booking">
                    <span className="ktd-eyebrow">BEST AVAILABLE RATE</span><h2>Book this tour</h2>
                    <div className="ktd-booking-detail"><span>Destination</span><strong>{tour.destination}</strong></div>
                    <div className="ktd-booking-detail"><span>Duration</span><strong>{tour.duration} days</strong></div>
                    <div className="ktd-booking-detail"><span>Tour code</span><strong>KT-{String(tour.id).padStart(4, '0')}</strong></div>
                    {selectedDate && <div className="ktd-booking-detail"><span>Departure date</span><strong>{dateLabel(selectedDate)}</strong></div>}
                    <div className="ktd-booking-price"><span>From / person</span><strong>{money(chosen?.price ?? tour.price)}</strong></div>
                    <div className="ktd-booking-perks"><span>✓ Tour details at a glance</span><span>✓ Itinerary assistance</span><span>✓ Review terms before booking</span></div>
                    <Link className="ktd-primary" to={bookingUrl} state={{ tourId: tour.id, tour, selectedDate, price: chosen?.price ?? tour.price }}>Book now <span>→</span></Link>
                    <p className="ktd-small">Demo booking: live availability and payment confirmation depend on the booking system.</p>
                </aside>
            </div>
            <div className="ktd-content-grid">
                <div className="ktd-main-column">
                    <section className="ktd-section"><div className="ktd-section-title"><span className="ktd-eyebrow">OVERVIEW</span><h2>Tour highlights</h2></div><div className="ktd-panel"><p>{tour.description || 'Discover your next journey with Karnel Travels.'}</p></div></section>
                    <section className="ktd-section"><div className="ktd-section-title"><span className="ktd-eyebrow">TRIP ESSENTIALS</span><h2>Trip essentials</h2></div><div className="ktd-facts">
                        <div><span className="ktd-fact-icon">📍</span><strong>Destination</strong><p>{tour.destination}</p></div>
                        <div><span className="ktd-fact-icon">🗓️</span><strong>Duration</strong><p>{tour.duration} days</p></div>
                        <div><span className="ktd-fact-icon">🍽️</span><strong>Meals</strong><p>As per itinerary</p></div>
                        <div><span className="ktd-fact-icon">🚌</span><strong>Transport</strong><p>As per itinerary</p></div>
                    </div></section>
                    <section className="ktd-section"><div className="ktd-section-title"><span className="ktd-eyebrow">DEPARTURES</span><h2>Departure dates</h2></div>
                        {months.length ? <><div className="ktd-months">{months.map((m, i) => <button type="button" key={m} className={month === i ? 'active' : ''} onClick={() => { setMonth(i); setSelectedDate(''); }}>{new Date(`${m}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</button>)}</div>
                            <div className="ktd-departures">{visibleDepartures.map((d, i) => <button type="button" key={`${d.date}-${i}`} className={selectedDate === d.date ? 'active' : ''} onClick={() => setSelectedDate(d.date)}><span>{dateLabel(d.date)}</span><strong>{money(d.price ?? tour.price)}</strong><span>{selectedDate === d.date ? '✓ Selected' : 'Select date →'}</span></button>)}</div></> : <div className="ktd-panel ktd-muted">No departure dates have been published yet. Please contact us for assistance.</div>}
                    </section>
                    <section className="ktd-section"><div className="ktd-section-title"><span className="ktd-eyebrow">ITINERARY</span><h2>Detailed itinerary</h2></div><div className="ktd-accordion">{itinerary.length ? itinerary.map((day, i) => <div className="ktd-accordion-item" key={i}><button type="button" aria-expanded={openDays.includes(i)} onClick={() => setOpenDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}><span className="ktd-day">{String(i + 1).padStart(2, '0')}</span><strong>{day.title}</strong><span className="ktd-plus">{openDays.includes(i) ? '−' : '+'}</span></button>{openDays.includes(i) && <p>{day.description}</p>}</div>) : <p className="ktd-empty-text">The detailed itinerary is coming soon.</p>}</div></section>
                    <section className="ktd-section"><div className="ktd-section-title"><span className="ktd-eyebrow">IMPORTANT INFORMATION</span><h2>Important information</h2></div><div className="ktd-accordion">{notes.map(([title, content]) => <details className="ktd-note" key={title}><summary>{title}</summary><p>{content}</p></details>)}</div><p className="ktd-small">These policies are demo content and must be confirmed before publication.</p></section>
                </div>
                <aside className="ktd-side-column"><div className="ktd-help"><span className="ktd-eyebrow">NEED ASSISTANCE?</span><h3>Need help planning?</h3><p>Get help with the itinerary, booking terms, and availability.</p><Link to={bookingUrl} state={{ tourId: tour.id, tour, selectedDate, price: chosen?.price ?? tour.price }}>Book your tour →</Link></div></aside>
            </div>
            <section className="ktd-section ktd-reviews" id="tour-reviews"><div className="ktd-section-title"><span className="ktd-eyebrow">TRAVELER FEEDBACK</span><h2>Traveler reviews</h2></div>
                {reviews.length ? <div className="ktd-review-layout"><div className="ktd-review-overview"><strong>{rating.toFixed(1)}<small>/5</small></strong><span className="ktd-stars">★★★★★</span><p>Based on {reviews.length} reviews</p>{[5, 4, 3, 2, 1].map(star => { const count = reviews.filter(r => Math.round(r.rating) === star).length; return <div className="ktd-rating-bar" key={star}><span>{star} ★</span><div><i style={{ width: `${count / reviews.length * 100}%` }} /></div><span>{count}</span></div>; })}</div><div className="ktd-review-list">{reviews.map(r => <article className="ktd-review" key={r.id}><div className="ktd-review-top"><div><strong>{r.name}</strong><span className="ktd-stars">{'★'.repeat(Math.round(r.rating))}{'☆'.repeat(5 - Math.round(r.rating))}</span></div><small>{r.date ? String(r.date).slice(0, 10) : ''}</small></div>{r.comment && <p>{r.comment}</p>}</article>)}</div></div>
                    : <div className="ktd-review-empty"><span>☆</span><div><h3>No reviews for this tour yet</h3><p>Traveler reviews will appear here when review data is available.</p></div></div>}
            </section>
            {related.length > 0 && <section className="ktd-section ktd-related-section"><div className="ktd-section-title"><span className="ktd-eyebrow">EXPLORE MORE</span><h2>You may also like</h2></div><div className="ktd-related">{related.map(t => <article key={t.id}><Link to={`/tours/${t.id}`}><img src={t.image || fallbackImage} alt={t.title} loading="lazy" /><div><small>📍 {t.destination} · {t.duration} days</small><h3>{t.title}</h3><p>From <strong>{money(t.price)}</strong></p><span>View details →</span></div></Link></article>)}</div></section>}
        </div>
    </main>;
}
