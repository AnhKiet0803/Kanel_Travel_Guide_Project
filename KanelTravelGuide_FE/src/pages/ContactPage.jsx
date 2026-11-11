// CN14: Contact Us & enquiry page.
// Guests (no sign-in needed) send an enquiry; the data is stored in the Contacts table.
import { useState } from 'react'
import { sendContact } from '../api/publicApi.js'
import FormField from '../components/FormField.jsx'
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
    <section className="ktg-page ktg-contact-wrap">
      <header className="ktg-page-header">
        <span className="ktg-eyebrow">Get In Touch</span>
        <h1>Contact Us</h1>
        <p>Need advice on tours, transport or accommodation? Leave your details and we will get back to you.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="contact-fullName"
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

        <div className="ktg-row">
          <FormField
            id="contact-email"
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
          <FormField
            id="contact-phone"
            name="phone"
            type="tel"
            label="Phone number"
            placeholder="e.g. +84 912 345 678"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            maxLength={LIMITS.phone}
            autoComplete="tel"
          />
        </div>

        <FormField
          id="contact-subject"
          name="subject"
          label="Subject"
          placeholder="What is your enquiry about?"
          value={form.subject}
          onChange={handleChange}
          error={errors.subject}
          maxLength={LIMITS.subject}
        />

        <FormField
          id="contact-message"
          name="message"
          as="textarea"
          rows={5}
          label="Message"
          placeholder="Tell us about your travel plans, dates, or questions..."
          required
          value={form.message}
          onChange={handleChange}
          error={errors.message}
          maxLength={LIMITS.text}
        />

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            <i className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} aria-hidden="true" />
            <span>{result.text}</span>
          </p>
        )}

        <button type="submit" className="ktg-button ktg-button-primary" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send request'}
        </button>
      </form>
    </section>
  )
}
