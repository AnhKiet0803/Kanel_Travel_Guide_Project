// Change password while signed in: enter the current password + a new password.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { changePassword } from '../api/authApi.js'
import FormField from '../components/FormField.jsx'
import { validateChangePassword } from '../utils/validators.js'
import './pages.css'

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' }

export default function ChangePasswordPage() {
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
    const found = validateChangePassword(form)
    setErrors(found)
    setResult(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await changePassword(form)
      setResult({ type: 'success', text: 'Password changed successfully.' })
      setForm(EMPTY_FORM)
    } catch (error) {
      setResult({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="ktg-page ktg-narrow">
      <header className="ktg-page-header">
        <span className="ktg-eyebrow">Security</span>
        <h1>Change Password</h1>
        <p>Update your password to keep your account secure.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="cp-current"
          name="currentPassword"
          type="password"
          label="Current password"
          placeholder="Enter current password"
          required
          value={form.currentPassword}
          onChange={handleChange}
          error={errors.currentPassword}
          autoComplete="current-password"
        />
        <FormField
          id="cp-new"
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
          id="cp-confirm"
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
          {submitting ? 'Saving...' : 'Change Password'}
        </button>

        <div className="ktg-form-footer">
          <Link to="/profile" className="ktg-link">
            ← Back to My Profile
          </Link>
        </div>
      </form>
    </section>
  )
}
