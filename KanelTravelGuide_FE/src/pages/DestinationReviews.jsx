import { useEffect, useState } from 'react';
import { request } from '../api/http.js';
import { useAuth } from '../auth/useAuth.js';

export default function DestinationReviews({ spotId }) {
    const { user, loading: authLoading } = useAuth();
    const [reviews, setReviews] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [sending, setSending] = useState(false);
    const [saved, setSaved] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const path = '/tourist-spots/' + encodeURIComponent(spotId) + '/reviews';

    useEffect(() => {
        let active = true;
        request(path)
            .then(items => {
                if (!active) return;
                setLoadError('');
                setReviews(items);
            })
            .catch(error => { if (active) setLoadError(error.message); });
        return () => { active = false; };
    }, [path, refresh]);

    async function submit(event) {
        event.preventDefault();
        if (sending || authLoading) return;
        const data = new FormData(event.currentTarget);
        setSending(true);
        setSubmitError('');
        try {
            const review = await request(path, {
                method: 'POST',
                body: JSON.stringify({
                    rating: Number(data.get('rating')),
                    content: data.get('content').trim(),
                }),
            });
            setReviews(items => [review, ...(items ?? []).filter(item => item.feedbackId !== review.feedbackId)]);
            setSaved(true);
        } catch (error) {
            setSubmitError(error.message);
        } finally {
            setSending(false);
        }
    }

    const count = reviews?.length ?? 0;
    const average = count ? (reviews.reduce((sum, item) => sum + item.rating, 0) / count).toFixed(1) : null;

    return (
        <section id="destination-reviews" className="dd-overview mt-4" aria-labelledby="destination-reviews-title">
            <h2 id="destination-reviews-title">Visitor reviews</h2>
            <p>How was the scenery and your visit to this destination?</p>
            {!reviews && !loadError && <p role="status">Loading visitor reviews…</p>}
            {loadError && <>
                <p role="alert">{loadError}</p>
                <button className="dd-button dd-button-quiet" type="button" onClick={() => setRefresh(value => value + 1)}>Try again</button>
            </>}
            {reviews && (
                <>
                    {count > 0 ? (
                        <p><i className="bi bi-star-fill text-warning me-1" aria-hidden="true" />
                            <strong>{average} / 5</strong> · {count} {count === 1 ? 'review' : 'reviews'}
                        </p>
                    ) : <p>No visitor reviews yet.</p>}
                    {reviews.map(review => (
                        <article className="border-top py-3" key={review.feedbackId}>
                            <div className="d-flex flex-wrap gap-2 align-items-center">
                                <strong>{review.fullName}</strong>
                                <span className="text-warning" role="img" aria-label={review.rating + ' out of 5 stars'}>{'★'.repeat(review.rating)}</span>
                            </div>
                            <div className="text-break mt-1" style={{ whiteSpace: 'pre-wrap' }}>{review.content}</div>
                        </article>
                    ))}
                    {saved ? <p role="status" className="mt-3">Thanks. Your destination review was published.</p> : (
                        <details className="border rounded-3 p-3 mt-3">
                            <summary className="fw-semibold">Review this destination</summary>
                            <form className="row g-3 mt-1" onSubmit={submit}>
                                {!authLoading && <p className="col-12 mb-0">
                                    {user ? 'Posting as ' + (user.fullName?.trim() || user.username) : 'Posting anonymously'}
                                </p>}
                                <fieldset className="col-12">
                                    <legend className="fs-6 mb-2">Rating</legend>
                                    <div className="d-flex flex-wrap gap-3">
                                        {[1, 2, 3, 4, 5].map(rating => (
                                            <label className="d-flex gap-1 align-items-center" key={rating}>
                                                <input className="form-check-input mt-0" type="radio" name="rating" value={rating} required />
                                                {rating} <i className="bi bi-star-fill text-warning" aria-hidden="true" />
                                                <span className="visually-hidden"> {rating === 1 ? 'star' : 'stars'}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                <label className="col-12">What stood out about this place?
                                    <textarea className="form-control" name="content" rows={4} required maxLength={2000} />
                                </label>
                                {submitError && <p className="text-danger" role="alert">{submitError}</p>}
                                <div className="col-12">
                                    <button className="dd-button dd-button-primary" type="submit" disabled={sending || authLoading}>
                                        {sending ? 'Publishing…' : 'Publish review'}
                                    </button>
                                </div>
                            </form>
                        </details>
                    )}
                </>
            )}
        </section>
    );
}
