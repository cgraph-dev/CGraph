# CGraph Current State Dashboard

> **Version: 0.9.31** | Generated: February 17, 2026

Real-time overview of project health, architecture status, and operational state.

---

## Overall Health

| Dimension         | Status | Score | Notes                                                                               |
| ----------------- | ------ | ----- | ----------------------------------------------------------------------------------- |
| **Build**         | OK     | 10/10 | All apps building successfully                                                      |
| **TypeScript**    | OK     | 10/10 | 0 errors across all packages                                                        |
| **Lint**          | OK     | 10/10 | 0 errors, ESLint 9 flat config                                                      |
| **Architecture**  | OK     | 9/10  | Router split (7 domain modules), component categorization, remote caching           |
| **Tests**         | OK     | 8/10  | 1,633 backend tests passing; web coverage ~20%; landing 98 tests (63 unit + 35 E2E) |
| **Security**      | WARN   | 7/10  | E2EE implemented; recovery codes hashed; no external audit yet                      |
| **Documentation** | OK     | 8/10  | Architecture + API + testing docs up to date; CLAUDE.md comprehensive               |
| **Observability** | WARN   | 8/10  | Prometheus + SLO rules defined; Grafana dashboards not yet deployed live            |
| **Resilience**    | OK     | 10/10 | CB + DLQ + Backpressure + Snowflake + RequestCoalescing (singleflight)              |
| **CI/CD**         | OK     | 10/10 | 12 GH Actions, CI-gated canary, feature flags                                       |

**Composite Score: 9.1/10** — Strong production foundation with remaining gaps in external security
audit and web test coverage

> **Implementation Registry**: See `docs/OPERATIONAL_MATURITY_REGISTRY.md` for complete file-level
> inventory of all operational systems, their locations, and remaining gaps.

---

## 📊 Version Matrix

| Component          | Version | Latest Available | Status                                           |
| ------------------ | ------- | ---------------- | ------------------------------------------------ |
| React              | 19.1.0  | 19.1.0           | ✅                                               |
| TypeScript         | 5.8.x   | 5.8.x            | ✅                                               |
| ESLint             | 9.27.0  | 9.x              | ✅                                               |
| Node.js            | 20.x    | 22.x LTS         | ⚠️                                               |
| pnpm               | 10.26.2 | 10.x             | ✅                                               |
| Phoenix            | 1.8.x   | 1.8.x            | ✅                                               |
| Elixir             | 1.17.3  | 1.19.x           | ⚠️ Dockerfile pins 1.17.3; local dev uses 1.19.4 |
| Expo SDK           | 54      | 54               | ✅                                               |
| React Native       | 0.81    | 0.81             | ✅                                               |
| RN Reanimated      | 4.1.1   | 4.1.x            | ✅                                               |
| RN Gesture Handler | 2.28.x  | 2.28.x           | ✅                                               |
| Native Stack Nav   | 7.3.0   | 7.x              | ✅                                               |

---

## 🔒 Security Posture

### Vulnerability Status

| Category         | Critical | High | Medium | Low | Total |
| ---------------- | -------- | ---- | ------ | --- | ----- |
| npm dependencies | 0        | 0    | TBD    | TBD | TBD   |
| Elixir deps      | 0        | 0    | TBD    | TBD | TBD   |
| Container images | 0        | TBD  | TBD    | TBD | TBD   |

### Security Controls

| Control                       | Status | Notes                                             |
| ----------------------------- | ------ | ------------------------------------------------- |
| E2EE (PQXDH + Triple Ratchet) | ✅     | Post-quantum hybrid; no external audit yet        |
| TLS 1.3                       | ✅     | Enforced on all connections                       |
| CSP Headers                   | ✅     | Strict policy on landing + web app                |
| Rate Limiting                 | ✅     | Redis-backed, per-user and per-IP                 |
| Trusted Proxy                 | ✅     | Cloudflare CIDR enforcement                       |
| 2FA                           | ✅     | TOTP with hashed recovery codes (separate schema) |
| Secret Scanning               | ✅     | Gitleaks in CI                                    |
| Dependency Audit              | ✅     | pnpm audit + mix audit in CI                      |
| **External Pen Test**         | ❌     | **Not yet conducted — HIGH PRIORITY**             |
| **E2EE Formal Audit**         | ❌     | **Not yet conducted — HIGH PRIORITY**             |

### Recent Security Fixes

