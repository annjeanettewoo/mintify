require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
const tempUser = require('./middleware/tempUser');
const transactRoutes = require('./routes/transactRoutes');
const adviceRoutes = require('./routes/adviceRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const { initRabbit } = require('./rabbit');

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

app.use('/api/transactions', transactRoutes);
app.use('/api/advice', adviceRoutes);
app.use('/api/summary', summaryRoutes);

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