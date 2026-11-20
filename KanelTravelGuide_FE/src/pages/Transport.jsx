import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRoutes, getSchedules, transportModeFor } from '../api/transportApi.js';
import { getLocations } from '../api/servicesApi.js';
import '../styles/transport/Transport.css';


const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' }).format(new Date());
const money = n => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const minutes = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const clock = (t, duration) => { const x = (minutes(t) + duration) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
const durationText = n => `${Math.floor(n / 60)}h ${String(n % 60).padStart(2, '0')}m`;
const MODES = [{ id: 'bus', name: 'Bus / Limousine', icon: '🚌' }, { id: 'flight', name: 'Flights', icon: '✈' }, { id: 'train', name: 'Trains', icon: '🚆' }];
const WINDOWS = [{ id: 'all', name: 'All day', start: 0, end: 1440 }, { id: 'early', name: '00:00 – 06:00', start: 0, end: 360 }, { id: 'morning', name: '06:00 – 12:00', start: 360, end: 720 }, { id: 'afternoon', name: '12:00 – 18:00', start: 720, end: 1080 }, { id: 'evening', name: '18:00 – 24:00', start: 1080, end: 1440 }];
const IMG = {
    bus: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=700&q=85',
    limousine: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=700&q=85',
    train: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=700&q=85',
    flight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=700&q=85',
    interior: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=700&q=85',
};
function presentSchedule(schedule, route) {
    const type = schedule.vehicleType.toLowerCase();
    const mode = transportModeFor(type);
    const duration = route?.estimatedDuration || '';
    const hours = Number(duration.match(/(\d+)\s*h/i)?.[1] ?? 0);
    const mins = Number(duration.match(/(\d+)\s*m/i)?.[1] ?? 0);
    const variant = type.includes('limousine') ? 'Limousine'
        : mode === 'bus' && /sleeper/i.test(schedule.vehicleName) ? 'Sleeper bus' : schedule.vehicleType;
    return {
        id: schedule.scheduleId, routeId: schedule.routeId, mode, variant,
        from: schedule.departureLocationName, to: schedule.destinationLocationName,
        name: schedule.vehicleName, sub: schedule.vehicleType, operator: schedule.vehicleName,
        depart: schedule.departureTime.slice(0, 5), duration: hours * 60 + mins,
        price: schedule.ticketPrice, seats: schedule.remainingSeats ?? schedule.availableSeats,
        pickup: schedule.departureLocationName, dropoff: schedule.destinationLocationName,
        image: variant === 'Limousine' ? IMG.limousine : IMG[mode],
    };
}

const enoughSeats = (trip, count) => trip.seats == null || trip.seats >= count;
const seatLabel = trip => trip.seats == null ? 'Availability checked at checkout' : trip.seats > 0 ? trip.seats + ' seats available' : 'Sold out';
const arrival = trip => trip.duration ? clock(trip.depart, trip.duration) : '—';

const CONFIG = {
    bus: { headline: 'Comfortable road journeys', subtitle: 'Compare coaches, sleeper buses and premium limousines.', sort: ['Recommended', 'Lowest price', 'Highest price', 'Earliest departure', 'Latest departure', 'Shortest duration'], filterLabel: 'Vehicle type' },
    flight: { headline: 'Flights made simple', subtitle: 'Explore airlines, flight times and fares in one place.', sort: ['Recommended', 'Lowest price', 'Highest price', 'Earliest departure', 'Latest departure', 'Shortest duration'], filterLabel: 'Vehicle type' },
    train: { headline: 'Scenic journeys by rail', subtitle: 'Compare trains, seat classes and sleeper berths.', sort: ['Recommended', 'Lowest price', 'Highest price', 'Earliest departure', 'Latest departure', 'Shortest duration'], filterLabel: 'Train type' },
};
const detailTabs = ['Offers', 'Pick-up / Drop-off', 'Reviews', 'Policy', 'Photos', 'Amenities'];


const DEFAULT_PASSENGERS = { adults: 1, children: 0, infants: 0 };
const passengerCount = p => p.adults + p.children + p.infants;
const seatCount = passengerCount;
const passengerLabel = p => `${passengerCount(p)} passenger${passengerCount(p) === 1 ? '' : 's'}`;

function PassengerPicker({ value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const rows = [
        { key: 'adults', title: 'Adults', subtitle: '12 years and above' },
        { key: 'children', title: 'Children', subtitle: '2–11 years' },
        { key: 'infants', title: 'Infants', subtitle: 'Under 2 years' },
    ];
    const change = (key, delta) => {
        const next = { ...value, [key]: value[key] + delta };
        if (next.adults < 1 || next.children < 0 || next.infants < 0 ||
            next.infants > next.adults || passengerCount(next) > 9) return;
        onChange(next);
    };
    return <div className="ktr-passengers" onKeyDown={e => { if (e.key === 'Escape') setIsOpen(false); }}>
        <button type="button" className="ktr-passenger-trigger" aria-expanded={isOpen}
            aria-controls="ktr-passenger-panel" onClick={() => setIsOpen(v => !v)}>
            <span><small>Passengers</small><strong>{passengerLabel(value)}</strong></span>
            <span aria-hidden="true">{isOpen ? '⌃' : '⌄'}</span>
        </button>
        {isOpen && <div className="ktr-passenger-panel" id="ktr-passenger-panel">
            {rows.map(row => <div className="ktr-passenger-row" key={row.key}>
                <div className="ktr-passenger-description"><strong>{row.title}</strong><small>{row.subtitle}</small></div>
                <div className="ktr-passenger-counter">
                    <button type="button" aria-label={`Remove ${row.title.toLowerCase()}`} disabled={value[row.key] <= (row.key === 'adults' ? Math.max(1, value.infants) : 0)} onClick={() => change(row.key, -1)}>−</button>
                    <output aria-label={`${row.title} count`}>{value[row.key]}</output>
                    <button type="button" aria-label={`Add ${row.title.toLowerCase()}`} disabled={passengerCount(value) >= 9 || (row.key === 'infants' && value.infants >= value.adults)} onClick={() => change(row.key, 1)}>+</button>
                </div>
            </div>)}
            <p className="ktr-passenger-note">Up to 9 travelers. Ask the operator about age-specific fares.</p>
            <button type="button" className="ktr-passenger-apply" onClick={() => setIsOpen(false)}>Apply · {passengerLabel(value)}</button>
        </div>}
    </div>;
}

const BUS_SORT = [
    ['Recommended', 'Default'],
    ['Earliest departure', 'Earliest departure'],
    ['Latest departure', 'Latest departure'],
    ['Lowest price', 'Price: low to high'],
    ['Highest price', 'Price: high to low'],
];
function toggleMulti(setter, value, checked) {
    setter(prev => checked ? [...new Set([...prev, value])] : prev.filter(v => v !== value));
}
function BusFilterGroup({ title, children, defaultOpen = true }) {
    const [expanded, setExpanded] = useState(defaultOpen);
    return <section className="ktr-bf-group">
        <button type="button" className="ktr-bf-group-title" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}>
            <span>{title}</span><span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
        </button>
        {expanded && <div className="ktr-bf-group-body">{children}</div>}
    </section>;
}

// Locale-independent 12-hour time input: always shows AM / PM, never SA / CH.
function Time12Input({ label, value, onCommit }) {
    const toParts = (time) => {
        const [h, m] = (time === '24:00' ? '00:00' : time).split(':').map(Number);
        return { display: `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, period: time === '24:00' ? 'AM' : h >= 12 ? 'PM' : 'AM' };
    };
    const parts = toParts(value);
    const [draft, setDraft] = useState(parts.display);
    const [period, setPeriod] = useState(parts.period);
    useEffect(() => { const next = toParts(value); setDraft(next.display); setPeriod(next.period); }, [value]);
    const commit = (text, ampm) => {
        const match = /^(\d{1,2}):(\d{1,2})$/.exec(text.trim());
        if (!match) { setDraft(toParts(value).display); return; }
        const h = Number(match[1]), m = Number(match[2]);
        if (h < 1 || h > 12 || m > 59) { setDraft(toParts(value).display); return; }
        const hour24 = (h % 12) + (ampm === 'PM' ? 12 : 0);
        onCommit(`${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    };
    return <label className="ktr-time12-field"><span>{label}</span>
        <div className="ktr-time12-controls">
            <input type="text" inputMode="numeric" aria-label={`${label} time (hh:mm)`} placeholder="hh:mm" value={draft}
                onChange={e => setDraft(e.target.value)} onBlur={() => commit(draft, period)}
                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
            <select aria-label={`${label} AM or PM`} value={period} onChange={e => { setPeriod(e.target.value); commit(draft, e.target.value); }}>
                <option value="AM">AM</option><option value="PM">PM</option>
            </select>
        </div>
    </label>;
}
function BusFilterPanel({ sort, setSort, operators, pickups, dropoffs, variants,
    setOperators, setPickups, setDropoffs, setVariants,
    departureRange, setDepartureRange, priceRange, setPriceRange, seatNeed, setSeatNeed,
    busTrips, reset, onChangeFilter }) {
    const [queries, setQueries] = useState({});
    const optionList = (values, selected, setSelected, field) => {
        const options = [...new Set(values)].sort((a, b) => a.localeCompare(b));
        const q = (queries[field] || '').trim().toLowerCase();
        return <><input className="ktr-bf-search" type="search" aria-label={`Search ${field}`} placeholder="Search in list" value={queries[field] || ''}
            onChange={e => setQueries(old => ({ ...old, [field]: e.target.value }))} />
            <div className="ktr-bf-options">{options.filter(x => x.toLowerCase().includes(q)).map(x => <FilterCheck key={x} label={x}
                checked={selected.includes(x)} onChange={checked => { toggleMulti(setSelected, x, checked); onChangeFilter(); }} />)}</div></>;
    };
    const toggleOption = (set, value, checked) => { toggleMulti(set, value, checked); onChangeFilter(); };
    return <div className="ktr-bus-filter-panel">
        <section className="ktr-bf-sort"><h3>Sort by</h3>{BUS_SORT.map(([value, label]) => <label key={value} className="ktr-bf-radio"><input type="radio" name="bus-sidebar-sort" checked={sort === value}
            onChange={() => { setSort(value); onChangeFilter(); }} />{label}</label>)}</section>
        <div className="ktr-bf-filter-heading"><h3>Filters</h3><button type="button" onClick={() => { reset(); setQueries({}); }}>Clear all</button></div>
        <BusFilterGroup title="Departure time">
            <div className="ktr-departure-range" style={{ '--range-start': `${minutes(departureRange[0]) / 1440 * 100}%`, '--range-end': `${minutes(departureRange[1]) / 1440 * 100}%` }}>
                <div className="ktr-departure-track" aria-hidden="true" />
                <input className="ktr-departure-thumb ktr-departure-thumb-start" aria-label="Earliest departure time" type="range" min="0" max="1440" step="15" value={minutes(departureRange[0])}
                    onChange={e => { const value = Math.min(Number(e.target.value), minutes(departureRange[1])); setDepartureRange([value === 1440 ? '24:00' : clock('00:00', value), departureRange[1]]); onChangeFilter(); }} />
                <input className="ktr-departure-thumb ktr-departure-thumb-end" aria-label="Latest departure time" type="range" min="0" max="1440" step="15" value={minutes(departureRange[1])}
                    onChange={e => { const value = Math.max(Number(e.target.value), minutes(departureRange[0])); setDepartureRange([departureRange[0], value === 1440 ? '24:00' : clock('00:00', value)]); onChangeFilter(); }} />
            </div>
            <div className="ktr-departure-inputs">
                <Time12Input label="From" value={departureRange[0]} onCommit={time => {
                    const n = Math.min(minutes(time), minutes(departureRange[1]));
                    setDepartureRange([clock('00:00', n), departureRange[1]]); onChangeFilter();
                }} />
                <span className="ktr-departure-separator">–</span>
                <Time12Input label="To" value={departureRange[1]} onCommit={time => {
                    const n = Math.max(minutes(time), minutes(departureRange[0]));
                    setDepartureRange([departureRange[0], clock('00:00', n)]); onChangeFilter();
                }} />
            </div>
        </BusFilterGroup>
        <BusFilterGroup title="Bus operator">{optionList(busTrips.map(t => t.operator), operators, setOperators, 'operator')}</BusFilterGroup>
        <BusFilterGroup title="Pick-up point">{optionList(busTrips.map(t => t.pickup), pickups, setPickups, 'pickup')}</BusFilterGroup>
        <BusFilterGroup title="Drop-off point">{optionList(busTrips.map(t => t.dropoff), dropoffs, setDropoffs, 'dropoff')}</BusFilterGroup>
        <BusFilterGroup title="Price range (maximum position includes all fares)">
            <div className="ktr-price-range" style={{ '--range-start': `${priceRange[0] / 500000 * 100}%`, '--range-end': `${priceRange[1] / 500000 * 100}%` }}>
                <div className="ktr-price-track" aria-hidden="true" />
                <input className="ktr-price-thumb ktr-price-thumb-start" type="range" aria-label="Minimum price" min="0" max="500000" step="10000" value={priceRange[0]}
                    onChange={e => { setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]]); onChangeFilter(); }} />
                <input className="ktr-price-thumb ktr-price-thumb-end" type="range" aria-label="Maximum price" min="0" max="500000" step="10000" value={priceRange[1]}
                    onChange={e => { setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])]); onChangeFilter(); }} />
            </div>
            <div className="ktr-price-inputs">
                <label><span>From (VND)</span><input type="number" min="0" max="500000" step="10000" value={priceRange[0]}
                    onChange={e => { const n = Math.max(0, Math.min(500000, Number(e.target.value) || 0, priceRange[1])); setPriceRange([n, priceRange[1]]); onChangeFilter(); }} /></label>
                <span className="ktr-price-separator">–</span>
                <label><span>To (VND)</span><input type="number" min="0" max="500000" step="10000" value={priceRange[1]}
                    onChange={e => { const n = Math.max(priceRange[0], Math.min(500000, Number(e.target.value) || 0)); setPriceRange([priceRange[0], n]); onChangeFilter(); }} /></label>
            </div>
        </BusFilterGroup>
        <BusFilterGroup title="Vehicle type">{optionList(busTrips.map(t => t.variant), variants, setVariants, 'variant')}</BusFilterGroup>
        <BusFilterGroup title="Seats"><div className="ktr-bf-seat-count"><span>Seats needed</span><div><button type="button" disabled={seatNeed <= 1} onClick={() => { setSeatNeed(n => n - 1); onChangeFilter(); }}>−</button><strong>{seatNeed}</strong><button type="button" disabled={seatNeed >= 9} onClick={() => { setSeatNeed(n => n + 1); onChangeFilter(); }}>+</button></div></div>
        </BusFilterGroup>
    </div>;
}

