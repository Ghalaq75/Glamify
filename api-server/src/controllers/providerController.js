const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Availability = require('../models/Availability');
const ProviderDocument = require('../models/ProviderDocument');
const Payout = require('../models/Payout');
const Notification = require('../models/Notification');
const { sendGiftNotification } = require('../utils/giftNotification');
const {
  isValidDistrictId,
  IS_PLACEHOLDER_LIST,
  PLACEHOLDER_ERROR_MESSAGE,
} = require('@workspace/riyadh-districts');

async function getProviderForUser(userId) {
  return Provider.findOne({ userId }).lean();
}

async function getBookingFull(bookingId) {
  const b = await Booking.findById(bookingId).lean();
  if (!b) return null;
  const client = await User.findById(b.clientId).lean();
  const service = await Service.findById(b.serviceId).lean();
  const provider = await Provider.findById(b.providerId).lean();
  const provUser = provider ? await User.findById(provider.userId).lean() : null;
  return {
    id: b._id,
    clientId: b.clientId,
    providerId: b.providerId,
    serviceId: b.serviceId,
    date: b.date,
    timeSlot: b.timeSlot,
    address: b.address,
    notes: b.notes,
    status: b.status,
    totalPrice: b.totalPrice,
    platformFee: b.platformFee,
    createdAt: b.createdAt,
    clientName: client ? client.name : '',
    clientPhone: b.status === 'confirmed' ? (client ? client.phone : null) : null,
    serviceName: service ? service.name : '',
    providerName: provUser ? provUser.name : '',
    providerPhone: null,
    isGift: b.isGift,
    recipientName: b.recipientName,
    recipientPhone: b.recipientPhone,
    recipientAddress: b.recipientAddress,
    giftMessage: b.giftMessage,
    hidePriceFromRecipient: b.hidePriceFromRecipient,
  };
}

async function getDashboard(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

  const today = new Date().toISOString().split('T')[0];
  const allBookings = await Booking.find({ providerId: provider._id }).lean();
  const todayBookings = await Promise.all(allBookings.filter(b => b.date === today).map(b => getBookingFull(b._id)));
  const pendingCount = allBookings.filter(b => b.status === 'pending').length;
  const confirmedTodayCount = allBookings.filter(b => b.date === today && b.status === 'confirmed').length;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const completedAllTime = allBookings.filter(b => b.status === 'completed').length;
  const totalEarningsThisMonth = allBookings
    .filter(b => b.date >= monthStart && b.status === 'completed')
    .reduce((a, b) => a + b.totalPrice * 0.9, 0);

  return res.json({
    success: true,
    data: { todayBookings: todayBookings.filter(Boolean), pendingCount, confirmedTodayCount, totalEarningsThisMonth, completedAllTime },
    message: '',
  });
}

async function listBookings(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const query = { providerId: provider._id };
  if (req.query.status) query.status = req.query.status;
  const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();
  const result = await Promise.all(bookings.map(b => getBookingFull(b._id)));
  return res.json({ success: true, data: result.filter(Boolean), message: '' });
}

async function updateBookingStatus(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

  const bookingId = req.params.bookingId;
  const { status } = req.body;
  const booking = await Booking.findOne({ _id: bookingId, providerId: provider._id }).lean();
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

  await Booking.findByIdAndUpdate(bookingId, { status });

  if (status === 'completed') {
    await Provider.findByIdAndUpdate(provider._id, { $inc: { totalCompleted: 1 } });
  }

  const provUserRow = await User.findById(provider.userId).lean();
  const provPhone = provUserRow ? provUserRow.phone : null;

  const notifMap = {
    confirmed: { title: 'Booking Confirmed', message: `Your appointment has been confirmed!${provPhone ? ` You can reach your provider at ${provPhone}.` : ''}` },
    rejected: { title: 'Booking Rejected', message: 'Unfortunately, the provider was unable to accept your booking request.' },
    completed: { title: 'Appointment Completed', message: "Your appointment is marked as completed. We'd love to hear your feedback!" },
  };

  const notifData = notifMap[status];
  if (notifData && booking.clientId) {
    await Notification.create({
      userId: booking.clientId,
      type: `booking_${status}`,
      title: notifData.title,
      message: notifData.message,
      bookingId: booking._id,
    });
  }

  if (status === 'confirmed' && booking.status !== 'confirmed' && booking.isGift && booking.recipientPhone) {
    const service = await Service.findById(booking.serviceId).lean();
    const provNameRow = await User.findById(provider.userId).lean();
    sendGiftNotification({
      recipientPhone: booking.recipientPhone,
      recipientName: booking.recipientName || null,
      serviceName: service ? service.name : 'beauty service',
      providerName: provNameRow ? provNameRow.name : 'your provider',
      date: booking.date,
      timeSlot: booking.timeSlot,
      totalPrice: booking.totalPrice,
      hidePriceFromRecipient: booking.hidePriceFromRecipient,
      giftMessage: booking.giftMessage || null,
    }).catch(err => console.error('Failed to send gift notification', err));
  }

  const full = await getBookingFull(bookingId);
  return res.json({ success: true, data: full, message: 'Booking updated' });
}

