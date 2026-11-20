import { Link } from 'react-router-dom';
import { extraKey } from '../../services/tourExtras.js';
import { money } from '../../services/tourService.js';

export default function TourServiceSuggestions({ locationId, locationName, date, result, quantities, onChange }) {
    const items = result && result.date === date ? result.items : null;
    const error = result && result.date === date ? result.error : null;
    const stayParams = new URLSearchParams();
    if (locationId) stayParams.set('locationId', locationId);
    if (date) stayParams.set('date', date);
    const transportParams = new URLSearchParams();
    if (locationName) transportParams.set('destination', locationName);
    if (date) transportParams.set('date', date);

    return (
        <section id="tour-extra-services" className="tr-section">
            <h2>Make this trip your own</h2>
            <p className="tr-muted">Add transport, a room or a dining option. Each selection appears in your price breakdown.</p>
            {!date && <p className="tr-info">Choose a departure in Dates &amp; prices to see available services.</p>}
            {date && !items && !error && <p role="status">Checking optional services…</p>}
            {error && <p role="alert">{error}</p>}
            {items && ['Transport', 'Accommodation', 'Dining'].map((category) => {
                const choices = items.filter((item) => item.category === category);
                return (
                    <div className="tr-extra-group" key={category}>
                        <h3><i className={'bi ' + ({ Transport: 'bi-bus-front', Accommodation: 'bi-building', Dining: 'bi-cup-hot' }[category])} aria-hidden="true" />{category}</h3>
                        {!choices.length && <p className="tr-muted tr-small">No bookable options have been published for this date.</p>}
                        {choices.map((item) => {
                            const key = extraKey(item);
                            return (
                                <div className="tr-extra-row" key={key}>
                                    <div>
                                        <h4>{item.label}</h4>
                                        <p>{item.provider}{item.time ? ' · ' + item.time : ''}</p>
                                        <small>{item.category === 'Accommodation'
                                            ? 'One room for one night on ' + date.split('-').reverse().join('/')
                                            : 'Service date: ' + date.split('-').reverse().join('/')}
                                            {item.capacity ? ' · Capacity ' + item.capacity : ''}</small>
                                        <strong>{money(item.price)} <small>/ {item.unit}</small></strong>
                                    </div>
                                    <label>
                                        <span className="visually-hidden">Quantity for {item.label} at {item.provider}</span>
                                        <select value={quantities[key] ?? 0}
                                            onChange={(event) => onChange(key, Number(event.target.value))}>
                                            <option value="0">Not added</option>
                                            {Array.from({ length: Math.min(item.available, 30) }, (_, index) => index + 1)
                                                .map((quantity) => <option key={quantity} value={quantity}>{quantity} {item.unit}</option>)}
                                        </select>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
            {date && items?.length > 0 && <p className="tr-info">These are additional services at their full published price. Check the meeting times and any services already included in your tour before adding them.</p>}
            <div className="tr-service-links">
                <Link to={'/hotels?' + stayParams}>Browse hotels</Link>
                <Link to={'/resorts?' + stayParams}>Browse resorts</Link>
                <Link to={'/transport?' + transportParams}>Browse transport</Link>
            </div>
        </section>
    );
}
