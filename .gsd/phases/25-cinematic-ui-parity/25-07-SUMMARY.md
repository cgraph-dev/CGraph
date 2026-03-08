---
phase: 25-cinematic-ui-parity
plan: 07
status: complete
started: 2026-03-08
completed: 2026-03-08
---

## Summary

Added squircle shape and Lottie avatar support to mobile avatar components.

### Deliverables

- **avatar-squircle-clip.tsx** — `getSquircleBorderRadius(size)` helper (returns
  `Math.min(43, size/2)`), `SquircleClip` wrapper component
- **lottie-avatar.tsx** — `LottieAvatar` component using `lottie-react-native` LottieView, squircle
  borderRadius, loading/error fallbacks, `useReducedMotion` → first frame only
- **avatar.tsx** — `shape` prop (`squircle`/`circle`/`square`, default `squircle`), `lottieUrl`
  prop, squircle borderRadius via helper

### Verification

- [x] Default avatar renders with squircle shape
- [x] Circle and square shapes work correctly
- [x] Lottie URL renders animated avatar
- [x] Reduced motion shows static first frame

### Commit

- `19b850c5` — feat(mobile): add squircle avatar shape + lottie support

### Issues Encountered

- Missing JSDoc description — added to satisfy `jsdoc/require-description`
- Type assertion lint error on `as BorderAnimationType` — added eslint-disable (unavoidable for
  dynamic API data)
