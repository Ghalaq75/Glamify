import bgPhoto from '../assets/auth_bg_spa.jpg';

export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-bg" style={{ backgroundImage: `url(${bgPhoto})` }} />
      <div className="auth-vignette" />
      <div className="auth-shell">
        <div className="auth-logomark">
          <span className="auth-logo-wordmark">Glamify</span>
          <div className="auth-logo-rule" />
          <p className="auth-logo-sub">Beauty at your Doorstep</p>
        </div>
        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
}
