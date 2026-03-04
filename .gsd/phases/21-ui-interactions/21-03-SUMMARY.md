---
phase: 21-ui-interactions
plan: 03
status: complete
commit: 1b17fbd2
affects: [21-04, 21-05, 21-06]
subsystem: web-ui
tech-stack:
  added: []
  used: [motion/react, useMotionSafe]
files:
  created: []
  modified:
    - apps/web/src/components/ui/button.tsx
---

## Summary

Upgraded Button and IconButton to use `motion.button` with spring-driven whileTap/whileHover
animations via useMotionSafe hook.

### What Changed

- Button: `motion.button` with tapScale(0.97), hoverScale(1.02)
- IconButton: `motion.button` with tapScale(0.95), hoverScale(1.05)
- Removed CSS `active:scale-[0.98]` from baseStyles (replaced by motion)
- Both respect reduced motion via useMotionSafe

### Decisions

- Used useMotionSafe hook for consistent spring/reduced-motion handling across all button variants
