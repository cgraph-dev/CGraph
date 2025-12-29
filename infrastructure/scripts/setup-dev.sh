#!/bin/bash
# CGraph Development Setup Script
# Sets up the local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       CGraph Development Setup           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 20+."
    exit 1
fi

# Check pnpm
if command_exists pnpm; then
    PNPM_VERSION=$(pnpm --version)
    print_status "pnpm installed: $PNPM_VERSION"
else
    print_warning "pnpm not found. Installing..."
    npm install -g pnpm
    print_status "pnpm installed"
fi

# Check Elixir
if command_exists elixir; then
    ELIXIR_VERSION=$(elixir --version | head -n 1)
    print_status "Elixir installed: $ELIXIR_VERSION"
else
    print_error "Elixir not found. Please install Elixir 1.17+."
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_status "Docker installed: $DOCKER_VERSION"
else
    print_warning "Docker not found. You'll need Docker for databases."
fi

echo ""
echo -e "${BLUE}Setting up environment...${NC}"
echo ""

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Created .env from .env.example"
    fi
fi

# Install JavaScript dependencies
echo ""
echo -e "${BLUE}Installing JavaScript dependencies...${NC}"
pnpm install
print_status "JavaScript dependencies installed"

# Install Elixir dependencies
echo ""
echo -e "${BLUE}Installing Elixir dependencies...${NC}"
cd apps/backend
mix deps.get
print_status "Elixir dependencies installed"

# Compile Elixir project
echo ""
echo -e "${BLUE}Compiling Elixir project...${NC}"
mix compile
print_status "Elixir project compiled"

cd ../..

# Start Docker services if Docker is available
if command_exists docker; then
    echo ""
    echo -e "${BLUE}Starting Docker services...${NC}"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    sleep 5
    
    print_status "Docker services started"
    
    # Setup database
    echo ""
    echo -e "${BLUE}Setting up database...${NC}"
    cd apps/backend
    mix ecto.create
    mix ecto.migrate
    print_status "Database setup complete"
    cd ../..
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Development setup complete! 🎉       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "To start the application:"
echo ""
echo "  Backend:  cd apps/backend && mix phx.server"
echo "  Web:      pnpm --filter @cgraph/web dev"
echo "  Mobile:   cd apps/mobile && npx expo start"
echo ""
echo "Or use Docker:"
echo ""
echo "  docker-compose -f docker-compose.yml -f docker-compose.dev.yml up"
echo ""
