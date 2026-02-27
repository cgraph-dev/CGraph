# STACK Research — CGraph v0.9.48 → v1.0.0

> **Domain**: Encrypted Messaging + Community Platform (Discord + Telegram + MyBB) **Project Type**:
> Brownfield / Subsequent Milestone (~85% built) **Research Date**: 2026-02-27 **Target**: 10K+
> concurrent users at launch

---

## 1. Version Audit of Current Stack

### Backend (Elixir/Phoenix)

| Package           | Current    | Latest (Feb 2026)         | Status          | Action                                                                                                  |
| ----------------- | ---------- | ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `phoenix`         | `~> 1.8.3` | **1.8.4** (Feb 23, 2026)  | ⚠️ PATCH BEHIND | Bump to `~> 1.8.4` — bugfix release                                                                     |
| `ecto_sql`        | `~> 3.13`  | **3.13.4** (Dec 27, 2025) | ✅ OK           | Constraint resolves to latest                                                                           |
| `oban`            | `~> 2.20`  | **2.20.3** (Jan 22, 2026) | ✅ OK           | Constraint resolves to latest                                                                           |
| `guardian`        | `~> 2.4`   | **2.4.0** (Aug 5, 2025)   | ✅ OK           | Latest in 2.x line                                                                                      |
| `swoosh`          | `~> 1.20`  | **1.22.1** (Feb 25, 2026) | ⚠️ MINOR BEHIND | Bump to `~> 1.22` for latest features                                                                   |
| `redix`           | `~> 1.5`   | **1.5.3** (Nov 23, 2025)  | ✅ OK           | Constraint resolves to latest                                                                           |
| `bandit`          | `~> 1.10`  | **1.10.3** (Feb 22, 2026) | ✅ OK           | Constraint resolves to latest                                                                           |
| `stripity_stripe` | `~> 3.2`   | **3.2.0** (May 9, 2024)   | ⚠️ STALE        | Latest, but last release ~22 months ago. No newer version. Functional but watch for maintainer activity |
| `sentry`          | `~> 11.0`  | 11.x                      | ✅ OK           | Latest major                                                                                            |
| `postgrex`        | `~> 0.21`  | 0.21.x                    | ✅ OK           | Latest in 0.21 line                                                                                     |
| `finch`           | `~> 0.20`  | 0.20.x                    | ✅ OK           | Works with Swoosh/Phoenix                                                                               |
| `argon2_elixir`   | `~> 4.1`   | 4.1.x                     | ✅ OK           | Latest                                                                                                  |
| `cachex`          | `~> 4.1`   | 4.1.x                     | ✅ OK           | Latest major                                                                                            |
| `jose`            | `~> 1.11`  | 1.11.x                    | ✅ OK           | Required by Guardian 2.4                                                                                |

### Web (React/Vite)

| Package                   | Current    | Latest (Feb 2026)       | Status          | Action                                                                                                 |
| ------------------------- | ---------- | ----------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `react` / `react-dom`     | `19.1.0`   | **19.2.4**              | ⚠️ PATCH BEHIND | Bump — contains perf + bugfixes                                                                        |
| `vite`                    | `^6.3.0`   | 6.x latest              | ✅ OK           | Semver constraint covers latest                                                                        |
| `typescript`              | `~5.8.0`   | 5.8.x / 5.9.x available | ✅ OK           | Web pinned to 5.8, acceptable                                                                          |
| `@tanstack/react-query`   | `^5.75.0`  | 5.90+                   | ✅ OK           | Semver covers latest                                                                                   |
| `framer-motion`           | `^12.0.0`  | 12.x                    | ✅ OK           | Latest major                                                                                           |
| `zustand`                 | `^5.0.0`   | 5.x                     | ✅ OK           | Latest major                                                                                           |
| `tailwindcss`             | `^3.4.17`  | 3.4.x                   | ✅ OK           | Note: Tailwind v4 is out, but migration is non-trivial. Stay on v3 for v1.0, migrate to v4 post-launch |
| `@stripe/react-stripe-js` | `^3.5.0`   | 3.x                     | ✅ OK           | Latest                                                                                                 |
| `@stripe/stripe-js`       | `^5.5.0`   | 5.x                     | ✅ OK           | Latest                                                                                                 |
| `react-router-dom`        | `^7.13.0`  | 7.x                     | ✅ OK           | Latest                                                                                                 |
| `i18next`                 | `^25.8.11` | 25.x                    | ✅ OK           | Latest                                                                                                 |
| `@sentry/react`           | `^10.38.0` | 10.x                    | ✅ OK           | Latest                                                                                                 |

