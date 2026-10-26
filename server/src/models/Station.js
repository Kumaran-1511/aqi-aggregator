const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  state: {
    type: String,
    trim: true,
    index: true,
    default: ''
  },
  country: {
    type: String,
    default: 'IN',
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    // [longitude, latitude] in GeoJSON
    coordinates: {
      type: [Number],
      required: true
    }
  },
  source: {
    type: String,
    trim: true,
    default: 'cpcb'
  },
  pollutants: {
    type: Object,
    default: () => ({ pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0 })
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastAqi: {
    type: Number,
    default: 0
  },
  lastCategory: {
    type: String,
    default: 'Good'
  },
  dominantPollutant: {
    type: String,
    default: 'pm25'
  }
}, { timestamps: true });

// 2dsphere index on location for geo queries
stationSchema.index({ location: '2dsphere' });
stationSchema.index({ city: 1, name: 1 });
stationSchema.index({ state: 1, city: 1 });

module.exports = mongoose.model('Station', stationSchema);
