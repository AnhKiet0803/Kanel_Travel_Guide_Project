// Change password while signed in: enter the current password + a new password.
import { useState } from 'react'
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
    <main className="ktg-page ktg-narrow">
      <header className="ktg-page-header">
        <h1>Change Password</h1>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="cp-current"
          name="currentPassword"
          type="password"
          label="Current password"
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
          {submitting ? 'Saving...' : 'Change Password'}
        </button>
      </form>
    </main>
  )
}
