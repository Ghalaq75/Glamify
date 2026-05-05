import { DISTRICTS, IS_PLACEHOLDER_LIST } from '@workspace/riyadh-districts';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroSpa from '../../assets/hero_spa_new.jpg';
import spaFacial from '../../assets/spa_facial.jpg';
import spaHair from '../../assets/spa_hair.jpg';
import spaInterior from '../../assets/spa_interior.jpg';
import Icon from '../../components/Icon';
import ProviderLogo from '../../components/ProviderLogo';
import TasselDrop from '../../components/TasselDrop';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import {
  clearSessionClientCoords,
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

const CATEGORIES = [
  { key: 'All', icon: 'sparkle' },
  { key: 'Hair', icon: 'scissors' },
  { key: 'Skin', icon: 'leaf' },
  { key: 'Nails', icon: 'brush' },
  { key: 'Wellness', icon: 'facial' },
  { key: 'Lashes', icon: 'eye' },
  { key: 'Makeup', icon: 'lipstick' },
];

const STATS = [
  { num: '200+', label: 'Vetted Providers' },
  { num: '15', label: 'Services Offered' },
  { num: '12', label: 'Districts Covered' },
  { num: '5,000+', label: 'Bookings Made' },
];

export default function ClientHome() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [district, setDistrict] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [favourites, setFavourites] = useState([]);
  const [coords, setCoords] = useState(() => getSessionClientCoords());
  const [nearMe, setNearMe] = useState(() => isNearMeActive() && !!getSessionClientCoords());
  const [locating, setLocating] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const activeFilterCount =
    (category !== 'All' ? 1 : 0) + (district ? 1 : 0) + (searchDate ? 1 : 0);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function showSignInRequired() {
    toastSuccess(
      'Sign in required',
      'Please sign in or create an account to continue.'
    );

    navigate('/login');
  }

  async function handleNearMe() {
    if (nearMe) {
      setNearMe(false);
      setNearMeActive(false);
      return;
    }

    if (coords) {
      setNearMe(true);
      setNearMeActive(true);
      return;
    }

    setLocating(true);

    try {
      const c = await getCurrentPosition();

      if (!isWithinRiyadh(c.lat, c.lng)) {
        toastError('Outside Riyadh', 'Glamify currently serves only Riyadh.');
        return;
      }

      setCoords(c);
      setSessionClientCoords(c);
      setNearMe(true);
      setNearMeActive(true);
      toastSuccess('Location detected', 'Sorting providers nearest to you.');
    } catch (err) {
      if (err instanceof GeolocationError) {
        toastError('Location unavailable', err.message);
      } else {
        toastError('Location unavailable', 'Could not get your location.');
      }
    } finally {
      setLocating(false);
    }
  }

  function handleClearLocation() {
    setNearMe(false);
    setCoords(null);
    clearSessionClientCoords();
  }

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();

    if (category !== 'All') params.set('category', category);
    if (search.trim()) params.set('search', search.trim());
    if (searchDate) params.set('date', searchDate);

    api
      .get(`/providers?${params}`)
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, search, searchDate]);

  useEffect(() => {
    if (user) {
      api
        .get('/client/favourites')
        .then(favs => setFavourites(favs.map(f => String(f.providerId))))
        .catch(() => {});
    }
  }, [user]);

  const visibleProviders = useMemo(() => {
    let list = providers;

    if (district.trim()) {
      const q = district.trim().toLowerCase();
      list = list.filter(p => (p.location || '').toLowerCase().includes(q));
    }

    if (nearMe && coords) {
      list = list
        .map(p => {
          const d =
            typeof p.latitude === 'number' && typeof p.longitude === 'number'
              ? haversineDistance(coords.lat, coords.lng, p.latitude, p.longitude)
              : null;

          return { ...p, _distanceKm: d };
        })
        .sort((a, b) => {
          if (a._distanceKm == null && b._distanceKm == null) return 0;
          if (a._distanceKm == null) return 1;
          if (b._distanceKm == null) return -1;
          return a._distanceKm - b._distanceKm;
        });
    }

    return list;
  }, [providers, district, nearMe, coords]);

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

  function handleSubscribe(e) {
    e.preventDefault();

    if (email.trim()) {
      setSubscribed(true);
    }
  }

  return (
    <div className="client-home-discover">
      <section className="home-hero-banner" aria-label="Welcome">
        <img src={heroSpa} alt="" className="home-hero-banner-img" />
        <div className="home-hero-banner-overlay" />

        <div className="home-hero-banner-copy">
          <span className="home-hero-banner-eyebrow">Beauty · Riyadh</span>
          <h1>
            Beauty at your door,
            <br />
            in Riyadh.
          </h1>
          <p>Book vetted, in-home beauty professionals — on your schedule.</p>

          <div style={{ marginTop: '0.5rem' }}>
            <a
              href="#discover"
              className="btn btn-primary btn-pill"
              style={{ display: 'inline-flex', textDecoration: 'none' }}
              onClick={e => {
                e.preventDefault();
                document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore providers
            </a>
          </div>
        </div>

        <svg
          className="home-hero-banner-ornament"
          viewBox="0 0 600 12"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line x1="0" y1="6" x2="600" y2="6" stroke="var(--color-sand)" strokeWidth="0.5" />
          {[...Array(30)].map((_, i) => (
            <polygon
              key={i}
              points={`${i * 20 + 10},2 ${i * 20 + 14},6 ${i * 20 + 10},10 ${i * 20 + 6},6`}
              fill="var(--color-burgundy)"
              fillOpacity="0.35"
            />
          ))}
        </svg>
      </section>

      <section className="home-brand-intro" aria-label="About Glamify">
        <div className="home-brand-intro-copy">
          <span className="home-kicker">Who we are</span>
          <h2 className="home-brand-intro-heading">Riyadh's trusted beauty marketplace</h2>
          <p className="home-brand-intro-body">
            Glamify connects you with hand-picked beauty professionals — hair, skin, nails,
            wellness and more — who come to your home, hotel, or office. Every provider is
            verified and reviewed by real clients.
          </p>
          <blockquote className="home-brand-intro-quote">
            "Your beauty ritual, at your convenience."
          </blockquote>
        </div>

        <div className="home-brand-intro-photo-wrap">
          <img src={spaHair} alt="Hair spa session" className="home-brand-intro-photo" />
          <div className="home-brand-intro-tag">
            <span className="home-kicker" style={{ color: 'var(--color-primary)' }}>
              Est. Riyadh
            </span>
            <span
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
                fontSize: '1.1rem',
              }}
            >
              Glamify
            </span>
          </div>
        </div>
      </section>

      <div className="home-stats-row" aria-label="Glamify by the numbers">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="home-stats-item"
            style={i < STATS.length - 1 ? { borderRight: '1px solid rgba(170,150,120,0.25)' } : {}}
          >
            <div className="home-stats-num">{s.num}</div>
            <div className="home-stats-label">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="home-feature" aria-label="Vetted professionals">
        <div className="home-feature-img-wrap">
          <img src={spaFacial} alt="Facial treatment" className="home-feature-img" />
        </div>

        <div className="home-feature-copy">
          <span className="home-kicker">Every provider, verified</span>
          <h2 className="home-feature-heading">
            Vetted professionals,
            <br />
            <em>at your door.</em>
          </h2>
          <p className="home-feature-body">
            Every Glamify provider goes through a rigorous onboarding process — background
            checks, portfolio review, and client rating monitoring. You only see the best.
          </p>
          <ul className="home-feature-list">
            <li>Identity and insurance verified</li>
            <li>Real reviews from real clients</li>
            <li>Responsive and punctual, guaranteed</li>
          </ul>
        </div>
      </section>

      <TasselDrop color="var(--color-burgundy)" />

      <section className="home-feature home-feature-reverse" aria-label="Book on your schedule">
        <div className="home-feature-copy">
          <span className="home-kicker">Booking made easy</span>
          <h2 className="home-feature-heading">
            Your beauty routine,
            <br />
            <em>your schedule.</em>
          </h2>
          <p className="home-feature-body">
            Browse by service, district, or availability. Pick a time that works for you —
            morning, evening, or weekend. No waiting rooms, no commutes.
          </p>
          <ul className="home-feature-list">
            <li>Book in under two minutes</li>
            <li>Real-time availability across Riyadh</li>
            <li>Reschedule or cancel with ease</li>
          </ul>
        </div>

        <div className="home-feature-img-wrap">
          <img src={spaInterior} alt="Luxury spa interior" className="home-feature-img" />
        </div>
      </section>

      <TasselDrop color="var(--color-burgundy)" />

      <section id="discover" aria-label="Find beauty pros">
        <h2 className="section-heading">Browse services</h2>

        <div className="service-tile-row">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              type="button"
              className={`service-tile${category === c.key ? ' active' : ''}`}
              onClick={() => setCategory(c.key)}
            >
              <Icon name={c.icon} size="1.4rem" />
              <span className="service-tile-label">{c.key}</span>
            </button>
          ))}
        </div>

        <form
          className="search-row"
          onSubmit={e => {
            e.preventDefault();
          }}
          role="search"
          aria-label="Find beauty pros"
        >
          <div className="search-input-wrap">
            <Icon name="search" size="1rem" />
            <input
              type="text"
              placeholder="Search providers or services…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search providers"
            />
          </div>

          <button
            type="button"
            className={`btn btn-ghost btn-pill btn-sm filter-toggle${filtersOpen ? ' active' : ''}`}
            onClick={() => setFiltersOpen(v => !v)}
            aria-expanded={filtersOpen}
          >
            <Icon name="sliders" size="0.95rem" /> Filters
            {activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </button>
        </form>

        {filtersOpen && (
          <div className="filters-panel" role="region" aria-label="Filters">
            <label className="filters-field">
              <span className="form-label">Service</span>
              <select value={category} onChange={e => setCategory(e.target.value)} aria-label="Service">
                {CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>
                    {c.key}
                  </option>
                ))}
              </select>
            </label>

            <label className="filters-field">
              <span className="form-label">District</span>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                aria-label="District"
                disabled={IS_PLACEHOLDER_LIST}
              >
                <option value="">All districts</option>
                {DISTRICTS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.englishName}
                  </option>
                ))}
              </select>
            </label>

            <label className="filters-field">
              <span className="form-label">Date</span>
              <input
                type="date"
                value={searchDate}
                min={todayIso}
                onChange={e => setSearchDate(e.target.value)}
                aria-label="Date"
              />
            </label>

            {activeFilterCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setCategory('All');
                  setDistrict('');
                  setSearchDate('');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center',
            margin: '1rem 0',
          }}
        >
          <button
            type="button"
            onClick={handleNearMe}
            disabled={locating}
            className={`btn btn-pill btn-sm ${nearMe ? 'btn-primary' : 'btn-ghost'}`}
            aria-pressed={nearMe}
          >
            {locating && <span className="spinner" />}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Icon name="pin" size="0.85rem" /> {nearMe ? 'Near me · on' : 'Near me'}
            </span>
          </button>

          {coords && (
            <button
              type="button"
              onClick={handleClearLocation}
              className="btn btn-ghost btn-sm"
              title="Forget my location for this session"
            >
              Clear location
            </button>
          )}

          {nearMe && coords && (
            <span className="text-xs text-muted">Sorted by distance from your location.</span>
          )}
        </div>
      </section>

      <h2 className="section-heading" style={{ marginTop: '1.5rem' }}>
        Beauty pros near you
      </h2>

      {loading ? (
        <div className="provider-list">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="provider-row" style={{ cursor: 'default' }}>
              <div className="provider-row-avatar">
                <div className="skeleton-soft" style={{ width: 44, height: 44, borderRadius: '50%' }} />
              </div>

              <div className="provider-row-info">
                <div className="skeleton-soft" style={{ height: 18, borderRadius: 4, width: '45%' }} />
                <div className="skeleton-soft" style={{ height: 12, borderRadius: 4, width: '65%', marginTop: 6 }} />
              </div>

              <div className="provider-row-actions">
                <div className="skeleton-soft" style={{ height: 12, borderRadius: 4, width: 60 }} />
                <div className="skeleton-soft" style={{ height: 28, borderRadius: 14, width: 64, marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : visibleProviders.length === 0 ? (
        <div className="empty-state-editorial">
          <span className="kicker">Nothing here yet</span>

          {searchDate ? (
            <>
              <h3>No providers available on {searchDate}</h3>
              <p>Try a different date, or clear it to see everyone.</p>
            </>
          ) : (
            <>
              <h3>No providers match your search</h3>
              <p>Try a different service, district or keyword.</p>
            </>
          )}
        </div>
      ) : (
        <div className="provider-list">
          {visibleProviders.map(p => {
            const isFav = favourites.includes(String(p.id));

            return (
              <article
                key={String(p.id)}
                className="provider-row"
                onClick={() => navigate(`/client/provider/${p.id}`)}
              >
                <div className="provider-row-avatar">
                  <ProviderLogo name={p.name} category={p.category} logoUrl={p.logoUrl} size="md" />
                </div>

                <div className="provider-row-info">
                  <h4>{p.name}</h4>

                  <div className="provider-row-meta">
                    <span>{p.category}</span>
                    <span className="provider-row-meta-dot" />

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Icon name="pin" size="0.75rem" />
                      {p.location}
                      {typeof p._distanceKm === 'number' && <> · {formatDistance(p._distanceKm)} away</>}
                    </span>

                    <span className="provider-row-meta-dot" />
                    <span>{p.totalReviews} reviews</span>

                    {p.isAvailableToday && (
                      <>
                        <span className="provider-row-meta-dot" />
                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                          Available today
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="provider-row-actions">
                  <div className="provider-row-rating">
                    <Icon name="starFilled" size="0.78rem" style={{ color: 'var(--color-burgundy)' }} />
                    {p.averageRating?.toFixed(1) || '0.0'}
                  </div>

                  <span className="provider-row-price">
                    {p.startingPrice > 0 ? `From SAR ${p.startingPrice}` : 'Ask for price'}
                  </span>

                  <button
                    className="btn btn-primary btn-pill btn-sm"
                    onClick={e => {
                      e.stopPropagation();

                      if (!user) {
                        showSignInRequired();
                        return;
                      }

                      navigate(`/client/book?providerId=${p.id}`);
                    }}
                  >
                    Book
                  </button>
                </div>

                <button
                  className={`provider-row-fav${isFav ? ' fav-active' : ''}`}
                  onClick={e => {
                    e.stopPropagation();

                    if (!user) {
                      showSignInRequired();
                      return;
                    }

                    toggleFav(e, p.id);
                  }}
                  title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                  aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Icon name={isFav ? 'heartFilled' : 'heart'} size="1rem" />
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="home-newsletter" aria-label="Stay in touch">
        <span className="home-newsletter-kicker">Stay in the loop</span>
        <h2 className="home-newsletter-heading">
          New providers. New services.
          <br />
          First to know.
        </h2>
        <p className="home-newsletter-sub">
          Join our newsletter for curated beauty picks, new arrivals, and exclusive Riyadh offers.
        </p>

        {subscribed ? (
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic',
              fontSize: '1.1rem',
              color: 'rgba(232,226,212,0.9)',
              marginTop: '0.5rem',
            }}
          >
            You're on the list — thank you.
          </p>
        ) : (
          <form className="home-newsletter-form" onSubmit={handleSubscribe}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="home-newsletter-input"
              aria-label="Email address"
              required
            />
            <button type="submit" className="btn home-newsletter-btn">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
}