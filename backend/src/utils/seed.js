const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Availability = require('../models/Availability');

const DEFAULT_PASSWORD = 'password';

const WORK_DAYS_STD = {
  Sunday: false, Monday: true, Tuesday: true, Wednesday: true,
  Thursday: true, Friday: true, Saturday: false,
};
const WORK_DAYS_WEEKEND = {
  Sunday: true, Monday: false, Tuesday: true, Wednesday: true,
  Thursday: true, Friday: true, Saturday: true,
};

const CLIENTS = [
  { email: 'client@glamify.sa', name: 'Layla Al-Harbi', phone: '+966501112233' },
  { email: 'aisha@glamify.sa', name: 'Aisha Al-Qahtani', phone: '+966502223344' },
  { email: 'noura@glamify.sa', name: 'Noura Al-Saud', phone: '+966503334455' },
  { email: 'sara@glamify.sa', name: 'Sara Al-Ghamdi', phone: '+966504445566' },
];

const ADMIN = { email: 'admin@glamify.sa', name: 'Glamify Admin', phone: '+966500000000' };

const PROVIDERS = [
  {
    email: 'provider@glamify.sa', name: 'Maison Lina',
    phone: '+966551110001', location: 'al-olaya', latitude: 24.6948, longitude: 46.6797,
    categories: ['Hair'], category: 'Hair',
    bio: 'Premium hair stylist specialising in keratin, balayage and bridal looks. 8+ years dressing Riyadh\'s most discerning clients.',
    specialties: ['Keratin Treatment', 'Balayage', 'Bridal Hair'],
    yearsActive: 8, averageRating: 4.9, totalReviews: 312, totalCompleted: 740,
    workDays: WORK_DAYS_STD,
    services: [
      { name: 'Signature Blowout', category: 'Hair', duration: 60, price: 220 },
      { name: 'Keratin Treatment', category: 'Hair', duration: 180, price: 850 },
      { name: 'Bridal Hair Styling', category: 'Hair', duration: 120, price: 1200 },
    ],
  },
  {
    email: 'rana.skin@glamify.sa', name: 'Rana Skin Studio',
    phone: '+966551110002', location: 'al-malqa', latitude: 24.8003, longitude: 46.6111,
    categories: ['Skin'], category: 'Skin',
    bio: 'Licensed esthetician offering hydrafacials, chemical peels and bespoke skincare for the Riyadh climate.',
    specialties: ['HydraFacial', 'Chemical Peel', 'LED Therapy'],
    yearsActive: 6, averageRating: 4.8, totalReviews: 198, totalCompleted: 510,
    workDays: WORK_DAYS_STD,
    services: [
      { name: 'Signature HydraFacial', category: 'Skin', duration: 75, price: 480 },
      { name: 'Glow Peel', category: 'Skin', duration: 60, price: 350 },
      { name: 'Anti-Aging LED Facial', category: 'Skin', duration: 90, price: 620 },
    ],
  },
  {
    email: 'noor.nails@glamify.sa', name: 'Noor Nail Atelier',
    phone: '+966551110003', location: 'al-yasmin', latitude: 24.8344, longitude: 46.6383,
    categories: ['Nails'], category: 'Nails',
    bio: 'Boutique mani-pedi service with a curated palette of nude-rose, jewel tones and chrome finishes.',
    specialties: ['Gel Manicure', 'Russian Pedicure', 'Nail Art'],
    yearsActive: 4, averageRating: 4.95, totalReviews: 256, totalCompleted: 612,
    workDays: WORK_DAYS_WEEKEND,
    services: [
      { name: 'Classic Gel Manicure', category: 'Nails', duration: 60, price: 180 },
      { name: 'Russian Pedicure', category: 'Nails', duration: 75, price: 240 },
      { name: 'Mani + Pedi Combo', category: 'Nails', duration: 120, price: 380 },
    ],
  },
  {
    email: 'huda.lashes@glamify.sa', name: 'Huda Lash Lounge',
    phone: '+966551110004', location: 'al-narjis', latitude: 24.8541, longitude: 46.6623,
    categories: ['Lashes'], category: 'Lashes',
    bio: 'Certified lash artist specialising in volume, hybrid and wispy mega-volume sets. Premium Korean lash imports.',
    specialties: ['Volume Lashes', 'Hybrid Set', 'Lash Lift'],
    yearsActive: 5, averageRating: 4.85, totalReviews: 174, totalCompleted: 430,
    workDays: WORK_DAYS_STD,
    services: [
      { name: 'Classic Lash Set', category: 'Lashes', duration: 90, price: 320 },
      { name: 'Volume Lash Set', category: 'Lashes', duration: 120, price: 480 },
      { name: 'Lash Lift + Tint', category: 'Lashes', duration: 60, price: 220 },
    ],
  },
  {
    email: 'reem.makeup@glamify.sa', name: 'Reem Makeup Artistry',
    phone: '+966551110005', location: 'al-rabi', latitude: 24.7869, longitude: 46.6489,
    categories: ['Makeup'], category: 'Makeup',
    bio: 'Bridal and editorial makeup artist. Trained in Paris, with 10 years of weddings, fashion shoots and red-carpet looks.',
    specialties: ['Bridal Makeup', 'Editorial', 'Soft Glam'],
    yearsActive: 10, averageRating: 4.95, totalReviews: 402, totalCompleted: 920,
    workDays: WORK_DAYS_WEEKEND,
    services: [
      { name: 'Soft Glam Look', category: 'Makeup', duration: 75, price: 550 },
      { name: 'Bridal Makeup Trial', category: 'Makeup', duration: 90, price: 750 },
      { name: 'Full Bridal Day-Of', category: 'Makeup', duration: 150, price: 2400 },
    ],
  },
  {
    email: 'mira.wellness@glamify.sa', name: 'Mira Wellness Spa',
    phone: '+966551110006', location: 'al-malaz', latitude: 24.6708, longitude: 46.7522,
    categories: ['Wellness'], category: 'Wellness',
    bio: 'Holistic at-home spa rituals: deep tissue massage, hammam scrubs and aromatherapy designed to reset your week.',
    specialties: ['Deep Tissue Massage', 'Moroccan Hammam', 'Aromatherapy'],
    yearsActive: 7, averageRating: 4.9, totalReviews: 221, totalCompleted: 565,
    workDays: WORK_DAYS_STD,
    services: [
      { name: 'Deep Tissue Massage (60 min)', category: 'Wellness', duration: 60, price: 380 },
      { name: 'Moroccan Hammam Ritual', category: 'Wellness', duration: 90, price: 520 },
      { name: 'Aromatherapy Massage (90 min)', category: 'Wellness', duration: 90, price: 480 },
    ],
  },
  {
    email: 'duo.glow@glamify.sa', name: 'Duo Glow Studio',
    phone: '+966551110007', location: 'al-sulaymaniyah', latitude: 24.7011, longitude: 46.7058,
    categories: ['Skin', 'Makeup'], category: 'Skin',
    bio: 'Two-artist team offering same-visit facial + makeup combos. Perfect for events, photo shoots and date nights.',
    specialties: ['Glass Skin Facial', 'Event Glam', 'Photoshoot Prep'],
    yearsActive: 3, averageRating: 4.8, totalReviews: 89, totalCompleted: 210,
    workDays: WORK_DAYS_WEEKEND,
    services: [
      { name: 'Glass Skin Facial', category: 'Skin', duration: 60, price: 420 },
      { name: 'Event Glam Makeup', category: 'Makeup', duration: 60, price: 480 },
      { name: 'Facial + Makeup Combo', category: 'Makeup', duration: 120, price: 820 },
    ],
  },
  {
    email: 'salma.hair@glamify.sa', name: 'Salma Hair Couture',
    phone: '+966551110008', location: 'al-murooj', latitude: 24.7558, longitude: 46.6717,
    categories: ['Hair', 'Makeup'], category: 'Hair',
    bio: 'Hair and updo specialist for weddings and gala events. Famous for textured chignons and Hollywood waves.',
    specialties: ['Bridal Updo', 'Hollywood Waves', 'Hair Color'],
    yearsActive: 9, averageRating: 4.88, totalReviews: 267, totalCompleted: 680,
    workDays: WORK_DAYS_WEEKEND,
    services: [
      { name: 'Hollywood Waves', category: 'Hair', duration: 75, price: 280 },
      { name: 'Bridal Updo', category: 'Hair', duration: 90, price: 950 },
      { name: 'Color + Style', category: 'Hair', duration: 180, price: 780 },
    ],
  },
];

