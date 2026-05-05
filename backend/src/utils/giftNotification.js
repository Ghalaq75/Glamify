const twilio = require('twilio');

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
}

function buildMessage({ recipientName, serviceName, providerName, date, timeSlot, totalPrice, hidePriceFromRecipient, giftMessage }) {
  const greeting = recipientName ? `Hi ${recipientName}! ` : 'Hi! ';
  const dateFormatted = formatDate(date);
  let msg = `${greeting}You have a gift appointment confirmed!\n\n`;
  msg += `Service: ${serviceName}\n`;
  msg += `Provider: ${providerName}\n`;
  msg += `Date: ${dateFormatted}\n`;
  msg += `Time: ${timeSlot}\n`;
  if (!hidePriceFromRecipient) msg += `Price: SAR ${totalPrice.toFixed(2)}\n`;
  if (giftMessage) msg += `\nMessage from your gifter: "${giftMessage}"`;
  return msg;
}

function isConfigured() {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

async function sendGiftNotification(params) {
  const body = buildMessage(params);
  const to = params.recipientPhone.trim();

  if (!isConfigured()) {
    console.info('[SIMULATED] Gift WhatsApp notification to', to, ':', body);
    return;
  }

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${to}`,
      body,
    });
    console.info('[WhatsApp] Gift notification sent to', to);
  } catch (err) {
    console.error('[WhatsApp] Failed to send gift notification:', err.message);
  }
}

module.exports = { sendGiftNotification };