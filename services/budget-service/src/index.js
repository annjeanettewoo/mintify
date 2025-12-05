require('dotenv').config();
const { app } = require('./app');
const { connectDB } = require('./db');
const { startBudgetConsumer } = require('./rabbit');

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
