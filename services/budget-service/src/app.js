// src/app.js
const express = require('express');
const cors = require('cors');
const tempUser = require('./middleware/tempUser');
const budgetRoutes = require('./routes/budgetRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Fake user middleware
app.use(tempUser);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'budget-service',
  });
});

// Budget routes
app.use('/api/budgets', budgetRoutes);

module.exports = { app };
