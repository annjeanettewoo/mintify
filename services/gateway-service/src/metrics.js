// services/gateway-service/src/metrics.js
const client = require('prom-client');

const register = new client.Registry();

register.setDefaultLabels({
  service: 'gateway-service',
});

// Collect Node.js + process metrics with a prefix
client.collectDefaultMetrics({
  register,
  prefix: 'mintify_gateway_',
});

// Counter: total HTTP requests handled by the gateway
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled by gateway-service',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

// Histogram: request duration
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds for gateway-service',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Express middleware to track every HTTP request (except /metrics)
function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') return next();

  const path = req.route?.path || req.path || 'unknown';
  const method = req.method || 'UNKNOWN';

  const endTimer = httpRequestDurationSeconds.startTimer({ method, path });

  res.on('finish', () => {
    const statusCode = res.statusCode || 0;

    httpRequestsTotal.inc({
      method,
      path,
      status_code: statusCode,
    });

    endTimer({
      method,
      path,
      status_code: statusCode,
    });
  });

  next();
}

// /metrics handler
async function metricsHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    console.error('Error generating metrics for gateway-service:', err);
    res.status(500).end();
  }
}

module.exports = {
  metricsMiddleware,
  metricsHandler,
};
