import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import ProviderLogo from '../../components/ProviderLogo';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import {
  formatDistance,
  GeolocationError,
  getCurrentPosition,
  getSessionClientCoords,
  haversineDistance,
  isNearMeActive,
  isWithinRiyadh,
  setNearMeActive,
  setSessionClientCoords,
} from '../../utils/geolocation';

export default function ClientProvider() {
  const { providerId } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('services');
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(() => (isNearMeActive() ? getSessionClientCoords() : null));
  const [locating, setLocating] = useState(false);

  const { user } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const distanceKm = useMemo(() => {
    if (
      !coords ||
      !provider ||
      typeof provider.latitude !== 'number' ||
      typeof provider.longitude !== 'number'
    ) {
      return null;
    }

    return haversineDistance(coords.lat, coords.lng, provider.latitude, provider.longitude);
  }, [coords, provider]);

  function showSignInRequired() {
    toastSuccess(
      'Sign in required',
      'Please sign in or create an account to continue.'
    );

    navigate('/login');
  }

  function handleBookAppointment() {
    if (!user) {
      showSignInRequired();
      return;
    }

    navigate(`/client/book?providerId=${provider.id}`);
  }

  function handleBookService(serviceId) {
    if (!user) {
      showSignInRequired();
      return;
    }

    navigate(`/client/book?providerId=${provider.id}&serviceId=${serviceId}`);
  }

  async function detectLocation() {
    setLocating(true);

    try {
      const c = await getCurrentPosition();

      if (!isWithinRiyadh(c.lat, c.lng)) {
        toastError('Outside Riyadh', 'Glamify currently serves only Riyadh.');
        return;
      }

      setCoords(c);
      setSessionClientCoords(c);
      setNearMeActive(true);
      toastSuccess('Location detected', 'We can now show distance to providers.');
    } catch (err) {
      const msg = err instanceof GeolocationError ? err.message : 'Could not get your location.';
      toastError('Location unavailable', msg);
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    Promise.all([
      api.get(`/providers/${providerId}`),
      api.get(`/providers/${providerId}/services`),
      api.get(`/providers/${providerId}/reviews`),
    ])
      .then(([p, s, r]) => {
        setProvider(p);
        setServices(s);
        setReviews(r);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="empty-state-editorial">
        <h3>Provider not found</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1rem' }}
      >
        ← Back
      </button>

      <section className="profile-hero" style={{ alignItems: 'flex-start', gap: '1.5rem' }}>
        <ProviderLogo
          name={provider.name}
          category={provider.category}
          logoUrl={provider.logoUrl}
          size="lg"
        />

        <div className="profile-hero-info" style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.35rem' }}>
            {provider.name}
          </h2>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span className="profile-hero-badge">{provider.category}</span>

            {provider.isApproved && (
              <span className="profile-hero-badge">
                <Icon name="check" size="0.75rem" />
                Verified
              </span>
            )}
          </div>

          <p className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Icon name="pin" size="0.85rem" />
            {provider.location}
            {distanceKm != null && <> · {formatDistance(distanceKm)} away</>}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {!coords && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={detectLocation}
                disabled={locating}
              >
                {locating && <span className="spinner" />}
                <Icon name="pin" size="0.85rem" />
                Use my location
              </button>
            )}

            {typeof provider.latitude === 'number' && typeof provider.longitude === 'number' && (
              <a
                className="btn btn-ghost btn-sm"
                href={`https://www.google.com/maps/search/?api=1&query=${provider.latitude},${provider.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions
              </a>
            )}
          </div>
        </div>

        <div className="profile-hero-stats">
          <div className="profile-stat">
            <span className="profile-stat-value">{provider.averageRating?.toFixed(1) ?? '—'}</span>
            <span className="profile-stat-label">Rating</span>
          </div>

          <div className="profile-stat-divider" />

          <div className="profile-stat">
            <span className="profile-stat-value">{provider.totalReviews ?? 0}</span>
            <span className="profile-stat-label">Reviews</span>
          </div>

          <div className="profile-stat-divider" />

          <div className="profile-stat">
            <span className="profile-stat-value">{provider.totalCompleted ?? 0}</span>
            <span className="profile-stat-label">Completed</span>
          </div>

          <div className="profile-stat-divider" />

          <div className="profile-stat">
            <span className="profile-stat-value">{provider.yearsActive ?? 0}y</span>
            <span className="profile-stat-label">Experience</span>
          </div>
        </div>
      </section>

      {provider.bio && (
        <section className="profile-section">
          <p className="text-sm text-muted">{provider.bio}</p>
        </section>
      )}

      {provider.specialties?.length > 0 && (
        <section className="profile-section">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {provider.specialties.map(s => (
              <span key={s} className="profile-hero-badge">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        className="btn btn-primary btn-pill"
        onClick={handleBookAppointment}
        style={{ margin: '1rem 0' }}
      >
        Book Appointment
      </button>

      <div className="booking-tabs">
        <button
          type="button"
          className={`booking-tab-btn${tab === 'services' ? ' active' : ''}`}
          onClick={() => setTab('services')}
        >
          Services ({services.length})
        </button>

        <button
          type="button"
          className={`booking-tab-btn${tab === 'reviews' ? ' active' : ''}`}
          onClick={() => setTab('reviews')}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      {tab === 'services' && (
        services.length === 0 ? (
          <div className="empty-state-editorial">
            <h3>No services listed</h3>
          </div>
        ) : (
          <div className="provider-list">
            {services.map(s => (
              <article key={s._id || s.id} className="provider-row" style={{ cursor: 'default' }}>
                <div className="provider-row-info">
                  <h4>{s.name}</h4>

                  <div className="provider-row-meta">
                    {s.category && (
                      <>
                        <span>{s.category}</span>
                        <span className="provider-row-meta-dot" />
                      </>
                    )}

                    <span>{s.duration} min</span>
                  </div>
                </div>

                <div className="provider-row-actions">
                  <span className="provider-row-price">SAR {s.price}</span>

                  <button
                    type="button"
                    className="btn btn-primary btn-pill btn-sm"
                    onClick={() => handleBookService(s._id || s.id)}
                  >
                    Book
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {tab === 'reviews' && (
        reviews.length === 0 ? (
          <div className="empty-state-editorial">
            <h3>No reviews yet</h3>
          </div>
        ) : (
          <div className="provider-list">
            {reviews.map(r => (
              <article key={r._id || r.id} className="provider-row" style={{ cursor: 'default' }}>
                <div className="provider-row-info">
                  <h4>{r.clientName || 'Client'}</h4>

                  <div className="provider-row-meta">
                    <span>{r.rating}/5</span>
                    <span className="provider-row-meta-dot" />
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>

                  {r.comment && (
                    <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
                      {r.comment}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </div>
  );
}