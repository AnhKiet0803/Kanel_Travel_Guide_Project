// User account registration. The BE hashes the password (BCrypt) before storing it; the FE never stores it.
// After a successful registration it calls onSuccess() so the router can go to the sign-in page.
import { useState } from 'react'
import { Link } from 'react-router-dom'
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
    <section className="ktg-page ktg-narrow-wide">
      <header className="ktg-page-header">
        <span className="ktg-eyebrow">Join Karnel Travels</span>
        <h1>Create an Account</h1>
        <p>Create an account to book tours and transport and track your orders.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <div className="ktg-row">
          <FormField
            id="reg-username"
            name="username"
            label="Username"
            placeholder="e.g. nguyen_van_a"
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
            placeholder="Your full name"
            required
            value={form.fullName}
            onChange={handleChange}
            error={errors.fullName}
            maxLength={LIMITS.fullName}
            autoComplete="name"
          />
        </div>

        <div className="ktg-row">
          <FormField
            id="reg-email"
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
            id="reg-phone"
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
          id="reg-address"
          name="address"
          label="Address"
          placeholder="Street, city, province"
          value={form.address}
          onChange={handleChange}
          error={errors.address}
          maxLength={255}
          autoComplete="street-address"
        />

        <div className="ktg-row">
          <FormField
            id="reg-password"
            name="password"
            type="password"
            label="Password"
            placeholder="Min. 8 chars, letters & digits"
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
            placeholder="Re-enter password"
            required
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
        </div>

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            <i className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} aria-hidden="true" />
            <span>{result.text}</span>
          </p>
        )}

        <button type="submit" className="ktg-button ktg-button-primary ktg-button-block" disabled={submitting}>
          {submitting ? 'Registering...' : 'Create Account'}
        </button>

        <div className="ktg-form-footer">
          <span>Already have an account?</span>
          <Link to="/login" className="ktg-link">
            Sign in
          </Link>
        </div>
      </form>
    </section>
  )
}
