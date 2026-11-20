import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { money, tourService } from '../../services/tourService.js';
import AdminTourDepartures from './AdminTourDepartures.jsx';
import '../../styles/admin/AdminTours.css';

export default function AdminTourDetailPage() {
    const { id } = useParams();
    return <TourRecord key={id} id={id} />;
}

function TourRecord({ id }) {
    const [result, setResult] = useState(null);

    useEffect(() => {
        let active = true;
        tourService.get(id)
            .then((tour) => { if (active) setResult({ tour }); })
            .catch((error) => { if (active) setResult({ error: error.message }); });
        return () => { active = false; };
    }, [id]);

    const tour = result?.tour;
    return (
        <main className="at-page">
            <Link className="at-back" to="/admin/tours">← Back to tours</Link>
            {!result && <p role="status">Loading tour…</p>}
            {result?.error && <p className="at-error" role="alert">{result.error}</p>}
            {tour && <>
                <header className="at-head">
                    <h1>{tour.title}</h1>
                    <div className="at-actions">
                        <Link to={`/tours/${id}`}>View on website</Link>
                        <Link to={`/admin/tours/${id}/edit`}>Edit tour</Link>
                    </div>
                </header>
                <section className="at-panel at-info-card">
                    <dl>
                        <div className="at-info-row"><dt>Destination</dt><dd>{tour.destination || '—'}</dd></div>
                        <div className="at-info-row"><dt>Duration</dt><dd>{tour.duration}</dd></div>
                        <div className="at-info-row"><dt>Standard price</dt><dd>{money(tour.standardPrice)}</dd></div>
                        <div className="at-info-row"><dt>Sale price</dt><dd>{tour.salePrice == null ? '—' : money(tour.salePrice)}</dd></div>
                        <div className="at-info-row"><dt>Featured</dt><dd>{tour.isFeatured ? 'Yes' : 'No'}</dd></div>
                    </dl>
                    <div className="at-itinerary-detail"><h2>Itinerary</h2><p>{tour.itineraryDetail || 'No itinerary yet.'}</p></div>
                </section>
                <AdminTourDepartures tourId={tour.id} defaultPrice={tour.price} />
            </>}
        </main>
    );
}
