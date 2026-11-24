import { money } from '../../services/tourService.js';

const fullDate = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
function formatDate(date) {
    const parsed = new Date(date + 'T00:00:00Z');
    return Number.isNaN(parsed.getTime()) ? date : fullDate.format(parsed);
}

export default function TourDepartureOverview({ departures, selectedId, onSelect, dateRange, onDateRangeChange }) {
    const { fromDate, toDate } = dateRange;
    const hasRange = Boolean(fromDate || toDate);
    const invalidRange = Boolean(fromDate && toDate && fromDate > toDate);
    const available = departures?.filter((item) => item.seatsLeft > 0).length ?? 0;

    return (
        <section className="tour-card tour-departure-overview" id="tour-departures" aria-labelledby="tour-departures-title">
            <h2 id="tour-departures-title">Dates &amp; prices</h2>
            {departures === null && <p role="status">Departure information is temporarily unavailable.</p>}
            {departures !== null && (
                <div className="tour-departure-filter justify-content-start">
                    <label>Departure from
                        <input className="form-control" type="date" value={fromDate}
                            onChange={(event) => onDateRangeChange({ fromDate: event.target.value, toDate })} />
                    </label>
                    <label>Departure to
                        <input className="form-control" type="date" value={toDate}
                            onChange={(event) => onDateRangeChange({ fromDate, toDate: event.target.value })} />
                    </label>
                    {hasRange && (
                        <button className="btn btn-outline-secondary align-self-end" type="button"
                            onClick={() => onDateRangeChange({ fromDate: '', toDate: '' })}>
                            See all dates
                        </button>
                    )}
                </div>
            )}
            {!invalidRange && hasRange && departures !== null && (
                <p className="tour-muted">
                    Showing departures {fromDate && toDate
                        ? formatDate(fromDate) + ' – ' + formatDate(toDate)
                        : fromDate ? 'from ' + formatDate(fromDate) : 'through ' + formatDate(toDate)}
                </p>
            )}
            {invalidRange && <p role="alert">The end date must be on or after the start date.</p>}
            {!invalidRange && departures?.length === 0 && (
                <p role="status">{hasRange ? 'No departures in this date range.' : 'No upcoming departures have been published for this tour.'}</p>
            )}
            {!invalidRange && departures?.length > 0 && <>
                <p className="tour-muted" role="status">{available} of {departures.length} departures with seats</p>
                <ul className="tour-departure-list">
                    {departures.map((item) => (
                        <li className={'tour-departure-row' + (selectedId === item.tourDepartureId ? ' is-selected' : '')} key={item.tourDepartureId}>
                            <div className="tour-departure-top">
                                <div>
                                    <span className="tour-muted">Departure – return</span>
                                    <h3><time dateTime={item.departureDate}>{formatDate(item.departureDate)}</time>{item.departureTime ? ' · ' + item.departureTime.slice(0, 5) : ''}
                                        {' – '}<time dateTime={item.returnDate}>{formatDate(item.returnDate)}</time>{item.returnTime ? ' · ' + item.returnTime.slice(0, 5) : ''}</h3>
                                </div>
                                <span className={item.seatsLeft > 0 ? 'tour-seats' : 'tour-seats tour-seats-sold'}>
                                    {item.seatsLeft > 0 ? item.seatsLeft + (item.seatsLeft === 1 ? ' seat left' : ' seats left') : 'Sold out'}
                                </span>
                            </div>
                            <div className="tour-departure-bottom">
                                <dl className="tour-departure-fares">
                                    <div><dt>Adult (18+)</dt><dd>{money(item.adultPrice)}</dd></div>
                                    <div><dt>Child (2–17)</dt><dd>{money(item.childPrice)}</dd></div>
                                </dl>
                                {item.seatsLeft > 0 && (
                                    <button type="button" className="tour-primary" aria-pressed={selectedId === item.tourDepartureId}
                                        onClick={() => onSelect(item.tourDepartureId)}>
                                        {selectedId === item.tourDepartureId ? 'Selected' : 'Select date'}
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </>}
        </section>
    );
}
