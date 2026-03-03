# PITFALLS — CGraph Encrypted Messaging + Community Platform

> Research Dimension: Common Mistakes & Failure Modes Generated: 2026-02-27 | Project State:
> Brownfield (~85% built, v0.9.47) Stack: Elixir/Phoenix, React 19, React Native/Expo 54,
> PostgreSQL, Redis, PQXDH+Triple Ratchet

---

## Table of Contents

1. [Brownfield Reconnection Pitfalls](#1-brownfield-reconnection-pitfalls)
2. [E2EE at Scale](#2-e2ee-at-scale)
3. [React Native + Web Parity](#3-react-native--web-parity)
4. [Phoenix Channels at 10K+ Connections](#4-phoenix-channels-at-10k-connections)
5. [Stripe Payment Integration](#5-stripe-payment-integration)
6. [Forum & Gamification Systems](#6-forum--gamification-systems)
7. [Low Test Coverage Reconnection](#7-low-test-coverage-reconnection)

---

## 1. Brownfield Reconnection Pitfalls

### 1.1 Auth Token Refresh Race Conditions

**What goes wrong:** Two or more API calls detect an expired access token simultaneously. Both
attempt a refresh using the same refresh token. The first succeeds and invalidates the old refresh
token; the second fails, logging the user out. On CGraph this is acute because
`TokenManager.refresh_token/1` calls `Guardian.decode_and_verify(refresh_token)` and then issues a
new pair — if the old refresh token is blacklisted between decode and re-issue, the second caller
gets a 401.

**Why it happens:** Single-use refresh tokens (correct security practice) combined with concurrent
requests. The web app's `api-client` package uses a circuit-breaker HTTP client that may retry
failed requests, amplifying the race. Mobile's offline-first model queues requests that all fire
simultaneously on reconnect.

**How to avoid:**

- Implement a **token refresh mutex** in `@cgraph/api-client`: queue all requests behind a single
  refresh promise. If a refresh is in-flight, subsequent callers await the same promise.
- Add a **refresh token grace period** (5–10 seconds) on the backend where the old refresh token
  remains valid after rotation. CGraph's `token_blacklist/helpers.ex` can check `inserted_at` before
  rejecting.
- Return the new token pair in the 401 response body as a hint, so retried requests can use fresh
  tokens.

**Warning signs:**

- Intermittent logouts under network flakiness
- "Token revoked" errors in logs that don't correlate with user action
- Sentry reports of 401s immediately followed by login redirects

**Phase:** v0.9.48 (Auth Stabilization)

---

### 1.2 Stale WebSocket Connections After Auth Changes

**What goes wrong:** User logs in on web, gets a WebSocket connection authenticated via JWT in
`user_socket.ex`. Token expires or user changes password. The existing Phoenix Channel connection
remains authenticated with the old identity. Messages may route to a now-invalid session, or the
user sees someone else's notifications.

**Why it happens:** Phoenix Channels authenticate only at `connect/3` time. Once connected, there's
no re-authentication on the open socket. CGraph's `user_socket.ex` verifies JWT at join but doesn't
re-verify on each push. Guardian tokens embedded in the socket assigns become stale.

**How to avoid:**

- Implement **periodic token validation** on the socket: use a heartbeat callback or a GenServer
  timer that checks token expiry every 60s and forcibly disconnects stale sockets.
- On password change or session revocation, broadcast a `"force_disconnect"` event on the
  `user_channel` for that user_id.
- In `@cgraph/socket`, handle the `"force_disconnect"` event by cleanly closing and re-establishing
  with fresh credentials.

**Warning signs:**

- Users report seeing messages after logout
- `presence_channel.ex` shows ghost users who logged out minutes ago
- Security audit flags: "no socket session invalidation on credential change"

**Phase:** v0.9.48 (Auth Stabilization)

---

### 1.3 Database Migration Conflicts from Parallel Development

**What goes wrong:** Multiple feature branches add migrations with sequential timestamps. When
merged, Ecto migrations run out of logical order. A migration that adds a column may run before one
that creates the table it depends on. Alternatively, migrations that ran in dev don't match the
production migration history.

**Why it happens:** CGraph has 100+ controllers suggesting extensive schema. Parallel feature
development (E2EE tables, gamification tables, forum tables) by different contributors creates
migration timestamp collisions. Ecto's `migrations_lock` table helps but doesn't prevent logical
ordering issues.

**How to avoid:**

- Use a **migration coordination file** in the repo listing the next available timestamp slot.
- Run `mix ecto.migrations` in CI to detect gaps and ordering issues.
- Implement a **migration dry-run** step in the deploy pipeline: apply to a cloned DB first.
- For brownfield reconnection: consolidate pending migrations into a single "catch-up" migration per
  domain context before the v1.0 push.

**Warning signs:**

- `mix ecto.migrate` fails in CI but works locally
- "relation does not exist" errors on fresh `mix ecto.reset`
- Migration timestamps within 1 second of each other

**Phase:** v0.9.48 (Infrastructure)

---

### 1.4 Broken Cross-Package Dependencies After Version Drift

**What goes wrong:** `packages/crypto` v0.9.47 exports a type that `packages/socket` v0.9.31 doesn't
understand. The shared-types package adds a new field that the mobile app (v0.9.31) doesn't handle,
causing runtime crashes on deserialization. Turborepo's dependency graph may not catch these at
build time if packages use `"workspace:*"` loosely.

**Why it happens:** CGraph uses a monorepo with pnpm workspaces but packages have drifted: web is at
v0.9.47, mobile at v0.9.31, backend at v0.9.36. This 16-version gap means assumptions in shared
packages may not hold across all consumers.

**How to avoid:**

- **Lock all packages to the same version** in a single-version-policy PR before beginning feature
  work.
- Add a **workspace version check** script that fails CI if any `apps/*/package.json` version
  diverges by more than 1 patch.
- Use TypeScript project references (`tsconfig.base.json` already exists) to ensure build order
  catches type incompatibilities.
- Pin `@cgraph/shared-types` with strict semver, not `"workspace:*"`.

**Warning signs:**

- Mobile builds succeed but crash at runtime on new API responses
- TypeScript errors only appear in one app but not another for shared code
- `pnpm install` warnings about peer dependency mismatches

**Phase:** v0.9.48 (Alignment)

---

### 1.5 Feature Flag Debt from Half-Implemented Features

**What goes wrong:** Features that "worked before" were behind feature flags or environment checks
that have since changed. Code paths exist but are dead. When reconnecting features, developers don't
realize the old code path is gated by a flag that's now `false` in production, or that the flag
system itself was removed/refactored.

**Why it happens:** Brownfield projects accumulate conditional logic. CGraph already has per-tier
feature gating (Free/Premium/Enterprise in `ai.ex`), and likely similar guards elsewhere. Without a
feature flag inventory, reconnection work either misses enabling a flag or accidentally
double-implements a feature.

**How to avoid:**

- **Audit all conditional feature gates** before starting reconnection work. Grep for environment
  checks, tier guards, and boolean feature flags.
- Create a feature flag registry document that maps flag → feature → current state.
- Remove dead feature flags as part of each phase's cleanup.

**Warning signs:**

- Feature works in dev but not production
- "It used to work" reports with no corresponding code changes
- Multiple code paths for the same feature (old and new implementations coexisting)

**Phase:** v0.9.48 (Discovery/Audit)

---

## 2. E2EE at Scale

### 2.1 Pre-Key Exhaustion Under Load

**What goes wrong:** CGraph's PQXDH implementation requires Bob to publish pre-key bundles
(including `signedPreKey`, `oneTimePreKey`, and `pqPreKey` per `pqxdh.ts`). OneTimePreKeys are
consumed on first use. Under load (many users initiating conversations simultaneously), a popular
user's OTK pool drains to zero. New sessions fall back to a weaker handshake without the OTK, losing
one DH contribution.

**Why it happens:** The Signal Protocol specification allows sessions without OTKs but at reduced
security. Users who are offline for extended periods or are in many groups deplete their OTK pool
fastest. CGraph's mobile app (untouched recently) may not be replenishing OTKs.

**How to avoid:**

- Implement **OTK watermark monitoring**: when a user's OTK count drops below 20, push a background
  notification to their devices to upload more.
- Set a **minimum OTK pool size** (50–100) with server-side enforcement in `e2ee_controller.ex`.
- Rate-limit OTK consumption per requester to prevent a single bad actor from draining another
  user's pool.
- Log and alert when any user's OTK pool reaches zero.

**Warning signs:**

- Spike in sessions established without OTK (reduced security indicator)
- New conversation setup latency increases (waiting for OTK upload)
- Mobile users accumulating "upload pre-keys" background tasks

**Phase:** v0.9.49 (E2EE Hardening)

---

### 2.2 Group Key Rotation Performance Cliff

**What goes wrong:** In group messaging with E2EE, when a member leaves, the group key must rotate
(forward secrecy requires the departing member can't read future messages). For a group of N
members, this means N-1 pairwise encrypted key distributions. At 250 members (a medium community
group), that's 249 encrypted messages for a single key rotation. This creates a latency spike
visible to users and a burst of database writes.

**Why it happens:** CGraph uses Signal-style Sender Keys for groups (implied by the Double Ratchet +
group support). Sender Keys require re-keying on member removal. The cost is O(N) per rotation.
Signal solved this with their "group v2" protocol; Matrix/MegOlm has similar issues documented in
their post-mortem of Olm → MegOlm transition.

**How to avoid:**

- Implement **Sender Key + lazy re-keying**: instead of immediately rotating on member leave, mark
  the key as "tainted" and rotate on next message send. This amortizes the cost.
- Use **tree-based key distribution** (like MLS/TreeKEM) for large groups (50+ members) instead of
  pairwise distribution.
- Set a **hard group size limit** for E2EE groups (e.g., 1000 members) with server-side enforcement.
  Beyond that, use server-side encryption (like Discord).
- Batch key rotation messages into a single database transaction.

**Warning signs:**

- Group message send latency correlates with group size
- Database write spikes on member leave events
- Users in large groups report "message pending" states lasting seconds

**Phase:** v0.9.50 (E2EE Groups)

---

### 2.3 Device Sync and Multi-Device Key Conflicts

**What goes wrong:** User has the app on phone + desktop. Both devices establish separate E2EE
sessions with the same contact. Each device has its own identity key pair. Messages encrypted for
one device can't be decrypted by the other. Users report "I can see the message on my phone but not
my desktop."

**Why it happens:** CGraph's `packages/crypto` implements per-session Double Ratchet state
(`doubleRatchet.ts` stores sending/receiving chain keys per session). Each device creates its own
ratchet state. Without a device-linking protocol, messages are only encrypted for the device that
established the session. Signal solves this with "Sealed Sender" + per-device sessions; it's
expensive but necessary.

**How to avoid:**

- Implement **per-device sessions**: each sender encrypts (or fan-out encrypts) to each of the
  recipient's registered devices. The server must know which devices exist per user.
- Add a **device registration/deregistration** API to `e2ee_controller.ex` with device attestation.
- Implement **session synchronization**: when a new device is added, existing sessions should be
  re-established via a key-transfer protocol (QR code linking, like Signal).
- Store device-to-session mapping in `accounts/` context.

**Warning signs:**

- Users with multiple devices report missing messages
- Message delivery receipts show partial delivery (1 of N devices)
- "Decrypt failed" errors correlated with users who recently added a device

**Phase:** v0.9.50 (Multi-Device E2EE)

---

### 2.4 Forward Secrecy Gaps in Long-Lived Sessions

**What goes wrong:** The Double Ratchet provides forward secrecy by advancing the ratchet with each
message. But if two users have a long-lived session with infrequent messaging (e.g., one message per
month), the DH ratchet step happens rarely, creating a window where compromising a single chain key
reveals many future messages until the next DH ratchet.

**Why it happens:** CGraph's `doubleRatchet.ts` has `MAX_SKIP = 1000` skipped messages, suggesting
tolerance for out-of-order delivery, but no forced ratchet advancement. The "symmetric-key ratchet"
portion provides some forward secrecy, but the DH ratchet is what provides break-in recovery.

**How to avoid:**

- Implement **time-based forced ratchet steps**: if no DH ratchet has occurred in 7 days, inject a
  "silent key update" message.
- The SCKA (Symmetric Continuous Key Agreement) ratchet in CGraph's `scka.ts` should help here —
  ensure it's integrated and used for periodic key refresh even in idle sessions.
- Add telemetry for "ratchet age" per session and alert on sessions >30 days without a DH step.

**Warning signs:**

- Sessions with large `messageNumber` but small `dhRatchetStep` counts
- Security audit flags: "some sessions haven't rotated DH keys in weeks"
- The SCKA ratchet module exists in code but isn't wired into session management

**Phase:** v0.9.49 (E2EE Hardening)

---

### 2.5 Unaudited Cryptographic Implementation

**What goes wrong:** CGraph's `packages/crypto` implements PQXDH and Double Ratchet from
specification. Any subtle implementation error (timing side-channel, incorrect KDF parameter,
off-by-one in ratchet state) could silently break security guarantees without breaking
functionality. Users think they're secure when they're not.

**Why it happens:** Cryptographic code that passes functional tests can still be insecure. CGraph
has test files (`adversarial.test.ts`, `stress.test.ts`, `cross-platform.test.ts`) which is good,
but no external security audit is documented. The `PQXDH_VERSION = 4` and custom info string
`'CGraph_P256_SHA-256_ML-KEM-768'` suggest protocol-level decisions that need expert review.

**How to avoid:**

- **Schedule an external cryptographic audit** before v1.0.0. Budget $30K–$80K for a reputable firm
  (Trail of Bits, NCC Group, Cure53).
- Until audit: add a **beta disclaimer** on E2EE features: "End-to-end encryption is in beta and has
  not been independently audited."
- Run the crypto package against **known test vectors** from the Signal Protocol specification and
  NIST KEM test vectors.
- Implement **protocol version negotiation** so post-audit fixes can be deployed without breaking
  existing sessions.

**Warning signs:**

- Crypto tests pass but don't use official test vectors
- No fuzzing or property-based testing on crypto code
- Protocol version bumps without migration path documentation

**Phase:** v0.9.50 (Security Audit — MUST complete before v1.0.0)

---

## 3. React Native + Web Parity

### 3.1 Platform-Specific Crypto API Differences

**What goes wrong:** CGraph's `packages/crypto` uses `Web Crypto API` (the `toArrayBuffer()` helper
in `doubleRatchet.ts` suggests browser-native crypto). React Native doesn't have
`window.crypto.subtle`. The crypto package builds on web but throws "crypto.subtle is undefined" on
mobile.

**Why it happens:** The crypto package was likely developed against web first. React Native requires
polyfills (`react-native-get-random-values`, `expo-crypto`) or a completely native crypto module.
Different polyfills have different performance characteristics and may not support all algorithms
(ML-KEM-768 especially).

**How to avoid:**

- Create a **crypto adapter interface** in `packages/crypto` with platform-specific implementations:
  - Web: `window.crypto.subtle`
  - React Native: `expo-crypto` or `react-native-quick-crypto`
  - Node (tests): `node:crypto`
- Test the crypto package in all three environments in CI.
- For ML-KEM-768: verify the KEM implementation works in React Native's Hermes engine (no
  SharedArrayBuffer support).

**Warning signs:**

- Crypto tests only run in Node/jsdom, never on device
- `packages/crypto/src/types-portable.ts` exists — suggesting portability was considered but may be
  incomplete
- Mobile app crashes on message decrypt

**Phase:** v0.9.49 (Mobile Reconnection)

---

### 3.2 Navigation Model Mismatch

**What goes wrong:** Web uses React Router or similar (URL-based routing). Mobile uses React
Navigation (stack-based). A feature like "deep link to a specific message in a conversation" works
on web via URL but requires a completely different implementation on mobile (push screens onto a
stack in the right order). Developers build the web flow and assume mobile is similar.

**Why it happens:** CGraph has `apps/web/src/modules/` suggesting domain-based routing on web.
Mobile has `apps/mobile/src/screens/` suggesting screen-based navigation. These are fundamentally
different paradigms. Shared business logic assumes both can "navigate to X" identically.

**How to avoid:**

- Define **navigation intents** in `packages/shared-types` (e.g.,
  `NavigateToConversation { conversationId: string }`). Each platform implements resolution
  differently.
- Build a **deep link registry** that maps URI patterns to navigation actions on both platforms.
- Test deep links on both platforms as part of each feature's acceptance criteria.
- For Expo 54: use `expo-linking` and `expo-router` if possible for URL-based routing parity.

**Warning signs:**

- Push notifications work on web but crash on mobile
- "Share conversation link" feature works web-to-web but not web-to-mobile
- Mobile navigation state gets corrupted after certain deep links

**Phase:** v0.9.49 (Mobile Reconnection)

---

### 3.3 Push Notification Platform Divergence

**What goes wrong:** Web uses Web Push API (VAPW keys, Service Workers). iOS uses APNs (requires
Apple Developer account, provisioning profiles, entitlements). Android uses FCM. Each has different
payload size limits (4KB APNs, 4MB FCM), different delivery guarantees, and different background
execution policies. A notification that works on web silently fails on iOS because the payload is
too large or the notification extension isn't configured.

**Why it happens:** CGraph has `push_token.ex` in accounts and `web_push_controller.ex` — suggesting
web push is implemented. Mobile push likely requires additional native modules. The mobile app "not
recently touched" means push notification certificates may have expired.

**How to avoid:**

- Implement a **notification abstraction layer** in the backend: `NotificationDispatcher` that knows
  which transport to use per device type.
- Keep notification payloads **minimal** (< 2KB) with a `notification_id` reference; the client
  fetches full content.
- For iOS: implement a **Notification Service Extension** for E2EE message previews (decrypt in the
  extension).
- Test push notification delivery monthly — certificates expire annually.
- Use Oban jobs for push delivery with retry logic, not synchronous sends.

**Warning signs:**

- APNs certificate expiry dates approaching (check Apple Developer portal)
- Push notifications work in development but not TestFlight/production
- Android notifications arrive but iOS ones don't (or vice versa)
- `push_token.ex` has no token invalidation logic (stale tokens waste API calls)

**Phase:** v0.9.49 (Mobile Reconnection)

---

### 3.4 State Sync Between Platforms

**What goes wrong:** User reads a message on their phone. Opens the web app — message still shows as
unread. User archives a conversation on web. Opens mobile — conversation is still in the inbox. The
two clients have diverged state because they each maintain their own local state and sync logic is
incomplete.

**Why it happens:** CGraph has `sync_routes.ex` and mobile has `lib/database/models/` suggesting
local persistence. If the sync protocol relies on timestamps or doesn't have a conflict-resolution
strategy (CRDT, last-write-wins, server-canonical), state diverges. Read receipts
(`read_receipts.ex`) may work server-side but not propagate to all connected clients in real-time.

**How to avoid:**

- Make the **server the source of truth** for all state (conversation list, read status, etc.).
  Clients are projections.
- Propagate state changes via **Phoenix Channels** (`user_channel.ex`): when a mutation happens via
  any client, broadcast to all user's devices.
- Implement **vector clocks or sequence numbers** per entity for conflict detection.
- Design the offline sync protocol with a defined merge strategy (documented in `sync_routes.ex`
  API).

**Warning signs:**

- "Read on one device, unread on another" user reports
- Sync endpoint returns different data depending on request timing
- Mobile's local database diverges from server state after network interruptions

**Phase:** v0.9.49 (Mobile Reconnection)

---

### 3.5 Expo Managed Workflow Limitations

**What goes wrong:** Complex native modules (custom crypto, WebRTC, background processing) hit Expo
managed workflow limitations. `expo-dev-client` helps but doesn't cover all native module scenarios.
A developer adds a native module that works in development builds but fails in Expo Go or EAS Build.

**Why it happens:** CGraph uses Expo 54 (managed workflow likely). The E2EE crypto package may need
native crypto operations that pure-JS polyfills can't handle performantly. WebRTC
(`call_channel.ex`, `webrtc_lobby_channel.ex`) absolutely requires native modules.

**How to avoid:**

- Commit to **Expo development builds** (not Expo Go) for all testing.
- Create an **expo-native-modules inventory**: list every native module dependency and verify EAS
  Build compatibility.
- For crypto: evaluate `react-native-quick-crypto` which provides a native Node.js crypto API.
- For WebRTC: ensure `react-native-webrtc` is compatible with Expo 54 SDK and is in the `app.json`
  plugins list.

**Warning signs:**

- "This API is not available in Expo Go" console warnings
- EAS Build fails with native compilation errors
- Performance degradation in crypto operations on mobile vs web (JS polyfill vs native)

**Phase:** v0.9.49 (Mobile Reconnection)

---

## 4. Phoenix Channels at 10K+ Connections

### 4.1 Memory Per Connection at Scale

**What goes wrong:** Each Phoenix Channel connection is a separate Erlang process. Each process
holds socket assigns (user data, auth tokens, presence metadata). With CGraph's many channel topics
(conversation, group, user, presence, call, forum, thread, gamification, marketplace, events, AI,
document — 12+ channel types), a single user might join 10+ channels. At 10K concurrent users × 10
channels = 100K processes, each consuming ~10–40 KB. That's 1–4 GB just for socket state.

**Why it happens:** CGraph has 12+ channel modules in `channels/`. If each user auto-joins presence,
user notifications, and their active conversations, the per-user channel count grows fast. Phoenix
is efficient per-process, but the aggregate adds up when socket assigns include large data (e.g.,
caching conversation metadata in assigns).

**How to avoid:**

- **Minimize socket assigns**: store only user_id and role in assigns. Fetch everything else on
  demand.
- **Lazy channel joins**: don't auto-join all channels on connect. Join conversation channels only
  when the user opens that conversation.
- Set `Phoenix.Endpoint` `:websocket` option `max_frame_size` and implement `backpressure.ex`
  (already exists — ensure it's active).
- Benchmark with `observer` and `:recon.proc_count(:memory, 10)` to identify memory-heavy processes.
- Target: <20 KB per connected user across all channels.

**Warning signs:**

- Erlang VM memory grows linearly with user count beyond expected ratio
- `:erlang.system_info(:process_count)` exceeds 500K with only moderate users
- GC pause times increase during peak hours

**Phase:** v0.9.50 (Scale Preparation)

---

### 4.2 Reconnection Thundering Herd

**What goes wrong:** A deployment, network blip, or load balancer rotation disconnects 10K users
simultaneously. All 10K try to reconnect within milliseconds. The server is overwhelmed by 10K TLS
handshakes, 10K JWT verifications, and 10K channel re-joins, causing cascading failures.

**Why it happens:** Phoenix's default WebSocket reconnection in `phoenix.js` uses a bounded
exponential backoff, but if 10K clients were connected at the same time, they all disconnected at
the same time, and their backoff timers are closely correlated.

**How to avoid:**

- **Add jitter to reconnection**: in `@cgraph/socket` client, add random delay (0–5s) to the
  reconnection timer. Don't rely on phoenix.js defaults alone.
- Implement **server-side connection rate limiting**: accept only N new WebSocket connections per
  second. Excess connections get a 503 with `Retry-After` header.
- Use **rolling deployments** (Fly.io supports this): drain connections from one instance before
  stopping it.
- Implement a **connection circuit breaker**: if the server detects >1000 connects/second, enable a
  queue.

**Warning signs:**

- CPU/memory spike immediately after deploys
- High rate of "connection timeout" errors that resolve after 30s
- `user_socket.ex` `connect/3` becomes the hottest function in profiling post-deploy

**Phase:** v0.9.50 (Scale Preparation)

---

### 4.3 Heartbeat Timeout Tuning

**What goes wrong:** Phoenix's default heartbeat interval is 30s with a timeout of 10s. On mobile
networks with high latency, heartbeats arrive late. The server kills the connection, triggering a
reconnect cycle. Users on flaky networks experience constant connect/disconnect loops, draining
battery and creating a poor UX.

**Why it happens:** The default heartbeat settings assume reliable networks. Mobile users on 3G/4G
in regions with high latency consistently exceed the timeout. CGraph's mobile app hasn't been
recently maintained, so heartbeat tuning likely uses defaults.

**How to avoid:**

- **Increase heartbeat timeout** to 35–60s for mobile clients. Detect client type from the socket's
  `connect_info` and set per-client timeouts.
- Implement **adaptive heartbeat** in `@cgraph/socket`: start with 30s, increase interval if recent
  heartbeats were slow.
- On the server side in `endpoint.ex`, configure `:timeout` per socket transport:
  ```elixir
  socket "/socket", CGraphWeb.UserSocket,
    websocket: [timeout: 60_000, check_origin: [...]]
  ```
- Monitor heartbeat timeout disconnections separately from intentional disconnections.

**Warning signs:**

- High reconnection rate from mobile clients specifically
- Presence channel shows users "flapping" online/offline
- Battery drain complaints from mobile users

**Phase:** v0.9.50 (Scale Preparation)

---

### 4.4 Channel Authorization Bypass on Re-Join

**What goes wrong:** User joins a private conversation channel. They are later removed from the
conversation. But their existing channel connection stays alive (same session). They can still
receive messages on the channel they were removed from until they disconnect.

**Why it happens:** Channel authorization happens at `join/3` time. CGraph has `socket_security/`
for channel-level authorization, but once joined, there's no periodic re-authorization. The
`conversation_channel.ex` doesn't get notified when membership changes.

**How to avoid:**

- When membership changes (member removed, banned, conversation deleted):
  1. Broadcast a `"membership_revoked"` event on that channel topic.
  2. The channel handler intercepts this and calls `{:stop, :normal, socket}` to force-leave.
- Alternatively, use Phoenix's `Presence` tracking: when a membership change occurs, check presence
  and forcibly disconnect unauthorized users.
- Add periodi authorization checks in long-lived channel connections (every 5 minutes).

**Warning signs:**

- Security audit: "user can receive messages after being removed from conversation"
- Removed users can still see typing indicators
- No `handle_info` clause for membership revocation in channel modules

**Phase:** v0.9.48 (Auth Stabilization)

---

### 4.5 Presence Tracking Memory Explosion

**What goes wrong:** `Phoenix.Presence` tracks all connected users across all nodes using a CRDT.
With 10K users each present in multiple topics (conversations, groups, forums), the Presence state
structure grows quadratically. Presence diff broadcasts between nodes saturate the PG2/PubSub
channels.

**Why it happens:** CGraph has dedicated `presence_channel.ex` suggesting active use of Presence. If
presence is tracked per-topic (each conversation has its own presence map), the total presence state
is `users × topics_per_user`. With 10K users in 50 topics each = 500K presence entries.

**How to avoid:**

- Track presence at the **user level only**, not per-topic. A single `"presence:user:#{user_id}"`
  topic. Derive per-conversation presence by cross-referencing with membership.
- Set `Phoenix.Presence` `:temporary` flag for ephemeral data.
- Implement **presence tiers**: detailed presence (typing, active) for the user's currently open
  conversation only. Coarse presence (online/offline) for friends list.
- Rate-limit presence broadcasts to max 1 per second per user.

**Warning signs:**

- `:ets.info/1` shows Presence ETS tables growing beyond 100 MB
- Inter-node PubSub traffic dominates network bandwidth
- Presence diff broadcasts taking >100ms

**Phase:** v0.9.50 (Scale Preparation)

---

## 5. Stripe Payment Integration

### 5.1 Webhook Reliability and Idempotency

**What goes wrong:** Stripe sends a `checkout.session.completed` webhook. CGraph's
`stripe_webhook_controller.ex` processes it and upgrades the user to Premium. Stripe retries the
webhook (per their retry policy). The handler runs again, potentially double-crediting or logging
duplicate transactions.

**Why it happens:** CGraph has `idempotency_plug.ex` for API requests but this doesn't automatically
cover webhooks. Stripe webhooks are "at least once" delivery. The `stripe_webhook_controller.ex`
exists but the implementation may not be handling retries. `premium_controller.ex` has Stripe
checkout session creation — the return path (webhooks) needs equal attention.

**How to avoid:**

- Store **Stripe event IDs** in a `processed_stripe_events` table. Check before processing. CGraph's
  PostgreSQL has unique constraints — use `INSERT ... ON CONFLICT DO NOTHING`.
- Process webhooks **idempotently**: use `UPSERT` for subscription state changes instead of
  conditional logic.
- Implement a **webhook processing queue** using Oban: receive the webhook, enqueue it, return 200
  immediately. Process asynchronously with retry logic.
- Verify webhook signatures using `STRIPE_WEBHOOK_SECRET` (already referenced in
  `premium_controller.ex`).

**Warning signs:**

- Users report being charged but not upgraded (webhook processing failed silently)
- Duplicate entries in subscription tables
- Stripe dashboard shows many failed webhook deliveries (5xx responses)

**Phase:** v0.9.51 (Payments)

---

### 5.2 Subscription State Machine Complexity

**What goes wrong:** A user's subscription can be: active, past_due, canceled, incomplete, trialing,
paused. Each state has different implications for feature access. The code checks
`user.tier == "premium"` throughout the codebase, not accounting for `past_due` (should they still
have access? For how long?). A user disputes a charge — Stripe sets status to `unpaid` — but the app
still shows Premium features.

**Why it happens:** CGraph has tier-based access (Free/Premium/Enterprise visible in `ai.ex` rate
limits). If subscription state isn't centralized, each feature check is a potential inconsistency.
The `accounts.ex` has `get_user_by_stripe_subscription/1` but the state machine connecting Stripe
status to app tier may be incomplete.

**How to avoid:**

- Implement a **canonical subscription state machine** in the backend: a single `Subscriptions`
  context that maps Stripe states to CGraph tiers.
- Add a **grace period** for `past_due` (typically 3–7 days).
- Don't cache subscription status on the client — always derive from server state.
- Handle these Stripe webhooks explicitly: `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`, `charge.dispute.created`.
- Test all state transitions with Stripe's test clock feature.

**Warning signs:**

- Users with `past_due` status still showing as Premium in the app
- No webhook handler for `invoice.payment_failed`
- Feature access checks scattered across many modules instead of centralized

**Phase:** v0.9.51 (Payments)

---

### 5.3 Apple/Google IAP Requirements for Mobile

**What goes wrong:** App Store Review rejects the iOS app because users can purchase Premium via
Stripe in-app, bypassing Apple's 30% commission. Google Play has similar requirements. Any "digital
goods" sold in-app must use platform IAP.

**Why it happens:** Apple's App Store Review Guidelines §3.1.1: "If you want to unlock features or
functionality within your app, you must use in-app purchase." This applies to CGraph's
Premium/Enterprise tiers. Stripe can only be used for physical goods or services consumed outside
the app.

**How to avoid:**

- **Use Apple IAP and Google Play Billing for mobile purchases**. Use Stripe for web-only purchases
  and server-to-server (B2B).
- Implement a **unified entitlements system**: regardless of purchase source (Stripe, Apple,
  Google), the user's tier is stored and checked in one place. Use RevenueCat or build a custom
  reconciliation system.
- On iOS/Android: link IAP receipts to the user's account. Validate receipts server-side.
- Price differently if needed (web can be cheaper since no 30% cut).

**Warning signs:**

- App Store Review rejection with guideline 3.1.1 citation
- Stripe checkout pages loading inside the mobile WebView (this will be rejected)
- No IAP-related code in the mobile app at all (it doesn't exist yet)

**Phase:** v0.9.51 (Payments — must be resolved before mobile app submission)

---

### 5.4 Price Change and Plan Migration

**What goes wrong:** CGraph launches Premium at $9.99/month. Later, the price needs to change to
$12.99. Existing subscribers should stay at the old price (grandfathering), but the code doesn't
distinguish between old and new price IDs. All users see the new price immediately, old subscribers
get charged more without notice, violating consumer protection laws.

**Why it happens:** `premium_controller.ex` fetches price IDs from environment variables
(`STRIPE_PRICE_PREMIUM`, `STRIPE_PRICE_ENTERPRISE`). If these are changed in production config, all
new and existing subscriptions reference the new price.

**How to avoid:**

- **Never change a Stripe Price — create a new one**. Store the price_id per subscription in your
  database.
- Implement **plan version tracking**: each subscription records which price_id it was created with.
- For price changes: create a migration Oban job that handles plan transitions with proper
  notification and opt-in/opt-out.
- Send email notification N days before any price change (legal requirement in many jurisdictions).

**Warning signs:**

- Only one `STRIPE_PRICE_*` env var per tier (no versioning)
- No `price_id` column in the local subscriptions table
- User complaints about unexpected price changes

**Phase:** v0.9.51 (Payments)

---

## 6. Forum & Gamification Systems

### 6.1 N+1 Queries on Leaderboards

**What goes wrong:** The leaderboard page loads. The query fetches top 100 users by XP. For each
user, it loads their avatar, rank, title, and recent achievements — one query each. Result: 100 +
(100 × 4) = 500 database queries for a single page load. At peak, this takes >2 seconds and hammers
the database.

**Why it happens:** CGraph has gamification routes (`gamification_routes.ex`,
`gamification_channel.ex`) and likely Ecto schemas for XP, quests, and achievements. Ecto doesn't
auto-preload associations — developers must explicitly use `Repo.preload/2` or
`from q in query, preload: [...]`. It's easy to miss, especially when iterating through results in
templates or JSON views.

**How to avoid:**

- **Always preload associations** in leaderboard queries:
  ```elixir
  from u in User,
    join: g in assoc(u, :gamification_profile),
    preload: [gamification_profile: {g, [:achievements, :title]}],
    order_by: [desc: g.xp],
    limit: 100
  ```
- Add a **materialized view or Redis cache** for leaderboard data. Update every 5 minutes via Oban
  job, not on every request.
- Use CGraph's `read_repo.ex` (read replica) for leaderboard queries to avoid loading the primary
  database.
- Add Telemetry hooks to detect queries exceeding 10ms per request.

**Warning signs:**

- Leaderboard page takes >500ms to render
- `Ecto.LogEntry` shows 100+ SELECT queries per leaderboard request
- Database CPU spikes correlated with leaderboard page views

**Phase:** v0.9.50 (Performance)

---

### 6.2 XP Inflation and Economy Imbalance

**What goes wrong:** XP is awarded for forum posts, messages, reactions, logins. Power users
discover they can earn unlimited XP by creating and deleting forum posts, reacting to every message,
or using automated scripts. Within weeks, the top of the leaderboard is dominated by grinders, not
quality contributors. XP becomes meaningless.

**Why it happens:** Gamification systems that reward activity (quantity) rather than impact
(quality) always inflate. Without caps, rate limits, and anti-abuse measures, the economy spirals.
CGraph has quest and marketplace systems — if XP can be spent on cosmetics/items, inflation devalues
the economy.

**How to avoid:**

- **Daily XP caps** per activity type: e.g., max 100 XP from messages/day, max 50 from
  reactions/day.
- **Diminishing returns**: XP per forum post decreases per day (first post = 10 XP, second = 8,
  tenth = 1).
- **Quality multipliers**: posts that receive upvotes/reactions earn bonus XP. Posts with no
  engagement earn minimal XP.
- **Anti-abuse detection**: flag accounts earning >3σ above mean daily XP for review.
- Separate **display rank** (based on quality metrics) from **spendable currency** (accumulated from
  all sources).

**Warning signs:**

- Top leaderboard users have 10× more XP than the 90th percentile
- XP distribution follows a power law with extreme outliers
- User complaints about "unfair" rankings

**Phase:** v0.9.51 (Gamification Polish)

---

### 6.3 Permission Complexity Explosion

**What goes wrong:** Groups have roles (owner, admin, moderator, member). Forums have boards with
per-board permissions. Channels have separate permission overrides. A user can be an admin in one
group, moderator in another, and member in a third — each with different permissions on different
channels. The permission check for "can this user post in this channel" requires checking 5+ tables
and the code becomes unmaintainable.

**Why it happens:** CGraph has `socket_security/` with channel-level authorization, group membership
with roles, forum board permissions, and admin routes with guards. Each feature added its own
permission model. Without a unified RBAC/ABAC system, permission logic is scattered and
inconsistent. The `packages/utils` has permissions-related code, but unifying it across backend and
frontend is hard.

**How to avoid:**

- Implement a **single permission evaluation function**: `Permissions.can?(user, action, resource)`
  that encapsulates all checks.
- Define permissions as **a hierarchy**: platform → group → channel → thread. Each level inherits
  from the parent unless overridden.
- Cache computed permissions in **Redis** with invalidation on role changes. Don't recompute on
  every request.
- Keep the permission model in `packages/shared-types` so web, mobile, and backend all agree on
  capability names.

**Warning signs:**

- Different features check permissions differently (some check role, some check a permission bit,
  some check both)
- Users report inconsistent access (can do X in one place but not another when they should be
  equivalent)
- Permission-related bugs are the most common category in issue tracker

**Phase:** v0.9.50 (Architecture)

---

### 6.4 Notification Spam from Forum Activity

**What goes wrong:** User subscribes to a forum board. Someone creates a new thread. 50 people reply
within an hour. The user receives 51 notifications (1 new thread + 50 replies). Their notification
center is unusable, push notifications drain their battery, and they unsubscribe from everything.

**Why it happens:** CGraph has `user_channel.ex` for per-user notifications and `forum_channel.ex` +
`thread_channel.ex` for real-time forum events. If every forum event generates a notification
without batching or throttling, high-activity forums become spam cannons.

**How to avoid:**

- **Notification batching**: group related notifications. "5 new replies in Thread X" instead of 5
  separate notifications.
- **Throttling**: max 1 push notification per topic per 15-minute window. Accumulate and summarize.
- **Smart notification levels**: watching (all events), normal (mentions and direct replies), muted.
  Default to "normal."
- **Notification digest**: for email notifications, send a daily digest instead of real-time.
- Use Oban for notification delivery with deduplication: two notifications for the same topic within
  the window get merged.

**Warning signs:**

- Notification count per user exceeds 100/day
- Push notification opt-out rate above 20%
- Users complaining about battery drain

**Phase:** v0.9.51 (Forum Polish)

---

## 7. Low Test Coverage Reconnection

### 7.1 Regression Introduction During Reconnection

**What goes wrong:** Developer fixes auth regression by modifying `TokenManager.refresh_token/1`.
The fix works for the specific regression but breaks the token blacklist flow. No test catches this
because only 17.9% of code is covered. The new regression ships to production.

**Why it happens:** CGraph's web test coverage is at 17.9%. The backend likely has higher coverage
(Elixir culture tends toward testing), but critical integration points may be untested. Making
changes to fix one regression without test coverage for adjacent code is playing whack-a-mole.

**How to avoid:**

- **Test the fix, not just the feature**: every bug fix PR must include a test that would have
  caught the original bug AND a test for the fix.
- **Critical path testing first**: before any reconnection work, write tests for:
  1. Auth flow (login → token → refresh → logout)
  2. WebSocket connection lifecycle (connect → join → receive → disconnect)
  3. Message send/receive happy path
  4. E2EE key exchange handshake
- Use **snapshot testing** for API response shapes to catch unexpected changes.
- Implement **contract tests** between `@cgraph/api-client` and the backend to ensure API
  compatibility.

**Warning signs:**

- PRs that change behavior but don't add tests
- "Fixed auth" commits that touch 10+ files
- Manual QA catching bugs that automated tests should catch

**Phase:** v0.9.48 (Foundation — before any feature reconnection)

---

### 7.2 What to Test First (Priority Order)

**What goes wrong:** Team decides to "increase test coverage" and writes tests for utility functions
and UI components. Coverage number goes up to 40%. But the critical paths (auth, messaging, E2EE,
payments) remain untested. The next regression hits a critical path.

**Why it happens:** Utility functions and simple components are easy to test. Auth flows involving
Guardian, WebSocket channels, and E2EE handshakes are hard to test. Teams gravitate toward easy wins
that move the coverage metric without moving the risk needle.

**How to avoid:** Test in this exact priority order:

1. **Auth pipeline** (`auth_pipeline.ex`, `token_manager.ex`, `guardian.ex`): Login, register, token
   refresh, token revocation, password change.
2. **Message delivery** (`conversations.ex`, `messages.ex`, `conversation_channel.ex`): Send
   message, receive message, deliver to all devices, ordering guarantees.
3. **E2EE protocol** (`packages/crypto`): Key exchange, ratchet advancement, multi-device, key
   rotation. (Already has tests — verify they all pass.)
4. **API response contracts** (all controllers): Ensure response shapes match
   `@cgraph/shared-types`. Use JSON schema validation.
5. **WebSocket channel lifecycle** (all channel modules): Join, handle_in, handle_out, presence
   tracking, error cases.
6. **Database migrations**: Ensure `mix ecto.reset && mix ecto.migrate` works cleanly.
7. **Then and only then**: UI components, utility functions, gamification logic.

**Warning signs:**

- Test coverage increases but in non-critical modules
- No integration tests (only unit tests)
- CI passes but manual smoke test fails

**Phase:** v0.9.48 (Foundation)

---

### 7.3 Integration Test Absence

**What goes wrong:** Unit tests pass for the API client. Unit tests pass for the backend controller.
But when the API client sends a request to the backend, it fails because the request format changed
and neither side tested the integration point.

**Why it happens:** CGraph has `packages/api-client` with a circuit breaker and `apps/backend` with
100+ controllers. Without integration tests that exercise the client-to-server path, format/protocol
mismatches go undetected. The TypeScript shared types help but aren't enforced at runtime.

**How to avoid:**

- Implement **API contract tests**: for each endpoint, test that the TypeScript types in
  `@cgraph/shared-types` match the actual backend response. Use tools like `zod` schemas that can
  validate at runtime.
- Create a **smoke test suite** that runs the backend and web app together:
  1. Register a user
  2. Login and receive tokens
  3. Create a conversation
  4. Send a message via API
  5. Receive message via WebSocket
  6. Verify E2EE handshake
- Run smoke tests in CI on every PR to main.
- Use Wallaby or Playwright for E2E tests that exercise the full stack.

**Warning signs:**

- No test files that import both `@cgraph/api-client` and start a backend server
- Frontend and backend PRs merged independently without cross-testing
- "Works on my machine" issues that disappear in staging

**Phase:** v0.9.48 (Foundation)

---

### 7.4 Test Environment Parity

**What goes wrong:** Tests run against a test database with different schema (missing recent
migrations). Or tests mock the WebSocket connection entirely, so channel authentication bugs are
never caught. Or the crypto package tests run in Node.js (which has `crypto.subtle` natively) but
the code fails in the browser.

**Why it happens:** Test environments tend to drift from production. CGraph has:

- `config/test.exs` for backend test config
- `vitest.config.ts` for frontend tests (jsdom environment, not real browser)
- `packages/crypto` tests in Node.js context

Each may have subtle differences from the real runtime.

**How to avoid:**

- Backend: ensure `MIX_ENV=test mix ecto.migrate` runs the exact same migrations as production.
- Frontend: for crypto-critical code, run tests in a real browser via Playwright in addition to
  vitest/jsdom.
- Add a **docker-compose.test.yml** that spins up the full stack (PostgreSQL, Redis, MeiliSearch,
  backend, web) for integration tests.
- For mobile: test crypto operations on a real device/emulator, not just Jest.

**Warning signs:**

- Tests pass in CI but feature doesn't work in browser
- `jsdom` polyfills silently changing behavior
- `config/test.exs` diverges significantly from `config/prod.exs`

**Phase:** v0.9.48 (Foundation)

---

## Summary: Pitfall Priority Matrix

| Priority | Pitfall                               | Severity | Likelihood | Phase   |
| -------- | ------------------------------------- | -------- | ---------- | ------- |
| **P0**   | Auth token refresh races (1.1)        | Critical | High       | v0.9.48 |
| **P0**   | Low coverage regression risk (7.1)    | Critical | Very High  | v0.9.48 |
| **P0**   | Integration test absence (7.3)        | Critical | High       | v0.9.48 |
| **P0**   | Unaudited crypto (2.5)                | Critical | Medium     | v0.9.50 |
| **P1**   | Stale WebSocket auth (1.2)            | High     | High       | v0.9.48 |
| **P1**   | Channel authorization bypass (4.4)    | High     | Medium     | v0.9.48 |
| **P1**   | Cross-package version drift (1.4)     | High     | Very High  | v0.9.48 |
| **P1**   | Platform crypto API differences (3.1) | High     | High       | v0.9.49 |
| **P1**   | Apple/Google IAP requirements (5.3)   | High     | Certain    | v0.9.51 |
| **P2**   | Pre-key exhaustion (2.1)              | High     | Medium     | v0.9.49 |
| **P2**   | Reconnection thundering herd (4.2)    | High     | Medium     | v0.9.50 |
| **P2**   | Webhook idempotency (5.1)             | High     | Medium     | v0.9.51 |
| **P2**   | Group key rotation perf (2.2)         | Medium   | Medium     | v0.9.50 |
| **P2**   | Device sync issues (2.3)              | Medium   | High       | v0.9.50 |
| **P2**   | N+1 leaderboard queries (6.1)         | Medium   | High       | v0.9.50 |
| **P2**   | Subscription state machine (5.2)      | Medium   | Medium     | v0.9.51 |
| **P3**   | Memory per connection (4.1)           | Medium   | Medium     | v0.9.50 |
| **P3**   | Heartbeat tuning (4.3)                | Medium   | Medium     | v0.9.50 |
| **P3**   | Navigation model mismatch (3.2)       | Medium   | Medium     | v0.9.49 |
| **P3**   | Push notification divergence (3.3)    | Medium   | Medium     | v0.9.49 |
| **P3**   | XP inflation (6.2)                    | Low      | Medium     | v0.9.51 |
| **P3**   | Permission complexity (6.3)           | Medium   | Medium     | v0.9.50 |
| **P3**   | Notification spam (6.4)               | Low      | Medium     | v0.9.51 |
| **P3**   | Forward secrecy gaps (2.4)            | Medium   | Low        | v0.9.49 |
| **P3**   | Presence memory (4.5)                 | Medium   | Low        | v0.9.50 |
| **P3**   | Price migration (5.4)                 | Low      | Low        | v0.9.51 |

---

## Key Takeaways

1. **Fix auth and add tests before anything else.** The auth regression + 17.9% test coverage is the
   highest-risk combination. Every reconnection effort without tests risks introducing new
   regressions.

2. **Version-align all packages immediately.** The 16-version drift between web/mobile/backend makes
   every shared-type change a potential runtime crash.

3. **The crypto audit is non-negotiable for v1.0.0.** Shipping unaudited E2EE to users is a
   liability. Budget for it now, schedule it for after E2EE stabilization.

4. **Apple IAP is a hard blocker for mobile launch.** No workaround — iOS app review will reject
   Stripe-only payment flows for digital goods.

5. **Phoenix Channel scaling needs proactive work, not reactive.** The 12+ channel types and
   presence tracking will not survive 10K users without lazy joins, assign minimization, and
   heartbeat tuning.

6. **The gamification economy needs rules before launch.** Post-launch XP rebalancing angers users.
   Set caps and diminishing returns before the first user earns a point.
