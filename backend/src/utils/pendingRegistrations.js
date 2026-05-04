const crypto = require('crypto');

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;
const PENDING_TTL_MS = 30 * 60 * 1000;

const store = new Map();

function makeKey(email) {
  return String(email || '').trim().toLowerCase();
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function generateCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function generateVerificationId() {
  return crypto.randomBytes(16).toString('hex');
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(key);
  }
}

function createPending({ email, payload }) {
  cleanup();
  const key = makeKey(email);
  const code = generateCode();
  const now = Date.now();
  const entry = {
    verificationId: generateVerificationId(),
    email: key,
    payload,
    codeHash: hashCode(code),
    codeExpiresAt: now + CODE_TTL_MS,
    expiresAt: now + PENDING_TTL_MS,
    lastSentAt: now,
    attempts: 0,
    consumed: false,
  };
  store.set(key, entry);
  return { entry, code };
}

function getPending(email) {
  cleanup();
  const entry = store.get(makeKey(email));
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(makeKey(email));
    return null;
  }
  return entry;
}

function deletePending(email) {
  store.delete(makeKey(email));
}

function canResend(entry) {
  return Date.now() - entry.lastSentAt >= RESEND_COOLDOWN_MS;
}

function resendCooldownMs(entry) {
  return Math.max(0, RESEND_COOLDOWN_MS - (Date.now() - entry.lastSentAt));
}

function rotateCode(entry) {
  const code = generateCode();
  entry.codeHash = hashCode(code);
  entry.codeExpiresAt = Date.now() + CODE_TTL_MS;
  entry.lastSentAt = Date.now();
  entry.attempts = 0;
  entry.consumed = false;
  return code;
}

function verifyCode(entry, code) {
  if (entry.consumed) return { ok: false, reason: 'consumed' };
  if (Date.now() > entry.codeExpiresAt) return { ok: false, reason: 'expired' };
  if (entry.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'too_many_attempts' };
  const provided = hashCode(String(code || '').trim());
  if (provided !== entry.codeHash) {
    entry.attempts += 1;
    const remaining = Math.max(0, MAX_ATTEMPTS - entry.attempts);
    return { ok: false, reason: 'mismatch', attemptsRemaining: remaining };
  }
  entry.consumed = true;
  return { ok: true };
}

module.exports = {
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  MAX_ATTEMPTS,
  createPending,
  getPending,
  deletePending,
  canResend,
  resendCooldownMs,
  rotateCode,
  verifyCode,
};
