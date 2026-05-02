const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');
const Favourite = require('../models/Favourite');
const Notification = require('../models/Notification');
const RefundRequest = require('../models/RefundRequest');
const { geocodeAddress, isWithinRiyadh } = require('../utils/geocode');

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
    paymentMethod: b.paymentMethod,
    paymentStatus: b.paymentStatus,
    createdAt: b.createdAt,
    clientName: client ? client.name : '',
    clientPhone: b.status === 'confirmed' ? (client ? client.phone : null) : null,
    serviceName: service ? service.name : '',
    providerName: provUser ? provUser.name : '',
    providerPhone: b.status === 'confirmed' ? (provUser ? provUser.phone : null) : null,
    isGift: b.isGift,
    recipientName: b.recipientName,
    recipientPhone: b.recipientPhone,
    recipientAddress: b.recipientAddress,
    giftMessage: b.giftMessage,
    hidePriceFromRecipient: b.hidePriceFromRecipient,
  };
}

async function getDashboard(req, res) {
  const clientId = req.userId;
  const allBookings = await Booking.find({ clientId }).lean();
  const upcomingBookingsCount = allBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
  const recentRaw = await Booking.find({ clientId }).sort({ createdAt: -1 }).limit(3).lean();
  const recentBookings = await Promise.all(recentRaw.map(b => getBookingFull(b._id)));
  return res.json({
    success: true,
    data: { upcomingBookingsCount, totalBookingsCount: allBookings.length, recentBookings: recentBookings.filter(Boolean) },
    message: '',
  });
}

async function listBookings(req, res) {
  const clientId = req.userId;
  const { status } = req.query;
  const query = { clientId };
  if (status) query.status = status;
  const rows = await Booking.find(query).sort({ createdAt: -1 }).lean();
  const result = await Promise.all(rows.map(b => getBookingFull(b._id)));
  return res.json({ success: true, data: result.filter(Boolean), message: '' });
}

async function createBooking(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { providerId, serviceId, date, timeSlot, address, notes, isGift, recipientName, recipientPhone, recipientAddress, giftMessage, hidePriceFromRecipient } = req.body;
  const clientId = req.userId;

  if (isGift) {
    if (!recipientName || !recipientPhone || !recipientAddress) {
      return res.status(400).json({ success: false, message: 'Recipient name, phone, and address are required for gift bookings.' });
    }
    const coords = await geocodeAddress(recipientAddress);
    if (!coords) {
      return res.status(400).json({ success: false, message: 'Could not geocode the recipient address. Please enter a clearer Riyadh address.' });
    }
    if (!isWithinRiyadh(coords.lat, coords.lng)) {
      return res.status(400).json({ success: false, message: 'Gift recipient address must be within Riyadh.' });
    }
  }

  const service = await Service.findById(serviceId);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

  const booking = await Booking.create({
    clientId, providerId, serviceId, date, timeSlot, address, notes,
    totalPrice: service.price, platformFee: 15, status: 'pending',
    isGift: isGift || false,
    recipientName: isGift ? recipientName : null,
    recipientPhone: isGift ? recipientPhone : null,
    recipientAddress: isGift ? recipientAddress : null,
    giftMessage: isGift ? (giftMessage || null) : null,
    hidePriceFromRecipient: isGift ? (hidePriceFromRecipient || false) : false,
  });

  const full = await getBookingFull(booking._id);
  return res.status(201).json({ success: true, data: full, message: 'Booking created' });
}

async function cancelBooking(req, res) {
  const clientId = req.userId;
  const bookingId = req.params.bookingId;
  const booking = await Booking.findOne({ _id: bookingId, clientId }).lean();
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'Cannot cancel this booking' });
  }
  await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' });
  const full = await getBookingFull(bookingId);
  return res.json({ success: true, data: full, message: 'Booking cancelled' });
}

async function submitPayment(req, res) {
  const clientId = req.userId;
  const bookingId = req.params.bookingId;
  const { method } = req.body;

  if (!['card', 'wallet', 'cash'].includes(method)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }

  const booking = await Booking.findOne({ _id: bookingId, clientId }).lean();
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
  if (booking.paymentStatus) return res.status(400).json({ success: false, message: 'Payment already submitted' });

  const paymentStatus = method === 'cash' ? 'pending_cash' : 'paid';
  const bookingStatus = method === 'cash' ? 'pending' : 'confirmed';
  await Booking.findByIdAndUpdate(bookingId, { paymentMethod: method, paymentStatus, status: bookingStatus });
  const full = await getBookingFull(bookingId);
  return res.json({ success: true, data: full, message: 'Payment submitted' });
}

async function createReview(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { bookingId, providerId, rating, comment } = req.body;
  const clientId = req.userId;
  const review = await Review.create({ bookingId, clientId, providerId, rating, comment });

  const allReviews = await Review.find({ providerId }).lean();
  const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
  await Provider.findByIdAndUpdate(providerId, { averageRating: avgRating, totalReviews: allReviews.length });

  return res.status(201).json({ success: true, data: { id: review._id, ...review.toObject() }, message: 'Review submitted' });
}

async function createDispute(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { bookingId, reason } = req.body;
  const clientId = req.userId;
  const dispute = await Dispute.create({ bookingId, clientId, reason });
  return res.status(201).json({ success: true, data: { id: dispute._id, ...dispute.toObject() }, message: 'Dispute filed' });
}

