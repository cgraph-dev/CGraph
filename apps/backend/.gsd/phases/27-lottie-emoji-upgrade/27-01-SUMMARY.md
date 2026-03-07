---
phase: 27-lottie-emoji-upgrade
plan: 01
subsystem: api
tags: [elixir, ecto, phoenix, lottie, cachex, animations, emoji]

requires:
  - phase: none
    provides: greenfield context
provides:
  - CGraph.Animations context module (Lottie schema, manifest, cache)
  - Lottie assets Ecto schema with binary_id primary keys
  - LottieManifest compile-time codepoint-to-CDN mapping
  - LottieCache Cachex layer with 24h TTL
  - REST API for animation catalog (6 endpoints)
  - Lottie fields on custom emoji schemas (forums, groups)
  - 2 database migrations (lottie_assets table + emoji table alterations)
  - Enriched Emoji module with Lottie animation data
  - Updated JSON views with animation metadata
  - Comprehensive test suite (30+ tests)
affects: [27-02-seeding, 27-03-web-lottie, 27-04-avatar-borders, 27-05-mobile-lottie]

tech-stack:
  added: []
  patterns: [compile-time-manifest, cachex-cache-layer, public-api-relaxed-pipeline]

key-files:
  created:
    - lib/cgraph/animations/lottie.ex
    - lib/cgraph/animations/lottie_manifest.ex
    - lib/cgraph/animations/lottie_cache.ex
    - lib/cgraph_web/controllers/api/v1/lottie_controller.ex
    - lib/cgraph_web/controllers/api/v1/lottie_json.ex
    - lib/cgraph_web/router/animation_routes.ex
    - test/cgraph/animations/lottie_test.exs
    - test/cgraph/animations/lottie_manifest_test.exs
    - test/cgraph_web/controllers/api/v1/lottie_controller_test.exs
  modified:
    - lib/cgraph/messaging/emoji.ex
    - lib/cgraph/forums/custom_emoji.ex
    - lib/cgraph/groups/group_emoji.ex
    - lib/cgraph/groups/custom_emoji.ex
    - lib/cgraph/supervisors/cache_supervisor.ex
    - config/config.exs

key-decisions:
  - 'Lottie manifest built at compile time from emoji_unicode16.json — zero runtime lookups'
  - 'Animation endpoints use api_relaxed pipeline (public, no auth) with 86400s cache headers'
  - 'LottieCache registered in CacheSupervisor alongside existing 4 caches'
  - 'Schema uses @primary_key {:id, :binary_id, autogenerate: true} matching project convention'

patterns-established:
  - 'Compile-time manifest: load JSON at compile, build map, expose functions'
  - 'Cachex cache layer: get_or_fetch pattern with configurable TTL'
  - 'Public API scope: /api/v1/animations/* through api_relaxed pipeline'

duration: 15min
completed: 2026-03-07
---

# Plan 27-01: Backend Lottie Infrastructure Summary

**Full backend animation layer — Lottie schema, manifest, cache, REST API, and emoji schema upgrades
shipped.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-07
- **Completed:** 2026-03-07
- **Tasks:** 8/8
- **Files created:** 9
- **Files modified:** 6

## Accomplishments

1. **CGraph.Animations context** — New Ecto schema `lottie_assets` with 15 fields covering
   codepoints, CDN URLs (lottie/webp/gif), metadata, and asset type classification
   (emoji/border/effect/sticker).
2. **LottieManifest** — Compile-time module that loads `emoji_unicode16.json` and builds
   codepoint-to-CDN URL mappings. Supports `get_url/2`, `emoji_to_codepoint/1`,
   `codepoint_to_emoji/1`, `enrich_emoji/1`.
3. **LottieCache** — Cachex-backed cache (`:lottie_cache`) with 24h TTL, registered in
   CacheSupervisor.
4. **LottieController + routes** — 6 REST endpoints under `/api/v1/animations/` (emojis list,
   search, show, categories, borders placeholder, effects placeholder) with CDN-friendly cache
   headers.
5. **Emoji schema upgrades** — Added `lottie_url` and `animation_format` fields to `custom_emojis`,
   `group_emojis`, and `group_custom_emojis` tables via migration.
6. **Emoji module enrichment** — `CGraph.Messaging.Emoji` now delegates `has_animation?/1` to
   LottieManifest and supports animation-aware search.
7. **JSON view updates** — All emoji JSON views include `lottie_url` and `animation_format`;
   reaction JSON includes full animation CDN URLs.
8. **Test suite** — 30+ tests covering schema validation, CRUD, manifest functions, and all
   controller endpoints.

## Technical Notes

- CDN base URL configurable via `config :cgraph, :lottie_cdn_base_url`
- Manifest maps all emojis optimistically; actual animated subset determined by manifest in plan
  27-02
- Border and effect endpoints return "coming soon" placeholders for plans 27-04

## Issues

None.
