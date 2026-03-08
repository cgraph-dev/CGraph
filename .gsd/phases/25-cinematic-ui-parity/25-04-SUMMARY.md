---
phase: 25-cinematic-ui-parity
plan: 04
status: complete
started: 2026-03-08
completed: 2026-03-08
---

## Summary

Added squircle shape and Lottie avatar support to web avatar components.

### Deliverables

- **avatar.tsx** — `AvatarShape` type (`squircle`/`circle`/`square`), `shape` prop (default
  `squircle`), `lottieUrl` prop with lazy `LottieRenderer` + Suspense
- **animated-avatar/types.ts** — Added `squircle` to shape union
- **animated-avatar/animations.ts** — `squircle` → `rounded-[43px]` in getShapeStyles
- **animated-avatar/constants.ts** — Default shape changed to `squircle`

### Verification

- [x] Default avatar renders with squircle (rounded-[43px])
- [x] Circle and square shapes still work
- [x] Lottie URL renders animated avatar with Suspense fallback

### Commit

- `47408852` — feat(web): add squircle shape + lottie support to avatars

### Issues Encountered

None.
