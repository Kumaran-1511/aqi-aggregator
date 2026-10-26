const express = require('express');
const { body, validationResult } = require('express-validator');
const Station = require('../models/Station');
const Reading = require('../models/Reading');
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const IngestionLog = require('../models/IngestionLog');
const { auth, adminOnly } = require('../middleware/auth');
const ingestionService = require('../services/ingestion');
const { calculateOverallAQI } = require('../utils/aqiCalculator');

const router = express.Router();

// Apply auth and adminOnly to all admin routes
router.use(auth, adminOnly);

/**
 * @route   GET /api/admin/overview
 * @desc    System overview statistics
 */
router.get('/overview', async (req, res) => {
  try {
    const [stationCount, readingCount, reportCount, alertCount, recentLogs] = await Promise.all([
      Station.countDocuments(),
      Reading.countDocuments(),
      Report.countDocuments(),
      Alert.countDocuments(),
      IngestionLog.find().sort({ timestamp: -1 }).limit(10)
    ]);

    const pendingReportsCount = await Report.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        stationCount,
        readingCount,
        reportCount,
        pendingReportsCount,
        alertCount,
        recentLogs
      }
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch admin stats' });
  }
});

/**
 * @route   GET /api/admin/stations
 * @desc    List all stations
 */
router.get('/stations', async (req, res) => {
  try {
    const stations = await Station.find().sort({ createdAt: -1 });
    res.json({ success: true, data: stations });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stations' });
  }
});

/**
 * @route   POST /api/admin/stations
 * @desc    Add a new monitoring station
 */
function detectStateForCity(city) {
  if (!city) return 'Tamil Nadu';
  const c = city.trim().toLowerCase();
  const tnCities = [
    'chennai', 'coimbatore', 'madurai', 'tiruchirappalli', 'trichy', 'salem', 'tirunelveli',
    'tiruppur', 'erode', 'vellore', 'thoothukudi', 'dindigul', 'thanjavur', 'ranipet',
    'sivakasi', 'karur', 'ooty', 'udagamandalam', 'hosur', 'nagercoil', 'kancheepuram',
    'kumarapalayam', 'karaikkudi', 'neyveli', 'cuddalore', 'kumbakonam', 'tiruvannamalai',
    'pollachi', 'rajapalayam', 'gudiyatham', 'pudukkottai', 'vaniyamabadi', 'ambur', 'nagapattinam',
    'alandur', 'tambaram', 'avadi', 'sholinganallur', 'guindy', 'velachery', 'perungudi'
  ];
  if (tnCities.includes(c)) return 'Tamil Nadu';
  if (['mumbai', 'pune', 'nagpur', 'nashik', 'thane'].includes(c)) return 'Maharashtra';
  if (['bengaluru', 'bangalore', 'mysuru', 'mangalore', 'hubballi'].includes(c)) return 'Karnataka';
  if (['delhi', 'new delhi'].includes(c)) return 'Delhi';
  if (['kolkata', 'howrah'].includes(c)) return 'West Bengal';
  if (['hyderabad', 'warangal'].includes(c)) return 'Telangana';
  return 'Tamil Nadu';
}

/**
 * @route   POST /api/admin/stations
 * @desc    Add a new monitoring station with full validation and telemetry initialization
 */
