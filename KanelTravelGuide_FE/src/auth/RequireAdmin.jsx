// Guards the admin area: only accounts with role 'Admin' see the content (spec section 8).
// Router-agnostic: when blocked it renders `fallback`.
// Example with react-router:
//   <RequireAdmin fallback={<Navigate to="/admin/login" replace />}> ...admin page... </RequireAdmin>
import { useAuth } from './useAuth.js'

export default function RequireAdmin({ children, fallback = null }) {
  const { user, loading } = useAuth()

  if (loading) return <p className="ktg-loading">Checking your sign-in...</p>
  if (!user || user.role !== 'Admin') return fallback
  return children
}
