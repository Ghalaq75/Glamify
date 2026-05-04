const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved', 'rejected'], default: 'open' },
  adminNote: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
