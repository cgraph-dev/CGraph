# CGraph

## What This Is

CGraph is an end-to-end encrypted messaging and community platform — Discord meets Telegram meets
MyBB, with a custom triple-ratchet E2EE protocol, deep visual customization, gamification, and
full-featured forums. It targets privacy-conscious users who want both secure communication and rich
community features in a single app, across web and mobile with full parity.

## Core Value

**Secure real-time communication that works end-to-end** — if auth, messaging, E2EE, and real-time
channels don't function reliably across web and mobile, nothing else matters.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase at v0.9.47. -->

- ✓ Monorepo architecture with shared packages — established
- ✓ Phoenix backend with 27+ domain contexts — established
- ✓ JWT auth with Guardian (access/refresh tokens, 2FA, OAuth) — established
- ✓ Phoenix Channels real-time infrastructure — established
- ✓ E2EE protocol (PQXDH + Triple Ratchet + ML-KEM-768) — implemented, unaudited
- ✓ Web app (React 19 / Vite / Zustand / TanStack Query) — established
- ✓ Mobile app (React Native 0.81 / Expo 54 / WatermelonDB) — established
- ✓ Gamification system (XP, achievements, quests, battle pass, shop, marketplace) — established
- ✓ Forums system (boards, threads, posts, polls, categories, RSS) — established
- ✓ Groups/channels with roles, invites, bans, automod — established
- ✓ Voice/video call signaling (WebRTC infrastructure) — established
- ✓ Full-text search (MeiliSearch with PostgreSQL fallback) — established
- ✓ Observability stack (Prometheus, Grafana, Loki, Tempo, OpenTelemetry) — established
- ✓ Infrastructure-as-code (Fly.io, Terraform, Docker) — established
- ✓ CI/CD pipeline (GitHub Actions) — established
- ✓ Subscription/premium tier system — established
- ✓ All package versions synced to 0.9.47 baseline — Phase 1
- ✓ Backend routes audited (613 routes, zero 500s on critical path) — Phase 1
- ✓ WebSocket reconnection with circuit breaker + session resumption + jitter — Phase 1

### Active

<!-- Current scope. Building toward these for alpha launch. -->

**Foundation (v0.9.48)**

- [ ] Fix auth regression — restore login/registration flow across web and mobile
- [ ] Restore real-time messaging — Phoenix Channels connected, messages deliver reliably
- [ ] Professional design system — color gradient palette with industry-standard ratios, consistent
      typography, spacing, component library
- [ ] Mobile build passing — Expo builds for iOS and Android without errors

**Core Social (v0.9.5x)**

- [ ] End-to-end message flow — send/receive/read receipts working across web and mobile
- [ ] Friends system — add, accept, block, online status, all platforms
- [ ] Groups and channels — create, join, message, manage roles, web-mobile parity
- [ ] E2EE for 1:1 conversations — triple ratchet protocol fully operational
- [ ] Voice and video calls — WebRTC calls working between web and mobile users
- [ ] Push notifications — reliable delivery on mobile (Expo push + APNs/FCM)
- [ ] Web-mobile feature parity — everything on web works on mobile

**Community (v0.9.6x)**

- [ ] Full forums — MyBB-style with 50+ customization options per forum
- [ ] Gamification integration — quests, achievements, XP, titles, avatar borders all functional
- [ ] Premium/Stripe — payment processing, premium features, shop purchases
- [ ] Forum monetization — forum owners can monetize their communities
- [ ] Animated customizations — avatar borders, username effects, chat effects
- [ ] Forum gamification tie-in — XP from forum participation, forum-specific leaderboards

**Launch (v1.0.0)**

- [ ] App Store submission — iOS and Android approved and published
- [ ] 10K+ concurrent user support — load tested and validated
- [ ] Full polish pass — animations, transitions, error states, loading states
- [ ] Web-mobile parity audit — feature-by-feature verification
- [ ] Landing page update — reflects v1.0 features and messaging
- [ ] Stripe.com account setup and integration (web-first)

### Out of Scope

<!-- Explicit boundaries. Revisit after v1.0. -->

