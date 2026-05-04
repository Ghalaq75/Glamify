const Stripe = require('stripe');

let _stripe = null;

function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured on the server.');
  }
  _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  return _stripe;
}

function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

module.exports = { getStripe, isStripeConfigured };
