const express = require('express');
const { param, query, validationResult } = require('express-validator');
const Reading = require('../models/Reading');
const Station = require('../models/Station');
const { forecastNextDayAQI } = require('../utils/forecaster');

const router = express.Router();

/**
 * @route   GET /api/forecast/:stationId
 * @desc    Predict next-day AQI for a given station
 */
router.get(
  '/:stationId',
  [
    param('stationId').trim().notEmpty().withMessage('Station ID is required'),
    query('hours').optional().isInt({ min: 6, max: 72 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { stationId } = req.params;
      const hours = parseInt(req.query.hours, 10) || 24;

      const station = await Station.findOne({ stationId });
      if (!station) {
        return res.status(404).json({ success: false, error: 'Station not found' });
      }

      // Fetch last 7 days of readings to train forecast
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const readings = await Reading.find({ stationId, timestamp: { $gte: cutoff } })
        .sort({ timestamp: 1 })
        .lean();

      const forecastResult = forecastNextDayAQI(readings, hours);

      res.json({
        success: true,
        station: {
          stationId: station.stationId,
          name: station.name,
          city: station.city,
          currentAqi: station.lastAqi,
          currentCategory: station.lastCategory
        },
        forecast: forecastResult
      });
    } catch (err) {
      console.error('Forecast error:', err);
      res.status(500).json({ success: false, error: 'Server error generating forecast' });
    }
  }
);

module.exports = router;
