import { useEffect, useState } from 'react';
import { deleteTourDeparture, listTourDepartures, saveTourDeparture } from '../../api/tourDepartureApi.js';
import { money } from '../../services/tourService.js';

export default function AdminTourDepartures({ tourId, defaultPrice }) {
    const [rows, setRows] = useState(null);
    const [editing, setEditing] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [version, setVersion] = useState(0);

    useEffect(() => {
        let active = true;
        listTourDepartures(tourId, true)
            .then((items) => { if (active) setRows(items); })
            .catch((failure) => { if (active) setError(failure.message); });
        return () => { active = false; };
    }, [tourId, version]);

    async function run(action) {
        if (busy) return;
        setBusy(true);
        setError('');
        try {
            await action();
            setEditing(null);
            setVersion((value) => value + 1);
        } catch (failure) {
            setError(failure.message);
        } finally {
            setBusy(false);
        }
    }

    function save(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const departureDate = form.get('departureDate');
        const returnDate = form.get('returnDate');
        if (returnDate < departureDate) {
            setError('Return date must be on or after the departure date.');
            return;
        }
        run(() => saveTourDeparture(tourId, {
            departureDate,
            departureTime: form.get('departureTime') ? form.get('departureTime') + ':00' : null,
            returnDate,
            capacity: Number(form.get('capacity')),
            adultPrice: Number(form.get('adultPrice')),
        }, editing.tourDepartureId));
    }

    return (
        <section className="at-panel at-info-card at-lower" aria-labelledby="departure-admin-title">
            <header className="at-list-heading px-0">
                <div><h2 id="departure-admin-title">Departures</h2><p>Set dates, departure time (Vietnam time), seats and fares. The child fare is calculated from the adult fare.</p></div>
                <button type="button" className="at-primary" disabled={busy} onClick={() => setEditing({ adultPrice: defaultPrice })}>Add departure</button>
            </header>
            {error && <p className="at-error" role="alert">{error}</p>}
            {rows === null && !error && <p role="status">Loading departures…</p>}
            {rows?.length === 0 && <p>No dates have been added for this tour.</p>}
            {rows?.length > 0 && (
                <div className="at-table-wrap">
                    <table className="at-table">
                        <thead><tr><th>Departure</th><th>Return</th><th>Seats left</th><th>Adult</th><th>Child</th><th>Actions</th></tr></thead>
                        <tbody>
                            {rows.map((row) => <tr key={row.tourDepartureId}>
                                <td>{row.departureDate}{row.departureTime ? ' · ' + row.departureTime.slice(0, 5) : ''}</td><td>{row.returnDate}</td>
                                <td>{row.seatsLeft} / {row.capacity}</td>
                                <td>{money(row.adultPrice)}</td><td>{money(row.childPrice)}</td>
                                <td><div className="at-actions">
                                    <button type="button" disabled={busy} onClick={() => setEditing(row)}>Edit</button>
                                    <button type="button" disabled={busy} onClick={() => {
                                        if (window.confirm('Delete this departure?')) {
                                            run(() => deleteTourDeparture(tourId, row.tourDepartureId));
                                        }
                                    }}>Delete</button>
                                </div></td>
                            </tr>)}
                        </tbody>
                    </table>
                </div>
            )}
            {editing && (
                <form className="at-form" key={editing.tourDepartureId ?? 'new'} onSubmit={save}>
                    <h3>{editing.tourDepartureId ? 'Edit departure' : 'Add departure'}</h3>
                    <div className="at-form-grid">
                        <label>Departure date<input type="date" name="departureDate" required defaultValue={editing.departureDate} /></label>
                        <label>Departure time (optional)<input type="time" name="departureTime" defaultValue={editing.departureTime?.slice(0, 5)} /></label>
                        <label>Return date<input type="date" name="returnDate" required defaultValue={editing.returnDate} /></label>
                        <label>Seat capacity<input type="number" name="capacity" min="1" max="10000" step="1" required defaultValue={editing.capacity} /></label>
                        <label>Adult fare (VND)<input type="number" name="adultPrice" min="0" max="1000000000" step="0.01" required defaultValue={editing.adultPrice} /></label>
                    </div>
                    <div className="at-form-actions">
                        <button className="at-secondary" type="button" disabled={busy} onClick={() => setEditing(null)}>Cancel</button>
                        <button className="at-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save departure'}</button>
                    </div>
                </form>
            )}
        </section>
    );
}
