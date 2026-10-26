const express = require('express');
const cors = require('cors');

const aqiRoutes = require('./routes/aqi');
const { router: authRoutes } = require('./routes/auth');
const alertsRoutes = require('./routes/alerts');
const reportsRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const forecastRoutes = require('./routes/forecast');
const exportRoutes = require('./routes/export');

const app = express();

// Middlewares
const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173'] : '*';
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime())
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount Routes
app.use('/api/aqi', aqiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/export', exportRoutes);

// Global 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
