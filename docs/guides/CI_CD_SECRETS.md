# CI/CD Secrets & Environment Configuration

> **Version:** 0.9.37 | **Last Updated:** February 21, 2026
>
> Canonical reference for all GitHub Actions secrets and environments. Supersedes
> `docs/archive/SECRETS.md`.

---

## Design Principles

Our CI/CD secrets management follows industry standards from:

| Standard    | What We Adopted                                                                |
| ----------- | ------------------------------------------------------------------------------ |
| **Google**  | SRE deploy practices: preflight secret validation, canary rollout, permissions |
| **Discord** | Environment-scoped secrets, gated promotion gates, preview deploys             |
| **Signal**  | Least-privilege `permissions` blocks, minimal secret surface area              |

---

## GitHub Environments

Configure in **Settings → Environments**:

| Environment  | Purpose                   | Protection Rules                   |
| ------------ | ------------------------- | ---------------------------------- |
| `production` | Live deployment target    | Required reviewers, branch policy  |
| `staging`    | Pre-production validation | Auto-deploy from `develop/staging` |

---

## Repository Secrets

Configure in **Settings → Secrets and variables → Actions → Secrets**

### Deployment (Required)

| Secret          | Used In                                                                              | Description                          |
| --------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `FLY_API_TOKEN` | `deploy.yml`, `deploy-backend.yml`, `deploy-staging.yml`, `deploy-observability.yml` | Fly.io API token for backend deploys |

### Build (Required)

| Secret         | Used In      | Description                                                   |
| -------------- | ------------ | ------------------------------------------------------------- |
| `VITE_API_URL` | `deploy.yml` | Backend API URL (e.g., `https://api.cgraph.app`)              |
| `VITE_WS_URL`  | `deploy.yml` | WebSocket URL (e.g., `wss://api.cgraph.app/socket/websocket`) |

### Cloudflare (Required)

| Secret                  | Used In                            | Description                   |
| ----------------------- | ---------------------------------- | ----------------------------- |
| `CLOUDFLARE_API_TOKEN`  | `deploy.yml`, `deploy-staging.yml` | Cloudflare Pages deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | `deploy.yml`, `deploy-staging.yml` | Cloudflare account identifier |

### Mobile (Required)

| Secret       | Used In      | Description                          |
| ------------ | ------------ | ------------------------------------ |
| `EXPO_TOKEN` | `deploy.yml` | Expo/EAS build token for iOS/Android |

### Observability (Environment: production)

| Secret                           | Used In                    | Description                                    |
| -------------------------------- | -------------------------- | ---------------------------------------------- |
| `GRAFANA_CLOUD_REMOTE_WRITE_URL` | `deploy-observability.yml` | Grafana Cloud Prometheus remote write endpoint |
| `GRAFANA_CLOUD_USERNAME`         | `deploy-observability.yml` | Grafana Cloud stack username                   |
| `GRAFANA_CLOUD_API_KEY`          | `deploy-observability.yml` | Grafana Cloud API key                          |
| `SLACK_WEBHOOK_URL`              | `deploy-observability.yml` | Slack incoming webhook for deploy alerts       |
| `PAGERDUTY_SERVICE_KEY`          | `deploy-observability.yml` | PagerDuty integration key for alerts           |

### Smoke Checks (Optional)

| Secret               | Used In      | Description                                        |
| -------------------- | ------------ | -------------------------------------------------- |
| `BACKEND_HEALTH_URL` | `deploy.yml` | Post-deploy health check URL (skipped if unset)    |
| `WEB_SMOKE_URL`      | `deploy.yml` | Post-deploy web smoke check URL (skipped if unset) |

### Load Testing (Optional)

| Secret           | Used In         | Default                                     |
| ---------------- | --------------- | ------------------------------------------- |
| `STAGING_URL`    | `load-test.yml` | `https://staging.cgraph.org`                |
| `STAGING_WS_URL` | `load-test.yml` | `wss://staging.cgraph.org/socket/websocket` |

---

## Fly.io App Secrets

These are set directly on Fly.io apps via `fly secrets set`, NOT in GitHub:

```bash
# Production (cgraph-backend)
fly secrets set -a cgraph-backend \
  DATABASE_URL="postgres://..." \
  SECRET_KEY_BASE="..." \
  REDIS_URL="redis://..."

# Staging (cgraph-backend-staging)
fly secrets set -a cgraph-backend-staging \
  DATABASE_URL="postgres://..." \
  SECRET_KEY_BASE="..."
```

---

## Workflow Overview

| Workflow                   | Trigger                      | Environment | Secrets Used                            |
| -------------------------- | ---------------------------- | ----------- | --------------------------------------- |
| `ci.yml`                   | Push/PR to main/develop      | —           | `GITHUB_TOKEN` (auto)                   |
| `deploy.yml`               | CI pass on main / manual     | production  | FLY, VITE, Cloudflare, Expo, smoke URLs |
| `deploy-backend.yml`       | Manual (emergency)           | production  | `FLY_API_TOKEN`                         |
| `deploy-staging.yml`       | Push to develop/staging      | staging     | FLY, Cloudflare                         |
| `deploy-observability.yml` | Manual / push to infra paths | production  | FLY, Grafana Cloud, Slack, PagerDuty    |
| `load-test.yml`            | PR / weekly / manual         | —           | Staging URLs (optional)                 |
| `e2e.yml`                  | Push/PR                      | —           | —                                       |
| `coverage.yml`             | Push/PR                      | —           | `GITHUB_TOKEN` (auto)                   |
| `codeql.yml`               | Push/PR / scheduled          | —           | `GITHUB_TOKEN` (auto)                   |
| `semgrep.yml`              | Push/PR                      | —           | —                                       |
| `docs.yml`                 | Push/PR to docs              | —           | —                                       |
| `release.yml`              | Manual / tag                 | —           | `GITHUB_TOKEN` (auto)                   |
| `performance.yml`          | Push/PR                      | —           | —                                       |
| `backup.yml`               | Scheduled                    | —           | —                                       |
| `chaos-test.yml`           | Manual                       | —           | —                                       |
| `dependency-review.yml`    | PR                           | —           | —                                       |
| `docs-check.yml`           | PR                           | —           | —                                       |

---

## Security Notes

1. **Never pass `DATABASE_URL` or `SECRET_KEY_BASE` as GitHub Actions secrets** — set them directly
   on Fly.io
2. **All production workflows require environment approval** — no direct push-to-prod
3. **Secrets are validated at runtime** — workflows fail fast with clear error messages if required
   secrets are missing
4. **`permissions` blocks enforce least privilege** — workflows only request the GitHub token scopes
   they need
5. **Canary deploys are default** — backend deploys use Fly.io canary strategy (roll to 1 machine,
   health-check, promote)

---

## Setup Checklist

When setting up a new environment:

- [ ] Create `production` and `staging` environments in GitHub Settings
- [ ] Configure environment protection rules (required reviewers for production)
- [ ] Set all "Required" secrets listed above
- [ ] Set Fly.io app secrets via `fly secrets set`
- [ ] Verify with `fly secrets list -a <app-name>`
- [ ] Run `deploy-observability.yml` with action `verify` to confirm metrics endpoint
- [ ] Run `load-test.yml` with `smoke` to validate staging connectivity
