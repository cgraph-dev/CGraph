# CGraph Frontend Monorepo

## What This Is

CGraph is an end-to-end encrypted messaging and community platform — Discord meets Telegram meets
MyBB, with a custom triple-ratchet E2EE protocol, deep visual customization, gamification, and
full-featured forums. It targets privacy-conscious users who want both secure communication and rich
community features in a single app, across web and mobile with full parity.

The frontend is a pnpm/Turborepo monorepo at `/CGraph` with 3 apps and 6 shared packages, powered by
an Elixir/Phoenix backend.

## Core Value

**Secure real-time communication that works end-to-end** — if auth, messaging, E2EE, and real-time
channels don't function reliably across web and mobile, nothing else matters.

## Version

**Current: v1.0.0** across all apps and packages (synced).

| Package                       | Version |
| ----------------------------- | ------- |
| Root monorepo                 | 1.0.0   |
| `apps/web`                    | 1.0.0   |
| `apps/mobile`                 | 1.0.0   |
| `apps/landing`                | 1.0.0   |
| `apps/backend`                | 1.0.0   |
| `@cgraph/shared-types`        | 1.0.0   |
| `@cgraph/api-client`          | 1.0.0   |
| `@cgraph/socket`              | 1.0.0   |
| `@cgraph/crypto`              | 1.0.0   |
| `@cgraph/utils`               | 1.0.0   |
| `@cgraph/animation-constants` | 1.0.0   |

## Apps

### `apps/web` — React 19 + Vite + SWC + TypeScript strict

Primary web client. React SPA with real-time messaging, E2EE, forums, and full community features.

| Dependency                     | Version |
| ------------------------------ | ------- |
| React                          | 19.1.0  |
| React DOM                      | 19.1.0  |
| Vite                           | ^6.3.0  |
| TypeScript                     | ~5.8.0  |
| Zustand                        | ^5.0.0  |
| TanStack Query                 | ^5.75.0 |
| Tailwind CSS                   | ^3.4.17 |
| CVA (class-variance-authority) | ^0.7.1  |
| Radix UI                       | ^1.1.0  |
| Framer Motion                  | ^12.0.0 |
| GSAP                           | ^3.14.2 |
| React Router                   | ^7.13.0 |
| Recharts                       | ^3.7.0  |
| Yjs (CRDT)                     | ^13.6.0 |

### `apps/mobile` — React Native 0.81 + Expo SDK 54

Native mobile client with offline-first architecture, WatermelonDB sync, and biometric auth.

| Dependency        | Version  |
| ----------------- | -------- |
| React Native      | 0.81.5   |
| Expo              | ~54.0.31 |
| React Navigation  | ^7.1.0   |
| Reanimated        | ~4.1.1   |
| expo-secure-store | ~15.0.0  |

### `apps/landing` — React SPA + Vite + Framer Motion + GSAP

Marketing landing page. No Three.js — uses Framer Motion + GSAP for animations.

| Dependency    | Version |
| ------------- | ------- |
| React         | ^19.0.0 |
| Vite          | ^6.4.1  |
| Framer Motion | ^12.0.0 |
| GSAP          | ^3.14.2 |
| Tailwind CSS  | ^3.4.3  |
| React Router  | ^7.13.0 |
| DOMPurify     | ^3.3.1  |

## Shared Packages — ALWAYS Use These, Never Reimplement

| Package                       | Purpose                                                         |
| ----------------------------- | --------------------------------------------------------------- |
| `@cgraph/shared-types`        | All TypeScript interfaces for API + events + models (20 files)  |
| `@cgraph/api-client`          | HTTP client with circuit breaker, retry, timeout                |
| `@cgraph/socket`              | Phoenix Channel client with typed channels                      |
| `@cgraph/crypto`              | E2EE: X3DH, PQXDH, Double/Triple Ratchet, AES-256-GCM, file enc |
| `@cgraph/utils`               | Formatting, validation (Zod), permissions                       |
| `@cgraph/animation-constants` | Durations, easings, springs, stagger values, transitions        |

## Non-Negotiables

These rules are **absolute** — no exceptions, no shortcuts:

### API & Data

1. **ALWAYS read `/CGraph/docs/API_CONTRACTS.md` before any API call** — contracts are the source of
   truth
2. **ALWAYS use `@cgraph/api-client`** — never raw `fetch()` or `axios`
3. **ALWAYS use `@cgraph/shared-types`** — never redefine API types locally
4. **ALWAYS use `@cgraph/socket` for WebSocket** — never raw Phoenix client

### Security

