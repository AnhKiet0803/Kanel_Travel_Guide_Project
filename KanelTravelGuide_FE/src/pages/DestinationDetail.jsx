import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getLocation, listSpots } from '../api/touristSpotsApi.js';
import { getDestinationDetail } from '../data/destinationDetailSource.js';
import DestinationReviews from './DestinationReviews.jsx';
import '../styles/destinations/DestinationDetail.css';

function Icon({ name }) {
  return <i className={`bi bi-${name}`} aria-hidden="true" />;
}

export default function DestinationDetail() {
  const { id } = useParams();
  return <DestinationArticle key={id} id={id} />;
}

function DestinationArticle({ id }) {
  const [result, setResult] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [notice, setNotice] = useState('');
  const photoDialog = useRef(null);
  const { hash } = useLocation();

  useEffect(() => {
    let active = true;
    getDestinationDetail(id)
      .then((spot) => { if (active) setResult({ spot }); })
      .catch((error) => { if (active) setResult({ error: error.message || 'Unable to load destination.' }); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (result?.spot && hash === '#destination-reviews') {
      document.getElementById('destination-reviews')?.scrollIntoView({ block: 'start' });
    }
  }, [result, hash]);

  if (!result) return <main className="dd-not-found"><p role="status">Loading destination…</p></main>;

  const { spot, error } = result;
  if (error || !spot) {
    return (
      <main className="dd-not-found">
        <h1>{error ? 'Unable to load destination' : 'Destination not found'}</h1>
        {error && <p role="alert">{error}</p>}
        <Link to="/destinations">Back to destinations</Link>
      </main>
    );
  }

  const image = !imageFailed && spot.image;
  const areaUrl = `/destinations?location=${encodeURIComponent(spot.locationId)}`;
  const directionsParams = new URLSearchParams({
    api: '1',
    destination: [spot.name, spot.location].filter(Boolean).join(', '),
  });
  const directionsUrl = 'https://www.google.com/maps/dir/?' + directionsParams.toString();
  const paragraphs = (spot.overview || '').trim().split(/\r?\n\s*\n/).filter(Boolean);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: spot.name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setNotice('Page link copied.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setNotice('Could not share this page.');
    }
  }

  return (
    <main className="destination-detail">
      <div className="dd-shell">
        <nav className="dd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">›</span>
          <Link to="/destinations">Destinations</Link><span aria-hidden="true">›</span>
          <span aria-current="page">{spot.name}</span>
        </nav>

        <header className={`dd-hero${image ? ' dd-hero-with-photo' : ''}`}>
          <div className="dd-hero-content">
            <div className="dd-meta">
              <Link to={areaUrl}><Icon name="geo-alt" /> {spot.location}</Link>
              <span><Icon name="compass" /> {spot.type}</span>
            </div>
            <h1>{spot.name}</h1>
            {spot.summary && <p className="dd-intro">{spot.summary}</p>}
            <div className="dd-hero-actions">
              <a className="dd-button dd-button-primary" href={directionsUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="sign-turn-right" /> Get directions <Icon name="box-arrow-up-right" />
              </a>
              <a className="dd-button dd-button-quiet" href="#destination-reviews"><Icon name="star" /> Visitor reviews</a>
              <button className="dd-button dd-button-quiet" type="button" onClick={share}><Icon name="share" /> Share</button>
            </div>
            {notice && <p className="dd-notice" role="status">{notice}</p>}
          </div>
          {image && (
            <button type="button" className="dd-photo" onClick={() => photoDialog.current.showModal()} aria-label={`Enlarge photo of ${spot.name}`}>
              <img src={image} alt={spot.name} onError={() => setImageFailed(true)} />
              <span className="dd-photo-icon"><Icon name="arrows-fullscreen" /></span>
            </button>
          )}
        </header>

        <div className="dd-content-grid">
          <article className="dd-overview" aria-labelledby="dd-overview-title">
            <h2 id="dd-overview-title">About {spot.name}</h2>
            {paragraphs.length
              ? paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
              : <p>No description available yet.</p>}
          </article>
          <aside className="dd-visit" aria-labelledby="dd-visit-title">
            <h2 id="dd-visit-title">Plan your visit</h2>
            <Link to={areaUrl}><Icon name="geo-alt" /> Explore {spot.location} <Icon name="arrow-right" /></Link>
            <Link to="/transport"><Icon name="bus-front" /> Find transport <Icon name="arrow-right" /></Link>
            <Link to="/contact"><Icon name="chat-left-dots" /> Contact us <Icon name="arrow-right" /></Link>
          </aside>
        </div>

        <DestinationArea id={id} locationId={spot.locationId} location={spot.location} areaUrl={areaUrl} />
        <DestinationReviews spotId={id} />
      </div>

      {image && (
        <dialog ref={photoDialog} className="dd-lightbox" aria-label={`Photo of ${spot.name}`} onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}>
          <button type="button" onClick={() => photoDialog.current.close()} aria-label="Close photo"><Icon name="x-lg" /></button>
          <img src={image} alt={spot.name} />
        </dialog>
      )}
    </main>
  );
}

function DestinationArea({ id, locationId, location, areaUrl }) {
  const [area, setArea] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (locationId == null) return;
    let active = true;
    getLocation(locationId)
      .then((record) => { if (active) setArea(record); })
      .catch(() => {});
    listSpots({ locationId })
      .then((spots) => {
        if (active) setRelated(spots.filter((spot) => String(spot.SpotId) !== id).slice(0, 3));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [id, locationId]);

  if (!area?.Description && !related.length) return null;

  return (
    <section className="dd-area" aria-labelledby="dd-area-title">
      <div className="dd-area-heading">
        <h2 id="dd-area-title">Explore {location}</h2>
        <Link to={areaUrl}>See all in this area <Icon name="arrow-up-right" /></Link>
      </div>
      {area?.Description && <p className="dd-area-intro">{area.Description}</p>}
      {related.length > 0 && (
        <div className="dd-related">
          {related.map((spot) => (
            <Link className="dd-related-card" key={spot.SpotId} to={`/destinations/${spot.SpotId}`}>
              {spot.ThumbnailUrl && (
                <img src={spot.ThumbnailUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />
              )}
              <div>
                <span>{spot.CategoryName}</span>
                <h3>{spot.SpotName}</h3>
                {spot.Description && <p>{spot.Description}</p>}
              </div>
              <Icon name="arrow-up-right" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
