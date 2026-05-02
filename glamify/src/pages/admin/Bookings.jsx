import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const STATUS_BADGE = { pending: 'badge-warning', confirmed: 'badge-success', completed: 'badge-muted', cancelled: 'badge-error', rescheduled: 'badge-info' };

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/bookings').then(d => setBookings(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const displayed = search
    ? bookings.filter(b => b.clientName?.toLowerCase().includes(search.toLowerCase()) || b.serviceName?.toLowerCase().includes(search.toLowerCase()))
    : bookings;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title">Bookings</h1>
        <input className="form-input" style={{ maxWidth: 260 }} placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Client</th><th>Service</th><th>Date</th><th>Time</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {displayed.map(b => (
                  <tr key={String(b.id)}>
                    <td style={{ fontWeight: 600 }}>{b.clientName}</td>
                    <td className="text-sm">{b.serviceName}</td>
                    <td className="text-sm text-muted">{b.date}</td>
                    <td className="text-sm text-muted">{b.timeSlot}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>SAR {b.totalPrice}</td>
                    <td><span className={`badge ${STATUS_BADGE[b.status] || 'badge-muted'}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
