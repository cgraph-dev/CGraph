---
plan: 33-02
phase: 33-canonical-reconciliation
status: complete
completed_at: '2026-03-11'
commit_range: 55f36e70..82a43210
---

# Plan 33-02 Summary: Rarity Unification Frontend + Shared Cosmetics Types

## Objective

Unify rarity across frontend packages and create shared cosmetics types. Convert all
animation-constants rarity values from UPPERCASE to lowercase to match the backend canonical system.
Create the `RarityTier` type and full cosmetics type definitions in `shared-types`.

**ATOMIC_PLAN tasks covered:** P0.4 (Rarity Unification Frontend), P0.8 (Shared Cosmetics Types).

---

## Tasks Completed: 4 / 4

### Task 1: Create rarity.ts in shared-types (P0.4 partial)

**Commit:** `55f36e70` **Files created:**

- `packages/shared-types/src/rarity.ts`

**Description:** Created canonical rarity type mirroring `CGraph.Cosmetics.Rarity`:

- `RARITY_TIERS` const array (7-tier: free → common → uncommon → rare → epic → legendary → mythic)
- `RarityTier` type derived from the const array
- `RARITY_COLORS` record (Tailwind text-color classes)
- `RARITY_LABELS` record (human-readable labels)
- `RARITY_HEX_COLORS` record (hex values for non-Tailwind contexts like mobile)
- `rarityRank()` function returning numeric rank (0–6)
- `compareRarity()` function for array sorting

### Task 2: Create cosmetics.ts in shared-types (P0.8)

**Commit:** `4db925cb` **Files created:**

- `packages/shared-types/src/cosmetics.ts`

**Description:** Defined all cosmetic types importing `RarityTier` from `./rarity`:

- `CosmeticItem` — base interface with 16 fields (id, slug, name, description, surface, type,
  rarity, unlockType, unlockCondition, animationType, lottieFile, previewUrl, colors, available,
  createdAt)
- `CosmeticType` — 9-member union (border, title, badge, nameplate, profile_effect, chat_bubble,
  emoji_pack, sound_pack, theme)
- `CosmeticSurface` — 6-surface union (avatar_border, nameplate, profile_effect, chat_bubble, badge,
  title)
- `UnlockType` — 8-member union
- `AnimationType` — 5-member union
- `UnlockConditionType` — 14-member union
- `UnlockCondition` interface with type, threshold, description
- `UserCosmeticInventory` interface with cosmetic, equipped, acquiredAt, source
- `CosmeticVisibilityRule` interface with surface-specific show booleans

### Task 3: Convert animation-constants to lowercase rarity (P0.4)

**Commit:** `c5b206e6` **Files modified:**

- `packages/animation-constants/src/borders.ts` — Type union → lowercase + `uncommon` added; all 42
  registry entries converted; all Record keys converted
- `packages/animation-constants/src/registries/nameplates.ts` — Type union `MYTHICAL` → `mythic` +
  `uncommon` added; all registry entries converted; MYTHICAL comment → MYTHIC
- `packages/animation-constants/src/registries/profileEffects.ts` — Type union `MYTHICAL` →
  `mythic` + `uncommon` added; all 12 registry entries converted
- `apps/web/src/pages/customize/identity-customization/constants.ts` — Added `uncommon` entry to
  `RARITIES` array and `getRarityColor()` function
- `apps/web/src/pages/customize/identity-customization/types.ts` — Added `uncommon` to `Rarity` type
  union
- `apps/mobile/src/stores/themeStore.ts` — Added `free` rarity key to both light and dark color
  palettes (alongside existing `divine`)

### Task 4: Update shared-types barrel + re-export

**Commit:** `82a43210` **Files modified:**

- `packages/shared-types/src/index.ts` — Added `export * from './rarity'` and
  `export * from './cosmetics'`
- `packages/shared-types/package.json` — Added `./rarity` and `./cosmetics` entries to exports map

**Verification:** `npx tsc --noEmit` in shared-types — zero errors.

---

## Deviations

1. **RARITY_HEX_COLORS added to rarity.ts** — Not in original plan but needed for mobile contexts
   that use hex colors rather than Tailwind classes. Aligns with mobile `themeStore.ts` rarity
   colors.

2. **Mobile themeStore.ts: `divine` key preserved** — Rather than replacing `divine` with `free`,
   added `free` alongside `divine` to avoid breaking any existing mobile code that references
   `divine`. Both keys are present in light and dark palettes.

3. **borders.ts uncommon values** — Added interpolated values for uncommon tier in
   `BORDER_RARITY_GLOW_RADIUS` (2), `BORDER_RARITY_SCALE` (1.04), `BORDER_RARITY_LOTTIE_SPEED` (0),
   and `BORDER_RARITY_MAX_ANIMATIONS` (0), since uncommon was absent and needed sensible defaults
   between common and rare.

---

## Must-Haves Verification

| #   | Truth                                                                                                                                                             | Status |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | shared-types exports RarityTier, RARITY_TIERS, RARITY_COLORS, rarityRank, compareRarity                                                                           | ✅     |
| 2   | shared-types exports all cosmetics types: CosmeticItem, CosmeticType, UnlockType, UnlockCondition, UserCosmeticInventory, CosmeticSurface, CosmeticVisibilityRule | ✅     |
| 3   | animation-constants uses lowercase rarity values throughout: free, common, uncommon, rare, epic, legendary, mythic                                                | ✅     |
| 4   | MYTHICAL unified to mythic across all registries                                                                                                                  | ✅     |
| 5   | Web constants.ts includes UNCOMMON tier                                                                                                                           | ✅     |
| 6   | Mobile themeStore.ts rarity colors match shared definition (free key added)                                                                                       | ✅     |
| 7   | TypeScript compiles with zero errors (shared-types verified)                                                                                                      | ✅     |
| 8   | shared-types package.json exports map updated with ./rarity and ./cosmetics entries                                                                               | ✅     |
