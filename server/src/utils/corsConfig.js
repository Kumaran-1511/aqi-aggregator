/**
 * Centralized CORS Configuration for Express and Socket.io
 * Ensures consistent origin policies across REST endpoints and WebSocket handshakes.
 */

const defaultOrigins = [
  'https://aqi-aggregator-seven.vercel.app',
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000'
];

function getClientOrigins() {
  const envUrls = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(u => u.trim().replace(/\/$/, '')).filter(Boolean)
    : [];
  return Array.from(new Set([...defaultOrigins, ...envUrls]));
}

function isOriginAllowed(origin) {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!origin) return true;

  const cleanOrigin = origin.trim().replace(/\/$/, '');
  const allowed = getClientOrigins();

  // Exact match with configured origins
  if (allowed.includes(cleanOrigin)) return true;

  // Match any Vercel domain for this project
  if (/^https:\/\/aqi-aggregator.*\.vercel\.app$/.test(cleanOrigin)) return true;

  // Allow localhost origins in development
  if (process.env.NODE_ENV !== 'production' && (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1'))) {
    return true;
  }

  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

module.exports = {
  corsOptions,
  isOriginAllowed,
  getClientOrigins
};
