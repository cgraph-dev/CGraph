---
phase: 28-complete-cosmetics
plan: 02
status: complete
completed: 2026-03-10
commits:
  - 305b20fc  # feat(28-02): build lottie-overlay component for profile effects
  - ee077b74  # feat(28-02): wire profile effects lottie-overlay to profile-card
  - 7405e4bc  # fix(28-02): resolve profile-card-preview typescript errors
---

# Plan 28-02 Summary — Profile Effects LottieOverlay

## Objective
Add profile effects rendering to the ProfileCard using a new LottieOverlay component,
wire `equippedProfileEffect` to `PROFILE_EFFECT_REGISTRY`, and verify all 12 effects.

## Tasks Completed

### Task 1: Build LottieOverlay component ✓
- **Created** `apps/web/src/components/lottie/lottie-overlay.tsx` (175 lines)
- **Created** `apps/web/src/components/lottie/index.ts` (barrel export)
- Component accepts `effectId` prop, resolves via `getProfileEffectById()` from `@cgraph/animation-constants`
- Uses `getProfileEffectSource()` from the web asset map to get Lottie JSON data
- Dynamically imports `lottie-web/build/player/lottie_light` (same pattern as `lottie-border-renderer.tsx`)
- Renders as `position: absolute; inset: 0; pointer-events: none` overlay
- Supports `opacity`, `blendMode`, `speed`, `className` props
- Respects `prefers-reduced-motion`, pauses via `IntersectionObserver`
- Concurrency budget: max 4 simultaneous overlays
- Gracefully returns `null` for `effect_none`, missing IDs, or errors

### Task 2: Wire LottieOverlay to ProfileCardPreview ✓
- **Modified** `profile-card-preview.tsx`: imported `LottieOverlay` from `@/components/lottie`
- Renders `<LottieOverlay effectId={settings.equippedProfileEffect} speed={speedMultiplier} />`
  inside the card's `motion.div`, after `ProfileContent`, overlaying the entire card
- `equippedProfileEffect` was already read from the customization store (no new selector needed)
- `speed` is passed through so effects match the user's chosen animation speed

### Task 3: Verify TypeScript & Registry Integrity ✓
- **Fixed** pre-existing TS errors in `profile-card-preview.tsx`:
  - Removed duplicate `avatarBorderType` property in the store selector
  - Changed `settings.profileTheme` → `settings.selectedProfileThemeId` (3 occurrences)
- `npx tsc --noEmit` passes cleanly for all LottieOverlay and ProfileCardPreview files
- `PROFILE_EFFECT_REGISTRY` confirmed: **12 entries** (1 none + 11 effects)
- All 11 non-none entries have valid `lottieFile` references
- Web asset map (`effectMap.ts`) has matching entries for all 11 effect IDs

## Artifacts
| File | Status | Lines |
|------|--------|-------|
| `apps/web/src/components/lottie/lottie-overlay.tsx` | NEW | 175 |
| `apps/web/src/components/lottie/index.ts` | NEW | 7 |
| `apps/web/src/modules/settings/components/customize/live-preview-panel/profile-card-preview.tsx` | MODIFIED | +11 −4 |

## Architecture Notes
- LottieOverlay uses `animationData` (bundled JSON) rather than `path` (URL fetch) —
  consistent with the existing `effectMap.ts` pattern that imports placeholder JSON directly
- When real Lottie assets replace placeholders, only `effectMap.ts` imports need updating;
  the overlay component requires zero changes
- The overlay sits at `z-index: 20` with `pointer-events: none` so it never blocks interaction
