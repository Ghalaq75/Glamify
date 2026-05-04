const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v) => typeof v === 'string' && v.length >= 8 },
  { id: 'lower', label: 'At least one lowercase letter (a-z)', test: (v) => /[a-z]/.test(v || '') },
  { id: 'upper', label: 'At least one uppercase letter (A-Z)', test: (v) => /[A-Z]/.test(v || '') },
  { id: 'number', label: 'At least one number (0-9)', test: (v) => /[0-9]/.test(v || '') },
  { id: 'special', label: 'At least one special character (!@#$%^&* etc.)', test: (v) => /[^A-Za-z0-9]/.test(v || '') },
];

function checkPasswordStrength(password) {
  return PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, ok: r.test(password) }));
}

function isStrongPassword(password) {
  return PASSWORD_RULES.every((r) => r.test(password));
}

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email.trim());
}

function normalizeSaudiPhone(raw) {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[\s\-()]/g, '');
  if (/^\+9665\d{8}$/.test(digits)) return digits;
  if (/^009665\d{8}$/.test(digits)) return '+' + digits.slice(2);
  if (/^9665\d{8}$/.test(digits)) return '+' + digits;
  if (/^05\d{8}$/.test(digits)) return '+966' + digits.slice(1);
  if (/^5\d{8}$/.test(digits)) return '+966' + digits;
  return null;
}

function isValidSaudiPhone(raw) {
  return normalizeSaudiPhone(raw) !== null;
}

module.exports = {
  PASSWORD_RULES,
  checkPasswordStrength,
  isStrongPassword,
  isValidEmail,
  normalizeSaudiPhone,
  isValidSaudiPhone,
};
