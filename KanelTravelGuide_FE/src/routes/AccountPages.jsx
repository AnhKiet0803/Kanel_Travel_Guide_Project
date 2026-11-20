// Connects the account / admin pages to react-router (redirects after sign-in, URL token, route guard).
// The pages themselves stay router-agnostic; only this file knows about react-router.
import { NavLink, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import RequireAdmin from '../auth/RequireAdmin'
import { useAuth } from '../auth/useAuth.js'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'

export function UserLogin() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const bookingUrl = typeof state?.returnTo === 'string' && /^\/(?:transport\/)?booking\?/.test(state.returnTo)
    ? state.returnTo : null
  const payment = state?.tourPayment
  const bookingId = payment?.bookingId
  const paymentUrl = typeof bookingId === 'string' && /^[1-9]\d*$/.test(bookingId)
    ? '/tours/payment-return?' + new URLSearchParams({
        bookingId,
        ...(payment.cancelled ? { cancelled: '1' } : payment.resume ? { resume: '1' } : payment.approved ? { approved: '1' } : {}),
      }).toString()
    : null

  return (
    <LoginPage
      description={paymentUrl ? 'Sign in to continue payment for your existing booking.' : undefined}
      onSuccess={(user) => navigate(paymentUrl ?? bookingUrl ?? (user.role === 'Admin' ? '/admin' : '/'), { replace: true })}
    />
  )
}

export function AdminLogin() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  if (loading) return <p className="ktg-loading">Checking your sign-in...</p>
  if (user?.role === 'Admin') return <Navigate to="/admin" replace />
  return (
    <main className="ktg-standalone-auth">
      <LoginPage variant="admin" onSuccess={() => navigate('/admin', { replace: true })} />
    </main>
  )
}

export function Register() {
  const navigate = useNavigate()
  return <RegisterPage onSuccess={() => navigate('/login')} />
}

export function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  return <ResetPasswordPage token={params.get('token')} onSuccess={() => navigate('/login')} />
}

function adminLink(item, className) {
  return (
    <NavLink to={item.to} className={className} end>
      {item.label}
    </NavLink>
  )
}

export function AdminPage({ children }) {
  return (
    <RequireAdmin fallback={<Navigate to="/admin/login" replace />}>
      <AdminLayout renderLink={adminLink}>{children}</AdminLayout>
    </RequireAdmin>
  )
}
