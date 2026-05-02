import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;

  const CARDS = [
    { label: 'Total Users', value: data?.totalUsers ?? 0, path: '/admin/users', color: 'var(--color-primary)' },
    { label: 'Total Providers', value: data?.totalProviders ?? 0, path: '/admin/providers', color: '#3a7d44' },
    { label: 'Total Bookings', value: data?.totalBookings ?? 0, path: '/admin/bookings', color: '#1a5276' },
    { label: 'Pending Providers', value: data?.pendingProviders ?? 0, path: '/admin/providers?status=pending', color: '#9a6500' },
    { label: 'Open Disputes', value: data?.openDisputes ?? 0, path: '/admin/disputes', color: '#c0392b' },
    { label: 'Bookings This Month', value: data?.bookingsThisMonth ?? 0, path: '/admin/bookings', color: '#4a3f8f' },
    { label: 'Total Revenue', value: `SAR ${Math.round(data?.totalRevenue ?? 0)}`, path: '/admin/payouts', color: '#1a5276' },
    { label: 'Revenue This Month', value: `SAR ${Math.round(data?.revenueThisMonth ?? 0)}`, path: '/admin/payouts', color: '#3a7d44' },
  ];

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Admin Dashboard</h1>
      <p className="text-muted text-sm" style={{ marginBottom: '2rem' }}>Platform overview and management.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {CARDS.map(c => (
          <div key={c.label} className="stat-card card-hover" onClick={() => navigate(c.path)} style={{ cursor: 'pointer' }}>
            <div className="stat-value" style={{ color: c.color, fontSize: '1.75rem' }}>{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card card-body">
          <h4 style={{ marginBottom: '1rem' }}>Quick Actions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn btn-outline btn-sm btn-full" onClick={() => navigate('/admin/providers?status=pending')}>Review Pending Providers</button>
            <button className="btn btn-outline btn-sm btn-full" onClick={() => navigate('/admin/disputes')}>Review Open Disputes</button>
            <button className="btn btn-outline btn-sm btn-full" onClick={() => navigate('/admin/payouts?status=pending')}>Process Payout Requests</button>
            <button className="btn btn-outline btn-sm btn-full" onClick={() => navigate('/admin/refund-requests?status=pending')}>Process Refund Requests</button>
          </div>
        </div>
        <div className="card card-body">
          <h4 style={{ marginBottom: '1rem' }}>Platform Health</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-sm text-muted">Pending Provider Approvals</span>
              <span className={`badge ${data?.pendingProviders > 0 ? 'badge-warning' : 'badge-success'}`}>{data?.pendingProviders ?? 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-sm text-muted">Open Disputes</span>
              <span className={`badge ${data?.openDisputes > 0 ? 'badge-error' : 'badge-success'}`}>{data?.openDisputes ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
