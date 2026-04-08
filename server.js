const path = require('path');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';
const TURN_URL = process.env.TURN_URL || '';
const TURN_USERNAME = process.env.TURN_USERNAME || '';
const TURN_CREDENTIAL = process.env.TURN_CREDENTIAL || '';
const rooms = new Map();

function safeSend(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Map(),
      sharedState: {
        hotspots: [],
        match: { selfLp: 8000, opponentLp: 8000, phase: 'Draw Phase' },
        updatedAt: Date.now()
      }
    });
  }
  return rooms.get(roomId);
}

function summarizeRoom(room) {
  return Array.from(room.clients.values()).map(client => ({
    playerId: client.playerId,
    name: client.name,
    side: client.side
  }));
}

function broadcastRoster(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const roster = summarizeRoom(room);
  room.clients.forEach(client => {
    safeSend(client.ws, { type: 'room-roster', roster, roomId });
  });
}

function cleanupRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.clients.size === 0) rooms.delete(roomId);
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

app.get('/config', (_req, res) => {
  const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
  if (TURN_URL && TURN_USERNAME && TURN_CREDENTIAL) {
    iceServers.push({
      urls: TURN_URL.split(',').map(v => v.trim()).filter(Boolean),
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL
    });
  }

  res.json({
    publicBaseUrl: PUBLIC_BASE_URL,
    iceServers,
    hasTurn: Boolean(TURN_URL && TURN_USERNAME && TURN_CREDENTIAL)
  });
});

wss.on('connection', (ws) => {
  const session = {
    roomId: null,
    playerId: null,
    name: 'Player',
    side: 'self'
  };

  ws.on('message', raw => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      safeSend(ws, { type: 'error', message: 'Invalid JSON message.' });
      return;
    }

    if (message.type === 'join-room') {
      const roomId = String(message.roomId || '').trim();
      const playerId = String(message.playerId || '').trim();
      if (!roomId || !playerId) {
        safeSend(ws, { type: 'error', message: 'roomId and playerId are required.' });
        return;
      }

      if (session.roomId && rooms.has(session.roomId)) {
        const previousRoom = rooms.get(session.roomId);
        previousRoom.clients.delete(session.playerId);
        broadcastRoster(session.roomId);
        cleanupRoom(session.roomId);
      }

      session.roomId = roomId;
      session.playerId = playerId;
      session.name = String(message.name || 'Player').slice(0, 40);
      session.side = message.side === 'opponent' ? 'opponent' : 'self';

      const room = getRoom(roomId);
      room.clients.set(playerId, {
        ws,
        playerId,
        name: session.name,
        side: session.side
      });

      safeSend(ws, {
        type: 'room-joined',
        roomId,
        playerId,
        sharedState: room.sharedState,
        roster: summarizeRoom(room)
      });

      room.clients.forEach(client => {
        if (client.playerId !== playerId) {
          safeSend(client.ws, {
            type: 'peer-joined',
            playerId,
            name: session.name,
            side: session.side
          });
        }
      });

      broadcastRoster(roomId);
      return;
    }

    if (!session.roomId || !rooms.has(session.roomId)) {
      safeSend(ws, { type: 'error', message: 'Join a room first.' });
      return;
    }

    const room = rooms.get(session.roomId);

    if (message.type === 'state-update') {
      room.sharedState = {
        ...room.sharedState,
        ...message.state,
        updatedAt: Date.now()
      };
      room.clients.forEach(client => {
        if (client.playerId !== session.playerId) {
          safeSend(client.ws, {
            type: 'state-update',
            from: session.playerId,
            state: room.sharedState
          });
        }
      });
      return;
    }

    if (message.type === 'signal') {
      const target = room.clients.get(message.targetPlayerId);
      if (!target) return;
      safeSend(target.ws, {
        type: 'signal',
        fromPlayerId: session.playerId,
        signal: message.signal
      });
      return;
    }
  });

  ws.on('close', () => {
    if (!session.roomId || !rooms.has(session.roomId)) return;
    const room = rooms.get(session.roomId);
    room.clients.delete(session.playerId);
    room.clients.forEach(client => {
      safeSend(client.ws, {
        type: 'peer-left',
        playerId: session.playerId
      });
    });
    broadcastRoster(session.roomId);
    cleanupRoom(session.roomId);
  });
});

server.listen(PORT, () => {
  console.log(`YGO Remote running on port ${PORT}`);
});
