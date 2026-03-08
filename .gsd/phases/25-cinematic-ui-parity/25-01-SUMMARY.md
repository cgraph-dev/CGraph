---
phase: 25-cinematic-ui-parity
plan: 01
status: complete
started: 2026-03-08
completed: 2026-03-08
---

## Summary

Extended `@cgraph/animation-constants` with two new modules:

### Deliverables

- **backgrounds.ts** — `backgroundPresets` with particleField (full/medium/subtle), cyberGrid
  (full/subtle), auroraGlow (full/subtle), shared color palette, and reducedMotion fallbacks
- **buttons.ts** — `buttonPresets` with magnetic (pull strength, displacement, spring config),
  shimmer (duration, delay, width), glow (idle/hover states, colors), flowingBorder (duration,
  width, opacity), tap/hover scales, and reducedMotion fallbacks
- **index.ts** — barrel exports updated with all new types and constants

### Verification

- [x] `pnpm turbo typecheck --filter=@cgraph/animation-constants` passes
- [x] All presets include reducedMotion variants
- [x] Typed interfaces exported for all preset shapes

### Commit

- `0b36e095` — feat(animation-constants): add background and button presets

### Issues Encountered

None.
