# How to Start Everything

Step-by-step guide to get CGraph running on your machine. No assumptions, no shortcuts.

---

## Prerequisites

Before anything else, install these:

### Required Software

| Software | Version | Check Command |
|----------|---------|---------------|
| Node.js | 22 LTS | `node --version` |
| pnpm | 9+ | `pnpm --version` |
| Elixir | 1.19+ | `elixir --version` |
| Erlang/OTP | 28+ | `erl -version` |
| PostgreSQL | 16+ | `psql --version` |
| Docker | 24+ | `docker --version` |
| asdf | latest | `asdf --version` |

### Install Guide (Ubuntu/Debian)

```bash
# Install asdf build dependencies
sudo apt install curl git build-essential autoconf m4 libncurses5-dev \
  libwxgtk3.2-dev libwxgtk-webview3.2-dev libgl1-mesa-dev libglu1-mesa-dev \
  libpng-dev libssh-dev unixodbc-dev xsltproc fop libxml2-utils libncurses-dev

# Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# pnpm
npm install -g pnpm

# Elixir (via asdf - required for OTP 28)
git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.15.0
echo '. $HOME/.asdf/asdf.sh' >> ~/.bashrc
source ~/.bashrc
asdf plugin add erlang
asdf plugin add elixir
asdf install erlang 28.3          # Takes ~10-15 min
asdf install elixir 1.19.4-otp-28
asdf global erlang 28.3
asdf global elixir 1.19.4-otp-28

# PostgreSQL
sudo apt install postgresql-16 postgresql-contrib
sudo systemctl start postgresql
```

### Install Guide (macOS)

```bash
# Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install asdf (required for OTP 28)
brew install asdf
echo -e "\n. $(brew --prefix asdf)/libexec/asdf.sh" >> ~/.zshrc
source ~/.zshrc

# Install Erlang/OTP and Elixir
asdf plugin add erlang
asdf plugin add elixir
asdf install erlang 28.3          # Takes ~10-15 min
asdf install elixir 1.19.4-otp-28
asdf global erlang 28.3
asdf global elixir 1.19.4-otp-28

# Other dependencies
brew install node@22 pnpm postgresql@16
brew services start postgresql@16
```

---

## Step 1: Clone and Setup

```bash
# Clone the repo
git clone https://github.com/cgraph-dev/CGraph.git
cd CGraph

# Install all dependencies (root level)
pnpm install
```

---

## Step 2: Database Setup

### Create the Database

```bash
# Connect to Postgres
sudo -u postgres psql

# In psql prompt:
CREATE USER cgraph WITH PASSWORD 'cgraph_dev_password';
CREATE DATABASE cgraph_dev OWNER cgraph;
CREATE DATABASE cgraph_test OWNER cgraph;
GRANT ALL PRIVILEGES ON DATABASE cgraph_dev TO cgraph;
GRANT ALL PRIVILEGES ON DATABASE cgraph_test TO cgraph;
\q
```

### Environment Variables

```bash
# Copy the example env file
cp apps/backend/.env.example apps/backend/.env

# Edit and set at minimum:
DATABASE_URL=postgres://cgraph:cgraph_dev_password@localhost/cgraph_dev
SECRET_KEY_BASE=run-mix-phx-gen-secret-to-generate-this
JWT_SECRET=another-random-string-here
```

Generate a secret:
```bash
cd apps/backend
mix phx.gen.secret
# Copy the output to SECRET_KEY_BASE in .env
```

### Run Migrations

```bash
cd apps/backend
mix deps.get          # Install Elixir dependencies
mix ecto.create       # Create database
mix ecto.migrate      # Run migrations
```

---

## Step 3: Start the Backend

```bash
cd apps/backend
mix phx.server
```

You should see:
```
[info] Running CgraphWeb.Endpoint with cowboy 2.x.x at http://localhost:4000
```

**Test it works:**
```bash
curl http://localhost:4000/health
# Should return: {"status":"healthy",...}
```

Leave this terminal running.

