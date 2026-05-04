import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import Icon from '../../components/Icon';

const TYPE_ICON = {
  booking_confirmed:  'approved',
  booking_rejected:   'rejected',
  booking_completed:  'party',
  provider_cancelled: 'warning',
  refund_approved:    'money',
  refund_rejected:    'rejected',
};

const TYPE_COLOR = {
  booking_confirmed:  'var(--color-success, #16a34a)',
  booking_rejected:   'var(--color-error, #b91c1c)',
  booking_completed:  'var(--color-primary)',
  provider_cancelled: 'var(--color-warning, #b45309)',
  refund_approved:    'var(--color-success, #16a34a)',
  refund_rejected:    'var(--color-error, #b91c1c)',
};

export default function ClientNotifications() {
  const [notifs, setNotifs]   = useState([]);
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
      if (action === 'reschedule' && data.rescheduleUrl) navigate(data.rescheduleUrl);
      load();
    } catch (err) {
      toastError('Error', err.message);
    }
  }

  const unreadCount = notifs.filter(n => !n.isRead).length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div className="section-band-header" style={{ marginBottom: 0 }}>
          <span className="kicker">Stay in the loop</span>
          <h2 style={{ fontFamily: 'var(--font-serif)' }}>Notifications</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {unreadCount > 0 && (
            <>
              <span className="notif-unread-pill">{unreadCount} unread</span>
              <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
            </>
          )}
        </div>
      </div>

      {notifs.length === 0 ? (
        <div className="empty-state-editorial">
          <span className="kicker">All quiet</span>
          <h3>All caught up!</h3>
          <p>No notifications to show.</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifs.map(n => {
            const id = n._id || n.id;
            return (
              <div
                key={String(id)}
                className={`notif-row${n.isRead ? '' : ' notif-row--unread'}`}
              >
                <div
                  className="notif-row-icon"
                  style={{ color: TYPE_COLOR[n.type] || 'var(--color-text-muted)' }}
                >
                  <Icon name={TYPE_ICON[n.type] || 'bell'} size="1.25rem" />
                </div>

                <div className="notif-row-body">
                  <div className="notif-row-top">
                    <div>
                      <p className="notif-row-type">{(n.type || 'update').replace(/_/g, ' ')}</p>
                      <p className="notif-row-title">{n.title}</p>
                    </div>
                    <span className="notif-row-date">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="notif-row-message">{n.message}</p>

                  {n.actionRequired && !n.actionTaken && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleAction(n, 'reschedule')}>Reschedule</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleAction(n, 'refund')}>Request Refund</button>
                    </div>
                  )}
                  {n.actionTaken && (
                    <span className="badge badge-muted" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                      Action taken: {n.actionTaken}
                    </span>
                  )}
                  {!n.isRead && !n.actionRequired && (
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => markRead(id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
