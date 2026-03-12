---
phase: 35-cosmetics-unlock-engine
plan: 06
status: complete
started: 2026-03-12
completed: 2026-03-12
commits:
  - f4f1cd51 feat(35-06): seed 70 badges and 70 titles matching manifest rarity distribution
  - bea7ce1f feat(35-06): seed 45 nameplates (committed with 35-04 batch)
  - c7a20a7b feat(35-06): seed 18 profile effects, 55 profile frames, and 50 name styles
---

# Plan 35-06 Summary: Cosmetic Seed Data

## Objective

Create seed data for all cosmetic types matching the COSMETICS_MANIFEST.json rarity distribution.
Populates the database with the full catalogue of cosmetics for testing and production.

## Tasks Completed

### Task 1: Badge + Title Seeds

- **badge_seeds.exs** — 70 badges matching manifest exactly
  - free: 10, common: 15, uncommon: 15, rare: 12, epic: 8, legendary: 6, mythic: 4
  - Each with slug, name, description, icon_url, rarity, category, track, unlock_type,
    unlock_condition (map), nodes_cost
  - Uses `Repo.insert_all` with `on_conflict: :nothing, conflict_target: :slug`
  - Binary UUIDs via `Ecto.UUID.generate()`, timestamps via `DateTime.truncate(:microsecond)`

- **title_seeds.exs** — 70 titles matching manifest exactly
  - free: 5, common: 15, uncommon: 15, rare: 15, epic: 10, legendary: 6, mythic: 4
  - Rarity-keyed color palette (free=#b0b0b0 → mythic=#e6cc80)
  - Uses `Repo.insert_all` with `on_conflict: :nothing, conflict_target: :slug`
  - Timestamps truncated to second (matches `utc_datetime` type)

### Task 2: Border Verification + Nameplate Seeds

- **seed_borders.exs** — Verified: 42 borders already present (4 free + 8 common + 10 rare + 8
  epic + 8 legendary + 4 mythic). No modifications needed.

- **nameplate_seeds.exs** — 45 nameplates matching manifest exactly
  - free: 5, common: 10, uncommon: 10, rare: 8, epic: 5, legendary: 4, mythic: 3
  - Varied backgrounds, text colors, border styles, animated flags
  - Rarity-based style defaults (text_color, border_style)

### Task 3: Effect + Frame + Name Style Seeds

- **profile_effect_seeds.exs** — 18 profile effects (NEW type, not in manifest)
  - free: 2, common: 4, uncommon: 4, rare: 3, epic: 2, legendary: 2, mythic: 1
  - Types: particle (8), aura (7), trail (3)
  - Rich JSONB config per effect (color, intensity, particles, glow, distortion)

- **profile_frame_seeds.exs** — 55 profile frames matching manifest exactly
  - free: 5, common: 10, uncommon: 10, rare: 10, epic: 8, legendary: 7, mythic: 5
  - Includes animated variants (all epic+ are animated, some uncommon/rare)

- **name_style_seeds.exs** — 50 name styles matching manifest exactly
  - free: 5, common: 10, uncommon: 10, rare: 10, epic: 7, legendary: 5, mythic: 3
  - Gradient color schemes, font families, animation types
  - Prefix/suffix decorations at rare+ tiers

## Must-Have Verification

| Requirement                                        | Status                 |
| -------------------------------------------------- | ---------------------- |
| Badge seeds: 70 badges matching manifest           | ✅ 70 badges           |
| Title seeds: 70 titles per manifest                | ✅ 70 titles           |
| Border seeds: 42 borders exist                     | ✅ Verified (existing) |
| Nameplate seeds: 45 with variety                   | ✅ 45 nameplates       |
| Profile effect seeds: 15-20 as NEW type            | ✅ 18 effects          |
| Profile frame seeds: 55 per manifest               | ✅ 55 frames           |
| Name style seeds: 50 per manifest                  | ✅ 50 styles           |
| All use Repo.insert_all with on_conflict: :nothing | ✅ All files           |
| Rarity distribution matches manifest               | ✅ Verified per type   |

## Files Created/Modified

- `apps/backend/priv/repo/seeds/badge_seeds.exs` (new)
- `apps/backend/priv/repo/seeds/title_seeds.exs` (new)
- `apps/backend/priv/repo/seeds/nameplate_seeds.exs` (new)
- `apps/backend/priv/repo/seeds/profile_effect_seeds.exs` (new)
- `apps/backend/priv/repo/seeds/profile_frame_seeds.exs` (new)
- `apps/backend/priv/repo/seeds/name_style_seeds.exs` (new)
- `apps/backend/priv/repo/seeds/seed_borders.exs` (verified, unchanged)
