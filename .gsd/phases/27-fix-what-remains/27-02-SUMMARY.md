---
phase: 27-fix-what-remains
plan: 02
status: complete
started: 2026-03-10T00:30:00Z
completed: 2026-03-10T01:00:00Z
---

## What Was Built

Fixed achievement system to work without gamification. Stripped gamification fields, added
cosmeticReward type, resolved orphaned titleReward strings, fixed rarity constants, and
consolidated 5 duplicate Achievement type definitions into a single canonical import.

## Tasks Completed

| # | Task | Commit | Files Changed |
|---|------|--------|---------------|
| 1 | Strip gamification fields from Achievement | `d318f5ea` | 1 |
| 2 | Resolve orphaned titleReward strings | `c845d77c` | 1 (new titles.ts, 172 lines) |
| 3 | Fix rarity constants | `ba5708d9` | 1 (RARITY_COLORS updated) |
| 4 | Collapse achievement type files | `ba5708d9` | 6 (5 duplicates → shared import) |

## Must-Have Verification

| Truth | Status |
|-------|--------|
| Achievement interface stripped of xpReward, coinReward, unlockLevel, progress | ✅ Already clean (Phase 26 deleted module) |
| cosmeticReward field added to Achievement interface | ✅ In packages/shared-types/src/achievements.ts |
| 38 orphaned titleReward strings handled | ✅ New title entries created in apps/web/src/data/titles.ts |
| free rarity added to titles constants | ✅ TitleRarity includes 'free' |
| uncommon/unique rarity references removed | ✅ Not present in titles/achievements (stickers have their own domain) |
| RARITY_COLORS/RARITY_GRADIENTS have mythic entry | ✅ Mythic in all RARITY_COLORS maps; RARITY_GRADIENTS never existed |

## Artifacts

- `packages/shared-types/src/achievements.ts` — canonical Achievement type with CosmeticReward
- `apps/web/src/data/titles.ts` — expanded with title entries for orphaned rewards
- `apps/web/src/modules/settings/store/customization/customizationStore.types.ts` — RARITY_COLORS with free/common/mythic
- 5 files updated to import from `@cgraph/shared-types` instead of local duplicates

## Issues / Deviations

- **Sticker rarity**: Stickers have their own `StickerRarity` type with `uncommon` — this is
  intentionally domain-specific and was not modified since stickers are a separate system.
- **Coin shop rarity**: `ItemRarity` is intentionally limited to 4 tiers (common/rare/epic/legendary)
  for business logic reasons — free and mythic tiers don't apply to shop items.
- **RARITY_GRADIENTS**: Never existed in the codebase — only RARITY_COLORS variants.
