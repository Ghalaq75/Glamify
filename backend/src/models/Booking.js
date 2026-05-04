const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  address: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending',
  },
  totalPrice: { type: Number, required: true },
  platformFee: { type: Number, default: 15 },
  paymentMethod: { type: String, enum: ['card', 'cash'], default: null },
  paymentStatus: { type: String, default: null },
  stripeSessionId: { type: String, default: null },
  stripePaymentIntentId: { type: String, default: null },
  isGift: { type: Boolean, default: false },
  recipientName: { type: String, default: null },
  recipientPhone: { type: String, default: null },
  recipientAddress: { type: String, default: null },
  giftMessage: { type: String, default: null },
  hidePriceFromRecipient: { type: Boolean, default: false },
}, { timestamps: true });

bookingSchema.index({ providerId: 1, date: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