async function ensureUser({ email, name, phone, role, passwordHash }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return existing;
  return User.create({
    email: email.toLowerCase(),
    name,
    phone: phone || null,
    role,
    passwordHash,
  });
}

async function seedDemoData() {
  const existingProviderUsers = await User.countDocuments({ role: 'provider' });
  if (existingProviderUsers >= PROVIDERS.length) {
    console.log('[seed] Demo data already present, skipping.');
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await ensureUser({ ...ADMIN, role: 'admin', passwordHash });

  for (const c of CLIENTS) {
    await ensureUser({ ...c, role: 'client', passwordHash });
  }

  for (const p of PROVIDERS) {
    const user = await ensureUser({
      email: p.email, name: p.name, phone: p.phone, role: 'provider', passwordHash,
    });

    let provider = await Provider.findOne({ userId: user._id });
    if (!provider) {
      provider = await Provider.create({
        userId: user._id,
        category: p.category,
        categories: p.categories,
        location: p.location,
        latitude: p.latitude,
        longitude: p.longitude,
        coverageRadiusKm: 15,
        bio: p.bio,
        specialties: p.specialties,
        yearsActive: p.yearsActive,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
        totalCompleted: p.totalCompleted,
        approvalStatus: 'approved',
        documents: ['ID Verified', 'Portfolio', 'License'],
      });
    } else if (provider.latitude == null || provider.longitude == null) {
      provider.latitude = p.latitude;
      provider.longitude = p.longitude;
      if (!provider.coverageRadiusKm) provider.coverageRadiusKm = 15;
      await provider.save();
    }

    const existingServiceCount = await Service.countDocuments({ providerId: provider._id });
    if (existingServiceCount === 0) {
      for (const s of p.services) {
        await Service.create({ providerId: provider._id, ...s, isActive: true });
      }
    }

    const existingAvail = await Availability.findOne({ providerId: provider._id });
    if (!existingAvail) {
      await Availability.create({
        providerId: provider._id,
        workDaysJson: JSON.stringify(p.workDays),
        offSlotsJson: '{}',
      });
    }
  }

  console.log(`[seed] Demo data ready: ${CLIENTS.length} clients, ${PROVIDERS.length} providers, 1 admin. Password: "${DEFAULT_PASSWORD}"`);
}

const DEMO_PASSWORD = 'password';

const DEMO_ACCOUNTS = [
  { email: 'demo-client@glamify.app', name: 'Demo Client', phone: '+966500000001', role: 'client' },
  { email: 'demo-provider@glamify.app', name: 'Demo Provider', phone: '+966500000002', role: 'provider' },
  { email: 'demo-admin@glamify.app', name: 'Demo Admin', phone: '+966500000003', role: 'admin' },
];

const DEMO_PROVIDER_PROFILE = {
  category: 'Hair',
  categories: ['Hair'],
  location: 'al-olaya',
  latitude: 24.6948,
  longitude: 46.6797,
  coverageRadiusKm: 15,
  bio: 'Demo provider account for testing. Explore the provider dashboard, manage services, and handle bookings.',
  specialties: ['Demo Service'],
  yearsActive: 1,
  averageRating: 5.0,
  totalReviews: 0,
  totalCompleted: 0,
  approvalStatus: 'approved',
  documents: ['ID Verified'],
};

async function seedDemoAccounts() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const acc of DEMO_ACCOUNTS) {
    const user = await User.findOneAndUpdate(
      { email: acc.email.toLowerCase() },
      { $set: { name: acc.name, phone: acc.phone, role: acc.role, passwordHash } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (acc.role === 'provider') {
      await Provider.findOneAndUpdate(
        { userId: user._id },
        { $set: { ...DEMO_PROVIDER_PROFILE } },
        { upsert: true, new: true },
      );
    }
  }

  console.log(`[seed] Demo quick-fill accounts ready. Email suffix: @glamify.app, password: "${DEMO_PASSWORD}"`);
}

module.exports = { seedDemoData, seedDemoAccounts };
