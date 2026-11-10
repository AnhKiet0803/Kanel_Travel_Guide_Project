// User account registration. The BE hashes the password (BCrypt) before storing it; the FE never stores it.
// After a successful registration it calls onSuccess() so the router can go to the sign-in page.
import { useState } from 'react'
import { register } from '../api/authApi.js'
import FormField from '../components/FormField.jsx'
import { LIMITS, validateRegister } from '../utils/validators.js'
import './pages.css'

const EMPTY_FORM = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
}

export default function RegisterPage({ onSuccess }) {
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
    const found = validateRegister(form)
    setErrors(found)
    setResult(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await register(form)
      setResult({ type: 'success', text: 'Registration successful! You can sign in now.' })
      setForm(EMPTY_FORM)
      onSuccess?.()
    } catch (error) {
      setResult({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="ktg-page ktg-narrow">
      <header className="ktg-page-header">
        <h1>Create an Account</h1>
        <p>Create an account to book tours and transport and track your orders.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="reg-username"
          name="username"
          label="Username"
          required
          value={form.username}
          onChange={handleChange}
          error={errors.username}
          maxLength={50}
          autoComplete="username"
        />
        <FormField
          id="reg-fullName"
          name="fullName"
          label="Full name"
          required
          value={form.fullName}
          onChange={handleChange}
          error={errors.fullName}
          maxLength={LIMITS.fullName}
          autoComplete="name"
        />
        <FormField
          id="reg-email"
          name="email"
          type="email"
          label="Email"
          required
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          maxLength={LIMITS.email}
          autoComplete="email"
        />
        <FormField
          id="reg-phone"
          name="phone"
          type="tel"
          label="Phone number"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          maxLength={LIMITS.phone}
          autoComplete="tel"
        />
        <FormField
          id="reg-address"
          name="address"
          label="Address"
          value={form.address}
          onChange={handleChange}
          error={errors.address}
          maxLength={255}
          autoComplete="street-address"
        />
        <FormField
          id="reg-password"
          name="password"
          type="password"
          label="Password"
          required
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="new-password"
        />
        <FormField
          id="reg-confirm"
          name="confirmPassword"
          type="password"
          label="Confirm password"
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
          {submitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </main>
  )
}
