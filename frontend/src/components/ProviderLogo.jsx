const CATEGORY_COLORS = {
  Hair: ['#C99876', '#fff'],
  Skin: ['#F2D8C2', '#7A4A2C'],
  Nails: ['#E8B796', '#5A2E14'],
  Wellness: ['#B7C8A8', '#3F5A33'],
  Lashes: ['#D8B192', '#3A2418'],
  Makeup: ['#C97A66', '#fff'],
  Default: ['#D8C3B0', '#3A2418'],
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
