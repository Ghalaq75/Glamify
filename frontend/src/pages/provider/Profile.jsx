import { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import ProviderLogo from '../../components/ProviderLogo';
import DistrictPicker, { IS_PLACEHOLDER_LIST } from '../../components/DistrictPicker';
import { getDistrictById } from '@workspace/riyadh-districts';
import { MultiSelectChips } from '../../components/MultiSelectChips';
import { getCurrentPosition, isWithinRiyadh, GeolocationError } from '../../utils/geolocation';
import Icon from '../../components/Icon';

const CATEGORIES = ['Hair', 'Skin', 'Nails', 'Wellness', 'Lashes', 'Makeup'];
const SPECIALTIES_OPTIONS = ['Hair Treatment', 'Keratin', 'Blowout', 'Coloring', 'Facial', 'Massage', 'Waxing', 'Nail Art', 'Gel Nails', 'Lash Extensions', 'Makeup Artist', 'Bridal Makeup'];

const APPROVAL_COLOR = { approved: '#7A8C6A', rejected: '#B05C5C', pending: '#B8956A' };

export default function ProviderProfile() {
  const [profile, setProfile]   = useState(null);
  const [form, setForm]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [tab, setTab]           = useState('info');
  const [locating, setLocating] = useState(false);
  const { success, error: toastError } = useToast();

  async function useMyLocation() {
    setLocating(true);
    try {
      const c = await getCurrentPosition();
      if (!isWithinRiyadh(c.lat, c.lng)) {
        toastError('Outside Riyadh', 'Provider service area must be within Riyadh.');
        return;
      }
      set('latitude', c.lat);
      set('longitude', c.lng);
      success('Coordinates set', 'Tap "Save Changes" to keep them.');
    } catch (err) {
      const msg = err instanceof GeolocationError ? err.message : 'Could not get your location.';
      toastError('Location unavailable', msg);
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    api.get('/provider/profile').then(p => {
      setProfile(p);
      const initialCategories = Array.isArray(p.categories) && p.categories.length
        ? p.categories
        : (p.category ? [p.category] : []);
      setForm({
        name: p.name, phone: p.phone, bio: p.bio,
        categories: initialCategories, location: p.location,
        yearsActive: p.yearsActive, specialties: p.specialties || [],
        latitude: typeof p.latitude === 'number' ? p.latitude : null,
        longitude: typeof p.longitude === 'number' ? p.longitude : null,
        coverageRadiusKm: typeof p.coverageRadiusKm === 'number' ? p.coverageRadiusKm : 10,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })); }

  const savedLocation    = profile?.location || '';
  const savedDistrict    = useMemo(() => getDistrictById(savedLocation), [savedLocation]);
  const isLegacyLocation = !!savedLocation && !savedDistrict;
  const formLocationValid = !!getDistrictById(form.location || '');
  const locationChanged  = (form.location || '') !== savedLocation;
  const blockSave = IS_PLACEHOLDER_LIST || (isLegacyLocation && !formLocationValid) || (locationChanged && !formLocationValid);

  function toggleSpecialty(s) {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(s)
        ? prev.specialties.filter(x => x !== s)
        : [...prev.specialties, s],
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (IS_PLACEHOLDER_LIST) { toastError('Setup required', 'The Riyadh district list has not been configured yet.'); return; }
    if (isLegacyLocation && !formLocationValid) { toastError('Pick a district', 'Please pick an approved Riyadh district before saving.'); return; }
    if (locationChanged && !formLocationValid) { toastError('Pick a district', 'Location must be one of the approved Riyadh districts.'); return; }
    if (!Array.isArray(form.categories) || form.categories.length === 0) { toastError('Pick a category', 'Please select at least one category.'); return; }
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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  const approvalStatus = profile?.approvalStatus || 'pending';
  const displayCategories = (profile?.categories?.length ? profile.categories : profile?.category ? [profile.category] : []);

  return (
    <div style={{ maxWidth: 620 }}>
      <div className="section-band-header">
        <span className="kicker">Your business</span>
        <h2 style={{ fontFamily: 'var(--font-serif)' }}>My Profile</h2>
      </div>

      <div className="profile-hero" style={{ alignItems: 'flex-start', gap: '1.5rem' }}>
        <ProviderLogo name={profile?.name} category={profile?.category} logoUrl={profile?.logoUrl} size="lg" />
        <div className="profile-hero-info" style={{ flex: 1 }}>
          <p className="profile-hero-name">{profile?.name}</p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
            {displayCategories.map(c => (
              <span key={c} className="profile-hero-badge">{c}</span>
            ))}
            <span
              className="profile-hero-badge"
              style={{
                color: APPROVAL_COLOR[approvalStatus],
                borderColor: APPROVAL_COLOR[approvalStatus],
              }}
            >
              {approvalStatus === 'approved' && <Icon name="check" size="0.75rem" />}
              {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
            </span>
          </div>
        </div>
        <div className="profile-hero-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{profile?.averageRating?.toFixed(1) ?? '—'}</span>
            <span className="profile-stat-label">Rating</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{profile?.totalReviews ?? 0}</span>
            <span className="profile-stat-label">Reviews</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span className="profile-stat-value">{profile?.totalCompleted ?? 0}</span>
            <span className="profile-stat-label">Done</span>
          </div>
        </div>
      </div>

      <div className="booking-tabs">
        <button className={`booking-tab-btn${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>
          Info
        </button>
        <button className={`booking-tab-btn${tab === 'specialties' ? ' active' : ''}`} onClick={() => setTab('specialties')}>
          Specialties
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {tab === 'info' && (
          <>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name || ''} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+966…" value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Categories</label>
                <MultiSelectChips
                  options={CATEGORIES}
                  value={form.categories || []}
                  onChange={v => set('categories', v)}
                  placeholder="Pick one or more…"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Years Active</label>
                <input className="form-input" type="number" min={0} value={form.yearsActive || 0} onChange={e => set('yearsActive', Number(e.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              {isLegacyLocation && (
                <div style={{ marginBottom: '0.5rem', padding: '0.625rem 0.75rem', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning)', fontSize: '0.8125rem', color: 'var(--color-warning)' }}>
                  <strong>Current legacy location:</strong> {savedLocation}
                  <div style={{ marginTop: '0.25rem' }}>Please pick an approved Riyadh district from the list before saving.</div>
                </div>
              )}
              <DistrictPicker
                value={formLocationValid ? form.location : ''}
                onChange={v => set('location', v)}
                placeholder={isLegacyLocation ? 'Pick an approved district…' : 'Search Riyadh districts…'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-input form-textarea" rows={4} placeholder="Tell clients about yourself…" value={form.bio || ''} onChange={e => set('bio', e.target.value)} />
            </div>

            <div className="profile-section" style={{ marginTop: '0.25rem' }}>
              <div className="profile-section-header" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <p className="kicker">Coverage</p>
                  <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', marginTop: '0.2rem' }}>Service Area</h4>
                </div>
              </div>
              <p className="text-sm text-muted" style={{ marginBottom: '0.875rem' }}>
                Sets the centre point we use to sort you by distance for clients with "Near me" enabled. Coordinates must be inside Riyadh.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={useMyLocation} disabled={locating}>
                  {locating && <span className="spinner" />}
                  <Icon name="pin" size="0.85rem" /> Use my location
                </button>
                {typeof form.latitude === 'number' && typeof form.longitude === 'number' ? (
                  <span className="text-xs text-muted">Saved: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</span>
                ) : (
                  <span className="text-xs text-muted">No coordinates set yet.</span>
                )}
                {(typeof form.latitude === 'number' || typeof form.longitude === 'number') && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { set('latitude', null); set('longitude', null); }}>Clear</button>
                )}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Coverage radius (km): {form.coverageRadiusKm || 10}</label>
                <input type="range" min={1} max={50} step={1} value={form.coverageRadiusKm || 10} onChange={e => set('coverageRadiusKm', Number(e.target.value))} style={{ width: '100%' }} />
              </div>
            </div>
          </>
        )}

        {tab === 'specialties' && (
          <div>
            <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>Select your specialties to appear in search results.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SPECIALTIES_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                  className={`btn btn-sm ${(form.specialties || []).includes(s) ? 'btn-primary' : 'btn-ghost'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '0.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving || blockSave}>
            {saving && <span className="spinner" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
