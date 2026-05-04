let sgMail = null;
try {
  sgMail = require('@sendgrid/mail');
} catch (e) {
  sgMail = null;
}

function getApiKey() {
  return (process.env.SENDGRID_API_KEY || '').trim();
}
function getFromEmail() {
  return (process.env.SENDGRID_FROM_EMAIL || '').trim();
}

function isConfigured() {
  return Boolean(getApiKey() && getFromEmail() && sgMail);
}

let configured = false;
function ensureConfigured() {
  if (configured || !isConfigured()) return;
  sgMail.setApiKey(getApiKey());
  configured = true;
}

async function sendVerificationEmail({ to, code, name }) {
  const subject = 'Your Glamify verification code';
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const text =
    `${greeting}\n\n` +
    `Your Glamify email verification code is: ${code}\n\n` +
    `This code will expire in 10 minutes. If you did not request this, please ignore this email.\n\n` +
    `— The Glamify Team`;
  const html =
    `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222">` +
    `<h2 style="color:#7c3aed;margin:0 0 16px">Verify your email</h2>` +
    `<p>${greeting}</p>` +
    `<p>Your Glamify email verification code is:</p>` +
    `<div style="font-size:32px;font-weight:700;letter-spacing:6px;padding:16px 24px;background:#f5f3ff;color:#5b21b6;border-radius:8px;text-align:center;margin:16px 0">${code}</div>` +
    `<p style="color:#666;font-size:14px">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>` +
    `<p style="color:#666;font-size:14px">— The Glamify Team</p>` +
    `</div>`;

  if (!isConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured. Please contact support.');
    }
    console.info(`[email-dev] Verification code for ${to}: ${code}`);
    return { delivered: false, devCode: code };
  }

  ensureConfigured();
  try {
    await sgMail.send({
      to,
      from: getFromEmail(),
      subject,
      text,
      html,
    });
    return { delivered: true };
  } catch (err) {
    const status = err && err.code;
    const body = err && err.response && err.response.body;
    console.error('[email] SendGrid send failed:', status, JSON.stringify(body));
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[email-dev] SendGrid failed — falling back. Verification code for ${to}: ${code}`);
      return { delivered: false, devCode: code };
    }
    throw err;
  }
}

module.exports = { sendVerificationEmail, isConfigured };
