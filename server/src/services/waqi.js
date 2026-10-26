const axios = require('axios');
const { getAQICategory } = require('../utils/aqiCalculator');
const { cleanStationName } = require('../utils/deduplicateStations');

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Jammu and Kashmir', 'Ladakh'
];

const STATE_CENTROIDS = [
  { state: 'Tamil Nadu', lat: 11.1271, lng: 78.6569 },
  { state: 'Kerala', lat: 10.8505, lng: 76.2711 },
  { state: 'Karnataka', lat: 15.3173, lng: 75.7139 },
  { state: 'Maharashtra', lat: 19.7515, lng: 75.7139 },
  { state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { state: 'West Bengal', lat: 22.9868, lng: 87.8550 },
  { state: 'Telangana', lat: 18.1124, lng: 79.0193 },
  { state: 'Andhra Pradesh', lat: 15.9129, lng: 79.7400 },
  { state: 'Gujarat', lat: 22.2587, lng: 71.1924 },
  { state: 'Rajasthan', lat: 27.0238, lng: 74.2179 },
  { state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { state: 'Punjab', lat: 31.1471, lng: 75.3412 },
  { state: 'Haryana', lat: 29.0588, lng: 76.0856 },
  { state: 'Bihar', lat: 25.0961, lng: 85.3131 },
  { state: 'Odisha', lat: 20.9517, lng: 85.0985 },
  { state: 'Madhya Pradesh', lat: 22.9734, lng: 78.6569 },
  { state: 'Assam', lat: 26.2006, lng: 92.9376 },
  { state: 'Goa', lat: 15.2993, lng: 74.1240 },
  { state: 'Jharkhand', lat: 23.6102, lng: 85.2799 },
  { state: 'Chhattisgarh', lat: 21.2787, lng: 81.8661 },
  { state: 'Uttarakhand', lat: 30.0668, lng: 79.0193 },
  { state: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734 },
  { state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { state: 'Tripura', lat: 23.9408, lng: 91.9882 },
  { state: 'Meghalaya', lat: 25.4670, lng: 91.3662 },
  { state: 'Jammu and Kashmir', lat: 33.7782, lng: 74.7973 }
];

function parseLocationInfo(stationName, lat, lng) {
  const name = stationName || '';
  const parts = name.split(',').map(s => s.trim());

  const lowerName = name.toLowerCase();
  if (lowerName.includes('nepal') || lowerName.includes('pakistan') || lowerName.includes('bangladesh') || lowerName.includes('sri lanka')) {
    return null;
  }

  if (lowerName.includes('delhi')) {
    return { state: 'Delhi', city: 'Delhi' };
  }

  for (const st of INDIAN_STATES) {
    if (new RegExp(`\\b${st}\\b`, 'i').test(name)) {
      // If parts has [Station, Area, City, State], city is typically before state
      let city = parts.length > 1 ? parts[parts.length - 2] : st;
      if (city.toLowerCase() === st.toLowerCase() && parts.length > 2) {
        city = parts[parts.length - 3];
      }
      if (st === 'Delhi' || !city) city = st;
      return { state: st, city };
    }
  }

  if (lat && lng) {
    let closestState = 'India';
    let minDistance = Infinity;

    for (const c of STATE_CENTROIDS) {
      const d = Math.sqrt(Math.pow(lat - c.lat, 2) + Math.pow(lng - c.lng, 2));
      if (d < minDistance) {
        minDistance = d;
        closestState = c.state;
      }
    }

    const city = parts[0] || closestState;
    return { state: closestState, city };
  }

  return { state: 'India', city: parts[0] || 'Unknown' };
}

/**
 * 2. WAQI bounding-box fallback/supplement
 * Calls https://api.waqi.info/map/bounds/?latlng=6.5,68,37.5,97.5&token={WAQI_TOKEN}
 * on the same schedule, to catch any non-CPCB stations WAQI aggregates for India.
 * Normalize into the same schema with source: "waqi".
 */
async function fetchIndiaBoundsWAQI() {
  const token = process.env.WAQI_TOKEN || process.env.AQICN_API_TOKEN;
  if (!token) {
    console.warn('[WAQI] No WAQI_TOKEN or AQICN_API_TOKEN configured. Skipping bounds fetch.');
    return [];
  }

  try {
    const url = `https://api.waqi.info/map/bounds/?latlng=6.5,68,37.5,97.5&token=${token}`;
    console.log('[WAQI] Fetching India bounding box stations (latlng=6.5,68,37.5,97.5)...');

    const res = await axios.get(url, { timeout: 12000 });

    if (res.data && res.data.status === 'ok' && Array.isArray(res.data.data)) {
      const rawStations = res.data.data;
      console.log(`[WAQI] Successfully retrieved ${rawStations.length} stations in India bounding box.`);

      const normalized = [];

      for (const item of rawStations) {
        const rawAqi = item.aqi;
        if (rawAqi === '-' || rawAqi == null) continue;

        const aqiNum = parseInt(rawAqi, 10);
        if (isNaN(aqiNum) || aqiNum < 0) continue;

        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (isNaN(lat) || isNaN(lng)) continue;

        const locInfo = parseLocationInfo(item.station?.name, lat, lng);
        if (!locInfo) continue;

        const categoryInfo = getAQICategory(aqiNum);

        const pm25Est = Math.round(aqiNum * 0.75);
        const pollutants = {
          pm25: pm25Est,
          pm10: Math.round(pm25Est * 1.6),
          no2: Math.round(pm25Est * 0.45),
          so2: Math.max(4, Math.round(pm25Est * 0.15)),
          co: Math.round((pm25Est * 0.012 + 0.3) * 10) / 10,
          o3: Math.round(pm25Est * 0.55)
        };

        const rawName = item.station?.name || `Station ${item.uid}`;
        const stationName = cleanStationName(rawName, locInfo.city);

        normalized.push({
          stationId: `waqi-${item.uid}`,
          name: stationName,
          city: locInfo.city,
          state: locInfo.state,
          country: 'IN',
          location: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          source: 'waqi',
          lastAqi: aqiNum,
          lastCategory: categoryInfo.name,
          dominantPollutant: 'pm25',
          pollutants,
          lastUpdated: item.station?.time ? new Date(item.station.time) : new Date(),
          isActive: true
        });
      }

      console.log(`[WAQI] Normalized ${normalized.length} supplementary stations in India.`);
      return normalized;
    }
  } catch (err) {
    console.warn('[WAQI] Bounds fetch error:', err.message);
  }

  return [];
}

async function pollWAQI(city = 'chennai') {
  const token = process.env.WAQI_TOKEN || process.env.AQICN_API_TOKEN;
  if (!token) return null;

  try {
    const res = await axios.get(`https://api.waqi.info/feed/${city}/?token=${token}`, { timeout: 8000 });
    if (res.data && res.data.status === 'ok') {
      const d = res.data.data;
      const aqiNum = typeof d.aqi === 'number' ? d.aqi : 45;
      const cat = getAQICategory(aqiNum);

      return {
        stationId: `waqi-${city.toLowerCase()}`,
        name: d.city?.name || `WAQI ${city} Station`,
        city: city.charAt(0).toUpperCase() + city.slice(1),
        state: 'Tamil Nadu',
        country: 'IN',
        coordinates: [d.city?.geo?.[1] || 80.2707, d.city?.geo?.[0] || 13.0827],
        pollutants: {
          pm25: d.iaqi?.pm25?.v || 45,
          pm10: d.iaqi?.pm10?.v || 75,
          no2: d.iaqi?.no2?.v || 24,
          so2: d.iaqi?.so2?.v || 8,
          co: d.iaqi?.co?.v || 0.8,
          o3: d.iaqi?.o3?.v || 35
        },
        lastAqi: aqiNum,
        lastCategory: cat.name,
        source: 'waqi'
      };
    }
  } catch (err) {
    console.warn(`[WAQI] Poll for ${city} error:`, err.message);
  }
  return null;
}

module.exports = {
  fetchIndiaBoundsWAQI,
  pollWAQI,
  parseLocationInfo
};
