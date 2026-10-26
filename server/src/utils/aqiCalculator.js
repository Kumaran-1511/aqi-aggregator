/**
 * Indian CPCB National AQI Calculation Utility
 * Conforms strictly to Central Pollution Control Board (CPCB) India National Air Quality Index standards.
 * Formula: Ip = ((Ihi - Ilo) / (BPhi - BPlo)) * (Cp - BPlo) + Ilo
 */

const BREAKPOINTS = {
  pm25: [ // µg/m³ (24-hr avg)
    { cLow: 0.0, cHigh: 30.0, iLow: 0, iHigh: 50 },
    { cLow: 30.1, cHigh: 60.0, iLow: 51, iHigh: 100 },
    { cLow: 60.1, cHigh: 90.0, iLow: 101, iHigh: 200 },
    { cLow: 90.1, cHigh: 120.0, iLow: 201, iHigh: 300 },
    { cLow: 120.1, cHigh: 250.0, iLow: 301, iHigh: 400 },
    { cLow: 250.1, cHigh: 380.0, iLow: 401, iHigh: 500 }
  ],
  pm10: [ // µg/m³ (24-hr avg)
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },
    { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },
    { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },
    { cLow: 431, cHigh: 510, iLow: 401, iHigh: 500 }
  ],
  no2: [ // µg/m³ (24-hr avg)
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 180, iLow: 101, iHigh: 200 },
    { cLow: 181, cHigh: 280, iLow: 201, iHigh: 300 },
    { cLow: 281, cHigh: 400, iLow: 301, iHigh: 400 },
    { cLow: 401, cHigh: 500, iLow: 401, iHigh: 500 }
  ],
  so2: [ // µg/m³ (24-hr avg)
    { cLow: 0, cHigh: 40, iLow: 0, iHigh: 50 },
    { cLow: 41, cHigh: 80, iLow: 51, iHigh: 100 },
    { cLow: 81, cHigh: 380, iLow: 101, iHigh: 200 },
    { cLow: 381, cHigh: 800, iLow: 201, iHigh: 300 },
    { cLow: 801, cHigh: 1600, iLow: 301, iHigh: 400 },
    { cLow: 1601, cHigh: 2100, iLow: 401, iHigh: 500 }
  ],
  co: [ // mg/m³ (8-hr avg)
    { cLow: 0.0, cHigh: 1.0, iLow: 0, iHigh: 50 },
    { cLow: 1.1, cHigh: 2.0, iLow: 51, iHigh: 100 },
    { cLow: 2.1, cHigh: 10.0, iLow: 101, iHigh: 200 },
    { cLow: 10.1, cHigh: 17.0, iLow: 201, iHigh: 300 },
    { cLow: 17.1, cHigh: 34.0, iLow: 301, iHigh: 400 },
    { cLow: 34.1, cHigh: 50.0, iLow: 401, iHigh: 500 }
  ],
  o3: [ // µg/m³ (8-hr avg)
    { cLow: 0, cHigh: 50, iLow: 0, iHigh: 50 },
    { cLow: 51, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 168, iLow: 101, iHigh: 200 },
    { cLow: 169, cHigh: 208, iLow: 201, iHigh: 300 },
    { cLow: 209, cHigh: 748, iLow: 301, iHigh: 400 },
    { cLow: 749, cHigh: 1000, iLow: 401, iHigh: 500 }
  ]
};

