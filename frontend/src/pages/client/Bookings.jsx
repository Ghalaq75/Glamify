import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';
import Icon from '../../components/Icon';

const STATUS_COLOR = {
  pending:     '#B8956A',
  confirmed:   '#929887',
  completed:   '#7A8C6A',
  cancelled:   '#B05C5C',
  rescheduled: '#7A8C9A',
};

const STATUS_BADGE = {
  pending:     'badge-warning',
  confirmed:   'badge-success',
  completed:   'badge-muted',
  cancelled:   'badge-error',
  rescheduled: 'badge-info',
};

export default function ClientBookings() {
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('upcoming');
  const [cancelId, setCancelId]       = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewForm, setReviewForm]   = useState({ rating: 5, comment: '' });
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
      await api.post('/client/reviews', {
        bookingId: reviewBooking.id,
        providerId: reviewBooking.providerId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      success('Review Submitted', 'Thank you for your feedback!');
      setReviewBooking(null);
      loadBookings();
    } catch (err) {
      toastError('Error', err.message);
    }
  }

  const upcoming  = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const past      = bookings.filter(b => ['completed', 'cancelled', 'rescheduled'].includes(b.status));
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="section-band-header">
        <span className="kicker">Your appointments</span>
        <h2 style={{ fontFamily: 'var(--font-serif)' }}>My Bookings</h2>
      </div>

      <div className="booking-tabs">
        <button
          className={`booking-tab-btn${tab === 'upcoming' ? ' active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming
          {upcoming.length > 0 && <span className="booking-tab-count">{upcoming.length}</span>}
        </button>
        <button
          className={`booking-tab-btn${tab === 'past' ? ' active' : ''}`}
          onClick={() => setTab('past')}
        >
          Past
          {past.length > 0 && <span className="booking-tab-count">{past.length}</span>}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : displayed.length === 0 ? (
        <div className="empty-state-editorial">
          <span className="kicker">{tab === 'upcoming' ? 'Nothing booked yet' : 'No history yet'}</span>
          <h3>No bookings found</h3>
          <p>{tab === 'upcoming' ? 'You have no upcoming appointments.' : 'No past bookings yet.'}</p>
          {tab === 'upcoming' && (
            <button className="btn btn-primary btn-pill" style={{ marginTop: '1rem' }} onClick={() => navigate('/client')}>
              Browse Providers
            </button>
          )}
        </div>
      ) : (
        <div className="booking-list">
          {displayed.map(b => (
            <article key={String(b.id)} className="booking-row">
              <div
                className="booking-row-status-bar"
                style={{ background: STATUS_COLOR[b.status] || 'var(--color-border)' }}
              />
              <div className="booking-row-body">
                <div className="booking-row-main">
                  <div>
                    <p className="booking-row-kicker">{b.providerName}</p>
                    <h4 className="booking-row-title">
                      {b.serviceName || 'Service'}
                      {b.isGift && (
                        <span className="booking-row-gift"><Icon name="gift" size="0.85rem" /> Gift</span>
                      )}
                    </h4>
                    <div className="booking-row-meta">
                      <span><Icon name="calendar" size="0.85rem" /> {b.date} · {b.timeSlot}</span>
                      {b.address && <span><Icon name="pin" size="0.85rem" /> {b.address}</span>}
                      {b.isGift && b.recipientName && <span><Icon name="gift" size="0.85rem" /> For: {b.recipientName}</span>}
                    </div>
                  </div>

                  <div className="booking-row-right">
                    <span className={`badge ${STATUS_BADGE[b.status] || 'badge-muted'}`}>{b.status}</span>
                    <p className="booking-row-price">SAR {b.totalPrice}</p>
                    <div className="booking-row-actions">
                      {['pending', 'confirmed'].includes(b.status) && (
                        <button className="btn btn-danger btn-pill btn-sm" onClick={() => setCancelId(b.id)}>Cancel</button>
                      )}
                      {b.status === 'completed' && (
                        <button
                          className="btn btn-outline btn-pill btn-sm"
                          onClick={() => { setReviewBooking(b); setReviewForm({ rating: 5, comment: '' }); }}
                        >
                          Leave Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
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
            <span className="kicker">Share your experience</span>
            <h3 className="modal-title" style={{ fontFamily: 'var(--font-serif)' }}>Leave a Review</h3>
            <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
              {reviewBooking.serviceName} with {reviewBooking.providerName}
            </p>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Rating</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewForm(prev => ({ ...prev, rating: n }))}
                    aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: reviewForm.rating >= n ? 'var(--color-primary)' : 'var(--color-border)', padding: '0.25rem' }}
                  >
                    <Icon name={reviewForm.rating >= n ? 'starFilled' : 'star'} size="1.5rem" />
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Comment (optional)</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Share your experience…"
                value={reviewForm.comment}
                onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost btn-pill btn-sm" onClick={() => setReviewBooking(null)}>Cancel</button>
              <button className="btn btn-primary btn-pill btn-sm" onClick={handleReview}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
