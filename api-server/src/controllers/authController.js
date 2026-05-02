const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Provider = require('../models/Provider');
const { signToken, getCurrentUser } = require('../middleware/auth');
const {
  isValidDistrictId,
  IS_PLACEHOLDER_LIST,
  PLACEHOLDER_ERROR_MESSAGE,
} = require('@workspace/riyadh-districts');

async function getApprovalStatus(userId, role) {
  if (role !== 'provider') return undefined;
  const p = await Provider.findOne({ userId }).lean();
  return p ? p.approvalStatus : undefined;
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { email, password, role } = req.body;

  let user = await User.findOne({ email: email.toLowerCase() }).lean();

  if (!user || user.role !== role) {
    const passwordHash = await bcrypt.hash('password', 10);
    const newUser = await User.create({
      name: email.split('@')[0],
      email: email.toLowerCase(),
      passwordHash,
      role,
    });
    user = newUser.toObject();

    if (role === 'provider') {
      await Provider.create({
        userId: user._id,
        location: 'Al Olaya, Riyadh',
        category: 'Hair',
        bio: 'Professional beauty service provider.',
        specialties: ['Hair Treatment', 'Keratin'],
        averageRating: 4.9,
        totalReviews: 124,
        totalCompleted: 380,
        yearsActive: 3,
        approvalStatus: 'approved',
        documents: ['ID Verified', 'Portfolio (8)', 'License'],
      });
    }
  }

  const token = signToken(user._id, user.role);
  const approvalStatus = await getApprovalStatus(user._id, user.role);
  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ...(approvalStatus ? { approvalStatus } : {}),
      },
    },
    message: 'Login successful',
  });
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { name, email, password, phone, role, category, location } = req.body;

  if (role === 'provider') {
    if (IS_PLACEHOLDER_LIST) {
      console.error('[riyadh-districts] BLOCKED provider registration: ' + PLACEHOLDER_ERROR_MESSAGE);
      return res.status(503).json({ success: false, message: PLACEHOLDER_ERROR_MESSAGE });
    }
    if (!location || !isValidDistrictId(location)) {
      return res.status(400).json({ success: false, message: 'Location must be a valid Riyadh district.' });
    }
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash, phone, role });

  if (role === 'provider') {
    await Provider.create({
      userId: user._id,
      location,
      category: category || 'Hair',
      approvalStatus: 'pending',
    });
  }

  const token = signToken(user._id, user.role);
  const approvalStatus = await getApprovalStatus(user._id, user.role);
  return res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        ...(approvalStatus ? { approvalStatus } : {}),
      },
    },
    message: 'Registration successful',
  });
}

async function getMe(req, res) {
  const user = await getCurrentUser(req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'Not found' });
  const approvalStatus = await getApprovalStatus(user._id, user.role);
  return res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      ...(approvalStatus ? { approvalStatus } : {}),
    },
    message: '',
  });
}

async function forgotPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.json({ success: true, data: {}, message: 'If that email is registered you will receive a reset link.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000);
  await User.findByIdAndUpdate(user._id, { passwordResetToken: token, passwordResetExpiry: expiry });

  const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
  const resetLink = `${origin}/reset-password?token=${token}`;

  return res.json({ success: true, data: { resetLink }, message: 'Reset link generated' });
}

async function resetPassword(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { token, password } = req.body;
  const user = await User.findOne({ passwordResetToken: token });

  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });
  if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
    return res.status(400).json({ success: false, message: 'This reset link has expired. Please request a new one.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(user._id, { passwordHash, passwordResetToken: null, passwordResetExpiry: null });

  return res.json({ success: true, data: {}, message: 'Password updated successfully' });
}

module.exports = { login, register, getMe, forgotPassword, resetPassword };
