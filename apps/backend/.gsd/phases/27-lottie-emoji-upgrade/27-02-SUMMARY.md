---
phase: 27-lottie-emoji-upgrade
plan: 02
subsystem: animations
tags: [lottie, noto-emoji, cdn, manifest, seeding, emoji]

requires:
  - phase: 27-lottie-emoji-upgrade/27-01
    provides: lottie_assets schema and CGraph.Animations.Lottie module

provides:
  - Noto Emoji CDN scraper module (CGraph.Animations.NotoScraper)
  - Curated animated emoji manifest (164 emojis across 8 categories)
  - Mix seed task for lottie_assets table (mix cgraph.lottie.seed)
  - Enriched emoji_unicode16.json with has_animation/animation_codepoint fields
  - Comprehensive test suite for scraper and manifest validation

affects: [emoji-rendering, lottie-playback, animation-catalog, messaging]

tech-stack:
  added: []
  patterns:
    - "CDN scraper with HEAD request verification, exponential backoff, rate limiting"
    - "Curated manifest JSON as compile-time data source"
    - "Mix task for idempotent database seeding (upsert pattern)"
    - "Compile-time emoji enrichment via JSON dataset fields"

key-files:
  created:
    - lib/cgraph/animations/noto_scraper.ex
    - priv/data/noto_emoji_manifest.json
    - lib/mix/tasks/cgraph.lottie.seed.ex
    - test/cgraph/animations/noto_scraper_test.exs
  modified:
    - priv/data/emoji_unicode16.json
    - lib/cgraph/messaging/emoji.ex

key-decisions:
  - "Curated manifest instead of live CDN scraping — avoids hammering Google Fonts CDN during build; scraper exists for future refresh"
  - "164 animated emojis selected from known Noto Emoji Animation set across all 8 categories"
  - "file_size_bytes set to null in manifest — will be populated on first live CDN scrape"
  - "Seed task uses get_by + create/update pattern since Lottie schema upsert may not exist yet (parallel plan 27-01)"
  - "Test suite uses ExUnit.Case (no DB) since all tests are pure unit/file-based"

patterns-established:
  - "NotoScraper: CDN verification with Req HEAD requests, Task.async_stream concurrency, exponential backoff"
  - "Manifest JSON: top-level metadata + emojis array with relative format paths"
  - "Emoji enrichment: has_animation boolean + animation_codepoint hex string in compile-time JSON"

duration: 12min
completed: 2026-03-07
---

# Plan 27-02: Noto Emoji Manifest and Seeding Infrastructure

**Built CDN scraper, curated 164-emoji animation manifest, seed task, and enriched the emoji dataset with animation metadata.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-07T14:15:00Z
- **Completed:** 2026-03-07T14:27:00Z
- **Tasks:** 5 completed
- **Files created:** 4
- **Files modified:** 2

## Accomplishments

- Created `CGraph.Animations.NotoScraper` with CDN verification, concurrent scraping, rate limiting, and exponential backoff
- Generated curated manifest with **164 animated emojis** across 8 categories (Smileys: 85, People: 29, Animals: 14, Food: 10, Activities: 9, Travel: 6, Objects: 6, Symbols: 5)
- Built `mix cgraph.lottie.seed` task with dry-run mode, category filtering, and upsert semantics
- Enriched all 228 entries in `emoji_unicode16.json` with `has_animation` and `animation_codepoint` fields (164 animated, 64 static)
- Updated `CGraph.Messaging.Emoji` module to include animation fields in compile-time data
- Wrote 25 tests covering codepoint conversion, URL building, manifest validation, and dataset enrichment

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Noto Emoji CDN scraper** — `bb7f104c` (feat)
2. **Task 2: Generate Noto Emoji Animation manifest** — `5e890d8e` (feat)
3. **Task 3: Create Mix seed task** — `6005014d` (feat)
4. **Task 4: Enrich emoji_unicode16.json with animation data** — `512895f1` (feat)
5. **Task 5: Write scraper and manifest tests** — `caa4ef60` (test)

## Files Created/Modified

- `lib/cgraph/animations/noto_scraper.ex` — CDN scraper with verify_codepoint, scrape_all, build_manifest, emoji_to_hex
- `priv/data/noto_emoji_manifest.json` — 164-entry curated manifest mapping animated emoji codepoints to CDN URLs
- `lib/mix/tasks/cgraph.lottie.seed.ex` — Mix task to seed lottie_assets from manifest with --dry-run and --category options
- `test/cgraph/animations/noto_scraper_test.exs` — 25 tests for scraper functions, manifest structure, and enriched dataset
- `priv/data/emoji_unicode16.json` — Enriched with has_animation (bool) and animation_codepoint (hex string) fields
- `lib/cgraph/messaging/emoji.ex` — Updated compile-time map to include has_animation and animation_codepoint

## Decisions Made

1. **Curated over scraped manifest** — Manually curated 164 well-known animated emojis instead of running a live CDN scrape. The scraper module exists for future refresh operations. This avoids CDN dependencies during build/CI.
2. **file_size_bytes is null** — Will be populated when the scraper is run against the live CDN. Doesn't affect seed task or rendering.
3. **Seed task uses get_by + create/update** — Since plan 27-01 runs in parallel and may not have added an `upsert/1` function to the Lottie schema, the seed task implements its own upsert pattern via `Repo.get_by` + `Lottie.create` / `Lottie.update`.
4. **Tests use ExUnit.Case** — No database dependency for unit tests, ensuring they run even without Postgres.

## Deviations from Plan

### Minor Adjustments

**1. Manifest file_size_bytes set to null**
- **Found during:** Task 2 (manifest generation)
- **Issue:** Can't determine actual file sizes without live CDN requests
- **Fix:** Set to null; scraper's build_manifest/0 will populate on live run
- **Verification:** Manifest validates, seed task handles null gracefully

**2. Seed task implements own upsert instead of Lottie.upsert/1**
- **Found during:** Task 3 (seed task)
- **Issue:** Plan 27-01 (parallel) creates the Lottie schema; unclear if it includes an upsert function
- **Fix:** Seed task uses Repo.get_by + create/update pattern directly
- **Verification:** Compiles correctly, handles both new and existing records
