import { useEffect, useRef, useState } from 'react';
import LoginPage from '../LoginPage.jsx';
import { listTourDepartures } from '../../api/tourDepartureApi.js';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { createBooking } from '../../api/bookingApi.js';
import { createPayPalOrder, getPayPalOptions, paymentLabels } from '../../api/payPalApi.js';
import { useAuth } from '../../auth/useAuth.js';
import { money, tourService } from '../../services/tourService.js';
import { extraKey, loadTourExtras, parseTourExtras } from '../../services/tourExtras.js';
import '../../styles/tour-detail.css';
import '../../styles/tour-checkout.css';

const departureDateFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });
const departureDateLabel = (date) => departureDateFormatter.format(new Date(date + 'T00:00:00Z'));

export default function TourBookingPage() {
    const [params] = useSearchParams();
    const id = params.get('tourId');
    const requestedDeparture = params.get('departureId');
    const initialDepartureId = /^[1-9]\d*$/.test(requestedDeparture ?? '') ? Number(requestedDeparture) : null;
    const adults = Number(params.get('adults') ?? 2);
    const children = Number(params.get('children') ?? 0);
    const validGroup = Number.isInteger(adults) && adults >= 1 && Number.isInteger(children)
        && children >= 0 && adults + children <= 1000;
    const extras = parseTourExtras(params.get('extras'));
    if (!id) return <ChooseTour />;
    if (extras === null) return <main className="ktd-state"><p role="alert">The additional service selection is invalid. Please select your services again.</p><Link to={'/tours/' + encodeURIComponent(id)}>Back to tour</Link></main>;
    if (!Number.isSafeInteger(initialDepartureId)) {
        return <Navigate to={`/tours/${encodeURIComponent(id)}#tour-departures`} replace />;
    }
    return <TourBooking key={params.toString()} id={id} initialDepartureId={initialDepartureId}
        initialAdults={validGroup ? adults : 1} initialChildren={validGroup ? children : 0} initialExtras={extras} />;
}

