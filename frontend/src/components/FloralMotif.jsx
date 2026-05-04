export default function FloralMotif({ position = 'tl', color = 'currentColor', opacity }) {
  const style = opacity != null ? { opacity } : undefined;
  return (
    <div className={`floral-motif floral-motif-${position}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g stroke={color} strokeWidth="1.2" fill="none">
          <rect x="60" y="60" width="80" height="80" transform="rotate(45 100 100)" />
          <rect x="72" y="72" width="56" height="56" transform="rotate(45 100 100)" strokeDasharray="4 3" />
          <line x1="100" y1="30" x2="100" y2="170" strokeWidth="0.8" strokeOpacity="0.4" />
          <line x1="30" y1="100" x2="170" y2="100" strokeWidth="0.8" strokeOpacity="0.4" />
          <polygon points="100,44 108,56 100,68 92,56" fill={color} fillOpacity="0.25" stroke="none" />
          <polygon points="100,132 108,144 100,156 92,144" fill={color} fillOpacity="0.25" stroke="none" />
          <polygon points="44,100 56,108 68,100 56,92" fill={color} fillOpacity="0.25" stroke="none" />
          <polygon points="132,100 144,108 156,100 144,92" fill={color} fillOpacity="0.25" stroke="none" />
          <circle cx="100" cy="100" r="8" fill={color} fillOpacity="0.18" strokeWidth="1" />
          <circle cx="100" cy="100" r="3" fill={color} fillOpacity="0.4" stroke="none" />
          <path d="M56 56 L68 68" strokeWidth="0.8" strokeOpacity="0.5" />
          <path d="M144 56 L132 68" strokeWidth="0.8" strokeOpacity="0.5" />
          <path d="M56 144 L68 132" strokeWidth="0.8" strokeOpacity="0.5" />
          <path d="M144 144 L132 132" strokeWidth="0.8" strokeOpacity="0.5" />
        </g>
      </svg>
    </div>
  );
}
