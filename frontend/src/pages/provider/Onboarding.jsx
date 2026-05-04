import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import DistrictPicker, { IS_PLACEHOLDER_LIST } from '../../components/DistrictPicker';
import { getCurrentPosition, isWithinRiyadh, GeolocationError } from '../../utils/geolocation';
import FloralMotif from '../../components/FloralMotif';
import Icon from '../../components/Icon';

const STEPS = ['Profile', 'Documents', 'Services', 'Done'];

export default function ProviderOnboarding() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ bio: '', location: '', specialties: '', latitude: null, longitude: null, coverageRadiusKm: 10 });
  const [locating, setLocating] = useState(false);

  async function useMyLocation() {
    setLocating(true);
    try {
      const c = await getCurrentPosition();
      if (!isWithinRiyadh(c.lat, c.lng)) {
        toastError('Outside Riyadh', 'Provider service area must be within Riyadh.');
        return;
      }
      setProfile(p => ({ ...p, latitude: c.lat, longitude: c.lng }));
      success('Coordinates set', 'They will be saved when you continue.');
    } catch (err) {
      const msg = err instanceof GeolocationError ? err.message : 'Could not get your location.';
      toastError('Location unavailable', msg);
    } finally {
      setLocating(false);
    }
  }
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('National ID');
  const [service, setService] = useState({ name: '', price: '', duration: '60' });
  const [saving, setSaving] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    if (IS_PLACEHOLDER_LIST) { toastError('Setup required', 'The Riyadh district list has not been configured yet.'); return; }
    if (!profile.location) { toastError('Pick a district', 'Please pick your district in Riyadh before continuing.'); return; }
    setSaving(true);
    try {
      await api.patch('/provider/profile', {
        bio: profile.bio,
        location: profile.location,
        specialties: profile.specialties.split(',').map(s => s.trim()).filter(Boolean),
        latitude: profile.latitude,
        longitude: profile.longitude,
        coverageRadiusKm: profile.coverageRadiusKm,
      });
      success('Saved', 'Profile info saved.');
      setStep(1);
    } catch (err) {
      toastError('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveDoc(e) {
    e.preventDefault();
    if (!docFile) { setStep(2); return; }
    setSaving(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await api.post('/provider/documents', { docType, fileName: docFile.name, fileData: reader.result, mimeType: docFile.type });
          success('Uploaded', 'Document uploaded.');
          setStep(2);
        } catch (err) {
          toastError('Error', err.message);
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(docFile);
    } catch {
      setSaving(false);
    }
  }

  async function saveService(e) {
    e.preventDefault();
    if (!service.name || !service.price) { toastError('Error', 'Name and price required'); return; }
    setSaving(true);
    try {
      await api.post('/provider/services', { name: service.name, price: Number(service.price), duration: Number(service.duration), category: 'General' });
      success('Added', 'Service added!');
      setStep(3);
    } catch (err) {
      toastError('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <FloralMotif position="tl" color="var(--color-primary)" opacity={0.18} />
      <FloralMotif position="br" color="var(--color-primary)" opacity={0.14} />
      <div style={{ maxWidth: '540px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic', fontSize: '2.5rem', fontWeight: 400, color: 'var(--color-primary-dark)', lineHeight: 1 }}>Glamify</span>
          <h2 style={{ marginTop: '0.5rem' }}>Provider Setup</h2>
          <p className="text-sm text-muted">Let's get your profile ready for clients.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 4, borderRadius: 999, background: step > i ? 'var(--color-primary)' : step === i ? 'var(--color-primary)' : 'var(--color-border)', opacity: step === i ? 1 : step > i ? 1 : 0.4, transition: 'all 0.3s' }} />
              <p className="text-xs text-muted" style={{ marginTop: '0.375rem', fontWeight: step === i ? 600 : 400, color: step === i ? 'var(--color-primary)' : undefined }}>{s}</p>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="card card-body">
            <h3 style={{ marginBottom: '1.25rem' }}>Tell Us About Yourself</h3>
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-input form-textarea" rows={3} placeholder="Professional experience and approach…" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="onboarding-district">Your Location in Riyadh</label>
                <DistrictPicker id="onboarding-district" value={profile.location} onChange={v => setProfile(p => ({ ...p, location: v }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Specialties (comma-separated)</label>
                <input className="form-input" placeholder="Hair Treatment, Keratin, Blowout" value={profile.specialties} onChange={e => setProfile(p => ({ ...p, specialties: e.target.value }))} />
              </div>
              <div className="form-group" style={{ background: 'var(--color-bg)', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                <label className="form-label">Service area (optional)</label>
                <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>
                  Used so clients with "Near me" enabled can find you. Must be inside Riyadh.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <button type="button" className="btn btn-ghost btn-sm btn-pill" onClick={useMyLocation} disabled={locating}>
                    {locating && <span className="spinner" />}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Icon name="pin" size="0.85rem" /> Use my location</span>
                  </button>
                  {typeof profile.latitude === 'number' && typeof profile.longitude === 'number' && (
                    <span className="text-xs text-muted">{profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}</span>
                  )}
                </div>
                <label className="form-label" style={{ fontSize: '0.8125rem' }}>Coverage radius (km): {profile.coverageRadiusKm}</label>
                <input
                  type="range" min={1} max={50} step={1}
                  value={profile.coverageRadiusKm}
                  onChange={e => setProfile(p => ({ ...p, coverageRadiusKm: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={saving || IS_PLACEHOLDER_LIST || !profile.location}>
                {saving && <span className="spinner" />}
                Continue →
              </button>
            </form>
          </div>
        )}

        {step === 1 && (
          <div className="card card-body">
            <h3 style={{ marginBottom: '0.5rem' }}>Upload a Document</h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>National ID or professional license (optional but speeds up approval).</p>
            <form onSubmit={saveDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select className="form-input form-select" value={docType} onChange={e => setDocType(e.target.value)}>
                  {['National ID', 'Professional License', 'Health Certificate', 'Portfolio'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">File (PDF, JPG, PNG)</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ padding: '0.5rem', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', width: '100%', fontSize: '0.875rem' }} onChange={e => setDocFile(e.target.files[0])} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>Skip for now</button>
                <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                  {saving && <span className="spinner" />}
                  {docFile ? 'Upload & Continue' : 'Continue →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="card card-body">
            <h3 style={{ marginBottom: '0.5rem' }}>Add Your First Service</h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>You can add more services later.</p>
            <form onSubmit={saveService} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Service Name</label>
                <input className="form-input" placeholder="e.g. Deep Conditioning Treatment" value={service.name} onChange={e => setService(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Price (SAR)</label>
                  <input className="form-input" type="number" min={1} placeholder="e.g. 300" value={service.price} onChange={e => setService(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (min)</label>
                  <input className="form-input" type="number" min={15} step={15} value={service.duration} onChange={e => setService(p => ({ ...p, duration: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(3)}>Skip</button>
                <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                  {saving && <span className="spinner" />}
                  Add Service →
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="card card-body" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem', color: 'var(--color-primary)', display: 'flex', justifyContent: 'center' }}><Icon name="party" size="4rem" /></div>
            <h2>You're All Set!</h2>
            <p className="text-sm text-muted" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              Your profile is submitted for review. Once approved, clients can find and book you.
            </p>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/provider')}>
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
