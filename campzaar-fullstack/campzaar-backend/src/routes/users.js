const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const db = require('../db/schema');
const { auth, optionalAuth } = require('../middleware/auth');

// GET /api/users/:id — public profile
router.get('/:id', optionalAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, full_name, college, bio, avatar_url, verified, rating, rating_count, joined_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const stats = {
    listings: db.prepare("SELECT COUNT(*) as c FROM listings WHERE seller_id = ? AND status = 'active'").get(req.params.id).c,
    sold: db.prepare("SELECT COUNT(*) as c FROM listings WHERE seller_id = ? AND status = 'sold'").get(req.params.id).c,
    reviews: db.prepare('SELECT COUNT(*) as c FROM reviews WHERE seller_id = ?').get(req.params.id).c,
  };

  const reviews = db.prepare(`
    SELECT r.*, u.username, u.full_name, u.avatar_url FROM reviews r
    JOIN users u ON u.id = r.reviewer_id
    WHERE r.seller_id = ? ORDER BY r.created_at DESC LIMIT 10
  `).all(req.params.id);

  res.json({ ...user, stats, reviews });
});

// POST /api/users/:id/review
router.post('/:id/review', auth, (req, res) => {
  const { rating, text, listing_id } = req.body;
  if (!rating || !text) return res.status(400).json({ error: 'Rating and text required' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot review yourself' });

  const id = uuid();
  db.prepare('INSERT INTO reviews (id, reviewer_id, seller_id, listing_id, rating, text) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, req.user.id, req.params.id, listing_id || null, Number(rating), text
  );

  // Recalculate rating
  const agg = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE seller_id = ?').get(req.params.id);
  db.prepare('UPDATE users SET rating = ?, rating_count = ? WHERE id = ?').run(
    Math.round(agg.avg * 10) / 10, agg.cnt, req.params.id
  );

  res.status(201).json({ success: true });
});

module.exports = router;

// ─── STARTUPS ROUTER (exported separately) ────────────────────────────────────
const startupsRouter = express.Router();

startupsRouter.get('/', optionalAuth, (req, res) => {
  const { category } = req.query;
  let sql = 'SELECT s.*, u.username, u.full_name, u.college FROM startups s JOIN users u ON u.id = s.founder_id';
  const params = [];
  if (category && category !== 'All') { sql += ' WHERE s.category = ?'; params.push(category); }
  sql += ' ORDER BY s.upvotes DESC';

  const rows = db.prepare(sql).all(...params);
  const enriched = rows.map(s => ({
    ...s,
    tags: JSON.parse(s.tags || '[]'),
    upvoted: req.user ? !!db.prepare('SELECT 1 FROM startup_upvotes WHERE user_id = ? AND startup_id = ?').get(req.user.id, s.id) : false,
  }));
  res.json(enriched);
});

startupsRouter.post('/', auth, (req, res) => {
  const { name, tagline, description, category, stage, raised, looking_for, website, tags } = req.body;
  if (!name || !tagline || !description || !category || !stage) return res.status(400).json({ error: 'Missing fields' });

  const id = uuid();
  db.prepare(`
    INSERT INTO startups (id, founder_id, name, tagline, description, category, stage, raised, looking_for, website, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, name, tagline, description, category, stage, raised || '', looking_for || '', website || '', JSON.stringify(tags || []));

  res.status(201).json(db.prepare('SELECT * FROM startups WHERE id = ?').get(id));
});

startupsRouter.post('/:id/upvote', auth, (req, res) => {
  const exists = db.prepare('SELECT 1 FROM startup_upvotes WHERE user_id = ? AND startup_id = ?').get(req.user.id, req.params.id);
  if (exists) {
    db.prepare('DELETE FROM startup_upvotes WHERE user_id = ? AND startup_id = ?').run(req.user.id, req.params.id);
    db.prepare('UPDATE startups SET upvotes = MAX(0, upvotes - 1) WHERE id = ?').run(req.params.id);
    res.json({ upvoted: false });
  } else {
    db.prepare('INSERT INTO startup_upvotes (user_id, startup_id) VALUES (?, ?)').run(req.user.id, req.params.id);
    db.prepare('UPDATE startups SET upvotes = upvotes + 1 WHERE id = ?').run(req.params.id);
    res.json({ upvoted: true });
  }
});

module.exports.usersRouter = router;
module.exports.startupsRouter = startupsRouter;
