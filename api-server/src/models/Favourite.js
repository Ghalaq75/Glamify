const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
}, { timestamps: true });

favouriteSchema.index({ clientId: 1, providerId: 1 }, { unique: true });

module.exports = mongoose.model('Favourite', favouriteSchema);