- External security audit engagement — budget not allocated yet ($25K–$120K), defer to post-alpha
- SIEM integration — unnecessary at alpha scale
- Sealed sender (metadata protection) — complex, post-v1.0
- Key backup/recovery UX — critical but blocked on audit decisions, post-v1.0
- Desktop native app — web covers desktop, mobile covers phones, no Electron
- Self-hosting support — single deployment target (Fly.io) for now
- Database sharding — PostgreSQL handles alpha scale, shard post-100K users
- AI features (smart replies, summarizer, moderation) — not differentiator for alpha
- Collaborative document editing — nice-to-have, not alpha priority
- Web3/wallet auth — niche, not needed for alpha audience

## Context

**Current State (v0.9.47):** ~85% of code exists across all services. The codebase has 27+ backend
domain contexts, 2,200+ web components, and a full mobile app skeleton. Most features have been
_built_ but many are disconnected or regressed.

**Known Broken:**

- Auth flow — worked previously (web-to-mobile messaging was functional), now regressed
- Real-time messaging — partially works, needs reconnection
- Mobile — not recently touched, likely stale dependencies
- Some backend routes return errors (unidentified which ones)

**Known Working:**

- Backend starts and serves requests
- Web app builds and loads
- Database schema is extensive and migrated
- Infrastructure config (Fly.io, Docker, Terraform) is in place
- CI pipeline runs (lint, typecheck, test)

**Test Coverage:** Web is critically low at ~17.9% (399 test files for ~2,230 components). Backend
and shared packages have better coverage. This is the biggest quality gap.

**Codebase Documentation:** 7 verified docs in `.gsd/codebase/` (147 fixes across 12 verification
rounds) — ARCHITECTURE, CONCERNS, CONVENTIONS, INTEGRATIONS, STACK, STRUCTURE, TESTING.

**Prior Art:** v1.0.0 tag exists from Dec 31, 2025 but development continued on 0.9.x. That tag is
effectively orphaned; the real v1.0 launch is the goal of this project.

## Constraints

- **Tech Stack**: Elixir/Phoenix backend, React 19 web, React Native/Expo mobile, pnpm/Turborepo
  monorepo — no framework migrations
- **Timeline**: 3+ months to v1.0, phased delivery (v0.9.48 → v0.9.5x → v0.9.6x → v1.0.0)
- **Budget**: Fly.io hosting (current) + $1,000 Azure credit available for scaling
- **Scale**: Must support 10,000+ concurrent users at launch (day one)
- **Security**: E2EE must work in alpha — it's the primary differentiator
- **Parity**: Web and mobile must have identical feature sets at v1.0
- **Versioning**: All packages sync to 0.9.47 baseline, increment together
- **Design**: Copilot-proposed professional design system following existing color gradient with
  industry-standard ratios — no external design tool dependency
- **Quality**: "No inflation — only real working code that makes this project work and be easy to
  scale from one to hundreds of millions of users"

## Key Decisions

| Decision                               | Rationale                                                 | Outcome   |
| -------------------------------------- | --------------------------------------------------------- | --------- |
| Phased v0.9.48→v1.0.0 versioning       | Manage risk, ship incrementally, validate each phase      | —         |
| Sync all packages to v0.9.47           | Eliminate version drift, single source of truth           | ✓ Phase 1 |
| Open alpha (anyone can sign up)        | Maximize early feedback, stress-test at scale             | —         |
| Stripe web-only initially              | Simplest integration path, mobile payments add complexity | —         |
| Copilot-proposed design system         | No designer dependency, derive from existing palette      | —         |
| Fly.io as sole hosting target          | Already configured, avoid multi-cloud complexity          | —         |
| Skip external security audit for alpha | Budget constraint, focus on functional correctness first  | —         |
| Forums before v1.0                     | Core differentiator — community features in messaging app | —         |
| E2EE required for alpha                | Primary competitive advantage, must prove it works early  | —         |
| No AI features in alpha                | Not differentiating, adds complexity without core value   | —         |
| Circuit breaker for WebSocket          | Prevent infinite reconnect loops; mobile battery savings  | ✓ Phase 1 |
| Session resumption on reconnect        | Delta sync vs full resync; zero-loss reconnection goal    | ✓ Phase 1 |

---

_Last updated: 2026-02-27 after Phase 1 (Infrastructure Baseline)_
