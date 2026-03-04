---
phase: 21-ui-interactions
plan: 06
status: complete
commit: baee32d6
affects: []
subsystem: web-ui
tech-stack:
  added: []
  used: [motion/react, AnimatePresence, useReducedMotion, stagger]
files:
  created: []
  modified:
    - apps/web/src/components/navigation/dropdown.tsx
    - apps/web/src/pages/notifications/notifications/notification-item.tsx
---

## Summary

Added spring animations to dropdown menu and stagger entrance to notification items.

### What Changed

- Dropdown: AnimatePresence + motion.div with scale+fade spring, reduced motion support
- Notification-item: outer motion.div wrapper with stagger entrance (opacity+y offset, delay based
  on index)
- notification-header.tsx skipped — already fully animated with badge bounce
