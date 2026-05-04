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
const {
  isStrongPassword,
  isValidEmail,
  normalizeSaudiPhone,
  isValidSaudiPhone,
  checkPasswordStrength,
} = require('../utils/validation');
const { sendVerificationEmail, isConfigured: isEmailConfigured } = require('../utils/emailService');
const {
  createPending,
  getPending,
  deletePending,
  canResend,
  resendCooldownMs,
  rotateCode,
  verifyCode,
  RESEND_COOLDOWN_MS,
} = require('../utils/pendingRegistrations');
const { normalizeAndValidateCategories } = require('../utils/categories');

async function getApprovalStatus(userId, role) {
  if (role !== 'provider') return undefined;
  const p = await Provider.findOne({ userId }).lean();
  return p ? p.approvalStatus : undefined;
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { email, password, role } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).lean();

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (role && user.role !== role) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
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

function validateRegistrationPayload(body, { allowedRoles = ['client', 'provider', 'admin'] } = {}) {
  const { name, email, password, phone, role, category, categories, location } = body || {};
  if (!name || !String(name).trim()) return 'Name is required.';
  if (!isValidEmail(email)) return 'Please enter a valid email address.';
  if (!allowedRoles.includes(role)) {
    return `Please choose a role: ${allowedRoles.join(', ')}.`;
  }
  if (!isStrongPassword(password)) {
    const failed = checkPasswordStrength(password).filter((r) => !r.ok);
    return 'Password is too weak: ' + failed.map((r) => r.label.toLowerCase()).join('; ') + '.';
  }
  if (phone != null && String(phone).trim() !== '' && !isValidSaudiPhone(phone)) {
    return 'Please enter a valid Saudi phone number (e.g. +9665XXXXXXXX or 05XXXXXXXX).';
  }
  if (role === 'provider') {
    if (IS_PLACEHOLDER_LIST) return PLACEHOLDER_ERROR_MESSAGE;
    if (!location || !isValidDistrictId(location)) return 'Location must be a valid Riyadh district.';
    const norm = normalizeAndValidateCategories({ categories, category });
    if (!norm.ok) return norm.message;
  }
  return null;
}

