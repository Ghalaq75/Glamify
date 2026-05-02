const User = require('../models/User');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Dispute = require('../models/Dispute');
const ProviderDocument = require('../models/ProviderDocument');
const Payout = require('../models/Payout');
const RefundRequest = require('../models/RefundRequest');
const Notification = require('../models/Notification');

async function getDashboard(req, res) {
  const users = await User.find({ role: { $ne: 'admin' } }).lean();
  const providers = await Provider.find().lean();
  const bookings = await Booking.find().lean();
  const disputes = await Dispute.find().lean();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const bookingsThisMonth = bookings.filter(b => new Date(b.createdAt) >= monthStart);
  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((a, b) => a + b.platformFee, 0);
  const revenueThisMonth = bookingsThisMonth.filter(b => b.status === 'completed').reduce((a, b) => a + b.platformFee, 0);
  return res.json({
    success: true,
    data: {
      totalUsers: users.length,
      totalProviders: providers.length,
      totalBookings: bookings.length,
      totalRevenue,
      pendingProviders: providers.filter(p => p.approvalStatus === 'pending').length,
      openDisputes: disputes.filter(d => d.status === 'open').length,
      bookingsThisMonth: bookingsThisMonth.length,
      revenueThisMonth,
    },
    message: '',
  });
}

async function listProviders(req, res) {
  const { status } = req.query;
  const query = status ? { approvalStatus: status } : {};
  const providers = await Provider.find(query).sort({ appliedAt: -1 }).lean();
  const userIds = providers.map(p => p.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = {};
  users.forEach(u => { userMap[String(u._id)] = u; });
  return res.json({
    success: true,
    data: providers.map(p => ({
      id: p._id,
      name: userMap[String(p.userId)]?.name || '',
      role: p.category,
      city: p.location,
      appliedAt: p.appliedAt,
      isApproved: p.approvalStatus === 'approved',
      approvalStatus: p.approvalStatus,
      documents: p.documents || [],
    })),
    message: '',
  });
}

async function approveProvider(req, res) {
  await Provider.findByIdAndUpdate(req.params.providerId, { approvalStatus: 'approved' });
  return res.json({ success: true, data: {}, message: 'Provider approved' });
}

async function rejectProvider(req, res) {
  await Provider.findByIdAndUpdate(req.params.providerId, { approvalStatus: 'rejected' });
  return res.json({ success: true, data: {}, message: 'Provider rejected' });
}

async function getProviderDocuments(req, res) {
  const docs = await ProviderDocument.find({ providerId: req.params.providerId }).sort({ uploadedAt: -1 }).lean();
  return res.json({ success: true, data: docs.map(d => ({ ...d, id: d._id })), message: '' });
}

async function listUsers(req, res) {
  const users = await User.find({ role: { $ne: 'admin' } }).lean();
  return res.json({
    success: true,
    data: users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, createdAt: u.createdAt })),
    message: '',
  });
}

async function deleteUser(req, res) {
  await User.findByIdAndDelete(req.params.userId);
  return res.json({ success: true, data: {}, message: 'User deleted' });
}

async function listBookings(req, res) {
  const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
  const clientIds = bookings.map(b => b.clientId);
  const serviceIds = bookings.map(b => b.serviceId);
  const clients = await User.find({ _id: { $in: clientIds } }).lean();
  const services = await Service.find({ _id: { $in: serviceIds } }).lean();
  const clientMap = {};
  clients.forEach(c => { clientMap[String(c._id)] = c; });
  const serviceMap = {};
  services.forEach(s => { serviceMap[String(s._id)] = s; });
  return res.json({
    success: true,
    data: bookings.map(b => ({
      id: b._id,
      clientId: b.clientId,
      providerId: b.providerId,
      serviceId: b.serviceId,
      date: b.date,
      timeSlot: b.timeSlot,
      address: b.address,
      status: b.status,
      totalPrice: b.totalPrice,
      platformFee: b.platformFee,
      createdAt: b.createdAt,
      clientName: clientMap[String(b.clientId)]?.name || '',
      serviceName: serviceMap[String(b.serviceId)]?.name || '',
      providerName: '',
    })),
    message: '',
  });
}

async function listDisputes(req, res) {
  const disputes = await Dispute.find().sort({ createdAt: -1 }).lean();
  const result = await Promise.all(disputes.map(async d => {
    const client = await User.findById(d.clientId).lean();
    const booking = await Booking.findById(d.bookingId).lean();
    const service = booking ? await Service.findById(booking.serviceId).lean() : null;
    const provider = booking ? await Provider.findById(booking.providerId).lean() : null;
    const provUser = provider ? await User.findById(provider.userId).lean() : null;
    return {
      id: d._id,
      bookingId: d.bookingId,
      clientId: d.clientId,
      reason: d.reason,
      status: d.status,
      adminNote: d.adminNote,
      createdAt: d.createdAt,
      clientName: client ? client.name : '',
      providerName: provUser ? provUser.name : '',
      serviceName: service ? service.name : '',
      amountPaid: booking ? booking.totalPrice : 0,
    };
  }));
  return res.json({ success: true, data: result, message: '' });
}

