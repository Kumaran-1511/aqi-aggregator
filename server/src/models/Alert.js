const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  label: {
    type: String,
    default: 'My Location'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    // [longitude, latitude]
    coordinates: {
      type: [Number],
      required: true
    }
  },
  radiusKm: {
    type: Number,
    default: 15
  },
  thresholdAqi: {
    type: Number,
    required: true,
    default: 150
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastTriggered: {
    type: Date
  },
  notifyMethod: {
    type: String,
    enum: ['email', 'push', 'both'],
    default: 'email'
  }
}, { timestamps: true });

alertSchema.index({ location: '2dsphere' });
alertSchema.index({ email: 1 });

module.exports = mongoose.model('Alert', alertSchema);
