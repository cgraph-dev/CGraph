# CGraph

<div align="center">

<img src="docs/assets/cgraph-logo.png" alt="CGraph Logo" width="120" />

**A modern social platform that brings together messaging, community forums, and decentralized identity.**

[![CI Status](https://github.com/cgraph-dev/CGraph/actions/workflows/ci.yml/badge.svg)](https://github.com/cgraph-dev/CGraph/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.7.47-green.svg)](CHANGELOG.md)

[Website](https://www.cgraph.org) · [Documentation](docs/) · [API Reference](docs/API.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## Why CGraph?

Most platforms force you to choose: do you want real-time chat, community forums, or genuine privacy? That never made sense to me.

CGraph combines all three. You get organized servers with channels and roles, community-driven forums where content rises on merit, and military-grade privacy with proper end-to-end encryption. You can also log in with your Ethereum wallet if that's your thing—no email required.

The whole thing runs on Elixir and Phoenix, which means it handles way more concurrent users than you'd expect for a project this size. I've tested it at 10K simultaneous WebSocket connections on modest hardware without breaking a sweat.

## What You Get

**Messaging that actually works**
- Real-time chat with typing indicators and read receipts
- End-to-end encryption using the Double Ratchet protocol (X3DH + AES-256-GCM)
- Voice messages with waveform previews
- Voice and video calls with up to 10 participants
- Works on web and mobile with messages syncing instantly

**Organized groups**
- Create servers with custom channels (text, announcements, etc.)
- Granular role permissions—moderators, VIPs, whatever you need
- Invite links with expiration and usage limits

**Community forums**
- Upvote/downvote system with karma tracking
- Nested comments that don't become an unreadable mess
- Forum competition leaderboard—top communities get featured

**Privacy you can actually trust**
- Optional anonymous accounts via wallet authentication
- Messages encrypted before they leave your device
- No phone number required, ever

## Tech Stack

Technologies I picked because they'll still be solid choices in five years:

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | Elixir 1.19 + Phoenix 1.8 | Handles millions of connections with minimal resources |
| Database | PostgreSQL 16 | Rock-solid, great JSON support, full-text search built in |
| Web | React 19 + Vite | Fast development, fast production builds |
| Mobile | React Native 0.81 + Expo 54 | One codebase for iOS and Android that actually feels native |
| Encryption | libsodium (XChaCha20-Poly1305) | Same crypto primitives Signal uses |

## Getting Started

### Prerequisites

You'll need these installed:
- Node.js 22+ and pnpm 10+
- Elixir 1.19+ with Erlang/OTP 28+
- PostgreSQL 16+
- FFmpeg (for voice message processing)

We recommend using [asdf](https://asdf-vm.com/) to manage your runtime versions—it makes switching between projects much less painful.

### Quick Setup

```bash
# Clone and install
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph
pnpm install

# Set up the backend
cd apps/backend
cp ../../.env.example .env  # then edit .env with your values
mix deps.get
mix ecto.setup

# Run it
mix phx.server
```

The API will be at http://localhost:4000. Health check endpoint: `/health`

For the web app:
```bash
cd apps/web
pnpm dev  # runs at http://localhost:3000
```

For mobile:
```bash
cd apps/mobile
pnpm start  # scan QR with Expo Go
```

### Storybook (Component Development)

Browse and develop UI components in isolation:
```bash
cd apps/web && pnpm storybook      # Web: http://localhost:6006
cd apps/mobile && pnpm storybook   # Mobile: on-device via Expo
```

### Docker (Alternative)

If you'd rather not install Elixir locally:

```bash
cp .env.example .env  # configure your environment
docker-compose up -d
```

Everything spins up automatically—database, backend, the works.

## Project Structure

```
CGraph/
├── apps/
│   ├── backend/        # Elixir API server (the brains)
│   ├── web/            # React web app
│   └── mobile/         # React Native mobile app
├── packages/
│   ├── shared-types/   # TypeScript types shared between web/mobile
│   ├── ui/             # Shared UI components
│   └── utils/          # Common utilities
├── docs/               # You're reading documentation from here
└── infrastructure/     # Docker, Terraform, deployment scripts
```

## API Overview

The API is straightforward REST with WebSocket channels for real-time features. Everything lives under `/api/v1`.

**Authentication:**
```bash
# Traditional email/password
POST /api/v1/auth/register
POST /api/v1/auth/login

# Or use your Ethereum wallet
POST /api/v1/auth/wallet/challenge
POST /api/v1/auth/wallet/verify
```

**Core Resources:**
```bash
GET  /api/v1/me                 # Your profile
GET  /api/v1/friends            # Friend list
GET  /api/v1/conversations      # DM threads
GET  /api/v1/groups             # Your servers
GET  /api/v1/forums             # Public forums
```

Full API docs at [docs/API.md](docs/API.md) or the OpenAPI spec at [docs/openapi.yaml](docs/openapi.yaml).

## Testing

The backend has 718 tests covering everything from user auth to real-time presence tracking. Web has 255 component and integration tests.

```bash
cd apps/backend
mix test                    # run all tests
mix test --cover            # with coverage report
mix test --only presence    # just presence tests
```

Frontend tests:
```bash
cd apps/web && pnpm test
cd apps/mobile && pnpm typecheck
```

## Documentation

| Document | What it covers |
|----------|---------------|
| [Quick Start](docs/QUICKSTART.md) | Get running in 5 minutes |
| [Architecture](docs/ARCHITECTURE.md) | How the pieces fit together |
| [API Reference](docs/API_REFERENCE.md) | Every endpoint, documented |
| [Security](docs/SECURITY.md) | Encryption, auth, threat model |
| [Deployment](docs/DEPLOYMENT.md) | Production setup guide |
| [Mobile Guide](docs/MOBILE.md) | React Native specifics |

## Contributing

Contributions are welcome. Check out [CONTRIBUTING.md](CONTRIBUTING.md) before submitting PRs.

The short version: fork the repo, make your changes, write tests, open a PR. I'll review it as quickly as I can.

## Author

Built and maintained by **Burca Lucas**.

## Legal

- [Privacy Policy](docs/LEGAL/PRIVACY_POLICY.md)
- [Terms of Service](docs/LEGAL/TERMS_OF_SERVICE.md)

## License

MIT License. See [LICENSE](LICENSE) for the full text.

---

<div align="center">

Built with ☕ and late nights.

**[www.cgraph.org](https://www.cgraph.org)**

</div>