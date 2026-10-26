const request = require('supertest');
const app = require('../src/app');

describe('API Route Integration Tests', () => {
  describe('GET /health', () => {
    test('should return 200 and online status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
      expect(typeof res.body.uptimeSeconds).toBe('number');
    });
  });

  describe('POST /api/aqi/calculate', () => {
    test('should calculate AQI from provided pollutant values', async () => {
      const payload = {
        pm25: 65,
        pm10: 95,
        no2: 45,
        so2: 20,
        co: 1.5,
        o3: 40
      };

      const res = await request(app)
        .post('/api/aqi/calculate')
        .send(payload);

      expect(res.body.status || res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.aqi).toBeGreaterThanOrEqual(100);
      expect(res.body.data.category).toBe('Moderate');
      expect(res.body.data.dominantPollutant).toBe('pm25');
    });

    test('should handle empty payload gracefully', async () => {
      const res = await request(app)
        .post('/api/aqi/calculate')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.aqi).toBe(0);
      expect(res.body.data.category).toBe('Good');
    });
  });

  describe('State-Level AQI API Routes', () => {
    test('GET /api/aqi/states should return states list structure', async () => {
      const res = await request(app).get('/api/aqi/states');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('GET /api/aqi/state/:stateName should validate short state names', async () => {
      const res = await request(app).get('/api/aqi/state/a');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    test('GET /api/aqi/state/:stateName should handle non-existent state with 404', async () => {
      const res = await request(app).get('/api/aqi/state/NonExistentStateXYZ');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Input Validation & Error Handling', () => {
    test('GET /api/aqi/nearby should reject invalid latitude/longitude', async () => {
      const res = await request(app).get('/api/aqi/nearby?lat=999&lng=invalid');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    test('GET /unknown-route should return 404', async () => {
      const res = await request(app).get('/unknown-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/auth/register should reject empty fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad-email', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });
});
