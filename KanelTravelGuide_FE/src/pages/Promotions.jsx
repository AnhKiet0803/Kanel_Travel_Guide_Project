
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    promotionsDemo,
    tourVisuals,
    transportDealsDemo
} from '../data/promotionsDemo';
import '../styles/Promotions.css';

const currency = (amount) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);

const shortDate = (value) =>
    new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(value));

const getStatus = (promotion, now) => {
    if (!promotion.IsActive) return 'inactive';

    if (now < new Date(promotion.StartDate).getTime()) {
        return 'upcoming';
    }

    if (now > new Date(promotion.EndDate).getTime()) {
        return 'expired';
    }

    return 'active';
};

const remaining = (date, now) => {
    const ms = new Date(date).getTime() - now;

    if (ms <= 0) return 'Offer ended';

    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    return `${days}d ${hours}h ${minutes}m left`;
};

const discountLabel = (percent, amount) => {
    if (Number(percent) > 0) {
        return `-${percent}%`;
    }

    if (Number(amount) > 0) {
        return `Save ${currency(amount)}`;
    }

    return 'Special deal';
};

const effectivePrice = (tour, promotion) => {
    // Prefer the SalePrice supplied by the data source.
    if (tour.SalePrice != null) {
        return Math.max(0, Number(tour.SalePrice));
    }

    const standard = Number(tour.StandardPrice);

    if (promotion.DiscountPercent != null) {
        return Math.max(
            0,
            standard * (1 - Number(promotion.DiscountPercent) / 100)
        );
    }

    if (promotion.DiscountAmount != null) {
        return Math.max(
            0,
            standard - Number(promotion.DiscountAmount)
        );
    }

    return standard;
};

// Exclude regular fares without an actual promotion.
const hasRealDiscount = (offer) => {
    const originalPrice = Number(offer.originalPrice);
    const price = Number(offer.price);

    const hasPriceReduction =
        Number.isFinite(originalPrice) &&
        Number.isFinite(price) &&
        originalPrice > 0 &&
        price >= 0 &&
        price < originalPrice;

    const hasDiscountValue =
        Number(offer.discountPercent) > 0 ||
        Number(offer.discountAmount) > 0;

    const hasPromoCode =
        typeof offer.promoCode === 'string' &&
        offer.promoCode.trim().length > 0;

    return (
        hasPriceReduction ||
        hasDiscountValue ||
        hasPromoCode
    );
};