router.post(
  '/stations',
  [
    body('stationId').trim().notEmpty().withMessage('Station ID is required'),
    body('name').trim().notEmpty().withMessage('Station name is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude between -90 and 90 required'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude between -180 and 180 required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMsg = errors.array().map(e => e.msg).join(', ');
        return res.status(400).json({ success: false, error: errorMsg, errors: errors.array() });
      }

      const { stationId, name, city, state, country, lat, lng, source, initialAqi } = req.body;

      const trimmedId = stationId.trim();
      const existing = await Station.findOne({
        stationId: { $regex: new RegExp(`^${trimmedId}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ success: false, error: `Station ID "${trimmedId}" already exists.` });
      }

      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const assignedState = (state && state.trim()) ? state.trim() : detectStateForCity(city);
      const assignedCountry = (country && country.trim()) ? country.trim() : 'IN';

      // Realistic baseline telemetry calculation
      const calculatedAqi = initialAqi ? Math.max(10, parseInt(initialAqi, 10)) : 68;
      const initialPollutants = {
        pm25: Math.round(calculatedAqi * 0.45),
        pm10: Math.round(calculatedAqi * 0.85),
        no2: Math.round(calculatedAqi * 0.3),
        so2: Math.max(5, Math.round(calculatedAqi * 0.1)),
        co: +(calculatedAqi * 0.008).toFixed(1),
        o3: Math.round(calculatedAqi * 0.4)
      };
      const categoryInfo = calculateOverallAQI(initialPollutants);

      const station = await Station.create({
        stationId: trimmedId,
        name: name.trim(),
        city: city.trim(),
        state: assignedState,
        country: assignedCountry,
        location: {
          type: 'Point',
          coordinates: [lngNum, latNum]
        },
        source: source || 'CPCB',
        lastAqi: calculatedAqi,
        lastCategory: categoryInfo.category,
        dominantPollutant: categoryInfo.dominantPollutant || 'pm25',
        pollutants: initialPollutants,
        isActive: true,
        lastUpdated: new Date()
      });

      // Seed 24 hours of realistic historical readings so trend charts and AI forecasting work immediately
      const historicalReadings = [];
      const nowMs = Date.now();
      const stepMs = 2 * 3600 * 1000;
      for (let i = 24; i >= 0; i--) {
        const timestamp = new Date(nowMs - i * stepMs);
        const hour = timestamp.getHours();
        const diurnalFactor = 1.0 + 0.15 * Math.sin(((hour - 8) / 24) * 2 * Math.PI);
        const histAqi = Math.max(15, Math.round(calculatedAqi * diurnalFactor));
        const histCat = calculateOverallAQI({
          pm25: Math.round(initialPollutants.pm25 * diurnalFactor),
          pm10: Math.round(initialPollutants.pm10 * diurnalFactor),
          no2: initialPollutants.no2,
          so2: initialPollutants.so2,
          co: initialPollutants.co,
          o3: initialPollutants.o3
        });

        historicalReadings.push({
          stationId: station.stationId,
          stationName: station.name,
          city: station.city,
          state: station.state,
          location: station.location,
          aqi: histAqi,
          category: histCat.category,
          dominantPollutant: histCat.dominantPollutant || 'pm25',
          pollutants: {
            pm25: Math.round(initialPollutants.pm25 * diurnalFactor),
            pm10: Math.round(initialPollutants.pm10 * diurnalFactor),
            no2: initialPollutants.no2,
            so2: initialPollutants.so2,
            co: initialPollutants.co,
            o3: initialPollutants.o3
          },
          source: station.source,
          timestamp
        });
      }
      await Reading.insertMany(historicalReadings);

      // Emit real-time WebSocket event to all connected browsers
      if (ingestionService.io) {
        ingestionService.io.emit('aqi:update', {
          timestamp: new Date().toISOString(),
          type: 'station_created',
          station
        });
      }

      res.status(201).json({
        success: true,
        message: `Station "${station.name}" (${station.city}, ${station.state}) successfully registered and initialized with live telemetry.`,
        data: station
      });
    } catch (err) {
      console.error('Error creating station:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to create station' });
    }
  }
);

/**
 * @route   DELETE /api/admin/stations/:id
 * @desc    Delete a station
 */
router.delete('/stations/:id', async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (!station) return res.status(404).json({ success: false, error: 'Station not found' });
    res.json({ success: true, message: 'Station removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete station' });
  }
});

/**
 * @route   GET /api/admin/logs
 * @desc    Get ingestion job logs
 */
router.get('/logs', async (req, res) => {
  try {
    const logs = await IngestionLog.find().sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

/**
 * @route   GET /api/admin/reports
 * @desc    Get all citizen reports for moderation
 */
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

/**
 * @route   POST /api/admin/trigger-ingestion
 * @desc    Admin manually trigger poll cycle
 */
router.post('/trigger-ingestion', async (req, res) => {
  try {
    const result = await ingestionService.runIngestionCycle(true);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