| Date       | Issue                         | Severity | Status   |
| ---------- | ----------------------------- | -------- | -------- |
| 2026-01-26 | E2EE plaintext fallback       | Critical | ✅ Fixed |
| 2026-01-27 | Presence privacy leak         | Critical | ✅ Fixed |
| 2026-01-27 | Stripe webhook config         | High     | ✅ Fixed |
| 2026-01-27 | IP spoofing (X-Forwarded-For) | High     | ✅ Fixed |
| 2026-01-27 | MIME type spoofing            | Medium   | ✅ Fixed |

---

## 📈 Feature Completion

```
Total Features:     69
Implemented:        62 (90%)
Remaining:           7 (10%)

████████████████████████░░ 90%
```

### By Category

| Category         | Progress | Bar                    |
| ---------------- | -------- | ---------------------- | ----------------------------------------- |
| Calendar/Events  | 100%     | ██████████████████████ |
| Referrals        | 100%     | ██████████████████████ |
| Moderation       | 100%     | ██████████████████████ | Marketplace moderation + admin API        |
| Private Messages | 83%      | ██████████████████░░░░ |
| Announcements    | 83%      | ██████████████████░░░░ |
| Core Forums      | 80%      | █████████████████░░░░░ |
| Search           | 75%      | █████████████████░░░░░ | PostgreSQL full-text; Meilisearch planned |
| Formatting       | 80%      | █████████████████░░░░░ |
| Reputation       | 75%      | ████████████████░░░░░░ |
| User System      | 67%      | ██████████████░░░░░░░░ |

---

## 🏗️ Architecture Status

| Component         | Tech Stack           | Status | Notes                                                |
| ----------------- | -------------------- | ------ | ---------------------------------------------------- |
| Backend API       | Phoenix 1.8 / Elixir | ✅     | Router split into 8 modules                          |
| Web App           | React 19 / Vite      | ✅     | Components organized (9/10)                          |
| Landing App       | React 19 / Vite      | ✅     | 98 tests, Lighthouse CI, visual regression           |
| Mobile App        | Expo 54 / RN 0.81    | ✅     | Feature parity with web                              |
| Real-time         | Phoenix Channels     | ✅     | WebSocket + PubSub sharding                          |
| Database          | PostgreSQL 16        | ✅     | 94 tables, optimized                                 |
| Webhooks          | Oban + Finch         | ✅     | HMAC-SHA256 signed, exponential backoff, 5 retries   |
| WebRTC            | GenServer + ETS      | ✅     | TURN/SFU config, call history DB persistence         |
| CDN               | Cloudflare           | ✅     | Global edge caching                                  |
| Hosting (API)     | Fly.io               | ✅     | Primary: Frankfurt (fra); Read replica: IAD          |
| Hosting (Web)     | Fly.io               | ⚠️     | Configured (fly.web.toml) but Dockerfile.web missing |
| Hosting (Landing) | Vercel               | ✅     | Edge deployment via Vercel                           |
| Build             | Turborepo            | ✅     | Remote caching enabled                               |
| Bundles           | size-limit           | ✅     | 8 budget entries, CI-gated                           |

### Module Architecture (v0.9.26)

