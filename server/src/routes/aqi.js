const express = require('express');
const mongoose = require('mongoose');
const { query, param, body, validationResult } = require('express-validator');
const Station = require('../models/Station');
const Reading = require('../models/Reading');
const ingestionService = require('../services/ingestion');
const cpcbService = require('../services/cpcb');
const { calculateOverallAQI, getAQICategory } = require('../utils/aqiCalculator');

const { cleanStationName } = require('../utils/deduplicateStations');

const router = express.Router();

// Middleware to check validation errors
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * @route   GET /api/aqi/stations, GET /api/aqi/latest
 * @desc    Get all active monitoring stations with current AQI summary, optionally filtered by state or city
 */
router.get(['/stations', '/latest'], async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      let list = cpcbService.getCuratedNationwideCPCBStations().filter(s => s.country === 'IN' && s.state && s.state !== 'International');
      if (req.query.state && req.query.state !== 'all') {
        list = list.filter(s => s.state && s.state.toLowerCase() === req.query.state.trim().toLowerCase());
      }
      if (req.query.city && req.query.city !== 'all') {
        list = list.filter(s => s.city && s.city.toLowerCase() === req.query.city.trim().toLowerCase());
      }
      return res.json({ success: true, count: list.length, data: list });
    }

    const filter = {
      isActive: true,
      country: 'IN',
      state: { $exists: true, $nin: ['', null, 'International', 'Unknown'] }
    };
    if (req.query.state && req.query.state !== 'all') {
      filter.state = new RegExp(`^${req.query.state.trim()}$`, 'i');
    }
    if (req.query.city && req.query.city !== 'all') {
      filter.city = new RegExp(`^${req.query.city.trim()}$`, 'i');
    }
    const rawStations = await Station.find(filter).sort({ name: 1 }).lean();

    // Deduplication safeguard: clean name and deduplicate by canonical identity
    const uniqueStations = [];
    const seen = new Set();
    for (const st of rawStations) {
      st.name = cleanStationName(st.name, st.city);
      const cleanKey = `${(st.state || '').toLowerCase().trim()}::${(st.city || '').toLowerCase().trim()}::${st.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (!seen.has(cleanKey)) {
        seen.add(cleanKey);
        uniqueStations.push(st);
      }
    }

    res.json({
      success: true,
      count: uniqueStations.length,
      data: uniqueStations
    });
  } catch (err) {
    console.error('Error fetching stations:', err);
    res.status(500).json({ success: false, error: 'Server error retrieving stations' });
  }
});

/**
 * @route   GET /api/aqi/states
 * @desc    Get all distinct Indian states with active stations, counts, and average AQI
 */
router.get('/states', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const allStations = cpcbService.getCuratedNationwideCPCBStations().filter(s => s.country === 'IN' && s.state && s.state !== 'International');
      const stateMap = {};
      for (const s of allStations) {
        if (!s.state || s.state === 'International') continue;
        if (!stateMap[s.state]) {
          stateMap[s.state] = { stationCount: 0, aqiSum: 0 };
        }
        stateMap[s.state].stationCount++;
        stateMap[s.state].aqiSum += (s.lastAqi || 0);
      }
      const states = Object.keys(stateMap).sort().map(name => ({
        state: name,
        stationCount: stateMap[name].stationCount,
        avgAqi: Math.round(stateMap[name].aqiSum / stateMap[name].stationCount)
      }));
      return res.json({ success: true, count: states.length, data: states });
    }

    const statesData = await Station.aggregate([
      { $match: { isActive: true, country: 'IN', state: { $exists: true, $nin: [null, '', 'International', 'Unknown'] } } },
      {
        $group: {
          _id: '$state',
          stationCount: { $sum: 1 },
          avgAqi: { $avg: '$lastAqi' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const states = statesData.map(s => ({
      state: s._id,
      stationCount: s.stationCount,
      avgAqi: Math.round(s.avgAqi || 0)
    }));

    res.json({
      success: true,
      count: states.length,
      data: states
    });
  } catch (err) {
    console.error('Error fetching states:', err);
    res.status(500).json({ success: false, error: 'Server error retrieving states' });
  }
});

/**
 * @route   GET /api/aqi/state/:stateName
 * @desc    Get AQI stations and readings for a specific state + state-level average AQI
 */
router.get(
  '/state/:stateName',
  [
    param('stateName').trim().isLength({ min: 2 }).withMessage('State name must be at least 2 characters')
  ],
  checkValidation,
  async (req, res) => {
    try {
      const stateName = req.params.stateName.trim();

      if (mongoose.connection.readyState !== 1) {
        const allStations = cpcbService.getCuratedNationwideCPCBStations();
        const lower = stateName.toLowerCase();
        let matches = allStations.filter(s => s.state && s.state.toLowerCase() === lower);
        if (matches.length === 0) {
          matches = allStations.filter(s => s.state && s.state.toLowerCase().includes(lower));
        }
        if (matches.length === 0) {
          return res.status(404).json({ success: false, message: `No active stations found for state: ${stateName}` });
        }
        const avgAqi = Math.round(matches.reduce((acc, curr) => acc + (curr.lastAqi || 0), 0) / matches.length);
        const categoryInfo = getAQICategory(avgAqi);
        return res.json({
          success: true,
          state: matches[0].state,
          count: matches.length,
          stateAverageAqi: avgAqi,
          stateCategory: categoryInfo.name,
          categoryInfo,
          data: matches
        });
      }

      const regex = new RegExp(`^${stateName}$`, 'i');
      let stations = await Station.find({ state: regex, isActive: true });
      if (stations.length === 0) {
        const partialRegex = new RegExp(stateName, 'i');
        stations = await Station.find({ state: partialRegex, isActive: true });
      }

      if (stations.length === 0) {
        return res.status(404).json({ success: false, message: `No active stations found for state: ${stateName}` });
      }

      // Calculate state-wide average AQI
      const validAqiStations = stations.filter(s => s.lastAqi !== undefined && s.lastAqi !== null);
      const avgAqi = validAqiStations.length > 0
        ? Math.round(validAqiStations.reduce((acc, curr) => acc + curr.lastAqi, 0) / validAqiStations.length)
        : 0;

      const categoryInfo = getAQICategory(avgAqi);

      res.json({
        success: true,
        state: stations[0]?.state || stateName,
        count: stations.length,
        stateAverageAqi: avgAqi,
        stateCategory: categoryInfo.name,
        categoryInfo,
        data: stations
      });
    } catch (err) {
      console.error('Error fetching state stations:', err);
      res.status(500).json({ success: false, error: 'Server error retrieving state data' });
    }
  }
);


/**
 * @route   GET /api/aqi/nearby
 * @desc    Get stations near given coordinates using 2dsphere $nearSphere
 * @query   lat, lng, radius (in km, default 50km)
 */
router.get(
  '/nearby',
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    query('radius').optional().isFloat({ min: 0.1, max: 20000 }).withMessage('Radius must be a positive number')
  ],
  checkValidation,
  async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radiusKm = parseFloat(req.query.radius) || 50;
      const maxDistanceMeters = radiusKm * 1000;

      const stations = await Station.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: maxDistanceMeters
          }
        },
        isActive: true
      });

      // Also get the latest reading for each nearby station
      const stationIds = stations.map(s => s.stationId);
      const latestReadings = await Reading.aggregate([
        { $match: { stationId: { $in: stationIds } } },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: '$stationId',
            latestReading: { $first: '$$ROOT' }
          }
        }
      ]);

      const readingMap = {};
      latestReadings.forEach(r => {
        readingMap[r._id] = r.latestReading;
      });

      const enriched = stations.map(s => {
        const obj = s.toObject();
        obj.latest = readingMap[s.stationId] || null;
        return obj;
      });

      res.json({
        success: true,
        count: enriched.length,
        radiusKm,
        data: enriched
      });
    } catch (err) {
      console.error('Error fetching nearby stations:', err);
      res.status(500).json({ success: false, error: 'Server error querying nearby stations' });
    }
  }
);

/**
 * @route   GET /api/aqi/city/:name
 * @desc    Get AQI stations and readings for a specific city
 */
router.get(
  '/city/:name',
  [
    param('name').trim().isLength({ min: 2 }).withMessage('City name must be at least 2 characters')
  ],
  checkValidation,
  async (req, res) => {
    try {
      const cityName = req.params.name.trim();
      const regex = new RegExp(`^${cityName}$`, 'i');

      const stations = await Station.find({ city: regex, isActive: true });
      if (stations.length === 0) {
        // Fallback: partial match
        const partialRegex = new RegExp(cityName, 'i');
        const partialStations = await Station.find({ city: partialRegex, isActive: true });
        if (partialStations.length === 0) {
          return res.status(404).json({ success: false, message: `No active stations found for city: ${cityName}` });
        }
        return res.json({
          success: true,
          city: cityName,
          count: partialStations.length,
          data: partialStations
        });
      }

      // Calculate city-wide average AQI
      const avgAqi = Math.round(
        stations.reduce((acc, curr) => acc + (curr.lastAqi || 0), 0) / stations.length
      );
      const categoryInfo = getAQICategory(avgAqi);

      res.json({
        success: true,
        city: cityName,
        count: stations.length,
        cityAverageAqi: avgAqi,
        cityCategory: categoryInfo.name,
        categoryInfo,
        data: stations
      });
    } catch (err) {
      console.error('Error fetching city stations:', err);
      res.status(500).json({ success: false, error: 'Server error retrieving city data' });
    }
  }
);

/**
 * @route   GET /api/aqi/history/:stationId
 * @desc    Get chronological historical AQI readings (24h, 7d, 30d)
 */
router.get(
  '/history/:stationId',
  [
    param('stationId').trim().notEmpty().withMessage('Station ID is required'),
    query('range').optional().isIn(['24h', '7d', '30d']).withMessage('Range must be 24h, 7d, or 30d')
  ],
  checkValidation,
  async (req, res) => {
    try {
      const { stationId } = req.params;
      const range = req.query.range || '24h';

      let durationHours = 24;
      if (range === '7d') durationHours = 7 * 24;
      if (range === '30d') durationHours = 30 * 24;

      const cutoffDate = new Date(Date.now() - durationHours * 60 * 60 * 1000);

      const station = await Station.findOne({ stationId });
      if (!station) {
        return res.status(404).json({ success: false, error: 'Station not found' });
      }

      const readings = await Reading.find({
        stationId,
        timestamp: { $gte: cutoffDate }
      })
        .sort({ timestamp: 1 })
        .lean();

      res.json({
        success: true,
        station: {
          stationId: station.stationId,
          name: station.name,
          city: station.city,
          location: station.location,
          lastAqi: station.lastAqi,
          lastCategory: station.lastCategory
        },
        range,
        count: readings.length,
        data: readings
      });
    } catch (err) {
      console.error('Error fetching history:', err);
      res.status(500).json({ success: false, error: 'Server error retrieving historical data' });
    }
  }
);

/**
 * @route   POST /api/aqi/calculate
 * @desc    Utility endpoint: Compute AQI from raw pollutant values
 */
router.post(
  '/calculate',
  [
    body('pm25').optional().isFloat({ min: 0 }),
    body('pm10').optional().isFloat({ min: 0 }),
    body('co').optional().isFloat({ min: 0 }),
    body('no2').optional().isFloat({ min: 0 }),
    body('o3').optional().isFloat({ min: 0 }),
    body('so2').optional().isFloat({ min: 0 })
  ],
  checkValidation,
  (req, res) => {
    const result = calculateOverallAQI(req.body);
    res.json({ success: true, data: result });
  }
);

/**
 * @route   POST /api/aqi/trigger-poll
 * @desc    Manually trigger an ingestion cycle
 */
router.post('/trigger-poll', async (req, res) => {
  try {
    const result = await ingestionService.runIngestionCycle(true);
    res.json({ success: true, message: 'Ingestion cycle executed', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