function FilterCheck({ label, checked, onChange }) { return <label className="ktr-check"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><span>{label}</span></label>; }
function Details({ trip, tab, setTab, onClose }) {
    return <div className="ktr-details"><div className="ktr-detail-tabs" role="tablist" aria-label="Trip details">{detailTabs.map(t => <button role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} key={t} onClick={() => setTab(t)}>{t}</button>)}<button className="ktr-close" aria-label="Close details" onClick={onClose}>×</button></div><div className="ktr-detail-body">
        {tab === 'Offers' && <div className="ktr-info"><h4>Listed fare</h4><p>{money(trip.price)} per ticket. Apply available vouchers at checkout.</p></div>}
        {tab === 'Pick-up / Drop-off' && <div className="ktr-stops"><div><b>{trip.depart} · {trip.pickup}</b><small>Departure location</small></div><div><b>{arrival(trip)} · {trip.dropoff}</b><small>Estimated arrival location</small></div></div>}
        {tab === 'Reviews' && <div className="ktr-info"><p>No reviews published.</p></div>}
        {tab === 'Policy' && <div className="ktr-info"><p>Contact the operator for changes, refunds and baggage conditions.</p></div>}
        {tab === 'Photos' && <div className="ktr-photos"><img src={trip.image} alt={`${trip.name} illustrative photo`} /><img src={trip.mode === 'bus' ? IMG.interior : trip.image} alt="Illustrative travel photo" /></div>}
        {tab === 'Amenities' && <div className="ktr-amenities"><span>Contact the operator for amenities.</span></div>}
    </div></div>;
}
function BusTripCard({ trip, expanded, onToggle, tab, setTab, onBook, requiredSeats }) {
    const nextDay = minutes(trip.depart) + trip.duration >= 1440;
    return <article className={`ktr-trip ktr-bus-card ktr-no-promo ${expanded ? 'expanded' : ''}`}>
        <div className="ktr-bus-layout">
            <div className="ktr-bus-photo"><img src={trip.image} alt={`${trip.name} illustrative vehicle`} loading="lazy" /></div>
            <div className="ktr-bus-main">
                <div className="ktr-bus-heading"><h3>{trip.name}</h3></div>
                <p className="ktr-bus-type">{trip.sub}</p>
                <div className="ktr-bus-stops">
                    <div><span className="ktr-stop-icon">◉</span><strong>{trip.depart}</strong><span className="ktr-stop-label"> · {trip.pickup}</span></div>
                    <div className="ktr-bus-duration">{trip.duration ? durationText(trip.duration) : 'Duration unavailable'}</div>
                    <div><span className="ktr-stop-icon">♦</span><strong>{arrival(trip)}</strong><span className="ktr-stop-label"> · {trip.dropoff}</span>{nextDay && <small> (+1 day)</small>}</div>
                </div>
            </div>
            <div className="ktr-bus-right">
                <strong className="ktr-bus-price">{money(trip.price)}</strong>
                <span className="ktr-bus-seats">{seatLabel(trip)}</span>
                <div className="ktr-bus-actions">
                    <button type="button" className="ktr-bus-detail-button" aria-expanded={expanded} onClick={onToggle}>{expanded ? 'Hide details ▴' : 'View details ▾'}</button>
                    <button type="button" className="ktr-bus-book-button" disabled={!enoughSeats(trip, requiredSeats)} onClick={() => onBook(trip)}>{enoughSeats(trip, requiredSeats) ? 'Select tickets' : 'Not enough seats'}</button>
                </div>
            </div>
        </div>
        <div className="ktr-bus-bottom">
            <span>{trip.variant}</span>
            <strong>PAYMENT OPTIONS AT CHECKOUT</strong>
        </div>
        {expanded && <Details trip={trip} tab={tab} setTab={setTab} onClose={onToggle} />}
    </article>;
}
function TripCard({ trip, expanded, onToggle, tab, setTab, onBook, requiredSeats }) {
    if (trip.mode === 'bus') return <BusTripCard trip={trip} expanded={expanded} onToggle={onToggle} tab={tab} setTab={setTab} onBook={onBook} requiredSeats={requiredSeats} />;
    const nextDay = minutes(trip.depart) + trip.duration >= 1440;
    return <article className={`ktr-trip ${trip.mode} ${expanded ? 'expanded' : ''}`}>
        <div className="ktr-trip-content"><div className="ktr-trip-photo"><img src={trip.image} alt={`${trip.name} illustrative transport`} loading="lazy" /><span>{trip.mode === 'flight' ? 'FLIGHT' : 'TRAIN'}</span></div>
            <div className="ktr-trip-center"><div className="ktr-trip-title"><h3>{trip.name}</h3></div><p className="ktr-sub">{trip.sub}</p><div className="ktr-timeline"><div><strong>{trip.depart}</strong><small>{trip.mode === 'flight' ? trip.pickup : trip.from}</small></div><div className="ktr-journey"><small>{trip.duration ? durationText(trip.duration) : 'Duration unavailable'}</small><span>● ────── ✦ ────── ●</span><small>{nextDay ? '+1 day' : 'Direct journey'}</small></div><div><strong>{arrival(trip)}</strong><small>{trip.mode === 'flight' ? trip.dropoff : trip.to}</small></div></div><div className="ktr-points">{trip.mode === 'flight' ? 'Direct flight' : `From ${trip.pickup} · To ${trip.dropoff}`}</div></div>
            <div className="ktr-trip-side"><span>From</span><strong>{money(trip.price)}</strong><small>/ passenger</small><em className={enoughSeats(trip, 1) ? 'available' : 'sold'}>{seatLabel(trip)}</em><button disabled={!enoughSeats(trip, requiredSeats)} onClick={() => onBook(trip)}>{enoughSeats(trip, requiredSeats) ? 'Book Now' : 'Not enough seats'}</button></div></div>
        <div className="ktr-trip-footer"><span>{trip.variant}</span><button aria-expanded={expanded} onClick={onToggle}>{expanded ? 'Hide details −' : 'View details + '}</button></div>
        {expanded && <Details trip={trip} tab={tab} setTab={setTab} onClose={onToggle} />}</article>;
}
function SeatSelection({ trip, initialQuantity, onClose, onConfirm }) {
    const [quantity, setQuantity] = useState(initialQuantity);
    const available = Math.min(9, trip.seats ?? 9);
    return <div className="ktr-booking-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        <section className="ktr-booking-dialog" role="dialog" aria-modal="true" aria-label="Select tickets">
            <div className="ktr-booking-header"><div><span>SELECT YOUR TICKETS</span><h3>{trip.name}</h3><small>{trip.from} → {trip.to} · {trip.depart}</small></div><button type="button" aria-label="Close" onClick={onClose}>×</button></div>
            <div className="ktr-booking-count"><div><strong>Number of tickets</strong><small>{seatLabel(trip)}</small></div><div className="ktr-passenger-counter"><button type="button" disabled={quantity <= 1} onClick={() => setQuantity(q => q - 1)}>−</button><output>{quantity}</output><button type="button" disabled={quantity >= available} onClick={() => setQuantity(q => q + 1)}>+</button></div></div>
            <div className="ktr-booking-summary"><span>{quantity} × {money(trip.price)}</span><strong>{money(quantity * trip.price)}</strong></div>
            <button className="ktr-booking-confirm" type="button" disabled={quantity > available} onClick={() => onConfirm(trip, quantity)}>Continue · {quantity} ticket{quantity > 1 ? 's' : ''}</button>
        </section>
    </div>;
}

