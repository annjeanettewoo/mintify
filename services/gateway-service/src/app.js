// services/gateway-service/src/app.js
// bump deploy
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { metricsMiddleware, metricsHandler } = require('./metrics');
const { keycloakAuth } = require('./middleware/keycloakAuth');

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

// Keep original full path when proxying
function preservePath(path, req) {
  return req.originalUrl;
}

// IMPORTANT: this must call proxyReq.setHeader(...) because that's what the tests assert
function attachUserHeader(prefix) {
  return (proxyReq, req, res) => {
    // Prefer req.user.id (set by keycloakAuth)
    let uid = req.user && req.user.id;

    // Fallback: allow dev user (demo-user) when enabled
    if (!uid && process.env.ALLOW_DEV_USER === 'true') {
      uid = 'demo-user';
    }

    if (uid) {
      console.log(`[gateway:${prefix}] Injecting x-user-id: ${uid}`); // Added log for verification
      proxyReq.setHeader('x-user-id', uid);
    }
  };
}

const app = express();

app.use(cors());

// Metrics middleware (for all HTTP requests)
app.use(metricsMiddleware);

// Expose /metrics for Prometheus
app.get('/metrics', metricsHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gateway-service',
  });
});

// Auth middleware should run AFTER /metrics and /health so it won't block them
app.use(keycloakAuth);

// ---------- PROXIES (UPDATED FOR V3 SYNTAX) ----------

const budgetProxy = createProxyMiddleware({
  target: BUDGET_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: preservePath,
  // V3 FIX: Events must be inside 'on' object
  on: {
    proxyReq: attachUserHeader('budget'),
    proxyRes: logProxy('budget'),
  }
});

const transactProxy = createProxyMiddleware({
  target: TRANSACT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: preservePath,
  // V3 FIX: Events must be inside 'on' object
  on: {
    proxyReq: attachUserHeader('transact'),
    proxyRes: logProxy('transact'),
  }
});

const notifProxy = createProxyMiddleware({
  target: NOTIF_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: preservePath,
  ws: true,
  // V3 FIX: Events must be inside 'on' object
  on: {
    proxyReq: attachUserHeader('notif'),
    proxyRes: logProxy('notif'),
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
