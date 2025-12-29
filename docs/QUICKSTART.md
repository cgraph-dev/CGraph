# CGraph Quick Start Guide

> Time to first running app: ~15 minutes if you're lucky, ~45 minutes if npm is being npm.
> 
> Maintainer: @chen | Last verified: December 2024

---

## Prerequisites

Before we start, make sure you have these installed. I've included the versions we've tested with—other versions might work, but no promises.

### Required Software

| Tool | Version | Check Command | Installation |
|------|---------|---------------|--------------|
| Node.js | 20.x LTS | `node --version` | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| pnpm | 8.x | `pnpm --version` | `npm install -g pnpm` |
| Elixir | 1.15+ | `elixir --version` | [elixir-lang.org](https://elixir-lang.org/install.html) |
| Erlang/OTP | 26+ | `erl -version` | Installed with Elixir usually |
| PostgreSQL | 15+ | `psql --version` | [postgresql.org](https://www.postgresql.org/download/) |
| Redis | 7+ | `redis-cli --version` | [redis.io](https://redis.io/download) |
| Docker | 24+ | `docker --version` | [docker.com](https://docker.com) (optional, but makes life easier) |

### Quick Install Commands

**macOS (with Homebrew):**
```bash
# Install everything at once
brew install node@20 pnpm elixir postgresql@15 redis

# Start services
brew services start postgresql@15
brew services start redis
```

**Ubuntu/Debian:**
```bash
# Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20

# Elixir
wget https://packages.erlang-solutions.com/erlang-solutions_2.0_all.deb
sudo dpkg -i erlang-solutions_2.0_all.deb
sudo apt update
sudo apt install esl-erlang elixir

# PostgreSQL and Redis
sudo apt install postgresql-15 redis-server
```

**Windows:**
I'm sorry. Use WSL2 and follow the Ubuntu instructions. Trust me, it's less painful.

---

## Step 1: Clone and Install Dependencies

```bash
# Clone the repo
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph

# Install all dependencies (this takes a while, grab coffee ☕)
pnpm install

# Also install backend dependencies
cd apps/backend
mix deps.get
mix deps.compile
cd ../..
```

### Troubleshooting: "pnpm install" fails

**Problem:** `ERESOLVE unable to resolve dependency tree`
```bash
# Try with legacy peer deps
pnpm install --legacy-peer-deps
```

**Problem:** `bcrypt` compilation fails
```bash
# You need build tools
# macOS: xcode-select --install
# Ubuntu: sudo apt install build-essential
```

**Problem:** Everything is broken and you want to start over
```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm store prune
pnpm install
```

---

## Step 2: Set Up Environment Variables

We use `.env` files for local development. There's an example file you can copy:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Web frontend  
cp apps/web/.env.example apps/web/.env

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

### Minimum Required Variables

**`apps/backend/.env`:**
```bash
# Database (adjust if your local Postgres uses different credentials)
DATABASE_URL=ecto://postgres:postgres@localhost/cgraph_dev

# This should be a long random string - generate one:
# mix phx.gen.secret
SECRET_KEY_BASE=your-super-secret-key-at-least-64-chars-long-generate-with-mix-phx-gen-secret

# JWT signing key (also generate with mix phx.gen.secret)
GUARDIAN_SECRET=another-long-random-string

# Redis (default local)
REDIS_URL=redis://localhost:6379

# For local dev, these can be fake
RESEND_API_KEY=re_fake_key_for_dev
R2_ACCESS_KEY_ID=fake
R2_SECRET_ACCESS_KEY=fake
R2_BUCKET=cgraph-uploads
R2_ENDPOINT=http://localhost:9000
```

**`apps/web/.env`:**
```bash
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

**`apps/mobile/.env`:**
```bash
API_URL=http://localhost:4000
WS_URL=ws://localhost:4000
# For iOS simulator, use http://localhost:4000
# For Android emulator, use http://10.0.2.2:4000
```

---

## Step 3: Set Up the Database

```bash
cd apps/backend

# Create the database
mix ecto.create

# Run migrations
mix ecto.migrate

# Seed with test data (optional but recommended)
mix run priv/repo/seeds.exs
```

### Troubleshooting: Database Issues

**Problem:** `connection refused`
```bash
# Make sure Postgres is running
# macOS: brew services start postgresql@15
# Linux: sudo systemctl start postgresql
```

**Problem:** `role "postgres" does not exist`
```bash
# Create the postgres user
createuser -s postgres
```

**Problem:** `database "cgraph_dev" already exists`
```bash
# Drop and recreate (WARNING: destroys all data)
mix ecto.drop
mix ecto.create
mix ecto.migrate
```

---

## Step 4: Start the Development Servers

The easiest way is to use our turbo script that starts everything:

```bash
# From project root
pnpm dev
```

This starts:
- Backend (Phoenix) on `http://localhost:4000`
- Web frontend (Vite) on `http://localhost:5173`

### Or start things separately:

**Terminal 1 - Backend:**
```bash
cd apps/backend
mix phx.server

# Or with iex for debugging
iex -S mix phx.server
```

**Terminal 2 - Web Frontend:**
```bash
cd apps/web
pnpm dev
```

**Terminal 3 - Mobile (optional):**
```bash
cd apps/mobile
pnpm start

# Then press 'i' for iOS simulator or 'a' for Android emulator
```

---

## Step 5: Verify Everything Works

### Check Backend

Visit `http://localhost:4000/api/health` in your browser. You should see:
```json
{"status": "ok", "database": "connected", "redis": "connected"}
```

### Check Web Frontend

Visit `http://localhost:5173`. You should see the login page.

### Check Mobile

Run the app in a simulator:
```bash
cd apps/mobile
pnpm ios   # or pnpm android
```

### Create a Test Account

1. Go to `http://localhost:5173`
2. Click "Sign Up"
3. Use any email (emails don't actually send in dev mode)
4. Check your terminal—the "email" content prints there

Or use the seeded test account:
- Email: `demo@cgraph.org`
- Password: `password123`

---

## Step 6: Explore the Codebase

Here's a quick tour of what's where:

```
CGraph/
├── apps/
│   ├── backend/          # Elixir/Phoenix API server
│   │   ├── lib/
│   │   │   ├── cgraph/           # Business logic (contexts)
│   │   │   │   ├── accounts/     # User auth, settings
│   │   │   │   ├── messaging/    # DMs, conversations
│   │   │   │   ├── groups/       # Servers and channels
│   │   │   │   ├── forums/       # Reddit-style forums
│   │   │   │   └── notifications/
│   │   │   └── cgraph_web/       # Web layer
│   │   │       ├── controllers/  # REST endpoints
│   │   │       ├── channels/     # WebSocket handlers
│   │   │       └── plugs/        # Middleware
│   │   └── priv/
│   │       └── repo/
│   │           └── migrations/   # Database migrations
│   │
│   ├── web/              # React web frontend
│   │   ├── src/
│   │   │   ├── pages/            # Route components
│   │   │   ├── layouts/          # Layout wrappers
│   │   │   ├── lib/              # Utilities, API client
│   │   │   └── stores/           # Zustand state
│   │   └── index.html
│   │
│   └── mobile/           # React Native mobile app
│       ├── src/
│       │   ├── screens/          # Screen components
│       │   ├── navigation/       # React Navigation setup
│       │   ├── contexts/         # React contexts
│       │   └── lib/              # Shared utilities
│       └── App.tsx
│
├── packages/             # Shared code between apps
│   ├── shared-types/     # TypeScript types
│   ├── config/           # Shared configuration
│   └── utils/            # Shared utilities
│
├── docs/                 # You are here! 📍
│
└── infrastructure/       # Deployment configs
    ├── docker/           # Dockerfiles
    ├── fly/              # Fly.io configs
    └── terraform/        # Infrastructure as code
```

---

## Your First Feature: Adding an Endpoint

Let's add a simple "ping" endpoint to prove everything's connected.

### 1. Add the Route

Edit `apps/backend/lib/cgraph_web/router.ex`:

```elixir
# Near the top, in the public API scope
scope "/api", CGraphWeb do
  pipe_through :api
  
  # Add this line
  get "/ping", PingController, :ping
  
  # ... existing routes
end
```

### 2. Create the Controller

Create `apps/backend/lib/cgraph_web/controllers/ping_controller.ex`:

```elixir
defmodule CGraphWeb.PingController do
  use CGraphWeb, :controller
  
  def ping(conn, _params) do
    json(conn, %{
      pong: true,
      timestamp: DateTime.utc_now(),
      message: "If you're reading this, the API works! 🎉"
    })
  end
end
```

### 3. Test It

```bash
# In your browser or with curl
curl http://localhost:4000/api/ping

# Should return:
# {"pong":true,"timestamp":"2024-12-28T...","message":"If you're reading this, the API works! 🎉"}
```

### 4. Call It from the Frontend (Optional)

Add to your React component:
```tsx
import { api } from '@/lib/api';

// Somewhere in your component
const response = await api.get('/ping');
console.log(response.data); // { pong: true, ... }
```

---

## Common Development Tasks

### Running Tests

```bash
# Backend tests
cd apps/backend
mix test

# With coverage
mix test --cover

# Web frontend tests
cd apps/web
pnpm test

# Mobile tests
cd apps/mobile
pnpm test
```

### Linting & Formatting

```bash
# Format Elixir code
cd apps/backend
mix format

# Lint TypeScript
pnpm lint

# Fix lint issues automatically
pnpm lint:fix
```

### Database Commands

```bash
cd apps/backend

# Create a new migration
mix ecto.gen.migration add_phone_to_users

# Run migrations
mix ecto.migrate

# Rollback last migration
mix ecto.rollback

# Reset database (drops, creates, migrates, seeds)
mix ecto.reset
```

### Generating Code

```bash
# Generate a new Phoenix context (creates schema, context, migration)
mix phx.gen.context Messaging Message messages \
  content:text sender_id:references:users

# Generate JSON resource (context + controller + tests)
mix phx.gen.json Messaging Message messages \
  content:text sender_id:references:users
```

---

## Docker Development (Alternative)

If you prefer Docker, we have a compose file that sets up everything:

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# This starts:
# - PostgreSQL on 5432
# - Redis on 6379
# - Backend on 4000
# - Web on 5173
```

The Docker setup mounts your local code, so changes are reflected immediately.

---

## VS Code Setup (Recommended)

Install these extensions for the best experience:

**Required:**
- [ElixirLS](https://marketplace.visualstudio.com/items?itemName=JakeBecker.elixir-ls) - Elixir language support
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - Code formatting
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - TypeScript linting
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) - CSS classes

**Nice to have:**
- [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) - Git blame, history
- [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) - Inline error display
- [Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client) - API testing

**Workspace settings (`.vscode/settings.json`):**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[elixir]": {
    "editor.defaultFormatter": "JakeBecker.elixir-ls"
  },
  "elixirLS.suggestSpecs": true,
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

---

## Troubleshooting

### "Port 4000 already in use"

```bash
# Find and kill the process
lsof -i :4000
kill -9 <PID>

# Or just use a different port
PORT=4001 mix phx.server
```

### "Cannot connect to database"

1. Check Postgres is running: `pg_isready`
2. Check connection string in `.env`
3. Try connecting manually: `psql $DATABASE_URL`

### "WebSocket connection failed"

1. Check backend is running
2. Check WS_URL in frontend `.env`
3. Check browser console for CORS errors
4. Try disabling browser extensions (some block WS)

### "Mix command not found"

Elixir isn't in your PATH. Try:
```bash
# macOS with Homebrew
source ~/.zshrc  # or ~/.bashrc

# Or add to path manually
export PATH="$PATH:/usr/local/bin"
```

### "Mobile app can't connect to API"

1. Use `10.0.2.2:4000` for Android emulator (not localhost)
2. Use `localhost:4000` for iOS simulator
3. For physical device, use your computer's local IP (e.g., `192.168.1.x:4000`)

### "Everything is still broken"

```bash
# Nuclear option: clean everything and start fresh
rm -rf node_modules apps/*/node_modules packages/*/node_modules
rm -rf apps/backend/_build apps/backend/deps
pnpm install
cd apps/backend && mix deps.get && mix ecto.reset
```

---

## Getting Help

Stuck? Here's where to ask:

1. **#dev-help** Slack channel - fastest response
2. **GitHub Issues** - for bugs or feature requests
3. **@chen** - infrastructure questions
4. **@marcus** - backend questions
5. **@aisha** - frontend questions

When asking for help, please include:
- What you're trying to do
- What error you're seeing (full stack trace)
- What you've already tried
- Your OS and tool versions

---

## Next Steps

Now that you're up and running:

1. 📚 Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand how pieces fit together
2. 🗄️ Check [DATABASE.md](./DATABASE.md) for the data model
3. 📝 Read [CONTRIBUTING.md](./CONTRIBUTING.md) before making changes
4. 🚀 Try building a small feature to get familiar with the codebase

Welcome to the team! 🎉

---

*If these instructions don't work, please update them! The "docs are always outdated" problem only gets solved if we all maintain them.*
