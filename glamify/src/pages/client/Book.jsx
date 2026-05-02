import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const PAYMENT_METHODS = [
  { value: 'card', label: '💳 Card' },
  { value: 'wallet', label: '📱 Digital Wallet' },
  { value: 'cash', label: '💵 Cash' },
];

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function ClientBook() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const providerId = searchParams.get('providerId');
  const preServiceId = searchParams.get('serviceId');

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ serviceId: preServiceId || '', date: today(), timeSlot: '', address: '', notes: '', paymentMethod: 'card', isGift: false, recipientName: '', recipientPhone: '', recipientAddress: '', giftMessage: '', hidePriceFromRecipient: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })); }

  useEffect(() => {
    if (!providerId) return;
    api.get(`/providers/${providerId}`).then(setProvider).catch(() => {});
    api.get(`/providers/${providerId}/services`).then(setServices).catch(() => {});
  }, [providerId]);

  const selectedService = services.find(s => String(s._id || s.id) === String(form.serviceId));

  async function submitBooking() {
    setError('');
    setLoading(true);
    try {
      const b = await api.post('/client/bookings', {
        providerId,
        serviceId: form.serviceId,
        date: form.date,
        timeSlot: form.timeSlot,
        address: form.address,
        notes: form.notes,
        isGift: form.isGift,
        ...(form.isGift ? {
          recipientName: form.recipientName,
          recipientPhone: form.recipientPhone,
          recipientAddress: form.recipientAddress,
          giftMessage: form.giftMessage,
          hidePriceFromRecipient: form.hidePriceFromRecipient,
        } : {}),
      });
      await api.post(`/client/bookings/${b.id}/payment`, { method: form.paymentMethod }).catch(() => {});
      setBooking(b);
      setStep(4);
      success('Booking Confirmed!', 'Your appointment has been booked.');
    } catch (err) {
      setError(err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  if (!providerId) return (
    <div className="empty-state">
      <h3>No provider selected</h3>
      <p>Please select a provider from the discovery page.</p>
      <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/client')}>Browse Providers</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '560px' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }} onClick={() => navigate(-1)}>← Back</button>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: step >= s ? 'var(--color-primary)' : 'var(--color-border)', transition: 'background 0.3s' }} />
        ))}
      </div>

      {step === 4 && booking ? (
        <div className="card card-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2>Booking Confirmed!</h2>
          <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>Your appointment has been submitted. The provider will confirm shortly.</p>
          <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '1rem', margin: '1.5rem 0', textAlign: 'left' }}>
            <p className="text-sm"><strong>Provider:</strong> {provider?.name}</p>
            <p className="text-sm"><strong>Date:</strong> {booking.date} at {booking.timeSlot}</p>
            <p className="text-sm"><strong>Total:</strong> SAR {booking.totalPrice}</p>
          </div>
          <button className="btn btn-primary btn-full" onClick={() => navigate('/client/bookings')}>View My Bookings</button>
        </div>
      ) : step === 1 ? (
        <div>
          <h2 className="page-title" style={{ marginBottom: '1.5rem' }}>Select a Service</h2>
          {error && <div className="alert alert-error mb-4">{error}</div>}
          {provider && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '2rem' }}>💆</span>
              <div>
                <p style={{ fontWeight: 600 }}>{provider.name}</p>
                <p className="text-xs text-muted">{provider.category} • {provider.location}</p>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {services.map(s => (
              <div key={String(s._id || s.id)} onClick={() => set('serviceId', String(s._id || s.id))} className="card card-hover" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: form.serviceId === String(s._id || s.id) ? '2px solid var(--color-primary)' : '' }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{s.name}</p>
                  <p className="text-xs text-muted">{s.duration} min</p>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>SAR {s.price}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isGift} onChange={e => set('isGift', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>🎁 Book as a Gift</span>
            </label>
            {form.isGift && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Recipient Name</label>
                  <input className="form-input" placeholder="Recipient's full name" value={form.recipientName} onChange={e => set('recipientName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Recipient Phone</label>
                  <input className="form-input" placeholder="+966 50 000 0000" value={form.recipientPhone} onChange={e => set('recipientPhone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Recipient Address (Riyadh)</label>
                  <input className="form-input" placeholder="e.g. Tahlia Street, Al Olaya, Riyadh" value={form.recipientAddress} onChange={e => set('recipientAddress', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gift Message (optional)</label>
                  <textarea className="form-input form-textarea" placeholder="A message for the recipient…" value={form.giftMessage} onChange={e => set('giftMessage', e.target.value)} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.hidePriceFromRecipient} onChange={e => set('hidePriceFromRecipient', e.target.checked)} style={{ accentColor: 'var(--color-primary)' }} />
                  Hide price from recipient
                </label>
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-full" disabled={!form.serviceId} onClick={() => setStep(2)}>Continue →</button>
        </div>
      ) : step === 2 ? (
        <div>
          <h2 className="page-title" style={{ marginBottom: '1.5rem' }}>Choose Date & Time</h2>
          {error && <div className="alert alert-error mb-4">{error}</div>}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Date</label>
            <input className="form-input" type="date" min={today()} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Time Slot</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {TIME_SLOTS.map(t => (
                <button key={t} type="button" onClick={() => set('timeSlot', t)} className={`btn btn-sm${form.timeSlot === t ? ' btn-primary' : ' btn-ghost'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">{form.isGift ? 'Your' : 'Your'} Address</label>
            <input className="form-input" placeholder="Your address in Riyadh" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-input form-textarea" placeholder="Any special requests…" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary btn-full" disabled={!form.date || !form.timeSlot} onClick={() => setStep(3)}>Continue →</button>
          </div>
        </div>
      ) : step === 3 ? (
        <div>
          <h2 className="page-title" style={{ marginBottom: '1.5rem' }}>Review & Pay</h2>
          {error && <div className="alert alert-error mb-4">{error}</div>}
          <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>Booking Summary</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-sm text-muted">Provider</span><span className="text-sm font-medium">{provider?.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-sm text-muted">Service</span><span className="text-sm font-medium">{selectedService?.name}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-sm text-muted">Date</span><span className="text-sm font-medium">{form.date}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-sm text-muted">Time</span><span className="text-sm font-medium">{form.timeSlot}</span></div>
              {form.isGift && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-sm text-muted">For</span><span className="text-sm font-medium badge badge-primary">🎁 Gift – {form.recipientName}</span></div>}
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="font-semibold">Total</span><span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>SAR {selectedService?.price || 0}</span></div>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Payment Method</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PAYMENT_METHODS.map(m => (
                <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.875rem', border: `1.5px solid ${form.paymentMethod === m.value ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', background: form.paymentMethod === m.value ? 'var(--color-primary-light)' : 'transparent' }}>
                  <input type="radio" value={m.value} checked={form.paymentMethod === m.value} onChange={() => set('paymentMethod', m.value)} style={{ accentColor: 'var(--color-primary)' }} />
                  <span style={{ fontWeight: 500 }}>{m.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn-primary btn-full" onClick={submitBooking} disabled={loading}>
              {loading && <span className="spinner" />}
              Confirm Booking
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
