import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '../../layouts/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import DistrictPicker, { IS_PLACEHOLDER_LIST } from '../../components/DistrictPicker';

const ROLES = [
  { value: 'client', label: 'Client' },
  { value: 'provider', label: 'Provider' },
];

const CATEGORIES = ['Hair', 'Skin', 'Nails', 'Wellness', 'Lashes', 'Makeup'];

const GENERAL_POLICY = [
  'Users must provide accurate and up-to-date information during registration.',
  'Glamify currently operates only in Riyadh.',
  'Users must use the platform respectfully and honestly.',
  'Glamify may suspend accounts that provide false information, misuse the platform, or behave disrespectfully.',
];

const CLIENT_POLICY = [
  'Clients must provide valid service addresses within Riyadh.',
  'Clients must make real bookings only and avoid fake or misleading bookings.',
  'Clients should cancel or reschedule through the platform when needed.',
  'Client GPS location is used only temporarily for address auto-fill or "Near me" sorting and is never stored.',
];

const PROVIDER_POLICY = [
  'Providers must provide accurate service details, prices, availability, and service area.',
  'Providers must only list services they are qualified and able to provide.',
  'Providers must set a valid service area within Riyadh.',
  'Providers must only accept bookings they can complete.',
  'Provider service-area coordinates may be stored only to support nearby provider sorting.',
  'Glamify charges providers a 10% commission on each completed service booked through the platform.',
  'The commission does not apply to cancelled or incomplete bookings.',
  "Providers must not bypass Glamify's booking or payment process to avoid commission.",
];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState('client');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', category: 'Hair', location: '' });
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [agreedToCommission, setAgreedToCommission] = useState(false);
  const [hasReadPolicy, setHasReadPolicy] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })); }

  function handleRoleChange(nextRole) {
    if (nextRole === role) return;
    setRole(nextRole);
    setHasReadPolicy(false);
    setAgreedToPolicy(false);
    setAgreedToCommission(false);
  }

  const canSubmit = agreedToPolicy && (role !== 'provider' || agreedToCommission);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agreedToPolicy) { setError("Please agree to Glamify's Registration & Use Policy to continue."); return; }
    if (role === 'provider' && !agreedToCommission) { setError('Please confirm that you understand the 10% commission to continue.'); return; }
    if (!form.name || !form.email || !form.password) { setError('Name, email and password are required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (role === 'provider') {
      if (IS_PLACEHOLDER_LIST) { setError('The Riyadh district list has not been configured yet. Please ask the team to add it before signing up as a provider.'); return; }
      if (!form.location) { setError('Please pick your district in Riyadh.'); return; }
    }
    setError('');
    setLoading(true);
    try {
      const body = { name: form.name, email: form.email, password: form.password, phone: form.phone, role };
      if (role === 'provider') { body.category = form.category; body.location = form.location; }
      const data = await api.post('/auth/register', body);
      login(data.token, data.user);
      if (role === 'provider' && data.user.approvalStatus === 'pending') navigate('/provider/onboarding');
      else if (role === 'provider') navigate('/provider');
      else navigate('/client');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div style={{ width: '100%', maxWidth: '420px', overflowY: 'auto', maxHeight: '90vh' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.875rem', fontWeight: 600 }}>Create your account</h1>
          <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>Join Glamify — Riyadh's beauty platform.</p>
        </div>

        <div className="role-tabs" style={{ marginBottom: '1.75rem' }}>
          {ROLES.map(r => (
            <button key={r.value} type="button" className={`role-tab${role === r.value ? ' active' : ''}`} onClick={() => handleRoleChange(r.value)}>
              {r.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}><span>⚠</span> {error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <input className="form-input" placeholder="+966 50 000 0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          {role === 'provider' && (
            <>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="register-district">Location in Riyadh</label>
                <DistrictPicker id="register-district" value={form.location} onChange={v => set('location', v)} required />
              </div>
            </>
          )}

          <div
            className="form-group"
            style={{
              marginTop: '0.5rem',
              padding: '1rem',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              background: 'var(--color-surface, #fafafa)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Registration & Use Policy</div>
                <p className="text-sm text-muted" style={{ margin: '0.125rem 0 0' }}>
                  Review the policy before creating your account.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.875rem' }}
                onClick={() => setPolicyModalOpen(true)}
              >
                View policy
              </button>
            </div>

            <label
              className="text-sm"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginTop: '0.875rem',
                cursor: hasReadPolicy ? 'pointer' : 'not-allowed',
                opacity: hasReadPolicy ? 1 : 0.65,
              }}
            >
              <input
                type="checkbox"
                checked={agreedToPolicy}
                disabled={!hasReadPolicy}
                onChange={e => setAgreedToPolicy(e.target.checked)}
                style={{ marginTop: '0.2rem' }}
              />
              <span>I agree to Glamify's Registration & Use Policy.</span>
            </label>
            <p className="text-sm text-muted" style={{ margin: '0.25rem 0 0', paddingLeft: '1.5rem' }}>
              {hasReadPolicy ? 'You can now agree to the policy.' : 'Please review the policy before agreeing.'}
            </p>

            {role === 'provider' && (
              <>
                <label
                  className="text-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    cursor: hasReadPolicy ? 'pointer' : 'not-allowed',
                    opacity: hasReadPolicy ? 1 : 0.65,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={agreedToCommission}
                    disabled={!hasReadPolicy}
                    onChange={e => setAgreedToCommission(e.target.checked)}
                    style={{ marginTop: '0.2rem' }}
                  />
                  <span>I understand that Glamify charges a 10% commission on each completed service.</span>
                </label>
                <p className="text-sm text-muted" style={{ margin: '0.25rem 0 0', paddingLeft: '1.5rem' }}>
                  {hasReadPolicy ? 'You can now agree to the policy.' : 'Please review the policy before agreeing.'}
                </p>
              </>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !canSubmit || (role === 'provider' && (IS_PLACEHOLDER_LIST || !form.location))} style={{ marginTop: '0.5rem' }}>
            {loading && <span className="spinner" />}
            Create Account
          </button>
        </form>

        <p className="text-sm text-center" style={{ marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>

      {policyModalOpen && (
        <PolicyModal
          role={role}
          onClose={() => setPolicyModalOpen(false)}
          onReadComplete={() => setHasReadPolicy(true)}
        />
      )}
    </AuthLayout>
  );
}

function PolicyModal({ role, onClose, onReadComplete }) {
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  const [reachedBottom, setReachedBottom] = useState(false);

  function markRead() {
    setReachedBottom(true);
    onReadComplete();
  }

  function checkAtBottom(el) {
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 8) markRead();
  }

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (root && sentinel && typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) markRead();
          }
        },
        { root, threshold: 0.01 },
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    } else if (root && root.scrollHeight - root.clientHeight <= 8) {
      markRead();
    }
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="policy-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-bg, #fff)',
          borderRadius: '0.75rem',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2
            id="policy-modal-title"
            style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}
          >
            Registration & Use Policy
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              lineHeight: 1,
              cursor: 'pointer',
              color: 'var(--color-text-muted, #666)',
              padding: '0.25rem 0.5rem',
            }}
          >
            ×
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={e => checkAtBottom(e.currentTarget)}
          style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}
        >
          <section style={{ marginBottom: '1.25rem' }}>
            <h3 className="text-sm" style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>General Policy</h3>
            <ul className="text-sm text-muted" style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6 }}>
              {GENERAL_POLICY.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          {role === 'client' && (
            <section>
              <h3 className="text-sm" style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>Client Policy</h3>
              <ul className="text-sm text-muted" style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6 }}>
                {CLIENT_POLICY.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </section>
          )}

          {role === 'provider' && (
            <section>
              <h3 className="text-sm" style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>Provider Policy</h3>
              <ul className="text-sm text-muted" style={{ paddingLeft: '1.25rem', margin: 0, lineHeight: 1.6 }}>
                {PROVIDER_POLICY.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </section>
          )}

          <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface, #fafafa)',
          }}
        >
          <span className="text-sm text-muted">
            {reachedBottom ? '✓ You can now agree to the policy.' : 'Scroll to the bottom to continue.'}
          </span>
          <button type="button" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
