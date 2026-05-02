import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/client', label: 'Discover', icon: '🏠' },
  { path: '/client/bookings', label: 'Bookings', icon: '📅' },
  { path: '/client/favourites', label: 'Favourites', icon: '❤️' },
  { path: '/client/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/client/profile', label: 'Profile', icon: '👤' },
];

export function ClientLayout({ children }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="main-layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span>Glamify</span>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Client Portal</div>
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
      <nav className="mobile-nav">
        {NAV.map(n => (
          <Link key={n.path} to={n.path} className={`mobile-nav-item${pathname === n.path ? ' active' : ''}`}>
            <span style={{ fontSize: '1.25rem' }}>{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
