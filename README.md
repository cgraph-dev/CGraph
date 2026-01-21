# CGraph

<div align="center">

<img src="docs/assets/cgraph-logo.svg" alt="CGraph Logo" width="140" />

### The All-in-One Open-Source Communication Platform

#### Real-time messaging • Community forums • End-to-end encryption • Web3 authentication • Gamification

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.9.4-green.svg)](CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-1030%20passing-brightgreen.svg)](#testing)
[![Elixir](https://img.shields.io/badge/elixir-1.17+-purple.svg)](https://elixir-lang.org/)

**Current version:** 0.9.4 (January 2026)

[🌐 Website](https://www.cgraph.org) · [📚 Documentation](docs/) · [🔌 API Reference](docs/API.md) ·
[🤝 Contributing](CONTRIBUTING.md)

</div>

---

## Why CGraph?

| Feature                   |              CGraph              |    Competitors    |
| ------------------------- | :------------------------------: | :---------------: |
| **End-to-End Encryption** |        ✅ Double Ratchet         |     ⚠️ Varies     |
| **Open Source**           |           ✅ 100% MIT            |  ⚠️ Partial/None  |
| **Web3/Wallet Auth**      |            ✅ Native             |        ❌         |
| **Community Forums**      |           ✅ Built-in            |        ❌         |
| **Gamification**          |   ✅ XP, Achievements, Quests    |        ❌         |
| **No Phone Required**     |                ✅                | ⚠️ Often required |
| **Self-Hostable**         |         ✅ Full control          |    ⚠️ Limited     |
| **Role Permissions**      |           ✅ Granular            |     ⚠️ Basic      |
| **Referral System**       | ✅ Tiered rewards & leaderboards |        ❌         |
| **Offline Support**       |    ✅ Full queue & auto-sync     |    ⚠️ Limited     |

CGraph combines the best of modern communication platforms—real-time messaging, organized servers,
rich forums, end-to-end encryption, and gamification—all in one self-hostable package.

---

## Features

### 💬 Real-Time Messaging

- Instant message delivery with typing indicators and read receipts
- End-to-end encryption using Double Ratchet protocol (industry-leading security)
- Voice messages with waveform visualization
- Voice and video calls via WebRTC (1:1 and group calls)
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
- **Full offline support** - Queue messages, reactions, posts with auto-sync on reconnect
- Priority-based offline queue with exponential backoff
- Network state monitoring with automatic retry

### 🎁 Referral System

- Unique referral codes with easy sharing
- Tiered reward structure with progressive bonuses
- Real-time leaderboards (daily, weekly, monthly, all-time)
- Track referral status and conversions
- Claim rewards when tiers are reached
- Platform-aware sharing (iOS Share Sheet, Android intents)

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

| Tool       | Version | Installation                        |
| ---------- | ------- | ----------------------------------- |
| Node.js    | 18+     | `asdf install nodejs 22.11.0`       |
| pnpm       | 9+      | `npm install -g pnpm`               |
| Elixir     | 1.17+   | `asdf install elixir 1.17.3-otp-26` |
| Erlang     | 26+     | `asdf install erlang 26.2`          |
| PostgreSQL | 15+     | Docker or local install             |
| Redis      | 7+      | Docker or local install             |

> **Recommended:** Use [asdf](https://asdf-vm.com/) for version management. Run `asdf install` in
> the project root to install exact versions from `.tool-versions`.

### Environment Variables

**Backend** (`apps/backend/.env`):

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cgraph_dev
REDIS_URL=redis://localhost:6379
GUARDIAN_SECRET_KEY=your-secret-key-here
SECRET_KEY_BASE=your-phoenix-secret-key
```

**Frontend** (`apps/web/.env`):

```bash
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000/socket
```

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

### Development URLs

| Service     | URL                   | Notes                      |
| ----------- | --------------------- | -------------------------- |
| Backend API | http://localhost:4000 | Phoenix server             |
| Web App     | http://localhost:3000 | Vite dev server            |
| PostgreSQL  | localhost:5432        | Default: postgres/postgres |
| Redis       | localhost:6379        |                            |
| Storybook   | http://localhost:6006 | `pnpm storybook`           |

### Docker Development

```bash
# Start database services only
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis

# Start full stack
cp .env.example .env
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Database Commands

```bash
cd apps/backend

mix ecto.setup      # Create + migrate + seed
mix ecto.migrate    # Run pending migrations
mix ecto.rollback   # Undo last migration
mix ecto.reset      # Drop + create + migrate + seed
mix ecto.gen.migration <name>  # Generate new migration
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

Documentation is auto-generated from code comments using TypeDoc and OpenAPI specs.

## CI & Security Tooling

- CI builds backend and web Docker images each PR to catch Dockerfile/healthcheck regressions early.
- Security workflow runs gitleaks, hadolint (backend/web Dockerfiles), Sobelow, pnpm audit, Syft
  SBOM, and Grype vulnerability scans with artifacts; see `.github/workflows/ci.yml`.
- Context7 MCP helper is configured in `.vscode/mcp.json`; provide your own `CONTEXT7_API_KEY` when
  prompted.

### Using the Context7 MCP helper

- Purpose: quick research/summarization aid; not a runtime dependency.
- Setup: supply your Context7 API key when prompted by your MCP-enabled client (stored locally, not
  in repo/CI).
- Usage examples: ask it to summarize long docs, draft changelog/release note text, outline tests,
  or suggest scan tuning (e.g., gitleaks allowlists). Review and commit changes yourself.

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
