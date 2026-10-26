const express = require('express');
const { body, validationResult } = require('express-validator');
const Alert = require('../models/Alert');
const { auth } = require('../middleware/auth');

const router = express.Router();

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * @route   POST /api/alerts/subscribe
 * @desc    Create a new location-based AQI alert
 */
router.post(
  '/subscribe',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude required'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude required'),
    body('thresholdAqi').isInt({ min: 1, max: 500 }).withMessage('Threshold must be between 1 and 500'),
    body('radiusKm').optional().isFloat({ min: 1, max: 100 })
  ],
  checkValidation,
  async (req, res) => {
    try {
      const { email, lat, lng, thresholdAqi, radiusKm, label, notifyMethod } = req.body;

      const alert = await Alert.create({
        userId: req.user ? req.user._id : undefined,
        email,
        label: label || 'My Location',
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        radiusKm: radiusKm || 15,
        thresholdAqi: parseInt(thresholdAqi, 10),
        notifyMethod: notifyMethod || 'email'
      });

      res.status(201).json({
        success: true,
        message: 'Alert subscribed successfully',
        data: alert
      });
    } catch (err) {
      console.error('Alert subscription error:', err);
      res.status(500).json({ success: false, error: 'Could not create alert' });
    }
  }
);

/**
 * @route   GET /api/alerts
 * @desc    Get user alerts (authenticated or by query email)
 */
router.get('/', async (req, res) => {
  try {
    const email = req.query.email;
    const query = {};
    if (email) query.email = email.toLowerCase();

    const alerts = await Alert.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

/**
 * @route   DELETE /api/alerts/:id
 * @desc    Delete an alert
 */
router.delete('/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
    res.json({ success: true, message: 'Alert removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error deleting alert' });
  }
});

module.exports = router;
