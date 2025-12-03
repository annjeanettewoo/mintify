const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'mintify_db';

async function connectDB() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not set in env.');
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            dbName: DB_NAME,
        });
        console.log('Connected to MongoDB (budget-service).');
    } catch (err) {
        console.error('Failed to connect to MongoDB (budget-service).', err);
        process.exit(1);
  }
}

module.exports = { connectDB };
