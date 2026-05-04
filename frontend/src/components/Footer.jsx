import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">
        <div className="site-footer-cols">
          <div className="site-footer-brand">
            <h3>Glamify</h3>
            <p>Riyadh's editorial home-beauty atelier — certified artists who come to you, with the calm of a private salon.</p>
          </div>

          <div className="site-footer-col">
            <h4>Menu</h4>
            <ul>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/client">Discover</Link></li>
              <li><Link to="/client/bookings">My Bookings</Link></li>
            </ul>
          </div>

          <div className="site-footer-col">
            <h4>Service</h4>
            <ul>
              <li><Link to="/client?category=Hair">Hair</Link></li>
              <li><Link to="/client?category=Skin">Skin</Link></li>
              <li><Link to="/client?category=Nails">Nails</Link></li>
              <li><Link to="/client?category=Wellness">Wellness</Link></li>
              <li><Link to="/client?category=Makeup">Makeup</Link></li>
            </ul>
          </div>

          <div className="site-footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:support@glamify.sa">support@glamify.sa</a></li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          <span>© {year} Glamify. All rights reserved.</span>
          <div className="site-footer-bottom-links">
            <span aria-disabled="true">Terms of Use</span>
            <span aria-disabled="true">Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
