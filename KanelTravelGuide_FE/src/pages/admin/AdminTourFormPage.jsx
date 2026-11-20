import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { listSpots } from '../../api/touristSpotsApi.js';
import { listTourPromotions, readTourItinerary, tourService, writeTourItinerary } from '../../services/tourService.js';
import AdminTourDepartures from './AdminTourDepartures.jsx';
import '../../styles/admin/AdminTours.css';

export default function AdminTourFormPage() {
    const { id } = useParams();
    return <TourForm key={id || 'new'} id={id} />;
}

function TourForm({ id }) {
    const [result, setResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const heading = id ? 'Edit tour' : 'Add tour';

    useEffect(() => {
        let active = true;
        Promise.all([listSpots(), listTourPromotions({ activeOnly: false }), id ? tourService.get(id) : null])
            .then(([spots, promotions, tour]) => { if (active) setResult({ spots, promotions, tour }); })
            .catch((failure) => { if (active) setResult({ error: failure.message }); });
        return () => { active = false; };
    }, [id]);

    async function save(event) {
        event.preventDefault();
        if (saving) return;
        const values = new FormData(event.currentTarget);
        const standardPrice = Number(values.get('standardPrice'));
        const salePrice = values.get('salePrice') === '' ? null : Number(values.get('salePrice'));
        const tourName = values.get('tourName').trim();
        const duration = values.get('duration').trim();
        if (!tourName || !duration || (salePrice != null && salePrice > standardPrice)) {
            setError('Enter a tour name and duration. The sale price must be at most the standard price.');
            return;
        }

        setError('');
        setSaving(true);
        try {
            const tour = await tourService.save({
                tourName,
                duration,
                standardPrice,
                salePrice,
                spotId: Number(values.get('spotId')) || null,
                promotionId: Number(values.get('promotionId')) || null,
                itineraryDetail: writeTourItinerary(values.get('meetingPoint').trim(), values.get('itineraryDetail').trim()),
                isFeatured: values.has('isFeatured'),
            }, id);
            navigate(`/admin/tours/${tour.tourId}`, { replace: true });
        } catch (failure) {
            setError(failure.message);
        } finally {
            setSaving(false);
        }
    }

    const tour = result?.tour;
    const { meetingPoint, itinerary } = readTourItinerary(tour?.itineraryDetail);
    return (
        <main className="at-page">
            <Link className="at-back" to="/admin/tours">← Back to tours</Link>
            <header className="at-head"><h1>{heading}</h1></header>
            {!result && <p role="status">Loading tour form…</p>}
            {(error || result?.error) && <p className="at-error" role="alert">{error || result.error}</p>}
            {result && !result.error && (
                <form className="at-panel at-form" onSubmit={save}>
                    <div className="at-form-grid">
                        <label className="at-wide">Tour name<input name="tourName" required maxLength={255} defaultValue={tour?.title} /></label>
                        <label>Destination<select name="spotId" defaultValue={tour?.spotId ?? ''}>
                            <option value="">No linked destination</option>
                            {result.spots.map((spot) => <option key={spot.SpotId} value={spot.SpotId}>{spot.SpotName}</option>)}
                        </select><small className="at-hint">The tour uses the linked destination’s photo.</small></label>
                        <label>Duration<input name="duration" required maxLength={50} placeholder="e.g. 2 days 1 night" defaultValue={tour?.duration} /></label>
                        <label>Standard price (VND)<input name="standardPrice" type="number" min="0" max="1000000000" step="0.01" required defaultValue={tour?.standardPrice} /></label>
                        <label>Sale price (VND)<input name="salePrice" type="number" min="0" max="1000000000" step="0.01" defaultValue={tour?.salePrice ?? ''} /></label>
                        <label className="at-wide">Linked promotion<select name="promotionId" defaultValue={tour?.promotionId ?? ''}>
                            <option value="">No promotion</option>
                            {result.promotions.map((promo) => <option key={promo.promotionId} value={promo.promotionId}>{promo.title}{promo.promoCode ? ' (' + promo.promoCode + ')' : ''}{!promo.isActive ? ' · Inactive' : ''}</option>)}
                        </select></label>
                        <label className="at-wide">Meeting point
                            <input name="meetingPoint" maxLength={255} defaultValue={meetingPoint} placeholder="Location name and address" />
                            <small className="at-hint">Set the start time for each departure in the schedule below.</small>
                        </label>
                        <label className="at-wide">Itinerary
                            <textarea name="itineraryDetail" rows={8} defaultValue={itinerary} placeholder={'Day 1: Meet the guide\nVisit the first stop\nFinish at the drop-off point'} />
                            <small className="at-hint">Use Day 1, Day 2 and so on, with each activity on its own line.</small>
                        </label>
                    </div>
                    <label className="at-check"><input name="isFeatured" type="checkbox" defaultChecked={tour?.isFeatured} /> Feature this tour</label>
                    <p className="at-hint">Base prices are shown in the catalog. Set the fare customers pay for each departure {tour ? 'below.' : 'after saving this tour.'}</p>
                    <div className="at-form-actions">
                        <Link className="at-secondary" to="/admin/tours">Cancel</Link>
                        <button className="at-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save tour'}</button>
                    </div>
                </form>
            )}
            {tour && <AdminTourDepartures tourId={tour.id} defaultPrice={tour.price} />}
        </main>
    );
}
