# Phase 34: Parity + Mobile Nodes - Context

**Gathered:** 2026-03-11 **Status:** Ready for execution

<domain>
## Phase Boundary

Every mobile user can use Nodes (wallet, tipping, unlock, shop, withdrawal). Web gets tip buttons on
DMs + profiles and content unlock overlay. Mobile Secret Chat fully implemented. Mobile
customization parity with web (effects, themes, layouts, discovery). Corresponds to ATOMIC_PLAN v2.1
Phase 1 (Tasks 1.1–1.30, 3 parallel tracks).

Version target: v1.1.0

</domain>

<decisions>
## Implementation Decisions

### Track 1A: Mobile Nodes + Web Tips

- Backend tip minimum: `@min_tip 10` with `{:error, :tip_below_minimum}`
- Tip rate limiting: use existing `RateLimiterV2` with `:strict` tier on NodesController `:tip`
  action — do NOT create a new rate limiter plug (3 already exist in plugs/)
- HeldNodesReleaseWorker: wraps existing `CGraph.Nodes.release_held_nodes/0` (already implemented).
  Oban cron daily 03:00 UTC, `:payments` queue
- Mobile follows `../lib/api` pattern (NOT `@cgraph/api-client`)
- Mobile store: `create()` with manual AsyncStorage (NO persist middleware)
- Mobile wallet screen named `nodes-wallet-screen.tsx` to avoid collision with WalletAuth
  (`lib/wallet/` = WalletConnect, NOT currency)
- Web tip button on forum posts + user profiles (NOT DMs — DMs feature-flagged)
- Content unlock: extract existing inline GlassCard block from thread-view.tsx (L148–184) into
  ContentUnlockOverlay

### Track 1B: Mobile Secret Chat

- Import PQXDH from existing `lib/crypto/pq-bridge.ts` — do NOT recreate
- ⚠️ pq-bridge is NOT barrel-exported from crypto/index.ts — import directly from
  `@/lib/crypto/pq-bridge`
- Follow `screens/` + `stores/` + `services/` pattern (NOT empty `modules/`)
- 12 secret themes (void, redacted, midnight, signal, ghost, cipher, onyx, eclipse, static, shadow,
  obsidian, abyss) — port from web themeRegistry.ts
- Ghost mode: auto-delete after configurable time
- Panic wipe: one-tap local purge + server wipe signal
- Screenshot detection: FLAG_SECURE (Android), screen recording notification (iOS)

### Track 1C: Mobile Parity

- 5 discovery feed modes: trending, fresh, following, recommended, nearby
- Theme categories: Profile, Chat, Forum, App + Secret
- New customize screens EXTEND existing system — verify no UI overlap
- Privacy settings expansion: 6 → 15 toggles (web parity)
- Friend favorites + nicknames (mobile→web parity)

### Shared Packages

- `@cgraph/shared-types/nodes.ts` — NodeWallet, NodeTransaction, NodeBundle ALREADY EXIST. Only add
  TipContext.
- `@cgraph/api-client/nodes.ts` for web consumption only (NEW file — endpoint constants already in
  endpoints.ts)
- Consider NodesChannel in `@cgraph/socket` for real-time balance updates
- MIN_TIP = 10 must be added to shared-types/nodes.ts (34-01 Task 4) before 34-02 can import it

</decisions>

<specifics>
## Specific Ideas

- Tip presets: 10, 50, 100, 500 + custom input
- "Tip again" shortcut: remembers last tip amount per recipient
- Success haptic feedback + confetti animation on mobile tip
- Wallet empty state: "Your Nodes journey starts here"
- Popular bundle gets "🔥" badge
- Tip confirmation shows "Creator receives 80%"

</specifics>

<deferred>
## Deferred Ideas

- Mobile IAP for Nodes (StoreKit 2 / Google Play Billing) — separate mobile phase
- NodesChannel real-time delivery — evaluate during implementation
- Unified mobile/web API client — future migration
- DM tipping on mobile (currently forums + profiles only)

</deferred>

---

_Phase: 34-parity-mobile-nodes_ _Context gathered: 2026-03-11_
