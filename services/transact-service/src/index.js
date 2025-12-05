// src/index.js
require('dotenv').config();
const { connectDB } = require('./db');
const { initRabbit } = require('./rabbit');
const { createApp } = require('./app');

const PORT = process.env.PORT || 4003;

async function start() {
  const app = createApp();

  await connectDB();
  await initRabbit();

  app.listen(PORT, () => {
    console.log(`transact-service running on port ${PORT}.`);
  });
}

// Start the service if this file is run directly
start().catch((err) => {
  console.error('Failed to start transact-service.', err);
  process.exit(1);
});

// Export for potential future use (not required, but harmless)
module.exports = { start };
