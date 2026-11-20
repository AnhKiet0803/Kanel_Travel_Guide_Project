import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getServices } from '../../api/servicesApi.js';
import { fallbackServiceImage, serviceIllustration } from '../../components/home/HomeData.js';
import { money } from '../../services/tourService.js';

export default function TourStayOptions({ locationId, date }) {
    const [result, setResult] = useState(null);
    useEffect(() => {
        if (!locationId) return;
        const scope = new AbortController();
        getServices({ locationId }).then((items) => {
            if (!scope.signal.aborted) setResult({
                items: items.filter((item) => ['Hotel', 'Resort'].includes(item.serviceType)).slice(0, 3),
            });
        }).catch((error) => { if (!scope.signal.aborted) setResult({ error: error.message }); });
        return () => scope.abort();
    }, [locationId]);

    return (
        <section className="tr-section">
            <h2>Where you'll stay</h2>
            <p className="tr-muted tr-small">Explore accommodation near this destination. Confirm the accommodation included in your tour with the operator.</p>
            {!locationId && <p className="tr-info">Accommodation details are available from the tour operator.</p>}
            {locationId && !result && <p role="status">Loading accommodation…</p>}
            {result?.error && <p role="alert">{result.error}</p>}
            {result?.items?.length === 0 && <p className="tr-info">No accommodation has been published for this area yet. Contact the operator for details.</p>}
            <div className="tr-stay-grid">
                {result?.items?.map((provider) => (
                    <article key={provider.providerId}>
                        <Link to={'/services/' + provider.providerId + (date ? '?date=' + date : '')}>
                            <img src={provider.imageUrl || serviceIllustration(provider.serviceType)}
                                alt={provider.providerName} loading="lazy" onError={(event) => fallbackServiceImage(event, provider.serviceType)} />
                            <div><h3>{provider.providerName}</h3><span>{provider.serviceType} · {provider.locationName}</span>
                                <small>{provider.minPrice > 0 ? 'From ' + money(provider.minPrice) + ' / night' : 'Contact for price'}</small>
                            </div>
                        </Link>
                    </article>
                ))}
            </div>
        </section>
    );
}
