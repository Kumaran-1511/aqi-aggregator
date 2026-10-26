const Alert = require('../models/Alert');
const Station = require('../models/Station');
const { sendAQIAlertEmail } = require('../utils/mailer');

async function checkAlertThresholds() {
  try {
    const activeAlerts = await Alert.find({ isActive: true });
    if (activeAlerts.length === 0) return;

    const cooldownMs = 3 * 60 * 60 * 1000; // 3 hours cooldown between notifications

    for (const alert of activeAlerts) {
      if (alert.lastTriggered && Date.now() - new Date(alert.lastTriggered).getTime() < cooldownMs) {
        continue;
      }

      const maxDistanceMeters = (alert.radiusKm || 15) * 1000;
      const stationsNearby = await Station.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: alert.location.coordinates
            },
            $maxDistance: maxDistanceMeters
          }
        },
        isActive: true
      });

      // Check if any station in range crosses the threshold
      const breachingStation = stationsNearby.find(s => s.lastAqi >= alert.thresholdAqi);

      if (breachingStation) {
        console.log(`[Alerts] Alert triggered for ${alert.email} near ${breachingStation.name} (AQI ${breachingStation.lastAqi} >= ${alert.thresholdAqi})`);
        
        await sendAQIAlertEmail({
          to: alert.email,
          stationName: breachingStation.name,
          aqi: breachingStation.lastAqi,
          threshold: alert.thresholdAqi,
          category: breachingStation.lastCategory,
          dominantPollutant: breachingStation.dominantPollutant
        });

        alert.lastTriggered = new Date();
        await alert.save();
      }
    }
  } catch (err) {
    console.error('[Alerts] Error in alert checker job:', err.message);
  }
}

module.exports = { checkAlertThresholds };
