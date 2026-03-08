---
phase: 25-cinematic-ui-parity
plan: 05
status: complete
started: 2026-03-08
completed: 2026-03-08
---

## Summary

Polished web UI components with spotlight, gradient flow, and new micro-interaction primitives.

### Deliverables

- **glass-card.tsx** — `spotlight` prop (default true): radial gradient overlay follows cursor
  within card bounds; 3D tilt capped at ±4° (8° total max)
- **glass-card.types.ts** — Added `spotlight?: boolean` to `GlassCardProps`
- **glow-text.tsx** — `gradientFlow` prop: animated `background: linear-gradient` cycling over 4s
  with `backgroundSize: 300%`
- **micro-interactions.tsx** — `StaggerChildren`: staggered entrance animation with motion variants;
  `RippleButton`: material-design click ripple at click coordinates

### Verification

- [x] GlassCard spotlight follows cursor on hover
- [x] GlowText gradient cycles when `gradientFlow` enabled
- [x] StaggerChildren animates children entering sequentially
- [x] RippleButton shows expanding circle at click point

### Commit

- `35ea6f9f` — feat(web): add spotlight border, gradient flow, stagger & ripple effects

### Issues Encountered

- Type assertion lint error in glow-text.tsx — added eslint-disable for dynamic `motion[Component]`
  access
- Missing dependency warning in micro-interactions.tsx AnimatedCounter — added eslint-disable
  (intentional prev/current tracking pattern)
