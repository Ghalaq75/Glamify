export class GeolocationError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
  }
}

const RIYADH_BOUNDS = { latMin: 24.4, latMax: 25.1, lngMin: 46.3, lngMax: 47.1 };
const SESSION_COORDS_KEY = 'glamify.clientCoords';
const SESSION_NEAR_ME_KEY = 'glamify.nearMeActive';
const REVERSE_CACHE_TTL_MS = 5 * 60 * 1000;
const _reverseCache = new Map();
let _reverseInflight = null;
let _reverseLastCall = 0;

export function isWithinRiyadh(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  return (
    lat >= RIYADH_BOUNDS.latMin && lat <= RIYADH_BOUNDS.latMax &&
    lng >= RIYADH_BOUNDS.lngMin && lng <= RIYADH_BOUNDS.lngMax
  );
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new GeolocationError('unsupported', 'Geolocation is not supported by this browser.'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        if (err.code === 1) reject(new GeolocationError('permission_denied', 'Location permission denied.'));
        else if (err.code === 3) reject(new GeolocationError('timeout', 'Location request timed out.'));
        else reject(new GeolocationError('unavailable', 'Location unavailable. Please try again.'));
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  });
}

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
  if (typeof km !== 'number' || !Number.isFinite(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export async function reverseGeocode(lat, lng) {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = _reverseCache.get(key);
  if (cached && Date.now() - cached.at < REVERSE_CACHE_TTL_MS) return cached.value;
  if (_reverseInflight && _reverseInflight.key === key) return _reverseInflight.promise;

  const wait = Math.max(0, 1100 - (Date.now() - _reverseLastCall));
  const promise = (async () => {
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    _reverseLastCall = Date.now();
    let res;
    try {
      res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
    } catch (err) {
      throw new GeolocationError('reverse_failed', 'Could not look up the address. Please type it in.');
    }
    if (!res.ok) throw new GeolocationError('reverse_failed', 'Could not look up the address. Please type it in.');
    const data = await res.json();
    const display = data && (data.display_name || '');
    if (!display) throw new GeolocationError('reverse_failed', 'No address found at that location.');
    _reverseCache.set(key, { value: display, at: Date.now() });
    return display;
  })();

  _reverseInflight = { key, promise };
  try {
    return await promise;
  } finally {
    if (_reverseInflight && _reverseInflight.key === key) _reverseInflight = null;
  }
}

export function getSessionClientCoords() {
  try {
    const raw = sessionStorage.getItem(SESSION_COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setSessionClientCoords(coords) {
  try {
    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
      sessionStorage.setItem(SESSION_COORDS_KEY, JSON.stringify({ lat: coords.lat, lng: coords.lng }));
    } else {
      sessionStorage.removeItem(SESSION_COORDS_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearSessionClientCoords() {
  setSessionClientCoords(null);
  setNearMeActive(false);
}

export function isNearMeActive() {
  try {
    return sessionStorage.getItem(SESSION_NEAR_ME_KEY) === '1';
  } catch {
    return false;
  }
}

export function setNearMeActive(on) {
  try {
    if (on) sessionStorage.setItem(SESSION_NEAR_ME_KEY, '1');
    else sessionStorage.removeItem(SESSION_NEAR_ME_KEY);
  } catch {
    /* ignore */
  }
}
