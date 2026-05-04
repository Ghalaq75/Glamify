import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [rejectId, setRejectId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    const data = await api.get(`/admin/payouts?status=${tab}`).catch(() => []);
    setPayouts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function approve(id) {
    try {
      await api.patch(`/admin/payouts/${id}/approve`, {});
      success('Approved', 'Payout approved.');
      load();
    } catch (err) { toastError('Error', err.message); }
  }

  async function handleReject() {
    try {
      await api.patch(`/admin/payouts/${rejectId}/reject`, { adminNote });
      success('Rejected', 'Payout rejected.');
      setRejectId(null);
      setAdminNote('');
      load();
    } catch (err) { toastError('Error', err.message); }
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Payout Requests</h1>
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {['pending', 'approved', 'rejected'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : payouts.length === 0 ? (
        <div className="empty-state"><h3>No {tab} payout requests</h3></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Provider</th><th>Amount</th><th>IBAN</th><th>Requested</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={String(p.id)}>
                    <td style={{ fontWeight: 600 }}>{p.providerName}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>SAR {p.amount}</td>
                    <td className="text-sm text-muted">{p.iban}</td>
                    <td className="text-sm text-muted">{new Date(p.requestedAt || p.createdAt).toLocaleDateString()}</td>
                    <td><span className={`badge ${p.status === 'approved' ? 'badge-success' : p.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{p.status}</span></td>
                    <td>
                      {p.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => approve(p.id)}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => { setRejectId(p.id); setAdminNote(''); }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="modal-backdrop" onClick={() => setRejectId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Reject Payout</h3>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Reason (optional)</label>
              <textarea className="form-input form-textarea" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Reason for rejection…" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleReject}>Reject Payout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
