const CATEGORY_COLORS = {
  Hair: ['#c8956c', '#fff'],
  Skin: ['#e8c5a0', '#7d4e1f'],
  Nails: ['#e89bc8', '#5c1a3a'],
  Wellness: ['#a0c8a8', '#1a4d24'],
  Lashes: ['#9b8ec4', '#2c1a5c'],
  Makeup: ['#e87a6a', '#5c1a14'],
  Default: ['#b0a89e', '#fff'],
};

const SIZE_MAP = {
  sm: { size: 48, font: '1.1rem' },
  md: { size: 64, font: '1.4rem' },
  lg: { size: 80, font: '1.8rem' },
  xl: { size: 96, font: '2.2rem' },
};

export default function ProviderLogo({ name = '', category = '', logoUrl, size = 'md' }) {
  const [bg, text] = CATEGORY_COLORS[category] || CATEGORY_COLORS.Default;
  const { size: px, font } = SIZE_MAP[size] || SIZE_MAP.md;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (logoUrl) {
    return (
      <div className="logo-avatar" style={{ width: px, height: px, background: bg }}>
        <img src={logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div className="logo-avatar" style={{ width: px, height: px, background: bg, color: text, fontSize: font }}>
      {initials}
    </div>
  );
}
