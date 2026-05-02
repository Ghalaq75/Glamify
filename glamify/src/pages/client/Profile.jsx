import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

export default function ClientProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    api.get('/client/profile').then(p => { setProfile(p); setForm({ name: p.name, phone: p.phone || '' }); }).catch(() => {}).finally(() => setLoading(false));
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

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;

  return (
    <div style={{ maxWidth: '520px' }}>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>My Profile</h1>

      <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--color-primary)' }}>
            {profile?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h3>{profile?.name}</h3>
            <p className="text-sm text-muted">{profile?.email}</p>
          </div>
        </div>
        <div className="grid-2">
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{profile?.totalBookings ?? 0}</div>
            <div className="stat-label">Total Bookings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{profile?.completedBookings ?? 0}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      <div className="card card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h4>Personal Information</h4>
          {!edit && <button className="btn btn-ghost btn-sm" onClick={() => setEdit(true)}>Edit</button>}
        </div>

        {edit ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="+966 50 000 0000" value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div><p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>FULL NAME</p><p style={{ fontWeight: 500 }}>{profile?.name}</p></div>
            <div><p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>EMAIL</p><p style={{ fontWeight: 500 }}>{profile?.email}</p></div>
            <div><p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>PHONE</p><p style={{ fontWeight: 500 }}>{profile?.phone || '—'}</p></div>
            <div><p className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>MEMBER SINCE</p><p style={{ fontWeight: 500 }}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
