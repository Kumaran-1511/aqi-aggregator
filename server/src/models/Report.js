const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reportedBy: {
    type: String,
    default: 'Anonymous Citizen'
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
  address: {
    type: String,
    default: 'Nearby location'
  },
  category: {
    type: String,
    enum: ['smoke', 'garbage_burning', 'industrial_odor', 'dust_construction', 'vehicle_exhaust', 'other'],
    required: true,
    default: 'smoke'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'severe'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  }
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
