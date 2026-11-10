// CN15: Feedback & Rating page.
// Guests send a star rating (1-5) and a message; feedback is only shown publicly after
// an Admin approves it (is_approved column of the Feedbacks table).
import { useEffect, useState } from 'react'
import { getApprovedFeedbacks, sendFeedback } from '../api/publicApi.js'
import { LIMITS, validateFeedback } from '../utils/validators.js'
import './pages.css'

const EMPTY_FORM = { fullName: '', email: '', rating: '', title: '', content: '' }

function Stars({ value }) {
  if (!value) return null
  return (
    <span className="ktg-stars" aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(value)}
      {'☆'.repeat(5 - value)}
    </span>
  )
}

export default function FeedbackPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [approved, setApproved] = useState([])
  const [listError, setListError] = useState('')

  useEffect(() => {
    let cancelled = false
    getApprovedFeedbacks()
      .then((items) => {
        if (!cancelled) setApproved(items ?? [])
      })
      .catch((error) => {
        if (!cancelled) setListError(error.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateFeedback(form)
    setErrors(found)
    setResult(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await sendFeedback(form)
      setResult({
        type: 'success',
        text: 'Thank you for your feedback! It will be displayed once an administrator approves it.',
      })
      setForm(EMPTY_FORM)
    } catch (error) {
      setResult({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="ktg-page">
      <header className="ktg-page-header">
        <h1>Feedback & Ratings</h1>
        <p>Share your experience so we can serve you better.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <div className="ktg-row">
          <div className="ktg-field">
            <label htmlFor="fb-fullName">Full name *</label>
            <input
              id="fb-fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              maxLength={LIMITS.fullName}
              aria-invalid={Boolean(errors.fullName)}
              autoComplete="name"
            />
            {errors.fullName && <p className="ktg-error">{errors.fullName}</p>}
          </div>

          <div className="ktg-field">
            <label htmlFor="fb-email">Email *</label>
            <input
              id="fb-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              maxLength={LIMITS.email}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
            />
            {errors.email && <p className="ktg-error">{errors.email}</p>}
          </div>
        </div>

        <fieldset className="ktg-field ktg-rating">
          <legend>Rating</legend>
          {[1, 2, 3, 4, 5].map((star) => (
            <label key={star} className="ktg-rating-option">
              <input
                type="radio"
                name="rating"
                value={star}
                checked={form.rating === String(star)}
                onChange={handleChange}
              />
              {star} ★
            </label>
          ))}
          {errors.rating && <p className="ktg-error">{errors.rating}</p>}
        </fieldset>

        <div className="ktg-field">
          <label htmlFor="fb-title">Title</label>
          <input
            id="fb-title"
            name="title"
            value={form.title}
            onChange={handleChange}
            maxLength={LIMITS.title}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title && <p className="ktg-error">{errors.title}</p>}
        </div>

        <div className="ktg-field">
          <label htmlFor="fb-content">Feedback *</label>
          <textarea
            id="fb-content"
            name="content"
            rows={5}
            value={form.content}
            onChange={handleChange}
            maxLength={LIMITS.text}
            aria-invalid={Boolean(errors.content)}
          />
          {errors.content && <p className="ktg-error">{errors.content}</p>}
        </div>

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            {result.text}
          </p>
        )}

        <button type="submit" className="ktg-button" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send feedback'}
        </button>
      </form>

      <section aria-labelledby="fb-list">
        <h2 id="fb-list">Customer Feedback</h2>
        {listError && <p className="ktg-error">{listError}</p>}
        {!listError && approved.length === 0 && <p>No feedback to display yet.</p>}
        <div className="ktg-grid">
          {approved.map((item) => (
            <article key={item.feedbackId} className="ktg-card">
              <Stars value={item.rating} />
              {item.title && <h3>{item.title}</h3>}
              <p>{item.content}</p>
              <p className="ktg-meta">— {item.fullName}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
