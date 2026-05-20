const crypto = require('crypto');
const express = require('express');
const { v4: uuid } = require('uuid');

const router = express.Router();

const db = require('../db/schema');
const { auth } = require('../middleware/auth');
const { broadcast } = require('../websocket/wsServer');

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function createSystemMessage(conversationId, senderId, text) {
  const id = uuid();
  db.prepare(
    'INSERT INTO messages (id, conversation_id, sender_id, text) VALUES (?, ?, ?, ?)'
  ).run(id, conversationId, senderId, text);
  db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversationId);
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
}

function getConversation(conversationId) {
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
}

router.post('/generate', auth, (req, res) => {
  try {
    const { conversation_id } = req.body;
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id required' });
    }

    const conversation = getConversation(conversation_id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the seller can generate the close OTP' });
    }
    if (conversation.status === 'closed') {
      return res.status(400).json({ error: 'Conversation is already closed' });
    }

    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(conversation.listing_id);
    if (!listing || listing.status !== 'active') {
      return res.status(400).json({ error: 'Listing is no longer active' });
    }

    db.prepare(
      'UPDATE otps SET used = 1 WHERE conversation_id = ? AND used = 0'
    ).run(conversation.id);

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO otps (id, conversation_id, listing_id, buyer_id, seller_id, otp_hash, expires_at, used)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    ).run(
      uuid(),
      conversation.id,
      conversation.listing_id,
      conversation.buyer_id,
      conversation.seller_id,
      hashOtp(otp),
      expiresAt
    );

    db.prepare(
      `INSERT OR IGNORE INTO transactions (id, conversation_id, listing_id, buyer_id, seller_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`
    ).run(
      uuid(),
      conversation.id,
      conversation.listing_id,
      conversation.buyer_id,
      conversation.seller_id
    );

    const message = createSystemMessage(
      conversation.id,
      req.user.id,
      'Close-deal OTP generated. Buyer can verify it to complete the exchange.'
    );

    broadcast([conversation.buyer_id, conversation.seller_id], {
      type: 'otp_requested',
      conversation_id: conversation.id,
      data: {
        expires_at: expiresAt,
        requested_by: req.user.id,
        message: {
          ...message,
          sender: db.prepare(
            'SELECT id, username, full_name, avatar_url FROM users WHERE id = ?'
          ).get(req.user.id),
        },
      },
    });

    res.json({
      otp,
      expires_at: expiresAt,
      conversation_id: conversation.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/verify', auth, (req, res) => {
  try {
    const { conversation_id, otp } = req.body;
    if (!conversation_id || !otp) {
      return res.status(400).json({ error: 'conversation_id and otp required' });
    }

    const conversation = getConversation(conversation_id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the buyer can verify the close OTP' });
    }
    if (conversation.status === 'closed') {
      return res.status(400).json({ error: 'Conversation is already closed' });
    }

    const pendingOtp = db.prepare(
      `SELECT * FROM otps
       WHERE conversation_id = ? AND used = 0
       ORDER BY created_at DESC
       LIMIT 1`
    ).get(conversation.id);

    if (!pendingOtp) {
      return res.status(400).json({ error: 'No active OTP found for this conversation' });
    }

    if (new Date(pendingOtp.expires_at).getTime() < Date.now()) {
      db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(pendingOtp.id);
      return res.status(400).json({ error: 'OTP has expired' });
    }

    if (hashOtp(otp) !== pendingOtp.otp_hash) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    db.prepare('UPDATE otps SET used = 1 WHERE conversation_id = ?').run(conversation.id);
    db.prepare(
      "UPDATE conversations SET status = 'closed', closed_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).run(conversation.id);
    db.prepare(
      "UPDATE listings SET status = 'sold', updated_at = datetime('now') WHERE id = ?"
    ).run(conversation.listing_id);
    db.prepare(
      `UPDATE transactions
       SET status = 'completed', completed_at = datetime('now')
       WHERE conversation_id = ?`
    ).run(conversation.id);

    const message = createSystemMessage(
      conversation.id,
      req.user.id,
      'Deal completed. This chat is now closed and the item has been marked sold.'
    );

    const sender = db.prepare(
      'SELECT id, username, full_name, avatar_url FROM users WHERE id = ?'
    ).get(req.user.id);

    broadcast([conversation.buyer_id, conversation.seller_id], {
      type: 'conversation_closed',
      conversation_id: conversation.id,
      data: {
        listing_id: conversation.listing_id,
        closed_at: new Date().toISOString(),
        closed_by: req.user.id,
        message: {
          ...message,
          sender,
        },
      },
    });

    res.json({
      success: true,
      conversation_id: conversation.id,
      listing_id: conversation.listing_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
