const Provider = require('../models/Provider');
const User = require('../models/User');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const { isValidIsoDate, getBookableSlotsForDate } = require('../utils/slots');

async function listProviders(req, res) {
  const { category, search, maxPrice, date } = req.query;

  if (date !== undefined && date !== '' && !isValidIsoDate(date)) {
    return res.status(400).json({ success: false, message: 'Date must be in YYYY-MM-DD format.' });
  }

  const approvedProviders = await Provider.find({ approvalStatus: 'approved' }).lean();
  const userIds = approvedProviders.map(p => p.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = {};
  users.forEach(u => { userMap[String(u._id)] = u; });

  const allServices = await Service.find({ isActive: true }).lean();
  const servicesByProvider = {};
  allServices.forEach(s => {
    const pid = String(s.providerId);
    if (!servicesByProvider[pid]) servicesByProvider[pid] = [];
    servicesByProvider[pid].push(s);
  });

  let availableProviderIds = null;
  if (date) {
    const providerIds = approvedProviders.map(p => p._id);
    const [availDocs, bookings] = await Promise.all([
      Availability.find({ providerId: { $in: providerIds } }).lean(),
      Booking.find({
        providerId: { $in: providerIds },
        date,
        status: { $in: ['pending', 'confirmed', 'rescheduled'] },
      }).lean(),
    ]);
    const availByProvider = {};
    availDocs.forEach(a => { availByProvider[String(a.providerId)] = a; });
    const bookingsByProvider = {};
    bookings.forEach(b => {
      const k = String(b.providerId);
      if (!bookingsByProvider[k]) bookingsByProvider[k] = [];
      bookingsByProvider[k].push(b);
    });
    availableProviderIds = new Set(
      providerIds
        .filter((pid) => {
          const slots = getBookableSlotsForDate({
            availabilityDoc: availByProvider[String(pid)] || null,
            bookings: bookingsByProvider[String(pid)] || [],
            date,
          });
          return slots.length > 0;
        })
        .map(String)
    );
  }

  let providerList = approvedProviders.map(p => {
    const user = userMap[String(p.userId)] || {};
    const pServices = servicesByProvider[String(p._id)] || [];
    const startingPrice = pServices.length > 0 ? Math.min(...pServices.map(s => s.price)) : 0;
    const categoriesList = (Array.isArray(p.categories) && p.categories.length)
      ? p.categories
      : (p.category ? [p.category] : []);
    return {
      id: p._id,
      name: user.name || '',
      category: p.category,
      categories: categoriesList,
      location: p.location,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews,
      bio: p.bio,
      logoUrl: p.logoUrl || null,
      latitude: p.latitude || null,
      longitude: p.longitude || null,
      startingPrice,
      isAvailableToday: true,
    };
  });

  if (availableProviderIds) {
    providerList = providerList.filter(p => availableProviderIds.has(String(p.id)));
  }
  if (category && category !== 'all') {
    const cat = String(category).toLowerCase();
    providerList = providerList.filter(p => {
      if (p.categories.some(c => c.toLowerCase().includes(cat))) return true;
      const pServices = servicesByProvider[String(p.id)] || [];
      return pServices.some(s => s.category && s.category.toLowerCase().includes(cat));
    });
  }
  if (search) {
    const s = String(search).toLowerCase();
    providerList = providerList.filter(p => p.name.toLowerCase().includes(s) || p.categories.some(c => c.toLowerCase().includes(s)));
  }
  if (maxPrice) {
    providerList = providerList.filter(p => p.startingPrice <= Number(maxPrice));
  }

  return res.json({ success: true, data: providerList, message: '' });
}

async function getProvider(req, res) {
  const provider = await Provider.findById(req.params.providerId).lean();
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const user = await User.findById(provider.userId).lean();
  return res.json({
    success: true,
    data: {
      id: provider._id,
      name: user ? user.name : '',
      category: provider.category,
      categories: (Array.isArray(provider.categories) && provider.categories.length)
        ? provider.categories
        : (provider.category ? [provider.category] : []),
      location: provider.location,
      averageRating: provider.averageRating,
      totalReviews: provider.totalReviews,
      totalCompleted: provider.totalCompleted,
      yearsActive: provider.yearsActive,
      bio: provider.bio,
      specialties: provider.specialties,
      approvalStatus: provider.approvalStatus,
      isApproved: provider.approvalStatus === 'approved',
      logoUrl: provider.logoUrl || null,
      latitude: provider.latitude || null,
      longitude: provider.longitude || null,
      coverageRadiusKm: provider.coverageRadiusKm || 10,
    },
    message: '',
  });
}

async function getProviderServices(req, res) {
  const services = await Service.find({ providerId: req.params.providerId, isActive: true }).lean();
  return res.json({ success: true, data: services.map(s => ({ ...s, id: s._id })), message: '' });
}

async function getProviderReviews(req, res) {
  const reviews = await Review.find({ providerId: req.params.providerId }).lean();
  const userIds = reviews.map(r => r.clientId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = {};
  users.forEach(u => { userMap[String(u._id)] = u; });
  return res.json({
    success: true,
    data: reviews.map(r => ({
      id: r._id,
      bookingId: r.bookingId,
      clientId: r.clientId,
      providerId: r.providerId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      clientName: userMap[String(r.clientId)]?.name || '',
    })),
    message: '',
  });
}

module.exports = { listProviders, getProvider, getProviderServices, getProviderReviews };
