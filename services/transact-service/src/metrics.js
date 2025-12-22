// src/metrics.js
const client = require('prom-client');

const register = new client.Registry();

register.setDefaultLabels({
  service: 'transact-service',
});

client.collectDefaultMetrics({
  register,
  prefix: 'mintify_transact_',
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled by transact-service',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds for transact-service',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Domain-specific: number of transactions created successfully
const transactionsCreatedTotal = new client.Counter({
  name: 'transactions_created_total',
  help: 'Total number of transactions created',
  registers: [register],
});

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') {
    return next();
  }

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

    // Count successful transaction creation
    if (
      method === 'POST' &&
      path.startsWith('/api/transactions') &&
      statusCode >= 200 &&
      statusCode < 300
    ) {
      transactionsCreatedTotal.inc();
    }
  });

  next();
}

async function metricsHandler(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    console.error('Error generating metrics for transact-service:', err);
    res.status(500).end();
  }
}

module.exports = {
  metricsMiddleware,
  metricsHandler,
};
