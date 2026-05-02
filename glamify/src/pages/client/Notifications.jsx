import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';

const TYPE_ICON = {
  booking_confirmed: '✅',
  booking_rejected: '❌',
  booking_completed: '🎉',
  provider_cancelled: '⚠️',
  refund_approved: '💰',
  refund_rejected: '❌',
};

export default function ClientNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await api.get('/client/notifications').catch(() => []);
    setNotifs(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function markRead(id) {
    await api.patch(`/client/notifications/${id}/read`, {}).catch(() => {});
    setNotifs(prev => prev.map(n => n._id === id || n.id === id ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    await api.patch('/client/notifications/read-all', {}).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    success('Done', 'All notifications marked as read.');
  }

  async function handleAction(notif, action) {
    try {
      const data = await api.post(`/client/notifications/${notif._id || notif.id}/action`, { action });
      success('Done', data.message || 'Action taken.');
      if (action === 'reschedule' && data.rescheduleUrl) {
        navigate(data.rescheduleUrl);
      }
      load();
    } catch (err) {
      toastError('Error', err.message);
    }
  }

  const unreadCount = notifs.filter(n => !n.isRead).length;

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          {unreadCount > 0 && <span className="badge badge-primary" style={{ marginTop: '0.25rem' }}>{unreadCount} unread</span>}
        </div>
        {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>}
      </div>

      {notifs.length === 0 ? (
        <div className="empty-state"><h3>All caught up!</h3><p>No notifications to show.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notifs.map(n => {
            const id = n._id || n.id;
            return (
              <div key={String(id)} className="card card-body" style={{ background: n.isRead ? 'var(--color-bg)' : 'var(--color-surface)', borderLeft: n.isRead ? '' : '3px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{TYPE_ICON[n.type] || '🔔'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.title}</p>
                      <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>{n.message}</p>
                    {n.actionRequired && !n.actionTaken && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleAction(n, 'reschedule')}>Reschedule</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleAction(n, 'refund')}>Request Refund</button>
                      </div>
                    )}
                    {n.actionTaken && <span className="badge badge-muted" style={{ marginTop: '0.5rem' }}>Action taken: {n.actionTaken}</span>}
                    {!n.isRead && !n.actionRequired && (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => markRead(id)}>Mark read</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
