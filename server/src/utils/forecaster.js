const { getAQICategory } = require('./aqiCalculator');

/**
 * Predict next 24-48 hours of AQI readings for a station using
 * linear trend regression + diurnal atmospheric cycle adjustment.
 * @param {Array} historicalReadings - array of reading documents sorted asc
 * @param {number} horizonHours - future hours to project (e.g. 24)
 */
function forecastNextDayAQI(historicalReadings = [], horizonHours = 24) {
  if (!historicalReadings || historicalReadings.length === 0) {
    return {
      forecast: [],
      trend: 'stable',
      confidence: 'low',
      summary: 'Insufficient historical data for forecasting.'
    };
  }

  // 1. Prepare data points
  const points = historicalReadings.map(r => ({
    time: new Date(r.timestamp).getTime(),
    aqi: r.aqi,
    pm25: r.pollutants?.pm25 || 0,
    hour: new Date(r.timestamp).getHours()
  }));

  const n = points.length;
  const t0 = points[0].time;
  // Convert timestamps to hours elapsed since start
  const x = points.map(p => (p.time - t0) / (1000 * 60 * 60));
  const y = points.map(p => p.aqi);

  // 2. Linear Regression (Least Squares)
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const denom = n * sumXX - sumX * sumX;
  const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  // 3. Project future points in 3-hour steps
  const lastTime = points[points.length - 1].time;
  const lastHourElapsed = (lastTime - t0) / (1000 * 60 * 60);
  const stepHours = 3;
  const steps = Math.floor(horizonHours / stepHours);

  const predictions = [];
  const latestAQI = points[points.length - 1].aqi;

  for (let s = 1; s <= steps; s++) {
    const futureHourElapsed = lastHourElapsed + s * stepHours;
    const futureDate = new Date(lastTime + s * stepHours * 60 * 60 * 1000);
    const futureHourOfDay = futureDate.getHours();

    // Diurnal factor: peaks during morning and evening rush hour (8-10am, 7-10pm)
    const diurnalFactor = 1.0 + 0.18 * Math.sin(((futureHourOfDay - 8) / 24) * 2 * Math.PI);

    // Baseline linear projection
    let projectedAqi = (slope * futureHourElapsed + intercept) * diurnalFactor;

    // Dampen extreme drift: blend 60% projection, 40% latest level
    projectedAqi = Math.round(0.6 * projectedAqi + 0.4 * latestAQI);
    projectedAqi = Math.max(10, Math.min(500, projectedAqi));

    // Confidence bounds (+/- 12% expanding slightly with horizon)
    const margin = Math.round(projectedAqi * (0.08 + (s / steps) * 0.08));
    const lowerBound = Math.max(5, projectedAqi - margin);
    const upperBound = Math.min(500, projectedAqi + margin);

    const cat = getAQICategory(projectedAqi);

    predictions.push({
      timestamp: futureDate.toISOString(),
      hoursAhead: s * stepHours,
      predictedAqi: projectedAqi,
      lowerBound,
      upperBound,
      category: cat.name,
      categoryColor: cat.color,
      healthText: cat.healthText
    });
  }

  // Determine general trend
  let trend = 'stable';
  if (slope > 0.3) trend = 'worsening';
  else if (slope < -0.3) trend = 'improving';

  const nextDayAvg = Math.round(
    predictions.reduce((a, b) => a + b.predictedAqi, 0) / predictions.length
  );
  const nextDayCat = getAQICategory(nextDayAvg);

  return {
    trend,
    slope: Math.round(slope * 100) / 100,
    confidence: n > 20 ? 'high' : 'moderate',
    nextDayAverageAqi: nextDayAvg,
    nextDayCategory: nextDayCat.name,
    predictions
  };
}

module.exports = { forecastNextDayAQI };
