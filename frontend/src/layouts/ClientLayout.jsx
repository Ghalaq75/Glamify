import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import useSidebarToggle from '../hooks/useSidebarToggle';

const NAV = [
  { path: '/client', label: 'Discover', icon: 'home' },
  { path: '/client/bookings', label: 'Bookings', icon: 'calendar' },
  { path: '/client/favourites', label: 'Favourites', icon: 'heart' },
  { path: '/client/notifications', label: 'Notifications', icon: 'bell' },
  { path: '/client/profile', label: 'Profile', icon: 'user' },
];

export function ClientLayout({ children }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, toggleSidebar] = useSidebarToggle();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="client-with-footer">
      <div className={`main-layout${collapsed ? ' sidebar-collapsed' : ''}`}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Show menu' : 'Hide menu'}
          aria-expanded={!collapsed}
        >
          <Icon name="menu" size="1.1rem" />
        </button>
        <nav className="sidebar">
          <div className="sidebar-logo">
            <span>Glamify</span>
            <p className="sidebar-logo-sub">Beauty at your Doorstep</p>
          </div>
          {NAV.map(n => (
            <Link key={n.path} to={n.path} className={`nav-item${pathname === n.path ? ' active' : ''}`}>
              <Icon name={n.icon} size="1.05rem" /> {n.label}
            </Link>
          ))}
          <div style={{ marginTop: 'auto', padding: '0 0.5rem' }}>
            <button className="nav-item btn-ghost" style={{ width: '100%', border: 'none' }} onClick={handleLogout}>
              <Icon name="doorOpen" size="1.05rem" /> Sign Out
            </button>
          </div>
        </nav>
        <main className="content-area">
          {children}
        </main>
        <nav className="mobile-nav">
          {NAV.map(n => (
            <Link key={n.path} to={n.path} className={`mobile-nav-item${pathname === n.path ? ' active' : ''}`}>
              <Icon name={n.icon} size="1.25rem" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <Footer />
    </div>
  );
}