```
apps/backend/lib/cgraph_web/       # Router architecture (v0.9.26)
├── router.ex                      # Main router (126 lines) imports domain macros
└── router/                        # Domain route modules
    ├── health_routes.ex           #   Health checks (38 lines)
    ├── auth_routes.ex             #   Auth + OAuth + 2FA (100 lines)
    ├── user_routes.ex             #   User CRUD + features (258 lines) [BEFORE public!]
    ├── public_routes.ex           #   Public API endpoints (68 lines)
    ├── messaging_routes.ex        #   DMs, conversations (87 lines)
    ├── forum_routes.ex            #   Forums, posts, comments (117 lines)
    ├── gamification_routes.ex     #   XP, achievements, quests (124 lines)
    └── admin_routes.ex            #   Admin panel routes (135 lines)

IMPORTANT: user_routes() evaluates BEFORE public_routes() in router.ex.
This prevents wildcard routes (/tiers/:tier, /emojis/:id) from shadowing
specific auth-required routes (/tiers/me, /emojis/favorites, /emojis/recent).

apps/web/src/components/           # Frontend component organization (v0.9.26)
├── ui/                            # Buttons, inputs, modals, selects
├── feedback/                      # ErrorBoundary, loading, toast, progress
├── media/                         # Voice players, recorders, file upload
├── content/                       # Markdown + BBCode renderers/editors
├── user/                          # Avatar, badges
├── navigation/                    # Tabs, switch, dropdown, animated logo
└── index.ts                       # Barrel re-exports all subdirectories

apps/backend/lib/cgraph/           # Backend sub-module architecture
├── groups.ex                      # Facade (423 lines) → delegates to:
│   ├── groups/channels.ex         #   Channel CRUD, soft delete (402)
│   ├── groups/members.ex          #   Member management (219)
│   ├── groups/roles.ex            #   Role/permission management (168)
│   ├── groups/invites.ex          #   Invite system (116)
│   └── groups/emojis.ex           #   Custom emoji (52)
├── notifications/notifications.ex # Facade (238 lines) → delegates to:
│   ├── notifications/queries.ex   #   Query/listing functions (208)
│   ├── notifications/delivery.ex  #   Delivery pipeline (68)
│   └── notifications/push_tokens.ex #  Token management (91)
├── audit.ex                       # Facade (484) → audit/query.ex (132)
├── uploads.ex                     # Facade (428) → uploads/image_optimizer.ex (180)
├── admin.ex                       # Facade (402) → admin/metrics.ex (168)
└── subscriptions/tier_limits.ex   # Facade (444) → tier_limits/checks.ex (187)

apps/web/src/
├── modules/           # 12 feature modules
│   ├── auth/          ├── chat/          ├── forums/
│   ├── groups/        ├── gamification/  ├── social/
│   ├── settings/      ├── calls/         ├── moderation/
│   ├── premium/       ├── search/        └── admin/
├── hooks/facades/     # 7  composition hooks
│   ├── useAuthFacade.ts          # authStore
│   ├── useChatFacade.ts          # chatStore + effects + bubble
│   ├── useGamificationFacade.ts  # gamification + prestige + events + referrals
│   ├── useSettingsFacade.ts      # settings + customization + theme
│   ├── useCommunityFacade.ts     # forums + groups + announcements
│   ├── useMarketplaceFacade.ts   # marketplace + avatar borders
│   └── useUIFacade.ts            # notifications + search + calendar
├── lib/socket/        # Modular socket management (split from monolith)
│   ├── SocketManager.ts          # Core orchestrator (616 lines)
│   ├── userChannel.ts            # User channel events
│   ├── presenceManager.ts        # Presence lobby + queries
│   ├── conversationChannel.ts    # DM conversation channels
│   ├── groupChannel.ts           # Group channel handlers
│   ├── channelHandlers.ts        # Forum + thread handlers
│   └── types.ts                  # Shared payload types
├── pages/                # 62 lazy-loaded pages (168 build chunks)
│   ├── calls/call-history/  # CallHistory (modular: types/hooks/animations)
│   ├── security/            # E2EEVerification, KeyVerification
│   └── settings/            # CustomEmoji, RSSFeeds + existing
└── shared/            # Shared primitives (187 files migrated)
    ├── components/ui/ # 90+ UI components
    ├── hooks/         # Shared hooks
    └── utils/         # Utility functions
```

### Mobile Platform Parity (v0.9.13)

```
apps/mobile/src/screens/
├── customize/              # 6 new customization screens
│   ├── CustomizeScreen.tsx          # Hub for all customization
│   ├── IdentityCustomization.tsx    # Avatar borders, badges, titles
│   ├── EffectsCustomization.tsx     # Particles, animations
│   ├── ProgressionCustomization.tsx # XP display, level frames
│   ├── BadgeSelectionScreen.tsx     # Choose displayed badges
│   └── TitleSelectionScreen.tsx     # Choose title
└── settings/
    └── EmailNotificationsScreen.tsx # Email preferences
```

---

## 🚨 Open Issues

### P0 — Critical (Blocking)

- None currently

### P1 — High Priority

| Issue                        | Owner     | ETA     |
| ---------------------------- | --------- | ------- |
| External E2EE security audit | @security | Q1 2026 |
| External penetration test    | @security | Q1 2026 |
| Run coverage report (80%+)   | @dev-team | Q1 2026 |
| Record load test baselines   | @dev-team | ✅ Done |
| Deploy Grafana dashboards    | @infra    | Q1 2026 |

### P2 — Medium Priority

| Issue                        | Owner     | ETA     |
| ---------------------------- | --------- | ------- |
| Email notifications          | @dev-team | Q1 2026 |
| Push notifications (browser) | @dev-team | Q1 2026 |
| Forum hierarchy (subforums)  | @dev-team | Q2 2026 |

---

## 📅 Release Timeline

