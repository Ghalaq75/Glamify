import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DistrictPicker, { IS_PLACEHOLDER_LIST } from '../../components/DistrictPicker';
import Icon from '../../components/Icon';
import { MultiSelectChips } from '../../components/MultiSelectChips';
import { PasswordInput } from '../../components/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from '../../layouts/AuthLayout';
import { api } from '../../utils/api';
import {
  checkPasswordStrength,
  isStrongPassword,
  isValidEmail,
  isValidSaudiPhone,
  normalizeSaudiPhone
} from '../../utils/validators';

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
  'Client GPS location is used only for address auto-fill and "Near me" sorting. It is kept in your browser\'s session storage for this browser session and cleared when the session ends; it is not sent to or stored on Glamify\'s servers.',
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
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', categories: ['Hair'], location: '' });
  const [touched, setTouched] = useState({});
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [agreedToCommission, setAgreedToCommission] = useState(false);
  const [hasReadPolicy, setHasReadPolicy] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [step, setStep] = useState('form');
  const [verification, setVerification] = useState(null);

  function set(field, value) { setForm(prev => ({ ...prev, [field]: value })); }
  function markTouched(field) { setTouched(prev => ({ ...prev, [field]: true })); }

  function handleRoleChange(nextRole) {
    if (nextRole === role) return;
    setRole(nextRole);
    setHasReadPolicy(false);
    setAgreedToPolicy(false);
    setAgreedToCommission(false);
  }

  const passwordChecks = useMemo(() => checkPasswordStrength(form.password), [form.password]);
  const passwordsMatch = form.password.length > 0 && form.password === form.confirmPassword;
  const emailOk = isValidEmail(form.email);
  const phoneOk = !form.phone || isValidSaudiPhone(form.phone);
  const passwordOk = isStrongPassword(form.password);

  const fieldErrors = {
    name: touched.name && !form.name.trim() ? 'Name is required.' : '',
    email: touched.email && !emailOk ? 'Please enter a valid email address.' : '',
    password: touched.password && !passwordOk ? 'Password does not meet all requirements.' : '',
    confirmPassword: touched.confirmPassword && form.confirmPassword && !passwordsMatch ? 'Passwords do not match.' : '',
    phone: touched.phone && !phoneOk ? 'Use a Saudi number like +9665XXXXXXXX or 05XXXXXXXX.' : '',
  };

  const formValid =
    form.name.trim() &&
    emailOk &&
    passwordOk &&
    passwordsMatch &&
    phoneOk &&
    agreedToPolicy &&
    (role !== 'provider' || (agreedToCommission && !IS_PLACEHOLDER_LIST && !!form.location && Array.isArray(form.categories) && form.categories.length > 0));

  async function handleStartVerification(e) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true, phone: true });
    if (!formValid) {
      setError('Please fix the highlighted fields before continuing.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone ? normalizeSaudiPhone(form.phone) : '',
        role,
      };
      if (role === 'provider') { body.categories = form.categories; body.location = form.location; }
      const data = await api.post('/auth/verify/start', body);
      setVerification({
        email: data.email,
        verificationId: data.verificationId,
        resendCooldown: data.resendCooldownSeconds || 30,
        cooldownRemaining: data.resendCooldownSeconds || 30,
        expiresIn: data.expiresInSeconds || 600,
        delivered: Boolean(data.delivered),
        devCode: data.devCode || '',
        devNote: data.devNote || '',
        code: '',
        attemptError: '',
      });
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Could not start verification.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (!verification) return;
    if (!/^\d{6}$/.test(verification.code.trim())) {
      setVerification(v => ({ ...v, attemptError: 'Enter the 6-digit code from your email.' }));
      return;
    }
    setLoading(true);
    setVerification(v => ({ ...v, attemptError: '' }));
    try {
      const data = await api.post('/auth/verify/complete', { email: verification.email, code: verification.code.trim() });
      login(data.token, data.user);
      if (role === 'provider' && data.user.approvalStatus === 'pending') navigate('/provider/onboarding');
      else if (role === 'provider') navigate('/provider');
      else navigate('/client');
    } catch (err) {
      setVerification(v => ({ ...v, attemptError: err.message || 'Verification failed.' }));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (!verification || verification.cooldownRemaining > 0) return;
    setLoading(true);
    setVerification(v => ({ ...v, attemptError: '' }));
    try {
      const data = await api.post('/auth/verify/resend', { email: verification.email });
      setVerification(v => ({
        ...v,
        cooldownRemaining: data.resendCooldownSeconds || 30,
        expiresIn: data.expiresInSeconds || 600,
        delivered: Boolean(data.delivered),
        devCode: data.devCode || '',
        devNote: data.devNote || '',
        code: '',
        attemptError: '',
      }));
    } catch (err) {
      setVerification(v => ({ ...v, attemptError: err.message || 'Could not resend code.' }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (step !== 'verify' || !verification || verification.cooldownRemaining <= 0) return;
    const t = setInterval(() => {
      setVerification(v => v ? { ...v, cooldownRemaining: Math.max(0, v.cooldownRemaining - 1) } : v);
    }, 1000);
    return () => clearInterval(t);
  }, [step, verification && verification.cooldownRemaining > 0]);

  if (step === 'verify' && verification) {
    return (
      <AuthLayout>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h1 className="auth-form-heading">Verify email</h1>
          <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
            We sent a 6-digit code to <strong>{verification.email}</strong>.
          </p>

          {verification.devCode && (
            <div className="alert" style={{ marginBottom: '1rem', background: '#fef3c7', border: '1px solid #f59e0b', padding: '0.75rem', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Development mode</div>
              <p className="text-sm" style={{ margin: '0.25rem 0 0' }}>
                {verification.devNote || 'Email is not configured.'} Your code is: <strong style={{ letterSpacing: '4px' }}>{verification.devCode}</strong>
              </p>
            </div>
          )}

          {verification.attemptError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="warning" size="1rem" /> {verification.attemptError}</div>
          )}

          <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Verification code</label>
              <input
                className="form-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={verification.code}
                onChange={e => setVerification(v => ({ ...v, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                style={{ letterSpacing: '8px', fontSize: '1.25rem', textAlign: 'center', fontWeight: 600 }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading || verification.code.length !== 6}>
              {loading && <span className="spinner" />}
              Verify & create account
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={loading || verification.cooldownRemaining > 0}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: verification.cooldownRemaining > 0 ? 'var(--color-text-muted, #888)' : 'var(--color-primary)',
                cursor: verification.cooldownRemaining > 0 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {verification.cooldownRemaining > 0 ? `Resend in ${verification.cooldownRemaining}s` : 'Resend code'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('form'); setVerification(null); }}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text-muted, #666)', cursor: 'pointer' }}
            >
              ← Edit details
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Link to="/" style={{ position: 'fixed', top: '1.5rem', left: '1.75rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif', fontWeight: 500, zIndex: 100 }}>
        ← Back
      </Link>
      <div style={{ width: '100%', maxWidth: '420px', overflowY: 'auto', maxHeight: '90vh' }}>
        <h1 className="auth-form-heading">Create account</h1>

        <div className="role-tabs" style={{ marginBottom: '1.75rem' }}>
          {ROLES.map(r => (
            <button key={r.value} type="button" className={`role-tab${role === r.value ? ' active' : ''}`} onClick={() => handleRoleChange(r.value)}>
              {r.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="warning" size="1rem" /> {error}</div>}

        <form onSubmit={handleStartVerification} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              placeholder="Your name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onBlur={() => markTouched('name')}
            />
            {fieldErrors.name && <div className="text-sm" style={{ color: '#dc2626', marginTop: '0.25rem' }}>{fieldErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              onBlur={() => markTouched('email')}
            />
            {fieldErrors.email && <div className="text-sm" style={{ color: '#dc2626', marginTop: '0.25rem' }}>{fieldErrors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <PasswordInput
              placeholder="Create a strong password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              onBlur={() => markTouched('password')}
            />
            <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {passwordChecks.map(c => (
                <li key={c.id} className="text-sm" style={{ color: c.ok ? '#16a34a' : 'var(--color-text-muted, #666)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span aria-hidden="true" style={{ display: 'inline-flex' }}><Icon name={c.ok ? 'check' : 'x'} size="0.85rem" /></span>
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>
            {fieldErrors.password && <div className="text-sm" style={{ color: '#dc2626', marginTop: '0.25rem' }}>{fieldErrors.password}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <PasswordInput
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              onBlur={() => markTouched('confirmPassword')}
            />
            {fieldErrors.confirmPassword && <div className="text-sm" style={{ color: '#dc2626', marginTop: '0.25rem' }}>{fieldErrors.confirmPassword}</div>}
            {form.confirmPassword && passwordsMatch && (
              <div className="text-sm" style={{ color: '#16a34a', marginTop: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Icon name="check" size="0.9rem" /> Passwords match</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Phone (optional)</label>
            <input
              className="form-input"
              placeholder="+9665XXXXXXXX or 05XXXXXXXX"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              onBlur={() => markTouched('phone')}
            />
            {fieldErrors.phone && <div className="text-sm" style={{ color: '#dc2626', marginTop: '0.25rem' }}>{fieldErrors.phone}</div>}
          </div>

          {role === 'provider' && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="register-categories">Categories</label>
                <MultiSelectChips
                  id="register-categories"
                  options={CATEGORIES}
                  value={form.categories}
                  onChange={v => set('categories', v)}
                  placeholder="Pick one or more categories…"
                />
                {form.categories.length === 0 && (
                  <div className="text-sm" style={{ color: '#dc2626', marginTop: '0.25rem' }}>Please select at least one category.</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="register-district">Location in Riyadh</label>
                <DistrictPicker id="register-district" value={form.location} onChange={v => set('location', v)} required />
              </div>
            </>
          )}

          <div
            className="form-group"
            style={{ marginTop: '0.5rem' }}
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
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.6rem',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 500,
                  background: 'rgba(44,26,10,0.06)',
                  color: 'rgba(44,26,10,0.55)',
                  border: '1px solid rgba(170,150,120,0.3)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(44,26,10,0.11)'; e.currentTarget.style.color = '#2C1A0A'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(44,26,10,0.06)'; e.currentTarget.style.color = 'rgba(44,26,10,0.55)'; }}
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

          <button type="submit" className="btn btn-primary btn-full" disabled={loading || !formValid} style={{ marginTop: '0.5rem', background: '#72755F', borderColor: '#72755F' }}>
            {loading && <span className="spinner" />}
            Send verification code
          </button>
        </form>

        <p className="text-sm text-center" style={{ marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#72755F', fontWeight: 600 }}>Sign in</Link>
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
          background: 'var(--color-bg, #FCF8EF)',
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
              color: 'var(--color-text-muted, #7B6A5C)',
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
            background: 'var(--color-surface, #FCF8EF)',
          }}
        >
          <span className="text-sm text-muted">
            {reachedBottom ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Icon name="check" size="0.9rem" /> You can now agree to the policy.</span> : 'Scroll to the bottom to continue.'}
          </span>
          <button type="button" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
