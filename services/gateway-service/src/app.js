// src/app.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const client = require('prom-client'); // ✅ NEW: Prometheus client

const BUDGET_SERVICE_URL =
  process.env.BUDGET_SERVICE_URL || 'http://localhost:4002';
const TRANSACT_SERVICE_URL =
  process.env.TRANSACT_SERVICE_URL || 'http://localhost:4003';
const NOTIF_SERVICE_URL =
  process.env.NOTIF_SERVICE_URL || 'http://localhost:4004';

// ---------- PROMETHEUS METRICS SETUP ----------

// Create a registry for all metrics from gateway-service
const register = new client.Registry();

// Collect default Node.js & process metrics with a prefix
client.collectDefaultMetrics({
  register,
  prefix: 'mintify_gateway_',
});

// Counter: total HTTP requests handled by the gateway
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled by gateway-service',
  labelNames: ['method', 'route', 'status_code', 'service'],
});

// Histogram: request duration
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds for gateway-service',
  labelNames: ['method', 'route', 'service'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

// Register custom metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationSeconds);

// ---------- EXPRESS APP SETUP ----------

function logProxy(prefix) {
  return (proxyRes, req) => {
    console.log(
      `[${prefix}] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`
    );
  };
}

// Helper to keep original full path when proxying
function preservePath(path, req) {
  return req.originalUrl;
}

const app = express();

app.use(cors());

// Middleware to record metrics for every request except /metrics
app.use((req, res, next) => {
  if (req.path === '/metrics') {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const durationSeconds = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    httpRequestsTotal
      .labels(req.method, route, String(res.statusCode), 'gateway-service')
      .inc();

    httpRequestDurationSeconds
      .labels(req.method, route, 'gateway-service')
      .observe(durationSeconds);
  });

  next();
});

// ---------- PROXIES ----------

// Proxy for budget-service
const budgetProxy = createProxyMiddleware({
  target: BUDGET_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: preservePath,
  onProxyRes: logProxy('budget'),
});

// Proxy for transact-service
const transactProxy = createProxyMiddleware({
  target: TRANSACT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: preservePath,
  onProxyRes: logProxy('transact'),
});

// Proxy for notif-service
const notifProxy = createProxyMiddleware({
  target: NOTIF_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: preservePath,
  ws: true,
  onProxyRes: logProxy('notif'),
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway-service',
  });
});

// ✅ NEW: Prometheus /metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    console.error('Error generating metrics:', err);
    res.status(500).end('Error generating metrics');
  }
});

// Mount proxies
app.use('/api/budgets', budgetProxy);

app.use('/api/transactions', transactProxy);
app.use('/api/advice', transactProxy);
app.use('/api/summary', transactProxy);

app.use('/api/notifications', notifProxy);
app.use('/notify', notifProxy);

// Error handler
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({ error: 'Gateway error.' });
});

module.exports = { app };
