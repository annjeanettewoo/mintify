require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const amqp = require('amqplib');
const { connectDB } = require('./db');
const tempUser = require('./middleware/tempUser');
const notifRoutes = require('./routes/notifRoutes');
const Notification = require('./models/Notification');
const { metricsMiddleware, metricsHandler } = require('./metrics');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || 'mintify.events';
const QUEUE_NAME = process.env.RABBITMQ_QUEUE || 'mintify.notif';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Metrics middleware + endpoint (MUST be before tempUser so Prometheus can scrape)
app.use(metricsMiddleware);
app.get('/metrics', metricsHandler);

// Debugger to notif activity from gateway
if (process.env.DEBUG_USER_HEADER === 'true') {
  app.use((req, res, next) => {
    console.log('[notif] x-user-id =', req.headers['x-user-id']);
    next();
  });
}

app.use(tempUser);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'notif-service',
  });
});

app.use('/api/notifications', notifRoutes);

// In-memory map to link userId to set of WebSocket clients
const userClients = new Map();

// Helper to broadcast notification to all connected clients
function broadcastNotification(notification) {
  const userId = notification.userId;
  const clients = userClients.get(userId);
  if (!clients) {
    return;
  }

  const payload = JSON.stringify({
    type: 'NOTIFICATION',
    data: {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
      read: notification.read,
    },
  });

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// Start RabbitMQ consumer to handle SPENDING_RECORDED events
async function startRabbitConsumer() {
  if (!RABBITMQ_URL) {
    console.warn('RABBITMQ_URL not set, skipping RabbitMQ consumer in notif-service.');
    return;
  }

  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', {
      durable: true,
    });

    const q = await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    await channel.bindQueue(q.queue, EXCHANGE_NAME, 'spending.recorded');

    console.log(`RabbitMQ consumer bound to exchange=${EXCHANGE_NAME}, queue=${q.queue}.`);

    channel.consume(q.queue, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const raw = msg.content.toString();
        const event = JSON.parse(raw);

        if (event.type === 'SPENDING_RECORDED') {
          const notification = new Notification({
            userId: event.userId,
            type: 'threshold',
            title: 'New spending recorded',
            message: `You spent ${event.amount} in ${event.category}.`,
          });

          await notification.save();
          broadcastNotification(notification);
        }

        channel.ack(msg);
      } catch (err) {
        console.error('Error handling RabbitMQ message in notif-service.', err);
        // Do not requeue bad messages to avoid infinite loops
        channel.nack(msg, false, false);
      }
    });
  } catch (err) {
    console.error('Failed to start RabbitMQ consumer in notif-service.', err);
  }
}

// POST /notify
// Body: { userId, type, title, message }
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
    broadcastNotification(notification);
    res.status(201).json(notification);
  } catch (err) {
    console.error('Error creating notification.', err);
    res.status(500).json({ error: 'Failed to create notification.' });
  }
});

const PORT = process.env.PORT || 4004;

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId') || 'demo-user';

      if (!userClients.has(userId)) {
        userClients.set(userId, new Set());
      }
      const clients = userClients.get(userId);
      clients.add(ws);

      console.log(`WebSocket connected for userId=${userId}, total clients=${clients.size}.`);

      ws.on('close', () => {
        clients.delete(ws);
        console.log(`WebSocket disconnected for userId=${userId}, remaining clients=${clients.size}.`);
        if (clients.size === 0) {
          userClients.delete(userId);
        }
      });
    } catch (err) {
      console.error('Error handling WebSocket connection.', err);
      ws.close();
    }
  });

  await startRabbitConsumer();

  server.listen(PORT, () => {
    console.log(`notif-service running on port ${PORT}.`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws?userId=<USER_ID>`);
  });
}

start().catch((err) => {
  console.error('Failed to start notif-service.', err);
  process.exit(1);
});
