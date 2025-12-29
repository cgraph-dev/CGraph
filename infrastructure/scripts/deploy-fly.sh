#!/bin/bash
# CGraph Fly.io Deployment Script
# Deploys the application to Fly.io

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="${FLY_APP_NAME:-cgraph}"
REGION="${FLY_REGION:-iad}"

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       CGraph Fly.io Deployment           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}flyctl not found. Installing...${NC}"
    curl -L https://fly.io/install.sh | sh
    export PATH="$HOME/.fly/bin:$PATH"
fi

# Check authentication
echo -e "${BLUE}Checking Fly.io authentication...${NC}"
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}Not authenticated. Please log in:${NC}"
    flyctl auth login
fi
echo -e "${GREEN}✓${NC} Authenticated with Fly.io"

# Check if app exists
if ! flyctl apps list | grep -q "$APP_NAME"; then
    echo -e "${BLUE}Creating new Fly.io app: $APP_NAME${NC}"
    flyctl apps create "$APP_NAME" --org personal
fi

# Set secrets if not already set
echo ""
echo -e "${BLUE}Checking secrets...${NC}"

# Generate secrets if needed
if [ -z "$(flyctl secrets list -a $APP_NAME | grep SECRET_KEY_BASE)" ]; then
    echo "Setting SECRET_KEY_BASE..."
    SECRET_KEY_BASE=$(openssl rand -base64 48)
    flyctl secrets set SECRET_KEY_BASE="$SECRET_KEY_BASE" -a "$APP_NAME"
fi

if [ -z "$(flyctl secrets list -a $APP_NAME | grep GUARDIAN_SECRET)" ]; then
    echo "Setting GUARDIAN_SECRET..."
    GUARDIAN_SECRET=$(openssl rand -base64 48)
    flyctl secrets set GUARDIAN_SECRET="$GUARDIAN_SECRET" -a "$APP_NAME"
fi

echo -e "${GREEN}✓${NC} Secrets configured"

# Deploy
echo ""
echo -e "${BLUE}Deploying to Fly.io...${NC}"
flyctl deploy \
    --app "$APP_NAME" \
    --config infrastructure/fly/fly.toml \
    --dockerfile infrastructure/docker/Dockerfile.backend \
    --remote-only

# Run migrations
echo ""
echo -e "${BLUE}Running database migrations...${NC}"
flyctl ssh console -a "$APP_NAME" -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"

# Show status
echo ""
echo -e "${BLUE}Deployment Status:${NC}"
flyctl status -a "$APP_NAME"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Deployment complete! 🚀            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "Your app is live at: https://$APP_NAME.fly.dev"
echo ""
