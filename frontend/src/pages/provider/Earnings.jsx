import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

export default function ProviderEarnings() {
  const [data, setData] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayout, setShowPayout] = useState(false);
  const [form, setForm] = useState({ amount: '', iban: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    Promise.all([api.get('/provider/earnings'), api.get('/provider/payouts')])
      .then(([e, p]) => { setData(e); setPayouts(Array.isArray(p) ? p : []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function requestPayout(e) {
    e.preventDefault();
    if (!form.amount || !form.iban) { toastError('Error', 'Amount and IBAN are required'); return; }
    setSaving(true);
    try {
      await api.post('/provider/payouts', { amount: Number(form.amount), iban: form.iban, notes: form.notes });
      success('Requested', 'Payout request submitted.');
      setShowPayout(false);
      setForm({ amount: '', iban: '', notes: '' });
      const updated = await api.get('/provider/payouts');
      setPayouts(Array.isArray(updated) ? updated : []);
    } catch (err) {
      toastError('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Earnings</h1>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>SAR {Math.round(data?.availableForPayout ?? 0)}</div>
          <div className="stat-label">Available for Payout</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>SAR {Math.round(data?.thisMonth ?? 0)}</div>
          <div className="stat-label">This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>SAR {Math.round(data?.lastMonth ?? 0)}</div>
          <div className="stat-label">Last Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>SAR {Math.round(data?.totalEarned ?? 0)}</div>
          <div className="stat-label">Total Earned</div>
        </div>
      </div>

      <div style={{ background: 'var(--color-info-bg)', border: '1px solid #b6d1e5', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', marginBottom: '1.5rem', color: 'var(--color-info)', fontSize: '0.875rem' }}>
        ℹ Platform fee: {data?.platformFeePercent ?? 10}% per completed booking
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>Payout Requests</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowPayout(true)}>Request Payout</button>
      </div>

      {payouts.length === 0 ? (
        <div className="empty-state"><h3>No payout requests yet</h3></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Amount</th><th>IBAN</th><th>Status</th></tr></thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={String(p._id || p.id)}>
                    <td className="text-sm">{new Date(p.requestedAt || p.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>SAR {p.amount}</td>
                    <td className="text-sm text-muted">{p.iban}</td>
                    <td><span className={`badge ${p.status === 'approved' ? 'badge-success' : p.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPayout && (
        <div className="modal-backdrop" onClick={() => setShowPayout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Request Payout</h3>
            <form onSubmit={requestPayout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Amount (SAR)</label>
                <input className="form-input" type="number" min={1} placeholder="e.g. 1000" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">IBAN</label>
                <input className="form-input" placeholder="SA..." value={form.iban} onChange={e => setForm(p => ({ ...p, iban: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPayout(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving && <span className="spinner" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
