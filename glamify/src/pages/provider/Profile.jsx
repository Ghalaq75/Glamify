import { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import ProviderLogo from '../../components/ProviderLogo';
import DistrictPicker, { IS_PLACEHOLDER_LIST } from '../../components/DistrictPicker';
import { getDistrictById } from '@workspace/riyadh-districts';

const CATEGORIES = ['Hair', 'Skin', 'Nails', 'Wellness', 'Lashes', 'Makeup'];
const SPECIALTIES_OPTIONS = ['Hair Treatment', 'Keratin', 'Blowout', 'Coloring', 'Facial', 'Massage', 'Waxing', 'Nail Art', 'Gel Nails', 'Lash Extensions', 'Makeup Artist', 'Bridal Makeup'];

export default function ProviderProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('info');
  const { success, error: toastError } = useToast();

  useEffect(() => {
    api.get('/provider/profile').then(p => { setProfile(p); setForm({ name: p.name, phone: p.phone, bio: p.bio, category: p.category, location: p.location, yearsActive: p.yearsActive, specialties: p.specialties || [] }); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })); }

  const savedLocation = profile?.location || '';
  const savedDistrict = useMemo(() => getDistrictById(savedLocation), [savedLocation]);
  const isLegacyLocation = !!savedLocation && !savedDistrict;
  const formLocationValid = !!getDistrictById(form.location || '');
  const locationChanged = (form.location || '') !== savedLocation;
  const blockSave = IS_PLACEHOLDER_LIST || (isLegacyLocation && !formLocationValid) || (locationChanged && !formLocationValid);

  function toggleSpecialty(s) {
    setForm(prev => ({ ...prev, specialties: prev.specialties.includes(s) ? prev.specialties.filter(x => x !== s) : [...prev.specialties, s] }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (IS_PLACEHOLDER_LIST) { toastError('Setup required', 'The Riyadh district list has not been configured yet.'); return; }
    if (isLegacyLocation && !formLocationValid) { toastError('Pick a district', 'Please pick an approved Riyadh district before saving.'); return; }
    if (locationChanged && !formLocationValid) { toastError('Pick a district', 'Location must be one of the approved Riyadh districts.'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!locationChanged) delete payload.location;
      const updated = await api.patch('/provider/profile', payload);
      setProfile(updated);
      success('Saved', 'Profile updated.');
    } catch (err) {
      toastError('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>My Profile</h1>

      <div className="card card-body" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <ProviderLogo name={profile?.name} category={profile?.category} logoUrl={profile?.logoUrl} size="lg" />
        <div>
          <h3>{profile?.name}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span className="badge badge-primary">{profile?.category}</span>
            <span className={`badge ${profile?.approvalStatus === 'approved' ? 'badge-success' : profile?.approvalStatus === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
              {profile?.approvalStatus === 'approved' ? '✓ Approved' : profile?.approvalStatus}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.875rem' }}>
            <div><span style={{ fontWeight: 700 }}>{profile?.averageRating?.toFixed(1)}</span> <span className="text-xs text-muted">rating</span></div>
            <div><span style={{ fontWeight: 700 }}>{profile?.totalReviews}</span> <span className="text-xs text-muted">reviews</span></div>
            <div><span style={{ fontWeight: 700 }}>{profile?.totalCompleted}</span> <span className="text-xs text-muted">completed</span></div>
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>Info</button>
        <button className={`tab-btn${tab === 'specialties' ? ' active' : ''}`} onClick={() => setTab('specialties')}>Specialties</button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {tab === 'info' && (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name || ''} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+966..." value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input form-select" value={form.category || ''} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Years Active</label>
                <input className="form-input" type="number" min={0} value={form.yearsActive || 0} onChange={e => set('yearsActive', Number(e.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-district">Location</label>
              {isLegacyLocation && (
                <div
                  style={{
                    marginBottom: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    background: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8125rem',
                    color: '#78350f',
                  }}
                >
                  <strong>Current legacy location:</strong> {savedLocation}
                  <div style={{ marginTop: '0.25rem' }}>
                    Please pick an approved Riyadh district from the list before saving.
                  </div>
                </div>
              )}
              <DistrictPicker
                id="profile-district"
                value={formLocationValid ? form.location : ''}
                onChange={v => set('location', v)}
                placeholder={isLegacyLocation ? 'Pick an approved district…' : 'Search Riyadh districts…'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input form-textarea" rows={4} placeholder="Tell clients about yourself…" value={form.bio || ''} onChange={e => set('bio', e.target.value)} />
            </div>
          </>
        )}

        {tab === 'specialties' && (
          <div>
            <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>Select your specialties to appear in search results.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SPECIALTIES_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)} className={`btn btn-sm ${(form.specialties || []).includes(s) ? 'btn-primary' : 'btn-ghost'}`}>{s}</button>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={saving || blockSave} style={{ marginTop: '0.5rem' }}>
          {saving && <span className="spinner" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
