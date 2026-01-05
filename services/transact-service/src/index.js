require('dotenv').config();
const { connectDB } = require('./db');
const { initRabbit } = require('./rabbit');
const { createApp } = require('./app');

const PORT = process.env.PORT || 4003;

async function start() {
  await connectDB();
  await initRabbit();

  const app = createApp();

  // Optional debugger to log transact activity from gateway
  if (process.env.DEBUG_USER_HEADERS === 'true') {
    app.use((req, res, next) => {
      console.log('[transact] x-user-id =', req.headers['x-user-id']);
      next();
    });
  }

  app.listen(PORT, () => {
    console.log(`transact-service running on port ${PORT}.`);
  });
}

start().catch((err) => {
  console.error('Failed to start transact-service.', err);
  process.exit(1);
});
