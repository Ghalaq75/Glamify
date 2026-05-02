import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/providers', label: 'Providers', icon: '👩‍💼' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/bookings', label: 'Bookings', icon: '📅' },
  { path: '/admin/disputes', label: 'Disputes', icon: '⚖️' },
  { path: '/admin/payouts', label: 'Payouts', icon: '💳' },
  { path: '/admin/refund-requests', label: 'Refunds', icon: '↩️' },
];

export function AdminLayout({ children }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="main-layout">
      <nav className="sidebar" style={{ '--sidebar-accent': 'var(--color-admin)' }}>
        <div className="sidebar-logo">
          <span style={{ color: 'var(--color-admin)' }}>Glamify</span>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Admin Portal</div>
        </div>
        {NAV.map(n => (
          <Link key={n.path} to={n.path} className={`nav-item${pathname === n.path ? ' active' : ''}`}>
            <span>{n.icon}</span> {n.label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', padding: '0 0.5rem' }}>
          <button className="nav-item btn-ghost" style={{ width: '100%', border: 'none' }} onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </nav>
      <main className="content-area">
        {children}
      </main>
    </div>
  );
}
