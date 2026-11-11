// Sign In. variant="user": customers; variant="admin": admin area (CN17).
// The admin page only accepts accounts with role 'Admin'. After a successful sign-in it calls
// onSuccess(user) so the router can redirect.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../auth/useAuth.js'
import { validateLogin } from '../utils/validators.js'
import './pages.css'

export default function LoginPage({ variant = 'user', onSuccess }) {
  const { signIn, signOut } = useAuth()
  const isAdmin = variant === 'admin'
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [failure, setFailure] = useState('')

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateLogin(form)
    setErrors(found)
    setFailure('')
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      const user = await signIn(form)
      if (isAdmin && user.role !== 'Admin') {
        await signOut()
        setFailure('This account does not have admin access.')
        return
      }
      onSuccess?.(user)
    } catch (error) {
      setFailure(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="ktg-page ktg-narrow">
      <header className="ktg-page-header">
        <span className="ktg-eyebrow">{isAdmin ? 'Admin Portal' : 'Welcome Back'}</span>
        <h1>{isAdmin ? 'Admin Sign In' : 'Sign In'}</h1>
        <p>
          {isAdmin
            ? 'Sign in with an administrator account to manage Karnel Travels.'
            : 'Sign in to book services and track your orders.'}
        </p>
      </header>

      <form className="ktg-form" onSubmit={handleSubmit} noValidate>
        <FormField
          id="login-username"
          name="username"
          label="Username"
          placeholder="Enter your username"
          required
          value={form.username}
          onChange={handleChange}
          error={errors.username}
          autoComplete="username"
        />
        <FormField
          id="login-password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          required
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />

        {!isAdmin && (
          <div className="ktg-form-meta">
            <Link to="/forgot-password" className="ktg-link">
              Forgot password?
            </Link>
          </div>
        )}

        {failure && (
          <p className="ktg-notice ktg-error-box" role="alert">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
            <span>{failure}</span>
          </p>
        )}

        <button type="submit" className="ktg-button ktg-button-primary ktg-button-block" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="ktg-form-footer">
          {isAdmin ? (
            <Link to="/" className="ktg-link">
              ← Back to Karnel Travels
            </Link>
          ) : (
            <>
              <span>New to Karnel Travels?</span>
              <Link to="/register" className="ktg-link">
                Create an account
              </Link>
            </>
          )}
        </div>
      </form>
    </section>
  )
}
