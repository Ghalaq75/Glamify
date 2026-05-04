const COMMON = {
  width: '1em',
  height: '1em',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const PATHS = {
  check: <polyline points="4 12 10 18 20 6" />,
  x: <g><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></g>,
  warning: <g><path d="M12 3 L22 20 H2 Z" /><line x1="12" y1="10" x2="12" y2="14" /><circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" /></g>,
  sparkle: <g><path d="M12 3 L13.4 10.6 L21 12 L13.4 13.4 L12 21 L10.6 13.4 L3 12 L10.6 10.6 Z" fill="currentColor" stroke="none" /></g>,
  home: <g><path d="M3 11 L12 4 L21 11 V20 H14 V14 H10 V20 H3 Z" /></g>,
  calendar: <g><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></g>,
  heart: <path d="M12 20 C 12 20, 4 14.5, 4 9 A 4.5 4.5 0 0 1 12 7 A 4.5 4.5 0 0 1 20 9 C 20 14.5, 12 20, 12 20 Z" />,
  heartFilled: <path d="M12 20 C 12 20, 4 14.5, 4 9 A 4.5 4.5 0 0 1 12 7 A 4.5 4.5 0 0 1 20 9 C 20 14.5, 12 20, 12 20 Z" fill="currentColor" />,
  bell: <g><path d="M6 9 a6 6 0 0 1 12 0 v4 l2 3 H4 l2-3 Z" /><path d="M10 19 a2 2 0 0 0 4 0" /></g>,
  user: <g><circle cx="12" cy="8" r="4" /><path d="M4 21 c0-4 4-7 8-7 s8 3 8 7" /></g>,
  users: <g><circle cx="9" cy="9" r="3.5" /><path d="M3 20 c0-3 3-5 6-5 s6 2 6 5" /><circle cx="17" cy="10" r="2.8" /><path d="M15 16 c2-1 6 0 6 4" /></g>,
  scissors: <g><circle cx="6" cy="7" r="2.5" /><circle cx="6" cy="17" r="2.5" /><line x1="8" y1="8.5" x2="20" y2="18" /><line x1="8" y1="15.5" x2="20" y2="6" /></g>,
  clock: <g><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></g>,
  money: <g><circle cx="12" cy="12" r="9" /><path d="M9 14 c0 1.5 1.5 2 3 2 s3-.5 3-2-1.5-2-3-2-3-.5-3-2 1.5-2 3-2 3 .5 3 2" /><line x1="12" y1="6" x2="12" y2="8" /><line x1="12" y1="16" x2="12" y2="18" /></g>,
  card: <g><rect x="3" y="6" width="18" height="13" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></g>,
  wallet: <g><path d="M3 7 a2 2 0 0 1 2-2 h12 a2 2 0 0 1 2 2 v1" /><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="17" cy="13.5" r="1.2" fill="currentColor" stroke="none" /></g>,
  dashboard: <g><rect x="3" y="3" width="8" height="10" rx="1.5" /><rect x="13" y="3" width="8" height="6" rx="1.5" /><rect x="13" y="11" width="8" height="10" rx="1.5" /><rect x="3" y="15" width="8" height="6" rx="1.5" /></g>,
  gavel: <g><path d="M14 3 l7 7 -3 3 -7 -7 z" /><line x1="11" y1="6" x2="17" y2="12" /><line x1="9" y1="11" x2="13" y2="15" /><line x1="3" y1="21" x2="13" y2="11" /></g>,
  refund: <g><polyline points="9 7 4 12 9 17" /><path d="M4 12 h11 a5 5 0 0 1 0 10 H8" /></g>,
  doorOpen: <g><path d="M5 21 V5 a2 2 0 0 1 2-2 h6 v18" /><line x1="13" y1="21" x2="19" y2="21" /><circle cx="11" cy="12" r="0.7" fill="currentColor" stroke="none" /></g>,
  pin: <g><path d="M12 22 s7-7 7-12 a7 7 0 0 0-14 0 c0 5 7 12 7 12 z" /><circle cx="12" cy="10" r="2.5" /></g>,
  gift: <g><rect x="3" y="9" width="18" height="11" rx="1.5" /><line x1="3" y1="13" x2="21" y2="13" /><line x1="12" y1="9" x2="12" y2="20" /><path d="M8 9 a2.5 2.5 0 0 1 0-5 c2 0 4 5 4 5 s2-5 4-5 a2.5 2.5 0 0 1 0 5" /></g>,
  cash: <g><rect x="2" y="7" width="20" height="11" rx="1.5" /><circle cx="12" cy="12.5" r="2.5" /></g>,
  leaf: <g><path d="M5 19 C 5 9 13 4 20 4 c0 8-5 16-15 16 z" /><line x1="5" y1="19" x2="13" y2="11" /></g>,
  eye: <g><path d="M2 12 c3-5 6-7 10-7 s7 2 10 7 c-3 5-6 7-10 7 s-7-2-10-7 z" /><circle cx="12" cy="12" r="3" /></g>,
  brush: <g><path d="M14 4 l6 6 -8 8 -6 0 0-6 z" /><line x1="14" y1="4" x2="20" y2="10" /></g>,
  lipstick: <g><rect x="9" y="3" width="6" height="7" rx="1" /><rect x="7" y="10" width="10" height="11" rx="1.5" /></g>,
  party: <g><path d="M3 21 l4-13 13 4 z" /><line x1="7" y1="8" x2="14" y2="15" /><circle cx="14" cy="6" r="0.8" fill="currentColor" stroke="none" /><circle cx="18" cy="3" r="0.8" fill="currentColor" stroke="none" /><circle cx="20" cy="9" r="0.8" fill="currentColor" stroke="none" /></g>,
  facial: <g><circle cx="12" cy="12" r="8" /><circle cx="9.5" cy="11" r="0.7" fill="currentColor" stroke="none" /><circle cx="14.5" cy="11" r="0.7" fill="currentColor" stroke="none" /><path d="M9 15 c1 1.2 5 1.2 6 0" /></g>,
  approved: <g><circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" /></g>,
  rejected: <g><circle cx="12" cy="12" r="9" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></g>,
  star: <polygon points="12 3 14.6 9.6 21.5 10.2 16.2 14.7 17.9 21.4 12 17.7 6.1 21.4 7.8 14.7 2.5 10.2 9.4 9.6" />,
  starFilled: <polygon points="12 3 14.6 9.6 21.5 10.2 16.2 14.7 17.9 21.4 12 17.7 6.1 21.4 7.8 14.7 2.5 10.2 9.4 9.6" fill="currentColor" />,
  search: <g><circle cx="11" cy="11" r="7" /><line x1="16" y1="16" x2="21" y2="21" /></g>,
  menu: <g><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></g>,
  chevronLeft: <polyline points="15 6 9 12 15 18" />,
  sliders: <g><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /><circle cx="9" cy="7" r="2" fill="var(--color-bg, #fff)" /><circle cx="15" cy="12" r="2" fill="var(--color-bg, #fff)" /><circle cx="8" cy="17" r="2" fill="var(--color-bg, #fff)" /></g>,
};

export default function Icon({ name, size = '1em', color, className, style, title }) {
  const path = PATHS[name];
  if (!path) return null;
  const merged = { ...style, width: size, height: size, color, display: 'inline-block', verticalAlign: '-0.15em' };
  return (
    <svg {...COMMON} style={merged} className={className} role={title ? 'img' : undefined} aria-label={title}>
      {path}
    </svg>
  );
}
