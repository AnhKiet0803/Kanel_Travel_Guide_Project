import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTourExtras, addTourExtra, removeTourExtra, setTourExtraVisibility } from '../../api/tourExtrasApi.js';
import { getServices, getServiceById, createServiceItem, updateServiceItem } from '../../api/servicesApi.js';
import { getRoutes, getSchedules, getVehicles, createSchedule, updateSchedule } from '../../api/transportApi.js';
import { money } from '../../services/tourService.js';

export default function AdminTourExtras({ tourId }) {
    const [data, setData] = useState(null);
    const [version, setVersion] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [kind, setKind] = useState('service');
    const [providerId, setProviderId] = useState('');
    const [editor, setEditor] = useState(null);

    useEffect(() => {
        let active = true;
        Promise.all([listTourExtras(tourId, true), getServices(), getSchedules(), getRoutes(), getVehicles()])
            .then(async ([options, providers, schedules, routes, vehicles]) => {
                const details = await Promise.all(providers.map((provider) => getServiceById(provider.providerId)));
                const services = details.flatMap((provider) => provider.items.map((item) => ({
                    ...item, kind: 'service', id: item.itemId, providerId: provider.providerId,
                    providerName: provider.providerName, category: provider.serviceType,
                    label: item.itemName, available: item.isAvailable, quantity: item.totalQuantity,
                })));
                const transport = schedules.map((item) => ({
                    ...item, kind: 'transport', id: item.scheduleId, label: item.vehicleName,
                    providerName: item.departureLocationName + ' → ' + item.destinationLocationName,
                    category: 'Transport', price: item.ticketPrice,
                    available: item.status === 'Running', quantity: item.availableSeats ?? item.remainingSeats,
                }));
                if (active) setData({ options, providers, routes, vehicles, catalog: [...services, ...transport] });
            }).catch((failure) => { if (active) setError(failure.message); });
        return () => { active = false; };
    }, [tourId, version]);

    async function run(action, success) {
        if (busy) return;
        setBusy(true); setError(''); setNotice('');
        try { await action(); setNotice(success); setEditor(null); }
        catch (failure) { setError(failure.message); }
        finally { setBusy(false); setVersion((value) => value + 1); }
    }

    function linked(item) {
        return data.options.some((option) => item.kind === 'service'
            ? option.serviceItemId === item.id : option.scheduleId === item.id);
    }

    async function link(item) {
        await addTourExtra(tourId, item.kind === 'service' ? { serviceItemId: item.id } : { scheduleId: item.id });
    }

    function saveItem(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const isService = editor.kind === 'service';
        const payload = isService ? {
            itemName: form.get('itemName').trim(), capacity: Number(form.get('capacity')) || null,
            price: Number(form.get('price')), totalQuantity: Number(form.get('quantity')), isAvailable: form.has('available'),
        } : {
            routeId: Number(form.get('routeId')), vehicleId: Number(form.get('vehicleId')),
            departureTime: form.get('departureTime') + ':00', ticketPrice: Number(form.get('price')),
            availableSeats: Number(form.get('quantity')), status: form.has('available') ? 'Running' : 'Suspended',
        };
        if (isService && !payload.itemName) { setError('Enter a room or dining option name.'); return; }
        run(async () => {
            if (editor.id) {
                if (isService) await updateServiceItem(editor.providerId, editor.id, payload);
                else await updateSchedule(editor.id, payload);
            } else {
                const saved = isService ? await createServiceItem(Number(form.get('providerId')), payload) : await createSchedule(payload);
                try { await link({ kind: editor.kind, id: isService ? saved.itemId : saved.scheduleId }); }
                catch (failure) { throw new Error('The service was created. Link it from the existing options below: ' + failure.message); }
            }
        }, editor.id ? 'Service updated. The current published price will be used for new bookings.' : 'Service created and linked to this tour.');
    }

    return <section className="at-panel at-info-card at-lower" aria-labelledby="tour-extras-title">
        <header className="at-list-heading px-0"><div><h2 id="tour-extras-title">Optional services — Make this trip your own</h2>
            <p>Configure rooms, dining and transport customers can add to this tour.</p></div></header>
        <p className="at-hint">Prices and inventory belong to the service catalog and are shared wherever that service is offered. Visibility and removal here apply only to this tour. Accommodation is charged per room for one night on the departure date; dining per option; transport per ticket.</p>
        {error && <p className="at-error" role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {!data && !error && <p role="status">Loading optional services…</p>}
        {data && <>
            <div className="at-actions">
                <button type="button" disabled={busy || !data.providers.length} onClick={() => setEditor({ kind: 'service' })}>Create room / dining option</button>
                <button type="button" disabled={busy || !data.routes.length || !data.vehicles.length} onClick={() => setEditor({ kind: 'transport' })}>Create transport option</button>
                <Link to="/admin/providers">Manage hotels, resorts &amp; dining</Link><Link to="/admin/transport">Manage routes &amp; vehicles</Link>
            </div>
            {!data.providers.length && <p className="at-hint">Create an active hotel, resort or restaurant before adding rooms or dining options.</p>}
            {(!data.routes.length || !data.vehicles.length) && <p className="at-hint">Create a route and vehicle before adding transport schedules.</p>}
            {editor && <form className="at-form at-lower" onSubmit={saveItem} key={editor.kind + ':' + (editor.id ?? 'new')}>
                <h3>{editor.id ? 'Edit' : 'Create'} {editor.kind === 'service' ? 'room / dining option' : 'transport schedule'}</h3>
                <div className="at-form-grid">
                    {editor.kind === 'service' ? <>
                        <label>Provider<select name="providerId" required defaultValue={editor.providerId ?? providerId} disabled={!!editor.id}>
                            <option value="">Choose hotel, resort or restaurant</option>
                            {data.providers.map((p) => <option key={p.providerId} value={p.providerId}>{p.providerName} · {p.serviceType} · {p.locationName}</option>)}
                        </select></label>
                        <label>Room / dining option name<input name="itemName" required maxLength={150} defaultValue={editor.label} placeholder="e.g. Deluxe Double Room / Dinner for 2" /></label>
                        <label>Guests per room / option<input name="capacity" type="number" min="1" max="10000" step="1" defaultValue={editor.capacity ?? 2} /></label>
                    </> : <>
                        <label>Route<select name="routeId" required defaultValue={editor.routeId ?? ''}><option value="">Choose route</option>{data.routes.map((r) => <option key={r.routeId} value={r.routeId}>{r.departureLocationName} → {r.destinationLocationName}</option>)}</select></label>
                        <label>Vehicle<select name="vehicleId" required defaultValue={editor.vehicleId ?? ''}><option value="">Choose vehicle</option>{data.vehicles.map((v) => <option key={v.vehicleId} value={v.vehicleId}>{v.vehicleName} · {v.totalSeats} seats</option>)}</select></label>
                        <label>Departure time (Vietnam)<input name="departureTime" type="time" required defaultValue={editor.departureTime?.slice(0, 5)} /></label>
                    </>}
                    <label>Price (VND per {editor.kind === 'service' ? 'room/night or dining option' : 'ticket'})<input name="price" type="number" required min="1" max="1000000000" step="0.01" defaultValue={editor.price} /></label>
                    <label>Total available units / seats per date<input name="quantity" type="number" required min="1" max="10000" step="1" defaultValue={editor.quantity ?? 10} /></label>
                </div>
                <label className="at-check"><input name="available" type="checkbox" defaultChecked={editor.available ?? true} />Available in the service catalog</label>
                <div className="at-form-actions"><button type="button" className="at-secondary" disabled={busy} onClick={() => setEditor(null)}>Cancel</button><button className="at-primary" disabled={busy}>{busy ? 'Saving…' : editor.id ? 'Save service' : 'Create and add to tour'}</button></div>
            </form>}
            <h3 className="at-lower">Services linked to this tour ({data.options.length})</h3>
            {!data.options.length ? <p>No optional services linked yet. Create one above or link an existing option below.</p> : <div className="at-table-wrap"><table className="at-table">
                <thead><tr><th>Service</th><th>Price / unit</th><th>Catalog availability</th><th>Tour visibility</th><th>Actions</th></tr></thead><tbody>
                    {data.options.map((option) => {
                        const item = data.catalog.find((row) => option.serviceItemId ? row.kind === 'service' && row.id === option.serviceItemId : row.kind === 'transport' && row.id === option.scheduleId);
                        return <tr key={option.optionId}><td>{item ? <>{item.label}<br /><small>{item.providerName} · {item.category}{item.departureTime ? ' · ' + item.departureTime.slice(0, 5) : ''}</small></> : 'Unavailable catalog item #' + (option.serviceItemId ?? option.scheduleId)}</td>
                            <td>{item ? money(item.price) : '—'}</td><td>{item?.available ? 'Available · ' + (item.quantity ?? 'vehicle capacity') : 'Unavailable'}</td><td>{option.isEnabled ? 'Shown' : 'Hidden'}</td>
                            <td><div className="at-actions"><button type="button" disabled={busy} onClick={() => run(() => setTourExtraVisibility(tourId, option.optionId, !option.isEnabled), 'Tour visibility updated.')}>{option.isEnabled ? 'Hide' : 'Show'}</button>
                                {item && <button type="button" disabled={busy} onClick={() => setEditor(item)}>Edit price / inventory</button>}
                                <button type="button" disabled={busy} onClick={() => run(() => removeTourExtra(tourId, option.optionId), 'Service removed from this tour. Existing bookings are preserved.')}>Remove from tour</button></div></td></tr>;
                    })}
                </tbody></table></div>}
            <h3 className="at-lower">Link an existing option</h3>
            <div className="at-form at-form-grid"><label>Category<select value={kind} onChange={(e) => setKind(e.target.value)}><option value="service">Rooms &amp; dining</option><option value="transport">Transport</option></select></label>
                {kind === 'service' && <label>Provider<select value={providerId} onChange={(e) => setProviderId(e.target.value)}><option value="">All providers</option>{data.providers.map((p) => <option key={p.providerId} value={p.providerId}>{p.providerName} · {p.locationName}</option>)}</select></label>}
                <label className="at-wide">Available catalog options<select value="" disabled={busy} onChange={(e) => {
                    const item = data.catalog.find((row) => row.kind === kind && String(row.id) === e.target.value);
                    if (item) run(() => link(item), 'Service linked to this tour.');
                }}><option value="">Choose an option to add to this tour</option>{data.catalog.filter((item) => item.kind === kind && !linked(item) && (kind !== 'service' || !providerId || item.providerId === Number(providerId))).map((item) => <option key={item.id} value={item.id}>{item.label} · {item.providerName} · {money(item.price)}{!item.available ? ' · Unavailable' : ''}</option>)}</select></label>
            </div>
            <p className="at-hint">Customers must choose a tour departure first. Only shown services with a positive price and remaining stock on that date can be added; totals and availability are checked again by the backend.</p>
        </>}
    </section>;
}
