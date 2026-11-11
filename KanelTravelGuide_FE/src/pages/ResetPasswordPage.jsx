// Reset the password using the link in the email. `token` comes from the page URL (e.g. ?token=...),
// passed in by the router: <ResetPasswordPage token={searchParams.get('token')} onSuccess={() => navigate('/login')} />
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword } from '../api/authApi.js'
import FormField from '../components/FormField.jsx'
import { validateResetPassword } from '../utils/validators.js'
import './pages.css'

const EMPTY_FORM = { newPassword: '', confirmPassword: '' }

export default function ResetPasswordPage({ token, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateResetPassword(form)
    setErrors(found)
    setResult(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await resetPassword({ token, newPassword: form.newPassword })
      setResult({ type: 'success', text: 'Password reset successfully. You can now sign in with your new password.' })
      setForm(EMPTY_FORM)
      onSuccess?.()
    } catch (error) {
      setResult({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <section className="ktg-page ktg-narrow">
        <header className="ktg-page-header">
          <span className="ktg-eyebrow">Account Recovery</span>
          <h1>Reset Password</h1>
        </header>
        <div className="ktg-form">
          <p className="ktg-notice ktg-error-box" role="alert">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
            <span>This password reset link is invalid or has expired. Please request a new one on the Forgot Password page.</span>
          </p>
          <div className="ktg-form-footer">
            <Link to="/forgot-password" className="ktg-link">
              Request new reset link
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="ktg-page ktg-narrow">
      <header className="ktg-page-header">
        <span className="ktg-eyebrow">Account Recovery</span>
        <h1>Reset Password</h1>
        <p>Choose a strong new password for your account.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="rp-new"
          name="newPassword"
          type="password"
          label="New password"
          placeholder="Min. 8 chars, letters & digits"
          required
          value={form.newPassword}
          onChange={handleChange}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <FormField
          id="rp-confirm"
          name="confirmPassword"
          type="password"
          label="Confirm new password"
          placeholder="Re-enter new password"
          required
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            <i className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} aria-hidden="true" />
            <span>{result.text}</span>
          </p>
        )}

        <button type="submit" className="ktg-button ktg-button-primary ktg-button-block" disabled={submitting}>
          {submitting ? 'Saving...' : 'Reset Password'}
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
