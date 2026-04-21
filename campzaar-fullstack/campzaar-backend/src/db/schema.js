const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "../../data/campzaar.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.exec("PRAGMA foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT,
  title TEXT,
  description TEXT,
  price REAL,
  original_price REAL,
  type TEXT,
  rent_period TEXT,
  category TEXT,
  condition TEXT,
  tags TEXT,
  images TEXT,
  meetup_location TEXT,
  status TEXT DEFAULT 'active',
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  password TEXT DEFAULT NULL,
  full_name TEXT,
  college TEXT,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  verified INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  joined_at TEXT DEFAULT (datetime('now'))
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS listing_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, listing_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (listing_id) REFERENCES listings(id)
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  reviewer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  listing_id TEXT,
  rating INTEGER,
  text TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (listing_id) REFERENCES listings(id)
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  listing_id TEXT,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(listing_id, buyer_id, seller_id),
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  text TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_buyer ON conversations(buyer_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_seller ON conversations(seller_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);`);

module.exports = db;
