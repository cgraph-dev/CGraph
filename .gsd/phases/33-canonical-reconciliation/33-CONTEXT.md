# Phase 33: Canonical Reconciliation - Context

**Gathered:** 2026-03-11 **Status:** Ready for execution

<domain>
## Phase Boundary

Resolve all source document conflicts, unify the rarity system across backend + frontend, audit API
endpoints, establish canonical cosmetics manifest, reconcile profile themes, create shared types,
and fix infrastructure prerequisites (exports map, Oban queues). This is the foundation phase — NO
feature work, only prerequisite alignment. Corresponds to ATOMIC_PLAN v2.1 Pre-Phase (P0.1–P0.10).

Version target: v1.0.1

</domain>

<decisions>
## Implementation Decisions

### Rarity Unification

- **7-tier system:** `free | common | uncommon | rare | epic | legendary | mythic`
- Backend uses `:string` + `validate_inclusion/3` (NOT `Ecto.Enum`) — matches existing schemas
- Frontend shared type `RarityTier` in `@cgraph/shared-types/rarity`
- Animation-constants registries: convert ALL uppercase values to lowercase
- `MYTHICAL` unified to `mythic` across all registries

### Cosmetics Manifest

- Badges: **70** (Cosmetics doc 60 + Forums doc 10)
- Titles: **70** (Cosmetics 55 + Forums 15)
- Nameplates: **45** (Cosmetics 30 + Forums 15)
- Profile Themes: **25** (5 free + 5 earned + 15 shop)
- Name Styles: **50** (8 fonts + 12 effects + 15 colors + 10 prefixes + 5 suffixes)
- Profile Frames: **50+** (Forums doc)
- Forum Themes: **10** (Neon Cyber → Zen Garden)
- Each item: `id`, `slug`, `name`, `rarity`, `category`, `track`, `unlock_type`, `unlock_condition`,
  `nodes_cost`

### Profile Themes

- Backend 22 presets vs frontend 18 themes — ZERO overlap in naming
- Merge to unified 25-theme set with consistent slugs
- Migration maps existing user selections to nearest match
- 5 free + 5 earned + 15 shop

### Shared Types Architecture

- `@cgraph/shared-types` exports map needs entries for new files
- New domain files: `rarity.ts`, `cosmetics.ts`, `nodes.ts`, `forums.ts`
- 4 existing orphaned files need re-export: `forum-emoji.ts`, `forum-moderation.ts`,
  `forum-plugin.ts`, `forum-rss.ts`
- `@cgraph/api-client` shifts from generic HTTP client to typed SDK

### Oban Queues

- 6 new queues needed: `payments:5`, `cosmetics:10`, `reputation_calc:5`, `forum_indexing:10`,
  `critical:20`, `unlocks:10`
- Added to existing 22-queue config
- Required before Phase 34+ workers deploy

</decisions>

<specifics>
## Specific Ideas

- Exchange rate: 1 Node = €0.008 — defined in backend config + shared-types constant
- Profile theme migration: offer "legacy" fallback if no close match
- Canonical manifest serves as seed data source for Phase 35 seeding
- API endpoint catalog includes all backend routes cross-referenced with web/mobile usage

</specifics>

<deferred>
## Deferred Ideas

- Full cosmetics API-client typed methods (Phase 35)
- Mobile API client unification (currently uses `../lib/api` pattern, not `@cgraph/api-client`)
- Deprecation of individual join tables (Phase 35/37)

</deferred>

---

_Phase: 33-canonical-reconciliation_ _Context gathered: 2026-03-11_
