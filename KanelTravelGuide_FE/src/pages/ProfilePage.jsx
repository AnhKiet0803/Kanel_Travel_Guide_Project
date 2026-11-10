// View and update the personal profile (full name, phone number, address). Email and username are read-only.
// Only use when signed in (place it behind the router's sign-in check).
import { useEffect, useState } from 'react'
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
      <main className="ktg-page ktg-narrow">
        <p className="ktg-notice ktg-error-box" role="alert">{loadError}</p>
      </main>
    )
  }
  if (!profile) {
    return (
      <main className="ktg-page ktg-narrow">
        <p className="ktg-loading">Loading profile...</p>
      </main>
    )
  }

  return (
    <main className="ktg-page ktg-narrow">
      <header className="ktg-page-header">
        <h1>My Profile</h1>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <FormField id="pf-username" label="Username" value={profile.username ?? ''} readOnly />
        <FormField id="pf-email" label="Email" value={profile.email ?? ''} readOnly />
        <FormField
          id="pf-fullName"
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
          id="pf-phone"
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
          id="pf-address"
          name="address"
          label="Address"
          value={form.address}
          onChange={handleChange}
          error={errors.address}
          maxLength={255}
          autoComplete="street-address"
        />

        {result && (
          <p className={result.type === 'success' ? 'ktg-notice ktg-success' : 'ktg-notice ktg-error-box'} role="status">
            {result.text}
          </p>
        )}

        <button type="submit" className="ktg-button" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </main>
  )
}