### Mobile (React Native/Expo)

| Package                     | Current    | Latest (Feb 2026)        | Status          | Action                                                                               |
| --------------------------- | ---------- | ------------------------ | --------------- | ------------------------------------------------------------------------------------ |
| `react-native`              | `0.81.5`   | **0.84.0**               | ⚠️ MINOR BEHIND | 0.82+ brings New Architecture default. Upgrade to 0.83+ when Expo SDK 55 supports it |
| `expo`                      | `~54.0.31` | **55.0.3** (Expo SDK 55) | ⚠️ MAJOR BEHIND | Expo SDK 55 is current. Plan upgrade after v1.0 — requires coordinated RN upgrade    |
| `react-native-reanimated`   | `~4.1.1`   | 4.x                      | ✅ OK           | Compatible with current Expo                                                         |
| `@nozbe/watermelondb`       | `^0.27.1`  | 0.27.x                   | ✅ OK           | Latest stable                                                                        |
| `react-native-quick-crypto` | `^0.7.0`   | 0.7.x                    | ✅ OK           | Latest                                                                               |
| `typescript` (mobile)       | `~5.9.0`   | 5.9.x                    | ✅ OK           | Slightly ahead of web                                                                |
| `@sentry/react-native`      | `^7.12.0`  | 7.x                      | ✅ OK           | Latest major                                                                         |
| `expo-notifications`        | `~0.32.16` | SDK 54 compatible        | ✅ OK           | Matches current Expo SDK                                                             |

### Verdict

**Do NOT upgrade React Native / Expo SDK before v1.0 launch.** The RN 0.81.5 + Expo SDK 54
combination is stable and well-tested. Upgrading mid-milestone risks weeks of breakage. Schedule
Expo SDK 55 + RN 0.83 upgrade for v1.1.

**Do bump before launch:** Phoenix 1.8.3 → 1.8.4, React 19.1.0 → 19.2.x, Swoosh ~> 1.22. These are
low-risk patch/minor updates.

---

## 2. Recommended Additions to Existing Stack

### 2.1 Voice/Video Calls — LiveKit SFU

**Current state:** CGraph has WebRTC signaling infrastructure built in Elixir (GenServer + ETS
rooms, call_channel.ex, webrtc_lobby_channel.ex, STUN/TURN config). The signaling layer is complete.
What's **missing** is the actual media server (SFU) for group calls and client-side WebRTC
libraries.

**Recommendation: Use LiveKit (self-hosted) as the SFU.**

| Package                             | Version       | Where                     | Purpose                                                                   |
| ----------------------------------- | ------------- | ------------------------- | ------------------------------------------------------------------------- |
| `livekit-server` (Docker)           | Latest stable | Infrastructure            | SFU media server — handles media routing, simulcast, bandwidth estimation |
| `livekit-client`                    | `^2.17.2`     | Web (`@cgraph/web`)       | Browser WebRTC client with E2EE support                                   |
| `@livekit/react-native`             | `^2.9.6`      | Mobile (`@cgraph/mobile`) | React Native WebRTC client                                                |
| `@livekit/react-native-webrtc`      | Latest        | Mobile (`@cgraph/mobile`) | Native WebRTC bindings for RN                                             |
| `@livekit/react-native-expo-plugin` | Latest        | Mobile (`@cgraph/mobile`) | Expo config plugin for LiveKit                                            |
| `livekit_server_sdk` (Hex)          | Latest        | Backend                   | Elixir server SDK for token generation, room management                   |