async function resolveDispute(req, res) {
  const { resolution, adminNote } = req.body;
  const status = resolution === 'rejected' ? 'rejected' : 'resolved';
  const updated = await Dispute.findByIdAndUpdate(req.params.disputeId, { status, adminNote }, { new: true }).lean();
  if (!updated) return res.status(404).json({ success: false, message: 'Dispute not found' });
  return res.json({ success: true, data: { ...updated, id: updated._id }, message: 'Dispute resolved' });
}

async function listPayouts(req, res) {
  const { status } = req.query;
  const query = status ? { status } : {};
  const payouts = await Payout.find(query).sort({ requestedAt: -1 }).lean();
  const result = await Promise.all(payouts.map(async p => {
    const provider = await Provider.findById(p.providerId).lean();
    const provUser = provider ? await User.findById(provider.userId).lean() : null;
    return {
      id: p._id,
      providerId: p.providerId,
      providerName: provUser ? provUser.name : 'Unknown',
      amount: p.amount,
      iban: p.iban,
      notes: p.notes || null,
      status: p.status,
      requestedAt: p.requestedAt,
      processedAt: p.processedAt || null,
      adminNote: p.adminNote || null,
    };
  }));
  return res.json({ success: true, data: result, message: '' });
}

async function approvePayout(req, res) {
  const payout = await Payout.findById(req.params.payoutId);
  if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
  if (payout.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending payouts can be approved' });
  await payout.set({ status: 'approved', processedAt: new Date() }).save();
  return res.json({ success: true, data: { ...payout.toObject(), id: payout._id }, message: 'Payout approved' });
}

async function rejectPayout(req, res) {
  const { adminNote } = req.body;
  const payout = await Payout.findById(req.params.payoutId);
  if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
  if (payout.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending payouts can be rejected' });
  await payout.set({ status: 'rejected', processedAt: new Date(), adminNote: adminNote || '' }).save();
  return res.json({ success: true, data: { ...payout.toObject(), id: payout._id }, message: 'Payout rejected' });
}

async function listRefundRequests(req, res) {
  const { status } = req.query;
  const query = status ? { status } : {};
  const rows = await RefundRequest.find(query).sort({ createdAt: -1 }).lean();
  const result = await Promise.all(rows.map(async r => {
    const client = await User.findById(r.clientId).lean();
    const provider = await Provider.findById(r.providerId).lean();
    const provUser = provider ? await User.findById(provider.userId).lean() : null;
    const booking = await Booking.findById(r.bookingId).lean();
    const service = booking ? await Service.findById(booking.serviceId).lean() : null;
    return {
      id: r._id,
      bookingId: r.bookingId,
      clientId: r.clientId,
      providerId: r.providerId,
      clientName: client ? client.name : '',
      providerName: provUser ? provUser.name : '',
      serviceName: service ? service.name : '',
      amount: r.amount,
      reason: r.reason,
      status: r.status,
      adminNote: r.adminNote,
      createdAt: r.createdAt,
    };
  }));
  return res.json({ success: true, data: result, message: '' });
}

async function approveRefund(req, res) {
  const refund = await RefundRequest.findById(req.params.refundId);
  if (!refund) return res.status(404).json({ success: false, message: 'Refund request not found' });
  if (refund.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending refunds can be approved' });
  await refund.set({ status: 'approved' }).save();
  await Booking.findByIdAndUpdate(refund.bookingId, { paymentStatus: 'refunded' });
  await Notification.create({
    userId: refund.clientId,
    type: 'refund_approved',
    title: 'Refund Approved',
    message: `Your refund of ${refund.amount} SAR has been approved and will be processed shortly.`,
    bookingId: refund.bookingId,
  });
  return res.json({ success: true, data: { ...refund.toObject(), id: refund._id }, message: 'Refund approved' });
}

async function rejectRefund(req, res) {
  const { adminNote } = req.body;
  const refund = await RefundRequest.findById(req.params.refundId);
  if (!refund) return res.status(404).json({ success: false, message: 'Refund request not found' });
  if (refund.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending refunds can be rejected' });
  await refund.set({ status: 'rejected', adminNote: adminNote || '' }).save();
  await Notification.create({
    userId: refund.clientId,
    type: 'refund_rejected',
    title: 'Refund Request Declined',
    message: adminNote ? `Your refund request was declined. Admin note: ${adminNote}` : 'Your refund request was declined by the admin.',
    bookingId: refund.bookingId,
  });
  return res.json({ success: true, data: { ...refund.toObject(), id: refund._id }, message: 'Refund rejected' });
}

module.exports = {
  getDashboard, listProviders, approveProvider, rejectProvider, getProviderDocuments,
  listUsers, deleteUser, listBookings, listDisputes, resolveDispute,
  listPayouts, approvePayout, rejectPayout, listRefundRequests, approveRefund, rejectRefund,
};
