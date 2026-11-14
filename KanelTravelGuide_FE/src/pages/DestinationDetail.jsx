import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../styles/destinations/DestinationDetail.css';

// Demo data. Replace with API response from TouristSpot/Location when available.
const DEMO_SPOTS = [
  {
    id: 1, name: 'Ha Long Bay', location: 'Quang Ninh, Vietnam',
    overview: 'Ha Long Bay is celebrated for its emerald waters, towering limestone islands, and unforgettable scenery. Discover peaceful coves, spectacular caves, and memorable journeys on the water.',
    highlights: ['Explore limestone islands', 'Enjoy a scenic cruise on the bay', 'Visit stunning caves', 'Experience local fishing villages'],
    images: ['/images/destinations/halong/main.jpg', '/images/destinations/halong/photo-1.jpg', '/images/destinations/halong/photo-2.jpg', '/images/destinations/halong/photo-3.jpg', '/images/destinations/halong/photo-4.jpg'],
    duration: '2 days', type: 'Nature Tour', groupSize: '2–20 people', languages: 'EN, VI', price: null,
  },
  {
    id: 2, name: 'Hoi An', location: 'Quang Nam, Vietnam',
    overview: 'Explore lantern-lit streets, historic architecture, traditional markets, and the rich cultural heritage of Hoi An.',
    highlights: ['Explore the Ancient Town', 'Admire lantern-lit streets', 'Discover local cuisine', 'Visit traditional craft workshops'],
    images: ['/images/destinations/hoian/main.jpg', '/images/destinations/hoian/photo-1.jpg', '/images/destinations/hoian/photo-2.jpg', '/images/destinations/hoian/photo-3.jpg', '/images/destinations/hoian/photo-4.jpg'],
    duration: '1 day', type: 'Cultural Tour', groupSize: '2–15 people', languages: 'EN, VI', price: null,
  },
  {
    id: 3, name: 'Bali', location: 'Bali, Indonesia',
    overview: 'Discover tropical landscapes, ancient temples, lush rice terraces, and the vibrant traditions of Bali.',
    highlights: ['Visit beautiful temples', 'Discover lush rice terraces', 'Relax on tropical beaches', 'Experience Balinese culture'],
    images: ['/images/destinations/bali/main.jpg', '/images/destinations/bali/photo-1.jpg', '/images/destinations/bali/photo-2.jpg', '/images/destinations/bali/photo-3.jpg', '/images/destinations/bali/photo-4.jpg'],
    duration: '3 days', type: 'Island Tour', groupSize: '2–12 people', languages: 'EN', price: null,
  },
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=85',
];

function GalleryImage({ src, fallback, alt, className = '', onClick, children }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <button type="button" className={`dd-gallery-tile ${className}`} onClick={onClick} aria-label={`View photo: ${alt}`}>
      <img src={failed ? fallback : src} onError={() => setFailed(true)} alt={alt} loading="lazy" />
      {children}
    </button>
  );
}

const icon = (name, extra = '') => <i className={`bi bi-${name} ${extra}`} aria-hidden="true" />;

