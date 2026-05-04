import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get('bookingId');
  const sessionId = params.get('session_id');
  const cancelled = params.get('cancelled') === '1';
  const [state, setState] = useState({ loading: true, paid: false, message: '', booking: null });

  useEffect(() => {
    if (cancelled || !bookingId || !sessionId) {
      setState({ loading: false, paid: false, message: cancelled ? 'Payment was cancelled.' : 'Missing booking or session info.', booking: null });
      return;
    }
    api.get(`/client/bookings/${bookingId}/stripe-checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then(d => setState({ loading: false, paid: !!d.paid, message: d.paid ? 'Payment confirmed.' : 'Payment not yet completed.', booking: d.booking || null }))
      .catch(err => setState({ loading: false, paid: false, message: err.message || 'Could not verify payment.', booking: null }));
  }, [bookingId, sessionId, cancelled]);

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="card card-body" style={{ textAlign: 'center' }}>
        {state.loading ? (
          <>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>⏳</div>
            <h2>Confirming your payment…</h2>
            <p className="text-sm text-muted">Please hold on while we verify with Stripe.</p>
          </>
        ) : state.paid ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <h2>Payment confirmed</h2>
            <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
              {state.booking ? `${state.booking.providerName} – ${state.booking.serviceName}` : 'Your booking is confirmed.'}
            </p>
            {state.booking && (
              <div style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', padding: '1rem', margin: '1.25rem 0', textAlign: 'left' }}>
                <p className="text-sm"><strong>When:</strong> {state.booking.date} at {state.booking.timeSlot}</p>
                <p className="text-sm"><strong>Total:</strong> SAR {state.booking.totalPrice}</p>
              </div>
            )}
            <button className="btn btn-primary btn-full" onClick={() => navigate('/client/bookings')}>View My Bookings</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h2>{cancelled ? 'Payment cancelled' : 'Payment not completed'}</h2>
            <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>{state.message}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-ghost btn-full" onClick={() => navigate('/client/bookings')}>My Bookings</button>
              <button className="btn btn-primary btn-full" onClick={() => navigate('/client')}>Browse Providers</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
