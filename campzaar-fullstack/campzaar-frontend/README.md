# 🎓 CampZaar — Campus Marketplace

A full-featured, production-grade React app for college students to buy, sell, rent, and discover student startups.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm 9+ (comes with Node.js)

### Installation

```bash
# 1. Unzip the project
unzip campzaar.zip
cd campzaar

# 2. Install dependencies
npm install

# 3. Start the dev server
npm start

# App opens at http://localhost:3000
```

---

## 📁 Project Structure

```
campzaar/
├── public/
│   └── index.html          # HTML template with Google Fonts
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx          # Sticky nav + mobile bottom nav
│   │   │   └── Navbar.css
│   │   └── shared/
│   │       ├── ListingCard.jsx     # Reusable product card
│   │       └── ListingCard.css
│   ├── data/
│   │   └── mockData.js             # All mock data
│   ├── hooks/
│   │   └── useTheme.js             # Dark/light mode context
│   ├── pages/
│   │   ├── LandingPage.jsx         # Hero + trending + features
│   │   ├── LandingPage.css
│   │   ├── FeedPage.jsx            # Marketplace feed + filters
│   │   ├── FeedPage.css
│   │   ├── ProductPage.jsx         # Product detail + seller info
│   │   ├── ProductPage.css
│   │   ├── AddListingPage.jsx      # Multi-step listing form
│   │   ├── AddListingPage.css
│   │   ├── RentalsPage.jsx         # Calendar + rental booking
│   │   ├── RentalsPage.css
│   │   ├── StartupsPage.jsx        # Startup showcase
│   │   ├── StartupsPage.css
│   │   ├── ChatPage.jsx            # Real-time messaging UI
│   │   ├── ChatPage.css
│   │   ├── ProfilePage.jsx         # User profile + reviews
│   │   ├── ProfilePage.css
│   │   ├── AdminPage.jsx           # Analytics dashboard
│   │   └── AdminPage.css
│   ├── styles/
│   │   └── globals.css             # Design system + CSS variables
│   ├── App.js                      # Router + layout
│   └── index.js                    # Entry point
└── package.json
```

---

## 🎨 Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--brand-purple` | `#7c3aed` | Primary brand |
| `--brand-pink` | `#ec4899` | Accent / CTAs |
| `--brand-orange` | `#f97316` | Warm accent |
| `--brand-cyan` | `#06b6d4` | Cool accent |
| `--grad-primary` | `purple → pink` | Buttons, gradients |

### Typography
- **Display / Headings:** Syne (800 weight) — bold, editorial
- **Body:** DM Sans — clean, readable, modern

### Dark / Light Mode
Toggle via the sun/moon icon in the navbar. Uses CSS `[data-theme]` attribute.

---

## 📱 Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero, trending listings, features |
| `/feed` | Feed | Filterable marketplace grid |
| `/product/:id` | Product | Detail view, chat, seller info |
| `/add-listing` | Add Listing | 4-step form with image upload |
| `/rentals` | Rentals | Calendar booking UI |
| `/startups` | Startups | Student startup showcase |
| `/chat` | Chat | Real-time messaging (mock) |
| `/profile` | Profile | User stats, listings, reviews |
| `/admin` | Dashboard | Analytics, tables, charts |

---

## 🛠 Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| React Router | 6 | Client-side routing |
| Recharts | 2 | Admin charts |
| Lucide React | Latest | Icons |
| DM Sans + Syne | Google Fonts | Typography |

---

## ✨ Features

- 🌗 Dark / Light mode toggle
- 📱 Fully responsive (mobile-first)
- 🔍 Search + filter + sort in marketplace
- 📅 Interactive rental calendar
- 💬 WhatsApp-style chat UI
- 🚀 Startup showcase with upvoting
- 📊 Admin dashboard with area charts
- ⭐ Profile with rating system
- 🧩 Multi-step listing form with success animation
- 🎨 Glassmorphism, gradient orbs, hover animations

---

## 🔧 Customization

### Change brand colors
Edit `src/styles/globals.css` → update `--brand-purple`, `--grad-primary` etc.

### Add real data
Replace mock data in `src/data/mockData.js` with API calls.

### Add backend
Swap fetch calls in pages with real API endpoints (Node.js / Django / Firebase).

---

Built with ❤️ for campus students everywhere.
