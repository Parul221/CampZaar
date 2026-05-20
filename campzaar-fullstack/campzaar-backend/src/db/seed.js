const db = require('./schema');
const { v4: uuid } = require('uuid');

function tableEmpty(table) {
  const row = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
  return !row || row.c === 0;
}

function seed() {
  if (tableEmpty('users')) {
    const id = uuid();
    db.prepare(`INSERT INTO users (id, email, username, full_name, college, avatar_url, verified) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, 'alice@example.com', 'alice', 'Alice Student', 'Example College', '', 1);
    console.log('Seeded users');
  }

  if (tableEmpty('startups')) {
    const id = uuid();
    const founderId = db.prepare('SELECT id FROM users LIMIT 1').get().id;
    db.prepare(`INSERT INTO startups (id, founder_id, name, tagline, description, category, stage, tags, upvotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, founderId, 'Campus Crafts', 'Handmade goods by students', 'We sell handmade crafts made on campus', 'Arts', 'early', JSON.stringify(['handmade','crafts']), 5);
    console.log('Seeded startups');
  }

  if (tableEmpty('listings')) {
    const seller = db.prepare('SELECT id FROM users LIMIT 1').get().id;
    const startup = db.prepare('SELECT id FROM startups LIMIT 1').get().id;
    for (let i = 1; i <= 6; i++) {
      db.prepare(`INSERT INTO listings (id, seller_id, startup_id, title, description, price, type, category, condition, tags, images, views) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(uuid(), seller, startup, `Sample Item ${i}`, `A nice sample item number ${i}`, 10 * i, 'sell', 'Clothing', 'Like New', JSON.stringify(['sample','demo']), JSON.stringify([`/uploads/sample${i}.jpg`]), i * 3);
    }
    console.log('Seeded listings');
  }

  console.log('Seeding complete');
}

seed();