export default function Promotions() {
    const navigate = useNavigate();

    const [now, setNow] = useState(Date.now());
    const [category, setCategory] = useState('All');
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('featured');
    const [showUnavailable, setShowUnavailable] = useState(false);
    const [selected, setSelected] = useState(null);
    const [copied, setCopied] = useState('');

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(Date.now());
        }, 60000);

        return () => window.clearInterval(timer);
    }, []);

    const offers = useMemo(() => {
        // Tour promotions
        const tours = promotionsDemo.flatMap((promotion) =>
            (promotion.TourPackages || []).map((tour) => {
                const visual = tourVisuals[tour.TourId] || {};

                return {
                    id: `tour-${tour.TourId}`,
                    type: 'Tour',
                    title: tour.TourName,
                    subtitle: promotion.Title,
                    description: tour.ItineraryDetail || '',
                    image: visual.image || '',
                    location: visual.location || '',
                    provider: 'Karnel Travels',
                    duration: tour.Duration,
                    originalPrice: Number(tour.StandardPrice),
                    price: effectivePrice(tour, promotion),
                    discountPercent: promotion.DiscountPercent,
                    discountAmount: promotion.DiscountAmount,
                    promoCode: promotion.PromoCode,
                    startDate: promotion.StartDate,
                    endDate: promotion.EndDate,
                    status: getStatus(promotion, now),
                    isFeatured: tour.IsFeatured,
                    bookingPath: `/booking?tourId=${tour.TourId}`,
                    isDemoTransport: false
                };
            })
        );

        // Transportation promotions (demo only)
        const transport = transportDealsDemo.map((item) => ({
            ...item,
            subtitle: item.provider,
            location: `${item.origin} → ${item.destination}`,
            startDate: null,
            status:
                new Date(item.endDate).getTime() >= now
                    ? 'active'
                    : 'expired',
            isFeatured: false,
            isDemoTransport: true
        }));

        // Only retain genuine promotions.
        return [...tours, ...transport].filter(hasRealDiscount);
    }, [now]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLocaleLowerCase();

        const list = offers.filter((offer) => {
            const matchCategory =
                category === 'All' || offer.type === category;

            const matchQuery = [
                offer.title,
                offer.subtitle,
                offer.location,
                offer.promoCode || ''
            ]
                .join(' ')
                .toLocaleLowerCase()
                .includes(needle);

            const matchStatus =
                showUnavailable || offer.status === 'active';

            return matchCategory && matchQuery && matchStatus;
        });

        return list.sort((a, b) => {
            if (sort === 'priceLow') {
                return a.price - b.price;
            }

            if (sort === 'priceHigh') {
                return b.price - a.price;
            }

            if (sort === 'ending') {
                return new Date(a.endDate) - new Date(b.endDate);
            }

            return (
                Number(b.isFeatured) - Number(a.isFeatured) ||
                (b.originalPrice - b.price) -
                (a.originalPrice - a.price)
            );
        });
    }, [offers, category, query, sort, showUnavailable]);

    const activeCount = offers.filter(
        (offer) => offer.status === 'active'
    ).length;

    const openDetails = (offer) => {
        setSelected(offer);
        setCopied('');
    };

    const closeDetails = () => {
        setSelected(null);
    };

    const copyCode = async (code) => {
        if (!code) return;

        try {
            await navigator.clipboard.writeText(code);
            setCopied(code);
        } catch {
            setCopied('');
        }
    };

    return (
        <main className="promo-page">
            <div className="promo-container">

                {/* HERO */}
                <section className="promo-hero">
                    <div className="promo-hero-content">
                        <span className="promo-eyebrow">
                            ✦ KARNEL TRAVELS · SPECIAL OFFERS
                        </span>

                        <h1>
                            Go further. <em>Spend less.</em>
                        </h1>

                        <p>
                            Explore limited-time travel offers,
                            unforgettable tours and great-value journeys.
                        </p>

                        <a className="promo-hero-cta" href="#promo-results">
                            Explore deals
                            <span aria-hidden="true">→</span>
                        </a>
                    </div>

                    <div className="promo-hero-stat">
                        <strong>{activeCount}</strong>
                        <span>Demo deals available</span>
                    </div>
                </section>

                {/* INTRO */}
                <div className="promo-intro">
                    <div>
                        <span className="promo-eyebrow">
                            DISCOVER YOUR NEXT ADVENTURE
                        </span>

                        <h2>Offers worth exploring</h2>

                        <p>
                            Compare tour promotions and sample transportation
                            deals in one place.
                        </p>
                    </div>

                    <span className="promo-demo-pill">
                        Demo data · API integration pending
                    </span>
                </div>

                {/* FILTERS */}
                <section
                    className="promo-toolbar"
                    aria-label="Filter offers"
                >
                    <div
                        className="promo-categories"
                        role="group"
                        aria-label="Offer category"
                    >
                        {['All', 'Tour', 'Bus', 'Flight', 'Train'].map(
                            (item) => (
                                <button
                                    key={item}
                                    type="button"
                                    className={
                                        category === item ? 'active' : ''
                                    }
                                    onClick={() => setCategory(item)}
                                >
                                    {item === 'All' ? 'All offers' : item}
                                </button>
                            )
                        )}
                    </div>

                    <div className="promo-tools">
                        <label className="promo-search">
                            <span aria-hidden="true">⌕</span>

                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search offers or destinations"
                                aria-label="Search offers"
                            />
                        </label>

                        <select
                            aria-label="Sort offers"
                            value={sort}
                            onChange={(e) => setSort(e.target.value)}
                        >
                            <option value="featured">Recommended</option>
                            <option value="ending">Ending soon</option>
                            <option value="priceLow">Lowest price</option>
                            <option value="priceHigh">Highest price</option>
                        </select>
                    </div>
                </section>

                {/* RESULTS HEADER */}
                <div
                    className="promo-results-header"
                    id="promo-results"
                >
                    <div>
                        <h2>Available deals</h2>
                        <p>
                            {filtered.length} offer(s) matching your selection
                        </p>
                    </div>

                    <label className="promo-checkbox">
                        <input
                            type="checkbox"
                            checked={showUnavailable}
                            onChange={(e) =>
                                setShowUnavailable(e.target.checked)
                            }
                        />
                        Show upcoming / expired
                    </label>
                </div>

                {/* RESULTS */}
                {filtered.length === 0 ? (
                    <div className="promo-empty">
                        <span>✦</span>

                        <h3>No offers found</h3>

                        <p>
                            There are currently no special offers
                            matching your selection.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setCategory('All');
                                setQuery('');
                                setShowUnavailable(false);
                            }}
                        >
                            Clear filters
                        </button>
                    </div>
                ) : (
                    <div className="promo-grid">
                        {filtered.map((offer) => {
                            const discounted =
                                offer.price < offer.originalPrice;

                            return (
                                <article
                                    className="promo-card"
                                    key={offer.id}
                                >
                                    <div className="promo-image-wrap">
                                        {offer.image && (
                                            <img
                                                src={offer.image}
                                                alt={offer.title}
                                                loading="lazy"
                                                onError={(event) => {
                                                    event.currentTarget.style.display =
                                                        'none';
                                                }}
                                            />
                                        )}

                                        <span className="promo-type-tag">
                                            {offer.type}
                                        </span>

                                        {discounted && (
                                            <span className="promo-discount-tag">
                                                {discountLabel(
                                                    offer.discountPercent,
                                                    offer.discountAmount
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    <div className="promo-card-body">
                                        <div className="promo-card-meta">
                                            <span>
                                                ⌖ {offer.location || 'Travel experience'}
                                            </span>

                                            <span
                                                className={`promo-status ${offer.status}`}
                                            >
                                                {offer.status === 'active'
                                                    ? '● Active'
                                                    : offer.status === 'upcoming'
                                                        ? '◷ Coming soon'
                                                        : offer.status === 'expired'
                                                            ? 'Expired'
                                                            : 'Inactive'}
                                            </span>
                                        </div>

                                        <h3>{offer.title}</h3>

                                        <p className="promo-card-description">
                                            {offer.description || offer.subtitle}
                                        </p>

                                        {offer.duration && (
                                            <p className="promo-duration">
                                                ◷ {offer.duration}
                                            </p>
                                        )}

                                        <div className="promo-price-row">
                                            <div>
                                                <span className="promo-price-label">
                                                    From
                                                </span>

                                                <strong>
                                                    {currency(offer.price)}
                                                </strong>

                                                {discounted && (
                                                    <del>
                                                        {currency(offer.originalPrice)}
                                                    </del>
                                                )}
                                            </div>

                                            {discounted && (
                                                <span className="promo-save">
                                                    Save{' '}
                                                    {currency(
                                                        offer.originalPrice - offer.price
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {offer.promoCode && (
                                            <div className="promo-code-row">
                                                <span>
                                                    Promo code:{' '}
                                                    <strong>{offer.promoCode}</strong>
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        copyCode(offer.promoCode)
                                                    }
                                                >
                                                    {copied === offer.promoCode
                                                        ? 'Copied!'
                                                        : 'Copy code'}
                                                </button>
                                            </div>
                                        )}

                                        <div className="promo-time">
                                            {offer.status === 'active'
                                                ? `⏳ ${remaining(offer.endDate, now)}`
                                                : offer.status === 'upcoming'
                                                    ? `Starts ${shortDate(offer.startDate)}`
                                                    : `Ended ${shortDate(offer.endDate)}`}
                                        </div>

                                        <div className="promo-card-actions">
                                            <button
                                                type="button"
                                                className="promo-outline"
                                                onClick={() => openDetails(offer)}
                                            >
                                                View details
                                            </button>

                                            <button
                                                type="button"
                                                className="promo-primary"
                                                disabled={offer.status !== 'active'}
                                                onClick={() =>
                                                    navigate(offer.bookingPath)
                                                }
                                            >
                                                Book now →
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* DEMO NOTICE */}
                <div className="promo-info-strip">
                    <span>ⓘ</span>

                    <p>
                        <strong>Demo notice:</strong> Tour promotions
                        follow the supplied Promotion and TourPackage
                        models. Transportation deals are illustrative
                        only. Real discounts and booking confirmation
                        require backend integration.
                    </p>
                </div>

                <div className="promo-bottom-link">
                    Want to discover more places?{' '}
                    <Link to="/destinations">
                        Explore destinations →
                    </Link>
                </div>
            </div>

            {/* DETAILS MODAL */}
            {selected && (
                <div
                    className="promo-modal-backdrop"
                    role="presentation"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            closeDetails();
                        }
                    }}
                >
                    <section
                        className="promo-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${selected.title} offer details`}
                    >
                        <button
                            className="promo-modal-close"
                            type="button"
                            onClick={closeDetails}
                            aria-label="Close details"
                        >
                            ×
                        </button>

                        <span className="promo-eyebrow">
                            {selected.type.toUpperCase()} OFFER
                        </span>

                        <h2>{selected.title}</h2>
                        <p>{selected.subtitle}</p>

                        <div className="promo-modal-details">
                            <div>
                                <span>Standard price</span>
                                <strong>
                                    {currency(selected.originalPrice)}
                                </strong>
                            </div>

                            <div>
                                <span>Offer price</span>
                                <strong>
                                    {currency(selected.price)}
                                </strong>
                            </div>

                            <div>
                                <span>Discount</span>
                                <strong>
                                    {selected.price < selected.originalPrice
                                        ? discountLabel(
                                            selected.discountPercent,
                                            selected.discountAmount
                                        )
                                        : 'Promo code offer'}
                                </strong>
                            </div>

                            <div>
                                <span>Valid until</span>
                                <strong>
                                    {shortDate(selected.endDate)}
                                </strong>
                            </div>

                            <div>
                                <span>Status</span>
                                <strong>{selected.status}</strong>
                            </div>

                            <div>
                                <span>Promo code</span>
                                <strong>
                                    {selected.promoCode || 'Not required'}
                                </strong>
                            </div>
                        </div>

                        <p className="promo-modal-note">
                            {selected.isDemoTransport
                                ? 'This transportation deal is sample data and is not linked to Promotion.cs.'
                                : 'Final eligibility and price must be validated by the backend at checkout.'}
                        </p>

                        <button
                            className="promo-primary promo-modal-book"
                            type="button"
                            disabled={selected.status !== 'active'}
                            onClick={() =>
                                navigate(selected.bookingPath)
                            }
                        >
                            Continue to booking →
                        </button>
                    </section>
                </div>
            )}
        </main>
    );
}
