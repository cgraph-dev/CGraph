---
phase: 25-cinematic-ui-parity
plan: 06
status: complete
started: 2026-03-08
completed: 2026-03-08
---

## Summary

Upgraded mobile buttons with gradient border, glow press, and idle shimmer effects.

### Deliverables

- **animated-button.tsx** — `AnimatedButton` component: expo-linear-gradient border, Reanimated glow
  (shadow on press), shimmer overlay (interpolateColor), spring scale via `springs.snappy`, dual
  haptic feedback (light press, medium release), `intensity` prop (full/subtle)
- **button.tsx** — `animated` prop (default true); primary → `AnimatedButton intensity='full'`,
  secondary → `intensity='subtle'`, other variants keep simple Reanimated spring

### Verification

- [x] Primary buttons show gradient border + glow on press
- [x] Secondary buttons show subtle variant
- [x] Haptic feedback fires on press/release
- [x] `useReducedMotion` disables animations
- [x] `animated={false}` opt-out works

### Commit

- `48565acc` — feat(mobile): add animated button with gradient border and glow

### Issues Encountered

- Initial reference to non-existent `android_ripple_pressable` — replaced with simple
  `Animated.View` wrapper for subtle mode
