# Research Synthesis — CGraph v0.9.48 → v1.0.0

> Generated: 2026-02-27 | Sources: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md Purpose: Feed
> roadmap creation agent with opinionated, evidence-based phase plan

---

## Executive Summary

CGraph is a brownfield encrypted messaging and community platform (~85% built) that combines
Signal-grade E2EE (with post-quantum PQXDH + Triple Ratchet), Discord-like group/channel features,
MyBB-depth forum customization (50+ options), and a full RPG-style gamification system — all
targeting 10K+ concurrent users at launch. The codebase has 27+ backend contexts, 2,200+ web
components, and a full mobile skeleton across an Elixir/Phoenix + React 19 + React Native/Expo
monorepo. The primary challenge is **not building features** but **reconnecting disconnected
systems, closing integration gaps, and hardening what exists**. Most of the platform's value is
already in code — but critical flows (auth, E2EE message pipeline, cross-context events, mobile
sync) are broken or incomplete.

The recommended approach is a **strict dependency-ordered build sequence**: fix auth and real-time
infrastructure first (everything depends on them), then wire the E2EE encryption pipeline (the
primary differentiator), then reconnect social/community features, then integrate payments, and
finally scale-test and polish. Each phase should add targeted tests for the systems being
reconnected — the 17.9% web test coverage makes every change a regression risk. The stack is modern
and nearly current; only minor version bumps are needed (Phoenix 1.8.4, React 19.2.x, Swoosh 1.22)
plus a few new dependencies (LiveKit for calls, Hammer for rate limiting, fun_with_flags for feature
rollout).

The three existential risks are: (1) shipping unaudited E2EE to privacy-conscious users
(reputational/legal liability), (2) Apple IAP rejection blocking mobile launch (Stripe-only won't
pass App Store review for digital goods), and (3) regression cascades from low test coverage during
reconnection work. All three have clear mitigations, but each requires proactive scheduling — they
cannot be deferred.

---

## Key Findings

### Recommended Stack (Additions/Changes to Existing)

**New Dependencies Required:**

| Addition                                    | Purpose                                            | Priority | Effort   | Phase   |
| ------------------------------------------- | -------------------------------------------------- | -------- | -------- | ------- |
| LiveKit SFU (Docker + clients + server SDK) | Group voice/video calls with E2EE support          | P0       | 3–5 days | Phase 3 |
| `@stripe/stripe-react-native` ^0.59.1       | Mobile payment UI (PaymentSheet, Apple/Google Pay) | P1       | 1–2 days | Phase 5 |
| `hammer` ~> 7.0 + redis backend             | Distributed rate limiting for API security         | P1       | 1 day    | Phase 1 |
| `fun_with_flags` ~> 1.12                    | Feature flags for gradual rollout                  | P2       | 0.5 day  | Phase 1 |

**Version Bumps (Low Risk):**

| Package               | From     | To       | Risk            |
| --------------------- | -------- | -------- | --------------- |
| `phoenix`             | ~> 1.8.3 | ~> 1.8.4 | Minimal — patch |
| `swoosh`              | ~> 1.20  | ~> 1.22  | Low — minor     |
| `react` / `react-dom` | 19.1.0   | 19.2.x   | Low — patch     |

**Explicit Do-NOT-Upgrade List:**

- React Native 0.81 → 0.83+ / Expo 54 → 55 (schedule for v1.1 — breaking native modules risk)
- Tailwind v3 → v4 (CSS-first rewrite, non-trivial migration)
- No GraphQL (Absinthe), no Elasticsearch, no Redis PubSub for Phoenix, no Pigeon push library

### Expected Features

**Table Stakes (must have for alpha — users expect these):**

| Category                            | Status    | Gap                                                                             |
| ----------------------------------- | --------- | ------------------------------------------------------------------------------- |
| Auth (email, OAuth, 2FA, biometric) | ✅ Built  | Onboarding flow + profile wizard missing                                        |
| 1:1 + group messaging               | ✅ Built  | Message editing/deletion UI unverified, typing indicators not wired to frontend |
| E2EE for 1:1 conversations          | ✅ Built  | Key verification UI missing, pipeline integration incomplete                    |
| Reactions, pinning, saving          | ✅ Built  | —                                                                               |
| Push notifications (all platforms)  | ✅ Built  | Notification preferences granularity gaps                                       |
| Message search                      | ✅ Built  | Filter UI needs verification                                                    |
| Friends system                      | ✅ Built  | —                                                                               |
| Online presence                     | ✅ Built  | —                                                                               |
| Link previews                       | ❌ No     | OG metadata fetching + rendering needed                                         |
| Block user (full behavior)          | ⚠️ Verify | Must block messaging, presence, search                                          |
| Community/group discovery           | ❌ No     | Explore page needed or organic growth dies                                      |
| Reply/quote messages                | ⚠️ Verify | UI needs verification on both platforms                                         |

