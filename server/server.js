import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Store rooms and their connections
const rooms = new Map();

// Helper to broadcast to all clients in a room except sender
function broadcastToRoom(roomId, senderId, message) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.forEach((client) => {
    if (client.id !== senderId && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// Helper to send message to specific client
function sendToClient(roomId, clientId, message) {
  const room = rooms.get(roomId);
  if (!room) return;

  const client = Array.from(room).find(c => c.id === clientId);
  if (client && client.ws.readyState === 1) {
    client.ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  let currentClient = null;

  console.log('New WebSocket connection');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'join':
          const { roomId, clientId, role } = message;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }

          currentClient = { id: clientId, ws, role, roomId };
          rooms.get(roomId).add(currentClient);

          console.log(`Client ${clientId} joined room ${roomId} as ${role}`);

          // Notify others in the room
          broadcastToRoom(roomId, clientId, {
            type: 'user-joined',
            clientId,
            role
          });

          // Send current room state to new client
          const roomClients = Array.from(rooms.get(roomId))
            .filter(c => c.id !== clientId)
            .map(c => ({ id: c.id, role: c.role }));

          ws.send(JSON.stringify({
            type: 'room-state',
            clients: roomClients
          }));

          break;

        case 'offer':
          // Forward offer to specific viewer
          sendToClient(message.roomId, message.targetId, {
            type: 'offer',
            offer: message.offer,
            senderId: message.senderId
          });
          console.log(`Forwarding offer from ${message.senderId} to ${message.targetId}`);
          break;

        case 'answer':
          // Forward answer back to broadcaster
          sendToClient(message.roomId, message.targetId, {
            type: 'answer',
            answer: message.answer,
            senderId: message.senderId
          });
          console.log(`Forwarding answer from ${message.senderId} to ${message.targetId}`);
          break;

        case 'ice-candidate':
          // Forward ICE candidate
          sendToClient(message.roomId, message.targetId, {
            type: 'ice-candidate',
            candidate: message.candidate,
            senderId: message.senderId
          });
          break;

        case 'leave':
          handleDisconnect(currentClient);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    handleDisconnect(currentClient);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleDisconnect(client) {
  if (!client) return;

  const { roomId, id } = client;
  const room = rooms.get(roomId);

  if (room) {
    room.delete(client);

    // Notify others in the room
    broadcastToRoom(roomId, id, {
      type: 'user-left',
      clientId: id
    });

    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }

    console.log(`Client ${id} left room ${roomId}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    timestamp: new Date().toISOString()
  });
});

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
