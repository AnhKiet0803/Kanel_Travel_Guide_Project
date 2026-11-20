import { Link } from 'react-router-dom';
import HomeReviewBadge from './HomeReviewBadge.jsx';
export default function DestinationsSection({ result }) {
  const destinations = result?.items?.filter(spot => spot.IsFeatured).slice(0, 3) ?? [];
  return <section className="home-section home-soft" aria-labelledby="home-destinations-title"><div className="container"><div className="home-section-heading home-heading-row"><div><span className="home-eyebrow">GO SOMEWHERE WONDERFUL</span><h2 id="home-destinations-title">Popular destinations</h2><p>Find inspiration for your next getaway.</p></div><Link className="home-text-link" to="/destinations">View all destinations <i className="bi bi-arrow-up-right"/></Link></div><div className="home-destination-grid">{destinations.map(d=><article className="position-relative" key={d.SpotId}><Link className="home-destination-card" to={`/destinations/${d.SpotId}`}><img src={d.ThumbnailUrl || '/images/services/fallback.jpg'} alt={d.SpotName} loading="lazy" onError={event => { if (!event.currentTarget.src.endsWith('/images/services/fallback.jpg')) event.currentTarget.src = '/images/services/fallback.jpg'; }}/><div className="home-image-shade"/><div className="home-destination-info"><span>{d.LocationName}</span><h3>{d.SpotName}</h3><p>{d.CategoryName}</p></div><span className="home-image-arrow"><i className="bi bi-arrow-up-right"/></span></Link>
    <HomeReviewBadge
      to={`/destinations/${d.SpotId}#destination-reviews`}
      title={d.SpotName}
      count={d.ReviewCount}
      average={d.AverageRating}
      overlay
    />
  </article>)}</div>{!result ? <p role="status">Loading destinations…</p> : result.error ? <p role="alert">{result.error}</p> : !destinations.length && <p>No featured destinations yet.</p>}</div></section>;
}
