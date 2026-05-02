import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { api } from '../../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (data && data.resetLink) setResetLink(data.resetLink);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 600 }}>Reset your password</h1>
          <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>Enter your email and we'll send a reset link.</p>
        </div>

        {sent ? (
          <div>
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>✓ Reset link generated.</div>
            {resetLink && (
              <div style={{ marginBottom: '1rem' }}>
                <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Your reset link (demo mode):</p>
                <a href={resetLink} style={{ color: 'var(--color-primary)', fontSize: '0.8rem', wordBreak: 'break-all' }}>{resetLink}</a>
              </div>
            )}
            <Link to="/login" className="btn btn-primary btn-full">Back to Sign In</Link>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}><span>⚠</span> {error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading && <span className="spinner" />}
                Send Reset Link
              </button>
            </form>
            <p className="text-sm text-center" style={{ marginTop: '1.5rem' }}>
              <Link to="/login" style={{ color: 'var(--color-primary)' }}>Back to Sign In</Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
