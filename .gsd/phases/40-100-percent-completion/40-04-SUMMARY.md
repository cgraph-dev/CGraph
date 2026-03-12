---
phase: 40-100-percent-completion
plan: 04
status: complete
---

# 40-04 Summary: Seed Data — Frames, Effects, Border Tracks

## Tasks Completed

1. **Task 1: Add 48 profile frames** (commit `b43ad110`)
   - 48 new frames appended (55→103 total)
   - Distribution: free=3, common=10, uncommon=10, rare=10, epic=7, legendary=5, mythic=3
   - Themes: celestial, nature, cyberpunk, steampunk, elemental, mythological, holiday, achievement
   - Unlock types: purchase=25, achievement=12, reputation=5, seasonal=3, default=3

2. **Task 2: Add 12 profile effects** (commit `b43ad110`)
   - 12 new effects appended (18→30 total)
   - Distribution: free=1, common=2, uncommon=2, rare=2, epic=2, legendary=1, mythic=2
   - New effects: calm-breeze, snowfall, ember-glow, fireflies, ocean-wave, cosmic-dust-ii,
     thunderstorm, sakura-petals, digital-rain, northern-lights, time-rift, genesis-burst

3. **Task 3: Border track migration + seed update** (commit `b43ad110`)
   - Migration 20260729100005: adds track string column + index, backfills from theme via CASE SQL
   - seed_borders.exs: track column added to all INSERT SQL statements
   - Theme→track mapping: 8bit→shop, kawaii→social, celestial→forum, nature→group,
     cyberpunk→messaging, gothic→security, minimal→shop, holographic→creator

## Files Created

- apps/backend/priv/repo/migrations/20260729100005_add_track_to_avatar_borders.exs

## Files Modified

- apps/backend/priv/repo/seeds/profile_frame_seeds.exs (48 new entries, header updated to 103)
- apps/backend/priv/repo/seeds/profile_effect_seeds.exs (12 new entries, header updated to 30)
- apps/backend/priv/repo/seeds/seed_borders.exs (track column added to all border SQL inserts)

## Deviations

- 3 frame slugs renamed to avoid conflicts: lightning-frame→lightning-bolt-frame,
  gear-frame→cogwheel-frame, dragon-frame→dragon-scale-frame
- cosmic-dust-ii used since cosmic-dust already existed
- Extended theme_to_track mapping to cover all actual themes (anime→social, japanese→forum,
  cosmic→creator, elemental→group)

## Verification

Backend compiles cleanly. All seed data additive and idempotent (ON CONFLICT: nothing).
