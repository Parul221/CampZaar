const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const db = require('../db/schema');
const { auth } = require('../middleware/auth');

function safeUser(id) {
  return db.prepare('SELECT id, username, full_name, avatar_url, college FROM users WHERE id = ?').get(id);
}

// GET /api/conversations — list user's conversations
router.get('/', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT c.*,
      (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND read = 0) as unread_count
    FROM conversations c
    WHERE c.buyer_id = ? OR c.seller_id = ?
    ORDER BY COALESCE(last_message_at, c.created_at) DESC
  `).all(req.user.id, req.user.id, req.user.id);

  const enriched = rows.map(c => ({
    ...c,
    other_user: safeUser(c.buyer_id === req.user.id ? c.seller_id : c.buyer_id),
    listing: c.listing_id ? db.prepare('SELECT id, title, price, images FROM listings WHERE id = ?').get(c.listing_id) : null,
  }));

  res.json(enriched);
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', auth, (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  if (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  // Mark as read
  db.prepare('UPDATE messages SET read = 1 WHERE conversation_id = ? AND sender_id != ?').run(req.params.id, req.user.id);

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(messages.map(m => ({ ...m, sender: safeUser(m.sender_id) })));
});

// POST /api/conversations — start or get existing
router.post('/', auth, (req, res) => {
  try {
    const { listing_id, seller_id } = req.body;
    if (!seller_id) return res.status(400).json({ error: 'seller_id required' });
    if (seller_id === req.user.id) return res.status(400).json({ error: 'Cannot message yourself' });

    // Check if conversation already exists
    let conv = listing_id
      ? db.prepare('SELECT * FROM conversations WHERE listing_id = ? AND buyer_id = ? AND seller_id = ?').get(listing_id, req.user.id, seller_id)
      : db.prepare('SELECT * FROM conversations WHERE buyer_id = ? AND seller_id = ? AND listing_id IS NULL').get(req.user.id, seller_id);

    if (!conv) {
      const id = uuid();
      db.prepare(`
        INSERT INTO conversations (id, listing_id, buyer_id, seller_id) VALUES (?, ?, ?, ?)
      `).run(id, listing_id || null, req.user.id, seller_id);
      conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    }

    res.json({
      ...conv,
      other_user: safeUser(seller_id),
      listing: conv.listing_id ? db.prepare('SELECT id, title, price, images FROM listings WHERE id = ?').get(conv.listing_id) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/conversations/:id/messages — send via HTTP (fallback)
router.post('/:id/messages', auth, (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Message text required' });

  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Not found' });
  if (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const id = uuid();
  db.prepare('INSERT INTO messages (id, conversation_id, sender_id, text) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.user.id, text.trim());
  db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  res.status(201).json({ ...message, sender: safeUser(req.user.id) });
});

module.exports = router;
