import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    api.get('/admin/dashboard').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  const STATS = [
    { label: 'Users',             value: data?.totalUsers ?? 0,                         path: '/admin/users' },
    { label: 'Providers',         value: data?.totalProviders ?? 0,                     path: '/admin/providers' },
    { label: 'Total Bookings',    value: data?.totalBookings ?? 0,                      path: '/admin/bookings' },
    { label: 'This Month',        value: data?.bookingsThisMonth ?? 0,                  path: '/admin/bookings' },
    { label: 'Total Revenue',     value: `SAR ${Math.round(data?.totalRevenue ?? 0)}`,  path: '/admin/payouts' },
    { label: 'Revenue / Month',   value: `SAR ${Math.round(data?.revenueThisMonth ?? 0)}`, path: '/admin/payouts' },
  ];

  const ALERTS = [
    { label: 'Pending Provider Approvals', value: data?.pendingProviders ?? 0, path: '/admin/providers?status=pending', warn: true },
    { label: 'Open Disputes',              value: data?.openDisputes ?? 0,     path: '/admin/disputes',                 warn: true },
  ];

  const ACTIONS = [
    { label: 'Review Pending Providers',  path: '/admin/providers?status=pending' },
    { label: 'Review Open Disputes',      path: '/admin/disputes' },
    { label: 'Process Payout Requests',   path: '/admin/payouts?status=pending' },
    { label: 'Process Refund Requests',   path: '/admin/refund-requests?status=pending' },
  ];

  return (
    <div style={{ maxWidth: 860 }}>
      <div className="section-band-header">
        <span className="kicker">Platform overview</span>
        <h2 style={{ fontFamily: 'var(--font-serif)' }}>Admin Dashboard</h2>
      </div>

      <div className="admin-stats-strip">
        {STATS.map(s => (
          <div key={s.label} className="admin-stat-item" onClick={() => navigate(s.path)}>
            <span className="admin-stat-value">{s.value}</span>
            <span className="admin-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="profile-section">
          <div className="profile-section-header">
            <div>
              <p className="kicker">Needs attention</p>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginTop: '0.2rem' }}>Platform Health</h4>
            </div>
          </div>
          <div className="admin-health-list">
            {ALERTS.map(a => (
              <div key={a.label} className="admin-health-row" onClick={() => navigate(a.path)}>
                <span className="admin-health-label">{a.label}</span>
                <span className={`badge ${a.value > 0 ? 'badge-warning' : 'badge-success'}`}>{a.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-section">
          <div className="profile-section-header">
            <div>
              <p className="kicker">Shortcuts</p>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginTop: '0.2rem' }}>Quick Actions</h4>
            </div>
          </div>
          <div className="admin-actions-list">
            {ACTIONS.map(a => (
              <button key={a.label} className="admin-action-row" onClick={() => navigate(a.path)}>
                {a.label}
                <span style={{ opacity: 0.4, fontSize: '0.85rem' }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
