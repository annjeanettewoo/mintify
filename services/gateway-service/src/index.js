require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors());

const PORT = process.env.PORT || 4000;

const BUDGET_SERVICE_URL = process.env.BUDGET_SERVICE_URL || 'http://localhost:4002';
const TRANSACT_SERVICE_URL = process.env.TRANSACT_SERVICE_URL || 'http://localhost:4003';
const NOTIF_SERVICE_URL = process.env.NOTIF_SERVICE_URL || 'http://localhost:4004';

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

// Proxy for budget-service
const budgetProxy = createProxyMiddleware( {
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

// Mount proxies
app.use('/api/budgets', budgetProxy);

app.use('/api/transactions', transactProxy);
app.use('/api/advice', transactProxy);
app.use('/api/summary', transactProxy);

app.use('/api/notifications', notifProxy);
app.use('/notify', notifProxy);

app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({ error: 'Gateway error.' });
});

app.listen(PORT, () => {
    console.log(`gateway-service running on port ${PORT}.`);
    console.log(`budget-service: ${BUDGET_SERVICE_URL}`);
    console.log(`transact-service: ${TRANSACT_SERVICE_URL}`);
    console.log(`notif-service: ${NOTIF_SERVICE_URL}`);
});