5. **ALWAYS use `@cgraph/crypto` for E2EE** — never implement crypto inline
6. **NEVER store JWT in localStorage** — httpOnly cookies only
7. **ALL user HTML input through DOMPurify** — no raw `dangerouslySetInnerHTML`
8. **E2EE keys: IndexedDB (web) / expo-secure-store (mobile)** — never in memory long-term

### Architecture

9. **NEVER put business logic in components** — use hooks + Zustand stores
10. **NEVER import directly between feature modules** — use barrel exports (`index.ts`)
11. **Server state → TanStack Query only** — all API data fetching and caching
12. **Client/UI state → Zustand store slice per feature** — local UI state in stores, not components

## State Management Pattern

```
┌─────────────────────────────────────────────┐
│  Server State (TanStack Query)              │
│  • API responses, cache, refetch, mutations │
│  • useQuery / useMutation hooks             │
│  • Stale-while-revalidate                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Client State (Zustand v5)                  │
│  • One store slice per feature domain       │
│  • UI state, preferences, local-only data   │
│  • Persisted where needed (localStorage)    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Component Layer                            │
│  • Pure rendering + event forwarding        │
│  • No business logic                        │
│  • Hooks bridge stores ↔ UI                 │
└─────────────────────────────────────────────┘
```

## Requirements

### Validated

<!-- Shipped and confirmed working at v1.0.0. 19 phases, 142 requirements. -->

- ✓ Monorepo architecture with shared packages — established
- ✓ Phoenix backend with 27+ domain contexts — established
- ✓ JWT auth with Guardian (access/refresh tokens, 2FA, OAuth) — Phase 2-3
- ✓ Phoenix Channels real-time infrastructure — Phase 1
- ✓ E2EE protocol (PQXDH + Triple Ratchet + ML-KEM-768) — Phase 7
- ✓ Web app (React 19 / Vite / Zustand / TanStack Query) — established
- ✓ Mobile app (React Native 0.81 / Expo 54 / WatermelonDB) — established
- ✓ Gamification system (XP, achievements, quests, battle pass, shop) — Phase 16
- ✓ Forums system (boards, threads, posts, polls, categories, RSS) — Phase 14-15
- ✓ Groups/channels with roles, invites, bans, automod — Phase 11-12
- ✓ Voice/video calls (WebRTC + LiveKit SFU) — Phase 13
- ✓ Full-text search (MeiliSearch with PostgreSQL fallback) — Phase 18
- ✓ Observability stack (Prometheus, Grafana, Loki, Tempo) — established
- ✓ Infrastructure-as-code (Fly.io, Terraform, Docker) — established
- ✓ CI/CD pipeline (GitHub Actions) — established
- ✓ Subscription/premium tier (Stripe web, mobile IAP) — Phase 17
- ✓ Design token system with 7 themes, WCAG AA — Phase 4
- ✓ Cross-device sync (WatermelonDB bridge) — Phase 6
- ✓ Push notifications (Expo + APNs/FCM) — Phase 9
- ✓ Wallet auth (SIWE + WalletConnect) — Phase 19
- ✓ Landing page v1.0 — Phase 19
- ✓ App Store submission (EAS) — Phase 19

### Active

<!-- Post-v1.0 phases. Phases 20-38 shipped. -->

- ✓ Liquid Glass UI (10 plans) — Phase 20
- ✓ UI Interactions & Motion (10 plans) — Phase 21
- ✓ Cinematic UI Parity (8 plans) — Phase 25
- ✓ Canonical Reconciliation — Phase 33
- ✓ Parity + Mobile Nodes Economy — Phase 34
- ✓ Cosmetics + Unlock Engine — Phase 35
- ✓ Creator Economy (Paid DM, Boosts, Compliance) — Phase 36
- ✓ Forum Transformation (Identity, Tags, Moderation) — Phase 37
- ✓ Infrastructure Scaling (Sharding, Archival, Ops) — Phase 38

(Phase 39 remaining — run `/discovery` to define next milestone scope)

### Out of Scope

<!-- Explicit boundaries. Revisit after next milestone. -->

- External security audit engagement — budget not allocated ($25K–$120K), defer to post-scale
- SIEM integration — unnecessary at current scale
- Sealed sender (metadata protection) — complex, post-v1.0
- Key backup/recovery UX — blocked on audit decisions
- Desktop native app — web covers desktop, no Electron
- Self-hosting support — single deployment target (Fly.io) for now
- ~~Database sharding~~ — **Implemented in Phase 38** (ConsistentHash, ShardRouter, ShardManager, ShardMigration)

## Context

**Current State (v1.0.0+):** All 19 base phases shipped. 142 core requirements complete. Post-v1.0
phases 20-38 delivered an additional 94 commits covering Liquid Glass UI, cinematic parity,
cosmetics + unlock engine, nodes economy, creator economy, forum transformation, and infrastructure
scaling. The codebase has 58+ backend domain contexts, 2,200+ web components, a full mobile app,
and comprehensive infrastructure.