function ChooseTour() {
    const navigate = useNavigate();
    const [catalog, setCatalog] = useState(null);
    const [selectedId, setSelectedId] = useState('');

    useEffect(() => {
        let active = true;
        tourService.list()
            .then(tours => { if (active) setCatalog({ tours }); })
            .catch(error => { if (active) setCatalog({ error: error.message }); });
        return () => { active = false; };
    }, []);

    const tour = catalog?.tours?.find(item => String(item.id) === selectedId);

    function submit(event) {
        event.preventDefault();
        if (tour) navigate('/tours/' + encodeURIComponent(tour.id) + '#tour-departures');
    }

    return (
        <main className="tour-checkout">
            <div className="tc-shell">
                <Link className="tc-back" to="/tours"><i className="bi bi-arrow-left" aria-hidden="true" /> Browse tours</Link>
                <form className="tc-layout" onSubmit={submit}>
                    <div className="tc-card tc-form">
                        <h1>Book a tour</h1>
                        <section className="tc-section" aria-labelledby="select-tour-heading">
                            <h2 id="select-tour-heading">Tour details</h2>
                            <div className="tc-fields">
                                <label className="tc-wide">
                                    Tour
                                    <select value={selectedId} onChange={event => setSelectedId(event.target.value)}
                                        required disabled={!catalog?.tours?.length}>
                                        <option value="">{catalog ? 'Choose a tour' : 'Loading tours…'}</option>
                                        {catalog?.tours?.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                                    </select>
                                </label>
                            </div>
                            {catalog?.error && <p role="alert" className="tc-error">{catalog.error}</p>}
                            {catalog?.tours?.length === 0 && <p role="status">No tours are available right now.</p>}
                        </section>
                        <button className="tc-submit" type="submit" disabled={!tour}>View dates &amp; prices</button>
                    </div>
                    <aside className="tc-card tc-summary" aria-labelledby="choose-tour-summary">
                        <h2 id="choose-tour-summary">Tour summary</h2>
                        {tour ? (
                            <div className="tc-tour-preview" key={tour.id}>
                                {tour.image && <img src={tour.image} alt="" onError={event => { event.currentTarget.hidden = true; }} />}
                                <div>
                                    <span className="tc-tour-type">Guided tour</span>
                                    <h3>{tour.title}</h3>
                                    {tour.destination && <p>{tour.destination}</p>}
                                    {tour.duration && <p>{tour.duration}</p>}
                                </div>
                            </div>
                        ) : <p>Choose a tour to see its details.</p>}
                    </aside>
                </form>
            </div>
        </main>
    );
}

function TourBooking({ id, initialDepartureId, initialAdults, initialChildren, initialExtras }) {
    const { user, loading: authLoading } = useAuth();
    const [result, setResult] = useState(null);
    const [booking, setBooking] = useState(null);
    const [childAges, setChildAges] = useState(() => Array(initialChildren).fill(''));
    const [departureResult, setDepartureResult] = useState(null);
    const [extrasResult, setExtrasResult] = useState(null);
    const [scheduleVersion, setScheduleVersion] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('PayAfterConfirmation');
    const [useOffer, setUseOffer] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;
        Promise.all([tourService.get(id), getPayPalOptions().catch(() => null)])
            .then(([tour, options]) => { if (active) setResult({ tour, options }); })
            .catch((failure) => { if (active) setResult({ error: failure.message }); });
        return () => { active = false; };
    }, [id]);

    useEffect(() => {
        let active = true;
        listTourDepartures(id)
            .then((items) => { if (active) setDepartureResult({ items }); })
            .catch((failure) => { if (active) setDepartureResult({ error: failure.message }); });
        return () => { active = false; };
    }, [id, scheduleVersion]);

    const extraDate = departureResult?.items?.find((item) => item.tourDepartureId === initialDepartureId)?.departureDate;
    const extraLocation = result?.tour?.locationId;
    useEffect(() => {
        if (!initialExtras.length || !extraDate || !extraLocation) return;
        const requestScope = new AbortController();
        loadTourExtras(extraLocation, extraDate)
            .then((items) => { if (!requestScope.signal.aborted) setExtrasResult({ date: extraDate, items }); })
            .catch((failure) => { if (!requestScope.signal.aborted) setExtrasResult({ date: extraDate, error: failure.message }); });
        return () => requestScope.abort();
    }, [extraDate, extraLocation, initialExtras, scheduleVersion]);

    if (!result || authLoading) return <main className="ktd-state" role="status">Loading booking…</main>;
    if (result.error) return <main className="ktd-state"><p role="alert">{result.error}</p><Link to="/tours">Browse tours</Link></main>;

    const { tour, options } = result;
    const departures = departureResult?.items ?? [];
    const requestedDeparture = departures.find((item) => item.tourDepartureId === initialDepartureId);
    const adultCount = initialAdults;
    const travelerCount = adultCount + childAges.length;
    const validQuantity = Number.isInteger(adultCount) && adultCount >= 1 && travelerCount <= 1000;
    const departure = validQuantity && requestedDeparture?.seatsLeft >= travelerCount ? requestedDeparture : null;
    const selectionParams = new URLSearchParams({
        departureId: initialDepartureId, adults: adultCount, children: childAges.length,
    });
    if (initialExtras.length) selectionParams.set('extras', JSON.stringify(initialExtras));
    const selectionUrl = '/tours/' + encodeURIComponent(id) + '?' + selectionParams + '#tour-departures';
    const extraItems = extrasResult && extrasResult.date === extraDate ? extrasResult.items : null;
    const selectedExtras = initialExtras.map((item) => {
        const current = extraItems?.find((choice) => extraKey(choice) === extraKey(item));
        return current ? { ...current, quantity: item.quantity } : null;
    });
    const validExtras = !initialExtras.length || Boolean(extraItems)
        && selectedExtras.every((item) => item && item.quantity <= item.available);
    const extrasTotal = selectedExtras.reduce((sum, item) => sum + (item ? item.price * item.quantity : 0), 0);
    const tourSubtotal = departure ? departure.adultPrice * adultCount + departure.childPrice * childAges.length : 0;
    const subtotal = tourSubtotal + extrasTotal;
    const offer = useOffer ? tour.promotion : null;
    const discount = offer?.discountPercent > 0
        ? Math.round(subtotal * offer.discountPercent) / 100
        : (offer?.discountAmount ?? 0);
    const total = Math.max(0, subtotal - discount);
    const paypal = options?.enabled && user && total > 0;
    const chosenMethod = paymentMethod === 'PayPalSandbox' && !paypal ? 'PayAfterConfirmation' : paymentMethod;

    async function submit(event) {
        event.preventDefault();
        if (sending || !user) return;
        const data = new FormData(event.currentTarget);
        const startDate = departure?.departureDate;
        const customerName = data.get('customerName').trim();
        const customerPhone = data.get('customerPhone').trim();
        if (!customerName || !customerPhone || !departure || !validQuantity || !validExtras || childAges.some((age) => age === '')) {
            setError('Choose a departure with enough seats, enter ages for children, and check your contact details.');
            return;
        }
        setError('');
        setSending(true);
        try {
            setBooking(await createBooking({
                bookingType: 'Tour',
                tourDepartureId: departure.tourDepartureId,
                adultCount,
                childAges: childAges.map(Number),
                customerName,
                customerPhone,
                customerEmail: data.get('customerEmail').trim(),
                startDate,
                totalPassengers: travelerCount,
                notes: data.get('notes').trim() || null,
                paymentMethod: options ? chosenMethod : null,
                promoCode: offer?.promoCode,
                details: [
                    { tourId: tour.id, quantity: travelerCount },
                    ...selectedExtras.filter(Boolean).map((item) => ({
                        ...(item.kind === 'service' ? { serviceItemId: item.id } : { scheduleId: item.id }),
                        quantity: item.quantity,
                    })),
                ],
            }));
        } catch (failure) {
            setError(failure.message);
            if (failure.status === 409) {
                setDepartureResult(null);
                setScheduleVersion((version) => version + 1);
            }
        } finally {
            setSending(false);
        }
    }

    async function openPayPal() {
        if (sending) return;
        setSending(true);
        setError('');
        try {
            const payment = await createPayPalOrder(booking.bookingId);
            if (payment.resume) navigate(`/tours/payment-return?bookingId=${booking.bookingId}`);
            else window.location.assign(payment.approvalUrl);
        } catch (failure) {
            setError(failure.message);
        } finally {
            setSending(false);
        }
    }

    const priceLabel = departure && validQuantity && validExtras ? money(total) : '—';
    const payPalHint = !options?.enabled
        ? 'Currently unavailable'
        : !user ? 'Sign in to use PayPal Sandbox' : total <= 0 ? 'Available for a positive balance' : 'Test checkout in USD';

    if (booking) return (
        <main className="tour-checkout">
            <section className="tc-card tc-confirmation" aria-labelledby="tc-confirmation-title">
                <i className="bi bi-check-circle-fill tc-confirmation-icon" aria-hidden="true" />
                <h1 id="tc-confirmation-title">Booking request received</h1>
                <p>We received your request for <strong>{tour.title}</strong>.</p>
                <dl className="tc-totals">
                    <div><dt>Booking code</dt><dd>{booking.bookingCode}</dd></div>
                    <div><dt>Booking status</dt><dd>{booking.bookingStatus}</dd></div>
                    {booking.paymentMethod && <div><dt>Payment method</dt><dd>{paymentLabels[booking.paymentMethod]}</dd></div>}
                    <div><dt>Payment status</dt><dd>{booking.paymentStatus}</dd></div>
                    <div className="tc-total"><dt>Total</dt><dd>{money(booking.totalAmount)}</dd></div>
                </dl>
                {booking.paymentMethod === 'BankTransfer' && <p>Wait for confirmation and bank transfer instructions before paying.</p>}
                {error && <p className="tc-error" role="alert">{error}</p>}
                {booking.paymentMethod === 'PayPalSandbox' && (
                    <button className="tc-submit" type="button" onClick={openPayPal} disabled={sending}>
                        {sending ? 'Opening PayPal…' : 'Continue to PayPal Sandbox'}
                    </button>
                )}
                <Link className="tc-back" to={user ? '/my-bookings' : '/tours'}>{user ? 'View my bookings' : 'Browse tours'}</Link>
            </section>
        </main>
    );

    return (
        <main className="tour-checkout">
            {!user && <BookingSignIn tourId={tour.id} />}
            <div className="tc-shell">
                <Link className="tc-back" to={selectionUrl}><i className="bi bi-arrow-left" aria-hidden="true" /> Back to tour</Link>
                <nav className="tc-progress" aria-label="Checkout sections">
                    <ol>
                        <li><a href="#tc-trip"><span aria-hidden="true">1</span> Tour details</a></li>
                        <li><a href="#tc-contact"><span aria-hidden="true">2</span> Guest details</a></li>
                        <li><a href="#tc-payment"><span aria-hidden="true">3</span> Payment &amp; review</a></li>
                    </ol>
                </nav>

                <form className="tc-layout" onSubmit={submit}>
                    <div className="tc-card tc-form">
                        <h1>Complete your tour booking</h1>

                        <section id="tc-trip" className="tc-section" aria-labelledby="tc-trip-title">
                            <h2 id="tc-trip-title">Selected departure</h2>
                            {!departureResult && <p role="status">Checking availability…</p>}
                            {departureResult?.error && <p className="tc-error" role="alert">{departureResult.error}</p>}
                            {departureResult?.items && !departure && (
                                <p className="tc-error" role="status">The selected departure no longer has enough seats for your group.</p>
                            )}
                            {departure && (
                                <div className="tc-tour-preview">
                                    <div>
                                        <strong>{departureDateLabel(departure.departureDate)}{departure.departureTime ? ' · ' + departure.departureTime.slice(0, 5) : ''} – {departureDateLabel(departure.returnDate)}</strong>
                                        <p>{adultCount} {adultCount === 1 ? 'adult' : 'adults'}{childAges.length ? ' · ' + childAges.length + (childAges.length === 1 ? ' child' : ' children') : ''}</p>
                                    </div>
                                </div>
                            )}
                            <Link className="tc-back mt-2 mb-0" to={selectionUrl}>Change date or travelers</Link>
                        </section>

                        <section key={user?.userId ?? (user ? "signed-in" : "guest")} id="tc-contact" className="tc-section" aria-labelledby="tc-contact-title">
                            <h2 id="tc-contact-title">Guest contact details</h2>
                            <div className="tc-fields">
                                <label className="tc-wide">Full name<input name="customerName" autoComplete="name" required maxLength={100} defaultValue={user?.fullName ?? ''} /></label>
                                <label>Mobile phone<input name="customerPhone" type="tel" autoComplete="tel" required maxLength={20} defaultValue={user?.phone ?? ''} /></label>
                                <label>Email for booking updates<input name="customerEmail" type="email" autoComplete="email" required maxLength={100} defaultValue={user?.email ?? ''} /></label>
                                {childAges.map((age, index) => (
                                <label key={index}>Child {index + 1} age on departure
                                    <select required value={age} onChange={(event) => {
                                        const value = event.target.value;
                                        setChildAges((ages) => ages.map((item, position) => position === index ? value : item));
                                    }}>
                                        <option value="">Select age</option>
                                        {Array.from({ length: 16 }, (_, offset) => offset + 2).map((value) => <option key={value} value={value}>{value} years</option>)}
                                    </select>
                                </label>
                            ))}
                            <label className="tc-wide"><span>Special requests <span className="tc-hint">(optional)</span></span>
                                    <textarea name="notes" maxLength={500} rows={3} placeholder="e.g. Dietary requirements or accessibility needs" />
                                </label>
                            </div>
                        </section>

                        <fieldset id="tc-payment" className="tc-section tc-payment">
                            <legend>Payment preference</legend>
                            <label className="tc-option">
                                <input type="radio" name="paymentMethod" checked={chosenMethod === 'PayAfterConfirmation'} onChange={() => setPaymentMethod('PayAfterConfirmation')} />
                                <span className="tc-option-copy"><strong>Pay after confirmation</strong><small>The operator confirms the trip before payment.</small></span>
                                <i className="bi bi-calendar-check" aria-hidden="true" />
                            </label>
                            <label className="tc-option">
                                <input type="radio" name="paymentMethod" disabled={!options} checked={chosenMethod === 'BankTransfer'} onChange={() => setPaymentMethod('BankTransfer')} />
                                <span className="tc-option-copy"><strong>Bank transfer</strong><small>{options ? 'Transfer instructions are provided after confirmation.' : 'Currently unavailable'}</small></span>
                                <i className="bi bi-bank" aria-hidden="true" />
                            </label>
                            <label className="tc-option">
                                <input type="radio" name="paymentMethod" disabled={!paypal} checked={chosenMethod === 'PayPalSandbox'} onChange={() => setPaymentMethod('PayPalSandbox')} />
                                <span className="tc-option-copy"><strong>PayPal Sandbox</strong><small>{payPalHint}</small></span>
                                <i className="bi bi-paypal" aria-hidden="true" />
                            </label>
                        </fieldset>

                        {initialExtras.length > 0 && !validExtras && (
                            <p className="tc-error" role="alert">
                                {extrasResult?.error || (extraItems
                                    ? 'An additional service is unavailable or has insufficient capacity. Return to the tour to update your selection.'
                                    : 'Checking prices and availability for your additional services…')}
                                {' '}<Link to={selectionUrl}>Review services</Link>
                            </p>
                        )}
                        {error && <p className="tc-error" role="alert">{error}</p>}
                        <button className="tc-submit" type="submit" disabled={sending || !departure || !validQuantity || !validExtras}>
                            {sending ? 'Submitting…' : departure && validQuantity ? 'Send booking request · ' + priceLabel : 'Send booking request'}
                        </button>
                    </div>

                    <aside className="tc-card tc-summary" aria-labelledby="tc-summary-title">
                        <h2 id="tc-summary-title">Order summary</h2>
                        <div className="tc-tour-preview">
                            {tour.image && <img src={tour.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}
                            <div>
                                <span className="tc-tour-type">Guided tour</span>
                                <h3>{tour.title}</h3>
                                <p><i className="bi bi-clock" aria-hidden="true" /> {tour.duration}</p>
                                {departure && <p><i className="bi bi-calendar-event" aria-hidden="true" /> {departureDateLabel(departure.departureDate)}{departure.departureTime ? ' · ' + departure.departureTime.slice(0, 5) : ''} – {departureDateLabel(departure.returnDate)}</p>}
                            </div>
                        </div>
                        {tour.promotion && (
                            <div className="tc-offer">
                                <div><strong>{tour.promotion.promoCode}</strong><small>{tour.promotion.title}</small></div>
                                <button type="button" aria-pressed={useOffer} onClick={() => setUseOffer((current) => !current)}>{useOffer ? 'Remove' : 'Apply'}</button>
                            </div>
                        )}
                        <dl className="tc-totals" aria-live="polite">
                            {departure && <div><dt>Adults × {adultCount}</dt><dd>{money(departure.adultPrice * adultCount)}</dd></div>}
                            {departure && childAges.length > 0 && <div><dt>Children × {childAges.length}</dt><dd>{money(departure.childPrice * childAges.length)}</dd></div>}
                            <div><dt>Travelers</dt><dd>{validQuantity ? '× ' + travelerCount : '—'}</dd></div>
                            <div><dt>Tour subtotal</dt><dd>{departure ? money(tourSubtotal) : '—'}</dd></div>
                            {selectedExtras.filter(Boolean).map((item) => (
                                <div key={extraKey(item)}>
                                    <dt>{item.label} × {item.quantity}<small className="d-block text-muted">{item.provider}</small></dt>
                                    <dd>{money(item.price * item.quantity)}</dd>
                                </div>
                            ))}
                            {initialExtras.length > 0 && <div><dt>Additional services</dt><dd>{validExtras ? money(extrasTotal) : 'Checking…'}</dd></div>}
                            <div><dt>Subtotal</dt><dd>{departure && validQuantity ? money(subtotal) : '—'}</dd></div>
                            {offer && departure && validQuantity && <div className="tc-savings"><dt>Promotion</dt><dd>−{money(Math.min(subtotal, discount))}</dd></div>}
                            <div className="tc-total"><dt>Estimated total</dt><dd>{priceLabel}</dd></div>
                            {chosenMethod === 'PayPalSandbox' && <div><dt>PayPal estimate</dt><dd>USD {(total / options.vndPerUsd).toFixed(2)}</dd></div>}
                        </dl>
                        <p className="tc-hint"><i className="bi bi-info-circle" aria-hidden="true" /> You’ll receive a booking reference after submitting.</p>
                    </aside>
                </form>
            </div>
        </main>
    );
}

function BookingSignIn({ tourId }) {
    const dialogRef = useRef(null);
    const navigate = useNavigate();
    const tourUrl = '/tours/' + encodeURIComponent(tourId);

    useEffect(() => {
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => { if (dialog.open) dialog.close(); };
    }, []);

    return (
        <dialog
            ref={dialogRef}
            className="tc-login-dialog"
            aria-label="Sign in to book your tour"
            onCancel={(event) => {
                event.preventDefault();
                navigate(tourUrl, { replace: true });
            }}
        >
            <LoginPage description="Sign in to fill in your tour details and choose a payment method, including PayPal Sandbox." />
            <Link className="tc-back" to={tourUrl} replace>Back to tour</Link>
        </dialog>
    );
}
