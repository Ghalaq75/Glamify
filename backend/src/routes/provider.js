const { Router } = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getDashboard, listBookings, updateBookingStatus, cancelBooking,
  listServices, createService, updateService, deleteService,
  getEarnings, getAvailability, updateAvailability,
  uploadDocument, listDocuments, getProfile, updateProfile, updateLogo,
  listPayouts, createPayout,
} = require('../controllers/providerController');

const router = Router();

router.use('/provider', requireAuth, requireRole('provider', 'admin'));

router.get('/provider/dashboard', getDashboard);
router.get('/provider/bookings', listBookings);
router.patch('/provider/bookings/:bookingId', updateBookingStatus);
router.post('/provider/bookings/:bookingId/cancel', cancelBooking);

router.get('/provider/services', listServices);
router.post('/provider/services', [
  body('name').notEmpty().withMessage('name is required'),
  body('price').isNumeric().withMessage('price must be a number'),
], createService);
router.put('/provider/services/:serviceId', updateService);
router.delete('/provider/services/:serviceId', deleteService);

router.get('/provider/earnings', getEarnings);
router.get('/provider/availability', getAvailability);
router.put('/provider/availability', updateAvailability);

router.post('/provider/documents', [
  body('docType').notEmpty().withMessage('docType is required'),
  body('fileName').notEmpty().withMessage('fileName is required'),
  body('fileData').notEmpty().withMessage('fileData is required'),
  body('mimeType').notEmpty().withMessage('mimeType is required'),
], uploadDocument);
router.get('/provider/documents', listDocuments);

router.get('/provider/profile', getProfile);
router.patch('/provider/profile', updateProfile);
router.patch('/provider/profile/logo', updateLogo);

router.get('/provider/payouts', listPayouts);
router.post('/provider/payouts', [
  body('amount').isNumeric().withMessage('amount must be a number'),
  body('iban').notEmpty().withMessage('iban is required'),
], createPayout);

module.exports = router;
