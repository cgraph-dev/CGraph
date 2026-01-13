# CGraph

<div align="center">

<img src="docs/assets/cgraph-logo.png" alt="CGraph Logo" width="140" />

### The All-in-One Open-Source Communication Platform

#### Real-time messaging • Community forums • End-to-end encryption • Web3 authentication • Gamification

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.8.5-green.svg)](CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-973%20passing-brightgreen.svg)](#testing)
[![Elixir](https://img.shields.io/badge/elixir-1.17+-purple.svg)](https://elixir-lang.org/)

[🌐 Website](https://www.cgraph.org) · [📚 Documentation](docs/) · [🔌 API Reference](docs/API.md) ·
[🤝 Contributing](CONTRIBUTING.md)

</div>

---

## Why CGraph?

| Feature                   |           CGraph            |    Competitors    |
| ------------------------- | :-------------------------: | :---------------: |
| **End-to-End Encryption** |      ✅ Double Ratchet      |     ⚠️ Varies     |
| **Open Source**           |         ✅ 100% MIT         |  ⚠️ Partial/None  |
| **Web3/Wallet Auth**      |          ✅ Native          |        ❌         |
| **Community Forums**      |         ✅ Built-in         |        ❌         |
| **Gamification**          | ✅ XP, Achievements, Quests |        ❌         |
| **No Phone Required**     |             ✅              | ⚠️ Often required |
| **Self-Hostable**         |       ✅ Full control       |    ⚠️ Limited     |
| **Role Permissions**      |         ✅ Granular         |     ⚠️ Basic      |

CGraph combines the best of modern communication platforms—real-time messaging, organized servers,
rich forums, end-to-end encryption, and gamification—all in one self-hostable package.

---

## Features

### 💬 Real-Time Messaging

- Instant message delivery with typing indicators and read receipts
- End-to-end encryption using Double Ratchet protocol (industry-leading security)
- Voice messages with waveform visualization
- Voice and video calls (up to 10 participants)
- Message reactions, editing, and deletion
- Cross-platform sync (web, iOS, Android)

### 🏢 Servers & Channels

- Organized servers with unlimited channels
- Channel categories for organization
- Custom roles with 20+ granular permissions
- Invite links with expiration and usage limits
- Audit logs for moderation
- Custom emoji support

### 📰 Community Forums

- Reddit-style posts with upvote/downvote
- Karma tracking and user rankings
- Nested comment threads
- Post categories and flairs
- Forum-specific leaderboards
- Moderator tools (pin, lock, remove)
- Rich text with code syntax highlighting

### 🎮 Gamification System

- **XP & Levels** - Earn experience from messaging, posting, and daily activity
- **Achievements** - 30+ achievements across 6 categories (Social, Content, Exploration, Mastery,
  Legendary, Secret)
- **Daily/Weekly Quests** - Complete objectives for bonus rewards
- **Streak System** - Maintain daily login streaks for XP multipliers (3+ days = 1.5x, 7+ days =
  2.0x)
- **Titles & Badges** - Unlock and equip cosmetic rewards
- **Virtual Currency** - Earn coins to spend in the shop
- **Leaderboards** - Compete globally and per-forum

### 🔐 Security & Privacy

- **E2EE Messaging** - AES-256-GCM encryption with X25519 key exchange
- **Wallet Authentication** - Login with Ethereum wallet (no email/password needed)
- **Two-Factor Auth** - TOTP with backup codes
- **OAuth Support** - Google, Apple, Facebook, TikTok
- **Zero-Knowledge Design** - Server cannot read encrypted messages
- **GDPR Compliance** - Full data export and deletion

### 🌐 Web3 Integration

- Ethereum wallet login (MetaMask, WalletConnect)
- NFT profile pictures
- Token-gated channels
- Cryptographic identity verification

### 📱 Mobile Apps

- Native iOS and Android apps via Expo
- Biometric authentication (Face ID, fingerprint)
- Push notifications
- Camera and media integration
- Offline message drafts

---

## Tech Stack

| Layer          | Technology                               |
| -------------- | ---------------------------------------- |
| **Backend**    | Elixir 1.17+ / Phoenix 1.8               |
| **Database**   | PostgreSQL 16+ / Redis 7+                |
| **Web**        | React 19 / Vite / TailwindCSS 4          |
| **Mobile**     | React Native 0.81 / Expo SDK 54          |
| **Real-time**  | Phoenix Channels + Presence              |
| **Encryption** | libsodium (AES-256-GCM, X25519, Ed25519) |
| **Search**     | Meilisearch (optional)                   |
| **Storage**    | S3/Minio compatible                      |

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer                            │
└─────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
   │   Phoenix   │       │   Phoenix   │       │   Phoenix   │
   │   Node 1    │◄─────►│   Node 2    │◄─────►│   Node 3    │
   └─────────────┘       └─────────────┘       └─────────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
   │ PostgreSQL  │       │    Redis    │       │   S3/Minio  │
   │   Primary   │       │   Cluster   │       │   Storage   │
   └─────────────┘       └─────────────┘       └─────────────┘
```

---

## Getting Started

### Prerequisites

| Tool       | Version | Installation                               |
| ---------- | ------- | ------------------------------------------ |
| Node.js    | 22+     | [nodejs.org](https://nodejs.org)           |
| pnpm       | 10+     | `npm install -g pnpm`                      |
| Elixir     | 1.17+   | [elixir-lang.org](https://elixir-lang.org) |
| PostgreSQL | 16+     | [postgresql.org](https://postgresql.org)   |
| Redis      | 7+      | [redis.io](https://redis.io)               |

### Quick Start

```bash
# Clone the repository
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph

# Install dependencies
pnpm install

# Set up backend
cd apps/backend
cp ../../.env.example .env
mix deps.get
mix ecto.setup
mix phx.server

# In another terminal, start the web app
cd apps/web
pnpm dev
```

The API runs at `http://localhost:4000` and the web app at `http://localhost:3000`.

### Docker

```bash
cp .env.example .env
docker-compose up -d
```

---

## Project Structure

```
CGraph/
├── apps/
│   ├── backend/        # Elixir/Phoenix API server
│   ├── web/            # React web application
│   └── mobile/         # React Native mobile app
├── packages/
│   ├── shared-types/   # Shared TypeScript types
│   ├── ui/             # Shared UI components
│   └── utils/          # Common utilities
├── docs/               # Documentation
└── infrastructure/     # Deployment scripts
```

---

## API Overview

REST API with WebSocket channels for real-time features.

**Authentication:**

```bash
POST /api/v1/auth/register      # Email/password registration
POST /api/v1/auth/login         # Email/password login
POST /api/v1/auth/wallet/verify # Wallet authentication
```

**Core Resources:**

```bash
GET  /api/v1/me                 # Current user profile
GET  /api/v1/conversations      # Direct messages
GET  /api/v1/groups             # Servers
GET  /api/v1/forums             # Public forums
GET  /api/v1/gamification/stats # XP, level, achievements
```

Full documentation: [docs/API.md](docs/API.md)

---

## Testing

| Layer     | Tests   | Coverage |
| --------- | ------- | -------- |
| Backend   | 718     | 89%      |
| Web       | 255     | 85%      |
| Mobile    | 142     | 78%      |
| **Total** | **973** | **84%**  |

```bash
# Run all tests
pnpm test

# Backend tests with coverage
cd apps/backend && mix test --cover

# Web tests
cd apps/web && pnpm test:coverage
```

---

## Documentation

| Document                               | Description                   |
| -------------------------------------- | ----------------------------- |
| [Quick Start](docs/QUICKSTART.md)      | Get running in 5 minutes      |
| [Architecture](docs/ARCHITECTURE.md)   | System design overview        |
| [API Reference](docs/API_REFERENCE.md) | Complete REST API docs        |
| [Security](docs/SECURITY.md)           | Encryption and authentication |
| [Deployment](docs/DEPLOYMENT.md)       | Production setup              |
| [Mobile](docs/MOBILE.md)               | React Native development      |

---

## Roadmap

### Q1 2026

- [ ] Bot/Integration API
- [ ] Slash commands
- [ ] Webhooks for external integrations

### Q2 2026

- [ ] Screen sharing in video calls
- [ ] Desktop app (Tauri)
- [ ] Plugin/extension system

### Q3 2026

- [ ] Federation protocol (ActivityPub)
- [ ] Matrix bridge

---

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
git checkout -b feature/your-feature
pnpm test
git push origin feature/your-feature
```

---

## Author

Built by **Burca Lucas**

- [Website](https://www.cgraph.org)
- [GitHub](https://github.com/cgraph-dev)

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

<div align="center">

**[www.cgraph.org](https://www.cgraph.org)**

</div>
