// View and update the personal profile (full name, phone number, address). Email and username are read-only.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfile, updateProfile } from '../api/authApi.js'
import FormField from '../components/FormField.jsx'
import { LIMITS, validateProfile } from '../utils/validators.js'
import './pages.css'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' })
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((data) => {
        if (cancelled) return
        setProfile(data)
        setForm({ fullName: data.fullName ?? '', phone: data.phone ?? '', address: data.address ?? '' })
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message)
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
    const found = validateProfile(form)
    setErrors(found)
    setResult(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await updateProfile(form)
      setResult({ type: 'success', text: 'Profile updated.' })
    } catch (error) {
      setResult({ type: 'error', text: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <section className="ktg-page ktg-narrow-wide">
        <p className="ktg-notice ktg-error-box" role="alert">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          <span>{loadError}</span>
        </p>
      </section>
    )
  }
  if (!profile) {
    return (
      <section className="ktg-page ktg-narrow-wide">
        <p className="ktg-loading">Loading profile...</p>
      </section>
    )
  }

  return (
    <section className="ktg-page ktg-narrow-wide">
      <header className="ktg-page-header">
        <span className="ktg-eyebrow">Account Settings</span>
        <h1>My Profile</h1>
        <p>Keep your personal information up to date for smoother bookings.</p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <div className="ktg-row">
          <FormField id="pf-username" label="Username" value={profile.username ?? ''} readOnly hint="Username cannot be changed." />
          <FormField id="pf-email" label="Email" value={profile.email ?? ''} readOnly hint="Email cannot be changed." />
        </div>

        <div className="ktg-row">
          <FormField
            id="pf-fullName"
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
            id="pf-phone"
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
          id="pf-address"
          name="address"
          label="Address"
          placeholder="Street, city, province"
          value={form.address}
          onChange={handleChange}
          error={errors.address}
          maxLength={255}
          autoComplete="street-address"
        />

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            <i className={`bi ${result.type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'}`} aria-hidden="true" />
            <span>{result.text}</span>
          </p>
        )}

        <button type="submit" className="ktg-button ktg-button-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save changes'}
        </button>

        <div className="ktg-form-footer">
          <Link to="/change-password" className="ktg-link">
            Change password
          </Link>
          <Link to="/notifications" className="ktg-link">
            View notifications
          </Link>
        </div>
      </form>
    </section>
  )
}
