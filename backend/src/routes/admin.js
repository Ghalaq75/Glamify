const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getDashboard, listProviders, approveProvider, rejectProvider, getProviderDocuments,
  listUsers, deleteUser, listBookings, listDisputes, resolveDispute,
  listPayouts, approvePayout, rejectPayout, listRefundRequests, approveRefund, rejectRefund,
} = require('../controllers/adminController');

const router = Router();

router.use('/admin', requireAuth, requireRole('admin'));

router.get('/admin/dashboard', getDashboard);
router.get('/admin/providers', listProviders);
router.patch('/admin/providers/:providerId/approve', approveProvider);
router.patch('/admin/providers/:providerId/reject', rejectProvider);
router.get('/admin/providers/:providerId/documents', getProviderDocuments);
router.get('/admin/users', listUsers);
router.delete('/admin/users/:userId', deleteUser);
router.get('/admin/bookings', listBookings);
router.get('/admin/disputes', listDisputes);
router.patch('/admin/disputes/:disputeId', resolveDispute);
router.get('/admin/payouts', listPayouts);
router.patch('/admin/payouts/:payoutId/approve', approvePayout);
router.patch('/admin/payouts/:payoutId/reject', rejectPayout);
router.get('/admin/refund-requests', listRefundRequests);
router.patch('/admin/refund-requests/:refundId/approve', approveRefund);
router.patch('/admin/refund-requests/:refundId/reject', rejectRefund);

module.exports = router;
