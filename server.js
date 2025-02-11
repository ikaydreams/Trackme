const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(express.static('public'));

// Store connected clients
const clients = new Set();

// WebSocket Connection
wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
});

// GPS Data Endpoint
app.post('/api/update-position', (req, res) => {
    const { lat, lng, speed } = req.body;

    // Broadcast to all clients
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'POSITION_UPDATE',
                data: { position: [lat, lng], speed }
            }));
        }
    });

    res.status(200).json({ success: true });
});

// Chatbot Endpoint
app.post('/api/chat', (req, res) => {
    const { query } = req.body;
    const response = processChatQuery(query);
    res.json({ response });
});

// Basic Chatbot Logic
function processChatQuery(query) {
    const intents = {
        location: /location|where/gi,
        eta: /eta|time|arrive/gi,
        speed: /speed|how fast/gi
    };

    const match = Object.entries(intents).find(([_, regex]) => query.match(regex));
    if (match) {
        const [intent] = match;
        return `The bus ${intent} is currently being tracked.`;
    }
    return "I can help with location, ETA, and speed information. What would you like to know?";
}

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));