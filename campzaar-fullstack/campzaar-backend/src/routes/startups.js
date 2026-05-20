const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db/schema');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function safeParse(value, fallback = []) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function enrichStartup(row, userId) {
  if (!row) return null;

  const productCount = db
    .prepare("SELECT COUNT(*) AS c FROM listings WHERE startup_id = ? AND status = 'active'")
    .get(row.id)?.c || 0;

  return {
    ...row,
    tags: safeParse(row.tags),
    product_count: productCount,
    upvoted: userId
      ? !!db.prepare(
          'SELECT 1 FROM startup_upvotes WHERE user_id = ? AND startup_id = ?'
        ).get(userId, row.id)
      : false,
  };
}

function enrichListing(row, userId) {
  if (!row) return null;

  return {
    ...row,
    tags: safeParse(row.tags),
    images: safeParse(row.images),
    liked: userId
      ? !!db.prepare(
          'SELECT 1 FROM listing_likes WHERE user_id = ? AND listing_id = ?'
        ).get(userId, row.id)
      : false,
    seller: db.prepare(
      'SELECT id, username, full_name, college, avatar_url, verified, rating, rating_count FROM users WHERE id = ?'
    ).get(row.seller_id),
  };
}

router.get('/', optionalAuth, (req, res) => {
  try {
    const { category } = req.query;
    let sql = `
      SELECT s.*, u.username, u.full_name, u.college
      FROM startups s
      JOIN users u ON u.id = s.founder_id
    `;
    const params = [];

    if (category && category !== 'All') {
      sql += ' WHERE s.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY s.upvotes DESC, s.created_at DESC';

    const startups = db
      .prepare(sql)
      .all(...params)
      .map((row) => enrichStartup(row, req.user?.id));

    res.json(startups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/mine', auth, (req, res) => {
  try {
    const startups = db
      .prepare(
        `
        SELECT s.*, u.username, u.full_name, u.college
        FROM startups s
        JOIN users u ON u.id = s.founder_id
        WHERE s.founder_id = ?
        ORDER BY s.created_at DESC
      `
      )
      .all(req.user.id)
      .map((row) => enrichStartup(row, req.user.id));

    res.json(startups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const startup = db
      .prepare(
        `
        SELECT s.*, u.username, u.full_name, u.college, u.bio, u.avatar_url, u.verified
        FROM startups s
        JOIN users u ON u.id = s.founder_id
        WHERE s.id = ?
      `
      )
      .get(req.params.id);

    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    const products = db
      .prepare(
        `
        SELECT *
        FROM listings
        WHERE startup_id = ? AND status = 'active'
        ORDER BY created_at DESC
      `
      )
      .all(req.params.id)
      .map((row) => enrichListing(row, req.user?.id));

    res.json({
      ...enrichStartup(startup, req.user?.id),
      products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const {
      name,
      tagline,
      description,
      category,
      stage,
      raised,
      looking_for,
      website,
      tags,
    } = req.body;

    if (!name || !tagline || !description || !category || !stage) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const id = uuid();
    db.prepare(
      `
      INSERT INTO startups (
        id, founder_id, name, tagline, description, category, stage,
        raised, looking_for, website, tags
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      req.user.id,
      name,
      tagline,
      description,
      category,
      stage,
      raised || '',
      looking_for || '',
      website || '',
      JSON.stringify(tags || [])
    );

    const startup = db
      .prepare(
        `
        SELECT s.*, u.username, u.full_name, u.college
        FROM startups s
        JOIN users u ON u.id = s.founder_id
        WHERE s.id = ?
      `
      )
      .get(id);

    res.status(201).json(enrichStartup(startup, req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/upvote', auth, (req, res) => {
  try {
    const startup = db
      .prepare('SELECT id FROM startups WHERE id = ?')
      .get(req.params.id);

    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    const exists = db
      .prepare(
        'SELECT 1 FROM startup_upvotes WHERE user_id = ? AND startup_id = ?'
      )
      .get(req.user.id, req.params.id);

    if (exists) {
      db.prepare(
        'DELETE FROM startup_upvotes WHERE user_id = ? AND startup_id = ?'
      ).run(req.user.id, req.params.id);
      db.prepare(
        'UPDATE startups SET upvotes = MAX(0, upvotes - 1), updated_at = datetime(\'now\') WHERE id = ?'
      ).run(req.params.id);
      return res.json({ upvoted: false });
    }

    db.prepare(
      'INSERT INTO startup_upvotes (user_id, startup_id) VALUES (?, ?)'
    ).run(req.user.id, req.params.id);
    db.prepare(
      'UPDATE startups SET upvotes = upvotes + 1, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(req.params.id);

    res.json({ upvoted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
