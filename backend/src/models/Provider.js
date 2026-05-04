const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  categories: { type: [String], default: [] },
  location: { type: String, default: '' },
  bio: { type: String, default: '' },
  specialties: { type: [String], default: [] },
  yearsActive: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalCompleted: { type: Number, default: 0 },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  logoUrl: { type: String, default: null },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  coverageRadiusKm: { type: Number, default: 10 },
  documents: { type: [String], default: [] },
  appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Provider', providerSchema);