**Differentiators (what makes CGraph unique):**

| Feature                                                  | Why It Matters                                  | Status                              |
| -------------------------------------------------------- | ----------------------------------------------- | ----------------------------------- |
| Post-quantum E2EE (PQXDH + Triple Ratchet)               | Industry-leading — ahead of Signal              | ✅ Implemented, unaudited           |
| 50+ forum customization options                          | MyBB killer — themes, CSS, plugins, emoji packs | ✅ Mostly built, enumeration needed |
| Deep gamification (XP, quests, battle pass, marketplace) | No competitor comes close                       | ✅ Built, needs economy rules       |
| Forum owner monetization                                 | Growth flywheel — incentivizes forum creation   | ⚠️ Revenue model undefined          |
| Disappearing messages                                    | Signal parity for privacy positioning           | ❌ Not built                        |
| Custom emoji per group                                   | Community identity (Discord parity)             | ✅ Built                            |
| Scheduled messages                                       | Async communication advantage                   | ✅ Built                            |

### Architecture Approach

**Five Key Disconnection Points (the 15% gap):**

1. **Auth → E2EE bootstrap** — After login, clients must fetch prekeys and init ratchet sessions.
   Pipeline not connected end-to-end.
2. **Message send → E2EE encrypt → Channel** — ConversationChannel accepts plaintext.
   `@cgraph/crypto` encrypt must intercept before channel push.
3. **Forum → Gamification event bus** — Separate contexts with no cross-context event dispatch for
   XP awards.
4. **Mobile offline → Sync** — WatermelonDB exists but sync protocol with `sync_routes.ex` needs
   full integration.
5. **Stripe webhook → real-time UI** — Webhook updates DB but doesn't notify user's WebSocket for
   instant UI update.

**Build Sequence (dependency-ordered):**

```
Wave 1: Auth + Socket (foundation — everything depends on this)
  └─► Wave 2: E2EE Pipeline (primary product value)
       ├─► Wave 3: Social Features (groups, forums, gamification integration)
       │    └─► Wave 4: Premium + Payments (Stripe, mobile IAP)
       └─► Wave 3b: Mobile parity (parallel to social features)
            └─► Wave 5: Scale + Polish (10K load test, animations)
                 └─► Wave 6: Launch (App Store, landing, final QA)
```

**Scaling Architecture:**

- Phoenix + PgBouncer + Redis + DNSCluster handles 10K concurrent with minimal changes
- 2–3 Fly.io machines in primary region + 1 per additional region
- PgBouncer pool_size bump (25 → 40), WebSocket compression, lazy channel joins
- 3-tier cache (ETS → Cachex → Redis) already in place
- Message table partitioning migration already planned

### Critical Pitfalls (Top 5 with Prevention)

| #   | Pitfall                                                                                                | Severity | Prevention                                                                                                                  | Phase   |
| --- | ------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | **Auth token refresh race conditions** — concurrent requests trigger double-refresh, logout            | Critical | Token refresh mutex in `@cgraph/api-client`; 5–10s grace period on backend for old refresh tokens                           | Phase 1 |
| 2   | **Regression cascades from 17.9% test coverage** — every fix risks breaking adjacent code              | Critical | Write critical-path tests BEFORE reconnection work: auth pipeline, message delivery, E2EE handshake, API contracts          | Phase 1 |
| 3   | **Unaudited E2EE shipping to users** — silent security failures without functional breakage            | Critical | Beta disclaimer on E2EE; schedule $30–80K external audit post-stabilization; test against official NIST/Signal test vectors | Phase 2 |
| 4   | **Apple IAP rejection blocks mobile launch** — Stripe-only for digital goods violates App Store §3.1.1 | Critical | Implement Apple IAP + Google Play Billing for mobile; Stripe for web-only; unified entitlements backend                     | Phase 5 |
| 5   | **Cross-package version drift (16-version gap)** — shared-type changes cause runtime crashes           | High     | Lock ALL packages to 0.9.47 in single PR; add CI version-check script; strict semver on shared packages                     | Phase 1 |

---

## Implications for Roadmap

