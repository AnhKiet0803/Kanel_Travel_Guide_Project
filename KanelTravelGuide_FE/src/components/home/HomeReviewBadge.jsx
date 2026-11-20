import { Link } from 'react-router-dom';

export default function HomeReviewBadge({ to, title, count, average, overlay = false }) {
  if (!Number.isFinite(count)) return null;

  return (
    <Link className={`home-review-badge${overlay ? ' home-review-badge-overlay' : ''}`} to={to}>
      <span className="visually-hidden">Reviews for {title}: </span>
      <i className="bi bi-star-fill" aria-hidden="true" />
      {count > 0 && Number.isFinite(average)
        ? <><strong>{average.toFixed(1)} / 5</strong> · {count} {count === 1 ? 'review' : 'reviews'}</>
        : 'No reviews yet'}
    </Link>
  );
}
