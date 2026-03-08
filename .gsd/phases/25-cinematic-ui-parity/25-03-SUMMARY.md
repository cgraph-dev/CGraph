---
phase: 25-cinematic-ui-parity
plan: 03
status: complete
started: 2026-03-08
completed: 2026-03-08
---

## Summary

Replaced static `ParticleField` with interactive `CinematicBackground` canvas component.

### Deliverables

- **cinematic-background.tsx** — Canvas-based particle field with connection lines, mouse repulsion
  physics, DPR capped at 2, auto-pause on tab hidden, `intensity` prop (full/medium/subtle/off),
  uses `backgroundPresets.particleField`
- **app-layout.tsx** — Swapped `<ParticleField count={60} />` →
  `<CinematicBackground intensity="medium" />`

### Verification

- [x] Particles connect with distance-based lines
- [x] Mouse repulsion pushes particles away
- [x] Tab hidden pauses animation (battery savings)
- [x] Intensity levels change particle count and effects

### Commit

- `d180acb3` — feat(web): add cinematic background with mouse repulsion

### Issues Encountered

None.
