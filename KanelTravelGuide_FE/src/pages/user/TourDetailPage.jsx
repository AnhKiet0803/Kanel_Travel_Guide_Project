import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { money, readTourItinerary, tourService } from '../../services/tourService.js';
import { extraKey, loadTourExtras, parseTourExtras } from '../../services/tourExtras.js';
import { listTourDepartures } from '../../api/tourDepartureApi.js';
import TourDepartureOverview from './TourDepartureOverview.jsx';
import TourServiceSuggestions from './TourServiceSuggestions.jsx';
import TourReviews from './TourReviews.jsx';
import TourStayOptions from './TourStayOptions.jsx';
import TourTravelerPicker from './TourTravelerPicker.jsx';
import TourDateRangePicker from './TourDateRangePicker.jsx';
import TourPhoto from './TourPhoto.jsx';
import '../../styles/tour-detail.css';
import '../../styles/tour-experience.css';
import '../../styles/tour-radar-layout.css';

const formatDate = (value) => value?.split('-').reverse().join('/') ?? '';
const hoiAnPhotos = [
    'https://ak-d.tripcdn.com/images/1mi0j12000qr2t0n3677B.jpg?proc=source%2Ftrip',
    'https://cdn.hstatic.net/files/200001089693/file/pho-co-hoi-an-lung-linh-den-long-buoi-toi_1024x1024.jpg',
    'https://cdn.getyourguide.com/img/tour/4bfc35d50d6f7b5a.jpeg/155.jpg',
];

function itineraryStages(text) {
    return text?.trim().split(/\s+(?=(?:Day|Ngày)\s+\d+\s*[:.\-–])|\n\s*\n/iu)
        .filter(Boolean).map((stage) => {
            const heading = stage.match(/^(?:Day|Ngày)\s+(\d+)\s*[:.\-–]\s*/iu);
            const lines = stage.slice(heading?.[0].length ?? 0).split(/\r?\n/).filter((line) => line.trim());
            return { day: heading ? 'Day ' + heading[1] : 'Itinerary', title: lines[0], lines: lines.slice(1) };
        }) ?? [];
}

function PhotoGalleryDialog({ photos, title, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
        const dialog = ref.current;
        dialog.showModal();
        return () => { if (dialog.open) dialog.close(); };
    }, []);
    return (
        <dialog ref={ref} className="tr-gallery-dialog" aria-label={'Photos of ' + title} onClose={(event) => { if (!event.currentTarget.open) onClose(); }}>
            <div className="tr-section-heading"><h2>{title}</h2><button type="button" onClick={() => ref.current.close()} aria-label="Close gallery">✕</button></div>
            <div>{photos.map((image) => <TourPhoto key={image} src={image} name={title} />)}</div>
        </dialog>
    );
}

export default function TourDetailPage() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const { hash } = useLocation();
    return <TourArticle key={id + ':' + params.toString()} id={id} params={params} hash={hash} />;
}

