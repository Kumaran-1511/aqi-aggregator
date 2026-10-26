require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const ingestionService = require('./services/ingestion');
const { seedDefaultAdmin } = require('./routes/auth');
const { startCronJobs } = require('./jobs/ingestionJob');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // 1. Connect MongoDB
  await connectDB();

  // 2. Create HTTP Server & Socket.io
  const server = http.createServer(app);
  const allowedOrigins = process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'https://aqi-aggregator.vercel.app'] : '*';
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST']
    }
  });

  // Socket.io connection logic
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Allow client to request immediate refresh on connect
    socket.on('request:refresh', async () => {
      console.log(`[Socket.io] Refresh requested by ${socket.id}`);
      await ingestionService.runIngestionCycle();
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Connect ingestion service with socket
  ingestionService.setSocketIO(io);

  // 3. Initialize baseline stations and historical records
  await ingestionService.initializeDatabase();

  // 4. Seed default admin credentials
  await seedDefaultAdmin();

  // 5. Start background cron jobs (ingestion & alerts)
  startCronJobs(io);

  // 6. Listen
  server.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 AQI Aggregator & Mapping Backend is running!`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`📡 Socket.io: enabled`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`=================================================`);
  });
}

bootstrap().catch(err => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
