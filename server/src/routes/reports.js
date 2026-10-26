const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

/**
 * @route   GET /api/reports
 * @desc    Get all approved citizen reports for the map layer
 */
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find({ status: 'approved' }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

/**
 * @route   POST /api/reports
 * @desc    Submit a new citizen air quality report
 */
router.post(
  '/',
  [
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude is required'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude is required'),
    body('category').isIn(['smoke', 'garbage_burning', 'industrial_odor', 'dust_construction', 'vehicle_exhaust', 'other']).withMessage('Valid category required'),
    body('description').trim().isLength({ min: 5, max: 500 }).withMessage('Description must be between 5 and 500 characters')
  ],
  checkValidation,
  async (req, res) => {
    try {
      const { lat, lng, category, severity, description, address, reportedBy } = req.body;

      const report = await Report.create({
        reportedBy: reportedBy || 'Citizen Contributor',
        location: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        address: address || 'User Geolocation',
        category,
        severity: severity || 'medium',
        description,
        status: 'approved' // Automatically make visible in dev, can be moderated in admin
      });

      res.status(201).json({
        success: true,
        message: 'Report submitted successfully and pinned to the map.',
        data: report
      });
    } catch (err) {
      console.error('Report submission error:', err);
      res.status(500).json({ success: false, error: 'Could not submit report' });
    }
  }
);

/**
 * @route   PATCH /api/reports/:id/status
 * @desc    Moderate report (admin only)
 */
router.patch(
  '/:id/status',
  auth,
  adminOnly,
  [
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Valid status required')
  ],
  checkValidation,
  async (req, res) => {
    try {
      const report = await Report.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
      res.json({ success: true, data: report });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to update report status' });
    }
  }
);

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete report (admin only)
 */
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, message: 'Report removed' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
});

module.exports = router;
