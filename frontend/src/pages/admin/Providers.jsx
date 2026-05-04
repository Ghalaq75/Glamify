import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

const STATUS_COLOR = { pending: '#B8956A', approved: '#7A8C6A', rejected: '#B05C5C' };

export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('pending');
  const { success, error: toastError } = useToast();

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    const data = await api.get(`/admin/providers?status=${tab}`).catch(() => []);
    setProviders(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function approve(id) {
    try { await api.patch(`/admin/providers/${id}/approve`, {}); success('Approved', 'Provider approved.'); load(); }
    catch (err) { toastError('Error', err.message); }
  }

  async function reject(id) {
    try { await api.patch(`/admin/providers/${id}/reject`, {}); success('Rejected', 'Provider rejected.'); load(); }
    catch (err) { toastError('Error', err.message); }
  }

  return (
    <div style={{ maxWidth: 780 }}>
      <div className="section-band-header">
        <span className="kicker">Provider management</span>
        <h2 style={{ fontFamily: 'var(--font-serif)' }}>Providers</h2>
      </div>

      <div className="booking-tabs">
        {['pending', 'approved', 'rejected'].map(t => (
          <button
            key={t}
            className={`booking-tab-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : providers.length === 0 ? (
        <div className="empty-state-editorial">
          <span className="kicker">All clear</span>
          <h3>No {tab} providers</h3>
        </div>
      ) : (
        <div className="booking-list">
          {providers.map(p => (
            <article key={String(p.id)} className="booking-row">
              <div
                className="booking-row-status-bar"
                style={{ background: STATUS_COLOR[tab] || 'var(--color-border)' }}
              />
              <div className="booking-row-body">
                <div className="booking-row-main">
                  <div>
                    <p className="booking-row-kicker">{p.city || '—'}</p>
                    <h4 className="booking-row-title">{p.name}</h4>
                    <div className="booking-row-meta">
                      <span>{p.role || p.category || '—'}</span>
                      {p.appliedAt && (
                        <span>Applied {new Date(p.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      )}
                      {Array.isArray(p.documents) && p.documents.length > 0 && (
                        <span>Docs: {p.documents.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  <div className="booking-row-actions" style={{ flexShrink: 0 }}>
                    {tab === 'pending' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => approve(p.id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => reject(p.id)}>Reject</button>
                      </>
                    )}
                    {tab === 'approved' && (
                      <button className="btn btn-danger btn-sm" onClick={() => reject(p.id)}>Revoke</button>
                    )}
                    {tab === 'rejected' && (
                      <button className="btn btn-primary btn-sm" onClick={() => approve(p.id)}>Re-approve</button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
