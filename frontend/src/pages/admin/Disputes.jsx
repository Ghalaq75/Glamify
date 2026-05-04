import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open');
  const [resolveId, setResolveId] = useState(null);
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState('resolved');
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await api.get('/admin/disputes').catch(() => []);
    setDisputes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleResolve() {
    try {
      await api.patch(`/admin/disputes/${resolveId}`, { resolution, adminNote: note });
      success('Done', `Dispute ${resolution}.`);
      setResolveId(null);
      setNote('');
      load();
    } catch (err) { toastError('Error', err.message); }
  }

  const displayed = disputes.filter(d => d.status === tab);

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Disputes</h1>
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {['open', 'resolved', 'rejected'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({disputes.filter(d => d.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : displayed.length === 0 ? (
        <div className="empty-state"><h3>No {tab} disputes</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {displayed.map(d => (
            <div key={String(d.id)} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <p style={{ fontWeight: 600 }}>{d.clientName}</p>
                    <span className="text-muted text-sm">vs</span>
                    <p style={{ fontWeight: 600 }}>{d.providerName}</p>
                    <span className={`badge ${d.status === 'open' ? 'badge-error' : d.status === 'resolved' ? 'badge-success' : 'badge-muted'}`}>{d.status}</span>
                  </div>
                  <p className="text-sm text-muted">Service: {d.serviceName} · SAR {d.amountPaid}</p>
                  <p className="text-sm" style={{ marginTop: '0.375rem', fontStyle: 'italic', color: 'var(--color-text)' }}>"{d.reason}"</p>
                  {d.adminNote && <p className="text-xs text-muted" style={{ marginTop: '0.375rem' }}>Admin note: {d.adminNote}</p>}
                </div>
                {d.status === 'open' && (
                  <button className="btn btn-primary btn-sm" onClick={() => { setResolveId(d.id); setNote(''); setResolution('resolved'); }}>Resolve</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {resolveId && (
        <div className="modal-backdrop" onClick={() => setResolveId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Resolve Dispute</h3>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Resolution</label>
              <select className="form-input form-select" value={resolution} onChange={e => setResolution(e.target.value)}>
                <option value="resolved">Resolved (in client's favour)</option>
                <option value="rejected">Rejected (client's claim dismissed)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Admin Note (optional)</label>
              <textarea className="form-input form-textarea" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for resolution…" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setResolveId(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleResolve}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
