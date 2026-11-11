// CN15: Feedback & Rating page.
// Guests send a star rating (1-5) and a message; feedback is only shown publicly after
// an Admin approves it (is_approved column of the Feedbacks table).
import { useEffect, useState } from 'react'
import { getApprovedFeedbacks, sendFeedback } from '../api/publicApi.js'
import FormField from '../components/FormField.jsx'
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
    <section className="ktg-page">
      <header className="ktg-page-header">
        <span className="ktg-eyebrow">Reviews &amp; Testimonials</span>
        <h1>Feedback &amp; Ratings</h1>
        <p>Share your experience so we can serve you better.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <div className="ktg-row">
          <FormField
            id="fb-fullName"
            name="fullName"
            label="Full name"
            placeholder="Your full name"
            required
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
            maxLength={LIMITS.fullName}
            autoComplete="name"
          />
          <FormField
            id="fb-email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            maxLength={LIMITS.email}
            autoComplete="email"
          />
        </div>

        <fieldset className="ktg-field ktg-rating">
          <legend>Rating</legend>
          {[1, 2, 3, 4, 5].map((star) => {
            const selected = form.rating === String(star)
            return (
              <label
                key={star}
                className={`ktg-rating-option ${selected ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={star}
                  checked={selected}
                  onChange={handleChange}
                />
                <span>{star}</span>
                <i className={`bi ${selected ? 'bi-star-fill' : 'bi-star'}`} aria-hidden="true" />
              </label>
            )
          })}
          {errors.rating && (
            <p className="ktg-error">
              <i className="bi bi-exclamation-circle" aria-hidden="true" />
              <span>{errors.rating}</span>
            </p>
          )}
        </fieldset>

        <FormField
          id="fb-title"
          name="title"
          label="Title"
          placeholder="Summarize your trip or service experience"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          maxLength={LIMITS.title}
        />

        <FormField
          id="fb-content"
          name="content"
          as="textarea"
          rows={4}
          label="Feedback"
          placeholder="Share what you loved or how we can improve..."
          required
          value={form.content}
          onChange={handleChange}
          error={errors.content}
          maxLength={LIMITS.text}
        />

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            <i className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} aria-hidden="true" />
            <span>{result.text}</span>
          </p>
        )}

        <button type="submit" className="ktg-button ktg-button-primary" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send feedback'}
        </button>
      </form>

      <section aria-labelledby="fb-list">
        <h2 id="fb-list">Customer Feedback</h2>
        {listError && <p className="ktg-error">{listError}</p>}
        {!listError && approved.length === 0 && (
          <p className="text-muted">No feedback to display yet.</p>
        )}
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
    </section>
  )
}
