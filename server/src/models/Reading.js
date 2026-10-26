const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    index: true,
    ref: 'Station'
  },
  stationName: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    trim: true,
    index: true,
    default: ''
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
  aqi: {
    type: Number,
    required: true,
    min: 0,
    max: 500
  },
  category: {
    type: String,
    required: true
  },
  dominantPollutant: {
    type: String,
    default: 'pm25'
  },
  pollutants: {
    pm25: { type: Number, default: 0 },
    pm10: { type: Number, default: 0 },
    co: { type: Number, default: 0 },
    no2: { type: Number, default: 0 },
    o3: { type: Number, default: 0 },
    so2: { type: Number, default: 0 }
  },
  subIndices: {
    pm25: { type: Number, default: 0 },
    pm10: { type: Number, default: 0 },
    co: { type: Number, default: 0 },
    no2: { type: Number, default: 0 },
    o3: { type: Number, default: 0 },
    so2: { type: Number, default: 0 }
  },
  source: {
    type: String,
    default: 'cpcb'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Geospatial 2dsphere index for $nearSphere queries
readingSchema.index({ location: '2dsphere' });
// Compound index for historical trend queries per station
readingSchema.index({ stationId: 1, timestamp: -1 });
readingSchema.index({ state: 1, timestamp: -1 });

module.exports = mongoose.model('Reading', readingSchema);
