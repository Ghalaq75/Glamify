const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, unique: true },
  workDaysJson: { type: String, default: '{}' },
  offSlotsJson: { type: String, default: '{}' },
}, { timestamps: true });

module.exports = mongoose.model('Availability', availabilitySchema);
