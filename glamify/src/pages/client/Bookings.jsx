import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';

const STATUS_BADGE = {
  pending: 'badge-warning',
  confirmed: 'badge-success',
  completed: 'badge-muted',
  cancelled: 'badge-error',
  rescheduled: 'badge-info',
};

export default function ClientBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [cancelId, setCancelId] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => { loadBookings(); }, []);

  async function loadBookings() {
    setLoading(true);
    const data = await api.get('/client/bookings').catch(() => []);
    setBookings(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleCancel() {
    try {
      await api.patch(`/client/bookings/${cancelId}/cancel`, {});
      success('Cancelled', 'Your booking has been cancelled.');
      setCancelId(null);
      loadBookings();
    } catch (err) {
      toastError('Error', err.message);
    }
  }

  async function handleReview() {
    try {
      await api.post('/client/reviews', { bookingId: reviewBooking.id, providerId: reviewBooking.providerId, rating: reviewForm.rating, comment: reviewForm.comment });
      success('Review Submitted', 'Thank you for your feedback!');
      setReviewBooking(null);
      loadBookings();
    } catch (err) {
      toastError('Error', err.message);
    }
  }

  const upcoming = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const past = bookings.filter(b => ['completed', 'cancelled', 'rescheduled'].includes(b.status));
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>My Bookings</h1>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming ({upcoming.length})</button>
        <button className={`tab-btn${tab === 'past' ? ' active' : ''}`} onClick={() => setTab('past')}>Past ({past.length})</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <h3>No bookings found</h3>
          <p>{tab === 'upcoming' ? 'You have no upcoming appointments.' : 'No past bookings yet.'}</p>
          {tab === 'upcoming' && (
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/client')}>Browse Providers</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {displayed.map(b => (
            <div key={String(b.id)} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontWeight: 600 }}>{b.serviceName || 'Service'}</h4>
                    <span className={`badge ${STATUS_BADGE[b.status] || 'badge-muted'}`}>{b.status}</span>
                    {b.isGift && <span className="badge badge-primary">🎁 Gift</span>}
                  </div>
                  <p className="text-sm text-muted">{b.providerName}</p>
                  <p className="text-sm text-muted">📅 {b.date} at {b.timeSlot}</p>
                  {b.address && <p className="text-sm text-muted">📍 {b.address}</p>}
                  {b.isGift && b.recipientName && <p className="text-sm text-muted">🎁 For: {b.recipientName}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>SAR {b.totalPrice}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {['pending', 'confirmed'].includes(b.status) && (
                      <button className="btn btn-danger btn-sm" onClick={() => setCancelId(b.id)}>Cancel</button>
                    )}
                    {b.status === 'completed' && (
                      <button className="btn btn-outline btn-sm" onClick={() => { setReviewBooking(b); setReviewForm({ rating: 5, comment: '' }); }}>Leave Review</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelId}
        title="Cancel Booking"
        message="Are you sure you want to cancel this appointment?"
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep It"
        danger
        onConfirm={handleCancel}
        onCancel={() => setCancelId(null)}
      />

      {reviewBooking && (
        <div className="modal-backdrop" onClick={() => setReviewBooking(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Leave a Review</h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>{reviewBooking.serviceName} with {reviewBooking.providerName}</p>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Rating</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setReviewForm(prev => ({ ...prev, rating: n }))} style={{ fontSize: '1.5rem', background: 'none', border: 'none', opacity: reviewForm.rating >= n ? 1 : 0.3 }}>⭐</button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Comment (optional)</label>
              <textarea className="form-input form-textarea" placeholder="Share your experience…" value={reviewForm.comment} onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setReviewBooking(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleReview}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
