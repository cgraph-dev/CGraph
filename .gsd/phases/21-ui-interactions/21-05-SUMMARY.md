---
phase: 21-ui-interactions
plan: 05
status: complete
commit: 542c5454
affects: []
subsystem: web-ui
tech-stack:
  added: []
  used: [motion/react, AnimatePresence, useReducedMotion]
files:
  created: []
  modified:
    - apps/web/src/components/ui/dialog.tsx
    - apps/web/src/components/ui/popover.tsx
    - apps/web/src/components/ui/tooltip.tsx
---

## Summary

Added AnimatePresence enter/exit animations to Dialog, Popover, and Tooltip overlays.

### What Changed

- Dialog: backdrop fade + content spring slide-up (y:20, scale:0.97) with reduced motion fallback
- Popover: scale+fade spring animation replacing conditional render
- Tooltip: quick scale+fade (0.15s) via AnimatePresence + motion.div in portal
- All three respect useReducedMotion with instant fallback
