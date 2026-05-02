export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-panel auth-panel-left">
        <div className="auth-visual">
          <h1>Glamify</h1>
          <p>Riyadh's premier home-based beauty platform. Book certified professionals who come to you.</p>
          <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            {['Hair', 'Skin', 'Nails', 'Wellness', 'Lashes', 'Makeup'].map(c => (
              <span key={c} className="chip" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{c}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="auth-panel">
        {children}
      </div>
    </div>
  );
}
