# CGraph Backend Route Audit

**Date:** 2026-02-27 **Phase:** 01 Infrastructure Baseline — Plan 02 **Backend version:** 1.0.0
(Elixir/Phoenix)

## Summary

| Metric        | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| Total routes  | 613                                                                 |
| GET routes    | 280                                                                 |
| POST routes   | 193                                                                 |
| PUT routes    | 55                                                                  |
| PATCH routes  | 24                                                                  |
| DELETE routes | 61                                                                  |
| Router module | `CGraphWeb.Router`                                                  |
| Route modules | 10 (modular macro-based)                                            |
| Pipelines     | 6 (api_relaxed, api, api_auth_strict, api_auth, api_admin, browser) |

## Routes by Domain

| Domain                                                            | Count | Scope                 |
| ----------------------------------------------------------------- | ----- | --------------------- |
| Auth (`/auth/`)                                                   | 33    | Phase 1 critical path |
| Admin (`/admin/`)                                                 | 66    | Deferred (not P1)     |
| Forum (`/forum`)                                                  | 96    | Deferred (not P1)     |
| Messaging (`/conversations`, `/messages`, `/channels`, `/groups`) | 105   | Deferred (not P1)     |
| User/settings/profiles                                            | ~80   | Partial P1            |
| Gamification/shop/quests                                          | ~60   | Deferred (not P1)     |
| Health/telemetry/webhooks                                         | ~8    | Phase 1 critical path |
| Other (tiers, themes, leaderboard, etc.)                          | ~165  | Deferred              |

## Endpoint Audit Results

### Health Endpoints (Critical Path)

| Method | Path       | Controller               | Expected | Actual  | Status |
| ------ | ---------- | ------------------------ | -------- | ------- | ------ |
| GET    | `/health`  | HealthController :index  | 200      | **200** | PASS   |
| GET    | `/ready`   | HealthController :ready  | 200      | **200** | PASS   |
| GET    | `/metrics` | MetricsController :index | 200      | **200** | PASS   |

### Auth Endpoints (Critical Path)

| Method | Path                           | Controller                       | Expected | Actual  | Status |
| ------ | ------------------------------ | -------------------------------- | -------- | ------- | ------ |
| POST   | `/api/v1/auth/register`        | AuthController :register         | 400/422  | **400** | PASS   |
| POST   | `/api/v1/auth/login`           | AuthController :login            | 400/401  | **400** | PASS   |
| POST   | `/api/v1/auth/refresh`         | AuthController :refresh          | 401      | **401** | PASS   |
| POST   | `/api/v1/auth/forgot-password` | AuthController :forgot_password  | 400/422  | **400** | PASS   |
| POST   | `/api/v1/auth/reset-password`  | AuthController :reset_password   | 400      | **400** | PASS   |
| POST   | `/api/v1/auth/verify-email`    | AuthController :verify_email     | 400      | **400** | PASS   |
| POST   | `/api/v1/auth/logout`          | AuthController :logout           | 401      | **401** | PASS   |
| GET    | `/api/v1/auth/oauth/providers` | OAuthController :list_providers  | 200      | **200** | PASS   |
| POST   | `/api/webhooks/stripe`         | StripeWebhookController :webhook | 400      | **400** | PASS   |

### Telemetry Endpoints

| Method | Path                        | Controller                         | Expected | Actual  | Status |
| ------ | --------------------------- | ---------------------------------- | -------- | ------- | ------ |
| POST   | `/api/v1/telemetry/errors`  | TelemetryController :create_error  | 204      | **204** | PASS   |
| POST   | `/api/v1/telemetry/metrics` | TelemetryController :create_metric | 204      | **204** | PASS   |

### Protected Endpoints (Auth Required — expect 401 without token)

| Method | Path                      | Controller                   | Expected | Actual  | Status |
| ------ | ------------------------- | ---------------------------- | -------- | ------- | ------ |
| GET    | `/api/v1/me`              | UserController :me           | 401      | **401** | PASS   |
| GET    | `/api/v1/settings`        | SettingsController :show     | 401      | **401** | PASS   |
| GET    | `/api/v1/users`           | UserController :index        | 401      | **401** | PASS   |
| GET    | `/api/v1/tiers/me`        | TierController :my_tier      | 401      | **401** | PASS   |
| GET    | `/api/v1/leaderboard`     | LeaderboardController :index | 401      | **401** | PASS   |
| GET    | `/api/v1/themes/default`  | ThemeController :default     | 401      | **401** | PASS   |
| GET    | `/api/v1/themes/presets`  | ThemeController :presets     | 401      | **401** | PASS   |
| GET    | `/api/v1/auth/2fa/status` | TwoFactorController :status  | 401      | **401** | PASS   |

## Compilation Status

- `mix compile` exits 0 (compiles successfully)
- `mix compile --warnings-as-errors` fails due to pre-existing `@doc` redefinition warnings in:
  - `lib/cgraph/cache/distributed.ex`
  - `lib/cgraph/messaging/search.ex`
  - `lib/cgraph/audit.ex`
  - `lib/cgraph/moderation/reports.ex`
  - `lib/cgraph/http.ex`
  - `lib/cgraph/performance/query_optimizer.ex`
  - `lib/cgraph_web/api/input_validation.ex`
  - `lib/cgraph_web/plugs/common.ex`
  - `lib/cgraph_web/controllers/api/v1/report_controller.ex`
  - `lib/cgraph/workers/orchestrator.ex`
- These are documentation warnings, not functional issues. Deferred to a later cleanup phase.

## 500 Error Report

**None.** All tested critical-path endpoints return proper status codes (200, 204, 400, 401). No 500
errors were observed on any health, auth, telemetry, or protected endpoint.

## Non-Critical Routes (Deferred)

The following route domains were **not** tested in this audit (out of scope for Phase 1):

- **Admin routes** (66 routes) — `/api/v1/admin/*`
- **Forum routes** (96 routes) — `/api/v1/forums/*`
- **Messaging routes** (105 routes) — `/api/v1/conversations/*`, `/api/v1/messages/*`,
  `/api/v1/channels/*`, `/api/v1/groups/*`
- **Gamification routes** (~60 routes) — `/api/v1/xp/*`, `/api/v1/quests/*`, `/api/v1/shop/*`
- **AI routes** — `/api/v1/ai/*`

These will be audited in their respective phases as they become active.

## Notes

- Backend runs on Bandit (HTTP2 server) at port 4000
- PostgreSQL 16 via Docker (`docker-compose.dev.yml`)
- Redis running separately (not via compose) — rate limiting falls back to ETS when Redis is
  unavailable
- 10 modular router files under `lib/cgraph_web/router/`