const CATEGORIES = [
  {
    min: 0,
    max: 50,
    name: 'Good',
    color: '#22C55E',
    textColor: '#ffffff',
    healthText: 'Minimal impact on health. Air quality is satisfactory.',
    tamil: 'நல்லது'
  },
  {
    min: 51,
    max: 100,
    name: 'Satisfactory',
    color: '#84CC16',
    textColor: '#ffffff',
    healthText: 'Minor breathing discomfort to sensitive people.',
    tamil: 'திருப்திகரமானது'
  },
  {
    min: 101,
    max: 200,
    name: 'Moderate',
    color: '#FACC15',
    textColor: '#1e293b',
    healthText: 'Breathing discomfort to people with lungs, asthma and heart diseases.',
    tamil: 'மிதமானது'
  },
  {
    min: 201,
    max: 300,
    name: 'Poor',
    color: '#F97316',
    textColor: '#ffffff',
    healthText: 'Breathing discomfort to most people on prolonged exposure.',
    tamil: 'மோசம்'
  },
  {
    min: 301,
    max: 400,
    name: 'Very Poor',
    color: '#EF4444',
    textColor: '#ffffff',
    healthText: 'Respiratory illness on prolonged exposure. Avoid strenuous outdoor activity.',
    tamil: 'மிக மோசம்'
  },
  {
    min: 401,
    max: Infinity,
    name: 'Severe',
    color: '#991B1B',
    textColor: '#ffffff',
    healthText: 'Affects healthy people and seriously impacts those with existing diseases. Stay indoors.',
    tamil: 'தீவிரமானது'
  }
];

/**
 * Calculate sub-index for a specific pollutant concentration
 * @param {string} pollutant - 'pm25' | 'pm10' | 'co' | 'no2' | 'o3' | 'so2'
 * @param {number} concentration - raw concentration
 * @returns {number|null} sub-index
 */
function calculateSubIndex(pollutant, concentration) {
  if (concentration === null || concentration === undefined || isNaN(concentration) || concentration < 0) {
    return null;
  }

  const table = BREAKPOINTS[pollutant.toLowerCase()];
  if (!table) return null;

  const c = pollutant.toLowerCase() === 'pm25' || pollutant.toLowerCase() === 'co'
    ? Math.round(Number(concentration) * 10) / 10
    : Math.round(Number(concentration));

  for (const bp of table) {
    if (c >= bp.cLow && c <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (c - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }

  // If concentration exceeds highest breakpoint, extrapolate capped at 500
  const highest = table[table.length - 1];
  if (c > highest.cHigh) {
    const extra = ((highest.iHigh - highest.iLow) / (highest.cHigh - highest.cLow)) * (c - highest.cHigh);
    return Math.min(500, Math.round(highest.iHigh + extra));
  }

  return 0;
}

/**
 * Determine category information for a given AQI value
 * @param {number} aqi
 */
function getAQICategory(aqi) {
  const value = Math.max(0, Math.round(aqi || 0));
  for (const cat of CATEGORIES) {
    if (value >= cat.min && value <= cat.max) {
      return {
        aqi: value,
        name: cat.name,
        tamil: cat.tamil,
        color: cat.color,
        textColor: cat.textColor,
        healthText: cat.healthText
      };
    }
  }
  return CATEGORIES[CATEGORIES.length - 1];
}

/**
 * Calculate overall AQI and sub-indices from raw pollutant values
 * @param {Object} pollutants - { pm25, pm10, co, no2, o3, so2 }
 * @returns {Object} { aqi, category, dominantPollutant, subIndices }
 */
function calculateOverallAQI(pollutants = {}) {
  const subIndices = {};
  let maxAQI = 0;
  let dominant = null;

  for (const [key, val] of Object.entries(pollutants)) {
    if (BREAKPOINTS[key.toLowerCase()] && val !== null && val !== undefined) {
      const sub = calculateSubIndex(key, Number(val));
      if (sub !== null) {
        subIndices[key.toLowerCase()] = sub;
        if (sub > maxAQI) {
          maxAQI = sub;
          dominant = key.toLowerCase();
        }
      }
    }
  }

  const category = getAQICategory(maxAQI);

  return {
    aqi: maxAQI,
    category: category.name,
    categoryInfo: category,
    dominantPollutant: dominant || 'pm25',
    subIndices
  };
}

module.exports = {
  BREAKPOINTS,
  CATEGORIES,
  calculateSubIndex,
  getAQICategory,
  calculateOverallAQI
};
