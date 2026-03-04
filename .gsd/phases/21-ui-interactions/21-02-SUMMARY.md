---
phase: 21-ui-interactions
plan: 02
status: complete
started: 2026-03-04
completed: 2026-03-04
commits:
  - hash: 6a220f06
    message: 'feat(21-02): add layout ids and use-motion-safe hook'
files_changed: 4
subsystem: packages/animation-constants, web/hooks
affects: [21-03, 21-04, 21-05, 21-06, 21-07, 21-08]
tech_stack:
  added: [LAYOUT_IDS, useMotionSafe]
---

# Plan 21-02 Summary: Animation Constants + useMotionSafe

## What Was Built

- `LAYOUT_IDS` constant in `@cgraph/animation-constants` with 5 named layoutId strings
- `useMotionSafe` hook providing reduced-motion-aware spring configs, tapScale, hoverScale

## Key Deliverables

- `packages/animation-constants/src/layout-ids.ts` — named constants for shared layout animations
- `apps/web/src/hooks/useMotionSafe.ts` — centralized motion-safe animation config hook
- Both exported from their respective barrels
- Web build passes cleanly

## Issues

None.
