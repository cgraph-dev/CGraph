# CGraph

A modern, full-stack social platform combining messaging, groups, and forum communities with Web3 wallet integration and end-to-end encryption.

**Version 0.6.6** | [Changelog](CHANGELOG.md) | [Documentation](docs/)

## 🚀 Features

### Core Platform
- **Direct Messaging** - Real-time E2EE encrypted conversations
- **Groups** - Server-style communities with channels, roles, and permissions
- **Forums** - Community discussion boards with voting and nested comments
- **Forum Hosting** - Traditional forum creation with boards, threads, and customization
- **Friends System** - Cross-platform friend requests, mutual friends, suggestions
- **Voice Messages** - Record and send voice messages with waveform visualization

### Security & Privacy
- **End-to-End Encryption** - X3DH/AES-256-GCM encryption on all platforms
- **Two-Factor Authentication** - TOTP-based 2FA with backup codes
- **Enterprise Security** - Input validation, abuse detection, rate limiting
- **Session Management** - Multi-device sessions with remote logout

### Web3 Integration
- **Wallet Login** - Authenticate with Ethereum/Polygon wallets
- **Local Wallet Generation** - Create wallets directly in the app with PIN protection
- **Recovery System** - Backup codes and key file recovery

### Notifications
- **Push Notifications** - APNs (iOS), FCM (Android), Expo Push
- **Email Notifications** - Transactional emails via Swoosh/Resend
- **Real-time Updates** - WebSocket-based instant updates

### Admin Dashboard
- **System Metrics** - Real-time monitoring and statistics
- **User Management** - Ban/unban, search, account management
- **Content Moderation** - Report handling and resolution
- **Audit Logging** - Complete activity audit trail
- **Configuration** - Runtime system configuration

### Cross-Platform
- **Web App** - React + Vite + TailwindCSS
- **Mobile App** - React Native + Expo
- **Backend** - Elixir/Phoenix with PostgreSQL

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
- Node.js 22 LTS with pnpm 9+
- Elixir 1.19+ with Erlang/OTP 28+
- PostgreSQL 16+
- Docker (optional)
- asdf version manager (recommended)

### Development Setup

```bash
# Clone repository
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph

# Install dependencies
pnpm install

# Backend setup
cd apps/backend
mix deps.get
mix ecto.setup

# Start backend (port 4000)
mix phx.server

# In another terminal - Web frontend (port 3000)
cd apps/web
pnpm dev

# In another terminal - Mobile app
cd apps/mobile
pnpm start
```

### Using Docker

```bash
docker-compose up -d
```

## 🔗 API Endpoints

All endpoints use the `/api/v1` prefix. See [API Reference](docs/API_REFERENCE.md) for complete documentation.

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

```bash
# Backend tests (585 tests)
cd apps/backend
mix test

# Web TypeScript check + build
cd apps/web
pnpm tsc --noEmit
pnpm build

# Mobile TypeScript check
cd apps/mobile
npx tsc --noEmit
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