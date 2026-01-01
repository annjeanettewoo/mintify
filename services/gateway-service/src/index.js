require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { keycloakAuth } = require('./middleware/keycloakAuth');

const app = express();

app.use(cors());
app.use(keycloakAuth);

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

// Helper to inject x-user-id header from req.user.id
function attachUserHeader(prefix) {
    return (proxyReq, req, res) => {
        const uid = req.user && req.user.id;
        console.log(`[gateway:${prefix}] attachUserHeader called, req.user.id =`, uid);

        if (uid) {
            proxyReq.setHeader('x-user-id', uid);
            console.log(`[gateway:${prefix}] set x-user-id header =`, uid);
        } else {
            console.log(`[gateway:${prefix}] no user id, not setting header.`);
        }
    };
}


// Proxy for budget-service
const budgetProxy = createProxyMiddleware( {
    target: BUDGET_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: preservePath,
    on: {
        proxyReq: attachUserHeader('budget'),
        proxyRes: logProxy('budget'),
    },
});

// Proxy for transact-service
const transactProxy = createProxyMiddleware({
    target: TRANSACT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: preservePath,
     on: {
        proxyReq: attachUserHeader('transact'),
        proxyRes: logProxy('transact'),
    },
});

// Proxy for notif-service
const notifProxy = createProxyMiddleware({
    target: NOTIF_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: preservePath,
    ws: true,
     on: {
        proxyReq: attachUserHeader('notif'),
        proxyRes: logProxy('notif'),
    },
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
