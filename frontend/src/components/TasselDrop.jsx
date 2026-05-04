export default function TasselDrop({ color = 'currentColor' }) {
  return (
    <div className="editorial-rule" aria-hidden="true">
      <div className="editorial-rule-medallion">
        <svg viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="12,0 16,5 12,10 8,5" fill={color} fillOpacity="0.4" />
          <line x1="12" y1="10" x2="12" y2="28" stroke={color} strokeWidth="1.2" />
          <circle cx="12" cy="14" r="1.5" fill={color} fillOpacity="0.5" />
          <circle cx="12" cy="20" r="1.5" fill={color} fillOpacity="0.4" />
          <circle cx="12" cy="26" r="1.5" fill={color} fillOpacity="0.3" />
          <polygon points="12,28 16,33 12,38 8,33" fill={color} fillOpacity="0.35" />
          <line x1="8" y1="33" x2="4" y2="38" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
          <line x1="16" y1="33" x2="20" y2="38" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" />
        </svg>
      </div>
    </div>
  );
}
