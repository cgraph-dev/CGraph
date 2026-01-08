# CGraph

[![CI](https://github.com/cgraph-dev/CGraph/actions/workflows/ci.yml/badge.svg)](https://github.com/cgraph-dev/CGraph/actions/workflows/ci.yml)
[![Deploy](https://github.com/cgraph-dev/CGraph/actions/workflows/deploy.yml/badge.svg)](https://github.com/cgraph-dev/CGraph/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.7.25-green.svg)](CHANGELOG.md)
[![Elixir](https://img.shields.io/badge/elixir-1.19.4-purple.svg)](https://elixir-lang.org)
[![React](https://img.shields.io/badge/react-19.1.0-61DAFB.svg)](https://react.dev)
[![Tests](https://img.shields.io/badge/tests-620%20passing-brightgreen.svg)](apps/backend/test)

A modern, full-stack social platform combining messaging, groups, and forum communities with Web3 wallet integration and end-to-end encryption.

**Version 0.7.23** | [Changelog](CHANGELOG.md) | [Documentation](docs/) | [API Reference](docs/API.md)

## 🚀 Features

### Core Communication
- **Direct Messaging** - Real-time end-to-end encrypted conversations with typing indicators and presence tracking
- **Group Channels** - Discord-style servers with role-based permissions, voice channels, and threaded discussions
- **Forum Communities** - Reddit-style forums with upvoting, nested comments, and custom flairs
- **Voice Messages** - Record and send audio clips with waveform visualization and playback
- **Friends System** - Add friends, see mutual connections, get friend suggestions based on shared groups

### Security & Privacy
- **End-to-End Encryption** - X3DH key agreement with AES-256-GCM encryption for all private messages
- **Two-Factor Authentication** - TOTP-based 2FA with encrypted backup codes stored securely
- **Web3 Wallet Login** - Sign in with Ethereum/Polygon wallets using cryptographic signatures
- **Anonymous Mode** - Create accounts without email using generated wallet addresses and crypto aliases
- **Biometric Authentication** - Face ID, Touch ID, and fingerprint support on mobile devices
- **Session Management** - Track and remotely revoke sessions across all devices

### Real-Time Features
- **Phoenix Presence** - Accurate online/offline status using CRDT-based distributed tracking
- **WebSocket Channels** - Low-latency message delivery and live updates
- **Push Notifications** - APNs for iOS, FCM for Android, Expo Push for development
- **Typing Indicators** - See when others are typing in real-time
- **Read Receipts** - Know when messages have been read (optional per conversation)

### Platform & Infrastructure
- **Monorepo Architecture** - Shared types and utilities across web, mobile, and backend
- **React 19** - Latest features including concurrent rendering and automatic batching
- **Elixir/Phoenix** - Battle-tested concurrency and fault tolerance for 100k+ connections
- **PostgreSQL 16** - Advanced JSON operations, full-text search, and robust data integrity
- **Docker Support** - Containerized deployments with docker-compose for development
- **Fly.io Ready** - Optimized for global edge deployment with auto-scaling

### Developer Experience  
- **TypeScript Everywhere** - Full type safety across web and mobile with shared type definitions
- **Hot Reload** - Instant updates during development on all platforms
- **Comprehensive Tests** - 620 backend tests ensuring reliability and correctness
- **Strict Code Quality** - Credo static analysis with strict mode passing
- **API Documentation** - Complete REST and WebSocket API reference with examples
- **Error Tracking** - Sentry integration for production monitoring and debugging

## 🏗 Architecture

```
CGraph/
├── apps/
│   ├── backend/          # Elixir/Phoenix API server
│   ├── web/              # React + Vite web frontend
│   └── mobile/           # React Native + Expo app
├── packages/
│   ├── shared-types/     # TypeScript type definitions
│   ├── config/           # Shared configuration
│   ├── ui/               # Shared UI components
│   └── utils/            # Shared utility functions
├── docs/                 # Documentation
└── infrastructure/       # Docker, deployment, scripts
```

## 📦 Quick Start

### Prerequisites
- **Node.js** 22+ LTS with **pnpm** 10+
- **Elixir** 1.19+ with **Erlang/OTP** 28+
- **PostgreSQL** 16+
- **FFmpeg** 6.1+ (for voice message processing)
- **asdf** version manager (recommended for managing runtime versions)

### Development Setup

1. **Clone and Install Dependencies**
```bash
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph
pnpm install
```

2. **Backend Setup**
```bash
cd apps/backend

# Install Elixir dependencies
mix deps.get

# Create database and run migrations
mix ecto.setup

# Start Phoenix server (port 4000)
mix phx.server
```

3. **Web Frontend** (separate terminal)
```bash
cd apps/web

# Start Vite development server (port 3000)
pnpm dev
```

4. **Mobile App** (separate terminal)
```bash
cd apps/mobile

# Start Expo development server (port 8081)
pnpm start

# Scan QR code with Expo Go app on your phone
# or press 'a' for Android emulator, 'i' for iOS simulator
```

### First Time Setup

Create your first user account:
```bash
# Option 1: Use the web interface at http://localhost:3000/register

# Option 2: Via API
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!"
  }'
```

### Using Docker

```bash
docker-compose up -d
```

## 🔗 API Endpoints

All endpoints use the `/api/v1` prefix. See the detailed [API reference](docs/API.md) and the machine-readable [OpenAPI spec](docs/openapi.yaml) for complete documentation.

### Key Endpoints

| Feature | Method | Endpoint |
|---------|--------|----------|
| Register | POST | `/api/v1/auth/register` |
| Login | POST | `/api/v1/auth/login` |
| Wallet Login | POST | `/api/v1/auth/wallet/verify` |
| Get Profile | GET | `/api/v1/me` |
| Friends | GET | `/api/v1/friends` |
| Send Friend Request | POST | `/api/v1/friends` |
| Accept Friend | POST | `/api/v1/friends/:id/accept` |
| Conversations | GET | `/api/v1/conversations` |
| Groups | GET | `/api/v1/groups` |
| Forums | GET | `/api/v1/forums` |
| Forum Leaderboard | GET | `/api/v1/forums/leaderboard` |
| Create Forum | POST | `/api/v1/forums` |

## 📱 Cross-Platform Compatibility

The web and mobile apps share the same backend API, ensuring:
- ✅ Friends added on web appear on mobile and vice versa
- ✅ Messages sync across all devices in real-time
- ✅ Forum posts and votes are consistent
- ✅ Notifications delivered to all platforms

### API Consistency

Both platforms use identical API paths:
```typescript
// Web (apps/web/src/lib/api.ts)
const API_URL = 'http://localhost:4000';
api.get('/api/v1/friends');

// Mobile (apps/mobile/src/lib/api.ts)  
const API_URL = 'http://localhost:4000';
api.get('/api/v1/friends');
```

## 🧪 Testing

### Backend Tests
```bash
cd apps/backend

# Run all tests (585+ tests)
mix test

# Run with coverage
mix test --cover

# Run specific test file
mix test test/cgraph/messaging_test.exs

# Run tests matching a pattern
mix test --only presence
```

### Frontend Type Checking
```bash
# Web application
cd apps/web
pnpm typecheck
pnpm lint
pnpm build  # Validates production build

# Mobile application
cd apps/mobile
pnpm typecheck
pnpm lint
```

### Integration Testing
```bash
# Start all services
pnpm dev

# Backend API health check
curl http://localhost:4000/health

# Web frontend health
curl http://localhost:3000

# Check WebSocket connection
wscat -c ws://localhost:4000/socket/websocket
```

## 📚 Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [API Reference](docs/API_REFERENCE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Forum Hosting Platform](docs/FORUM_HOSTING_PLATFORM.md)
- [Frontend Guide](docs/FRONTEND.md)
- [Mobile Guide](docs/MOBILE.md)
- [Database Guide](docs/DATABASE.md)
- [Security Hardening](docs/SECURITY_HARDENING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Operations](docs/OPERATIONS.md)

## 🔧 Configuration

### Environment Variables

```bash
# Backend (apps/backend/config/runtime.exs)
DATABASE_URL=postgres://user:pass@localhost/cgraph_dev
SECRET_KEY_BASE=your-secret-key
GUARDIAN_SECRET_KEY=your-jwt-secret

# Web (apps/web/.env)
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000

# Mobile (apps/mobile/app.json extra config)
API_URL=http://localhost:4000
```

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.