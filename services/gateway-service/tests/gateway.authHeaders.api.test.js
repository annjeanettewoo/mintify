const request = require('supertest');

jest.mock('http-proxy-middleware', () => {
    return {
        createProxyMiddleware: jest.fn((options) => {
            // Return a middleware that triggers onProxyReq so we can assert headers are set
            return (req, res, next) => {
                const proxyReq = {
                    setHeader: jest.fn(),
                };

                if (typeof options.onProxyReq === 'function') {
                    options.onProxyReq(proxyReq, req, res);
                }

                res.status(200).json({
                    ok: true,
                    headerCalls: proxyReq.setHeader.mock.calls,
                });
            };
        }),
    };
});

// IMPORTANT: import after mocks
const { app } = require('../src/app');

describe('gateway-service auth header propagation', () => {
    test('injects x-user-id from req.user.id into proxied requests', async () => {
        // keycloakAuth in dev mode sets req.user.id from x-user-id (or demo-user)
        const res = await request(app)
            .get('/api/transactions')
            .set('x-user-id', 'user123');

        expect(res.status).toBe(200);

        const calls = res.body.headerCalls;
        // Ensure x-user-id header was set on the outgoing proxy request
        expect(calls).toEqual(
            expect.arrayContaining([
                ['x-user-id', 'user123'],
            ])
        );
    });

    test('falls back to demo-user when no x-user-id and ALLOW_DEV_USER=true', async () => {
        const res = await request(app)
            .get('/api/transactions');

        expect(res.status).toBe(200);

        const calls = res.body.headerCalls;
        expect(calls).toEqual(
            expect.arrayContaining([
                ['x-user-id', 'demo-user'],
            ])
        );
    });
});
