const mongoose = require('mongoose');

const ingestionLogSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    required: true
  },
  stationsPolled: {
    type: Number,
    default: 0
  },
  readingsStored: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String,
    default: null
  },
  durationMs: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

ingestionLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('IngestionLog', ingestionLogSchema);
