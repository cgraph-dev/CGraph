---
phase: 21-ui-interactions
plan: 04
status: complete
commit: 40bac9fe
affects: []
subsystem: web-ui
tech-stack:
  added: []
  used: [motion/react, LAYOUT_IDS, useMotionSafe]
files:
  created: []
  modified:
    - apps/web/src/layouts/app-layout/sidebar.tsx
---

## Summary

Upgraded sidebar active indicator to use named LAYOUT_IDS constant and added reduced motion support.

### What Changed

- Replaced hardcoded `layoutId="activeIndicator"` with
  `layoutId={LAYOUT_IDS.sidebarActiveIndicator}`
- Added useMotionSafe for `shouldAnimate` — uses `springs.bouncy` when enabled, `{ duration: 0 }`
  when reduced motion active
- All existing nav motion (hover/tap, stagger entrance, badges) preserved
