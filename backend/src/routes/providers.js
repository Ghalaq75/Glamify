const { Router } = require('express');
const { listProviders, getProvider, getProviderServices, getProviderReviews } = require('../controllers/providersController');

const router = Router();

router.get('/providers', listProviders);
router.get('/providers/:providerId', getProvider);
router.get('/providers/:providerId/services', getProviderServices);
router.get('/providers/:providerId/reviews', getProviderReviews);

module.exports = router;
