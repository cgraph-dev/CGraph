# Required GitHub Secrets & Variables

This document lists all secrets and variables required for the GitHub Actions workflows.

## Secrets

Configure these in your repository settings: **Settings → Secrets and variables → Actions → Secrets**

### Deployment Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `FLY_API_TOKEN` | Yes | Fly.io API token for backend deployment |
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API token for Pages deployment |
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `EXPO_TOKEN` | Yes | Expo access token for mobile builds |

### Build Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL (e.g., `https://api.cgraph.app`) |
| `VITE_WS_URL` | Yes | WebSocket URL (e.g., `wss://api.cgraph.app`) |

### Optional Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `DISCORD_WEBHOOK` | No | Discord webhook URL for release notifications |

## Variables

Configure these in: **Settings → Secrets and variables → Actions → Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCORD_NOTIFICATIONS_ENABLED` | `false` | Set to `true` to enable Discord release notifications |

## Setup Instructions

### 1. Fly.io Token
```bash
fly auth token
```
Copy the output and add as `FLY_API_TOKEN`.

### 2. Cloudflare Tokens
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Create a token with "Cloudflare Pages" permissions
3. Your Account ID is in the URL: `dash.cloudflare.com/<ACCOUNT_ID>/...`

### 3. Expo Token
```bash
expo login
expo whoami --token
```

### 4. Discord Webhook (Optional)
1. In your Discord server, go to Server Settings → Integrations → Webhooks
2. Create a webhook and copy the URL
3. Set `DISCORD_NOTIFICATIONS_ENABLED` variable to `true`

## Environment-Specific Configuration

For production deployments, ensure these environment variables are set in your Fly.io app:

```bash
fly secrets set DATABASE_URL="postgres://..." -a cgraph-backend
fly secrets set SECRET_KEY_BASE="..." -a cgraph-backend
fly secrets set REDIS_URL="redis://..." -a cgraph-backend
```
