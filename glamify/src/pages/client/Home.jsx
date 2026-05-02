import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import ProviderLogo from '../../components/ProviderLogo';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['All', 'Hair', 'Skin', 'Nails', 'Wellness', 'Lashes', 'Makeup'];

export default function ClientHome() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [favourites, setFavourites] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (search) params.set('search', search);
    api.get(`/providers?${params}`).then(setProviders).catch(() => {}).finally(() => setLoading(false));
  }, [category, search]);

  useEffect(() => {
    api.get('/client/favourites').then(favs => setFavourites(favs.map(f => String(f.providerId)))).catch(() => {});
  }, []);

  async function toggleFav(e, providerId) {
    e.stopPropagation();
    const pid = String(providerId);
    if (favourites.includes(pid)) {
      await api.delete(`/client/favourites/${pid}`).catch(() => {});
      setFavourites(prev => prev.filter(f => f !== pid));
    } else {
      await api.post('/client/favourites', { providerId: pid }).catch(() => {});
      setFavourites(prev => [...prev, pid]);
    }
  }

  return (
    <div>
      <div className="hero">
        <h1>Beauty at Your Door</h1>
        <p>Book certified professionals who come to your home in Riyadh.</p>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search providers or services…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="category-bar no-scrollbar" style={{ marginBottom: '1.5rem' }}>
        {CATEGORIES.map(c => (
          <button key={c} className={`category-btn${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="provider-card">
              <div className="provider-card-cover skeleton" />
              <div className="provider-card-body" style={{ gap: '0.75rem' }}>
                <div className="skeleton" style={{ height: 20, borderRadius: 6, width: '70%' }} />
                <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="empty-state">
          <h3>No providers found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid-3">
          {providers.map(p => {
            const isFav = favourites.includes(String(p.id));
            return (
              <div key={String(p.id)} className="provider-card card-hover" onClick={() => navigate(`/client/provider/${p.id}`)}>
                <div className="provider-card-cover">
                  <ProviderLogo name={p.name} category={p.category} logoUrl={p.logoUrl} size="xl" />
                  <div className="provider-card-actions">
                    <button className={`provider-card-action-btn${isFav ? ' fav-active' : ''}`} onClick={e => toggleFav(e, p.id)} title={isFav ? 'Remove from favourites' : 'Add to favourites'}>
                      {isFav ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>
                <div className="provider-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 600 }}>{p.name}</h4>
                    <div className="star-row">⭐ {p.averageRating?.toFixed(1) || '0.0'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <span className="badge badge-primary">{p.category}</span>
                    {p.isAvailableToday && <span className="badge badge-success">Available Today</span>}
                  </div>
                  <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>📍 {p.location}</p>
                  <p className="text-xs text-muted">{p.totalReviews} reviews</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                    <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {p.startingPrice > 0 ? `From SAR ${p.startingPrice}` : 'Ask for price'}
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/client/book?providerId=${p.id}`); }}>
                      Book
                    </button>
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
