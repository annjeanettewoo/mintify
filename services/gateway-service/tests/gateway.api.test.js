// tests/gateway.api.test.js
const request = require('supertest');

// Mock http-proxy-middleware BEFORE loading app
jest.mock('http-proxy-middleware', () => {
  const mockCreateProxyMiddleware = jest.fn((options) => {
    // Middleware that tags the response with the target, then calls next()
    return (req, res, next) => {
      res.set('x-proxied-to', options.target);
      next();
    };
  });

  return {
    createProxyMiddleware: mockCreateProxyMiddleware
  };
});

const { app } = require('../src/app');

describe('gateway-service', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      service: 'gateway-service'
    });
  });

  test('request to /api/budgets passes through budget proxy middleware', async () => {
    const res = await request(app).get('/api/budgets/some-path');

    // Header set by our mocked proxy middleware
    expect(res.headers['x-proxied-to']).toBe('http://localhost:4002');
  });

  test('request to /api/notifications passes through notif proxy middleware', async () => {
    const res = await request(app).get('/api/notifications');

    expect(res.headers['x-proxied-to']).toBe('http://localhost:4004');
  });
});


// to delete TESTTEST