const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const db = require('../db/schema');
const { auth, optionalAuth } = require('../middleware/auth');

// ✅ helper (FIXED SAFE JSON PARSE)
function safeParse(data, fallback = []) {
  try {
    return JSON.parse(data || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
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

// ✅ GET ALL LISTINGS
router.get('/', optionalAuth, (req, res) => {
  try {
    const {
      category,
      type,
      condition,
      q,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;

    let sql = `SELECT l.* FROM listings l WHERE 1=1`;
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND l.category = ?';
      params.push(category);
    }

    if (type) {
      sql += ' AND l.type = ?';
      params.push(type);
    }

    if (condition) {
      sql += ' AND l.condition = ?';
      params.push(condition);
    }

    if (q) {
      sql += ' AND (l.title LIKE ? OR l.description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    const orderMap = {
      newest: 'l.created_at DESC',
      oldest: 'l.created_at ASC',
      price_asc: 'l.price ASC',
      price_desc: 'l.price DESC',
      popular: 'l.views DESC',
    };

    sql += ` ORDER BY ${orderMap[sort] || 'l.created_at DESC'} LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    let rows = db.prepare(sql).all(...params);
    if (!Array.isArray(rows)) {
      rows = Object.values(rows || {});
    }

    const totalRow = db.prepare(`SELECT COUNT(*) as c FROM listings`).get();
    const total = totalRow?.c || 0;

    res.json({
      listings: rows.map((r) => enrichListing(r, req.user?.id)),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET USER LISTINGS
router.get('/user/:userId', optionalAuth, (req, res) => {
  try {
    const rows = db
      .prepare(
        "SELECT * FROM listings WHERE seller_id = ? AND status = 'active' ORDER BY created_at DESC"
      )
      .all(req.params.userId);

    res.json(
      rows.map((r) => enrichListing(r, req.user?.id))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET SINGLE
router.get('/:id', optionalAuth, (req, res) => {
  const row = db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Listing not found' });

  db.prepare('UPDATE listings SET views = views + 1 WHERE id = ?')
    .run(req.params.id);

  res.json(
    enrichListing({ ...row, views: row.views + 1 }, req.user?.id)
  );
});

// ✅ CREATE
router.post('/', auth, (req, res) => {
  try {
    const {
      title,
      description,
      price,
      original_price,
      type,
      rent_period,
      category,
      condition,
      tags,
      images,
      meetup_location,
    } = req.body;

    if (!title || !description || !price || !type || !category || !condition) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuid();

    db.prepare(`
      INSERT INTO listings (
        id, seller_id, title, description, price, original_price,
        type, rent_period, category, condition, tags, images,
        meetup_location, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      id,
      req.user.id,
      title,
      description,
      Number(price),
      original_price ? Number(original_price) : null,
      type,
      rent_period || null,
      category,
      condition,
      JSON.stringify(tags || []),
      JSON.stringify(images || []),
      meetup_location || ''
    );

    const listing = db
      .prepare('SELECT * FROM listings WHERE id = ?')
      .get(id);

    res.status(201).json(enrichListing(listing, req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ UPDATE
router.put('/:id', auth, (req, res) => {
  const listing = db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .get(req.params.id);

  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (listing.seller_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });

  const {
    title,
    description,
    price,
    original_price,
    condition,
    tags,
    images,
    meetup_location,
    status,
  } = req.body;

  db.prepare(`
    UPDATE listings SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      original_price = COALESCE(?, original_price),
      condition = COALESCE(?, condition),
      tags = COALESCE(?, tags),
      images = COALESCE(?, images),
      meetup_location = COALESCE(?, meetup_location),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title || null,
    description || null,
    price ? Number(price) : null,
    original_price ? Number(original_price) : null,
    condition || null,
    tags ? JSON.stringify(tags) : null,
    images ? JSON.stringify(images) : null,
    meetup_location || null,
    status || null,
    req.params.id
  );

  const updated = db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .get(req.params.id);

  res.json(enrichListing(updated, req.user.id));
});

// ✅ DELETE
router.delete('/:id', auth, (req, res) => {
  const listing = db
    .prepare('SELECT * FROM listings WHERE id = ?')
    .get(req.params.id);

  if (!listing) return res.status(404).json({ error: 'Not found' });
  if (listing.seller_id !== req.user.id)
    return res.status(403).json({ error: 'Forbidden' });

  db.prepare("UPDATE listings SET status = 'removed' WHERE id = ?")
    .run(req.params.id);

  res.json({ success: true });
});

// ✅ LIKE
router.post('/:id/like', auth, (req, res) => {
  const exists = db
    .prepare(
      'SELECT 1 FROM listing_likes WHERE user_id = ? AND listing_id = ?'
    )
    .get(req.user.id, req.params.id);

  if (exists) {
    db.prepare(
      'DELETE FROM listing_likes WHERE user_id = ? AND listing_id = ?'
    ).run(req.user.id, req.params.id);
    res.json({ liked: false });
  } else {
    db.prepare(
      'INSERT INTO listing_likes (user_id, listing_id) VALUES (?, ?)'
    ).run(req.user.id, req.params.id);
    res.json({ liked: true });
  }
});

module.exports = router;