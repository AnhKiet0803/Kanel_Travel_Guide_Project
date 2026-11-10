// CN14: Contact Us & enquiry page.
// Guests (no sign-in needed) send an enquiry; the data is stored in the Contacts table.
import { useState } from 'react'
import { sendContact } from '../api/publicApi.js'
import { LIMITS, validateContact } from '../utils/validators.js'
import './pages.css'

const EMPTY_FORM = { fullName: '', email: '', phone: '', subject: '', message: '' }

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { type: 'success' | 'error', text }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateContact(form)
    setErrors(found)
    setResult(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await sendContact(form)
      setResult({
        type: 'success',
        text: 'Thank you! We have received your request and will get back to you as soon as possible.',
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
        <h1>Contact Us</h1>
        <p>Need advice on tours, transport or accommodation? Leave your details and we will get back to you.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <div className="ktg-field">
          <label htmlFor="contact-fullName">Full name *</label>
          <input
            id="contact-fullName"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            maxLength={LIMITS.fullName}
            aria-invalid={Boolean(errors.fullName)}
            autoComplete="name"
          />
          {errors.fullName && <p className="ktg-error">{errors.fullName}</p>}
        </div>

        <div className="ktg-row">
          <div className="ktg-field">
            <label htmlFor="contact-email">Email *</label>
            <input
              id="contact-email"
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

          <div className="ktg-field">
            <label htmlFor="contact-phone">Phone number</label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              maxLength={LIMITS.phone}
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
            />
            {errors.phone && <p className="ktg-error">{errors.phone}</p>}
          </div>
        </div>

        <div className="ktg-field">
          <label htmlFor="contact-subject">Subject</label>
          <input
            id="contact-subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            maxLength={LIMITS.subject}
            aria-invalid={Boolean(errors.subject)}
          />
          {errors.subject && <p className="ktg-error">{errors.subject}</p>}
        </div>

        <div className="ktg-field">
          <label htmlFor="contact-message">Message *</label>
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            value={form.message}
            onChange={handleChange}
            maxLength={LIMITS.text}
            aria-invalid={Boolean(errors.message)}
          />
          {errors.message && <p className="ktg-error">{errors.message}</p>}
        </div>

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            {result.text}
          </p>
        )}

        <button type="submit" className="ktg-button" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send request'}
        </button>
      </form>
    </main>
  )
}