### Phase 1: Foundation (v0.9.48)

**Goal:** Make the app functional — auth works, real-time works, builds pass, versions aligned.

**Rationale:** Every feature depends on authentication and real-time WebSocket infrastructure. The
16-version drift between packages means shared types are unreliable. Without fixing this layer, no
reconnection work is safe. The 17.9% test coverage means we must add critical-path tests alongside
fixes, not after.

**Delivers:**

- Working auth flow across web and mobile (login, register, token refresh, logout)
- Stable Phoenix Channel connections with reconnection, backoff, and jitter
- Presence working (online/offline status for friends list)
- All packages synced to v0.9.47 baseline
- Backend route audit (identify and fix erroring routes)
- Mobile build passing (Expo builds without errors)
- Professional design system (color palette, typography, component library)
- Rate limiting (Hammer) and feature flags (fun_with_flags) installed
- Critical-path test suites for auth, socket lifecycle, API contracts

**Pitfalls Addressed:**

- Auth token refresh races (P0, #1.1)
- Stale WebSocket auth after credential changes (P1, #1.2)
- Cross-package version drift (P1, #1.4)
- Low coverage regression risk (P0, #7.1)
- Integration test absence (P0, #7.3)
- Channel authorization bypass on re-join (P1, #4.4)
- Feature flag debt from half-implemented features (P1, #1.5)

**Features Covered:**

- Authentication (table stakes — all auth types)
- Session management
- Online/offline presence
- Block user verification
- Notification preferences baseline

---

### Phase 2: Core Messaging + E2EE (v0.9.49)

**Goal:** End-to-end encrypted messaging works reliably — the primary product value.

**Rationale:** E2EE is CGraph's #1 differentiator. The crypto library exists and is comprehensive
(PQXDH + Triple Ratchet), but the integration layer — intercepting message send/receive to
encrypt/decrypt transparently — is the highest-complexity task. This phase wires the crypto pipeline
to the chat module and ensures messages flow reliably across web and mobile.

**Delivers:**

- E2EE key bootstrap on registration (identity keypair, signed prekey, one-time prekeys, Kyber
  prekeys)
- PQXDH session establishment on first message to new contact
- Transparent encrypt-before-send / decrypt-on-receive in ConversationChannel
- Key rotation (7-day signed prekey, OTK replenishment at watermark)
- Key verification UI (safety number comparison screen)
- Message editing and deletion (verify backend + build/polish UI)
- Typing indicators wired to frontend
- Read/delivery receipts working cross-platform
- Reply/quote messages verified on both platforms
- Mobile E2EE via `@cgraph/crypto` with platform crypto adapter
- Mobile auth mirror with biometric support
- Beta disclaimer on E2EE features

**Pitfalls Addressed:**

- Pre-key exhaustion under load (P2, #2.1)
- Forward secrecy gaps in long-lived sessions (P3, #2.4)
- Platform-specific crypto API differences (P1, #3.1)
- Device sync and multi-device key conflicts (P2, #2.3)
- Navigation model mismatch between web/mobile (P3, #3.2)
- Push notification platform divergence (P3, #3.3)

**Features Covered:**

- E2EE for 1:1 (table stakes for E2EE app)
- Message editing/deletion (table stakes)
- Typing indicators (table stakes)
- Read/delivery receipts (table stakes)
- Reply/quote messages (table stakes)
- Key verification UI (table stakes for E2EE app)
- Offline message sync (table stakes for mobile)
- Disappearing messages (differentiator — Signal parity)

---

### Phase 3: Social (v0.9.50)

**Goal:** Groups, channels, forums, voice/video calls, and friend features all work across
platforms.

**Rationale:** With messaging solid, the social layer makes CGraph a community platform, not just a
chat app. Groups and forums are where CGraph's differentiators (customization, gamification) live.
Voice/video calls require LiveKit SFU integration. The cross-context event bus (Oban-based) connects
forums to gamification for the first time.

**Delivers:**

- Groups fully operational: create, join, channels, categories, roles, permissions, invites, bans
- Forum engine connected: boards, threads, posts, comments, polls, voting, search, subscriptions
- Cross-context event bus (Oban jobs) — forum/messaging actions → XP awards → achievement checks
- 1:1 voice/video calls via existing WebRTC + CallChannel (P2P)
- Group voice/video calls via LiveKit SFU (3+ participants)
- E2EE for calls (SFrame/Insertable Streams via LiveKit's built-in E2EE)
- Friends system: add, accept, block, online status across platforms
- Community/group discovery page (explore public groups and forums)
- Link previews (OG metadata fetch + render)
- Onboarding flow (3–5 step wizard: avatar → find friends → join community → send first message)
- Profile setup wizard on first login
- Custom status / invisible mode
- Per-channel notification settings

**Pitfalls Addressed:**

- Group key rotation performance cliff (P2, #2.2)
- Memory per connection at scale (P3, #4.1)
- Reconnection thundering herd (P2, #4.2)
- Heartbeat timeout tuning for mobile (P3, #4.3)
- Presence tracking memory explosion (P3, #4.5)
- Permission complexity explosion (P3, #6.3)
- Notification spam from forum activity (P3, #6.4)
- State sync between platforms (P2, #3.4)

**Features Covered:**

- Groups + channels (table stakes)
- Forums (table stakes + differentiator customization)
- Voice/video calls (table stakes)
- Friends system (table stakes)
- Community discovery (table stakes gap)
- Link previews (table stakes)
- Onboarding flow (table stakes gap)
- Custom emoji per group (differentiator)
- Threads in channels (Discord parity)
- Auto-moderation (table stakes)

---

### Phase 4: Community (v0.9.51)

**Goal:** Deep forum customization, gamification integration, and the features that make CGraph
sticky.

**Rationale:** Phase 3 delivers working forums and gamification contexts, but Phase 4 makes them
exceptional. The "50+ customization options" claim must be real and enumerable. Gamification needs
economy rules (caps, diminishing returns) before any user earns a point. The forum plugin system
should work for at least built-in plugins.

**Delivers:**

- Forum customization: themes, custom CSS, plugins, post icons, emoji packs, layouts, colors, fonts,
  widget positions, sidebar config, header styles, post templates, custom fields (50+ enumerated)
- Forum-specific gamification: XP from forum participation, forum leaderboards
- Full gamification UI: XP bar, achievements panel, quest tracker, leaderboard
- Gamification economy rules: daily caps, diminishing returns, quality multipliers, anti-abuse
  detection
- Battle pass (seasonal engagement system)
- Virtual currency system: earning + spending in shop
- Shop: avatar borders, chat effects, profile themes
- Marketplace: user-to-user trading (with escrow, cooldowns)
- Animated customizations: animated avatar borders, username effects, chat effects
- Forum moderation tools polished
- Notification batching and throttling for high-activity forums
- RSS feeds for forums

**Pitfalls Addressed:**

- XP inflation and economy imbalance (P3, #6.2)
- N+1 queries on leaderboards (P2, #6.1)
- Gamification leaderboard shame (anti-feature)
- Chat effects accessibility (respect prefers-reduced-motion)
- Battle pass FOMO (ensure free tier is meaningful)
- Forum custom CSS XSS (server-side sanitization)
- Marketplace scam potential (escrow, trade confirmations)

**Features Covered:**

- Forum 50+ customizations (differentiator)
- Gamification full stack: XP, achievements, quests, battle pass, currency, shop, marketplace
  (differentiator)
- Animated customizations (differentiator)
- Forum leaderboards (differentiator)
- BBCode editor (differentiator)
- Seasonal events framework (differentiator)
- Forum plugins (differentiator)
- Reputation system (differentiator)
- Referral system (differentiator)

---

### Phase 5: Monetization (v0.9.52)

**Goal:** Revenue generation works — Premium subscriptions, forum owner revenue, mobile payments.

**Rationale:** Payments touch every platform differently. Web uses Stripe Checkout (already built).
Mobile MUST use Apple IAP + Google Play Billing for digital goods (App Store §3.1.1 — hard rejection
otherwise). The subscription state machine must handle all Stripe webhook events correctly with
idempotency. Forum owner revenue model must be defined and implemented.

**Delivers:**

- Stripe checkout flow polished (web)
- Stripe React Native SDK integrated for mobile
- Apple IAP + Google Play Billing for mobile premium purchases
- Unified entitlements system: purchases from any source → single tier
- Subscription state machine: active, past_due (grace period), canceled, incomplete, trialing
- All Stripe webhook events handled idempotently (Oban-queued with event ID dedup)
- Real-time UI update on subscription changes (webhook → UserChannel broadcast)
- Billing portal (manage subscription, view invoices, change plan)
- Forum owner revenue share model defined and implemented
- Price versioning (never change a Stripe Price — create new ones)
- Premium feature gating verified across all contexts

**Pitfalls Addressed:**

- Apple/Google IAP requirements (P1, #5.3 — HARD BLOCKER for mobile)
- Webhook reliability and idempotency (P2, #5.1)
- Subscription state machine complexity (P2, #5.2)
- Price change and plan migration (P3, #5.4)
- Stripe webhook → real-time UI gap (architecture disconnection #5)

**Features Covered:**

- Premium subscription tiers (table stakes for business)
- In-app purchases on mobile (table stakes for App Store)
- Virtual currency purchase (differentiator)
- Cosmetic shop (differentiator)
- Forum owner revenue share (differentiator — key vision)
- API access tiers (differentiator)
- Webhooks for integrations (differentiator)

---

### Phase 6: Scale & Polish (v0.9.53)

**Goal:** Platform handles 10K+ concurrent users, animations are smooth, web-mobile parity is
verified.

**Rationale:** All features exist by this point. This phase is about hardening: load testing reveals
bottlenecks before real users hit them, animation polish makes the app feel premium, and a parity
audit ensures mobile isn't a second-class experience. The crypto audit should complete during this
phase.

**Delivers:**

- 10K concurrent user load test (k6 or Artillery against Fly.io staging)
- PgBouncer pool tuning verified under load
- WebSocket compression enabled and validated
- Lazy channel joins (don't auto-join all channels on connect)
- Socket assign minimization (< 20 KB per connected user)
- Presence tier implementation (detailed for open conversation, coarse for friends list)
- Message batching (50–100ms) for high-throughput channels
- Read receipt aggregation for group chats (5s intervals)
- Full animation pass: page transitions, message animations, loading states, error states
- Web-mobile feature parity audit (feature-by-feature checklist)
- Mobile-specific polish: gesture navigation, haptic feedback, adaptive heartbeat
- External crypto audit scheduled and initiated ($30–80K budget)
- Protocol version negotiation for post-audit fixes
- Performance profiling and optimization (Ecto query audit, N+1 elimination)

**Pitfalls Addressed:**

- Unaudited cryptographic implementation (P0, #2.5 — audit initiated)
- Reconnection thundering herd (P2, #4.2 — validated under load)
- Memory per connection at scale (P3, #4.1 — validated under load)
- Heartbeat timeout tuning (P3, #4.3 — tuned based on mobile test data)
- Presence tracking memory explosion (P3, #4.5 — tiered presence deployed)
- Expo managed workflow limitations (P2, #3.5 — validated with EAS Build)

**Features Covered:**

- 10K+ concurrent user support (launch requirement)
- Full polish pass (launch requirement)
- Web-mobile parity audit (launch requirement)

---

### Phase 7: Launch (v1.0.0)

**Goal:** Ship to production — App Store approved, landing page live, final QA complete.

**Rationale:** This is the release phase. No new features. Focus is on App Store submission (which
requires Apple IAP working), landing page reflecting v1.0 features, final QA pass, and monitoring
setup for the influx of users.

**Delivers:**

- iOS App Store submission and approval
- Google Play Store submission and approval
- Landing page updated with v1.0 features, screenshots, messaging
- Final QA pass (automated + manual, all critical paths)
- Monitoring/alerting configured for launch traffic (Prometheus alerts, Grafana dashboards)
- Error tracking (Sentry) configured for all platforms
- Rollout plan: feature flags for gradual rollout of risky features
- Public launch announcement
- Bug fix rapid-response process established
- Post-launch monitoring period (2 weeks)

**Pitfalls Addressed:**

- All remaining launch-blocking issues from prior phases
- App Store review process (2–5 day turnaround, may require revisions)

**Features Covered:**

- App Store submission (launch requirement)
- Landing page update (launch requirement)
- Final QA (launch requirement)

---

## Research Flags — Phases Needing Deeper Research During Planning

| Phase                      | Research Needed                                                                                         | Why                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Phase 2 (E2EE)**         | Signal protocol test vectors — verify CGraph's PQXDH implementation against official vectors            | Custom crypto is the highest-risk code in the project                            |
| **Phase 2 (E2EE)**         | Multi-device E2EE UX — how does "add a new device" work? Cross-signing? QR code linking?                | Research didn't find a complete multi-device flow in the codebase                |
| **Phase 3 (Calls)**        | LiveKit deployment on Fly.io — Docker config, port requirements, TURN traversal                         | LiveKit is recommended but deployment specifics need investigation               |
| **Phase 3 (Calls)**        | LiveKit E2EE + CGraph E2EE interop — can LiveKit's SFrame use CGraph's key material?                    | E2EE call encryption needs to align with the platform's overall E2EE story       |
| **Phase 4 (Community)**    | Enumerate the actual 50+ forum customization options — count what exists, identify gaps                 | The "50+" claim needs validation against real code                               |
| **Phase 5 (Monetization)** | Apple IAP vs Stripe boundary — which CGraph features are "digital goods" vs "services"?                 | Forum subscriptions and cosmetics are borderline; need App Store review guidance |
| **Phase 5 (Monetization)** | Forum owner revenue model — percentage split? Owner sets prices? Platform takes cut?                    | Revenue model is undefined — needs business decision                             |
| **Phase 5 (Monetization)** | RevenueCat vs custom entitlements — build or buy the cross-platform purchase reconciliation?            | RevenueCat simplifies IAP but adds dependency; custom is more control            |
| **Phase 6 (Scale)**        | Crypto audit firm selection and scoping — Trail of Bits vs NCC Group vs Cure53                          | Budget constraint ($30–80K) needs matched to scope                               |
| **Phase 6 (Scale)**        | Fly.io multi-region read replica setup — does DNSCluster + PG read replica actually work as documented? | Architecture docs reference this but need to verify Fly.io specifics             |

---

## Confidence Assessment

| Area             | Confidence       | Basis                                                                                                                                                 | Gaps                                                                                                                                     |
| ---------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Stack**        | ⬛⬛⬛⬛⬜ (85%) | Versions verified against latest releases (Feb 2026). Clear add/remove/keep recommendations.                                                          | `stripity_stripe` last released 22 months ago — maintainer risk. LiveKit self-hosted on Fly.io is untested.                              |
| **Features**     | ⬛⬛⬛⬛⬜ (90%) | Comprehensive competitive analysis against 8 platforms. Feature code presence verified by file/module names.                                          | "CGraph Has Code?" verification was filename-based, not functional testing. Some features marked ✅ may be incomplete.                   |
| **Architecture** | ⬛⬛⬛⬛⬜ (85%) | Data flow diagrams grounded in actual codebase files. Scale numbers based on Phoenix/Erlang benchmarks. Build order derived from dependency analysis. | Cross-context event bus (Forums→Gamification) is recommended pattern, not verified existing. Mobile offline sync protocol depth unknown. |
| **Pitfalls**     | ⬛⬛⬛⬛⬛ (95%) | 26 pitfalls identified with specific CGraph code references, severity ratings, and prevention strategies. Priority matrix is actionable.              | Some pitfall likelihoods are estimates — actual rates depend on user behavior patterns not yet observable.                               |

---

## Gaps Research Couldn't Answer

1. **Actual state of mobile app** — last touched at unknown date. Dependencies may be more stale
   than package.json suggests. Need to run `npx expo doctor` and attempt a build.

2. **Which backend routes are erroring** — PROJECT.md says "some routes return errors" but research
   can't identify which without running the server and hitting endpoints.

3. **E2EE functional end-to-end status** — crypto package has extensive tests, but does the full
   pipeline (key exchange → encrypt → channel → decrypt → display) work today? Can only determine by
   running it.

4. **Forum owner revenue economics** — no prior art in the codebase. This is a business model
   decision, not a technical one. Needs product discussion.

5. **Stripe account status** — PROJECT.md says "Stripe.com account setup" is a launch task. Is there
   a Stripe account at all? Test mode? Live mode? This affects all payment work.

6. **Push notification certificate validity** — APNs certificates expire annually. If the mobile app
   hasn't been touched, certificates may be expired.

7. **Database migration health** — do all 100+ migrations apply cleanly on a fresh database? Can
   only verify by running `mix ecto.reset`.

8. **WatermelonDB sync protocol specifics** — mobile has sync models but the conflict resolution
   strategy (last-write-wins? vector clocks? CRDTs?) isn't documented.

9. **Test infrastructure for E2EE** — crypto package tests exist, but do they run against real
   browser crypto (not just Node.js polyfills)? Platform parity of crypto operations is critical.

10. **Actual concurrent user target validation** — "10K+" is the goal, but what's the day-one
    realistic expectation? 100? 1,000? 10,000? This affects how much scale work is Phase 6 vs
    post-launch.

---

_This synthesis is opinionated: the phase ordering prioritizes dependency chains (later phases
depend on earlier ones being functional), the build sequence matches industry patterns (Signal,
Discord, Telegram architectures), and pitfall prevention is woven into each phase rather than
deferred. The roadmap creation agent should preserve this ordering unless it discovers blocking
constraints not captured in research._
