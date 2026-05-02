import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    const data = await api.get(`/admin/providers?status=${tab}`).catch(() => []);
    setProviders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function approve(id) {
    try {
      await api.patch(`/admin/providers/${id}/approve`, {});
      success('Approved', 'Provider approved.');
      load();
    } catch (err) { toastError('Error', err.message); }
  }

  async function reject(id) {
    try {
      await api.patch(`/admin/providers/${id}/reject`, {});
      success('Rejected', 'Provider rejected.');
      load();
    } catch (err) { toastError('Error', err.message); }
  }

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>Providers</h1>
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {['pending', 'approved', 'rejected'].map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : providers.length === 0 ? (
        <div className="empty-state"><h3>No {tab} providers</h3></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Category</th><th>Location</th><th>Applied</th><th>Docs</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {providers.map(p => (
                  <tr key={String(p.id)}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge badge-primary">{p.role}</span></td>
                    <td className="text-sm text-muted">{p.city}</td>
                    <td className="text-sm text-muted">{p.appliedAt ? new Date(p.appliedAt).toLocaleDateString() : '—'}</td>
                    <td className="text-sm">
                      {Array.isArray(p.documents) ? p.documents.map(d => <span key={d} className="chip" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', marginRight: '0.25rem' }}>{d}</span>) : '—'}
                    </td>
                    <td>
                      {tab === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => approve(p.id)}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => reject(p.id)}>Reject</button>
                        </div>
                      )}
                      {tab === 'approved' && (
                        <button className="btn btn-danger btn-sm" onClick={() => reject(p.id)}>Revoke</button>
                      )}
                      {tab === 'rejected' && (
                        <button className="btn btn-primary btn-sm" onClick={() => approve(p.id)}>Re-approve</button>
                      )}
                    </td>
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