async function cancelBooking(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const bookingId = req.params.bookingId;
  const booking = await Booking.findOne({ _id: bookingId, providerId: provider._id }).lean();
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (!['confirmed', 'pending'].includes(booking.status)) {
    return res.status(400).json({ success: false, message: 'Only confirmed or pending bookings can be cancelled' });
  }

  const provUser = await User.findById(provider.userId).lean();
  const providerName = provUser ? provUser.name : 'Your provider';

  await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
  await Notification.create({
    userId: booking.clientId,
    type: 'provider_cancelled',
    title: 'Booking Cancelled by Provider',
    message: `${providerName} has cancelled your appointment. Please choose whether you'd like a refund or to reschedule.`,
    bookingId: booking._id,
    actionRequired: true,
  });

  const full = await getBookingFull(bookingId);
  return res.json({ success: true, data: full, message: 'Booking cancelled' });
}

async function listServices(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const services = await Service.find({ providerId: provider._id }).lean();
  return res.json({ success: true, data: services.map(s => ({ ...s, id: s._id })), message: '' });
}

async function createService(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const { name, category, duration, price } = req.body;
  const service = await Service.create({ providerId: provider._id, name, category, duration, price });
  return res.status(201).json({ success: true, data: { ...service.toObject(), id: service._id }, message: 'Service created' });
}

async function updateService(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const serviceId = req.params.serviceId;
  const { name, category, duration, price } = req.body;
  const updated = await Service.findOneAndUpdate(
    { _id: serviceId, providerId: provider._id },
    { name, category, duration, price },
    { new: true }
  ).lean();
  if (!updated) return res.status(404).json({ success: false, message: 'Service not found' });
  return res.json({ success: true, data: { ...updated, id: updated._id }, message: 'Service updated' });
}

async function deleteService(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  await Service.findOneAndUpdate({ _id: req.params.serviceId, providerId: provider._id }, { isActive: false });
  return res.json({ success: true, data: {}, message: 'Service removed' });
}

async function getEarnings(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const bookings = await Booking.find({ providerId: provider._id, status: 'completed' }).sort({ createdAt: -1 }).lean();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const feeRate = 0.1;
  const thisMonth = bookings.filter(b => b.date >= monthStart).reduce((a, b) => a + b.totalPrice * (1 - feeRate), 0);
  const lastMonth = bookings.filter(b => b.date >= lastMonthStart && b.date < monthStart).reduce((a, b) => a + b.totalPrice * (1 - feeRate), 0);
  const totalEarned = bookings.reduce((a, b) => a + b.totalPrice * (1 - feeRate), 0);
  const pendingBookings = await Booking.find({ providerId: provider._id, status: 'confirmed' }).lean();
  const availableForPayout = pendingBookings.reduce((a, b) => a + b.totalPrice * (1 - feeRate), 0);

  const services = await Service.find({ providerId: provider._id }).lean();
  const serviceMap = {};
  services.forEach(s => { serviceMap[String(s._id)] = s.name; });

  const jobs = await Promise.all(bookings.slice(0, 10).map(async b => {
    const client = await User.findById(b.clientId).lean();
    return {
      clientName: client ? client.name : 'Client',
      serviceName: serviceMap[String(b.serviceId)] || 'Service',
      date: b.date,
      gross: b.totalPrice,
      fee: b.totalPrice * feeRate,
      net: b.totalPrice * (1 - feeRate),
      status: 'paid',
    };
  }));

  const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  const monthlyTotals = months.map(m => ({ month: m, total: Math.random() * 5000 + 3000 }));

  return res.json({ success: true, data: { availableForPayout, thisMonth, lastMonth, totalEarned, platformFeePercent: 10, jobs, monthlyTotals }, message: '' });
}

async function getAvailability(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const avail = await Availability.findOne({ providerId: provider._id }).lean();
  if (!avail) {
    return res.json({
      success: true,
      data: {
        workDays: { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false, Sunday: false },
        offSlots: {},
      },
      message: '',
    });
  }
  return res.json({ success: true, data: { workDays: JSON.parse(avail.workDaysJson), offSlots: JSON.parse(avail.offSlotsJson) }, message: '' });
}

async function updateAvailability(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const { workDays, offSlots } = req.body;
  await Availability.findOneAndUpdate(
    { providerId: provider._id },
    { workDaysJson: JSON.stringify(workDays), offSlotsJson: JSON.stringify(offSlots) },
    { upsert: true }
  );
  return res.json({ success: true, data: { workDays, offSlots }, message: 'Availability updated' });
}

async function uploadDocument(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const { docType, fileName, fileData, mimeType } = req.body;
  const doc = await ProviderDocument.create({ providerId: provider._id, docType, fileName, fileData, mimeType });
  return res.status(201).json({ success: true, data: { ...doc.toObject(), id: doc._id, uploadedAt: doc.uploadedAt }, message: 'Document uploaded' });
}

async function listDocuments(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const docs = await ProviderDocument.find({ providerId: provider._id }).sort({ uploadedAt: -1 }).lean();
  return res.json({ success: true, data: docs.map(d => ({ ...d, id: d._id })), message: '' });
}

