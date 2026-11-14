import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import '../styles/destinations/DestinationDetail.css';
import { getDestinationDetail, USE_DEMO_DESTINATIONS } from '../data/destinationDetailSource';

// Front-end demo: matches Promotion.cs and TourPackage.cs fields.
// A promotion applies to its linked tour only; no discount stacking.
const DEMO_TOURS = [
  { TourId: 101, SpotId: 1, TourName: 'Ha Long Bay Cruise Experience', StandardPrice: 2500000, SalePrice: 2000000, PromotionId: 1 },
  { TourId: 102, SpotId: 2, TourName: 'Hoi An Ancient Town Walk', StandardPrice: 1200000, SalePrice: 900000, PromotionId: 2 },
  { TourId: 103, SpotId: 3, TourName: 'Bali Culture & Nature', StandardPrice: 7900000, SalePrice: 6715000, PromotionId: 3 },
];
const DEMO_PROMOTIONS = [
  { PromotionId: 1, PromoCode: 'KARNEL20', Title: 'Ha Long Bay Discovery – Save 20%', DiscountPercent: 20, DiscountAmount: null, StartDate: '2026-01-01', EndDate: '2027-12-31', IsActive: true },
  { PromotionId: 2, PromoCode: 'HOIAN300', Title: 'Hoi An Heritage Escape – Save 300,000 VND', DiscountPercent: null, DiscountAmount: 300000, StartDate: '2026-01-01', EndDate: '2027-12-31', IsActive: true },
  { PromotionId: 3, PromoCode: 'BALI15', Title: 'Bali Island Getaway – Save 15%', DiscountPercent: 15, DiscountAmount: null, StartDate: '2026-01-01', EndDate: '2027-12-31', IsActive: true },
];
const money = (value) => `${Math.round(value).toLocaleString('vi-VN')} ₫`;
const isPromotionValid = (promo, selectedDate) => {
  if (!promo?.IsActive) return false;
  const day = selectedDate || new Date().toLocaleDateString('en-CA');
  return day >= promo.StartDate.slice(0, 10) && day <= promo.EndDate.slice(0, 10);
};
const getDiscount = (tour, promo) => {
  const byPercent = promo.DiscountPercent != null
    ? tour.StandardPrice * Number(promo.DiscountPercent) / 100 : 0;
  const byAmount = promo.DiscountAmount != null ? Number(promo.DiscountAmount) : 0;
  return Math.min(tour.StandardPrice, Math.max(0, byPercent || byAmount));
};

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
  const [spot, setSpot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setSpot(null);
    getDestinationDetail(id)
      .then((result) => { if (!cancelled) setSpot(result); })
      .catch((error) => { if (!cancelled) setLoadError(error.message || 'Unable to load destination.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);
  const [saved, setSaved] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [tab, setTab] = useState('book');
  const [date, setDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [notice, setNotice] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromoId, setAppliedPromoId] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');

  useEffect(() => {
    setSaved(false); setGalleryOpen(false); setActivePhoto(0); setNotice('');
    setPromoInput(''); setAppliedPromoId(null); setPromoMessage('');
  }, [id]);
  useEffect(() => {
    if (!galleryOpen) return;
    const onKey = (event) => {
      if (event.key === 'Escape') setGalleryOpen(false);
      if (event.key === 'ArrowRight') setActivePhoto((x) => (x + 1) % (spot?.images?.length || 1));
      if (event.key === 'ArrowLeft') setActivePhoto((x) => (x + (spot?.images?.length || 1) - 1) % (spot?.images?.length || 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [galleryOpen, spot]);

  const tour = USE_DEMO_DESTINATIONS ? DEMO_TOURS.find((item) => String(item.SpotId) === String(id)) : null;
  const offeredPromo = DEMO_PROMOTIONS.find((p) => p.PromotionId === tour?.PromotionId);
  const appliedPromo = DEMO_PROMOTIONS.find((p) => p.PromotionId === appliedPromoId);
  const promoValid = Boolean(appliedPromo && isPromotionValid(appliedPromo, date));
  const discountPerAdult = tour && promoValid ? getDiscount(tour, appliedPromo) : 0;
  const adultSubtotal = tour ? tour.StandardPrice * adults : 0;
  const adultDiscount = discountPerAdult * adults;
  const adultTotal = Math.max(0, adultSubtotal - adultDiscount);

  const applyPromo = () => {
    const entered = promoInput.trim().toUpperCase();
    const found = DEMO_PROMOTIONS.find((p) => p.PromoCode?.toUpperCase() === entered);
    if (!entered) { setPromoMessage('Please enter a promo code.'); setAppliedPromoId(null); return; }
    if (!found || !tour || found.PromotionId !== tour.PromotionId) {
      setPromoMessage('This promo code is not valid for the selected tour.'); setAppliedPromoId(null); return;
    }
    if (!isPromotionValid(found, date)) {
      setPromoMessage('This promotion is inactive or outside its valid dates.'); setAppliedPromoId(null); return;
    }
    setAppliedPromoId(found.PromotionId);
    setPromoMessage('Promo code applied successfully!');
  };

  if (loading) return <main className="dd-not-found"><h1>Loading destination...</h1></main>;
  if (loadError) return <main className="dd-not-found"><h1>Unable to load destination</h1><p>{loadError}</p><Link to="/destinations">Back to destinations</Link></main>;
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
      ? `Booking preview: ${adults} adult(s), ${children} child(ren), ${infants} infant(s). Adult estimate: ${money(adultTotal)}${promoValid ? ` with ${appliedPromo.PromoCode}` : ''}. Child/infant fares must be confirmed by the booking service. No booking has been created.`
      : 'Inquiry preview only. Connect the inquiry API to send your message.');
  };
  const gallery = spot.images;
  const facts = [
    { icon: 'geo-alt', label: 'Location', value: spot.location },
    { icon: 'compass', label: 'Travel Type', value: spot.type },
    ...(spot.duration ? [{ icon: 'clock', label: 'Duration', value: spot.duration }] : []),
    ...(spot.languages ? [{ icon: 'globe2', label: 'Languages', value: spot.languages }] : []),
  ];

  return (
    <main className="destination-detail">
      <div className="dd-shell">
        <nav className="dd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{icon('house')} Home</Link><span>›</span><Link to="/destinations">Destinations</Link><span>›</span><span aria-current="page">Destination Details</span>
        </nav>

        <div className="dd-heading-row">
          <div><h1>Discover {spot.name}</h1><div className="dd-subheading">{icon('geo-alt')} {spot.location} {USE_DEMO_DESTINATIONS && <span className="dd-demo-label">Demo destination</span>}</div></div>
          <div className="dd-header-actions">
            <button type="button" className="dd-outline-btn" onClick={share}>{icon('share')} Share</button>
            <button type="button" className={`dd-outline-btn ${saved ? 'is-saved' : ''}`} onClick={() => setSaved((s) => !s)} aria-pressed={saved}>{icon(saved ? 'heart-fill' : 'heart')} {saved ? 'Saved' : 'Save'}</button>
          </div>
        </div>

        <div className="dd-gallery" aria-label="Destination photo gallery">
          {gallery.map((src, index) => <GalleryImage key={`${src}-${index}`} src={src} fallback={FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]} alt={`${spot.name} photo ${index + 1}`} className={index === 0 ? 'dd-gallery-main' : ''} onClick={() => openPhoto(index)}>
            {index === gallery.length - 1 && gallery.length > 1 && <span className="dd-view-all">{icon('images')} Show all photos</span>}
          </GalleryImage>)}
        </div>

        <div className="dd-content-grid">
          <div className="dd-content-main">
            <div className="dd-facts">{facts.map((fact) => <div className="dd-fact" key={fact.label}><span className="dd-fact-icon">{icon(fact.icon)}</span><span><small>{fact.label}</small><strong>{fact.value}</strong></span></div>)}</div>
            <section className="dd-section"><h2>Overview</h2><p>{spot.overview}</p></section>
            {spot.highlights.length > 0 && <section className="dd-section dd-highlights"><h2>Highlights</h2><div className="dd-highlight-grid">{spot.highlights.map((highlight) => <div key={highlight}>{icon('check-circle')}<span>{highlight}</span></div>)}</div></section>}
            <section className="dd-section dd-reviews"><div className="dd-reviews-head"><h2>Reviews</h2><span className="dd-demo-label">No verified reviews yet</span></div><div className="dd-review-empty">{icon('chat-square-text')}<div><strong>Guest reviews are coming soon</strong><p>Real ratings and comments will appear here once the review API is connected. This is a demo page, so no ratings have been invented.</p></div></div></section>
          </div>

          <aside className="dd-booking-card" aria-label="Booking information">
            <div className="dd-booking-price">
              <small>Tour price per adult · Demo</small>
              <strong>{tour && USE_DEMO_DESTINATIONS ? money(tour.StandardPrice) : 'Contact for price'}</strong>
              {USE_DEMO_DESTINATIONS && tour && offeredPromo && isPromotionValid(offeredPromo, date) && (
                <span className="dd-promo-offer">{icon('tag-fill')} Offer available: {money(getDiscount(tour, offeredPromo))} off with code <b>{offeredPromo.PromoCode}</b></span>
              )}
              <span>{USE_DEMO_DESTINATIONS && tour?.TourName || 'Price not available yet'}</span>
            </div>
            <div className="dd-booking-tabs" role="tablist" aria-label="Booking options"><button type="button" role="tab" aria-selected={tab === 'book'} className={tab === 'book' ? 'active' : ''} onClick={() => { setTab('book'); setNotice(''); }}>{icon('calendar2-check')} Book</button><button type="button" role="tab" aria-selected={tab === 'inquiry'} className={tab === 'inquiry' ? 'active' : ''} onClick={() => { setTab('inquiry'); setNotice(''); }}>{icon('chat-left-dots')} Inquiry</button></div>
            <form className="dd-booking-form" onSubmit={submit}>
              {tab === 'book' ? <>
                <label className="dd-field-label" htmlFor="dd-date">Date</label><input id="dd-date" className="dd-date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)} required />
                {[{ label: 'Adults', hint: 'Ages 13 or above', count: adults, set: setAdults, min: 1 }, { label: 'Children', hint: 'Ages 2–12', count: children, set: setChildren, min: 0 }, { label: 'Infants', hint: 'Under 2 years', count: infants, set: setInfants, min: 0 }].map((person) => <div className="dd-counter-row" key={person.label}><div><strong>{person.label}</strong><small>{person.hint}</small></div><div className="dd-counter"><button type="button" aria-label={`Remove ${person.label}`} disabled={person.count <= person.min} onClick={() => person.set((x) => Math.max(person.min, x - 1))}>−</button><span>{person.count}</span><button type="button" aria-label={`Add ${person.label}`} onClick={() => person.set((x) => x + 1)}>+</button></div></div>)}
                {USE_DEMO_DESTINATIONS && tour && (
                  <div className="dd-promo-section">
                    <label className="dd-field-label" htmlFor="dd-promo">Promo code</label>
                    <div className="dd-promo-input-row">
                      <input id="dd-promo" type="text" value={promoInput} placeholder="Enter promo code"
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoMessage(''); setAppliedPromoId(null); }} />
                      <button type="button" onClick={applyPromo}>Apply</button>
                    </div>
                    {promoMessage && <p className={`dd-promo-message ${promoValid ? 'success' : ''}`} role="status">{promoMessage}</p>}
                    {promoValid && <button type="button" className="dd-promo-remove" onClick={() => { setAppliedPromoId(null); setPromoInput(''); setPromoMessage(''); }}>Remove code</button>}
                    <div className="dd-price-summary">
                      <div><span>Adult fare × {adults}</span><strong>{money(adultSubtotal)}</strong></div>
                      {promoValid && <div className="dd-price-discount"><span>Promo discount</span><strong>−{money(adultDiscount)}</strong></div>}
                      <div className="dd-price-total"><span>Estimated adult total</span><strong>{money(adultTotal)}</strong></div>
                    </div>
                    <p className="dd-price-note">Estimate covers adults only. Child and infant fares are not defined in the demo and will be calculated at checkout. Offers are not combined.</p>
                  </div>
                )}
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

      {galleryOpen && <div className="dd-lightbox" role="dialog" aria-modal="true" aria-label="Destination photo viewer" onClick={() => setGalleryOpen(false)}><div className="dd-lightbox-inner" onClick={(e) => e.stopPropagation()}><button className="dd-lightbox-close" type="button" onClick={() => setGalleryOpen(false)} aria-label="Close gallery">×</button><img src={gallery[activePhoto]} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGES[activePhoto % FALLBACK_IMAGES.length]; }} alt={`${spot.name} photo ${activePhoto + 1}`} /><div className="dd-lightbox-controls"><button type="button" onClick={() => setActivePhoto((x) => (x + (spot?.images?.length || 1) - 1) % (spot?.images?.length || 1))} aria-label="Previous photo">←</button><span>{activePhoto + 1} / {gallery.length}</span><button type="button" onClick={() => setActivePhoto((x) => (x + 1) % (spot?.images?.length || 1))} aria-label="Next photo">→</button></div></div></div>}
    </main>
  );
}
