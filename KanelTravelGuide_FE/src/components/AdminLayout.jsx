// Admin page frame: a sidebar with the Admin feature menu + the content area.
// Independent of any router library: menu items default to <a> tags. Now that the router exists (Huyền), pass
// renderLink to use <Link>/<NavLink>, for example:
//   <AdminLayout renderLink={(item, className) => <NavLink to={item.to} className={className}>{item.label}</NavLink>}>
// Place it inside <RequireAdmin> so only Admins can get in.
import { useAuth } from '../auth/useAuth.js'
import { ADMIN_MENU } from './adminMenu.js'
import './admin.css'

function defaultRenderLink(item, className) {
  return (
    <a href={item.to} className={className}>
      {item.label}
    </a>
  )
}

export default function AdminLayout({ children, menu = ADMIN_MENU, renderLink = defaultRenderLink }) {
  const { user, signOut } = useAuth()

  return (
    <div className="ktg-admin">
      <aside className="ktg-admin-sidebar">
        <p className="ktg-admin-brand">Karnel Admin</p>
        <nav aria-label="Admin menu">
          <ul>
            {menu.map((item) => (
              <li key={item.to}>{renderLink(item, 'ktg-admin-link')}</li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="ktg-admin-main">
        <header className="ktg-admin-topbar">
          <span>{user?.fullName ?? user?.username}</span>
          <button type="button" className="ktg-button ktg-button-small" onClick={signOut}>
            Sign Out
          </button>
        </header>
        <section className="ktg-admin-content">{children}</section>
      </div>
    </div>
  )
}
