// Forgot password: enter an email and the BE sends a message with a password-reset link (see ResetPasswordPage).
// Always reply "if this email is registered..." so we never reveal which emails have an account.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/authApi.js'
import FormField from '../components/FormField.jsx'
import { LIMITS, validateForgotPassword } from '../utils/validators.js'
import './pages.css'

export default function ForgotPasswordPage() {
  const [form, setForm] = useState({ email: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateForgotPassword(form)
    setErrors(found)
    setResult(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await forgotPassword(form)
      setResult({
        type: 'success',
        text: 'If this email is registered, we have sent instructions to reset your password. Please check your inbox.',
      })
      setForm({ email: '' })
    } catch (error) {
      setResult({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="ktg-page ktg-narrow">
      <header className="ktg-page-header">
        <span className="ktg-eyebrow">Account Recovery</span>
        <h1>Forgot Password</h1>
        <p>Enter your registered email and we will send you a link to reset your password.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="fp-email"
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={(event) => {
            setForm({ email: event.target.value })
            if (errors.email) setErrors({})
          }}
          error={errors.email}
          maxLength={LIMITS.email}
          autoComplete="email"
        />

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            <i className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} aria-hidden="true" />
            <span>{result.text}</span>
          </p>
        )}

        <button type="submit" className="ktg-button ktg-button-primary ktg-button-block" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send reset link'}
        </button>

        <div className="ktg-form-footer">
          <Link to="/login" className="ktg-link">
            ← Back to Sign In
          </Link>
        </div>
      </form>
    </section>
  )
}
