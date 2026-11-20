import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBookingById } from '../../api/bookingApi.js';
import { capturePayPalOrder, createPayPalOrder } from '../../api/payPalApi.js';
import { useAuth } from '../../auth/useAuth.js';
import { money } from '../../services/tourService.js';
import '../../styles/tour-checkout.css';

export default function TourPaymentReturnPage() {
    const [params] = useSearchParams();
    const bookingId = params.get('bookingId');
    const cancelled = params.get('cancelled') === '1';
    const resume = cancelled || params.get('resume') === '1';
    const approved = !resume && (params.has('token') || params.get('approved') === '1');
    const { user, loading } = useAuth();

    if (!bookingId || !/^[1-9]\d*$/.test(bookingId)) {
        return <PaymentLayout title="Booking not found"><Link to="/my-bookings">View my bookings</Link></PaymentLayout>;
    }
    if (loading) return <PaymentLayout title="Checking your sign-in"><p role="status">Please wait…</p></PaymentLayout>;
    if (!user) return (
        <PaymentLayout title="Sign in to continue payment">
            <p>Sign in to Karnel Travels to open the payment page for your booking.</p>
            <Link className="ktg-btn-teal" to="/login" state={{ tourPayment: { bookingId, cancelled, resume, approved } }}>Sign in to continue</Link>
        </PaymentLayout>
    );

    return <TourPayment key={bookingId} id={bookingId} cancelled={cancelled} resume={resume} approved={approved} />;
}

function PaymentLayout({ title, children }) {
    return (
        <main className="tour-checkout">
            <section className="tc-card tc-confirmation" aria-labelledby="tc-payment-heading">
                <h1 id="tc-payment-heading">{title}</h1>
                {children}
            </section>
        </main>
    );
}

function TourPayment({ id, cancelled, resume, approved }) {
    const [booking, setBooking] = useState(null);
    const [result, setResult] = useState(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const started = useRef(false);

    useEffect(() => {
        let active = true;
        getBookingById(id)
            .then((record) => { if (active) setBooking(record); })
            .catch((failure) => { if (active) setError(failure.message); });
        return () => { active = false; };
    }, [id]);

    const confirm = useCallback(async () => {
        if (sending) return;
        setSending(true);
        setError('');
        try {
            if (resume) {
                const order = await createPayPalOrder(id);
                if (order.approvalUrl) {
                    window.location.assign(order.approvalUrl);
                    return;
                }
            }
            setResult(await capturePayPalOrder(id));
        } catch (failure) {
            setError(failure.message);
        } finally {
            setSending(false);
        }
    }, [id, resume, sending]);

    const paid = result?.paymentStatus === 'Paid' || booking?.paymentStatus === 'Paid';
    const available = !paid && booking?.bookingStatus !== 'Cancelled'
        && booking?.paymentMethod === 'PayPalSandbox'
        && booking.paymentStatus === 'Unpaid';

    useEffect(() => {
        if (!approved || !available || started.current) return;
        started.current = true;
        void Promise.resolve().then(confirm);
    }, [approved, available, confirm]);

    if (!booking) {
        return (
            <PaymentLayout title={error ? 'Unable to load booking' : 'Loading your booking'}>
                {error ? <p role="alert">{error}</p> : <p role="status">Please wait…</p>}
                <Link to="/my-bookings">View my bookings</Link>
            </PaymentLayout>
        );
    }

    const title = paid && (result?.bookingStatus || booking.bookingStatus) === 'Confirmed' ? 'Booking confirmed'
        : paid ? 'Payment confirmed'
        : !available ? 'Payment unavailable'
        : resume ? 'Pay for your booking' : 'Confirm PayPal payment';

    return (
        <PaymentLayout title={title}>
            <dl className="tc-totals">
                <div><dt>Booking code</dt><dd>{booking.bookingCode}</dd></div>
                <div><dt>Booking status</dt><dd>{result?.bookingStatus || booking.bookingStatus}</dd></div>
                <div><dt>Payment status</dt><dd>{result?.paymentStatus || booking.paymentStatus}</dd></div>
                <div className="tc-total"><dt>Booking total</dt><dd>{money(booking.totalAmount)}</dd></div>
                {result?.payPalAmountUsd != null && <div><dt>PayPal Sandbox</dt><dd>USD {Number(result.payPalAmountUsd).toFixed(2)}</dd></div>}
            </dl>
            {available && (
                <>
                    <p>{cancelled ? 'Your booking remains unpaid. You can try PayPal again.' : resume ? 'Continue to PayPal Sandbox to pay for this booking.' : 'Verify the Sandbox transaction to update your booking.'}</p>
                    {error && <p className="tc-error" role="alert">{error}</p>}
                    <button type="button" className="tc-submit" disabled={sending} onClick={confirm}>
                        {sending ? 'Checking…' : resume ? 'Continue to PayPal Sandbox' : 'Confirm test payment'}
                    </button>
                </>
            )}
            {!available && !paid && <p>This booking is unavailable for PayPal payment.</p>}
            <Link className="tc-back" to="/my-bookings">View my bookings</Link>
        </PaymentLayout>
    );
}
