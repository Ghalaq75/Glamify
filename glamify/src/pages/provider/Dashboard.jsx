import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

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
        <h1 className="page-title">Provider Dashboard</h1>
        <p className="text-muted text-sm">Welcome back, {user?.name?.split(' ')[0]}!</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card"><div className="stat-value">{data?.pendingCount ?? 0}</div><div className="stat-label">Pending</div></div>
        <div className="stat-card"><div className="stat-value">{data?.confirmedTodayCount ?? 0}</div><div className="stat-label">Today</div></div>
        <div className="stat-card"><div className="stat-value">{data?.completedAllTime ?? 0}</div><div className="stat-label">Completed</div></div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>SAR {Math.round(data?.totalEarningsThisMonth ?? 0)}</div>
          <div className="stat-label">This Month</div>
        </div>
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
                    {b.isGift && <span className="badge badge-primary">🎁 Gift</span>}
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
