const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  amount: { type: Number, required: true },
  iban: { type: String, required: true },
  notes: { type: String, default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
  adminNote: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Payout', payoutSchema);
