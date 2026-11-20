import { useEffect, useState } from 'react';
import { request } from '../../api/http.js';
import { useAuth } from '../../auth/useAuth.js';

export default function TourReviews({ tourId }) {
    const { user, loading: authLoading } = useAuth();
    const [result, setResult] = useState(null);
    const [sending, setSending] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('recent');

    useEffect(() => {
        let active = true;
        request('/tours/' + encodeURIComponent(tourId) + '/reviews')
            .then((reviews) => { if (active) setResult({ reviews }); })
            .catch(() => { if (active) setResult({ error: true }); });
        return () => { active = false; };
    }, [tourId, refreshCount]);

    async function submit(event) {
        event.preventDefault();
        if (sending || authLoading) return;
        const data = new FormData(event.currentTarget);
        const content = data.get('content').trim();
        if (!content) {
            setFeedback({ error: 'Enter a review about the tour service.' });
            return;
        }
        setSending(true);
        setFeedback(null);
        try {
            const savedReview = await request('/feedbacks', {
                method: 'POST',
                body: JSON.stringify({
                    tourId,
                    rating: Number(data.get('rating')),
                    content,
                }),
            });
            setFeedback({ success: true, isApproved: savedReview.isApproved });
            if (savedReview.isApproved) setRefreshCount((count) => count + 1);
        } catch (error) {
            setFeedback({ error: error.message });
        } finally {
            setSending(false);
        }
    }

    const reviews = result?.reviews?.filter((review) => review.rating >= 1 && review.rating <= 5);
    const average = reviews?.length
        ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1)
        : null;

    const query = search.trim().toLocaleLowerCase();
    const visibleReviews = reviews?.filter((review) =>
        [review.fullName, review.title, review.content].filter(Boolean).join(' ').toLocaleLowerCase().includes(query))
        .sort((a, b) => sort === 'highest' ? b.rating - a.rating : b.feedbackId - a.feedbackId);

    return (
        <section className="ktd-section" aria-labelledby="tour-reviews-heading">
            <div className="ktd-section-title"><h2 id="tour-reviews-heading">Traveler reviews</h2></div>
            {!result && <p role="status">Loading reviews…</p>}
            {result?.error && <p role="alert">Reviews are currently unavailable.</p>}
            {reviews?.length === 0 && <p>No reviews for this tour yet.</p>}
            {average && <div className="tr-review-overview">
                <div className="tr-review-score"><strong>{average}</strong><span>Overall rating based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span></div>
                <div className="tr-review-bars">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = reviews.filter((review) => review.rating === rating).length;
                        return <div key={rating}><span>{rating} stars</span><progress value={count} max={reviews.length} aria-label={rating + ' stars: ' + count + ' reviews'} /><span>{count}</span></div>;
                    })}
                </div>
            </div>}
            {reviews?.length > 0 && <div className="tr-review-search">
                <input type="search" aria-label="Search reviews" placeholder="Search traveler reviews" value={search} onChange={(event) => setSearch(event.target.value)} />
                <select aria-label="Sort reviews" value={sort} onChange={(event) => setSort(event.target.value)}>
                    <option value="recent">Most recent</option><option value="highest">Highest rated</option>
                </select>
            </div>}
            {visibleReviews?.map((review) => (
                <article className="tr-review-item" key={review.feedbackId}>
                    <div className="tr-review-avatar" aria-hidden="true">{(review.fullName?.trim() || 'Anonymous').slice(0, 1).toUpperCase()}</div>
                    <div><div className="tr-review-author"><strong>{review.fullName || 'Anonymous traveler'}</strong><span aria-label={review.rating + ' out of 5'}>{review.rating.toFixed(1)} {'★'.repeat(review.rating)}</span></div>
                    {review.title && <h3>{review.title}</h3>}
                    <p>{review.content}</p></div>
                </article>
            ))}
            {reviews?.length > 0 && visibleReviews.length === 0 && <p>No reviews match your search.</p>}
            {result?.error && <button type="button" className="ktd-primary" onClick={() => setRefreshCount((count) => count + 1)}>Reload reviews</button>}
            {(reviews || feedback?.success) && <details className="ktd-booking kt-tour-review-form">
                <summary>Write a review</summary>
                {feedback?.success ? (
                    <p role="status">{feedback.isApproved ? 'Thanks. Your review was published.' : 'Thanks. Your review will appear after moderation.'}</p>
                ) : (
                    <form onSubmit={submit}>
                        {!authLoading && <p>{user ? 'Posting as ' + (user.fullName?.trim() || user.username) : 'Posting anonymously'}</p>}
                        <fieldset>
                            <legend className="fs-6">Rating</legend>
                            <div className="d-flex flex-wrap gap-3">
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <label className="d-flex gap-1 align-items-center" key={rating}>
                                        <input className="form-check-input rounded-circle p-0 mt-0" style={{ width: '1em' }} type="radio" name="rating" value={rating} required />
                                        {rating} <i className="bi bi-star-fill text-warning" aria-hidden="true" />
                                        <span className="visually-hidden">{rating === 1 ? 'star' : 'stars'}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <label>How was the tour service?<textarea name="content" rows={4} maxLength={2000} required /></label>
                        {feedback?.error && <p role="alert">{feedback.error}</p>}
                        <button className="ktd-primary" type="submit" disabled={sending || authLoading}>{sending ? 'Sending…' : 'Submit review'}</button>
                    </form>
                )}
            </details>}
        </section>
    );
}
