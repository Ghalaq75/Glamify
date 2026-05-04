import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '6rem', fontFamily: 'var(--font-serif)', color: 'var(--color-primary)', lineHeight: 1 }}>404</h1>
      <h2>Page Not Found</h2>
      <p className="text-muted">The page you're looking for doesn't exist.</p>
      <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go Home</Link>
    </div>
  );
}