| Version | Date       | Highlights                                                                                                                                                                                                                                                                                                                     |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.9.29  | 2026-02-17 | **Platform gap completion + review**: Webhooks DB (Ecto context + Oban worker), WebRTC call history persistence, admin dashboard API wiring (4 panels), gamification API-sourced counts. Review fixes: Oban `:webhooks` queue config, test_helper cleanup, `UsersManagement` sort/type bugs, dead `PLACEHOLDER_EVENTS` removal |
| 0.9.28+ | 2026-02-17 | **Landing quality push**: 16 test files (98 tests), web-vitals monitoring, error tracking, Lighthouse CI budgets, visual regression, Playwright E2E                                                                                                                                                                            |
| 0.9.26+ | 2026-02-16 | **Test suite fully green**: 635 pre-existing failures resolved, 17 root causes fixed, route architecture corrected, CookieAuth + RequireAuth plugs, tokens table migration                                                                                                                                                     |
| 0.9.26  | 2026-02-15 | **Architecture refactor**: Router split (8 modules), component org (6 dirs), remote caching, bundle monitoring, dead code removal                                                                                                                                                                                              |
| 0.9.24+ | 2026-02-15 | **Compliance pass**: 8 backend modules split (<500 lines), 5 React splits (<300 lines), 56 @spec annotations, soft delete audit                                                                                                                                                                                                |
| 0.9.24  | 2026-02-15 | **Backend tests green**: 1,633 tests, 0 failures — 13 source bugs fixed, 114 files changed                                                                                                                                                                                                                                     |
| 0.9.23  | 2026-02-14 | **Credo zero**: 64→0 issues, 56 alias fixes, 8 TODOs implemented                                                                                                                                                                                                                                                               |
| 0.9.22  | 2026-02-13 | **Refactoring**: 0 Credo warnings/refactoring, context structs, pattern matching                                                                                                                                                                                                                                               |
| 0.9.21  | 2026-02-13 | **Credo cleanup**: 1,277→83 issues, 14 routes wired, alias ordering, atom safety                                                                                                                                                                                                                                               |
| 0.9.20  | 2026-02-13 | **Compile cleanup**: 90→0 warnings, Elixir 1.19 bitwise fix, 30+ files cleaned                                                                                                                                                                                                                                                 |
| 0.9.19  | 2026-02-14 | **163 backend tests**, 70 context tests, 4 controllers wired, observability stack                                                                                                                                                                                                                                              |
| 0.9.18  | 2026-02-14 | **100% controller coverage**, MeiliSearch pipeline, chaos testing                                                                                                                                                                                                                                                              |
| 0.9.12  | 2026-02-03 | **Reanimated v4 migration** (222→0 TS errors)                                                                                                                                                                                                                                                                                  |
| 0.9.11  | 2026-02-02 | Architecture transformation, module system                                                                                                                                                                                                                                                                                     |
| 0.9.10  | 2026-02-01 | E2EE test suite, store facades, 893 tests                                                                                                                                                                                                                                                                                      |
| 0.9.9   | 2026-01-31 | Type safety improvements, production logging                                                                                                                                                                                                                                                                                   |
| 0.9.8   | 2026-01-30 | Code simplification, component extraction                                                                                                                                                                                                                                                                                      |
| 0.9.7   | 2026-01-27 | Enterprise landing page, dual-app arch                                                                                                                                                                                                                                                                                         |
| 1.0.0   | TBD        | First stable release (post-audit)                                                                                                                                                                                                                                                                                              |

---

## 📚 Quick Links

| Resource                 | Link                                                                       |
| ------------------------ | -------------------------------------------------------------------------- |
| Architecture             | [ARCHITECTURE_TRANSFORMATION_PLAN.md](ARCHITECTURE_TRANSFORMATION_PLAN.md) |
| Quality Gates            | [QUALITY_GATES.md](QUALITY_GATES.md)                                       |
| Engineering Standards    | [ENGINEERING_STANDARDS.md](PrivateFolder/ENGINEERING_STANDARDS.md)         |
| Security Policy          | [SECURITY.md](../SECURITY.md)                                              |
| Changelog                | [CHANGELOG.md](../CHANGELOG.md)                                            |
| AI Instructions          | [CLAUDE.md](../CLAUDE.md)                                                  |
| **SLO Targets**          | [SLO_DOCUMENT.md](SLO_DOCUMENT.md)                                         |
| **DB Sharding Plan**     | [DATABASE_SHARDING_ROADMAP.md](DATABASE_SHARDING_ROADMAP.md)               |
| **Operational Runbooks** | [OPERATIONAL_RUNBOOKS.md](OPERATIONAL_RUNBOOKS.md)                         |
| **Reanimated v4 ADR**    | [018-reanimated-v4-migration.md](adr/018-reanimated-v4-migration.md)       |

---

<sub>**CGraph Dashboard** • Version 0.9.29 • Updated: February 17, 2026</sub>
