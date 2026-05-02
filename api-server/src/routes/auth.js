const { Router } = require('express');
const { body } = require('express-validator');
const { login, register, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.post('/auth/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['client', 'provider', 'admin']).withMessage('Role must be client, provider, or admin'),
], login);

router.post('/auth/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['client', 'provider', 'admin']).withMessage('Invalid role'),
], register);

router.get('/auth/me', requireAuth, getMe);

router.post('/auth/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required'),
], forgotPassword);

router.post('/auth/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], resetPassword);

module.exports = router;
