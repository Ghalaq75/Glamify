const Provider = require('../models/Provider');
const User = require('../models/User');
const Service = require('../models/Service');
const Review = require('../models/Review');

async function listProviders(req, res) {
  const { category, search, maxPrice } = req.query;

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

  let providerList = approvedProviders.map(p => {
    const user = userMap[String(p.userId)] || {};
    const pServices = servicesByProvider[String(p._id)] || [];
    const startingPrice = pServices.length > 0 ? Math.min(...pServices.map(s => s.price)) : 0;
    return {
      id: p._id,
      name: user.name || '',
      category: p.category,
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

  if (category && category !== 'all') {
    const cat = String(category).toLowerCase();
    providerList = providerList.filter(p => {
      if (p.category.toLowerCase().includes(cat)) return true;
      const pServices = servicesByProvider[String(p.id)] || [];
      return pServices.some(s => s.category && s.category.toLowerCase().includes(cat));
    });
  }
  if (search) {
    const s = String(search).toLowerCase();
    providerList = providerList.filter(p => p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s));
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
