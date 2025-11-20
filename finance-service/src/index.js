require('dotenv').config();
const express = require('express');
const cors = require('cors');
const financeRoutes = require('./routes/financeRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'finance-service'});
});

// API routes
app.use('/api', financeRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/transactions', transactionRoutes);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
    console.log(`finance-service running on port ${PORT}`);
});