export default function Transport() {
    const [params] = useSearchParams();
    return <TransportDirectory key={params.toString()} params={params} />;
}

const placeMatches = (place, query, descriptions) => {
    const normalize = value => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd');
    return !query || normalize(place + ' ' + (descriptions.get(place) || '')).includes(normalize(query));
};

function TransportDirectory({ params }) {
    const navigate = useNavigate();
    const [mode, setMode] = useState('bus');
    const [routes, setRoutes] = useState(null);
    const [placeDescriptions, setPlaceDescriptions] = useState(() => new Map());
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [draft, setDraft] = useState({ from: params.get('search') || '', to: params.get('destination') || '',
        date: params.get('date') || today(), time: 'all', passengers: { ...DEFAULT_PASSENGERS } });
    const [search, setSearch] = useState({ ...draft });
    const [sort, setSort] = useState('Recommended');
    const [variants, setVariants] = useState([]);
    const [operators, setOperators] = useState([]);
    const [price, setPrice] = useState(3500000);
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    const [sidebarTime, setSidebarTime] = useState('all');
    const [expanded, setExpanded] = useState(null);
    const [tab, setTab] = useState('Offers');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [notice, setNotice] = useState('');
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [open, setOpen] = useState({ type: true, operator: true, time: true, price: true, status: false });

    // Bus filters: multiple selections are supported for each checkbox group.
    const [busPickups, setBusPickups] = useState([]);
    const [busDropoffs, setBusDropoffs] = useState([]);
    const [busDepartureRange, setBusDepartureRange] = useState(['00:00', '24:00']);
    const [busPriceRange, setBusPriceRange] = useState([0, 500000]);
    const [busSeatNeed, setBusSeatNeed] = useState(1);
    const [busSort, setBusSort] = useState('Recommended');
    const resetBus = () => {
        setBusPickups([]);
        setBusDropoffs([]);
        setBusDepartureRange(['00:00', '24:00']);
        setBusPriceRange([0, 500000]);
        setBusSeatNeed(1);
        setBusSort('Recommended');
        setVariants([]);
        setOperators([]);
        setPage(1);
    };

    const config = CONFIG[mode];
    const allMode = useMemo(() => trips.filter(t => t.mode === mode), [trips, mode]);
    const places = [...new Set((routes ?? []).flatMap(route => [route.departureLocationName, route.destinationLocationName]))].sort();

    useEffect(() => {
        let active = true;
        getLocations().then(data => {
            if (active) setPlaceDescriptions(new Map(data.map(location => [location.locationName, location.description])));
        }).catch(() => {});
        getRoutes().then(data => { if (active) setRoutes(data); })
            .catch(error => { if (active) { setLoadError(error.message); setLoading(false); } });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!routes || !search.date) return;
        let active = true;
        setLoading(true);
        setLoadError('');
        setTrips([]);
        getSchedules({ date: search.date, status: 'Running' })
            .then(data => {
                if (active) setTrips(data.map(schedule => presentSchedule(schedule, routes.find(route => route.routeId === schedule.routeId))));
            })
            .catch(error => { if (active) setLoadError(error.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [routes, search.date]);
    const modeOperators = useMemo(() => [...new Set(allMode.map(t => t.operator))], [allMode]);
    const setTransportMode = id => { resetBus(); setMode(id); const next = { ...draft, time: 'all' }; setSelectedTrip(null); setDraft(next); setSearch(next); setSort('Recommended'); setVariants([]); setOperators([]); setPrice(3500000); setOnlyAvailable(false); setSidebarTime('all'); setPage(1); setExpanded(null); setNotice(''); };
    const reset = () => { setVariants([]); setOperators([]); setPrice(3500000); setOnlyAvailable(false); setSidebarTime('all'); setPage(1); };
    const toggle = (item, value, set) => set(prev => value ? [...prev, item] : prev.filter(x => x !== item));
    const filtered = useMemo(() => {
        const inWindow = (time, id) => { const w = WINDOWS.find(x => x.id === id) || WINDOWS[0]; return minutes(time) >= w.start && minutes(time) < w.end; };
        const result = allMode.filter(t => placeMatches(t.from, search.from, placeDescriptions) && placeMatches(t.to, search.to, placeDescriptions) && inWindow(t.depart, search.time) && inWindow(t.depart, sidebarTime) && (!variants.length || variants.includes(t.variant)) && (!operators.length || operators.includes(t.operator)) && (price === 3500000 || t.price <= price) && (!onlyAvailable || enoughSeats(t, mode === 'flight' ? seatCount(search.passengers) : 1)));
        return [...result].sort((a, b) => sort === 'Lowest price' ? a.price - b.price : sort === 'Highest price' ? b.price - a.price : sort === 'Earliest departure' ? minutes(a.depart) - minutes(b.depart) : sort === 'Latest departure' ? minutes(b.depart) - minutes(a.depart) : sort === 'Shortest duration' ? a.duration - b.duration : minutes(a.depart) - minutes(b.depart));
    }, [allMode, placeDescriptions, search, sidebarTime, variants, operators, price, onlyAvailable, sort]);
    const busFiltered = useMemo(() => {
        if (mode !== 'bus') return filtered;
        const [start, end] = busDepartureRange.map(minutes);
        const [low, high] = busPriceRange;
        return allMode.filter(t => {
            return placeMatches(t.from, search.from, placeDescriptions)
                && placeMatches(t.to, search.to, placeDescriptions)
                && minutes(t.depart) >= start && minutes(t.depart) <= end
                && t.price >= low && (high === 500000 || t.price <= high)
                && (!operators.length || operators.includes(t.operator))
                && (!variants.length || variants.includes(t.variant))
                && (!busPickups.length || busPickups.includes(t.pickup))
                && (!busDropoffs.length || busDropoffs.includes(t.dropoff))
                && enoughSeats(t, busSeatNeed);
        }).sort((a, b) => busSort === 'Lowest price' ? a.price - b.price : busSort === 'Highest price' ? b.price - a.price : busSort === 'Earliest departure' ? minutes(a.depart) - minutes(b.depart) : busSort === 'Latest departure' ? minutes(b.depart) - minutes(a.depart) : minutes(a.depart) - minutes(b.depart));
    }, [mode, filtered, allMode, placeDescriptions, search, operators, variants, busPickups, busDropoffs, busDepartureRange, busPriceRange, busSeatNeed, busSort]);
    const results = mode === 'bus' ? busFiltered : filtered;
    const PAGE_SIZE = 4; const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE)); const visible = results.slice((Math.min(page, pages) - 1) * PAGE_SIZE, Math.min(page, pages) * PAGE_SIZE);
    const updateDraft = (key, value) => setDraft(s => ({ ...s, [key]: value }));
    function submit(event) {
        event.preventDefault();
        if (draft.from && draft.from === draft.to) {
            setNotice('Departure and destination must be different.');
            return;
        }
        if (draft.date !== search.date) { setTrips([]); setLoading(true); }
        setSearch({ ...draft });
        setPage(1);
        setExpanded(null);
        setNotice('');
    }

    function confirmSeats(trip, quantity) {
        const params = new URLSearchParams({ type: 'Transport', routeId: trip.routeId, scheduleId: trip.id, date: search.date, quantity, mode: trip.mode });
        navigate('/transport/booking?' + params);
    }
    return <main className="ktr-page"><section className="ktr-hero"><div className="ktr-container"><div className="ktr-breadcrumb">Home / Transportation</div><div className="ktr-kicker">KARNEL TRAVELS · DISCOVER MORE</div><h1>Transportation</h1><p>{config.headline}. {config.subtitle}</p></div></section>
        <div className="ktr-container ktr-main"><section className="ktr-search"><div className="ktr-modes" role="tablist" aria-label="Transport mode">{MODES.map(m => <button role="tab" aria-selected={mode === m.id} key={m.id} className={mode === m.id ? 'selected' : ''} onClick={() => setTransportMode(m.id)}><span>{m.icon}</span>{m.name}</button>)}</div>
            <form onSubmit={submit}><div className="ktr-search-grid"><label><span>From</span><select value={draft.from} onChange={e => updateDraft('from', e.target.value)}><option value="">Any departure</option>{draft.from && !places.includes(draft.from) && <option value={draft.from}>{draft.from}</option>}{places.map(x => <option key={x}>{x}</option>)}</select></label><button type="button" className="ktr-swap" title="Swap locations" onClick={() => setDraft(s => ({ ...s, from: s.to, to: s.from }))}>⇄</button><label><span>To</span><select value={draft.to} onChange={e => updateDraft('to', e.target.value)}><option value="">Any destination</option>{draft.to && !places.includes(draft.to) && <option value={draft.to}>{draft.to}</option>}{places.map(x => <option key={x}>{x}</option>)}</select></label><label><span>Departure date</span><input type="date" min={today()} value={draft.date} onChange={e => updateDraft('date', e.target.value)} required /></label><label><span>Return date <em>(optional)</em></span><input type="text" value="Book return separately" disabled /></label><button className="ktr-search-submit" type="submit">⌕ Search routes</button></div></form>{mode === 'flight' && <div className="ktr-flight-passengers"><PassengerPicker value={draft.passengers} onChange={value => updateDraft('passengers', value)} /></div>}</section>
            {notice && <div className="ktr-notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
            <div className="ktr-results-layout"><aside className={`ktr-sidebar ${showFilters ? 'visible' : ''}`}>
                {mode === 'bus' ? <BusFilterPanel sort={busSort} setSort={setBusSort} operators={operators} setOperators={setOperators}
                    pickups={busPickups} setPickups={setBusPickups} dropoffs={busDropoffs} setDropoffs={setBusDropoffs}
                    variants={variants} setVariants={setVariants} departureRange={busDepartureRange} setDepartureRange={setBusDepartureRange}
                    priceRange={busPriceRange} setPriceRange={setBusPriceRange} seatNeed={busSeatNeed} setSeatNeed={setBusSeatNeed}
                    busTrips={allMode} reset={resetBus} onChangeFilter={() => setPage(1)} /> : <><div className="ktr-sidebar-heading"><h2>Filters</h2><button onClick={reset}>Reset all</button></div>
                    <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={() => setOpen(s => ({ ...s, type: !s.type }))}>{config.filterLabel}<span>{open.type ? '−' : '+'}</span></button>{open.type && <div>{[...new Set(allMode.map(t => t.variant))].map(v => <FilterCheck key={v} label={v} checked={variants.includes(v)} onChange={x => toggle(v, x, setVariants)} />)}</div>}</div>
                    <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={() => setOpen(s => ({ ...s, operator: !s.operator }))}>{mode === 'flight' ? 'Airline' : mode === 'train' ? 'Rail operator' : 'Bus operator'}<span>{open.operator ? '−' : '+'}</span></button>{open.operator && <div>{modeOperators.map(v => <FilterCheck key={v} label={v} checked={operators.includes(v)} onChange={x => toggle(v, x, setOperators)} />)}</div>}</div>
                    <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={() => setOpen(s => ({ ...s, time: !s.time }))}>Departure time<span>{open.time ? '−' : '+'}</span></button>{open.time && <div className="ktr-time-grid">{WINDOWS.map(w => <button key={w.id} className={sidebarTime === w.id ? 'selected' : ''} onClick={() => { setSidebarTime(w.id); setPage(1); }}>{w.name}</button>)}</div>}</div>
                    <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={() => setOpen(s => ({ ...s, price: !s.price }))}>Maximum price<span>{open.price ? '−' : '+'}</span></button>{open.price && <div className="ktr-price"><strong>{price === 3500000 ? 'Any price' : money(price)}</strong><input type="range" min="100000" max="3500000" step="50000" value={price} onChange={e => { setPrice(Number(e.target.value)); setPage(1); }} /><div><small>100.000đ</small><small>No limit at maximum</small></div></div>}</div>
                    <div className="ktr-filter-section"><button className="ktr-filter-heading" onClick={() => setOpen(s => ({ ...s, status: !s.status }))}>Availability<span>{open.status ? '−' : '+'}</span></button>{open.status && <FilterCheck label="Available seats only" checked={onlyAvailable} onChange={setOnlyAvailable} />}</div>
                </>}</aside><section className="ktr-results"><div className="ktr-results-head"><div><span className="ktr-eyebrow">EXPLORE YOUR OPTIONS</span><h2>{search.from || 'All departures'} <span>→</span> {search.to || 'All destinations'}</h2><p>{results.length} {mode === 'flight' ? 'flights' : mode === 'train' ? 'trains' : 'departures'} found · {mode === 'flight' ? `${passengerLabel(search.passengers)} · ${seatCount(search.passengers)} seat(s) needed · ` : ''}{search.date}</p></div><div className="ktr-results-actions"><button className="ktr-mobile-filter" onClick={() => setShowFilters(x => !x)}>☷ Filters</button>{mode !== 'bus' && <label>Sort by <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>{config.sort.map(s => <option key={s}>{s}</option>)}</select></label>}</div></div>{loadError ? <div className="ktr-info-banner" role="alert">{loadError}</div> : loading ? <div className="ktr-info-banner" role="status">Loading schedules…</div> : null}
                    <div className="ktr-trip-list">{visible.map(t => <TripCard key={t.id} trip={t} expanded={expanded === t.id} onToggle={() => { setExpanded(x => x === t.id ? null : t.id); setTab('Offers'); }} tab={tab} setTab={setTab} onBook={setSelectedTrip} requiredSeats={mode === 'flight' ? seatCount(search.passengers) : mode === 'bus' ? busSeatNeed : 1} />)}{!visible.length && !loadError && !loading && <div className="ktr-empty"><div>⌕</div><h3>No matching trips</h3><p>Try another route or adjust the filters.</p><button onClick={mode === 'bus' ? resetBus : reset}>Clear filters</button></div>}</div>
                    {pages > 1 && <nav className="ktr-pagination" aria-label="Results pages"><button disabled={page === 1} onClick={() => { setPage(p => p - 1); setExpanded(null); }}>‹ Previous</button>{Array.from({ length: pages }, (_, i) => <button className={page === i + 1 ? 'current' : ''} key={i} onClick={() => { setPage(i + 1); setExpanded(null); }}>{i + 1}</button>)}<button disabled={page === pages} onClick={() => { setPage(p => p + 1); setExpanded(null); }}>Next ›</button></nav>}
                </section></div></div>{selectedTrip && <SeatSelection trip={selectedTrip} initialQuantity={mode === 'flight' ? seatCount(search.passengers) : mode === 'bus' ? busSeatNeed : 1} onClose={() => setSelectedTrip(null)} onConfirm={confirmSeats} />}</main>;
}
