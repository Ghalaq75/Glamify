import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = { pending: 'badge-warning', confirmed: 'badge-success', completed: 'badge-muted', cancelled: 'badge-error', rescheduled: 'badge-info' };

export default function ClientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/client/dashboard').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-muted text-sm">Here's what's coming up for you.</p>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{data?.upcomingBookingsCount ?? 0}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.totalBookingsCount ?? 0}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>Recent Bookings</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/client/bookings')}>View All</button>
      </div>

      {!data?.recentBookings?.length ? (
        <div className="empty-state">
          <h3>No bookings yet</h3>
          <p>Discover and book beauty professionals near you.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/client')}>Explore Providers</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.recentBookings.map(b => (
            <div key={String(b.id)} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <p style={{ fontWeight: 600 }}>{b.serviceName}</p>
                  <span className={`badge ${STATUS_BADGE[b.status] || 'badge-muted'}`}>{b.status}</span>
                </div>
                <p className="text-sm text-muted">{b.providerName} • {b.date} at {b.timeSlot}</p>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>SAR {b.totalPrice}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
