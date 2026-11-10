// Reset the password using the link in the email. `token` comes from the page URL (e.g. ?token=...),
// passed in by the router: <ResetPasswordPage token={searchParams.get('token')} onSuccess={() => navigate('/login')} />
import { useState } from 'react'
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
      <main className="ktg-page ktg-narrow">
        <p className="ktg-notice ktg-error-box" role="alert">
          This password reset link is invalid or has expired. Please request a new one on the Forgot Password page.
        </p>
      </main>
    )
  }

  return (
    <main className="ktg-page ktg-narrow">
      <header className="ktg-page-header">
        <h1>Reset Password</h1>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="rp-new"
          name="newPassword"
          type="password"
          label="New password"
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
          required
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            {result.text}
          </p>
        )}

        <button type="submit" className="ktg-button" disabled={submitting}>
          {submitting ? 'Saving...' : 'Reset Password'}
        </button>
      </form>
    </main>
  )
}