export default function DestinationDetail() {
  const { id } = useParams();
  const spot = DEMO_SPOTS.find((item) => String(item.id) === String(id));
  const [saved, setSaved] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [tab, setTab] = useState('book');
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setSaved(false); setGalleryOpen(false); setActivePhoto(0); setNotice('');
  }, [id]);
  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (event) => {
      if (event.key === 'Escape') setGalleryOpen(false);
      if (event.key === 'ArrowRight') setActivePhoto((x) => (x + 1) % 5);
      if (event.key === 'ArrowLeft') setActivePhoto((x) => (x + 4) % 5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryOpen]);

  if (!spot) return <main className="dd-not-found"><h1>Destination not found</h1><p>We couldn't find this destination.</p><Link to="/destinations">Back to destinations</Link></main>;

  const openPhoto = (index) => { setActivePhoto(index); setGalleryOpen(true); };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: spot.name, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setNotice('Page link copied to clipboard.'); }
    } catch (err) { if (err.name !== 'AbortError') setNotice('Could not share this page.'); }
  };
  const submit = (event) => {
    event.preventDefault();
    setNotice(tab === 'book'
      ? 'Booking preview only. Connect the booking API to submit reservations.'
      : 'Inquiry preview only. Connect the inquiry API to send your message.');
  };
  const gallery = spot.images;
  const facts = [
    { icon: 'clock', label: 'Duration', value: spot.duration },
    { icon: 'sun', label: 'Tour Type', value: spot.type },
    { icon: 'people', label: 'Group Size', value: spot.groupSize },
    { icon: 'globe2', label: 'Languages', value: spot.languages },
  ];

  return (
    <main className="destination-detail">
      <div className="dd-shell">
        <nav className="dd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{icon('house')} Home</Link><span>›</span><Link to="/destinations">Destinations</Link><span>›</span><span aria-current="page">Destination Details</span>
        </nav>

        <div className="dd-heading-row">
          <div><h1>Discover {spot.name}</h1><div className="dd-subheading">{icon('geo-alt')} {spot.location} <span className="dd-demo-label">Demo destination</span></div></div>
          <div className="dd-header-actions">
            <button type="button" className="dd-outline-btn" onClick={share}>{icon('share')} Share</button>
            <button type="button" className={`dd-outline-btn ${saved ? 'is-saved' : ''}`} onClick={() => setSaved((s) => !s)} aria-pressed={saved}>{icon(saved ? 'heart-fill' : 'heart')} {saved ? 'Saved' : 'Save'}</button>
          </div>
        </div>

        <div className="dd-gallery" aria-label="Destination photo gallery">
          {gallery.map((src, index) => <GalleryImage key={src} src={src} fallback={FALLBACK_IMAGES[index]} alt={`${spot.name} photo ${index + 1}`} className={index === 0 ? 'dd-gallery-main' : ''} onClick={() => openPhoto(index)}>
            {index === 4 && <span className="dd-view-all">{icon('images')} Show all photos</span>}
          </GalleryImage>)}
        </div>

        <div className="dd-content-grid">
          <div className="dd-content-main">
            <div className="dd-facts">{facts.map((fact) => <div className="dd-fact" key={fact.label}><span className="dd-fact-icon">{icon(fact.icon)}</span><span><small>{fact.label}</small><strong>{fact.value}</strong></span></div>)}</div>
            <section className="dd-section"><h2>Overview</h2><p>{spot.overview}</p></section>
            <section className="dd-section dd-highlights"><h2>Highlights</h2><div className="dd-highlight-grid">{spot.highlights.map((highlight) => <div key={highlight}>{icon('check-circle')}<span>{highlight}</span></div>)}</div></section>
            <section className="dd-section dd-reviews"><div className="dd-reviews-head"><h2>Reviews</h2><span className="dd-demo-label">No verified reviews yet</span></div><div className="dd-review-empty">{icon('chat-square-text')}<div><strong>Guest reviews are coming soon</strong><p>Real ratings and comments will appear here once the review API is connected. This is a demo page, so no ratings have been invented.</p></div></div></section>
          </div>

          <aside className="dd-booking-card" aria-label="Booking information">
            <div className="dd-booking-price"><small>Starting price</small><strong>{spot.price != null ? `$${spot.price.toFixed(2)}` : 'Contact for price'}</strong><span>{spot.price != null ? '/ person' : 'Price not available yet'}</span></div>
            <div className="dd-booking-tabs" role="tablist" aria-label="Booking options"><button type="button" role="tab" aria-selected={tab === 'book'} className={tab === 'book' ? 'active' : ''} onClick={() => { setTab('book'); setNotice(''); }}>{icon('calendar2-check')} Book</button><button type="button" role="tab" aria-selected={tab === 'inquiry'} className={tab === 'inquiry' ? 'active' : ''} onClick={() => { setTab('inquiry'); setNotice(''); }}>{icon('chat-left-dots')} Inquiry</button></div>
            <form className="dd-booking-form" onSubmit={submit}>
              {tab === 'book' ? <>
                <label className="dd-field-label" htmlFor="dd-date">Date</label><input id="dd-date" className="dd-date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)} required />
                {[{ label: 'Adults', hint: 'Ages 13 or above', count: adults, set: setAdults, min: 1 }, { label: 'Children', hint: 'Ages 2–12', count: children, set: setChildren, min: 0 }, { label: 'Infants', hint: 'Under 2 years', count: infants, set: setInfants, min: 0 }].map((person) => <div className="dd-counter-row" key={person.label}><div><strong>{person.label}</strong><small>{person.hint}</small></div><div className="dd-counter"><button type="button" aria-label={`Remove ${person.label}`} disabled={person.count <= person.min} onClick={() => person.set((x) => Math.max(person.min, x - 1))}>−</button><span>{person.count}</span><button type="button" aria-label={`Add ${person.label}`} onClick={() => person.set((x) => x + 1)}>+</button></div></div>)}
                <button type="submit" className="dd-submit-btn">Continue booking {icon('arrow-right')}</button>
              </> : <>
                <label className="dd-field-label" htmlFor="dd-name">Your name</label><input id="dd-name" className="dd-text-input" required placeholder="Full name" />
                <label className="dd-field-label" htmlFor="dd-email">Email</label><input id="dd-email" className="dd-text-input" type="email" required placeholder="you@example.com" />
                <label className="dd-field-label" htmlFor="dd-message">Message</label><textarea id="dd-message" className="dd-text-input" rows="4" required placeholder="How can we help?" />
                <button type="submit" className="dd-submit-btn">Send inquiry {icon('arrow-right')}</button>
              </>}
              {notice && <p className="dd-notice" role="status">{notice}</p>}
            </form>
          </aside>
        </div>
      </div>

      {galleryOpen && <div className="dd-lightbox" role="dialog" aria-modal="true" aria-label="Destination photo viewer" onClick={() => setGalleryOpen(false)}><div className="dd-lightbox-inner" onClick={(e) => e.stopPropagation()}><button className="dd-lightbox-close" type="button" onClick={() => setGalleryOpen(false)} aria-label="Close gallery">×</button><img src={gallery[activePhoto]} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGES[activePhoto]; }} alt={`${spot.name} photo ${activePhoto + 1}`} /><div className="dd-lightbox-controls"><button type="button" onClick={() => setActivePhoto((x) => (x + 4) % 5)} aria-label="Previous photo">←</button><span>{activePhoto + 1} / {gallery.length}</span><button type="button" onClick={() => setActivePhoto((x) => (x + 1) % 5)} aria-label="Next photo">→</button></div></div></div>}
    </main>
  );
}