**Why LiveKit over raw WebRTC or alternatives:**

- **Built-in E2EE support** — LiveKit has first-class E2EE with key ratcheting, critical for
  CGraph's security model. Works with shared keys or key providers on both web and React Native
- **Open source, self-hostable** — Deploy on Fly.io alongside existing infra. Apache 2.0 license. No
  vendor lock-in
- **Simulcast + Dynacast** — Adaptive video quality for varying network conditions, essential for
  mobile users
- **SFU architecture** — Necessary for group calls (3+ participants). 1:1 calls can still use
  peer-to-peer with TURN fallback
- **Scales horizontally** — Distributed multi-region deployment supported, matches Fly.io pattern
- **Embedded TURN** — LiveKit includes its own TURN server, simplifying the existing STUN/TURN
  config
- **Integrates with existing signaling** — CGraph's Phoenix Channel signaling can dispatch to
  LiveKit for media, keeping the call state management in Elixir

**Integration pattern:**

1. Keep existing `CGraph.WebRTC` module for call state management (who's in a call, ring events,
   history)
2. LiveKit handles only the media plane (audio/video routing)
3. Backend generates LiveKit tokens using the Elixir server SDK when a call is initiated
4. Web/mobile clients connect to LiveKit for media after Phoenix Channel handshake

### 2.2 Mobile Payments — Stripe React Native SDK

**Current state:** Web has `@stripe/react-stripe-js` + `@stripe/stripe-js`. Backend has
`stripity_stripe`. Mobile has **no Stripe SDK**.

| Package                       | Version   | Where                     | Purpose                                                 |
| ----------------------------- | --------- | ------------------------- | ------------------------------------------------------- |
| `@stripe/stripe-react-native` | `^0.59.1` | Mobile (`@cgraph/mobile`) | Native payment UI (PaymentSheet, Apple Pay, Google Pay) |

**Why:**

- Official Stripe SDK for React Native with Expo support
  (`expo install @stripe/stripe-react-native`)
- Handles PCI compliance — sensitive card data never touches your server
- Built-in Apple Pay + Google Pay support
- PaymentSheet provides pre-built, SCA-compliant checkout UI
- Required for premium subscription purchases on mobile (App Store guidelines: physical
  goods/services can use Stripe; digital goods within the app must use IAP — forum subscriptions and
  cosmetics are borderline but community features lean toward Stripe being acceptable)

**Expo config plugin setup:**

