import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

const ROLES = [
  { value: 'client', label: 'Client' },
  { value: 'provider', label: 'Provider' },
  { value: 'admin', label: 'Admin' },
];

const DEMO = { client: 'client@glamify.sa', provider: 'provider@glamify.sa', admin: 'admin@glamify.sa' };

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState('client');
  const [email, setEmail] = useState('client@glamify.sa');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleRoleChange(r) {
    setRole(r);
    setEmail(DEMO[r]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password, role });
      login(data.token, data.user);
      if (role === 'client') navigate('/client');
      else if (role === 'provider') navigate('/provider');
      else navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 600 }}>Glamify</span>
            <span style={{ width: 1, height: 16, background: 'var(--color-border)' }} />
            <span className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Beauty Platform</span>
          </div>
          <p className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>Welcome Back</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 600 }}>Sign in to your account</h1>
          <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>The premier beauty destination in Riyadh.</p>
        </div>

        <div className="role-tabs" style={{ marginBottom: '1.75rem' }}>
          {ROLES.map(r => (
            <button key={r.value} type="button" className={`role-tab${role === r.value ? ' active' : ''}`} onClick={() => handleRoleChange(r.value)}>
              {r.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}><span>⚠</span> {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary">Forgot password?</Link>
            </div>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading && <span className="spinner" />}
            Sign In
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span className="text-xs text-muted">or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        <p className="text-sm text-center">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Register here</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
