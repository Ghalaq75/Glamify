import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

const STATUS_BADGE = { pending: 'badge-warning', confirmed: 'badge-success', completed: 'badge-muted', cancelled: 'badge-error' };

export default function ProviderDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  useEffect(() => {
    api.get('/provider/dashboard').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function updateStatus(bookingId, status) {
    try {
      await api.patch(`/provider/bookings/${bookingId}`, { status });
      success('Updated', `Booking ${status}`);
      const updated = await api.get('/provider/dashboard');
      setData(updated);
    } catch (err) {
      toastError('Error', err.message);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <span className="kicker">Overview</span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginTop: '0.25rem' }}>Provider Dashboard</h1>
        <p className="text-muted text-sm">Welcome back, {user?.name?.split(' ')[0]}!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '2.5rem' }}>
        {[
          { label: 'Pending', value: data?.pendingCount ?? 0 },
          { label: 'Today', value: data?.confirmedTodayCount ?? 0 },
          { label: 'Completed', value: data?.completedAllTime ?? 0 },
          { label: 'This Month', value: `SAR ${Math.round(data?.totalEarningsThisMonth ?? 0)}` },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--color-bg)', padding: '2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, color: 'var(--color-primary)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginTop: '0.75rem', fontFamily: 'Jost, sans-serif' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>Today's Appointments</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/provider/bookings')}>View All</button>
      </div>

      {!data?.todayBookings?.length ? (
        <div className="empty-state"><h3>No appointments today</h3><p>Enjoy your free time!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.todayBookings.map(b => (
            <div key={String(b.id)} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <p style={{ fontWeight: 600 }}>{b.serviceName}</p>
                    <span className={`badge ${STATUS_BADGE[b.status] || 'badge-muted'}`}>{b.status}</span>
                    {b.isGift && <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Icon name="gift" size="0.85rem" /> Gift</span>}
                  </div>
                  <p className="text-sm text-muted">{b.clientName} • {b.timeSlot}</p>
                  {b.isGift && <p className="text-sm text-muted">For: {b.recipientName}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {b.status === 'pending' && <>
                    <button className="btn btn-primary btn-sm" onClick={() => updateStatus(b.id, 'confirmed')}>Confirm</button>
                    <button className="btn btn-danger btn-sm" onClick={() => updateStatus(b.id, 'rejected')}>Reject</button>
                  </>}
                  {b.status === 'confirmed' && (
                    <button className="btn btn-outline btn-sm" onClick={() => updateStatus(b.id, 'completed')}>Mark Complete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}