async function getProfile(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const user = await User.findById(req.userId).lean();
  return res.json({
    success: true,
    data: {
      id: provider._id,
      name: user ? user.name : '',
      phone: user ? (user.phone || '') : '',
      bio: provider.bio || '',
      category: provider.category,
      location: provider.location,
      specialties: provider.specialties || [],
      yearsActive: provider.yearsActive,
      averageRating: provider.averageRating,
      totalReviews: provider.totalReviews,
      totalCompleted: provider.totalCompleted,
      approvalStatus: provider.approvalStatus,
      logoUrl: provider.logoUrl || null,
      latitude: provider.latitude || null,
      longitude: provider.longitude || null,
      coverageRadiusKm: provider.coverageRadiusKm || 10,
    },
    message: '',
  });
}

async function updateProfile(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

  const { name, phone, bio, category, location, specialties, yearsActive, latitude, longitude, coverageRadiusKm } = req.body;

  if ((latitude !== undefined && latitude !== null) || (longitude !== undefined && longitude !== null)) {
    const lat = typeof latitude === 'number' ? latitude : null;
    const lng = typeof longitude === 'number' ? longitude : null;
    if (lat !== null && lng !== null) {
      const inRiyadh = lat >= 24.4 && lat <= 25.1 && lng >= 46.3 && lng <= 47.1;
      if (!inRiyadh) return res.status(422).json({ success: false, message: 'Provider service area must be within Riyadh.' });
    }
  }

  if (name || phone) {
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (phone !== undefined) userUpdates.phone = phone;
    await User.findByIdAndUpdate(req.userId, userUpdates);
  }

  if (location !== undefined && location !== null && location !== '') {
    if (IS_PLACEHOLDER_LIST) {
      console.error('[riyadh-districts] BLOCKED provider profile update: ' + PLACEHOLDER_ERROR_MESSAGE);
      return res.status(503).json({ success: false, message: PLACEHOLDER_ERROR_MESSAGE });
    }
    if (!isValidDistrictId(location)) {
      return res.status(400).json({ success: false, message: 'Location must be a valid Riyadh district.' });
    }
  }

  const providerUpdates = {};
  if (bio !== undefined) providerUpdates.bio = bio;
  if (category) providerUpdates.category = category;
  if (location) providerUpdates.location = location;
  if (specialties !== undefined) providerUpdates.specialties = specialties;
  if (yearsActive !== undefined) providerUpdates.yearsActive = yearsActive;
  if (latitude !== undefined) providerUpdates.latitude = latitude || null;
  if (longitude !== undefined) providerUpdates.longitude = longitude || null;
  if (coverageRadiusKm !== undefined) {
    const r = Number(coverageRadiusKm);
    if (Number.isFinite(r)) providerUpdates.coverageRadiusKm = Math.min(50, Math.max(1, Math.round(r)));
  }

  if (Object.keys(providerUpdates).length > 0) {
    await Provider.findByIdAndUpdate(provider._id, providerUpdates);
  }

  const updated = await Provider.findById(provider._id).lean();
  const user = await User.findById(req.userId).lean();
  return res.json({
    success: true,
    data: {
      id: updated._id,
      name: user ? user.name : '',
      phone: user ? (user.phone || '') : '',
      bio: updated.bio || '',
      category: updated.category,
      location: updated.location,
      specialties: updated.specialties || [],
      yearsActive: updated.yearsActive,
      averageRating: updated.averageRating,
      totalReviews: updated.totalReviews,
      totalCompleted: updated.totalCompleted,
      approvalStatus: updated.approvalStatus,
      logoUrl: updated.logoUrl || null,
      latitude: updated.latitude || null,
      longitude: updated.longitude || null,
      coverageRadiusKm: updated.coverageRadiusKm || 10,
    },
    message: 'Profile updated',
  });
}

async function updateLogo(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const { logoUrl } = req.body;
  if (!logoUrl) return res.status(400).json({ success: false, message: 'logoUrl is required' });
  await Provider.findByIdAndUpdate(provider._id, { logoUrl });
  return res.json({ success: true, data: { logoUrl }, message: 'Logo updated' });
}

async function listPayouts(req, res) {
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const payouts = await Payout.find({ providerId: provider._id }).sort({ requestedAt: -1 }).lean();
  return res.json({ success: true, data: payouts.map(p => ({ ...p, id: p._id })), message: '' });
}

async function createPayout(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  const provider = await getProviderForUser(req.userId);
  if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
  const { amount, iban, notes } = req.body;
  if (amount <= 0) return res.status(400).json({ success: false, message: 'Amount must be greater than 0' });
  const payout = await Payout.create({ providerId: provider._id, amount, iban, notes });
  return res.status(201).json({ success: true, data: { ...payout.toObject(), id: payout._id }, message: 'Payout requested' });
}

module.exports = {
  getDashboard, listBookings, updateBookingStatus, cancelBooking,
  listServices, createService, updateService, deleteService,
  getEarnings, getAvailability, updateAvailability,
  uploadDocument, listDocuments, getProfile, updateProfile, updateLogo,
  listPayouts, createPayout,
};
