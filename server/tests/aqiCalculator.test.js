const {
  calculateSubIndex,
  getAQICategory,
  calculateOverallAQI
} = require('../src/utils/aqiCalculator');

describe('CPCB National AQI Calculation Engine Tests', () => {
  describe('calculateSubIndex for PM2.5 (CPCB Standard)', () => {
    test('PM2.5 = 20 µg/m³ should be in Good band (0-50)', () => {
      const aqi = calculateSubIndex('pm25', 20);
      expect(aqi).toBeGreaterThanOrEqual(0);
      expect(aqi).toBeLessThanOrEqual(50);
      expect(aqi).toBe(33);
    });

    test('PM2.5 = 45 µg/m³ should be in Satisfactory band (51-100)', () => {
      const aqi = calculateSubIndex('pm25', 45);
      expect(aqi).toBeGreaterThanOrEqual(51);
      expect(aqi).toBeLessThanOrEqual(100);
      expect(aqi).toBe(75);
    });

    test('PM2.5 = 75 µg/m³ should fall in Moderate range (101-200)', () => {
      const aqi = calculateSubIndex('pm25', 75);
      expect(aqi).toBeGreaterThanOrEqual(101);
      expect(aqi).toBeLessThanOrEqual(200);
      expect(aqi).toBe(150);
    });

    test('PM2.5 = 105 µg/m³ should fall in Poor range (201-300)', () => {
      const aqi = calculateSubIndex('pm25', 105);
      expect(aqi).toBeGreaterThanOrEqual(201);
      expect(aqi).toBeLessThanOrEqual(300);
      expect(aqi).toBe(250);
    });

    test('PM2.5 = 180 µg/m³ should fall in Very Poor range (301-400)', () => {
      const aqi = calculateSubIndex('pm25', 180);
      expect(aqi).toBeGreaterThanOrEqual(301);
      expect(aqi).toBeLessThanOrEqual(400);
    });

    test('PM2.5 = 300 µg/m³ should fall in Severe range (401-500)', () => {
      const aqi = calculateSubIndex('pm25', 300);
      expect(aqi).toBeGreaterThanOrEqual(401);
      expect(aqi).toBeLessThanOrEqual(500);
    });

    test('Handles invalid and negative inputs safely', () => {
      expect(calculateSubIndex('pm25', -5)).toBeNull();
      expect(calculateSubIndex('pm25', null)).toBeNull();
      expect(calculateSubIndex('pm25', undefined)).toBeNull();
      expect(calculateSubIndex('pm25', 'invalid')).toBeNull();
    });
  });

  describe('calculateSubIndex for other CPCB pollutants', () => {
    test('PM10 = 50 µg/m³ should be exactly 50 (Good)', () => {
      expect(calculateSubIndex('pm10', 50)).toBe(50);
    });

    test('CO = 1.0 mg/m³ should be 50', () => {
      expect(calculateSubIndex('co', 1.0)).toBe(50);
    });

    test('NO2 = 40 µg/m³ should be 50', () => {
      expect(calculateSubIndex('no2', 40)).toBe(50);
    });

    test('SO2 = 40 µg/m³ should be 50', () => {
      expect(calculateSubIndex('so2', 40)).toBe(50);
    });
  });

  describe('getAQICategory (CPCB Scale)', () => {
    test('returns exact CPCB category names and colors', () => {
      expect(getAQICategory(25).name).toBe('Good');
      expect(getAQICategory(25).color).toBe('#22C55E');

      expect(getAQICategory(75).name).toBe('Satisfactory');
      expect(getAQICategory(75).color).toBe('#84CC16');

      expect(getAQICategory(150).name).toBe('Moderate');
      expect(getAQICategory(150).color).toBe('#FACC15');

      expect(getAQICategory(250).name).toBe('Poor');
      expect(getAQICategory(250).color).toBe('#F97316');

      expect(getAQICategory(350).name).toBe('Very Poor');
      expect(getAQICategory(350).color).toBe('#EF4444');

      expect(getAQICategory(450).name).toBe('Severe');
      expect(getAQICategory(450).color).toBe('#991B1B');
    });

    test('includes Tamil translation for CPCB bands', () => {
      expect(getAQICategory(25).tamil).toBe('நல்லது');
      expect(getAQICategory(75).tamil).toBe('திருப்திகரமானது');
      expect(getAQICategory(150).tamil).toBe('மிதமானது');
      expect(getAQICategory(250).tamil).toBe('மோசம்');
      expect(getAQICategory(350).tamil).toBe('மிக மோசம்');
      expect(getAQICategory(450).tamil).toBe('தீவிரமானது');
    });
  });

  describe('calculateOverallAQI', () => {
    test('takes maximum sub-index as overall AQI', () => {
      const result = calculateOverallAQI({
        pm25: 75,   // subindex ~150 (Moderate)
        pm10: 40,   // subindex ~40
        no2: 30,    // subindex ~38
        so2: 15,
        co: 0.8,
        o3: 40
      });

      expect(result.aqi).toBe(150);
      expect(result.dominantPollutant).toBe('pm25');
      expect(result.category).toBe('Moderate');
      expect(result.subIndices.pm25).toBe(150);
    });
  });
});
