const RIYADH_BOUNDS = { latMin: 24.4, latMax: 25.1, lngMin: 46.3, lngMax: 47.1 };

function isWithinRiyadh(lat, lng) {
  return lat >= RIYADH_BOUNDS.latMin && lat <= RIYADH_BOUNDS.latMax &&
    lng >= RIYADH_BOUNDS.lngMin && lng <= RIYADH_BOUNDS.lngMax;
}

async function geocodeAddress(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}&limit=1&accept-language=en`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Glamify/1.0 (beauty booking app)' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

module.exports = { geocodeAddress, isWithinRiyadh };
