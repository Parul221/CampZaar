const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db/schema');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:id', optionalAuth, (req, res) => {
  const user = db
    .prepare(
      `
      SELECT id, username, full_name, college, bio, avatar_url, verified, rating, rating_count, joined_at
      FROM users
      WHERE id = ?
    `
    )
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const stats = {
    listings: db
      .prepare("SELECT COUNT(*) AS c FROM listings WHERE seller_id = ? AND status = 'active'")
      .get(req.params.id).c,
    sold: db
      .prepare("SELECT COUNT(*) AS c FROM listings WHERE seller_id = ? AND status = 'sold'")
      .get(req.params.id).c,
    reviews: db
      .prepare('SELECT COUNT(*) AS c FROM reviews WHERE seller_id = ?')
      .get(req.params.id).c,
  };

  const reviews = db
    .prepare(
      `
      SELECT r.*, u.username, u.full_name, u.avatar_url
      FROM reviews r
      JOIN users u ON u.id = r.reviewer_id
      WHERE r.seller_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
    `
    )
    .all(req.params.id);

  res.json({ ...user, stats, reviews });
});

router.post('/:id/review', auth, (req, res) => {
  const { rating, text, listing_id } = req.body;

  if (!rating || !text) {
    return res.status(400).json({ error: 'Rating and text required' });
  }

  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot review yourself' });
  }

  const id = uuid();
  db.prepare(
    'INSERT INTO reviews (id, reviewer_id, seller_id, listing_id, rating, text) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.user.id, req.params.id, listing_id || null, Number(rating), text);

  const aggregate = db
    .prepare('SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE seller_id = ?')
    .get(req.params.id);

  db.prepare('UPDATE users SET rating = ?, rating_count = ? WHERE id = ?').run(
    Math.round(aggregate.avg * 10) / 10,
    aggregate.cnt,
    req.params.id
  );

  res.status(201).json({ success: true });
});

module.exports = router;
