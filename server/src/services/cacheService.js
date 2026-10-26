const IngestionLog = require('../models/IngestionLog');

// In-memory + DB tracking for ingestion poll throttling
const memoryCache = new Map();

const DEFAULT_TTL_MS = (parseInt(process.env.CACHE_TTL_MINUTES, 10) || 30) * 60 * 1000;

const cacheService = {
  /**
   * Check if a source needs polling based on TTL
   */
  async shouldPollSource(source, ttlMs = DEFAULT_TTL_MS) {
    const memLast = memoryCache.get(source);
    if (memLast && Date.now() - memLast < ttlMs) {
      return false;
    }

    // Check last successful log from DB
    const lastLog = await IngestionLog.findOne({ source, status: 'success' })
      .sort({ timestamp: -1 })
      .lean();

    if (lastLog && (Date.now() - new Date(lastLog.timestamp).getTime()) < ttlMs) {
      memoryCache.set(source, new Date(lastLog.timestamp).getTime());
      return false;
    }

    return true;
  },

  /**
   * Mark source as polled
   */
  recordPoll(source) {
    memoryCache.set(source, Date.now());
  }
};

module.exports = cacheService;
