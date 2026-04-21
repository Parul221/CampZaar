const { WebSocketServer } = require('ws');
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');
const db = require('../db/schema');
const { JWT_SECRET } = require('../middleware/auth');

// Map: userId -> Set of WebSocket connections
const clients = new Map();

function send(ws, data) {
  if (ws.readyState === 1) {
    ws.send(JSON.stringify(data));
  }
}

function broadcast(userIds, data) {
  userIds.forEach(uid => {
    const sockets = clients.get(uid);
    if (sockets) sockets.forEach(ws => send(ws, data));
  });
}

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let userId = null;

    // Heartbeat to detect dead connections
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      // ── AUTHENTICATE ───────────────────────────────────────────────────────
      if (msg.type === 'auth') {
        try {
          const payload = jwt.verify(msg.token, JWT_SECRET);
          userId = payload.id;

          if (!clients.has(userId)) clients.set(userId, new Set());
          clients.get(userId).add(ws);

          send(ws, { type: 'auth_ok', userId });
          console.log(`WS: User ${userId} connected`);

          // Send unread counts on connect
          const unread = db.prepare(`
            SELECT c.id as conversation_id, COUNT(*) as count
            FROM messages m JOIN conversations c ON c.id = m.conversation_id
            WHERE (c.buyer_id = ? OR c.seller_id = ?) AND m.sender_id != ? AND m.read = 0
            GROUP BY c.id
          `).all(userId, userId, userId);
          send(ws, { type: 'unread_counts', data: unread });
        } catch {
          send(ws, { type: 'error', message: 'Authentication failed' });
        }
        return;
      }

      if (!userId) {
        send(ws, { type: 'error', message: 'Not authenticated' });
        return;
      }

      // ── SEND MESSAGE ────────────────────────────────────────────────────────
      if (msg.type === 'send_message') {
        const { conversation_id, text } = msg;
        if (!conversation_id || !text?.trim()) return;

        const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversation_id);
        if (!conv) return send(ws, { type: 'error', message: 'Conversation not found' });
        if (conv.buyer_id !== userId && conv.seller_id !== userId) return send(ws, { type: 'error', message: 'Forbidden' });

        const id = uuid();
        db.prepare('INSERT INTO messages (id, conversation_id, sender_id, text) VALUES (?, ?, ?, ?)').run(id, conversation_id, userId, text.trim());
        db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversation_id);

        const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
        const sender = db.prepare('SELECT id, username, full_name, avatar_url FROM users WHERE id = ?').get(userId);

        const payload = { type: 'new_message', data: { ...message, sender } };

        // Deliver to both participants
        broadcast([conv.buyer_id, conv.seller_id], payload);
        return;
      }

      // ── MARK READ ───────────────────────────────────────────────────────────
      if (msg.type === 'mark_read') {
        const { conversation_id } = msg;
        if (!conversation_id) return;
        db.prepare('UPDATE messages SET read = 1 WHERE conversation_id = ? AND sender_id != ?').run(conversation_id, userId);
        send(ws, { type: 'marked_read', conversation_id });
        return;
      }

      // ── TYPING INDICATOR ────────────────────────────────────────────────────
      if (msg.type === 'typing') {
        const { conversation_id } = msg;
        const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversation_id);
        if (!conv) return;
        const otherId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
        broadcast([otherId], { type: 'typing', conversation_id, userId });
        return;
      }
    });

    ws.on('close', () => {
      if (userId) {
        const sockets = clients.get(userId);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) clients.delete(userId);
        }
        console.log(`WS: User ${userId} disconnected`);
      }
    });

    ws.on('error', (err) => console.error('WS error:', err.message));
  });

  // Heartbeat interval — clean up dead connections
  const interval = setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  console.log('✅ WebSocket server ready on /ws');
  return wss;
}

module.exports = { setupWebSocket, broadcast, clients };