---

## Step 4: Start the Web Frontend

Open a **new terminal**:

```bash
cd apps/web
pnpm dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser.

---

## Step 5: Start the Mobile App (Optional)

Open another **new terminal**:

```bash
cd apps/mobile
pnpm start
```

This starts Expo. You can:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

---

## Quick Start with Docker

If you don't want to install everything locally:

```bash
# Start everything
docker-compose -f docker-compose.dev.yml up -d

# Check logs
docker-compose logs -f backend
```

Services will be at:
- Backend: http://localhost:4000
- Web: http://localhost:5173
- Postgres: localhost:5432

---

## Starting Individual Services

### Backend Only

```bash
cd apps/backend
mix phx.server

# Or in interactive mode (useful for debugging)
iex -S mix phx.server
```

### Web Only

```bash
cd apps/web
pnpm dev
```

### Mobile Only

```bash
cd apps/mobile
pnpm start
```

### Database Only (Docker)

```bash
docker-compose up -d postgres
```

---

## Running Tests

### Backend Tests

```bash
cd apps/backend
MIX_ENV=test mix ecto.reset   # First time only
mix test
```

### Web Tests

```bash
cd apps/web
pnpm test
```

### All Tests

```bash
# From root
pnpm test
```

---

## Common Issues

### "ecto.create: database already exists"

This is fine. It means the database was already created. Run migrations:
```bash
mix ecto.migrate
```

### "connection refused" to postgres

Check Postgres is running:
```bash
# Linux
sudo systemctl status postgresql

# macOS
brew services list
```

### "mix: command not found"

Elixir isn't installed or not in PATH. Check:
```bash
which elixir
```

If using asdf:
```bash
source ~/.asdf/asdf.sh
```

### "EADDRINUSE: port 4000 already in use"

Something else is using port 4000. Kill it:
```bash
lsof -ti:4000 | xargs kill -9
```

Or use a different port:
```bash
PORT=4001 mix phx.server
```

### Mobile app can't connect to backend

In development, you need your machine's local IP (not localhost):

```bash
# Get your IP
hostname -I   # Linux
ipconfig getifaddr en0  # macOS
```

Update `apps/mobile/.env`:
```
API_URL=http://YOUR_IP:4000
```

---

## Stopping Everything

### If running directly

Press `Ctrl+C` in each terminal.

### If using Docker

```bash
docker-compose down
```

---

## Development Workflow

1. **Start Postgres** (Docker or native)
2. **Start Backend** (terminal 1)
3. **Start Web** (terminal 2)
4. **Start Mobile** if needed (terminal 3)

Make code changes → Auto-reload handles the rest.

For Elixir changes, Phoenix auto-recompiles. For TypeScript, Vite hot-reloads.

---

## Production Mode (Local Testing)

To test production builds locally:

### Backend

```bash
cd apps/backend
MIX_ENV=prod mix release
_build/prod/rel/cgraph/bin/cgraph start
```

### Web

```bash
cd apps/web
pnpm build
pnpm preview
```

---

## Useful Commands

```bash
# Elixir/Phoenix
mix deps.get          # Install dependencies
mix ecto.migrate      # Run migrations
mix ecto.rollback     # Undo last migration
mix ecto.reset        # Drop, create, migrate, seed
mix test              # Run tests
mix phx.routes        # List all routes
iex -S mix            # Interactive shell with app loaded

# pnpm (Node.js)
pnpm install          # Install all packages
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm test             # Run tests
pnpm lint             # Check code style

# Docker
docker-compose up -d       # Start in background
docker-compose logs -f     # Follow logs
docker-compose down        # Stop all
docker-compose ps          # Show running containers
```

---

## Next Steps

Once everything is running:

1. Create a test account via the web UI
2. Check the database: `psql cgraph_dev` → `SELECT * FROM users;`
3. Test the API: `curl http://localhost:4000/api/v1/me` (with auth)
4. Open another browser for a second user to test messaging

---

*Last updated: December 31, 2025*
