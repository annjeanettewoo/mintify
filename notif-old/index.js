require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const {WebSocketServer} = require('ws');

const app = express();
const PORT = process.env.PORT || 4003;

// middlewares
app.use(cors());
app.use(express.json());

// health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'notif-service',
    });
});

// create HTTP server that uses express app
const server = http.createServer(app);

// create WebSocket server
const wss = new WebSocketServer({server});

wss.on('connection', (ws) => {
    console.log('WebSocket client connected to notif-service.');

    // optional hello message
    ws.send(JSON.stringify({
        type: 'hello',
        message: 'Connected to notif-service WebSocke.t',
    }));

    ws.on('close', () => {
        console.log('WebSocket client disconnected.');
    });
});

// helper to broadcast notification to all connected clients
function broadcastNotification(notification){
    const payload = {
        type: 'notification',
        sentAt: new Date().toISOString(),
        ...notification,    // title, message, category, level
    };

    const data = JSON.stringify(payload);

    wss.clients.forEach((client) => {
        if (client.readyState === 1){    // 1 === WebSocket.OPEN
            client.send(data);
        }
    });
}

// HTTP endpoint to trigger notification
app.post('/notify', (req, res) => {
    const {title, message, category, level} = req.body;

    if (!message){
        return res.status(400).json({
            error: 'Field "message" is required.',
        });
    }

    broadcastNotification({title, message, category, level});

    return res.status(202).json({
        status: 'queued',
        deliveredTo: 'websocket-clients',
    });
});

// start listening
server.listen(PORT, () => {
    console.log(`notif-service (HTTP + WS) running on port ${PORT}.`);
});
