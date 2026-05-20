const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "../../data/campzaar.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.exec("PRAGMA foreign_keys = ON");

function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

db.exec(`
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  seller_id TEXT,
  startup_id TEXT,
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

if (!hasColumn('listings', 'startup_id')) {
  db.exec("ALTER TABLE listings ADD COLUMN startup_id TEXT");
}

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
CREATE TABLE IF NOT EXISTS listing_wishlist (
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

if (!hasColumn('conversations', 'status')) {
  db.exec("ALTER TABLE conversations ADD COLUMN status TEXT DEFAULT 'open'");
}

if (!hasColumn('conversations', 'closed_at')) {
  db.exec("ALTER TABLE conversations ADD COLUMN closed_at TEXT DEFAULT NULL");
}

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
db.exec(`CREATE INDEX IF NOT EXISTS idx_wishlist_user ON listing_wishlist(user_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_wishlist_listing ON listing_wishlist(listing_id);`);

db.exec(`
CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
`);

db.exec(`
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  completed_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_otps_conversation ON otps(conversation_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_conversation ON transactions(conversation_id);`);
db.exec(`
CREATE TABLE IF NOT EXISTS startups (
  id TEXT PRIMARY KEY,
  founder_id TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  stage TEXT NOT NULL,
  raised TEXT DEFAULT '',
  looking_for TEXT DEFAULT '',
  website TEXT DEFAULT '',
  tags TEXT DEFAULT '[]',
  upvotes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (founder_id) REFERENCES users(id)
);
`);
db.exec(`
CREATE TABLE IF NOT EXISTS startup_upvotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  startup_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, startup_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (startup_id) REFERENCES startups(id)
);
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_listings_startup ON listings(startup_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_startups_founder ON startups(founder_id);`);

module.exports = db;
