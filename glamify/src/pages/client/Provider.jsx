import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import ProviderLogo from '../../components/ProviderLogo';

export default function ClientProvider() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('services');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/providers/${providerId}`),
      api.get(`/providers/${providerId}/services`),
      api.get(`/providers/${providerId}/reviews`),
    ]).then(([p, s, r]) => { setProvider(p); setServices(s); setReviews(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;
  if (!provider) return <div className="empty-state"><h3>Provider not found</h3></div>;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }} onClick={() => navigate(-1)}>← Back</button>

      <div className="card card-body" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <ProviderLogo name={provider.name} category={provider.category} logoUrl={provider.logoUrl} size="xl" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ marginBottom: '0.5rem' }}>{provider.name}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-primary">{provider.category}</span>
              {provider.isApproved && <span className="badge badge-success">✓ Verified</span>}
            </div>
            <p className="text-sm text-muted">📍 {provider.location}</p>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div className="text-center">
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-primary)' }}>{provider.averageRating?.toFixed(1)}</div>
                <div className="text-xs text-muted">Rating</div>
              </div>
              <div className="text-center">
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>{provider.totalReviews}</div>
                <div className="text-xs text-muted">Reviews</div>
              </div>
              <div className="text-center">
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>{provider.totalCompleted}</div>
                <div className="text-xs text-muted">Completed</div>
              </div>
              <div className="text-center">
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>{provider.yearsActive}y</div>
                <div className="text-xs text-muted">Experience</div>
              </div>
            </div>
            {provider.bio && <p className="text-sm" style={{ marginTop: '1rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{provider.bio}</p>}
            {provider.specialties?.length > 0 && (
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {provider.specialties.map(s => <span key={s} className="chip" style={{ fontSize: '0.75rem' }}>{s}</span>)}
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/client/book?providerId=${provider.id}`)}>Book Appointment</button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab-btn${tab === 'services' ? ' active' : ''}`} onClick={() => setTab('services')}>Services ({services.length})</button>
        <button className={`tab-btn${tab === 'reviews' ? ' active' : ''}`} onClick={() => setTab('reviews')}>Reviews ({reviews.length})</button>
      </div>

      {tab === 'services' && (
        services.length === 0 ? <div className="empty-state"><h3>No services listed</h3></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {services.map(s => (
              <div key={String(s._id || s.id)} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontWeight: 600 }}>{s.name}</h4>
                  {s.category && <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{s.category}</p>}
                  <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>⏱ {s.duration} min</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>SAR {s.price}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/client/book?providerId=${provider.id}&serviceId=${s._id || s.id}`)}>Book</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'reviews' && (
        reviews.length === 0 ? <div className="empty-state"><h3>No reviews yet</h3></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reviews.map(r => (
              <div key={String(r._id || r.id)} className="card card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{r.clientName || 'Client'}</span>
                  <span className="star-row">⭐ {r.rating}/5</span>
                </div>
                {r.comment && <p className="text-sm text-muted">{r.comment}</p>}
                <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
