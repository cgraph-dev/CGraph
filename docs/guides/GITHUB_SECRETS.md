# CGraph GitHub Secrets & Environment Variables

> Required secrets and environment variables for CI/CD and deployment

**Version:** 0.9.4 | **Last Updated:** January 2026

---

## 📋 Overview

This document lists all required GitHub secrets and environment variables needed for:

- GitHub Actions CI/CD workflows
- Vercel frontend deployment
- Fly.io backend deployment
- Third-party service integrations

---

## 🔐 GitHub Repository Secrets

### Required for CI/CD

| Secret Name           | Description               | Where to Get                                                 |
| --------------------- | ------------------------- | ------------------------------------------------------------ |
| `FLY_API_TOKEN`       | Fly.io deployment token   | [Fly.io Dashboard](https://fly.io/dashboard) → Access Tokens |
| `DATABASE_URL`        | Production PostgreSQL URL | Fly.io Postgres or external provider                         |
| `SECRET_KEY_BASE`     | Phoenix secret key        | Run `mix phx.gen.secret`                                     |
| `GUARDIAN_SECRET_KEY` | JWT signing key           | Run `mix guardian.gen.secret`                                |

### Vercel Deployment

| Secret Name         | Description            | Where to Get                                          |
| ------------------- | ---------------------- | ----------------------------------------------------- |
| `VERCEL_TOKEN`      | Vercel API token       | [Vercel Dashboard](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID`     | Vercel organization ID | Vercel project settings                               |
| `VERCEL_PROJECT_ID` | Vercel project ID      | Vercel project settings                               |

### Mobile App (Expo/EAS)

| Secret Name                       | Description            | Where to Get                                                                 |
| --------------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `EXPO_TOKEN`                      | Expo access token      | [Expo Dashboard](https://expo.dev/accounts/[account]/settings/access-tokens) |
| `APPLE_APP_STORE_CONNECT_API_KEY` | iOS deployment key     | Apple Developer Portal                                                       |
| `GOOGLE_PLAY_SERVICE_ACCOUNT`     | Android deployment key | Google Play Console                                                          |

### External Services

| Secret Name            | Description            | Where to Get                          |
| ---------------------- | ---------------------- | ------------------------------------- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token   | Cloudflare Dashboard → API Tokens     |
| `SENTRY_DSN`           | Sentry error tracking  | [Sentry Dashboard](https://sentry.io) |
| `SENTRY_AUTH_TOKEN`    | Sentry release uploads | Sentry → Settings → Auth Tokens       |

### OAuth Providers

| Secret Name            | Description            | Where to Get                                                              |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret    | Google Cloud Console                                                      |
| `APPLE_CLIENT_ID`      | Apple Sign-In ID       | [Apple Developer Portal](https://developer.apple.com)                     |
| `APPLE_CLIENT_SECRET`  | Apple Sign-In secret   | Apple Developer Portal                                                    |
| `FACEBOOK_APP_ID`      | Facebook OAuth app ID  | [Meta for Developers](https://developers.facebook.com)                    |
| `FACEBOOK_APP_SECRET`  | Facebook OAuth secret  | Meta for Developers                                                       |

### Storage & Infrastructure

| Secret Name             | Description                  | Where to Get                   |
| ----------------------- | ---------------------------- | ------------------------------ |
| `AWS_ACCESS_KEY_ID`     | S3-compatible storage key    | AWS IAM or compatible provider |
| `AWS_SECRET_ACCESS_KEY` | S3-compatible storage secret | AWS IAM or compatible provider |
| `S3_BUCKET_NAME`        | Storage bucket name          | Your S3/Minio configuration    |
| `S3_ENDPOINT`           | S3 endpoint URL              | Your S3/Minio configuration    |
| `REDIS_URL`             | Redis connection URL         | Fly.io Redis or Upstash        |

---

## 🌐 Environment Variables by Service

### Fly.io Backend Secrets

Set these using `flyctl secrets set`:

```bash
flyctl secrets set \
  SECRET_KEY_BASE="your-secret-key" \
  GUARDIAN_SECRET_KEY="your-guardian-key" \
  DATABASE_URL="postgres://user:pass@host:5432/db" \
  REDIS_URL="redis://host:6379" \
  PHX_HOST="cgraph-backend.fly.dev" \
  -a cgraph-backend
```

**Full list for production:**

```bash
# Core
SECRET_KEY_BASE=xxx
GUARDIAN_SECRET_KEY=xxx
DATABASE_URL=xxx
REDIS_URL=xxx
PHX_HOST=cgraph-backend.fly.dev
POOL_SIZE=10

# OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
APPLE_CLIENT_ID=xxx
APPLE_CLIENT_SECRET=xxx

# Storage
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_BUCKET=cgraph-uploads
S3_REGION=auto
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx

# Email (optional)
SMTP_HOST=smtp.postmarkapp.com
SMTP_USERNAME=xxx
SMTP_PASSWORD=xxx
```

### Vercel Environment Variables

Set in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# API Configuration
VITE_API_URL=https://cgraph-backend.fly.dev
VITE_WS_URL=wss://cgraph-backend.fly.dev/socket

# Feature Flags
VITE_ENABLE_E2EE=true
VITE_ENABLE_WEB3=true
VITE_ENABLE_GAMIFICATION=true

# Analytics
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_POSTHOG_KEY=xxx

# OAuth
VITE_GOOGLE_CLIENT_ID=xxx
```

### Expo/EAS Environment

Set in `eas.json` or as EAS secrets:

```bash
eas secret:create --name API_URL --value https://cgraph-backend.fly.dev
eas secret:create --name SENTRY_DSN --value https://xxx@sentry.io/xxx
```

---

## ⚙️ Setting Up Secrets

### GitHub Actions

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value

### Fly.io

```bash
# Single secret
flyctl secrets set SECRET_KEY_BASE="your-key" -a cgraph-backend

# Multiple secrets from file
flyctl secrets import < .env.production -a cgraph-backend

# List current secrets
flyctl secrets list -a cgraph-backend
```

### Vercel

```bash
# Using Vercel CLI
vercel env add VITE_API_URL production

# Or via dashboard:
# Vercel → Project → Settings → Environment Variables
```

---

## 🔄 Secret Rotation

### When to Rotate

- `SECRET_KEY_BASE`: Annually or after security incident
- `GUARDIAN_SECRET_KEY`: Annually (invalidates all JWTs)
- OAuth secrets: When compromised
- API tokens: Every 90 days for high-security environments

### Rotation Process

1. Generate new secret value
2. Update in all environments (GitHub, Fly.io, Vercel)
3. Deploy backend first (if JWT-related)
4. Deploy frontend
5. Verify all services are working
6. Revoke old secret (if applicable)

```bash
# Generate new Phoenix secret
mix phx.gen.secret

# Generate new Guardian secret
mix guardian.gen.secret

# Update on Fly.io
flyctl secrets set SECRET_KEY_BASE="new-secret" -a cgraph-backend
```

---

## 🔍 Verification

### Check GitHub Secrets

1. Navigate to **Actions** tab
2. Run a workflow that uses the secret
3. Check logs for any "secret not found" errors

### Check Fly.io Secrets

```bash
# List configured secrets (names only, not values)
flyctl secrets list -a cgraph-backend

# Verify app can read secrets
flyctl ssh console -a cgraph-backend -C "printenv | grep -E 'SECRET|DATABASE'"
```

### Check Vercel Environment

```bash
# List environment variables
vercel env ls

# Pull to local for testing
vercel env pull .env.local
```

---

## 📝 Secret Template

Create a `.env.example` file as a template (commit this, but never actual values):

```bash
# Backend (.env.example)
DATABASE_URL=postgres://user:pass@localhost:5432/cgraph_dev
REDIS_URL=redis://localhost:6379
SECRET_KEY_BASE=generate_with_mix_phx_gen_secret
GUARDIAN_SECRET_KEY=generate_with_mix_guardian_gen_secret
PHX_HOST=localhost

# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Storage (optional)
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=cgraph-dev
S3_ENDPOINT=http://localhost:9000
```

---

## ⚠️ Security Best Practices

1. **Never commit secrets** - Use `.gitignore` for all `.env` files
2. **Use least privilege** - Create tokens with minimal required permissions
3. **Rotate regularly** - Set calendar reminders for rotation
4. **Audit access** - Review who has access to secrets periodically
5. **Use secret scanning** - Enable GitHub secret scanning
6. **Separate environments** - Different secrets for dev/staging/prod

---

_Last updated: January 2026_
