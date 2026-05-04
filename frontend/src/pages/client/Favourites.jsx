import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import ProviderLogo from '../../components/ProviderLogo';
import { useToast } from '../../components/Toast';
import { getSessionClientCoords, haversineDistance, formatDistance, isNearMeActive } from '../../utils/geolocation';
import Icon from '../../components/Icon';

export default function ClientFavourites() {
  const [favs, setFavs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const { success }           = useToast();
  const navigate              = useNavigate();
  const coords                = isNearMeActive() ? getSessionClientCoords() : null;

  useEffect(() => {
    api.get('/client/favourites').then(setFavs).catch(() => []).finally(() => setLoading(false));
  }, []);

  async function remove(providerId) {
    await api.delete(`/client/favourites/${providerId}`).catch(() => {});
    setFavs(prev => prev.filter(f => String(f.providerId) !== String(providerId)));
    success('Removed', 'Provider removed from favourites.');
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="section-band-header">
        <span className="kicker">Your little black book</span>
        <h2 style={{ fontFamily: 'var(--font-serif)' }}>My Favourites</h2>
      </div>

      {favs.length === 0 ? (
        <div className="empty-state-editorial">
          <span className="kicker">Nothing saved yet</span>
          <h3>No favourites yet</h3>
          <p>Save your favourite providers for quick access.</p>
          <button className="btn btn-primary btn-pill" style={{ marginTop: '1rem' }} onClick={() => navigate('/client')}>
            Browse Providers
          </button>
        </div>
      ) : (
        <div className="fav-list">
          {favs.map(f => (
            <article
              key={String(f.id)}
              className="fav-row"
              onClick={() => navigate(`/client/provider/${f.providerId}`)}
            >
              <div className="fav-row-logo">
                <ProviderLogo name={f.providerName} category={f.category} logoUrl={f.logoUrl} size="md" />
              </div>

              <div className="fav-row-info">
                <p className="fav-row-kicker">{f.category}</p>
                <h4 className="fav-row-name">{f.providerName}</h4>
                <div className="fav-row-meta">
                  <span><Icon name="pin" size="0.8rem" /> {f.location}
                    {coords && typeof f.latitude === 'number' && typeof f.longitude === 'number' && (
                      <> · {formatDistance(haversineDistance(coords.lat, coords.lng, f.latitude, f.longitude))} away</>
                    )}
                  </span>
                  <span><Icon name="starFilled" size="0.8rem" style={{ color: 'var(--color-accent)' }} /> {f.averageRating?.toFixed(1) || '0.0'} · {f.totalReviews} reviews</span>
                </div>
              </div>

              <div className="fav-row-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="fav-row-remove"
                  onClick={() => remove(f.providerId)}
                  title="Remove from favourites"
                  aria-label="Remove from favourites"
                >
                  <Icon name="heartFilled" size="1.1rem" />
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/client/book?providerId=${f.providerId}`)}
                >
                  Book
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
