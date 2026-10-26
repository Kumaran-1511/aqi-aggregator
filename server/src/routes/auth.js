const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_aqi_jwt_key_2026_dev';
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
};

/**
 * @route   POST /api/auth/register
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  checkValidation,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      const user = await User.create({ name, email, password, role: 'user' });
      const token = generateToken(user);

      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ success: false, error: 'Registration failed' });
    }
  }
);

/**
 * @route   POST /api/auth/login
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  checkValidation,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success: false, error: 'Invalid email or password' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Invalid email or password' });
      }

      const token = generateToken(user);
      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  }
);

/**
 * @route   GET /api/auth/me
 */
router.get('/me', auth, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

/**
 * Seed default admin if missing
 */
async function seedDefaultAdmin() {
  try {
    const adminEmail = 'admin@aqi.local';
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
      await User.create({
        name: 'AQI Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin'
      });
      console.log('[Auth] Default admin initialized: admin@aqi.local / admin123');
    }
  } catch (err) {
    console.error('[Auth] Error seeding default admin:', err.message);
  }
}

module.exports = { router, seedDefaultAdmin };
