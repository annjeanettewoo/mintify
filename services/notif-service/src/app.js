// src/app.js
// bump deploy
const express = require('express');
const cors = require('cors');
const tempUser = require('./middleware/tempUser');
const notifRoutes = require('./routes/notifRoutes');
const Notification = require('./models/Notification');
const { metricsMiddleware, metricsHandler } = require('./metrics');

// broadcastNotification is injected so we can stub it in tests
function createApp({ broadcastNotification = () => {} } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(tempUser);

  // Metrics middleware
  app.use(metricsMiddleware);

  // Metrics endpoint
  app.get('/metrics', metricsHandler);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'notif-service',
    });
  });

  // Main REST routes
  app.use('/api/notifications', notifRoutes);

  // POST /notify – create + broadcast
  app.post('/notify', async (req, res) => {
    try {
      const { userId, type, title, message } = req.body;

      if (!userId || !title || !message) {
        return res.status(400).json({
          error: 'userId, title and message are required.',
        });
      }

      const notification = new Notification({
        userId,
        type: type || 'info',
        title,
        message,
      });

      await notification.save();

      // Don’t let a broadcast error break the API
      try {
        broadcastNotification(notification);
      } catch (err) {
        console.error('Error in broadcastNotification handler.', err);
      }

      res.status(201).json(notification);
    } catch (err) {
      console.error('Error creating notification.', err);
      res.status(500).json({ error: 'Failed to create notification.' });
    }
  });

  return app;
}

module.exports = { createApp };