**Codebase Documentation:** 7 verified docs in `.gsd/codebase/` (updated March 4, 2026):

- `ARCHITECTURE.md` (641 lines) — System design and patterns
- `STRUCTURE.md` (1,330 lines) — Directory layout and organization
- `STACK.md` (352 lines) — Technologies and dependencies
- `CONVENTIONS.md` (783 lines) — Code style and patterns
- `TESTING.md` (1,131 lines) — Test structure and practices
- `INTEGRATIONS.md` (613 lines) — External services and APIs
- `CONCERNS.md` (516 lines) — Technical debt and issues

**Known Quality Gaps:**

- Web test coverage ~60% (up from ~18%, still below 80% target)
- ~427 `eslint-disable` comments across codebase
- ~427 `as any` type assertions
- 24 deprecated files pending removal
- 133 oversized mobile files (>300 lines)
- Load test results show 0 passing checks (no production baseline)

**Backend:** Elixir/Phoenix at `apps/backend/` — 35+ workers, 24 Oban queues, 24+ controllers, 17
plugs, 6 Phoenix channels, 115+ migrations. Managed separately (backend project).

**Prior v1.0.0 Roadmap:** 19 phases archived at `.gsd/archive/ROADMAP-v1.0.0.md`.

## Constraints

- **Monorepo**: pnpm workspaces + Turborepo — all apps and packages in one repo
- **TypeScript**: Strict mode everywhere — no `any` escape hatches
- **Build**: Vite + SWC for web/landing, Metro + Expo for mobile
- **Styling**: Tailwind + CVA + Radix UI (web), React Native StyleSheet + Reanimated (mobile)
- **State**: TanStack Query for server state, Zustand v5 for client state — no Redux, no MobX
- **Routing**: React Router v7 (web/landing), React Navigation v7 (mobile)
- **Animation**: Framer Motion 12 + GSAP (web), Reanimated v4 (mobile),
  `@cgraph/animation-constants` for shared values
- **Security**: httpOnly cookies for auth, DOMPurify for HTML, `@cgraph/crypto` for E2EE
- **Testing**: Vitest (web/landing/packages), Jest (mobile), Playwright (e2e)
- **CI**: GitHub Actions — lint, typecheck, test gates
- **Deploy**: Fly.io (backend), Vercel (web/landing), EAS (mobile)

## Key Decisions

| Decision                                      | Rationale                                                                          | Outcome |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| pnpm + Turborepo monorepo                     | Single repo for all apps + packages; shared types/utils; atomic commits            | ✓       |
| React 19 with SWC                             | Latest features (Suspense, transitions); SWC for fast builds                       | ✓       |
| Zustand v5 over Redux                         | Minimal boilerplate, built-in devtools, TypeScript-first                           | ✓       |
| TanStack Query for server state               | Automatic caching, deduplication, background refetch; replaces manual fetch logic  | ✓       |
| Tailwind + CVA + Radix                        | Utility-first CSS + variant props + accessible primitives                          | ✓       |
| Phoenix Channels via @cgraph/socket           | Typed channels with auto-reconnect; backend already Phoenix                        | ✓       |
| WatermelonDB for mobile offline               | Lazy-loaded SQLite; Zustand remains truth; fire-and-forget writes                  | ✓       |
| httpOnly cookies only                         | XSS cannot steal tokens; CSRF mitigated by SameSite                                | ✓       |
| E2EE keys in IndexedDB / expo-secure-store    | Hardware-backed on mobile; encrypted storage on web                                | ✓       |
| No Three.js on landing (Framer Motion + GSAP) | Lightweight animations without WebGL overhead; faster load times                   | ✓       |
| Barrel exports between features               | Enforces module boundaries; prevents circular imports                              | ✓       |
| One Zustand slice per feature domain          | Predictable state boundaries; features own their state                             | ✓       |
| Optimistic send + server replace              | Instant UI feedback; replace optimistic message with server version on API success | ✓       |
| Client-side privacy gating                    | Backend broadcasts all events; clients gate based on local privacy settings        | ✓       |
| WatermelonDB as persistence layer only        | Zustand remains source of truth; WatermelonDB handles offline cache                | ✓       |
| Cachex temp tokens for 2FA                    | Stateless JWT can't hold pending 2FA state; Cachex TTL auto-expires                | ✓       |
| Single canonical token source (tokens.ts)     | Eliminates competing color systems; CSS variables enable instant theme switching   | ✓       |

---

_Last updated: 2026-03-04 — New project initialized at v1.0.0_
