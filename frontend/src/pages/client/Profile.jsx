import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [edit, setEdit]       = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    api.get('/client/profile')
      .then(p => { setProfile(p); setForm({ name: p.name, phone: p.phone || '' }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.patch('/client/profile', form);
      setProfile(updated);
      setEdit(false);
      success('Profile Updated', 'Your profile has been saved.');
    } catch (err) {
      toastError('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  const initial = profile?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="section-band-header">
        <span className="kicker">Your account</span>
        <h2 style={{ fontFamily: 'var(--font-serif)' }}>My Profile</h2>
      </div>

      <div className="profile-hero">
        <div className="profile-avatar">{initial}</div>
        <div className="profile-hero-info">
          <p className="profile-hero-name">{profile?.name}</p>
          <p className="profile-hero-email">{profile?.email}</p>
          <span className="profile-hero-badge">Glamify Member</span>
        </div>
        <div className="profile-hero-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{profile?.totalBookings ?? 0}</span>
            <span className="profile-stat-label">Bookings</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{profile?.completedBookings ?? 0}</span>
            <span className="profile-stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-section-header">
          <div>
            <p className="kicker">About you</p>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', marginTop: '0.2rem' }}>Personal Information</h4>
          </div>
          {!edit && (
            <button className="btn btn-ghost btn-sm" onClick={() => setEdit(true)}>Edit</button>
          )}
        </div>

        {edit ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                placeholder="+966 50 000 0000"
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEdit(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving && <span className="spinner" />}
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <dl className="profile-fields">
            {[
              { label: 'Full Name',     value: profile?.name },
              { label: 'Email',         value: profile?.email },
              { label: 'Phone',         value: profile?.phone || '—' },
              { label: 'Member Since',  value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="profile-field">
                <dt className="profile-field-label">{label}</dt>
                <dd className="profile-field-value">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
