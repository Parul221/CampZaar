const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const db = require("../db/schema");
const passport = require("../config/passport");

const JWT_SECRET = process.env.JWT_SECRET;

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { email, username, password, full_name, college } = req.body;

    if (!email || !username || !password || !full_name || !college) {
      return res.status(400).json({ error: "All fields required" });
    }

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
      .get(email, username);

    if (existing) {
      return res.status(409).json({ error: "Already exists" });
    }

    const id = uuid();
    const hashed = await bcrypt.hash(password, 10);

    db.prepare(`
      INSERT INTO users (id,email,username,password,full_name,college)
      VALUES (?,?,?,?,?,?)
    `).run(id, email, username, hashed, full_name, college);

    const user = db
      .prepare("SELECT id,email,username,full_name,college,avatar_url FROM users WHERE id = ?")
      .get(id);

    const token = jwt.sign({ id }, JWT_SECRET);

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    delete user.password;

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= GOOGLE AUTH =================
router.get("/google", (req, res, next) => {
  const frontend = req.query.frontend || process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  passport.authenticate("google", { scope: ["profile", "email"], state: encodeURIComponent(frontend) })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "http://localhost:3000/login?error=auth_failed" }),
  (req, res) => {
    try {
      if (!req.user) {
        console.warn('Google callback: no user returned by passport');
        const fallbackFrontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
        const frontend = req.query && req.query.state ? decodeURIComponent(req.query.state) : fallbackFrontend;
        return res.redirect(`${frontend}/login?error=no_user`);
      }

      const email = req.user.email;
      const avatar_url = req.user.avatar_url || "";

      // determine frontend origin from OAuth state or env
      const fallbackFrontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
      const frontend = req.query && req.query.state ? decodeURIComponent(req.query.state) : fallbackFrontend;

      console.log('Google callback user:', { email, name: req.user.name, frontend });

      const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN;
      if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
        return res.redirect(`${frontend}/login?error=unauthorized`);
      }

      const user = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get(email);

      if (user) {
        console.log('Existing user found; issuing token for', user.id);
        db.prepare(`
          UPDATE users
          SET full_name = ?, avatar_url = COALESCE(NULLIF(?, ''), avatar_url)
          WHERE id = ?
        `).run(req.user.name || user.full_name, avatar_url, user.id);

        const token = jwt.sign({ id: user.id }, JWT_SECRET);
        console.log('Redirecting to frontend with token for existing user');
        return res.redirect(`${frontend.replace(/\/$/, '')}/login-success?token=${token}`);
      }

      const id = uuid();
      const username = email.split("@")[0];
      const full_name = req.user.name;
      const college = "Chitkara";

      db.prepare(`
        INSERT INTO users (id,email,username,password,full_name,college,avatar_url)
        VALUES (?,?,?,?,?,?,?)
      `).run(id, email, username, null, full_name, college, avatar_url);

      console.log('Created new user', id, email);
      const token = jwt.sign({ id }, JWT_SECRET);
      console.log('Redirecting to frontend with token for new user');
      return res.redirect(`${frontend.replace(/\/$/, '')}/login-success?token=${token}`);
    } catch (err) {
      console.error("Google callback error:", err);
      const fallbackFrontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
      const frontend = req.query && req.query.state ? decodeURIComponent(req.query.state) : fallbackFrontend;
      res.redirect(`${frontend}/login?error=server_error`);
    }
  }
);

// ================= GET CURRENT USER =================
const { auth } = require("../middleware/auth");

router.get("/me", auth, (req, res) => {
  const user = db.prepare(`
    SELECT id, email, username, full_name, college, bio, avatar_url, verified, rating, rating_count
    FROM users WHERE id = ?
  `).get(req.user.id);

  res.json(user);
});

// ================= UPDATE PROFILE =================
router.put("/profile", auth, (req, res) => {
  try {
    const { full_name, college, bio } = req.body;

    db.prepare(`
      UPDATE users SET full_name = ?, college = ?, bio = ?
      WHERE id = ?
    `).run(full_name || null, college || null, bio || null, req.user.id);

    const user = db.prepare(`
      SELECT id, email, username, full_name, college, bio, avatar_url, verified, rating, rating_count
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", (req, res) => {
  res.send("Auth working");
});

module.exports = router;
