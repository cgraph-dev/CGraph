# Phase 35: Cosmetics + Unlock Engine - Context

**Gathered:** 2026-03-11 **Status:** Ready for execution

<domain>
## Phase Boundary

Every cosmetic type has a backend schema. Unified inventory replaces 4 join tables. Unlock engine
evaluates conditions and grants rewards automatically. Visibility matrix controls what renders
where. Seasonal system rotates cosmetics. Full seed data for all 340+ items. Corresponds to
ATOMIC_PLAN v2.1 Phase 2 (Tasks 2.1–2.35, 4 tracks).

Version target: v1.2.0

</domain>

<decisions>
## Implementation Decisions

### Track 2A: Backend Schemas

- Badge schema: 70 badges, 12 categories, JSONB unlock_condition
- Nameplate schema: 45 nameplates, gradient colors, animation types
- Profile Effect: standalone schema (not embedded in profile_theme)
- Profile Frame: entirely new cosmetic type (50+ items)
- Unified `user_cosmetic_inventory`: replaces `user_avatar_border`, `user_chat_effect`,
  `user_profile_theme`, `user_title`
- Rarity: `:string` + `validate_inclusion/3` using `CGraph.Cosmetics.Rarity.string_values()`
- Cosmetics context follows gamification repository pattern OR flat module (document in ADR)
- Controller Pattern A (top-level) for all gamification-domain controllers
- Serializers in `controllers/{name}/serializers/` subdirectory
- Routes in `gamification_routes.ex` macro module

### Track 2B: Unlock Engine

- Event-driven architecture: UnlockEngine listens for user actions
- Extends existing `achievement_triggers.ex` pattern
- Evaluators: 14 condition types (messages_sent, posts_created, etc.)
- Property-based tests (StreamData) for evaluators
- CosmeticGrantWorker: Oban `:cosmetics` queue, batch processing
- SeasonalRotationWorker: Oban `:cosmetics` queue, handles expiration
- Visibility matrix: 6 surfaces, per-cosmetic-type show/hide rules

### Track 2C: Frontend

- Web: cosmetics inventory page, shop page, equip flow, badge display
- Mobile: basic equip/view via existing customize screens
- CosmeticRenderer: surface-aware rendering component

### Track 2D: Seed Data

- All seeds from canonical manifest (P0.1)
- 42 borders, 70 titles, 70 badges, 45 nameplates, 50+ frames, 10 effects, 25 themes
- Each item has complete unlock_condition JSON

### Data Migration (2.35)

- 4 join tables → unified inventory with correct cosmetic_type mapping
- Dual-read for 2 releases, then drop old tables in Phase 37
- CosmeticsController updated to query unified table

</decisions>

<specifics>
## Specific Ideas

- UnlockEngine evaluator registry: plug-in new condition types without modifying core
- Seasonal rotation: 30-day seasons, exclusive items with timer
- Badge slots: up to 5 equipped badges with display order
- Nameplate snapshot for forum posts (used in Phase 37)

</specifics>

<deferred>
## Deferred Ideas

- Cosmetic trading/marketplace (Phase 37 or later)
- Cosmetic gifting UI (transaction types exist, no UI)
- Custom user-created titles with moderation (Phase 37)
- Drop old join tables (Phase 37, after 2-release sunset)

</deferred>

---

_Phase: 35-cosmetics-unlock-engine_ _Context gathered: 2026-03-11_