function TourArticle({ id, params, hash }) {
    const [result, setResult] = useState(null);
    const [departureId, setDepartureId] = useState(() => Number(params.get('departureId')) || null);
    const [dateRange, setDateRange] = useState(() => {
        if (params.has('fromDate') || params.has('toDate'))
            return { fromDate: params.get('fromDate') ?? '', toDate: params.get('toDate') ?? '' };
        const exact = params.get('date');
        if (exact) return { fromDate: exact, toDate: exact };
        if (params.has('departureId')) return { fromDate: '', toDate: '' };
        return { fromDate: '2026-12-05', toDate: '2027-02-06' };
    });
    const [adults, setAdults] = useState(() => {
        const count = Number(params.get('adults') ?? 2);
        return Number.isInteger(count) && count >= 1 && count <= 1000 ? count : 2;
    });
    const [children, setChildren] = useState(() => {
        const count = Number(params.get('children') ?? 0);
        return Number.isInteger(count) && count >= 0 && count + adults <= 1000 ? count : 0;
    });
    const [quantities, setQuantities] = useState(() => Object.fromEntries(
        (parseTourExtras(params.get('extras')) ?? []).map((item) => [extraKey(item), item.quantity]),
    ));
    const [extrasResult, setExtrasResult] = useState(null);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [allExpanded, setAllExpanded] = useState(false);
    const priceHeading = useRef(null);
    const itineraryRef = useRef(null);
    const selectionDate = result?.departures?.find((item) => item.tourDepartureId === departureId)?.departureDate;
    const locationId = result?.tour?.locationId;

    useEffect(() => {
        let active = true;
        Promise.all([tourService.get(id), listTourDepartures(id).catch(() => null), tourService.list().catch(() => [])])
            .then(([tour, departures, catalog]) => {
                if (!active) return;
                const exact = params.get('date');
                if (exact && !params.has('departureId'))
                    setDepartureId(departures?.find((item) => item.departureDate === exact && item.seatsLeft > 0)?.tourDepartureId ?? null);
                const stats = catalog.find((item) => item.id === tour.id);
                setResult({ tour: { ...tour, reviewCount: stats?.reviewCount, averageRating: stats?.averageRating }, departures, catalog });
            }).catch((error) => { if (active) setResult({ error: error.message }); });
        return () => { active = false; };
    }, [id, params]);

    useEffect(() => {
        if (!locationId || !selectionDate) return;
        const requestScope = new AbortController();
        loadTourExtras(locationId, selectionDate)
            .then((items) => { if (!requestScope.signal.aborted) setExtrasResult({ date: selectionDate, items }); })
            .catch((error) => { if (!requestScope.signal.aborted) setExtrasResult({ date: selectionDate, error: error.message }); });
        return () => requestScope.abort();
    }, [locationId, selectionDate]);

    useEffect(() => {
        if (result?.tour && ['#tour-departures', '#tour-itinerary', '#tour-extra-services', '#tour-reviews-heading'].includes(hash))
            document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    }, [result, hash]);

    function selectDeparture(nextId) {
        setDepartureId(nextId);
        setQuantities({});
        if (nextId && window.matchMedia('(max-width: 760px)').matches) priceHeading.current?.focus();
    }

    function changeDateRange(nextRange) {
        setDateRange(nextRange);
        if (selectionDate && ((nextRange.fromDate && selectionDate < nextRange.fromDate)
            || (nextRange.toDate && selectionDate > nextRange.toDate))) selectDeparture(null);
    }

    function expandItinerary() {
        const details = [...itineraryRef.current.querySelectorAll('details')];
        const expand = details.some((item) => !item.open);
        details.forEach((item) => { item.open = expand; });
        setAllExpanded(expand);
    }

    if (!result) return <main className="ktd-state" role="status">Loading tour…</main>;
    if (result.error) return <main className="ktd-state"><p role="alert">{result.error}</p><Link to="/tours">Browse tours</Link></main>;

    const { tour, catalog } = result;
    const { fromDate, toDate } = dateRange;
    const departures = result.departures?.filter((item) => (!fromDate || item.departureDate >= fromDate)
        && (!toDate || item.departureDate <= toDate)) ?? result.departures;
    const departure = departures?.find((item) => item.tourDepartureId === departureId && item.seatsLeft > 0);
    const bookable = departures?.filter((item) => item.seatsLeft > 0) ?? [];
    const startingFare = bookable.length ? Math.min(...bookable.map((item) => item.adultPrice)) : null;
    const adultCount = Number(adults), childCount = Number(children);
    const travelerCount = adultCount + childCount;
    const validGroup = Number.isInteger(adultCount) && adultCount >= 1 && Number.isInteger(childCount)
        && childCount >= 0 && travelerCount <= 1000;
    const groupFits = departure && validGroup && travelerCount <= departure.seatsLeft;
    const selectedExtras = extrasResult && extrasResult.date === selectionDate
        ? (extrasResult.items ?? []).filter((item) => quantities[extraKey(item)] > 0)
            .map((item) => ({ ...item, quantity: quantities[extraKey(item)] }))
        : [];
    const tourTotal = departure && validGroup ? departure.adultPrice * adultCount + departure.childPrice * childCount : 0;
    const extrasTotal = selectedExtras.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const validExtras = selectedExtras.length <= 30
        && selectedExtras.every((item) => item.quantity <= item.available);
    const checkoutParams = new URLSearchParams({ tourId: tour.id, departureId, adults: adultCount, children: childCount });
    if (selectedExtras.length) checkoutParams.set('extras', JSON.stringify(selectedExtras.map(({ kind, id: extraId, quantity }) => ({ kind, id: extraId, quantity }))));
    const rangeParams = new URLSearchParams();
    if (fromDate) rangeParams.set('fromDate', fromDate);
    if (toDate) rangeParams.set('toDate', toDate);
    const { meetingPoint, itinerary: itineraryText } = readTourItinerary(tour.itineraryDetail);
    const stages = itineraryStages(itineraryText);
    const nextDeparture = departure ?? bookable[0];
    const photos = [...new Set([tour.image, ...(/hoi an/i.test(tour.destination ?? '') ? hoiAnPhotos : [])].filter(Boolean))];
    const otherTours = catalog.filter((item) => item.id !== tour.id)
        .sort((a, b) => Number(b.locationId === tour.locationId) - Number(a.locationId === tour.locationId)).slice(0, 3);
    const hasReviews = tour.reviewCount > 0 && Number.isFinite(tour.averageRating);

    return (
        <main className="tr-page">
            <div className="tr-shell">
                <nav className="tr-breadcrumb" aria-label="Breadcrumb">
                    <Link to="/">Home</Link><span>›</span><Link to={'/tours' + (rangeParams.size ? '?' + rangeParams : '')}>Tours</Link>
                    <span>›</span><span>{tour.destination || tour.title}</span>
                </nav>
                <header className="tr-title">
                    <h1>{tour.title}</h1>
                    <div className="tr-title-meta">
                        <div className="tr-title-description">
                            <a href="#tour-reviews-heading" className="tr-rating">
                                {hasReviews ? <><strong>{tour.averageRating.toFixed(1)}</strong><span aria-hidden="true">★</span> ({tour.reviewCount} reviews)</> : 'No reviews yet'}
                            </a>
                            <span><strong>{tour.duration}</strong> · {tour.destination}</span>
                        </div>
                        <a className="tr-text-link" href="#tour-itinerary"><i className="bi bi-signpost-split" aria-hidden="true" /> View itinerary</a>
                    </div>
                </header>

                <div className="tr-layout">
                    <div className="tr-main">
                        <div className={'tr-gallery' + (photos.length >= 4 ? ' tr-gallery-four' : photos.length < 3 ? ' tr-gallery-simple' : '')}>
                            {photos.slice(0, 4).map((image, index) => (
                                <button type="button" className={'tr-gallery-photo tr-photo-' + index}
                                    key={image} onClick={() => setGalleryOpen(true)} aria-label={'View photo ' + (index + 1)}>
                                    <TourPhoto src={image} name={tour.destination || tour.title} />
                                    {index === 2 && <span className="tr-view-photos"><i className="bi bi-images" aria-hidden="true" /> View all photos</span>}
                                </button>
                            ))}
                            {photos.length === 0 && <TourPhoto name={tour.title} />}
                            <div className="tr-gallery-info">
                                <i className="bi bi-geo-alt" aria-hidden="true" />
                                <strong>{tour.destination || 'Explore your next destination'}</strong>
                                <span>{tour.duration}</span>
                                <a href="#tour-departures">See dates &amp; prices <span aria-hidden="true">→</span></a>
                            </div>
                        </div>

                        <div className="tr-facts">
                            <div><i className="bi bi-compass" aria-hidden="true" /><p><strong>Explore {tour.destination || 'the destination'}</strong><span>Stops and activities in the itinerary below</span></p></div>
                            <div><i className="bi bi-calendar4-week" aria-hidden="true" /><p><strong>{tour.duration}</strong><span>Travel dates are listed for each departure</span></p></div>
                            <div><i className="bi bi-people" aria-hidden="true" /><p><strong>Adults &amp; children</strong><span>Adults 18+ · Children 2–17</span></p></div>
                            <div><i className="bi bi-clock" aria-hidden="true" /><p><strong>{nextDeparture?.departureTime ? nextDeparture.departureTime.slice(0, 5) + ' local time' : 'Departure time'}</strong><span>{nextDeparture?.departureTime ? 'Check your selected departure' : 'To be confirmed by the operator'}</span></p></div>
                            <div><i className="bi bi-award" aria-hidden="true" /><p><strong>Tour organizer</strong><span>Karnel Travels</span></p></div>
                            <div><i className="bi bi-pin-map" aria-hidden="true" /><p><strong>Meeting point</strong><span>{meetingPoint || 'Confirm with the operator'}</span></p></div>
                            <div><i className="bi bi-person-bounding-box" aria-hidden="true" /><p><strong>{nextDeparture ? 'Up to ' + nextDeparture.capacity + ' travelers' : 'Group size by departure'}</strong><span>{nextDeparture ? nextDeparture.seatsLeft + ' seats available on this departure' : 'See dates & prices'}</span></p></div>
                            <div><i className="bi bi-calendar-check" aria-hidden="true" /><p><strong>{bookable.length} available departures</strong><span>Within your selected date range</span></p></div>
                        </div>

                        <section className="tr-section tr-itinerary" id="tour-itinerary">
                            <div className="tr-map">
                                <iframe title={'Map of ' + (tour.destination || 'the destination')}
                                    src={'https://maps.google.com/maps?q=' + encodeURIComponent((tour.destination || tour.locationName || 'Vietnam') + ', Vietnam') + '&output=embed'}
                                    loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                                <a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(tour.destination || tour.locationName || 'Vietnam')}
                                    target="_blank" rel="noopener noreferrer"><i className="bi bi-arrows-angle-expand" aria-hidden="true" /> Open map</a>
                            </div>
                            <div className="tr-itinerary-body">
                                <div className="tr-section-heading"><h2>Itinerary</h2><button type="button" className="tr-text-link" onClick={expandItinerary}>{allExpanded ? 'Collapse all' : 'Expand all'}</button></div>
                                <div ref={itineraryRef} className="tr-timeline">
                                    <details>
                                        <summary><span className="tr-day">Intro</span><strong>Your trip at a glance</strong><i className="bi bi-chevron-down" aria-hidden="true" /></summary>
                                        <div className="tr-day-content">
                                            <dl className="tr-meeting">
                                                <div><dt>Meeting point</dt><dd>{meetingPoint || 'Contact the operator to confirm the meeting point and address.'}</dd></div>
                                                <div><dt>{departure ? 'Selected departure' : 'Next available departure'}</dt><dd>{nextDeparture ? formatDate(nextDeparture.departureDate) + (nextDeparture.departureTime ? ' · ' + nextDeparture.departureTime.slice(0, 5) : ' · Start time to be confirmed') : 'Choose a departure below.'}</dd></div>
                                                <div><dt>Return date</dt><dd>{nextDeparture ? formatDate(nextDeparture.returnDate) : 'Shown with your selected departure.'}</dd></div>
                                            </dl>
                                        </div>
                                    </details>
                                    {stages.map((stage, index) => (
                                        <details key={index} open={index === 0 ? true : undefined}>
                                            <summary><span className="tr-day">{stage.day}</span><strong>{stage.title || tour.destination}</strong><i className="bi bi-chevron-down" aria-hidden="true" /></summary>
                                            <div className="tr-day-content">
                                                {stage.lines.map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}
                                                {index === 0 && <p className="tr-muted tr-small">Meeting point: {meetingPoint || 'To be confirmed by the operator.'}</p>}
                                            </div>
                                        </details>
                                    ))}
                                    {!stages.length && <p className="tr-muted">A detailed itinerary has not been published. Contact the operator for departure, pickup and activity details.</p>}
                                </div>
                                {tour.spotId != null && <Link className="tr-text-link" to={'/destinations/' + tour.spotId}>Explore {tour.destination} →</Link>}
                            </div>
                        </section>

                        <section className="tr-section">
                            <h2>What's included</h2>
                            <div className="tr-inclusions">
                                <details><summary><i className="bi bi-map" aria-hidden="true" /><strong>Tour program</strong><i className="bi bi-chevron-down" aria-hidden="true" /></summary><p>Review the itinerary for the published stops and activities. Confirm entrance tickets, meals and transfers with the operator before booking.</p></details>
                                <details><summary><i className="bi bi-building" aria-hidden="true" /><strong>Accommodation</strong><i className="bi bi-chevron-down" aria-hidden="true" /></summary><p>Contact the operator to confirm which overnight stays are included in this tour. Additional rooms selected below are charged at their published price.</p></details>
                                <details><summary><i className="bi bi-bus-front" aria-hidden="true" /><strong>Transport</strong><i className="bi bi-chevron-down" aria-hidden="true" /></summary><p>Confirm pickup, drop-off and included transfers with the operator. Optional transport tickets are shown separately in your price breakdown.</p></details>
                            </div>
                        </section>

                        <TourStayOptions key={tour.locationId} locationId={tour.locationId} date={selectionDate} />

                        <section className="tr-section tr-operator">
                            <div className="tr-operator-name"><div>K</div><p><small>Operated by</small><strong>Karnel Travels</strong></p></div>
                            <Link className="tr-outline" to="/contact">Contact operator</Link>
                            <dl><div><dt>Destination</dt><dd>{tour.destination || tour.locationName}</dd></div><div><dt>Duration</dt><dd>{tour.duration}</dd></div><div><dt>Departures</dt><dd>{bookable.length} available</dd></div></dl>
                        </section>

                        <TourServiceSuggestions locationId={tour.locationId} locationName={tour.locationName} date={selectionDate}
                            result={extrasResult} quantities={quantities}
                            onChange={(key, value) => setQuantities((current) => ({ ...current, [key]: value }))} />

                        <div className="tr-section tr-reviews"><TourReviews tourId={tour.id} /></div>

                        <TourDepartureOverview departures={departures} selectedId={departureId} onSelect={selectDeparture}
                            dateRange={dateRange} onDateRangeChange={changeDateRange} />

                        <section className="tr-section tr-faq">
                            <h2>What our customers ask about this tour</h2>
                            <details><summary>Where do I meet the tour?</summary><p>{meetingPoint || 'The meeting point has not been published. Please contact the operator to confirm the address and pickup time.'}</p></details>
                            <details><summary>How are additional services charged?</summary><p>Optional rooms, dining options and transport are itemized in the same booking. A room is booked for one night on the departure date. Check that the service time suits your itinerary.</p></details>
                            <details><summary>How do I pay?</summary><p>Continue to booking to enter guest information and choose an available payment method. Current prices and availability are confirmed before your booking is saved.</p></details>
                        </section>
                        <section className="tr-section">
                            <h2>Good to know</h2>
                            <div className="tr-good-grid">
                                <article><h3>Departure details</h3><p>Check the travel dates, meeting point and start time for your selected departure.</p></article>
                                <article><h3>Payment information</h3><p>Choose an available payment method at checkout. Additional services appear in the same order summary.</p></article>
                                <article><h3>Changes &amp; cancellation</h3><p>Contact the operator to confirm the terms that apply to your departure before booking.</p></article>
                                <article><h3>Special requirements</h3><p>Include dietary needs, accessibility requests or other arrangements in your booking notes.</p></article>
                            </div>
                        </section>
                    </div>

                    <aside className="tr-price-panel" aria-label="Tour booking">
                        <div className="tr-compact-fare" ref={priceHeading} tabIndex={-1}>
                            <div className="tr-compact-from">From {startingFare != null && tour.standardPrice > (departure?.adultPrice ?? startingFare) && <del>{money(tour.standardPrice)}</del>}</div>
                            <div><strong>{startingFare != null ? money(departure?.adultPrice ?? startingFare) : money(tour.price)}</strong><span>per adult</span></div>
                            {startingFare != null && tour.standardPrice > (departure?.adultPrice ?? startingFare) && (
                                <span className="tr-discount-badge">{Math.round((1 - (departure?.adultPrice ?? startingFare) / tour.standardPrice) * 100)}% off</span>
                            )}
                        </div>
                        <p className="tr-fare-basis"><i className="bi bi-people" aria-hidden="true" /> Adults 18+ · Children 2–17</p>
                        <TourDateRangePicker value={dateRange} onApply={changeDateRange} />
                        <TourTravelerPicker adults={adultCount} childCount={childCount}
                            onApply={(nextAdults, nextChildren) => { setAdults(nextAdults); setChildren(nextChildren); }} />
                        <div aria-live="polite">
                            {departure && validGroup && <dl className="tr-money tr-compact-money">
                                <div><dt>Adults × {adultCount}</dt><dd>{money(departure.adultPrice * adultCount)}</dd></div>
                                {childCount > 0 && <div><dt>Children × {childCount}</dt><dd>{money(departure.childPrice * childCount)}</dd></div>}
                            </dl>}
                            {selectedExtras.length > 0 && <h3 className="tr-price-label">Additional services</h3>}
                            {selectedExtras.length ? <dl className="tr-money">
                                {selectedExtras.map((item) => <div key={extraKey(item)}><dt>{item.label} × {item.quantity}</dt><dd>{money(item.price * item.quantity)}</dd></div>)}
                            </dl> : null}
                            {departure && validGroup && <div className="tr-grand-total"><strong>Total</strong><b>{money(tourTotal + extrasTotal)}</b></div>}
                        </div>
                        {tour.promotion?.promoCode && <p className="tr-compact-promo"><i className="bi bi-tag" aria-hidden="true" /> {tour.promotion.promoCode} · Apply at checkout</p>}
                        {!validGroup && <p className="tr-error" role="alert">Enter valid traveler counts, including at least one adult.</p>}
                        {departure && validGroup && !groupFits && <p className="tr-error" role="alert">This departure does not have enough seats for your group.</p>}
                        {!validExtras && <p className="tr-error" role="alert">Review your additional services before continuing.</p>}
                        {groupFits && validExtras
                            ? <Link className="tr-primary" to={'/tours/booking?' + checkoutParams}>Continue to booking →</Link>
                            : <a className="tr-primary" href="#tour-departures">See dates &amp; prices</a>}
                        <p className="tr-small tr-muted tr-next-step">Next: guest details &amp; payment</p>
                        <div className="tr-panel-links tr-compact-links"><a href="#tour-extra-services"><i className="bi bi-sliders" aria-hidden="true" /> Add services to your trip</a><Link to="/contact"><i className="bi bi-chat-dots" aria-hidden="true" /> Ask the operator</Link></div>
                    </aside>
                </div>

                <section className="tr-related tr-section" aria-labelledby="tr-related-heading">
                    <div className="tr-section-heading"><h2 id="tr-related-heading">Other tours you might like</h2><Link to="/tours">View all tours →</Link></div>
                    <div className="tr-related-grid">
                        {otherTours.map((item) => (
                            <article key={item.id}>
                                <Link className="tr-related-photo" to={'/tours/' + item.id} aria-label={'View ' + item.title}><TourPhoto key={item.image} src={item.image} name={item.destination || item.title} /><span>{item.duration}</span></Link>
                                <div className="tr-related-body"><small>{item.destination}</small><h3><Link to={'/tours/' + item.id}>{item.title}</Link></h3>
                                    <p className="tr-small">{item.reviewCount > 0 ? '★ ' + Number(item.averageRating).toFixed(1) + ' · ' + item.reviewCount + ' reviews' : 'No reviews yet'}</p>
                                    <div><span><small>From / traveler</small><strong>{money(item.price)}</strong></span><Link className="tr-outline" to={'/tours/' + item.id}>View details →</Link></div>
                                </div>
                            </article>
                        ))}
                    </div>
                    {!otherTours.length && <p className="tr-muted">More tours will appear here when they are published.</p>}
                </section>
            </div>
            {galleryOpen && <PhotoGalleryDialog photos={photos} title={tour.title} onClose={() => setGalleryOpen(false)} />}
        </main>
    );
}
