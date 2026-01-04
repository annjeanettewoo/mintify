require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const tempUser = require('./middleware/tempUser');
const budgetRoutes = require('./routes/budgetRoutes');
const { startBudgetConsumer } = require('./rabbit');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Debugger to budget activity from gateway
if (process.env.DEBUG_USER_HEADER === 'true') {    
    app.use((req, res, next) => {
        console.log('[budget] x-user-id =', req.headers['x-user-id']);
        next();
    });
}

app.use(tempUser);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'budget-service',
    });
});

app.use('/api/budgets', budgetRoutes);

const PORT = process.env.PORT || 4002;

async function start() {
    await connectDB();
    await startBudgetConsumer();

    app.listen(PORT, () => {
        console.log(`budget-service running on port ${PORT}.`);
    });
}

start().catch((err) => {
    console.error('Failed to start budget-service.', err);
    process.exit(1);
});
