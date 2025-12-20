// services/gateway-service/src/app.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { metricsMiddleware, metricsHandler } = require('./metrics');

const BUDGET_SERVICE_URL =
  process.env.BUDGET_SERVICE_URL || 'http://localhost:4002';
const TRANSACT_SERVICE_URL =
  process.env.TRANSACT_SERVICE_URL || 'http://localhost:4003';
const NOTIF_SERVICE_URL =
  process.env.NOTIF_SERVICE_URL || 'http://localhost:4004';

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

// 🔹 Metrics middleware (for all HTTP requests)
app.use(metricsMiddleware);

// 🔹 Expose /metrics for Prometheus
app.get('/metrics', metricsHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway-service',
  });
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
