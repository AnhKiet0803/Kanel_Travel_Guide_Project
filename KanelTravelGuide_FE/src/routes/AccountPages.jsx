// Connects the account / admin pages to react-router (redirects after sign-in, URL token, route guard).
// The pages themselves stay router-agnostic; only this file knows about react-router.
import { NavLink, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import RequireAdmin from '../auth/RequireAdmin'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'

export function UserLogin() {
  const navigate = useNavigate()
  return <LoginPage onSuccess={(user) => navigate(user.role === 'Admin' ? '/admin/feedbacks' : '/', { replace: true })} />
}

export function AdminLogin() {
  const navigate = useNavigate()
  return (
    <main className="ktg-standalone-auth">
      <LoginPage variant="admin" onSuccess={() => navigate('/admin/feedbacks', { replace: true })} />
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
