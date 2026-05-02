import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';

const STATUS_BADGE = { pending: 'badge-warning', confirmed: 'badge-success', completed: 'badge-muted', cancelled: 'badge-error', rejected: 'badge-error', rescheduled: 'badge-info' };

export default function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [cancelId, setCancelId] = useState(null);
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await api.get('/provider/bookings').catch(() => []);
    setBookings(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function updateStatus(bookingId, status) {
    try {
      await api.patch(`/provider/bookings/${bookingId}`, { status });
      success('Updated', `Booking ${status}`);
      load();
    } catch (err) {
      toastError('Error', err.message);
    }
  }

  async function handleCancel() {
    try {
      await api.post(`/provider/bookings/${cancelId}/cancel`, {});
      success('Cancelled', 'Booking cancelled and client notified.');
      setCancelId(null);
      load();
    } catch (err) {
      toastError('Error', err.message);
    }
  }

  const TABS = ['pending', 'confirmed', 'completed', 'cancelled'];
  const displayed = bookings.filter(b => tab === 'pending' ? b.status === 'pending' : tab === 'confirmed' ? b.status === 'confirmed' : tab === 'completed' ? b.status === 'completed' : ['cancelled', 'rejected'].includes(b.status));

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Bookings</h1>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({bookings.filter(b => t === 'cancelled' ? ['cancelled','rejected'].includes(b.status) : b.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : displayed.length === 0 ? (
        <div className="empty-state"><h3>No {tab} bookings</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {displayed.map(b => (
            <div key={String(b.id)} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <p style={{ fontWeight: 600 }}>{b.serviceName}</p>
                    <span className={`badge ${STATUS_BADGE[b.status] || 'badge-muted'}`}>{b.status}</span>
                    {b.isGift && <span className="badge badge-primary">🎁 Gift</span>}
                  </div>
                  <p className="text-sm text-muted">Client: {b.clientName}</p>
                  <p className="text-sm text-muted">📅 {b.date} at {b.timeSlot}</p>
                  {b.isGift && b.recipientName && <p className="text-sm text-muted">For: {b.recipientName} · {b.recipientAddress}</p>}
                  {b.notes && <p className="text-sm text-muted" style={{ fontStyle: 'italic' }}>"{b.notes}"</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, color: 'var(--color-primary)' }}>SAR {b.totalPrice}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {b.status === 'pending' && <>
                      <button className="btn btn-primary btn-sm" onClick={() => updateStatus(b.id, 'confirmed')}>Confirm</button>
                      <button className="btn btn-danger btn-sm" onClick={() => updateStatus(b.id, 'rejected')}>Reject</button>
                    </>}
                    {b.status === 'confirmed' && <>
                      <button className="btn btn-outline btn-sm" onClick={() => updateStatus(b.id, 'completed')}>Complete</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setCancelId(b.id)}>Cancel</button>
                    </>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelId}
        title="Cancel Booking"
        message="Cancel this booking? The client will be notified and offered a refund or reschedule."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep"
        danger
        onConfirm={handleCancel}
        onCancel={() => setCancelId(null)}
      />
    </div>
  );
}