async function register(req, res) {
  const validationError = validateRegistrationPayload(req.body);
  if (validationError) {
    const status = validationError === PLACEHOLDER_ERROR_MESSAGE ? 503 : 400;
    if (status === 503) console.error('[riyadh-districts] BLOCKED provider registration: ' + validationError);
    return res.status(status).json({ success: false, message: validationError });
  }

  const { name, email, password, phone, role, category, categories, location } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone ? normalizeSaudiPhone(phone) : null;

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    phone: normalizedPhone,
    role,
  });

  if (role === 'provider') {
    const cats = normalizeAndValidateCategories({ categories, category }).list;
    await Provider.create({
      userId: user._id,
      location,
      category: cats[0],
      categories: cats,
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

async function startVerification(req, res) {
  const validationError = validateRegistrationPayload(req.body, { allowedRoles: ['client', 'provider'] });
  if (validationError) {
    const status = validationError === PLACEHOLDER_ERROR_MESSAGE ? 503 : 400;
    if (status === 503) console.error('[riyadh-districts] BLOCKED provider registration: ' + validationError);
    return res.status(status).json({ success: false, message: validationError });
  }

  const { name, email, password, phone, role, category, categories, location } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

  const existingPending = getPending(normalizedEmail);
  if (existingPending && !canResend(existingPending)) {
    const wait = Math.ceil(resendCooldownMs(existingPending) / 1000);
    return res.status(429).json({
      success: false,
      message: `Please wait ${wait} seconds before requesting another code.`,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const cats = role === 'provider' ? normalizeAndValidateCategories({ categories, category }).list : null;
  const payload = {
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone ? normalizeSaudiPhone(phone) : null,
    role,
    category: role === 'provider' ? cats[0] : null,
    categories: role === 'provider' ? cats : null,
    location: role === 'provider' ? location : null,
  };

  const { entry, code } = createPending({ email: normalizedEmail, payload });

  let emailResult;
  try {
    emailResult = await sendVerificationEmail({ to: normalizedEmail, code, name: payload.name });
  } catch (err) {
    deletePending(normalizedEmail);
    console.error('[email] Failed to send verification email:', err && err.message);
    return res.status(502).json({ success: false, message: 'Could not send verification email. Please try again.' });
  }

  const responseData = {
    verificationId: entry.verificationId,
    email: normalizedEmail,
    resendCooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    expiresInSeconds: Math.ceil((entry.codeExpiresAt - Date.now()) / 1000),
    delivered: Boolean(emailResult.delivered),
  };
  if (!emailResult.delivered && emailResult.devCode) {
    responseData.devCode = emailResult.devCode;
    responseData.devNote = 'SendGrid is not configured. Showing code for development only.';
  }

  return res.json({
    success: true,
    data: responseData,
    message: 'Verification code sent. Please check your email.',
  });
}

async function resendVerification(req, res) {
  const { email } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  const normalizedEmail = email.trim().toLowerCase();

  const entry = getPending(normalizedEmail);
  if (!entry) {
    return res.status(404).json({ success: false, message: 'No pending verification found. Please start registration again.' });
  }
  if (!canResend(entry)) {
    const wait = Math.ceil(resendCooldownMs(entry) / 1000);
    return res.status(429).json({ success: false, message: `Please wait ${wait} seconds before requesting another code.` });
  }

  const code = rotateCode(entry);
  let emailResult;
  try {
    emailResult = await sendVerificationEmail({ to: normalizedEmail, code, name: entry.payload.name });
  } catch (err) {
    console.error('[email] Failed to resend verification email:', err && err.message);
    return res.status(502).json({ success: false, message: 'Could not send verification email. Please try again.' });
  }

  const responseData = {
    verificationId: entry.verificationId,
    email: normalizedEmail,
    resendCooldownSeconds: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    expiresInSeconds: Math.ceil((entry.codeExpiresAt - Date.now()) / 1000),
    delivered: Boolean(emailResult.delivered),
  };
  if (!emailResult.delivered && emailResult.devCode) {
    responseData.devCode = emailResult.devCode;
    responseData.devNote = 'SendGrid is not configured. Showing code for development only.';
  }

  return res.json({
    success: true,
    data: responseData,
    message: 'A new verification code has been sent.',
  });
}

async function completeRegistration(req, res) {
  const { email, code } = req.body || {};
  if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  if (!code || !/^\d{4,8}$/.test(String(code).trim())) {
    return res.status(400).json({ success: false, message: 'Please enter the 6-digit verification code.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const entry = getPending(normalizedEmail);
  if (!entry) {
    return res.status(404).json({ success: false, message: 'No pending verification found. Please start registration again.' });
  }

  const result = verifyCode(entry, code);
  if (!result.ok) {
    if (result.reason === 'expired') {
      deletePending(normalizedEmail);
      return res.status(400).json({ success: false, message: 'This code has expired. Please request a new one.' });
    }
    if (result.reason === 'too_many_attempts') {
      deletePending(normalizedEmail);
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please start registration again.' });
    }
    if (result.reason === 'consumed') {
      return res.status(400).json({ success: false, message: 'This code has already been used. Please request a new one.' });
    }
    const remaining = result.attemptsRemaining ?? 0;
    const suffix = remaining > 0 ? ` ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : '';
    return res.status(400).json({ success: false, message: `Incorrect code.${suffix}` });
  }

  const { payload } = entry;

  let user;
  try {
    user = await User.create({
      name: payload.name,
      email: payload.email,
      passwordHash: payload.passwordHash,
      phone: payload.phone,
      role: payload.role,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      deletePending(normalizedEmail);
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    throw err;
  }

  if (payload.role === 'provider') {
    const cats = Array.isArray(payload.categories) && payload.categories.length
      ? payload.categories
      : [payload.category || 'Hair'];
    await Provider.create({
      userId: user._id,
      location: payload.location,
      category: cats[0],
      categories: cats,
      approvalStatus: 'pending',
    });
  }

  deletePending(normalizedEmail);

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
    message: 'Email verified. Your account is ready.',
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

  if (!isStrongPassword(password)) {
    const failed = checkPasswordStrength(password).filter((r) => !r.ok);
    return res.status(400).json({
      success: false,
      message: 'Password is too weak: ' + failed.map((r) => r.label.toLowerCase()).join('; ') + '.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(user._id, { passwordHash, passwordResetToken: null, passwordResetExpiry: null });

  return res.json({ success: true, data: {}, message: 'Password updated successfully' });
}

module.exports = {
  login,
  register,
  getMe,
  forgotPassword,
  resetPassword,
  startVerification,
  resendVerification,
  completeRegistration,
};
