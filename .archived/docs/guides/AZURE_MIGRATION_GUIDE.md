# CGraph Azure Migration Guide

> **Zero-downtime migration from Fly.io → Azure Container Apps**
>
> Generated: 2026-03-02 — Based on full infrastructure audit
>
> Budget: $1,000 Azure credits | Estimated monthly: ~$100-140
>
> Estimated effort: 3 phases, ~8-12 hours total
>
> **GOLDEN RULE: We must not break anything!**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [What Moves vs What Stays](#2-what-moves-vs-what-stays)
3. [Pre-Migration Checklist](#3-pre-migration-checklist)
4. [Phase A: Provision Azure Resources](#phase-a-provision-azure-resources)
5. [Phase B: Data Migration & App Deployment](#phase-b-data-migration--app-deployment)
6. [Phase C: DNS Cutover & Verification](#phase-c-dns-cutover--verification)
7. [Dockerfile Changes Required](#7-dockerfile-changes-required)
8. [CI/CD Pipeline Updates](#8-cicd-pipeline-updates)
9. [Post-Migration Checklist](#9-post-migration-checklist)
10. [Rollback Plan](#10-rollback-plan)
11. [Environment Variables — Complete Map](#11-environment-variables--complete-map)
12. [Terraform Changes](#12-terraform-changes)
13. [Cost Breakdown](#13-cost-breakdown)
14. [Risk Register](#14-risk-register)
15. [Command Cheat Sheet](#15-command-cheat-sheet)

---

## 1. Architecture Overview

### Current (Fly.io)

```
cgraph.org ──────────→ Vercel (landing page)
www.cgraph.org ──────→ Vercel (landing page)
web.cgraph.org ──────→ Cloudflare Pages (React SPA)
app.cgraph.org ──────→ Cloudflare Pages (React SPA)
api.cgraph.org ──────→ Cloudflare (proxied CNAME) ──→ Fly.io "cgraph-backend"
                          Frankfurt (fra) region
                          ├── Phoenix app (2 perf CPUs, 4GB RAM, min 2 machines)
                          ├── PgBouncer sidecar (localhost:6432)
                          └── Grafana Alloy sidecar (Prometheus → Grafana Cloud)
                                     │
                          ┌──────────┼──────────┐
                          ▼          ▼          ▼
                   Supabase PG    Redis     Cloudflare R2
                   (external)   (external)  (S3-compatible)
```

### Target (Azure)

```
cgraph.org ──────────→ Vercel (landing page)              ← NO CHANGE
www.cgraph.org ──────→ Vercel (landing page)              ← NO CHANGE
web.cgraph.org ──────→ Cloudflare Pages (React SPA)       ← NO CHANGE
app.cgraph.org ──────→ Cloudflare Pages (React SPA)       ← NO CHANGE
api.cgraph.org ──────→ Cloudflare (proxied CNAME) ──→ Azure Container Apps
                          West Europe (westeurope) region
                          ├── Phoenix app (2 vCPUs, 4Gi RAM, 1-4 replicas)
                          └── Grafana Alloy sidecar (same container or ACA sidecar)
                                     │
                          ┌──────────┼──────────┐
                          ▼          ▼          ▼
                   Azure PG       Azure      Cloudflare R2
                   Flexible      Redis       (stays — cheaper)
                   (built-in     Cache
                    PgBouncer)   (TLS-only)
```

**Key architectural change:** PgBouncer moves from a Docker sidecar process to Azure PostgreSQL's
built-in PgBouncer (free, enabled via server parameter).

---

## 2. What Moves vs What Stays

### ✅ STAYS — No changes needed

| Service             | Current Host                 | Notes                                                                       |
| ------------------- | ---------------------------- | --------------------------------------------------------------------------- |
| Landing page        | Vercel                       | Free tier, `cgraph.org` + `www.cgraph.org`                                  |
| Web app (SPA)       | Cloudflare Pages             | Free tier, `web.cgraph.org` + `app.cgraph.org`                              |
| DNS / CDN / WAF     | Cloudflare                   | Only update `api` CNAME target + health check                               |
| Object storage      | Cloudflare R2                | `cgraph-uploads` bucket — cheaper than Azure Blob, keep it                  |
| Transactional email | Resend                       | External API, env var `RESEND_API_KEY` migrates as-is                       |
| Billing             | Stripe                       | External API, **webhook URL must be updated**                               |
| Error tracking      | Sentry                       | External API, env var `SENTRY_DSN` migrates as-is                           |
| Observability       | Grafana Cloud                | Alloy sidecar stays, env vars migrate. **Alloy config needs label changes** |
| Mobile builds       | Expo/EAS                     | External service, `EXPO_TOKEN` in CI only                                   |
| OAuth providers     | Google/Apple/Facebook/TikTok | **Callback URLs use `PHX_HOST`, no change if `PHX_HOST=api.cgraph.org`**    |
| Alerting            | PagerDuty / Slack            | Webhook-based, no change                                                    |
| WebRTC              | LiveKit (if configured)      | External SFU, env vars migrate as-is                                        |

### 🔄 MOVES — Must re-provision

| Current                              | Azure Replacement                      | SKU/Tier                   |
| ------------------------------------ | -------------------------------------- | -------------------------- |
| Fly.io VM ×2 (2 perf CPUs, 4GB each) | Azure Container Apps                   | 2 vCPU, 4Gi × 1-4 replicas |
| Supabase PostgreSQL 16               | Azure Database for PostgreSQL Flexible | Standard_B2s (2 vCPU, 4GB) |
| Redis (external)                     | Azure Cache for Redis                  | Basic C0 (250MB)           |
| PgBouncer sidecar (in Docker)        | Azure PG built-in PgBouncer            | Free with Flexible Server  |
| Meilisearch                          | Skip — not deployed in prod            | Falls back to PG ILIKE     |

---

## 3. Pre-Migration Checklist

**Complete ALL items before touching Azure.**

### 3.1 Data Backup

- [ ] **Extract current DATABASE_URL from Fly.io**
  ```bash
  fly ssh console -a cgraph-backend -C "printenv DATABASE_URL"
  ```
- [ ] **Full database dump (schema + data)**
  ```bash
  pg_dump "$DATABASE_URL" \
    --no-owner --no-privileges --no-acl \
    --format=custom --compress=9 \
    --file=cgraph_backup_$(date +%Y%m%d).dump
  ```
- [ ] **Verify backup integrity**
  ```bash
  pg_restore --list cgraph_backup_*.dump | wc -l
  # Should return 100+ entries (117 migrations + tables)
  ```
- [ ] **Export R2 file inventory** (verify what's in storage)
  ```bash
  # Using AWS CLI with R2 endpoint
  aws s3 ls s3://cgraph-uploads/ --recursive \
    --endpoint-url https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com \
    | wc -l
  ```

### 3.2 Extract ALL Secrets from Fly.io

**⚠️ CRITICAL: These commands extract actual secret values. Handle with care.**

```bash
# Connect to running Fly.io machine and dump all needed secrets
fly ssh console -a cgraph-backend -C "printenv" > /tmp/flyio_env_dump.txt

# Or extract individually (more secure):
fly ssh console -a cgraph-backend -C "printenv SECRET_KEY_BASE"
fly ssh console -a cgraph-backend -C "printenv JWT_SECRET"
fly ssh console -a cgraph-backend -C "printenv ENCRYPTION_KEY"
fly ssh console -a cgraph-backend -C "printenv LIVE_VIEW_SIGNING_SALT"
fly ssh console -a cgraph-backend -C "printenv DATABASE_URL"
fly ssh console -a cgraph-backend -C "printenv REDIS_URL"
fly ssh console -a cgraph-backend -C "printenv RESEND_API_KEY"
fly ssh console -a cgraph-backend -C "printenv STRIPE_SECRET_KEY"
fly ssh console -a cgraph-backend -C "printenv STRIPE_WEBHOOK_SECRET"
fly ssh console -a cgraph-backend -C "printenv R2_ACCESS_KEY_ID"
fly ssh console -a cgraph-backend -C "printenv R2_SECRET_ACCESS_KEY"
fly ssh console -a cgraph-backend -C "printenv R2_ACCOUNT_ID"
fly ssh console -a cgraph-backend -C "printenv GRAFANA_CLOUD_API_KEY"
fly ssh console -a cgraph-backend -C "printenv GRAFANA_CLOUD_PROMETHEUS_URL"
fly ssh console -a cgraph-backend -C "printenv GRAFANA_CLOUD_PROMETHEUS_USER"
fly ssh console -a cgraph-backend -C "printenv CORS_ORIGINS"
# OAuth (if configured):
fly ssh console -a cgraph-backend -C "printenv GOOGLE_CLIENT_ID"
fly ssh console -a cgraph-backend -C "printenv GOOGLE_CLIENT_SECRET"
```

- [ ] All secret values recorded in a secure location (password manager, NOT plaintext file)
- [ ] Verified: no empty values for REQUIRED secrets

### 3.3 Document Current State

- [ ] **Fly.io app version**: run `fly status -a cgraph-backend` → note version number
- [ ] **Machine count**: fly.toml shows `min_machines_running = 2`
- [ ] **Machine spec**: 2 performance CPUs, 4GB RAM per machine
- [ ] **Region**: `fra` (Frankfurt)
- [ ] **Processes**: `app` (Phoenix) + `pgbouncer` (PgBouncer sidecar)
- [ ] **Current DNS TTL for api.cgraph.org**: Check Cloudflare → likely `auto` (300s)
- [ ] **Stripe webhook endpoint**: `we_1T6dkARq0RB1cdZkmvdbsUMp` →
      `https://cgraph-backend.fly.dev/api/webhooks/stripe`
- [ ] **Database row counts** (for post-migration verification):
  ```sql
  SELECT 'users' as t, count(*) FROM users
  UNION ALL SELECT 'messages', count(*) FROM messages
  UNION ALL SELECT 'conversations', count(*) FROM conversations
  UNION ALL SELECT 'forums', count(*) FROM forums
  UNION ALL SELECT 'oban_jobs', count(*) FROM oban_jobs;
  ```

### 3.4 Reduce DNS TTL — Do This 24-48h Before Cutover

- [ ] **Lower `api.cgraph.org` TTL to 60 seconds** in Cloudflare

  ```bash
  # Via Terraform (recommended):
  # Change ttl = 1 (auto) to ttl = 60 in dns.tf for cloudflare_record.api
  # Apply via: terraform apply -target=cloudflare_record.api

  # Or via Cloudflare Dashboard:
  # DNS → Records → api CNAME → TTL → 1 minute
  # NOTE: Proxied (orange cloud) records ignore TTL — Cloudflare uses its own cache
  # But lower it anyway for the brief moment if we toggle proxy off during cutover
  ```

- [ ] **Wait 24-48 hours** for old cached TTLs to expire worldwide

### 3.5 Prerequisites

- [ ] Azure CLI installed: `az --version` ≥ 2.60
- [ ] Azure subscription activated with $1,000 credits
- [ ] Logged in: `az login` and verify: `az account show`
- [ ] Docker installed locally (for building images)
- [ ] Resource group name decided: `cgraph-production`
- [ ] Region decided: `westeurope` (closest to current Frankfurt)
- [ ] `jq` installed (for parsing Azure CLI output)

---

## Phase A: Provision Azure Resources

### Step A1: Create Resource Group

```bash
az group create \
  --name cgraph-production \
  --location westeurope \
  --tags environment=production project=cgraph
```

- [ ] Resource group `cgraph-production` created in `westeurope`

### Step A2: Create Azure Container Registry (ACR)

We need ACR before we can deploy containers.

```bash
az acr create \
  --resource-group cgraph-production \
  --name cgraphregistry \
  --sku Basic \
  --admin-enabled true \
  --location westeurope

# Get credentials (save these!)
ACR_USERNAME=$(az acr credential show --name cgraphregistry --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name cgraphregistry --query "passwords[0].value" -o tsv)
echo "ACR Server: cgraphregistry.azurecr.io"
echo "ACR Username: $ACR_USERNAME"
echo "ACR Password: $ACR_PASSWORD"
```

- [ ] ACR created: `cgraphregistry.azurecr.io`
- [ ] Admin credentials saved

### Step A3: Create Azure Database for PostgreSQL Flexible Server

```bash
# Generate a strong password (save it securely!)
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
echo "DB Password: $DB_PASSWORD"  # SAVE THIS!

# Create server (Standard_B2s = 2 vCPU, 4GB — matches Fly.io performance)
az postgres flexible-server create \
  --resource-group cgraph-production \
  --name cgraph-db \
  --location westeurope \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --version 16 \
  --admin-user cgraph_admin \
  --admin-password "$DB_PASSWORD" \
  --public-access 0.0.0.0 \
  --yes

# Enable built-in PgBouncer (replaces Docker sidecar!)
az postgres flexible-server parameter set \
  --resource-group cgraph-production \
  --server-name cgraph-db \
  --name pgbouncer.enabled \
  --value true

# Set PgBouncer pool mode to transaction (matches current config)
az postgres flexible-server parameter set \
  --resource-group cgraph-production \
  --server-name cgraph-db \
  --name pgbouncer.pool_mode \
  --value transaction

# Set pool size
az postgres flexible-server parameter set \
  --resource-group cgraph-production \
  --server-name cgraph-db \
  --name pgbouncer.default_pool_size \
  --value 50

# Enforce SSL
az postgres flexible-server parameter set \
  --resource-group cgraph-production \
  --server-name cgraph-db \
  --name require_secure_transport \
  --value on

# Create the application database
az postgres flexible-server db create \
  --resource-group cgraph-production \
  --server-name cgraph-db \
  --database-name cgraph_prod
```

- [ ] PostgreSQL Flexible Server `cgraph-db` created (Standard_B2s, PG 16)
- [ ] PgBouncer enabled in transaction mode (pool_size=50)
- [ ] SSL enforced (`require_secure_transport = on`)
- [ ] Database `cgraph_prod` created
- [ ] **Connection strings noted:**

  ```
  # Via PgBouncer (port 6432) — use this as DATABASE_URL:
  postgresql://cgraph_admin:<PASSWORD>@cgraph-db.postgres.database.azure.com:6432/cgraph_prod?sslmode=require

  # Direct connection (port 5432) — use only for migrations/dumps:
  postgresql://cgraph_admin:<PASSWORD>@cgraph-db.postgres.database.azure.com:5432/cgraph_prod?sslmode=require
  ```

### Step A4: Create Azure Cache for Redis

```bash
az redis create \
  --resource-group cgraph-production \
  --name cgraph-redis \
  --location westeurope \
  --sku Basic \
  --vm-size c0 \
  --redis-version 7 \
  --minimum-tls-version 1.2

# Wait for provisioning (can take 10-15 minutes)
az redis show --resource-group cgraph-production --name cgraph-redis --query provisioningState -o tsv

# Get connection details
REDIS_HOST=$(az redis show -g cgraph-production -n cgraph-redis --query hostName -o tsv)
REDIS_PORT=$(az redis show -g cgraph-production -n cgraph-redis --query sslPort -o tsv)
REDIS_KEY=$(az redis list-keys -g cgraph-production -n cgraph-redis --query primaryKey -o tsv)
echo "Redis URL: rediss://:${REDIS_KEY}@${REDIS_HOST}:${REDIS_PORT}/0"
```

**⚠️ IMPORTANT:** Azure Redis requires TLS. The URL scheme must be `rediss://` (double-s), NOT
`redis://`. The runtime.exs Redis validation checks for a password in the userinfo — Azure format
`rediss://:PASSWORD@host:port` satisfies this because the empty username before `:` plus the
password after `:` makes `userinfo = ":PASSWORD"`.

- [ ] Redis cache created: `cgraph-redis.redis.cache.windows.net:6380`
- [ ] TLS enforced (minimum 1.2)
- [ ] Connection string saved:
  ```
  rediss://:ACCESS_KEY@cgraph-redis.redis.cache.windows.net:6380/0
  ```

### Step A5: Create Container Apps Environment

```bash
# Create Log Analytics workspace (required for Container Apps)
az monitor log-analytics workspace create \
  --resource-group cgraph-production \
  --workspace-name cgraph-logs \
  --location westeurope

LOG_ANALYTICS_ID=$(az monitor log-analytics workspace show \
  -g cgraph-production -n cgraph-logs \
  --query customerId -o tsv)

LOG_ANALYTICS_KEY=$(az monitor log-analytics workspace get-shared-keys \
  -g cgraph-production -n cgraph-logs \
  --query primarySharedKey -o tsv)

# Create Container Apps environment
az containerapp env create \
  --resource-group cgraph-production \
  --name cgraph-env \
  --location westeurope \
  --logs-workspace-id "$LOG_ANALYTICS_ID" \
  --logs-workspace-key "$LOG_ANALYTICS_KEY"
```

- [ ] Log Analytics workspace created
- [ ] Container Apps environment `cgraph-env` created

---

## Phase B: Data Migration & App Deployment

### Step B1: Modify Dockerfile for Azure

**Before building, modify the Dockerfile.** See
[Section 7: Dockerfile Changes Required](#7-dockerfile-changes-required) for exact changes.

- [ ] PgBouncer removed from Dockerfile (Azure has built-in)
- [ ] PgBouncer process removed from fly.toml references
- [ ] IPv6 env vars removed (`ECTO_IPV6`, `ERL_AFLAGS`)
- [ ] Alloy config updated for Azure labels (or kept with generic labels)
- [ ] Tested: `docker build` still succeeds

### Step B2: Build & Push Docker Image

```bash
# Login to ACR
az acr login --name cgraphregistry

# Build the modified Dockerfile
cd /CGraph/apps/backend
docker build -t cgraphregistry.azurecr.io/cgraph-backend:v1-azure .

# Push to ACR
docker push cgraphregistry.azurecr.io/cgraph-backend:v1-azure

# Verify
az acr repository show-tags --name cgraphregistry --repository cgraph-backend --output tsv
```

- [ ] Image built successfully
- [ ] Image pushed to `cgraphregistry.azurecr.io/cgraph-backend:v1-azure`

### Step B3: Export Database from Current Host

```bash
# Use the DATABASE_URL extracted in step 3.2
CURRENT_DB_URL="postgresql://..."  # from Fly.io printenv

# Full dump with maximum compression
pg_dump "$CURRENT_DB_URL" \
  --no-owner \
  --no-privileges \
  --no-acl \
  --format=custom \
  --compress=9 \
  --file=cgraph_full_$(date +%Y%m%d_%H%M%S).dump

echo "Dump size: $(du -h cgraph_full_*.dump | cut -f1)"
```

- [ ] Database exported
- [ ] Dump file verified (size > 0, no pg_dump errors)

### Step B4: Restore Database to Azure PostgreSQL

```bash
# Use DIRECT connection (port 5432), NOT PgBouncer (6432) — restore needs session features
AZURE_DB_DIRECT="postgresql://cgraph_admin:${DB_PASSWORD}@cgraph-db.postgres.database.azure.com:5432/cgraph_prod?sslmode=require"

# Restore
pg_restore \
  --dbname="$AZURE_DB_DIRECT" \
  --no-owner \
  --no-privileges \
  --no-acl \
  --single-transaction \
  --jobs=4 \
  cgraph_full_*.dump

echo "Restore complete"
```

- [ ] Database restored to Azure
- [ ] **Verify table count matches source:**
  ```sql
  -- Connect to Azure PG
  psql "$AZURE_DB_DIRECT" -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
  ```
- [ ] **Verify critical row counts match:**
  ```sql
  SELECT 'users' as t, count(*) FROM users
  UNION ALL SELECT 'messages', count(*) FROM messages
  UNION ALL SELECT 'conversations', count(*) FROM conversations
  UNION ALL SELECT 'forums', count(*) FROM forums;
  ```
- [ ] **Verify migrations table:**
  ```sql
  SELECT count(*) FROM schema_migrations;
  -- Should be 117 (or current count)
  ```

### Step B5: Deploy Container App

```bash
# Create the container app with non-secret env vars
az containerapp create \
  --resource-group cgraph-production \
  --name cgraph-backend \
  --environment cgraph-env \
  --image cgraphregistry.azurecr.io/cgraph-backend:v1-azure \
  --registry-server cgraphregistry.azurecr.io \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 4000 \
  --ingress external \
  --transport http \
  --min-replicas 2 \
  --max-replicas 4 \
  --cpu 2.0 \
  --memory 4.0Gi \
  --env-vars \
    MIX_ENV=prod \
    PHX_SERVER=true \
    PORT=4000 \
    PHX_HOST=api.cgraph.org \
    DATABASE_SSL=true \
    DATABASE_SSL_VERIFY=none \
    POOL_SIZE=30 \
    ERL_CRASH_DUMP_SECONDS=10 \
    "ELIXIR_ERL_OPTIONS=+S 2:2 +SDcpu 2:2 +sbwt short +swt low +stbt ts" \
    APP_URL=https://web.cgraph.org
```

- [ ] Container App created with external ingress
- [ ] Note the default URL: `https://cgraph-backend.<UNIQUE_ID>.westeurope.azurecontainerapps.io`

### Step B6: Set All Secrets

Azure Container Apps uses a two-step process: set secrets, then reference them as env vars.

```bash
# Step 1: Set all secrets
az containerapp secret set \
  --resource-group cgraph-production \
  --name cgraph-backend \
  --secrets \
    database-url='postgresql://cgraph_admin:PASSWORD@cgraph-db.postgres.database.azure.com:6432/cgraph_prod?sslmode=require' \
    pgbouncer-database-url='postgresql://cgraph_admin:PASSWORD@cgraph-db.postgres.database.azure.com:6432/cgraph_prod?sslmode=require' \
    secret-key-base='<VALUE_FROM_FLYIO>' \
    jwt-secret='<VALUE_FROM_FLYIO>' \
    live-view-signing-salt='<VALUE_FROM_FLYIO>' \
    encryption-key='<VALUE_FROM_FLYIO>' \
    redis-url='rediss://:REDIS_KEY@cgraph-redis.redis.cache.windows.net:6380/0' \
    resend-api-key='<VALUE_FROM_FLYIO>' \
    stripe-secret-key='<VALUE_FROM_FLYIO>' \
    stripe-webhook-secret='<WILL_UPDATE_LATER>' \
    stripe-price-premium='price_1T6cmDRq0RB1cdZkheZoVktZ' \
    stripe-price-enterprise='price_1T6cmMRq0RB1cdZkpVLHpXyp' \
    cors-origins='https://web.cgraph.org,https://app.cgraph.org,https://cgraph.org' \
    r2-access-key-id='<VALUE_FROM_FLYIO>' \
    r2-secret-access-key='<VALUE_FROM_FLYIO>' \
    r2-account-id='<VALUE_FROM_FLYIO>' \
    grafana-cloud-api-key='<VALUE_FROM_FLYIO>' \
    grafana-cloud-prometheus-url='<VALUE_FROM_FLYIO>' \
    grafana-cloud-prometheus-user='<VALUE_FROM_FLYIO>'

# Step 2: Map secrets to environment variables
az containerapp update \
  --resource-group cgraph-production \
  --name cgraph-backend \
  --set-env-vars \
    DATABASE_URL=secretref:database-url \
    PGBOUNCER_DATABASE_URL=secretref:pgbouncer-database-url \
    SECRET_KEY_BASE=secretref:secret-key-base \
    JWT_SECRET=secretref:jwt-secret \
    LIVE_VIEW_SIGNING_SALT=secretref:live-view-signing-salt \
    ENCRYPTION_KEY=secretref:encryption-key \
    REDIS_URL=secretref:redis-url \
    RESEND_API_KEY=secretref:resend-api-key \
    STRIPE_SECRET_KEY=secretref:stripe-secret-key \
    STRIPE_WEBHOOK_SECRET=secretref:stripe-webhook-secret \
    STRIPE_PRICE_PREMIUM=secretref:stripe-price-premium \
    STRIPE_PRICE_ENTERPRISE=secretref:stripe-price-enterprise \
    CORS_ORIGINS=secretref:cors-origins \
    R2_ACCESS_KEY_ID=secretref:r2-access-key-id \
    R2_SECRET_ACCESS_KEY=secretref:r2-secret-access-key \
    R2_ACCOUNT_ID=secretref:r2-account-id \
    GRAFANA_CLOUD_API_KEY=secretref:grafana-cloud-api-key \
    GRAFANA_CLOUD_PROMETHEUS_URL=secretref:grafana-cloud-prometheus-url \
    GRAFANA_CLOUD_PROMETHEUS_USER=secretref:grafana-cloud-prometheus-user
```

**Optional secrets (add if configured in Fly.io):**

```bash
# Only if these were set in Fly.io (check printenv output):
az containerapp secret set -g cgraph-production -n cgraph-backend --secrets \
  sentry-dsn='<VALUE>' \
  google-client-id='<VALUE>' \
  google-client-secret='<VALUE>' \
  apple-client-id='<VALUE>' \
  apple-team-id='<VALUE>' \
  apple-key-id='<VALUE>' \
  apple-private-key='<VALUE>' \
  facebook-client-id='<VALUE>' \
  facebook-client-secret='<VALUE>' \
  tiktok-client-key='<VALUE>' \
  tiktok-client-secret='<VALUE>' \
  expo-access-token='<VALUE>' \
  livekit-api-key='<VALUE>' \
  livekit-api-secret='<VALUE>'

# Then map them:
az containerapp update -g cgraph-production -n cgraph-backend --set-env-vars \
  SENTRY_DSN=secretref:sentry-dsn \
  GOOGLE_CLIENT_ID=secretref:google-client-id \
  GOOGLE_CLIENT_SECRET=secretref:google-client-secret \
  # ... etc for each optional secret
```

- [ ] All required secrets set (17 secrets)
- [ ] All secrets mapped to env vars
- [ ] Optional secrets set (if applicable)

### Step B7: Configure Health Probes

```bash
# Create a YAML file for health probe configuration
cat > /tmp/cgraph-probes.yaml << 'EOF'
properties:
  template:
    containers:
      - name: cgraph-backend
        probes:
          - type: Liveness
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          - type: Readiness
            httpGet:
              path: /ready
              port: 4000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          - type: Startup
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 30
            timeoutSeconds: 5
EOF

az containerapp update \
  --resource-group cgraph-production \
  --name cgraph-backend \
  --yaml /tmp/cgraph-probes.yaml
```

**Note:** Using `/health` for liveness + startup, `/ready` for readiness — matches the Fly.io
configuration which has separate health and readiness checks.

- [ ] Health probes configured (liveness, readiness, startup)
- [ ] Container is running:
      `az containerapp show -g cgraph-production -n cgraph-backend --query "properties.runningStatus" -o tsv`

### Step B8: Verify Azure Backend (Before DNS Cutover!)

Get the Azure-generated URL and test everything:

```bash
AZURE_URL=$(az containerapp show -g cgraph-production -n cgraph-backend \
  --query "properties.configuration.ingress.fqdn" -o tsv)
echo "Azure URL: https://$AZURE_URL"

# 1. Health check (includes DB connectivity)
curl -sf "https://$AZURE_URL/health" | jq .
# Expected: {"status":"ok",...}

# 2. Readiness check
curl -sf "https://$AZURE_URL/ready" | jq .

# 3. Prometheus metrics
curl -s "https://$AZURE_URL/metrics" | head -20

# 4. Check container logs for errors
az containerapp logs show -g cgraph-production -n cgraph-backend --tail 200 | grep -i error
```

- [ ] `/health` returns 200 with `{"status":"ok"}`
- [ ] `/ready` returns 200
- [ ] `/metrics` returns Prometheus text format
- [ ] No crash loops in logs
- [ ] Database connection working (health check verifies this)
- [ ] Redis connected (check logs for Redis connection message or warning)

**⚠️ WebSocket Testing Note:** If testing WebSocket connections from a browser to the Azure
temporary URL (`*.azurecontainerapps.io`), connections will be **rejected with 403** because
`prod.exs` has `check_origin` restricted to `*.cgraph.org` domains. This is expected — WebSocket
will work after DNS cutover when requests come from `*.cgraph.org`.

### Step B9: Run Pending Migrations on Azure

If any migrations were added since the dump (unlikely but safe to check):

**Note:** `az containerapp exec` requires the container to be running. If the container fails to
start (e.g., bad `DATABASE_URL`), you cannot exec in. Fix the startup issue first by checking logs:
`az containerapp logs show -g cgraph-production -n cgraph-backend --tail 100`

```bash
# Exec into the running container
az containerapp exec \
  -g cgraph-production -n cgraph-backend \
  --command "/app/bin/cgraph eval 'CGraph.Release.migrate()'"
```

- [ ] Migrations executed (or confirmed none pending)

### Step B10: Create Stripe Webhook for Azure

```bash
# Create NEW webhook endpoint pointing to Azure temporary URL
stripe webhook_endpoints create \
  --api-key "$STRIPE_SECRET_KEY" \
  --url "https://${AZURE_URL}/api/webhooks/stripe" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=customer.subscription.created" \
  -d "enabled_events[]=customer.subscription.updated" \
  -d "enabled_events[]=customer.subscription.deleted" \
  -d "enabled_events[]=invoice.payment_failed" \
  -d "enabled_events[]=invoice.payment_succeeded" \
  -d "enabled_events[]=account.updated" \
  -d "enabled_events[]=transfer.paid" \
  -d "enabled_events[]=transfer.failed"

# ⚠️ Note the signing secret from the output! It starts with whsec_
# Update it in Azure:
az containerapp secret set \
  -g cgraph-production -n cgraph-backend \
  --secrets stripe-webhook-secret='whsec_NEW_VALUE_HERE'
```

- [ ] New Stripe webhook endpoint created for Azure
- [ ] New signing secret (`whsec_*`) saved to Azure secrets
- [ ] Test: `stripe trigger checkout.session.completed --api-key "$STRIPE_SECRET_KEY"` → 200
- [ ] **DO NOT disable the old Fly.io webhook yet** — both endpoints active during transition

### Step B11: Full Smoke Test Suite

Run against **Azure URL** before cutting DNS:

| #   | Test           | Command                                                                                                                       | Expected             |
| --- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 1   | Health         | `curl -sf https://$AZURE_URL/health`                                                                                          | `{"status":"ok"}`    |
| 2   | Readiness      | `curl -sf https://$AZURE_URL/ready`                                                                                           | 200                  |
| 3   | Metrics        | `curl -s https://$AZURE_URL/metrics \| head -5`                                                                               | Prometheus text      |
| 4   | WebSocket      | `wscat -c wss://$AZURE_URL/socket/websocket`                                                                                  | Connection opened    |
| 5   | Auth (login)   | `curl -X POST https://$AZURE_URL/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"...","password":"..."}'` | 200 or 401 (NOT 500) |
| 6   | Stripe webhook | `stripe trigger checkout.session.completed`                                                                                   | 200 in Stripe Events |
| 7   | API version    | `curl -s https://$AZURE_URL/api/v1/version`                                                                                   | Version JSON         |

- [ ] All 7 smoke tests passing
- [ ] No 500 errors in container logs
- [ ] **Ready for DNS cutover**

---

## Phase C: DNS Cutover & Verification

### Step C1: Add Custom Domain to Container App

```bash
# Add the custom domain
az containerapp hostname add \
  --resource-group cgraph-production \
  --name cgraph-backend \
  --hostname api.cgraph.org

# Request managed TLS certificate
az containerapp hostname bind \
  --resource-group cgraph-production \
  --name cgraph-backend \
  --hostname api.cgraph.org \
  --environment cgraph-env \
  --validation-method CNAME
```

**Note:** Since `api.cgraph.org` is behind Cloudflare proxy (orange cloud), the TLS setup differs:

- Cloudflare terminates TLS to the client
- Azure provides TLS between Cloudflare and origin
- Cloudflare's "Full (Strict)" SSL mode requires valid cert on origin → Azure managed cert works

- [ ] Custom domain `api.cgraph.org` added to Container App
- [ ] TLS certificate provisioned (or pending DNS validation)

### Step C2: DNS Cutover — THE SWITCH

**⚠️ This is the point of no return for traffic routing. Both Fly.io and Azure should be running and
healthy.**

**Timing:** Do this during a low-traffic window.

**Method 1: Via Terraform (recommended)**

```bash
cd /CGraph/infrastructure/terraform

# Update the variable
# In production.tfvars (or via -var flag):
# fly_backend_hostname = "cgraph-backend.<UNIQUE_ID>.westeurope.azurecontainerapps.io"

terraform plan -target=cloudflare_record.api -target=cloudflare_healthcheck.backend
# Review the plan carefully!
terraform apply -target=cloudflare_record.api -target=cloudflare_healthcheck.backend
```

**Method 2: Via Cloudflare Dashboard (faster for emergency)**

1. Go to Cloudflare Dashboard → cgraph.org → DNS → Records
2. Find `api` CNAME record (currently pointing to `cgraph-backend.fly.dev`)
3. Edit → change target to `cgraph-backend.<UNIQUE_ID>.westeurope.azurecontainerapps.io`
4. Keep Proxied (orange cloud) ON
5. Save

```bash
# Verify DNS propagation
dig api.cgraph.org CNAME +short
# Should resolve to Azure Container Apps hostname (or Cloudflare, if proxied)

# Verify end-to-end
curl -sf https://api.cgraph.org/health | jq .
# Should return {"status":"ok"} from Azure
```

- [ ] DNS updated from `cgraph-backend.fly.dev` → Azure Container Apps hostname
- [ ] `dig api.cgraph.org` resolves correctly
- [ ] `curl https://api.cgraph.org/health` returns 200 from Azure
- [ ] Web app (`web.cgraph.org`) can connect to API
- [ ] WebSocket connections working from web app

### Step C3: Update Stripe Webhook to Production URL

```bash
# Get the Azure webhook endpoint ID from Step B10
AZURE_WEBHOOK_ID="we_XXXXX"  # from stripe webhook_endpoints list

# Update to final production URL
stripe webhook_endpoints update "$AZURE_WEBHOOK_ID" \
  --api-key "$STRIPE_SECRET_KEY" \
  --url "https://api.cgraph.org/api/webhooks/stripe"

# Disable the old Fly.io webhook
OLD_FLYIO_WEBHOOK_ID="we_1T6dkARq0RB1cdZkmvdbsUMp"
stripe webhook_endpoints update "$OLD_FLYIO_WEBHOOK_ID" \
  --api-key "$STRIPE_SECRET_KEY" \
  --disabled

# Test
stripe trigger checkout.session.completed --api-key "$STRIPE_SECRET_KEY"
# Check: Stripe Dashboard → Developers → Events → should show 200 for api.cgraph.org
```

- [ ] Stripe webhook URL updated to `https://api.cgraph.org/api/webhooks/stripe`
- [ ] Old Fly.io webhook **disabled** (not deleted — keep for rollback)
- [ ] Test event succeeded through production URL

### Step C4: Verify OAuth Callbacks

OAuth callbacks in `runtime.exs` use `PHX_HOST`:

```elixir
redirect_uri: "https://#{host}/api/v1/auth/oauth/google/callback"
```

Since `PHX_HOST=api.cgraph.org` (unchanged), callbacks automatically point to Azure via DNS. **No
OAuth provider dashboard changes needed** unless you previously used `cgraph-backend.fly.dev` as
callback URLs.

- [ ] Verified: OAuth callbacks use `api.cgraph.org` (via PHX_HOST), NOT `fly.dev`
- [ ] If any provider used `fly.dev` URLs → update in provider dashboard:
  - [ ] Google Cloud Console
  - [ ] Apple Developer
  - [ ] Facebook Developer Portal
  - [ ] TikTok Developer Portal

### Step C5: Update ALL `fly.dev` Hardcoded References

**⚠️ THIS STEP IS CRITICAL. The web app, mobile app, and landing page all have
`cgraph-backend.fly.dev` hardcoded in source and build artifacts. Without this step, frontends will
break!**

See **Appendix A** for the complete file list. Key changes:

#### Web App (highest priority — user-facing)

```bash
# 1. Update .env.production
cd /CGraph/apps/web
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' .env.production

# 2. Update CSP in index.html
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' index.html

# 3. Update trusted redirect domains
sed -i "s|'cgraph-backend.fly.dev'|'api.cgraph.org'|g" src/lib/security/xss-csrf.ts

# 4. Update gamification WebSocket fallback
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' src/modules/gamification/hooks/gamificationSocketStore.ts

# 5. Update vite proxy configs (dev convenience — not critical)
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' vite.config.ts vite.config.js

# 6. Update example env
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' .env.example

# 7. REBUILD — this is the critical step!
cd /CGraph && pnpm run build --filter=@cgraph/web

# 8. Redeploy to Cloudflare Pages (via CI or manual)
```

#### Mobile App

```bash
cd /CGraph/apps/mobile
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' app.config.js
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' src/screens/settings/rss-feeds-screen.tsx
# Trigger EAS rebuild for next mobile release
```

#### Landing Page

```bash
cd /CGraph/apps/landing
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' index.html
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' src/pages/resources/Status.tsx
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' src/pages/resources/Documentation.tsx
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' src/data/docs/categories.ts
sed -i 's|cgraph-backend.fly.dev|api.cgraph.org|g' src/data/docs/articles.ts
# Rebuild and push to Vercel
```

#### Infrastructure

```bash
cd /CGraph/infrastructure/cloudflare
sed -i 's|cgraph-backend.fly.dev|<AZURE_CONTAINER_APPS_HOSTNAME>|g' cdn_configuration.yaml
```

- [ ] All `cgraph-backend.fly.dev` references updated in source
- [ ] Web app rebuilt (`pnpm run build --filter=@cgraph/web`)
- [ ] Web app redeployed to Cloudflare Pages
- [ ] Landing page rebuilt and redeployed to Vercel
- [ ] Mobile app changes committed (EAS rebuild for next OTA update)
- [ ] Verify:
      `grep -r "cgraph-backend.fly.dev" apps/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.html" --include="*.env*"`
      returns 0 matches

### Step C6: Monitor for 30 Minutes

After DNS cutover, **actively monitor for 30 minutes**:

```bash
# Watch container logs in real-time
az containerapp logs show -g cgraph-production -n cgraph-backend --follow

# In another terminal, run periodic health checks
watch -n 10 'curl -sf https://api.cgraph.org/health | jq .'
```

- [ ] No 500 errors in logs for 30 minutes
- [ ] Health checks consistently returning 200
- [ ] WebSocket connections stable
- [ ] Grafana Cloud receiving metrics (check Grafana dashboard)
- [ ] No user reports of issues

---

## 7. Dockerfile Changes Required

The current `apps/backend/Dockerfile` bundles PgBouncer and Grafana Alloy sidecars designed for
Fly.io. Azure needs these changes:

### 7.1 Remove PgBouncer Sidecar

Azure PostgreSQL Flexible Server has **built-in PgBouncer** (port 6432). No need for Docker sidecar.

**Remove from runtime stage:**

```dockerfile
# DELETE these lines:
# In the apk add line, remove: pgbouncer
# DELETE:
COPY --chown=cgraph:cgraph pgbouncer/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
COPY --chown=cgraph:cgraph pgbouncer/start.sh /usr/local/bin/start-pgbouncer.sh
RUN chmod +x /usr/local/bin/start-pgbouncer.sh
```

**In fly.toml (no longer used for Azure, but clean up):**

```toml
# DELETE:
[processes]
  pgbouncer = "/usr/local/bin/start-pgbouncer.sh"
```

### 7.2 Remove IPv6 Configuration

Fly.io uses IPv6 internally; Azure Container Apps uses IPv4.

**Remove from fly.toml (env section, no longer applies):**

```
ECTO_IPV6 = "true"
ERL_AFLAGS = "-proto_dist inet6_tcp"
```

**In runtime.exs**: The code already handles this gracefully:

```elixir
maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: [:inet]
```

Since we won't set `ECTO_IPV6` on Azure, it defaults to `[:inet]` (IPv4). **No code change needed.**

### 7.3 Update Alloy Config for Azure Labels

The Alloy config (`alloy/config.alloy`) uses Fly.io-specific env vars for labels:

```
instance = env("FLY_ALLOC_ID")
fly_region = env("FLY_REGION")
fly_app = env("FLY_APP_NAME")
```

**Option A: Omit `FLY_ALLOC_ID` and set the others:** The `start-with-app.sh` script already handles
this: `HOSTNAME="${FLY_ALLOC_ID:-${HOSTNAME:-cgraph-prod}}"`. Azure Container Apps sets `HOSTNAME`
automatically per replica, so DO NOT set `FLY_ALLOC_ID` (it would make all replicas
indistinguishable in Grafana). Just set the region/app labels:

```bash
az containerapp update -g cgraph-production -n cgraph-backend --set-env-vars \
  FLY_REGION=westeurope \
  FLY_APP_NAME=cgraph-backend
```

**Option B: Create an Azure-specific Alloy config** (cleaner long-term): Replace Fly.io labels with
Azure labels in `alloy/config.alloy`:

```
instance     = env("HOSTNAME")           # Azure sets this automatically
azure_region = env("AZURE_REGION")       # Set manually: "westeurope"
app_name     = env("CONTAINER_APP_NAME") # Azure sets this automatically
```

**Recommended: Option A for now** (minimal changes), refactor to Option B later.

### 7.4 Summary of Dockerfile Diff

```diff
 # Runtime stage
 FROM alpine:3.20 AS runtime

 RUN apk add --no-cache \
     libstdc++ \
     openssl \
     ncurses-libs \
     libgcc \
     ca-certificates \
-    pgbouncer \
     gettext \
     wget \
     libc6-compat

 # ... (Alloy install stays the same) ...

-# Copy PgBouncer configuration for sidecar mode
-COPY --chown=cgraph:cgraph pgbouncer/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini
-COPY --chown=cgraph:cgraph pgbouncer/start.sh /usr/local/bin/start-pgbouncer.sh
-RUN chmod +x /usr/local/bin/start-pgbouncer.sh
-
 # Copy Grafana Alloy configuration for metrics sidecar
 COPY --chown=cgraph:cgraph alloy/config.alloy /etc/alloy/config.alloy
 # ... (rest stays) ...
```

---

## 8. CI/CD Pipeline Updates

### 8.1 Current Workflow (`.github/workflows/deploy.yml`)

The deploy workflow has 5 jobs:

1. `ci-gate` — waits for CI to pass
2. `deploy-backend` — deploys to Fly.io via `flyctl deploy --strategy canary`
3. `deploy-web` — deploys to Cloudflare Pages (NO CHANGE)
4. `build-mobile` — triggers EAS Build (NO CHANGE)
5. `smoke-checks` — curls health + web endpoints

### 8.2 Changes Required

**Replace `deploy-backend` job:**

```yaml
deploy-backend:
  name: Deploy Backend
  runs-on: ubuntu-latest
  timeout-minutes: 30
  needs: [ci-gate]
  environment: production
  steps:
    - uses: actions/checkout@v4

    - name: Login to Azure
      uses: azure/login@v2
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Login to ACR
      run: az acr login --name cgraphregistry

    - name: Build and push Docker image
      working-directory: apps/backend
      run: |
        IMAGE_TAG="cgraphregistry.azurecr.io/cgraph-backend:${{ github.sha }}"
        docker build -t "$IMAGE_TAG" .
        docker push "$IMAGE_TAG"

    - name: Deploy to Azure Container Apps
      run: |
        az containerapp update \
          --resource-group cgraph-production \
          --name cgraph-backend \
          --image "cgraphregistry.azurecr.io/cgraph-backend:${{ github.sha }}"

    - name: Verify deployment
      run: |
        # Wait for new revision to be active
        sleep 30
        FQDN=$(az containerapp show \
          -g cgraph-production -n cgraph-backend \
          --query "properties.configuration.ingress.fqdn" -o tsv)
        curl -f --max-time 10 "https://${FQDN}/health"
```

### 8.3 GitHub Actions Secrets — Changes

**Add these secrets** (Settings → Secrets → Actions):

| Secret              | Value                  | Notes                                                                                                                                            |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AZURE_CREDENTIALS` | Service principal JSON | `az ad sp create-for-rbac --name cgraph-deploy --role contributor --scopes /subscriptions/<SUB_ID>/resourceGroups/cgraph-production --json-auth` |
| `ACR_USERNAME`      | ACR admin username     | From Step A2                                                                                                                                     |
| `ACR_PASSWORD`      | ACR admin password     | From Step A2                                                                                                                                     |

**Remove after 1 month** (keep during transition):

| Secret          | Notes                                       |
| --------------- | ------------------------------------------- |
| `FLY_API_TOKEN` | No longer needed once Fly.io decommissioned |

**Update:**

| Secret               | Old Value                               | New Value                       |
| -------------------- | --------------------------------------- | ------------------------------- |
| `BACKEND_HEALTH_URL` | `https://cgraph-backend.fly.dev/health` | `https://api.cgraph.org/health` |

### 8.4 Create Azure Service Principal

```bash
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az ad sp create-for-rbac \
  --name "cgraph-github-deploy" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/cgraph-production" \
  --json-auth

# Copy the entire JSON output — this is the AZURE_CREDENTIALS secret
```

- [ ] Service principal created
- [ ] `AZURE_CREDENTIALS` added to GitHub Secrets
- [ ] `ACR_USERNAME` + `ACR_PASSWORD` added to GitHub Secrets
- [ ] `deploy.yml` updated with Azure deploy job
- [ ] `deploy-backend.yml` (manual) updated similarly
- [ ] Test deploy: trigger workflow_dispatch

---

## 9. Post-Migration Checklist

### Immediate — First 2 Hours

- [ ] `/health` returning 200 consistently
- [ ] `/ready` returning 200 consistently
- [ ] WebSocket connections working (test in web app: send a message)
- [ ] User login/registration working
- [ ] Message sending/receiving working (real-time via WebSocket)
- [ ] File uploads working (test image upload — uses R2, should work unchanged)
- [ ] Stripe webhooks processing (check Stripe Dashboard → Developers → Events)
- [ ] Email delivery working (trigger password reset)
- [ ] Oban background jobs running (check logs for Oban output)
- [ ] Error rate in logs < 1%
- [ ] p95 response time < 200ms (comparable to Fly.io)
- [ ] No OOM kills:
      `az containerapp logs show -g cgraph-production -n cgraph-backend | grep -i "out of memory\|killed"`

### Within 48 Hours

- [ ] Grafana Cloud dashboards receiving metrics from Azure
- [ ] Sentry receiving errors (if any; fewer is better)
- [ ] Test all OAuth login flows (Google, Apple, Facebook, TikTok)
- [ ] Test mobile app connectivity (point app to `api.cgraph.org`)
- [ ] Monitor Azure credit burn rate: Azure Portal → Cost Management
- [ ] Verify automated database backups: Azure Portal → PostgreSQL → Backups
- [ ] Run a basic load test against Azure staging

### Within 1 Week

- [ ] Disable old Fly.io Stripe webhook endpoint
  ```bash
  stripe webhook_endpoints update we_1T6dkARq0RB1cdZkmvdbsUMp --disabled
  ```
- [ ] Scale down Fly.io machines (**don't delete yet** — rollback safety net)
  ```bash
  fly scale count 0 -a cgraph-backend
  ```
- [ ] Verify zero traffic to Fly.io: `fly logs -a cgraph-backend` (should be empty)
- [ ] Update monitoring: `BACKEND_HEALTH_URL` in GitHub secrets
- [ ] Document any Azure-specific tuning (pool sizes, scaling thresholds)
- [ ] Update `CONTRIBUTING.md` with new infrastructure instructions
- [ ] Update `docs/CURRENT_STATE_DASHBOARD.md` with Azure details

### Within 1 Month

- [ ] **Delete Fly.io app**: `fly apps destroy cgraph-backend`
- [ ] **Delete old Stripe webhook endpoint** (not just disabled):
  ```bash
  stripe webhook_endpoints delete we_1T6dkARq0RB1cdZkmvdbsUMp
  ```
- [ ] Remove `FLY_API_TOKEN` from GitHub Secrets
- [ ] Clean up Fly.io-specific files (optional, can archive):
  - `apps/backend/fly.toml`
  - `apps/backend/pgbouncer/` directory
  - `infrastructure/fly/` directory
- [ ] Rename Terraform variable: `fly_backend_hostname` → `backend_hostname`
- [ ] Final cost review: are we within the $100-140/month estimate?
- [ ] Consider creating Terraform modules for Azure resources

---

## 10. Rollback Plan

**If Azure has critical issues, roll back in < 5 minutes.**

### 10.1 Quick Rollback (DNS — Under 2 Minutes)

```bash
# 1. Bring Fly.io machines back online
fly scale count 2 -a cgraph-backend

# 2. Wait for machines to start (~ 30-60 seconds)
fly status -a cgraph-backend

# 3. Change DNS back (Cloudflare Dashboard is faster than Terraform)
# Dashboard → DNS → api CNAME → change target back to: cgraph-backend.fly.dev

# 4. Re-enable old Stripe webhook
stripe webhook_endpoints update we_1T6dkARq0RB1cdZkmvdbsUMp \
  --api-key "$STRIPE_SECRET_KEY" \
  --enabled

# 5. Verify
curl -sf https://api.cgraph.org/health | jq .
```

### 10.2 Data Rollback Considerations

If users wrote data to **Azure PostgreSQL** during the outage/problem window:

1. **If < 1 hour of data**: Acceptable to lose, apologize to affected users
2. **If > 1 hour of data**: Export delta from Azure PG, import to source DB:
   ```bash
   # Get data created after cutover time
   pg_dump "$AZURE_DB_URL" --data-only --table=messages --where="inserted_at > '2026-03-XX 12:00:00'" > delta.sql
   psql "$FLYIO_DB_URL" < delta.sql
   ```

### 10.3 Rollback Prerequisites (Keep These Active!)

| Item                    | Requirement                          | Duration                       |
| ----------------------- | ------------------------------------ | ------------------------------ |
| Fly.io machines         | Keep alive (scale to 0, not destroy) | 1 week minimum                 |
| Fly.io database/secrets | Keep all secrets deployed            | Until Fly.io destroyed         |
| Old Stripe webhook      | Disabled, not deleted                | 1 month                        |
| DNS TTL                 | Keep at 60s during transition        | 1 week                         |
| Old DATABASE_URL        | Must still be valid                  | Until source DB decommissioned |

---

## 11. Environment Variables — Complete Map

### ⚠️ CRITICAL — Values That MUST Be Byte-Identical

These secrets, if changed even by one character, will break the application:

| Secret                   | Why It Must Match                                  | Impact If Wrong                                        |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------ |
| `SECRET_KEY_BASE`        | Signs all sessions, cookies, tokens                | **All users logged out, "invalid session" errors**     |
| `JWT_SECRET`             | Signs all JWT access/refresh tokens                | **All active tokens invalidated, mass forced logout**  |
| `ENCRYPTION_KEY`         | Encrypts TOTP secrets, E2EE keys, sensitive fields | **Users locked out of 2FA, encrypted data unreadable** |
| `LIVE_VIEW_SIGNING_SALT` | LiveView session integrity                         | **LiveView sessions crash on multi-node**              |

### REQUIRED — App Raises and Refuses to Start Without These

| #   | Env Var                   | Value Source                           | Notes                                         |
| --- | ------------------------- | -------------------------------------- | --------------------------------------------- |
| 1   | `DATABASE_URL`            | **NEW** — Azure PG connection string   | Port 6432 for PgBouncer, port 5432 for direct |
| 2   | `SECRET_KEY_BASE`         | **COPY** from Fly.io                   | Must be identical!                            |
| 3   | `JWT_SECRET`              | **COPY** from Fly.io                   | Must be identical!                            |
| 4   | `LIVE_VIEW_SIGNING_SALT`  | **COPY** from Fly.io                   | Must be identical!                            |
| 5   | `ENCRYPTION_KEY`          | **COPY** from Fly.io                   | Must be identical!                            |
| 6   | `RESEND_API_KEY`          | **COPY** from Fly.io                   | Email delivery                                |
| 7   | `STRIPE_SECRET_KEY`       | **COPY** from Fly.io                   | Billing                                       |
| 8   | `STRIPE_WEBHOOK_SECRET`   | **NEW** — from Azure webhook endpoint  | New endpoint = new signing secret             |
| 9   | `STRIPE_PRICE_PREMIUM`    | Same: `price_1T6cmDRq0RB1cdZkheZoVktZ` |                                               |
| 10  | `STRIPE_PRICE_ENTERPRISE` | Same: `price_1T6cmMRq0RB1cdZkpVLHpXyp` |                                               |

### IMPORTANT — Features Degrade or Warn Without These

| #   | Env Var                         | Value Source                            | Impact If Missing                                            |
| --- | ------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| 11  | `REDIS_URL`                     | **NEW** — Azure Redis connection string | Rate limiting falls back to local Cachex (per-instance only) |
| 12  | `CORS_ORIGINS`                  | **COPY** from Fly.io                    | Cross-origin requests blocked                                |
| 13  | `R2_ACCESS_KEY_ID`              | **COPY** from Fly.io                    | File uploads fail                                            |
| 14  | `R2_SECRET_ACCESS_KEY`          | **COPY** from Fly.io                    | File uploads fail                                            |
| 15  | `R2_ACCOUNT_ID`                 | **COPY** from Fly.io                    | File uploads fail                                            |
| 16  | `GRAFANA_CLOUD_API_KEY`         | **COPY** from Fly.io                    | Metrics not shipped to Grafana                               |
| 17  | `GRAFANA_CLOUD_PROMETHEUS_URL`  | **COPY** from Fly.io                    | Metrics not shipped                                          |
| 18  | `GRAFANA_CLOUD_PROMETHEUS_USER` | **COPY** from Fly.io                    | Metrics not shipped                                          |

### OPTIONAL — Features Work Without, But Nice to Have

| #   | Env Var                       | Value Source                     | Notes                                           |
| --- | ----------------------------- | -------------------------------- | ----------------------------------------------- |
| 19  | `SENTRY_DSN`                  | **COPY** if set                  | Error tracking                                  |
| 20  | `GOOGLE_CLIENT_ID`            | **COPY** if set                  | Google OAuth login                              |
| 21  | `GOOGLE_CLIENT_SECRET`        | **COPY** if set                  | Google OAuth login                              |
| 22  | `APPLE_CLIENT_ID`             | **COPY** if set                  | Apple Sign In                                   |
| 23  | `APPLE_TEAM_ID`               | **COPY** if set                  | Apple Sign In                                   |
| 24  | `APPLE_KEY_ID`                | **COPY** if set                  | Apple Sign In                                   |
| 25  | `APPLE_PRIVATE_KEY`           | **COPY** if set                  | Apple Sign In (PEM key)                         |
| 26  | `FACEBOOK_CLIENT_ID`          | **COPY** if set                  | Facebook OAuth                                  |
| 27  | `FACEBOOK_CLIENT_SECRET`      | **COPY** if set                  | Facebook OAuth                                  |
| 28  | `TIKTOK_CLIENT_KEY`           | **COPY** if set                  | TikTok OAuth                                    |
| 29  | `TIKTOK_CLIENT_SECRET`        | **COPY** if set                  | TikTok OAuth                                    |
| 30  | `EXPO_ACCESS_TOKEN`           | **COPY** if set                  | Push notifications                              |
| 31  | `LIVEKIT_API_KEY`             | **COPY** if set                  | Group video calls                               |
| 32  | `LIVEKIT_API_SECRET`          | **COPY** if set                  | Group video calls                               |
| 33  | `LIVEKIT_URL`                 | **COPY** if set                  | SFU server URL                                  |
| 34  | `MEILISEARCH_URL`             | Skip                             | Not deployed in prod, falls back to PG          |
| 35  | `MEILISEARCH_API_KEY`         | Skip                             | Not deployed in prod                            |
| 36  | `OTEL_EXPORTER_OTLP_ENDPOINT` | default: `http://localhost:4318` | OpenTelemetry endpoint                          |
| 37  | `OTEL_SAMPLE_RATE`            | default: `0.1`                   | Trace sampling rate                             |
| 38  | `LOG_LEVEL`                   | default: `info`                  | Runtime log level                               |
| 39  | `READ_REPLICA_DATABASE_URL`   | Skip initially                   | Add later if needed                             |
| 40  | `WEBRTC_TURN_URL`             | **COPY** if set                  | P2P call fallback                               |
| 41  | `WEBRTC_STUN_SERVERS`         | default: Google STUN             | P2P calls                                       |
| 42  | `MAX_WS_CONNECTIONS`          | default: `10000`                 | WebSocket backpressure limit                    |
| 43  | `WS_CAPACITY_THRESHOLD`       | default: `0.9`                   | Capacity warning threshold                      |
| 44  | `SESSION_SIGNING_SALT`        | **COPY** if set                  | Override session salt (usually default is fine) |
| 45  | `JWT_ACCESS_TOKEN_TTL`        | default: `900` (15 min)          | JWT access token lifetime                       |
| 46  | `JWT_REFRESH_TOKEN_TTL`       | default: `604800` (7 days)       | JWT refresh token lifetime                      |
| 47  | `POOL_QUEUE_TARGET`           | default: `100`                   | Ecto pool queue target ms                       |
| 48  | `POOL_QUEUE_INTERVAL`         | default: `2000`                  | Ecto pool queue interval ms                     |
| 49  | `OTEL_SERVICE_NAME`           | default: `cgraph`                | OpenTelemetry service name                      |
| 50  | `GRAFANA_CLOUD_LOKI_URL`      | **COPY** if set                  | Log shipping to Grafana Cloud Loki              |
| 51  | `GRAFANA_CLOUD_LOKI_USER`     | **COPY** if set                  | Loki username                                   |
| 52  | `WEBRTC_MAX_PARTICIPANTS`     | default: `10`                    | Max participants per call                       |

### NON-SECRET ENV VARS — Set Directly (Not as Secret Refs)

| Env Var                  | Value                                             | Notes                                                   |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------- |
| `MIX_ENV`                | `prod`                                            |                                                         |
| `PHX_SERVER`             | `true`                                            |                                                         |
| `PORT`                   | `4000`                                            | Must match Container App target-port                    |
| `PHX_HOST`               | `api.cgraph.org`                                  | **Must stay the same — OAuth callbacks depend on this** |
| `DATABASE_SSL`           | `true`                                            | Azure PG enforces SSL                                   |
| `DATABASE_SSL_VERIFY`    | `none`                                            | Azure uses Microsoft CA; simpler to skip verify         |
| `POOL_SIZE`              | `30`                                              | Conservative; Azure B2s handles 120 connections         |
| `ERL_CRASH_DUMP_SECONDS` | `10`                                              |                                                         |
| `ELIXIR_ERL_OPTIONS`     | `+S 2:2 +SDcpu 2:2 +sbwt short +swt low +stbt ts` | Match current BEAM tuning                               |
| `APP_URL`                | `https://web.cgraph.org`                          | Used in Stripe success/cancel URLs                      |
| `FLY_REGION`             | `westeurope`                                      | Alloy label compat (see Section 7.3)                    |
| `FLY_APP_NAME`           | `cgraph-backend`                                  | Alloy label compat (see Section 7.3)                    |

### ENV VARS TO NOT SET on Azure (Let Default or Remove)

| Env Var             | Reason                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ECTO_IPV6`         | Azure uses IPv4 — omitting defaults to `[:inet]`                                                                            |
| `ERL_AFLAGS`        | Was `-proto_dist inet6_tcp` — not needed on Azure                                                                           |
| `FLY_ALLOC_ID`      | Let `HOSTNAME` fall through (Azure sets it per-replica). Setting a static value makes replicas indistinguishable in Grafana |
| `DNS_CLUSTER_QUERY` | Fly.io service discovery — Azure Container Apps uses its own                                                                |

### MUST SET (Easy to Overlook)

| Env Var                  | Why                                                   | Notes                                                                                                                                                                                      |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PGBOUNCER_DATABASE_URL` | Triggers `prepare: :unnamed` + Oban PG notifier       | Set to **same value as `DATABASE_URL`** (port 6432). Without this, prepared statements fail through Azure's built-in PgBouncer in transaction mode, and Oban LISTEN/NOTIFY breaks silently |
| `DATABASE_HOST`          | Used for SSL SNI when `DATABASE_SSL_VERIFY` != `none` | Set to `cgraph-db.postgres.database.azure.com`. Not needed now with `verify=none`, but critical if upgraded later                                                                          |

---

## 12. Terraform Changes

The Cloudflare Terraform config references the Fly.io backend hostname in two places.

### 12.1 `infrastructure/terraform/variables.tf`

```hcl
# Change the variable name and default
variable "backend_hostname" {
  description = "Backend API hostname (Azure Container Apps)"
  type        = string
  # OLD: default = "cgraph-backend.fly.dev"
  default     = "cgraph-backend.<UNIQUE_ID>.westeurope.azurecontainerapps.io"
}
```

### 12.2 `infrastructure/terraform/dns.tf` (line ~62)

```hcl
resource "cloudflare_record" "api" {
  zone_id = local.zone_id
  name    = "api"
  content = var.backend_hostname  # renamed from fly_backend_hostname
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "API backend on Azure Container Apps"  # updated comment
}
```

### 12.3 `infrastructure/terraform/zone_settings.tf` (line ~62)

```hcl
resource "cloudflare_healthcheck" "backend" {
  zone_id     = local.zone_id
  name        = "backend-health"
  description = "Azure Container Apps backend /health endpoint check"  # updated
  address     = var.backend_hostname  # renamed from fly_backend_hostname
  # ... rest stays the same
}
```

### 12.4 `infrastructure/terraform/production.tfvars.example`

```hcl
# OLD: fly_backend_hostname = "cgraph-backend.fly.dev"
backend_hostname = "cgraph-backend.<UNIQUE_ID>.westeurope.azurecontainerapps.io"
```

- [ ] Variable renamed: `fly_backend_hostname` → `backend_hostname`
- [ ] Default value updated to Azure hostname
- [ ] All references updated in `dns.tf` and `zone_settings.tf`
- [ ] `production.tfvars.example` updated
- [ ] `terraform plan` shows only the expected changes (2 resources)
- [ ] `terraform apply` successful

---

## 13. Cost Breakdown

### Monthly Estimate ($1,000 Azure Credits)

| Service                    | SKU                                      | Monthly Cost    | Notes                                           |
| -------------------------- | ---------------------------------------- | --------------- | ----------------------------------------------- |
| Container Apps × 1 replica | 2 vCPU, 4Gi, Consumption plan            | $60-80          | ~$0.000012/vCPU-s + $0.000002/GiB-s             |
| PostgreSQL Flexible        | Standard_B2s (2 vCPU, 4GB), 32GB storage | $35-45          | Burstable tier                                  |
| Redis Cache                | Basic C0, 250MB                          | $15             | Minimal, sufficient for rate limiting + caching |
| Container Registry         | Basic                                    | $5              | 10GB included                                   |
| Log Analytics              | First 5GB/mo free                        | $0-5            | Overage: $2.76/GB                               |
| Bandwidth                  | First 100GB free                         | $0-5            | Overage: $0.087/GB                              |
| **Total**                  |                                          | **$115-155/mo** |                                                 |

### Budget Runway

| Scenario                      | Monthly Cost | Months on $1,000 |
| ----------------------------- | ------------ | ---------------- |
| Minimal (1 replica, B1ms DB)  | $80          | ~12 months       |
| Normal (1-2 replicas, B2s DB) | $120         | ~8 months        |
| With staging env              | $180         | ~5.5 months      |

### Cost Optimization Tips

1. **Scale to 0 during off-hours**: Container Apps Consumption plan charges only when running
2. **Reserved instances**: After proving the stack, buy 1-year reserved for PG (~40% discount)
3. **Downgrade Redis to B0**: If cache hit rate is low
4. **Monitor storage growth**: Start at 32GB, auto-grow is more expensive than pre-provisioning

---

## 14. Risk Register

| #   | Risk                                                        | Impact   | Likelihood | Mitigation                                                                                                                                                                     |
| --- | ----------------------------------------------------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Database data loss during migration**                     | CRITICAL | Low        | Full `pg_dump` backup; verify row counts after restore                                                                                                                         |
| 2   | **SECRET_KEY_BASE / JWT_SECRET / ENCRYPTION_KEY mismatch**  | CRITICAL | Medium     | Extract exact values via `fly ssh console -C "printenv"` before migration; verify with test login after                                                                        |
| 3   | **LIVE_VIEW_SIGNING_SALT missing**                          | HIGH     | Medium     | **runtime.exs `raise`s on missing** — MUST extract from Fly.io; easy to overlook since not in `fly secrets list` if set via env                                                |
| 4   | **Redis TLS incompatibility**                               | HIGH     | Medium     | Azure Redis requires TLS; URL must use `rediss://` (double-s); also needs password in URL or `runtime.exs` raises                                                              |
| 5   | **Stripe webhook signature mismatch**                       | HIGH     | Medium     | Create NEW endpoint → get new `whsec_*` → update Azure secret; test with `stripe trigger`                                                                                      |
| 6   | **PgBouncer sidecar conflicts with Azure built-in**         | MEDIUM   | Medium     | Remove PgBouncer from Dockerfile; use Azure's built-in on port 6432                                                                                                            |
| 7   | **DNS propagation delay**                                   | MEDIUM   | Low        | Pre-lower TTL to 60s; Cloudflare proxied records propagate instantly to CF edge                                                                                                |
| 8   | **Alloy metrics labels break Grafana dashboards**           | LOW      | High       | Set `FLY_REGION`, `FLY_APP_NAME` env vars; let `FLY_ALLOC_ID` fall through to `HOSTNAME` (auto-set by Azure per replica)                                                       |
| 9   | **Oban + prepared statements fail through Azure PgBouncer** | CRITICAL | High       | Set `PGBOUNCER_DATABASE_URL` = same as `DATABASE_URL` (added to Step B6). Without this: Ecto prepared statements fail intermittently AND Oban job notifications break silently |
| 10  | **BEAM IPv6 socket errors**                                 | LOW      | Low        | Don't set `ECTO_IPV6` or `ERL_AFLAGS` on Azure; code defaults to IPv4                                                                                                          |
| 11  | **WebSocket upgrade fails through Azure ingress**           | MEDIUM   | Low        | Container Apps supports WebSocket natively; verify with `wscat` after DNS cutover (blocked before by `check_origin`)                                                           |
| 12  | **Container App cold start exceeds health timeout**         | MEDIUM   | Medium     | BEAM apps have slow startup; startup probe has `failureThreshold: 30 × 5s = 150s` margin                                                                                       |
| 13  | **Fly.io billing blocks rollback**                          | MEDIUM   | HIGH       | Fly.io has overdue invoices; pay them BEFORE migration to keep rollback option                                                                                                 |
| 14  | **OAuth callbacks fail**                                    | LOW      | Low        | Callbacks use `PHX_HOST` which stays `api.cgraph.org`; DNS handles routing                                                                                                     |
| 15  | **Web/mobile apps still connect to `fly.dev`**              | CRITICAL | High       | 30+ files have hardcoded `cgraph-backend.fly.dev`. **MUST** update sources + rebuild + redeploy (Step C5). `dist/` build artifacts contain baked-in URLs                       |
| 16  | **`check_origin` rejects WebSocket from Azure test domain** | LOW      | Medium     | `prod.exs` restricts origins to `*.cgraph.org`. WebSocket from `*.azurecontainerapps.io` will 403. Expected — works after DNS cutover                                          |
| 17  | **Oban queue concurrency exceeds connection pool**          | LOW      | Medium     | `prod.exs` sets aggressive Oban queues (notifications: 60, webhooks: 20). With `POOL_SIZE=30`, monitor for pool exhaustion. Increase to 50 if needed                           |

### Risk #9 Deep Dive: Oban + PgBouncer

The `runtime.exs` switches Oban to PG-based notifier when `PGBOUNCER_DATABASE_URL` is set. On Azure,
we use built-in PgBouncer via port 6432 in `DATABASE_URL` directly.

**If `PGBOUNCER_DATABASE_URL` is NOT set**, two things break:

1. **Oban uses LISTEN/NOTIFY** through transaction-mode PgBouncer → **silent job notification
   failures**
2. **Ecto uses prepared statements** through transaction-mode PgBouncer → **intermittent
   `prepared statement already exists` errors**

**Resolution: Set `PGBOUNCER_DATABASE_URL` to the same value as `DATABASE_URL`** (already added to
Step B6 secrets). This triggers:

- `prepare: :unnamed` (disables Ecto prepared statements — PgBouncer compatible)
- `Oban.Notifiers.PG` (uses distributed Erlang instead of LISTEN/NOTIFY)

This matches the current Fly.io behavior exactly.

```bash
# Already set in Step B6:
PGBOUNCER_DATABASE_URL = <same as DATABASE_URL with port 6432>
```

---

## 15. Command Cheat Sheet

```bash
# ─── Container Management ───
az containerapp show -g cgraph-production -n cgraph-backend -o table
az containerapp logs show -g cgraph-production -n cgraph-backend --tail 100
az containerapp logs show -g cgraph-production -n cgraph-backend --follow
az containerapp exec -g cgraph-production -n cgraph-backend --command "/bin/sh"
az containerapp revision list -g cgraph-production -n cgraph-backend -o table

# ─── Deploy New Version ───
az acr login --name cgraphregistry
docker build -t cgraphregistry.azurecr.io/cgraph-backend:TAG .
docker push cgraphregistry.azurecr.io/cgraph-backend:TAG
az containerapp update -g cgraph-production -n cgraph-backend \
  --image cgraphregistry.azurecr.io/cgraph-backend:TAG

# ─── Scaling ───
az containerapp update -g cgraph-production -n cgraph-backend \
  --min-replicas 1 --max-replicas 4

# ─── Secrets ───
az containerapp secret list -g cgraph-production -n cgraph-backend -o table
az containerapp secret set -g cgraph-production -n cgraph-backend \
  --secrets key=value

# ─── Database ───
az postgres flexible-server connect -n cgraph-db -u cgraph_admin -d cgraph_prod --interactive
az postgres flexible-server show -g cgraph-production -n cgraph-db -o table

# ─── Redis ───
az redis console -g cgraph-production -n cgraph-redis

# ─── Run Migrations ───
az containerapp exec -g cgraph-production -n cgraph-backend \
  --command "/app/bin/cgraph eval 'CGraph.Release.migrate()'"

# ─── Rollback (EMERGENCY) ───
fly scale count 2 -a cgraph-backend
# Then update DNS in Cloudflare dashboard: api CNAME → cgraph-backend.fly.dev
stripe webhook_endpoints update we_1T6dkARq0RB1cdZkmvdbsUMp --enabled

# ─── Cost Monitoring ───
az consumption usage list -g cgraph-production --output table
```

---

## Appendix A: Complete File Changes Needed

| File                                                                 | Change                                                             | Phase |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ | ----- |
| `apps/backend/Dockerfile`                                            | Remove PgBouncer, keep Alloy                                       | B1    |
| `apps/backend/fly.toml`                                              | Archive (not used on Azure)                                        | B1    |
| `apps/backend/alloy/config.alloy`                                    | Update labels (optional, use compat env vars)                      | B1    |
| `.github/workflows/deploy.yml`                                       | Replace Fly.io deploy with Azure deploy                            | C5    |
| `.github/workflows/deploy-backend.yml`                               | Replace Fly.io deploy with Azure deploy                            | C5    |
| `.github/workflows/deploy-staging.yml`                               | Update staging deploy for Azure (if migrating staging)             | Post  |
| `.github/workflows/deploy-observability.yml`                         | Remove Fly.io SSH/secrets commands                                 | Post  |
| `infrastructure/terraform/variables.tf`                              | Rename `fly_backend_hostname` → `backend_hostname`                 | C2    |
| `infrastructure/terraform/dns.tf`                                    | Update variable reference                                          | C2    |
| `infrastructure/terraform/zone_settings.tf`                          | Update variable reference + description                            | C2    |
| `infrastructure/terraform/production.tfvars.example`                 | Update example value                                               | C2    |
| `infrastructure/cloudflare/cdn_configuration.yaml`                   | Update origin from `fly.dev`                                       | C2    |
| **Web App (`apps/web/`)**                                            |                                                                    |       |
| `apps/web/.env.production`                                           | Change `VITE_API_URL` + `VITE_WS_URL` to `api.cgraph.org`          | C6    |
| `apps/web/index.html`                                                | Update CSP `connect-src` from `fly.dev` to `api.cgraph.org`        | C6    |
| `apps/web/src/lib/security/xss-csrf.ts`                              | Add `api.cgraph.org` to trusted redirect domains, remove `fly.dev` | C6    |
| `apps/web/src/modules/gamification/hooks/gamificationSocketStore.ts` | Change fallback WS URL from `fly.dev`                              | C6    |
| `apps/web/vite.config.ts`                                            | Update dev proxy fallback target                                   | C6    |
| `apps/web/vite.config.js`                                            | Update dev proxy fallback target                                   | C6    |
| `apps/web/.env.example`                                              | Update example URLs                                                | C6    |
| **Mobile App (`apps/mobile/`)**                                      |                                                                    |       |
| `apps/mobile/app.config.js`                                          | Change fallback API + WS URLs from `fly.dev` to `api.cgraph.org`   | C6    |
| `apps/mobile/src/screens/settings/rss-feeds-screen.tsx`              | Change hardcoded `BASE_URL` from `fly.dev`                         | C6    |
| **Landing Page (`apps/landing/`)**                                   |                                                                    |       |
| `apps/landing/index.html`                                            | Update `dns-prefetch` + `preconnect` from `fly.dev`                | C6    |
| `apps/landing/src/pages/resources/Status.tsx`                        | Update domain reference                                            | C6    |
| `apps/landing/src/pages/resources/Documentation.tsx`                 | Update API URL display                                             | C6    |
| `apps/landing/src/data/docs/categories.ts`                           | Update Base URL + WebSocket URL                                    | C6    |
| `apps/landing/src/data/docs/articles.ts`                             | Update WebSocket connection example                                | C6    |
| **Post-Migration Docs**                                              |                                                                    |       |
| `docs/CURRENT_STATE_DASHBOARD.md`                                    | Update infrastructure section                                      | Post  |
| `CONTRIBUTING.md`                                                    | Update deployment instructions                                     | Post  |

### ⚠️ CRITICAL: Rebuild + Redeploy Frontend After Changes

The web app's `dist/` contains **baked-in** `VITE_API_URL` and `VITE_WS_URL` values from build time.
After updating `.env.production` and `index.html`, you **MUST**:

1. **Rebuild the web app**: `pnpm run build --filter=@cgraph/web`
2. **Redeploy to Cloudflare Pages** (deploy workflow or manual push)

**The landing page `dist/` similarly needs rebuilding and redeploying to Vercel.**

Without this rebuild, the web/landing apps will still try to connect to `cgraph-backend.fly.dev`
even after DNS is pointed to Azure!

## Appendix B: Azure Resource Naming

| Resource                   | Name                   | Purpose                        |
| -------------------------- | ---------------------- | ------------------------------ |
| Resource Group             | `cgraph-production`    | All production resources       |
| PostgreSQL Flexible Server | `cgraph-db`            | Primary database               |
| Redis Cache                | `cgraph-redis`         | Caching, rate limiting, PubSub |
| Container Registry         | `cgraphregistry`       | Docker image storage           |
| Container Apps Environment | `cgraph-env`           | Container runtime              |
| Container App              | `cgraph-backend`       | Phoenix backend                |
| Log Analytics Workspace    | `cgraph-logs`          | Container Apps logging         |
| Service Principal          | `cgraph-github-deploy` | CI/CD credentials              |
