import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

export default function AdminRefundRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [rejectId, setRejectId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    const data = await api.get(`/admin/refund-requests?status=${tab}`).catch(() => []);
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function approve(id) {
    try {
      await api.patch(`/admin/refund-requests/${id}/approve`, {});
      success('Approved', 'Refund approved.');
      load();
    } catch (err) { toastError('Error', err.message); }
  }

  async function handleReject() {
    try {
      await api.patch(`/admin/refund-requests/${rejectId}/reject`, { adminNote });
      success('Rejected', 'Refund rejected.');
      setRejectId(null);
      setAdminNote('');
      load();
    } catch (err) { toastError('Error', err.message); }
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Refund Requests</h1>
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {['pending', 'approved', 'rejected'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : requests.length === 0 ? (
        <div className="empty-state"><h3>No {tab} refund requests</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {requests.map(r => (
            <div key={String(r.id)} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <p style={{ fontWeight: 600 }}>Client: {r.clientName}</p>
                    <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-muted">Provider: {r.providerName} · Service: {r.serviceName}</p>
                  <p className="text-sm" style={{ marginTop: '0.375rem' }}>Reason: <span style={{ fontStyle: 'italic' }}>{r.reason}</span></p>
                  {r.adminNote && <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Admin note: {r.adminNote}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>SAR {r.amount}</p>
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => approve(r.id)}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setRejectId(r.id); setAdminNote(''); }}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectId && (
        <div className="modal-backdrop" onClick={() => setRejectId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Reject Refund Request</h3>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Reason (optional)</label>
              <textarea className="form-input form-textarea" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Reason for rejection…" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleReject}>Reject Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
