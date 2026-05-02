import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import ProviderLogo from '../../components/ProviderLogo';
import { useToast } from '../../components/Toast';

export default function ClientFavourites() {
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/client/favourites').then(setFavs).catch(() => []).finally(() => setLoading(false));
  }, []);

  async function remove(providerId) {
    await api.delete(`/client/favourites/${providerId}`).catch(() => {});
    setFavs(prev => prev.filter(f => String(f.providerId) !== String(providerId)));
    success('Removed', 'Provider removed from favourites.');
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: '1.5rem' }}>My Favourites</h1>

      {favs.length === 0 ? (
        <div className="empty-state">
          <h3>No favourites yet</h3>
          <p>Save your favourite providers for quick access.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/client')}>Browse Providers</button>
        </div>
      ) : (
        <div className="grid-3">
          {favs.map(f => (
            <div key={String(f.id)} className="provider-card card-hover" onClick={() => navigate(`/client/provider/${f.providerId}`)}>
              <div className="provider-card-cover">
                <ProviderLogo name={f.providerName} category={f.category} logoUrl={f.logoUrl} size="xl" />
                <div className="provider-card-actions">
                  <button className="provider-card-action-btn fav-active" onClick={e => { e.stopPropagation(); remove(f.providerId); }} title="Remove from favourites">❤️</button>
                </div>
              </div>
              <div className="provider-card-body">
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{f.providerName}</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                  <span className="badge badge-primary">{f.category}</span>
                </div>
                <p className="text-xs text-muted">📍 {f.location}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                  <span className="star-row">⭐ {f.averageRating?.toFixed(1) || '0.0'} ({f.totalReviews})</span>
                  <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/client/book?providerId=${f.providerId}`); }}>Book</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
