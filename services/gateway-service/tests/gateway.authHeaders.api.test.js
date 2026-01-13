const request = require('supertest');

// Ensure dev auth mode is enabled for these tests
process.env.ALLOW_DEV_USER = 'true';

// Mock http-proxy-middleware so we can inspect header injection
jest.mock('http-proxy-middleware', () => {
  return {
    createProxyMiddleware: jest.fn((options) => {
      return (req, res, next) => {
        const proxyReq = {
          setHeader: jest.fn(),
        };

        // Support BOTH styles:
        // - old style: options.onProxyReq
        // - v3 style: options.on.proxyReq
        if (typeof options.onProxyReq === 'function') {
          options.onProxyReq(proxyReq, req, res);
        } else if (
          options.on &&
          typeof options.on.proxyReq === 'function'
        ) {
          options.on.proxyReq(proxyReq, req, res);
        }

        res.status(200).json({
          ok: true,
          headerCalls: proxyReq.setHeader.mock.calls,
        });
      };
    }),
  };
});

// IMPORTANT: import after mocks + after env is set
const { app } = require('../src/app');

describe('gateway-service auth header propagation', () => {
  test('injects x-user-id from req.user.id into proxied requests', async () => {
    const res = await request(app)
      .get('/api/transactions')
      .set('x-user-id', 'user123');

    expect(res.status).toBe(200);

    const calls = res.body.headerCalls;
    expect(calls).toEqual(
      expect.arrayContaining([
        ['x-user-id', 'user123'],
      ])
    );
  });

  test('falls back to demo-user when no x-user-id and ALLOW_DEV_USER=true', async () => {
    const res = await request(app).get('/api/transactions');

    expect(res.status).toBe(200);

    const calls = res.body.headerCalls;
    expect(calls).toEqual(
      expect.arrayContaining([
        ['x-user-id', 'demo-user'],
      ])
    );
  });
});
