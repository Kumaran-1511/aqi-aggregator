const cron = require('node-cron');
const ingestionService = require('../services/ingestion');
const { checkAlertThresholds } = require('./alertJob');

function startCronJobs(io) {
  ingestionService.setSocketIO(io);

  // Ingestion schedule: default every 30 minutes
  const cronExpr = process.env.INGESTION_CRON || '*/30 * * * *';
  cron.schedule(cronExpr, async () => {
    console.log('[Cron] Running scheduled ingestion cycle...');
    await ingestionService.runIngestionCycle();
    // Run alert check immediately after new data is ingested
    await checkAlertThresholds();
  });

  // Dedicated alert threshold check every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Cron] Running scheduled alert threshold checks...');
    await checkAlertThresholds();
  });

  console.log(`[Cron] Scheduled jobs active. Ingestion: "${cronExpr}", Alert check: "*/15 * * * *"`);
}

module.exports = { startCronJobs };
