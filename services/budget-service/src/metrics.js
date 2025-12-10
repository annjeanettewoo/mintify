// src/metrics.js
const client = require('prom-client');

// Create a separate registry for this service
const register = new client.Registry();

// Attach a default label so we can group by service in Prometheus
register.setDefaultLabels({
  service: 'budget-service',
});

// Collect basic Node.js process metrics with a service-specific prefix
client.collectDefaultMetrics({
  register,
  prefix: 'mintify_budget_',
});

// HTTP request counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled by budget-service',
  labelNames: ['method', 'path', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds for budget-service',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Domain-specific metric: how many budgets were created successfully
const budgetsCreatedTotal = new client.Counter({
  name: 'budgets_created_total',
  help: 'Total number of budgets created',
  registers: [register],
});

// Express middleware to track every request
function metricsMiddleware(req, res, next) {
  // Ignore /metrics itself to avoid recursion
  if (req.path === '/metrics') {
    return next();
  }

  const path = req.route?.path || req.path || 'unknown';
  const method = req.method || 'UNKNOWN';

  const endTimer = httpRequestDurationSeconds.startTimer({
    method,
    path,
  });

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

    // If this was a successful budget creation, bump the counter
    if (
      method === 'POST' &&
      path.startsWith('/api/budgets') &&
      statusCode >= 200 &&
      statusCode < 300
    ) {
      budgetsCreatedTotal.inc();
    }
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
    console.error('Error generating metrics for budget-service:', err);
    res.status(500).end();
  }
}

module.exports = {
  metricsMiddleware,
  metricsHandler,
};
