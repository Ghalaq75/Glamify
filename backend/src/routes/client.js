const { Router } = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getDashboard, listBookings, createBooking, cancelBooking, submitPayment,
  createStripeCheckout, verifyStripeCheckout,
  createReview, createDispute, getProfile, updateProfile,
  listFavourites, addFavourite, removeFavourite,
  listNotifications, markNotificationRead, markAllNotificationsRead, notificationAction,
} = require('../controllers/clientController');

const router = Router();

router.use('/client', requireAuth, requireRole('client', 'admin'));

router.get('/client/dashboard', getDashboard);
router.get('/client/bookings', listBookings);
router.post('/client/bookings', [
  body('providerId').notEmpty().withMessage('providerId is required'),
  body('serviceId').notEmpty().withMessage('serviceId is required'),
  body('date').notEmpty().withMessage('date is required'),
  body('timeSlot').notEmpty().withMessage('timeSlot is required'),
], createBooking);
router.patch('/client/bookings/:bookingId/cancel', cancelBooking);
router.post('/client/bookings/:bookingId/payment', [
  body('method').isIn(['card', 'cash']).withMessage('Invalid payment method'),
], submitPayment);
router.post('/client/bookings/:bookingId/stripe-checkout', createStripeCheckout);
router.get('/client/bookings/:bookingId/stripe-checkout/verify', verifyStripeCheckout);

router.post('/client/reviews', [
  body('bookingId').notEmpty().withMessage('bookingId is required'),
  body('providerId').notEmpty().withMessage('providerId is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
], createReview);

router.post('/client/disputes', [
  body('bookingId').notEmpty().withMessage('bookingId is required'),
  body('reason').notEmpty().withMessage('reason is required'),
], createDispute);

router.get('/client/profile', getProfile);
router.patch('/client/profile', updateProfile);

router.get('/client/favourites', listFavourites);
router.post('/client/favourites', [
  body('providerId').notEmpty().withMessage('providerId is required'),
], addFavourite);
router.delete('/client/favourites/:providerId', removeFavourite);

router.get('/client/notifications', listNotifications);
router.patch('/client/notifications/read-all', markAllNotificationsRead);
router.patch('/client/notifications/:id/read', markNotificationRead);
router.post('/client/notifications/:id/action', [
  body('action').isIn(['refund', 'reschedule']).withMessage('action must be refund or reschedule'),
], notificationAction);

module.exports = router;
