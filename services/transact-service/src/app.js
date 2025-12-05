// src/app.js
const express = require('express');
const cors = require('cors');

const tempUser = require('./middleware/tempUser');
const transactRoutes = require('./routes/transactRoutes');
const adviceRoutes = require('./routes/adviceRoutes');
const summaryRoutes = require('./routes/summaryRoutes');

function createApp() {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(tempUser);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'transact-service',
    });
  });

  // Routes
  app.use('/api/transactions', transactRoutes);
  app.use('/api/advice', adviceRoutes);
  app.use('/api/summary', summaryRoutes);

  return app;
}

module.exports = { createApp };