```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.org.cgraph",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

### 2.3 Web Push Notifications (Backend)

**Current state:** Push notifications are marked as ✅ Done. The backend has
`CGraph.Notifications.PushService` with APNS, FCM, and WebPush support. Expo Push
(`expo-notifications`) handles mobile. Web push has `web_push_controller.ex` and
`webPushService.ts`.

**No new libraries needed.** The existing stack covers this. The backend appears to use a custom
implementation for VAPID-based web push. If issues arise, consider adding `web_push_elixir ~> 0.5.0`
(latest Feb 2026) as a lighter alternative to the custom implementation.

### 2.4 Forums Module — No New Libraries Needed

**Current state:** Forums are implemented as Elixir contexts (`CGraph.Forums`) with categories,
threads, posts, reactions. Web has `apps/web/src/modules/forums/`.

**Required for completion:**

- No new libraries. Forums are a data model + CRUD + real-time problem, fully solvable with existing
  Phoenix + Ecto + Phoenix Channels stack
- Rich text rendering: `react-markdown` + `remark-gfm` already installed on web
- Pagination: TanStack Query infinite queries already available

### 2.5 Gamification — No New Libraries Needed

**Current state:** Gamification modules exist (`CGraph.Gamification` — XP, levels, achievements,
quests, leaderboards, titles, cosmetics). Frontend components exist for badges, leaderboards, quest
trackers.

**Required for completion:**

- `canvas-confetti ^1.9.4` — already installed on web for celebration effects
- `gsap ^3.14.2` — already installed for advanced animations
- No additional libraries. Gamification is application logic over existing Ecto/Phoenix/React

### 2.6 Animated Customizations

**Current state:** `framer-motion ^12.0.0`, `gsap ^3.14.2`, `@react-three/fiber`,
`@react-three/drei` already installed on web. Mobile has `react-native-reanimated ~4.1.1`.

**No new libraries needed.** The animation stack is comprehensive:

- Framer Motion for component-level animations (web)
- GSAP for timeline/scroll animations (web)
- Three.js ecosystem for 3D effects (web)
- Reanimated for native-thread animations (mobile)
- `@cgraph/animation-constants` shared package for consistent timing

### 2.7 Rate Limiting (Missing)

**Current state:** No rate limiting library detected in mix.exs. For a messaging platform at 10K+
concurrent users, this is a gap.

| Package                | Version  | Where   | Purpose                                            |
| ---------------------- | -------- | ------- | -------------------------------------------------- |
| `hammer`               | `~> 7.0` | Backend | Rate limiting with pluggable backends (ETS, Redis) |
| `hammer_backend_redis` | `~> 7.0` | Backend | Redis-backed distributed rate limiting             |

**Why Hammer:**

- Pluggable backend — use ETS for single-node dev, Redis for production multi-node
- Already works with Plug/Phoenix pipelines
- Sliding window algorithm — appropriate for API rate limiting
- Battle-tested in Elixir ecosystem (6M+ downloads)

**Alternative already possible:** CGraph could implement rate limiting with `Cachex` (already
installed) + custom Plug. But Hammer is purpose-built and handles edge cases (distributed counters,
atomic operations).

### 2.8 Feature Flags (Recommended)

| Package          | Version   | Where   | Purpose                           |
| ---------------- | --------- | ------- | --------------------------------- |
| `fun_with_flags` | `~> 1.12` | Backend | Feature flags for gradual rollout |

**Why:**

- Enable/disable features per user, group, or percentage
- Uses existing Redis + Ecto infrastructure (no new dependencies)
- Critical for v1.0 launch: roll out forums, calls, gamification independently
- Supports boolean, percentage, and actor-based gates

---

## 3. What NOT to Add (and Why)

### Do NOT add Janus/mediasoup/Twilio for WebRTC

- Janus: C-based, complex ops, no native E2EE support
- mediasoup: Node.js-based, would add another runtime to the stack
- Twilio: Vendor lock-in, per-minute pricing, no self-hosting
- **LiveKit covers all use cases** with better E2EE and simpler ops

### Do NOT upgrade Tailwind to v4

- Tailwind v4 is a CSS-first rewrite with breaking config changes
- Migration requires touching every tailwind.config.js and potentially all utility classes
- Not worth the risk during v0.9.48 → v1.0. Schedule for v1.1+

### Do NOT upgrade to Expo SDK 55 / RN 0.83+ before v1.0

- Expo SDK 55 was just released and may need ecosystem catch-up
- RN 0.82+ default New Architecture may break some native modules (WatermelonDB,
  react-native-quick-crypto)
- 0.81.5 + SDK 54 is battle-tested. Upgrade post-launch

### Do NOT add GraphQL (Absinthe)

- CGraph uses REST + Phoenix Channels. Adding GraphQL mid-project creates two API paradigms
- Phoenix Channels already solve the real-time subscription problem that GraphQL subscriptions would
  address
- TanStack Query works excellently with REST APIs

### Do NOT add Redis Pub/Sub for Phoenix PubSub

- Phoenix PubSub already supports distributed communication via `:pg` (built into OTP)
- Redis PubSub adapter adds unnecessary latency for internal message routing
- Redis is correctly used for caching and rate limiting, not for PubSub at this scale

### Do NOT add a separate search service (Elasticsearch/Typesense)

- MeiliSearch v1.12 is already integrated and sufficient for 10K users
- Meilisearch handles full-text search with typo tolerance, facets, and real-time indexing
- Elasticsearch is overkill for this scale and adds significant ops burden

### Do NOT add Pigeon for push notifications

- `Pigeon ~> 2.0.1` exists but CGraph already has a working push service
- Adding Pigeon would duplicate functionality
- The existing custom push_service integrates with Expo Push (mobile) and VAPID web push (web)

---

## 4. E2EE Messaging at Scale — Industry Patterns

### Signal Protocol Architecture (Reference)

CGraph already implements the core Signal Protocol primitives (PQXDH, Double Ratchet, Triple
Ratchet). Key patterns to ensure at scale:

1. **Key server separation** — Prekey bundles should be managed independently from the message
   server. CGraph has `CGraph.Encryption` module; ensure prekey upload/fetch is rate-limited and
   audited

2. **Sealed sender** — Signal hides sender identity from the server. CGraph should implement this
   for DMs: encrypt the sender identity inside the E2EE envelope so the server routes messages
   without knowing who sent them

3. **Message fan-out for groups** — Signal uses Sender Keys for group messages (one encrypt, server
   fans out). CGraph's Triple Ratchet already handles this. Ensure Sender Key ratcheting occurs
   after member removal

4. **Prekey exhaustion protection** — Generate and upload multiple one-time prekeys. If exhausted,
   fall back to signed prekeys (already supported by PQXDH)

5. **Post-quantum readiness** — ML-KEM-768 via Triple Ratchet already provides PQ protection. This
   is ahead of Signal (which added PQXDH in 2023 but hasn't fully deployed PQ ratcheting)

### WhatsApp Architecture Patterns (10K+ Scale)

1. **Offline message queuing** — Messages for offline users must be persisted server-side
   (encrypted) and delivered on reconnect. CGraph has this via Ecto + delivery tracking

2. **Message batching** — Batch Phoenix Channel messages every 50-100ms instead of individual
   pushes. Reduces WebSocket frame overhead at scale

3. **Read receipt aggregation** — Don't send individual read receipts in group chats. Aggregate and
   send at intervals (e.g., every 5s)

4. **Presence throttling** — CGraph already has sampled presence for large channels. Good. Ensure
   default sample rate < 10% for channels > 1K members

5. **Connection pooling** — Phoenix Channels handle this natively via `Phoenix.PubSub` and the BEAM
   scheduler. No additional tooling needed

### Discord Architecture Patterns (Community Platform)

1. **Gateway sharding** — At 10K users, not needed yet. Plan for it post-25K: partition Phoenix
   Channel connections across nodes by guild/community ID

2. **Lazy guilds** — Don't load all community data on connect. Load channel list, lazy-load
   messages. CGraph's TanStack Query pagination handles this

3. **Permission caching** — Cache role/permission checks in ETS or Cachex. Database queries for
   every permission check won't scale

4. **CDN for media** — Serve uploaded files via Cloudflare CDN (already using R2). Ensure signed
   URLs for access control

---

## 5. Complete Stack Summary for v1.0

### Additions Required

| Addition                                  | Type                 | Priority                          | Effort             |
| ----------------------------------------- | -------------------- | --------------------------------- | ------------------ |
| **LiveKit SFU** (self-hosted Docker)      | Infrastructure       | P0 — Required for calls           | 3-5 days           |
| **livekit-client** `^2.17.2`              | Web dependency       | P0                                | Part of calls impl |
| **@livekit/react-native** `^2.9.6`        | Mobile dependency    | P0                                | Part of calls impl |
| **@livekit/react-native-expo-plugin**     | Mobile config plugin | P0                                | Part of calls impl |
| **livekit_server_sdk** (Hex)              | Backend dependency   | P0                                | Part of calls impl |
| **@stripe/stripe-react-native** `^0.59.1` | Mobile dependency    | P1 — Required for mobile payments | 1-2 days           |
| **hammer** `~> 7.0` + redis backend       | Backend dependency   | P1 — Required for launch security | 1 day              |
| **fun_with_flags** `~> 1.12`              | Backend dependency   | P2 — Recommended for rollout      | 0.5 day            |

### Version Bumps Required

| Bump                  | From       | To         | Risk                    |
| --------------------- | ---------- | ---------- | ----------------------- |
| `phoenix`             | `~> 1.8.3` | `~> 1.8.4` | Minimal — patch release |
| `swoosh`              | `~> 1.20`  | `~> 1.22`  | Low — minor release     |
| `react` / `react-dom` | `19.1.0`   | `19.2.x`   | Low — patch release     |

### No Changes Needed

- Ecto, Oban, Guardian, Redix, Bandit — all on latest
- Stripe (web + backend) — on latest available
- TanStack Query, Zustand, Framer Motion — all on latest
- Expo SDK 54 / RN 0.81.5 — stay until post-v1.0
- Tailwind v3 — stay until post-v1.0
- MeiliSearch, Prometheus/Grafana/Loki/Tempo — all current

---

## 6. Sources & Confidence Levels

| Source                                                                                                 | Data Point                                              | Confidence                                                       |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------------- |
| [hex.pm/packages/phoenix](https://hex.pm/packages/phoenix)                                             | Phoenix 1.8.4 (Feb 23, 2026)                            | 🟢 HIGH — verified live                                          |
| [hex.pm/packages/oban](https://hex.pm/packages/oban)                                                   | Oban 2.20.3 (Jan 22, 2026)                              | 🟢 HIGH — verified live                                          |
| [hex.pm/packages/ecto_sql](https://hex.pm/packages/ecto_sql)                                           | Ecto SQL 3.13.4 (Dec 27, 2025)                          | 🟢 HIGH — verified live                                          |
| [hex.pm/packages/guardian](https://hex.pm/packages/guardian)                                           | Guardian 2.4.0 (Aug 5, 2025)                            | 🟢 HIGH — verified live                                          |
| [hex.pm/packages/swoosh](https://hex.pm/packages/swoosh)                                               | Swoosh 1.22.1 (Feb 25, 2026)                            | 🟢 HIGH — verified live                                          |
| [hex.pm/packages/stripity_stripe](https://hex.pm/packages/stripity_stripe)                             | stripity_stripe 3.2.0 (May 9, 2024)                     | 🟢 HIGH — verified live                                          |
| [hex.pm/packages/bandit](https://hex.pm/packages/bandit)                                               | Bandit 1.10.3 (Feb 22, 2026)                            | 🟢 HIGH — verified live                                          |
| [hex.pm/packages/redix](https://hex.pm/packages/redix)                                                 | Redix 1.5.3 (Nov 23, 2025)                              | 🟢 HIGH — verified live                                          |
| [npmjs.com/package/react](https://npmjs.com/package/react)                                             | React 19.2.4                                            | 🟢 HIGH — verified live                                          |
| [npmjs.com/package/react-native](https://npmjs.com/package/react-native)                               | RN 0.84.0                                               | 🟢 HIGH — verified live                                          |
| [npmjs.com/package/expo](https://npmjs.com/package/expo)                                               | Expo SDK 55.0.3                                         | 🟢 HIGH — verified live                                          |
| [npmjs.com/package/livekit-client](https://npmjs.com/package/livekit-client)                           | livekit-client 2.17.2                                   | 🟢 HIGH — verified live                                          |
| [npmjs.com/package/@livekit/react-native](https://npmjs.com/package/@livekit/react-native)             | @livekit/react-native 2.9.6                             | 🟢 HIGH — verified live                                          |
| [npmjs.com/package/@stripe/stripe-react-native](https://npmjs.com/package/@stripe/stripe-react-native) | 0.59.1                                                  | 🟢 HIGH — verified live                                          |
| [docs.livekit.io](https://docs.livekit.io)                                                             | LiveKit E2EE, self-hosting, Expo setup                  | 🟢 HIGH — official docs                                          |
| Signal Protocol architecture patterns                                                                  | Sealed sender, sender keys, PQ readiness                | 🟡 MEDIUM — based on published Signal specs + training data      |
| Discord/WhatsApp scaling patterns                                                                      | Gateway sharding, message batching, presence throttling | 🟡 MEDIUM — based on published engineering blogs + training data |
| CGraph codebase analysis                                                                               | Current integrations, module structure, dependencies    | 🟢 HIGH — verified from source files                             |
