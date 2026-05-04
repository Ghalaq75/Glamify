import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getCurrentPosition,
  reverseGeocode,
  isWithinRiyadh,
  GeolocationError,
} from '../utils/geolocation';
import Icon from './Icon';

const RIYADH_CENTER = { lat: 24.7136, lng: 46.6753 };

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.setView([coords.lat, coords.lng], 15, { animate: true });
  }, [coords, map]);
  return null;
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 0);
    const t2 = setTimeout(() => map.invalidateSize(), 250);
    const t3 = setTimeout(() => map.invalidateSize(), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [map]);
  return null;
}

export default function AddressPicker({
  value,
  onChange,
  placeholder = 'Your address in Riyadh',
  label,
  required = false,
  error = '',
  helpText = '',
}) {
  const [coords, setCoords] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pickError, setPickError] = useState('');
  const inflightRef = useRef(0);

  const handlePick = useCallback(async (c) => {
    setPickError('');
    if (!isWithinRiyadh(c.lat, c.lng)) {
      setPickError('Pin must be inside Riyadh. Please drop it within the city.');
      return;
    }
    // Drop the pin immediately for visual feedback.
    setCoords(c);
    const ticket = ++inflightRef.current;
    setBusy(true);
    try {
      const addr = await reverseGeocode(c.lat, c.lng);
      if (ticket === inflightRef.current) onChange(addr);
    } catch (err) {
      const msg = err instanceof GeolocationError ? err.message : 'Could not look up that address. Type it below.';
      if (ticket === inflightRef.current) setPickError(msg);
    } finally {
      if (ticket === inflightRef.current) setBusy(false);
    }
  }, [onChange]);

  async function useGps() {
    setBusy(true);
    setPickError('');
    try {
      const c = await getCurrentPosition();
      if (!isWithinRiyadh(c.lat, c.lng)) {
        setPickError('Your current location is outside Riyadh. Glamify only serves Riyadh.');
        return;
      }
      setCoords(c);
      const addr = await reverseGeocode(c.lat, c.lng);
      onChange(addr);
    } catch (err) {
      const msg = err instanceof GeolocationError ? err.message : 'Could not get your location.';
      setPickError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
      {label && (
        <label className="form-label">
          {label}{required && <span style={{ color: 'var(--color-danger, #c0392b)' }}> *</span>}
        </label>
      )}

      <div
        style={{
          height: 260,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          position: 'relative',
        }}
      >
        <MapContainer
          center={[coords?.lat || RIYADH_CENTER.lat, coords?.lng || RIYADH_CENTER.lng]}
          zoom={coords ? 15 : 11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePick} />
          {coords && <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />}
          <Recenter coords={coords} />
          <InvalidateOnMount />
        </MapContainer>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginTop: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={useGps}
          disabled={busy}
          title="Drop the pin on your current GPS location"
        >
          {busy && <span className="spinner" />}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Icon name="pin" size="0.85rem" /> Use my location
          </span>
        </button>
        <span className="text-xs text-muted">
          Tap on the map to drop a pin, or type the address below.
        </span>
      </div>

      <input
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { setPickError(''); onChange(e.target.value); }}
        aria-invalid={!!error}
        style={{ marginTop: '0.6rem' }}
      />

      {(error || pickError) && (
        <p style={{ color: 'var(--color-danger, #c0392b)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
          {error || pickError}
        </p>
      )}
      {helpText && !error && !pickError && (
        <p className="text-xs text-muted" style={{ marginTop: '0.35rem' }}>{helpText}</p>
      )}
    </div>
  );
}
