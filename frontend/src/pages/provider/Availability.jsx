import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_WORK_DAYS = { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false, Sunday: false };

export default function ProviderAvailability() {
  const [workDays, setWorkDays] = useState(DEFAULT_WORK_DAYS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    api.get('/provider/availability').then(data => {
      if (data.workDays) setWorkDays(data.workDays);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/provider/availability', { workDays, offSlots: {} });
      success('Saved', 'Availability updated.');
    } catch (err) {
      toastError('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggle(day) {
    setWorkDays(prev => ({ ...prev, [day]: !prev[day] }));
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;

  return (
    <div style={{ maxWidth: '480px' }}>
      <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Availability</h1>
      <p className="text-sm text-muted" style={{ marginBottom: '2rem' }}>Set which days you're available for appointments.</p>

      <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Work Days</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {DAYS.map(day => (
            <label key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', background: workDays[day] ? 'var(--color-primary-light)' : 'var(--color-bg)', border: `1.5px solid ${workDays[day] ? 'var(--color-primary)' : 'var(--color-border)'}`, transition: 'all 0.2s' }}>
              <span style={{ fontWeight: workDays[day] ? 600 : 400 }}>{day}</span>
              <input type="checkbox" checked={!!workDays[day]} onChange={() => toggle(day)} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
            </label>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
        {saving && <span className="spinner" />}
        Save Availability
      </button>
    </div>
  );
}
