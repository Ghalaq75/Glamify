import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { api } from '../../utils/api';
import { PasswordInput } from '../../components/PasswordInput';
import Icon from '../../components/Icon';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!token) { setError('Invalid reset link'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 600 }}>Set a new password</h1>
          <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>Enter your new password below.</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="warning" size="1rem" /> {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <PasswordInput placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <PasswordInput placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading && <span className="spinner" />}
            Reset Password
          </button>
        </form>

        <p className="text-sm text-center" style={{ marginTop: '1.5rem' }}>
          <Link to="/login" style={{ color: 'var(--color-primary)' }}>Back to Sign In</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
