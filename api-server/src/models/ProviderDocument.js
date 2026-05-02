const mongoose = require('mongoose');

const providerDocumentSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  docType: { type: String, required: true },
  fileName: { type: String, required: true },
  fileData: { type: String, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('ProviderDocument', providerDocumentSchema);
