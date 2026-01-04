require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const tempUser = require('./middleware/tempUser');
const transactRoutes = require('./routes/transactRoutes');
const adviceRoutes = require('./routes/adviceRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const importRoutes = require('./routes/importRoutes');
const { initRabbit } = require('./rabbit');
const { metricsMiddleware, metricsHandler } = require('./metrics');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Metrics middleware + endpoint (MUST be before tempUser so Prometheus can scrape)
app.use(metricsMiddleware);
app.get('/metrics', metricsHandler);

// Debugger to log transact activity from gateway
if (process.env.DEBUG_USER_HEADERS === 'true') {
  app.use((req, res, next) => {
    console.log('[transact] x-user-id =', req.headers['x-user-id']);
    next();
  });
}

app.use(tempUser);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'transact-service',
  });
});

app.use('/api/transactions', transactRoutes);
app.use('/api/advice', adviceRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/transactions', importRoutes);

const PORT = process.env.PORT || 4003;

async function start() {
  await connectDB();
  await initRabbit();

  app.listen(PORT, () => {
    console.log(`transact-service running on port ${PORT}.`);
  });
}

start().catch((err) => {
  console.error('Failed to start transact-service.', err);
  process.exit(1);
});
