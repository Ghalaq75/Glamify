import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { PasswordInput } from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../layouts/AuthLayout';
import { api } from '../../utils/api';

const ROLES = [
  { value: 'client',   label: 'Client' },
  { value: 'provider', label: 'Provider' },
  { value: 'admin',    label: 'Admin' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole]         = useState('client');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

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

      <Link to="/" style={{ position: 'fixed', top: '1.5rem', left: '1.75rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif', fontWeight: 500, zIndex: 100 }}>
        ← Back
      </Link>
      <p className="auth-eyebrow">Welcome back</p>
      <h1 className="auth-dark-heading">Sign in</h1>

      <div className="role-tabs" style={{ marginBottom: '1.75rem' }}>
        {ROLES.map(r => (
          <button key={r.value} type="button" className={`role-tab${role === r.value ? ' active' : ''}`} onClick={() => setRole(r.value)}>
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Icon name="warning" size="1rem" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label">Password</label>
            <Link to="/forgot-password" className="auth-form-link-sm">Forgot password?</Link>
          </div>
          <PasswordInput placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="auth-cta" disabled={loading}>
          <span className="auth-cta-label">
            {loading && <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.35)', borderTopColor: '#fff' }} />}
            Sign In
          </span>
        </button>
      </form>

      <p className="auth-form-footer-link" style={{ marginTop: '1.25rem' }}>
        No account? <Link to="/register">Create one</Link>
      </p>

      <p className="auth-copy">© {new Date().getFullYear()} Glamify</p>
    </AuthLayout>
  );
}