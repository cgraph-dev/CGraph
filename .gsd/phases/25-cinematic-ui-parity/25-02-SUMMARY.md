---
phase: 25-cinematic-ui-parity
plan: 02
status: complete
started: 2026-03-08
completed: 2026-03-08
---

## Summary

Added magnetic cursor-pull and shimmer effects to web buttons.

### Deliverables

- **magnetic-button.tsx** — `useMagneticButton` hook (useSpring x/y displacement) and
  `MagneticButton` wrapper, using `buttonPresets.magnetic` config
- **button.tsx** — `animated` prop (default true); primary/glass variants get magnetic pull +
  `btn-shimmer` CSS class
- **index.css** — `@keyframes btn-shimmer`, `.btn-shimmer` class, `@keyframes btn-border-flow`,
  `prefers-reduced-motion` media query

### Verification

- [x] Primary/glass buttons attract toward cursor on hover
- [x] Shimmer sweep runs on primary buttons
- [x] Reduced motion disables all effects
- [x] `animated={false}` disables effects per-button

### Commit

- `9d7afbd1` — feat(web): add magnetic button + shimmer effects

### Issues Encountered

Unused imports flagged by lint — removed `useSpring`, `buttonPresets`, `useState`, `useMotionValue`
that were not needed after refactoring.