async function getProfile(req, res) {
  const userId = req.userId;
  const user = await User.findById(userId).lean();
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const allBookings = await Booking.find({ clientId: userId }).lean();
  const completedBookings = allBookings.filter(b => b.status === 'completed').length;
  return res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      totalBookings: allBookings.length,
      completedBookings,
      createdAt: user.createdAt,
    },
    message: '',
  });
}

const PHONE_REGEX = /^\+[1-9][\d\s\-\(\)]{6,18}$/;

async function updateProfile(req, res) {
  const userId = req.userId;
  const { name, phone } = req.body;
  if (!name && phone === undefined) return res.status(400).json({ success: false, message: 'Nothing to update' });
  if (phone !== undefined && phone !== '' && !PHONE_REGEX.test(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone number format. Please use international format starting with + (e.g. +966 50 000 0000)' });
  }
  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  await User.findByIdAndUpdate(userId, updates);
  const user = await User.findById(userId).lean();
  const allBookings = await Booking.find({ clientId: userId }).lean();
  const completedBookings = allBookings.filter(b => b.status === 'completed').length;
  return res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      totalBookings: allBookings.length,
      completedBookings,
      createdAt: user.createdAt,
    },
    message: 'Profile updated',
  });
}

async function listFavourites(req, res) {
  const clientId = req.userId;
  const favs = await Favourite.find({ clientId }).sort({ createdAt: -1 }).lean();
  const providerIds = favs.map(f => f.providerId);
  const providers = await Provider.find({ _id: { $in: providerIds } }).lean();
  const userIds = providers.map(p => p.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = {};
  users.forEach(u => { userMap[String(u._id)] = u; });
  const provMap = {};
  providers.forEach(p => { provMap[String(p._id)] = p; });

  return res.json({
    success: true,
    data: favs.map(f => {
      const p = provMap[String(f.providerId)] || {};
      const u = userMap[String(p.userId)] || {};
      return {
        id: f._id,
        providerId: f.providerId,
        createdAt: f.createdAt,
        providerName: u.name || '',
        bio: p.bio,
        location: p.location,
        category: p.category,
        specialties: p.specialties,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
        logoUrl: p.logoUrl || null,
        latitude: p.latitude || null,
        longitude: p.longitude || null,
      };
    }),
    message: '',
  });
}

async function addFavourite(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const clientId = req.userId;
  const { providerId } = req.body;
  try {
    const fav = await Favourite.create({ clientId, providerId });
    return res.status(201).json({ success: true, data: { id: fav._id, ...fav.toObject() }, message: 'Added to favourites' });
  } catch {
    return res.status(409).json({ success: false, message: 'Already in favourites' });
  }
}

async function removeFavourite(req, res) {
  const clientId = req.userId;
  const providerId = req.params.providerId;
  await Favourite.findOneAndDelete({ clientId, providerId });
  return res.json({ success: true, data: {}, message: 'Removed from favourites' });
}

async function listNotifications(req, res) {
  const userId = req.userId;
  const rows = await Notification.find({ userId }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: rows.map(r => ({ ...r, id: r._id })), message: '' });
}

async function markNotificationRead(req, res) {
  const userId = req.userId;
  const notifId = req.params.id;
  await Notification.findOneAndUpdate({ _id: notifId, userId }, { isRead: true });
  return res.json({ success: true, data: {}, message: 'Marked as read' });
}

async function markAllNotificationsRead(req, res) {
  const userId = req.userId;
  await Notification.updateMany({ userId }, { isRead: true });
  return res.json({ success: true, data: {}, message: 'All notifications marked as read' });
}

async function notificationAction(req, res) {
  const userId = req.userId;
  const notifId = req.params.id;
  const { action } = req.body;

  if (!['refund', 'reschedule'].includes(action)) {
    return res.status(400).json({ success: false, message: 'action must be refund or reschedule' });
  }

  const notif = await Notification.findOne({ _id: notifId, userId }).lean();
  if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });
  if (!notif.actionRequired) return res.status(400).json({ success: false, message: 'No action required on this notification' });
  if (notif.actionTaken) return res.status(400).json({ success: false, message: 'Action already taken' });

  await Notification.findByIdAndUpdate(notifId, { actionTaken: action, isRead: true });

  const bookingId = notif.bookingId;

  if (action === 'refund' && bookingId) {
    const booking = await Booking.findById(bookingId).lean();
    if (booking) {
      await RefundRequest.create({
        bookingId,
        clientId: userId,
        providerId: booking.providerId,
        amount: booking.totalPrice,
        reason: 'Provider cancelled booking',
        status: 'pending',
      });
    }
    return res.json({ success: true, data: { action: 'refund', rescheduleUrl: null }, message: 'Refund request submitted to admin for review.' });
  } else if (action === 'reschedule' && bookingId) {
    await Booking.findByIdAndUpdate(bookingId, { status: 'rescheduled' });
    const booking = await Booking.findById(bookingId).lean();
    const rescheduleUrl = booking
      ? `/client/book?providerId=${booking.providerId}&serviceId=${booking.serviceId}`
      : '/client';
    return res.json({ success: true, data: { action: 'reschedule', rescheduleUrl }, message: 'Please pick a new date and time.' });
  }

  return res.status(400).json({ success: false, message: 'Booking not found for this notification' });
}

module.exports = {
  getDashboard, listBookings, createBooking, cancelBooking, submitPayment,
  createReview, createDispute, getProfile, updateProfile,
  listFavourites, addFavourite, removeFavourite,
  listNotifications, markNotificationRead, markAllNotificationsRead, notificationAction,
};
