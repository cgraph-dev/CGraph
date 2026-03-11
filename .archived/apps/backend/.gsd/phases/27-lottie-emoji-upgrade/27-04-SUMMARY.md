# Plan 27-04 Summary: Avatar Borders & Gamification Lottie Integration

## Result: COMPLETE (7/7 tasks)

## Tasks Completed

### Task 1: Add Lottie animation type to avatar border schema

- Modified `lib/cgraph/gamification/avatar_border.ex`: added `lottie_asset_id`, `lottie_url`,
  `lottie_config` fields; added `"lottie"` to `animation_types` enum
- Created migration for new Lottie columns on `avatar_borders` table
- **Commit:** b05047cd

### Task 2: Create LottieBorderRenderer component

- Created `apps/web/src/lib/lottie/lottie-border-renderer.tsx` (280 lines)
- Circular Lottie ring rendered around avatars using radial-gradient clip masking
- IntersectionObserver limits max 2 concurrent animations in viewport
- Canvas renderer for avatars <64px, SVG for >=64px
- Auto-pause when scrolled out of view
- Reduced-motion fallback to static ring
- **Commit:** a22765ec

### Task 3: Update border renderer pipeline for Lottie support

- Modified `border-renderer.tsx`: added LottieBorderRenderer import + routing when data has
  `lottieUrl`
- Modified `animated-border.tsx`: added `'lottie'` to `BorderAnimationType` union
- Modified `border-preview.tsx`: added "Lottie" label for lottie animation type
- Modified `avatar-border-renderer.tsx`: added Lottie delegation when border has `lottieUrl`
- **Commit:** 0fe58b3e

### Task 4: Add Lottie border asset directory with manifest and documentation

- Created `priv/data/lottie_borders/manifest.json`: 6 initial borders (fire-ring, lightning-aura,
  aurora-borealis, neon-pulse, sakura-petals, cosmic-swirl) with rarity, theme, unlock conditions,
  pricing
- Created `priv/data/lottie_borders/README.md`: full docs on creating, testing, registering, and
  deploying Lottie borders
- **Commit:** 459c6fa8

### Task 5: Update avatar border types and store

- Updated `types/avatar-borders.ts`: added `'lottie'` to `BorderAnimationType`, added `lottieUrl`,
  `lottieAssetId`, `lottieConfig` fields to `AvatarBorderConfig`
- Updated `data/avatar-borders.ts`: added comment placeholder noting Lottie borders loaded
  dynamically from API
- Updated `avatarBorder-types.ts`: added `lottieBorders`, `lottieBordersFetched` state,
  `animationType` filter, `fetchLottieBorders` action
- Updated `avatarBorder-actions.ts`: implemented `createFetchLottieBorders` — fetches from GET
  /api/v1/cosmetics/borders?animation_type=lottie, maps to AvatarBorderConfig, merges into
  allBorders
- Updated `avatarBorderStore.impl.ts`: wired fetchLottieBorders, added new state fields to initial +
  reset
- **Commit:** 73fae7be

### Task 6: Update cosmetics settings UI and backend

- Updated `avatar-borders-section.tsx`: added All/CSS/Lottie animation type filter buttons, calls
  fetchLottieBorders on mount
- Updated `chat-effects-section.tsx`: added Lottie effects coming-soon banner
- Updated `animation-sets-section.tsx`: added Lottie badge for animation sets with
  `source: 'lottie'`
- Updated `types.ts` (effects-customization): added `source` and `lottieUrl` fields to
  `AnimationSet`
- Updated `cosmetics_controller.ex`: added `?animation_type=lottie` query param filter to
  `list_borders`, added `lottie_url`/`lottie_config` to `sync_equipped_border` config
- Updated `serializers.ex`: `serialize_border` now includes `lottieUrl`, `lottieAssetId`,
  `lottieConfig` when `animation_type == "lottie"`
- **Commit:** 6dc2e804

### Task 7: Soft-deprecate CSS particle system

- Updated `border-particle-system.tsx` barrel: added `@deprecated` JSDoc
- Updated `border-particle-system/border-particle-system.tsx`: added `@deprecated` JSDoc to module
  and component, added dev-mode `console.warn` on first render
- Existing particle borders continue working — deprecation is informational only
- **Commit:** 4b234c85

## Files Created

- `apps/backend/priv/data/lottie_borders/manifest.json`
- `apps/backend/priv/data/lottie_borders/README.md`

## Files Modified

- `lib/cgraph/gamification/avatar_border.ex`
- `apps/web/src/lib/lottie/lottie-border-renderer.tsx`
- `apps/web/src/modules/gamification/components/avatar-border/border-renderer.tsx`
- `apps/web/src/modules/gamification/components/avatar-border/animated-border.tsx`
- `apps/web/src/modules/gamification/components/avatar-border/border-preview.tsx`
- `apps/web/src/modules/social/components/avatar/avatar-border-renderer.tsx`
- `apps/web/src/types/avatar-borders.ts`
- `apps/web/src/data/avatar-borders.ts`
- `apps/web/src/modules/gamification/store/avatarBorder-types.ts`
- `apps/web/src/modules/gamification/store/avatarBorder-actions.ts`
- `apps/web/src/modules/gamification/store/avatarBorderStore.impl.ts`
- `apps/web/src/modules/settings/components/cosmetics-settings/avatar-borders-section.tsx`
- `apps/web/src/modules/settings/components/cosmetics-settings/chat-effects-section.tsx`
- `apps/web/src/pages/customize/effects-customization/animation-sets-section.tsx`
- `apps/web/src/pages/customize/effects-customization/types.ts`
- `apps/backend/lib/cgraph_web/controllers/cosmetics_controller.ex`
- `apps/backend/lib/cgraph_web/controllers/cosmetics_controller/serializers.ex`
- `apps/web/src/modules/social/components/avatar/border-particle-system.tsx`
- `apps/web/src/modules/social/components/avatar/border-particle-system/border-particle-system.tsx`

## Decisions

- Lottie borders coexist with CSS borders — no existing borders removed
- Lottie borders fetched dynamically from API, not hardcoded
- Particle system soft-deprecated with JSDoc + dev console.warn, not deleted
- Backend serializer conditionally includes Lottie fields only for lottie animation type
