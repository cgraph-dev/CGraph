# CGraph

A modern, full-stack social platform combining messaging, groups, and forum communities with Web3 wallet integration.

## 🚀 Features

### Core Platform
- **Direct Messaging** - Real-time encrypted conversations
- **Groups** - Discord-style servers with channels, roles, and permissions
- **Forums** - Reddit-style communities with voting and nested comments
- **Forum Hosting** - MyBB-style forum creation with boards, threads, and customization
- **Friends System** - Cross-platform friend requests, mutual friends, suggestions

### Web3 Integration
- **Wallet Login** - Authenticate with Ethereum/Polygon wallets
- **Local Wallet Generation** - Create wallets directly in the app with PIN protection
- **Recovery System** - Backup codes and key file recovery

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
- Node.js 18+ with pnpm
- Elixir 1.15+ with Erlang 26+
- PostgreSQL 15+
- Docker (optional)

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
# Backend tests (216 tests)
cd apps/backend
mix test

# Web TypeScript check
cd apps/web
pnpm tsc --noEmit

# Mobile TypeScript check
cd apps/mobile
pnpm typecheck
```

## 📚 Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [API Reference](docs/API_REFERENCE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Forum Hosting Platform](docs/FORUM_HOSTING_PLATFORM.md)
- [Frontend Guide](docs/FRONTEND.md)
- [Mobile Guide](docs/MOBILE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY_HARDENING.md)

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