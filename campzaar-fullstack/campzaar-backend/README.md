# 🎓 CampZaar — Full-Stack Campus Marketplace

A complete, production-ready full-stack web app with:
- **React** frontend (no mock data — everything live from DB)
- **Express + WebSocket** backend
- **SQLite** database (zero setup, file-based)
- **JWT authentication** (register/login/protected routes)
- **Real-time chat** via WebSockets

---

## 📁 Project Structure

```
campzaar-fullstack/
├── campzaar-backend/     ← Node.js + Express + WebSocket + SQLite
└── campzaar/             ← React frontend
```

---

## 🚀 Quick Start (2 terminals)

### Prerequisites
- Node.js 18+ → https://nodejs.org

### Terminal 1 — Start the Backend

```bash
cd campzaar-backend
npm install
npm start
```

You should see:
```
✅ Database initialized: .../campzaar.db
🚀 CampZaar backend running on http://localhost:4000
   WebSocket: ws://localhost:4000/ws
   API:       http://localhost:4000/api
```

### Terminal 2 — Start the Frontend

```bash
cd campzaar
npm install     # (skip if already done)
npm start
```

Opens at **http://localhost:3000** 🎉

---

## 🗄️ Database

Uses **SQLite** via `better-sqlite3` — zero configuration, no separate DB server needed.

Database file is auto-created at: `campzaar-backend/data/campzaar.db`

### Tables
| Table | Purpose |
|-------|---------|
| `users` | Accounts, profile, rating |
| `listings` | All marketplace listings |
| `listing_likes` | Saved/liked listings |
| `conversations` | Chat threads |
| `messages` | Individual messages |
| `startups` | Student startup listings |
| `startup_upvotes` | Upvote tracking |
| `reviews` | Seller ratings |
| `rental_bookings` | Calendar bookings |

---

## 🔐 Authentication

- **Register**: POST `/api/auth/register` — creates account, returns JWT
- **Login**: POST `/api/auth/login` — validates credentials, returns JWT
- **Me**: GET `/api/auth/me` — returns current user (requires Bearer token)
- Token stored in `localStorage` as `cz_token`
- Protected routes in React redirect to `/auth` if not logged in

---

## 💬 WebSocket Protocol

Connect to `ws://localhost:4000/ws`

### Messages (client → server)
```json
{ "type": "auth", "token": "<jwt>" }
{ "type": "send_message", "conversation_id": "...", "text": "Hello!" }
{ "type": "mark_read", "conversation_id": "..." }
{ "type": "typing", "conversation_id": "..." }
```

### Messages (server → client)
```json
{ "type": "auth_ok", "userId": "..." }
{ "type": "new_message", "data": { ...message } }
{ "type": "typing", "conversation_id": "...", "userId": "..." }
{ "type": "unread_counts", "data": [...] }
```

---

## 🌐 API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/profile` | ✅ | Update profile |

### Listings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/listings` | Optional | List with filters |
| GET | `/api/listings/:id` | Optional | Single listing |
| POST | `/api/listings` | ✅ | Create listing |
| PUT | `/api/listings/:id` | ✅ | Update listing |
| DELETE | `/api/listings/:id` | ✅ | Remove listing |
| POST | `/api/listings/:id/like` | ✅ | Toggle like |
| GET | `/api/listings/user/:userId` | Optional | User's listings |

### Query params for GET /api/listings
- `category` — filter by category
- `type` — `sell` or `rent`
- `condition` — `Like New`, `Good`, `Fair`
- `q` — full-text search
- `sort` — `newest`, `oldest`, `price_asc`, `price_desc`, `popular`
- `page`, `limit` — pagination

### Chat
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/conversations` | ✅ | My conversations |
| POST | `/api/conversations` | ✅ | Start conversation |
| GET | `/api/conversations/:id/messages` | ✅ | Load messages |
| POST | `/api/conversations/:id/messages` | ✅ | Send (HTTP fallback) |

### Users & Startups
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/users/:id` | Optional | Public profile |
| POST | `/api/users/:id/review` | ✅ | Leave review |
| GET | `/api/startups` | Optional | List startups |
| POST | `/api/startups` | ✅ | Submit startup |
| POST | `/api/startups/:id/upvote` | ✅ | Upvote startup |

---

## 🎨 Features

| Feature | Status |
|---------|--------|
| Register / Login / JWT | ✅ Real |
| Protected routes | ✅ Real |
| Listings CRUD | ✅ Real DB |
| Like/Save listings | ✅ Real DB |
| Real-time chat (WebSocket) | ✅ Live |
| Typing indicators | ✅ Live |
| Unread message counts | ✅ Real |
| User profiles | ✅ Real DB |
| Star ratings & reviews | ✅ Real DB |
| Startup upvoting | ✅ Real DB |
| Dark / Light mode | ✅ |
| Responsive (mobile) | ✅ |
| Skeleton loaders | ✅ |

---

## 🔧 Production Notes

1. **Change JWT secret**: Update `JWT_SECRET` in `campzaar-backend/.env`
2. **CORS**: Update `FRONTEND_URL` in `.env` to your production domain
3. **SQLite → Postgres**: Replace `better-sqlite3` with `pg` for scale
4. **Image uploads**: Add Multer + S3 for real image storage
5. **HTTPS**: Required for WebSocket (`wss://`) in production
