---
phase: 21-ui-interactions
plan: 08
status: complete
commit: 4880a154
affects: []
subsystem: web-ui
tech-stack:
  added: []
  used: [motion/react, useReducedMotion, springs]
files:
  created: []
  modified:
    - apps/web/src/shared/components/page-transition.tsx
    - apps/web/src/layouts/app-layout/animated-outlet.tsx
    - apps/web/src/components/ui/toast.tsx
    - apps/web/src/providers/notification-provider/toast-item.tsx
---

## Summary

Upgraded page transitions to spring physics and added reduced-motion support to toasts.

### What Changed

- page-transition.tsx: Spring transition (stiffness:300, damping:30) replacing tween,
  useReducedMotion conditional
- animated-outlet.tsx: Spring transition (stiffness:300, damping:28) replacing tween,
  useReducedMotion + removed unused durations/tweens imports
- toast.tsx: Spring enter from top (y:-20→0), useReducedMotion fallback, layout prop for smooth
  stack reflow
- toast-item.tsx (provider): useReducedMotion for all 3 notification types (levelup, quest,
  standard), conditional initial/exit animations
