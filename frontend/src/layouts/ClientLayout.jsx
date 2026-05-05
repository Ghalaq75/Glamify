import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import useSidebarToggle from '../hooks/useSidebarToggle';

const NAV = [
  { path: '/client', label: 'Discover', icon: 'home' },
  { path: '/client/bookings', label: 'Bookings', icon: 'calendar' },
  { path: '/client/favourites', label: 'Favourites', icon: 'heart' },
  { path: '/client/notifications', label: 'Notifications', icon: 'bell' },
  { path: '/client/profile', label: 'Profile', icon: 'user' },
];

const PUBLIC_NAV = [
  { path: '/', label: 'Discover', icon: 'home' },
];

export function ClientLayout({ children }) {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, toggleSidebar] = useSidebarToggle();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navItems = user ? NAV : PUBLIC_NAV;

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
          {navItems.map(n => (
            <Link key={n.path} to={n.path} className={`nav-item${pathname === n.path ? ' active' : ''}`}>
              <Icon name={n.icon} size="1.05rem" /> {n.label}
            </Link>
          ))}
          <div style={{ marginTop: 'auto', padding: '0 0.5rem' }}>
            {user ? (
              <button className="nav-item btn-ghost" style={{ width: '100%', border: 'none' }} onClick={handleLogout}>
                <Icon name="doorOpen" size="1.05rem" /> Sign Out
              </button>
            ) : (
              <Link to="/login" className="nav-item">
                <Icon name="doorOpen" size="1.05rem" /> Sign In
              </Link>
            )}
          </div>
        </nav>
        <main className="content-area">
          {children}
        </main>
        <nav className="mobile-nav">
          {navItems.map(n => (
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