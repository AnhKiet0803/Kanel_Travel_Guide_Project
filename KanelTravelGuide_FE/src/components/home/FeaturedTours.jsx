import { Link } from 'react-router-dom';
import HomeReviewBadge from './HomeReviewBadge.jsx';
export default function FeaturedTours({ result }) {
  const tours = result?.items?.slice(0, 3) ?? [];
  return <section className="home-section" aria-labelledby="home-tours-title"><div className="container"><div className="home-section-heading home-heading-row"><div><span className="home-eyebrow">CURATED EXPERIENCES</span><h2 id="home-tours-title">Featured tours</h2><p>Thoughtful journeys, remarkable memories.</p></div><Link className="home-text-link" to="/tours">Explore all tours <i className="bi bi-arrow-up-right"/></Link></div><div className="home-tour-grid">{tours.map(t=><article className="home-tour-card" key={t.id}><Link to={`/tours/${t.id}`} className="home-tour-image"><img src={t.image || '/images/services/fallback.jpg'} alt={t.title} loading="lazy" onError={event => { if (!event.currentTarget.src.endsWith('/images/services/fallback.jpg')) event.currentTarget.src = '/images/services/fallback.jpg'; }}/><span className="home-tour-tag"><i className="bi bi-clock"/> {t.duration}</span></Link><div className="home-tour-body"><span className="home-tour-location"><i className="bi bi-geo-alt"/> {t.destination}</span><h3>{t.title}</h3>
    <HomeReviewBadge
      to={`/tours/${t.id}#tour-reviews-heading`}
      title={t.title}
      count={t.reviewCount}
      average={t.averageRating}
    />
    <div className="home-tour-bottom"><span>Explore experience</span><Link to={`/tours/${t.id}`} aria-label={`Explore ${t.title}`}><i className="bi bi-arrow-up-right"/></Link></div></div></article>)}</div>{!result ? <p role="status">Loading tours…</p> : result.error ? <p role="alert">{result.error}</p> : !tours.length && <p>No featured tours yet.</p>}</div></section>;
}
