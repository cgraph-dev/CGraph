---
phase: 21-ui-interactions
plan: 10
status: complete
commit: 0b391d94
affects: []
subsystem: web-ui
tech-stack:
  added: []
  used: [durationsSec, animation-presets]
files:
  created: []
  modified:
    - apps/web/src/components/ui/tooltip.tsx
    - apps/web/src/components/ui/dialog.tsx
    - apps/web/src/components/liquid-glass/lg-modal.tsx
    - apps/web/src/components/liquid-glass/lg-text-input.tsx
    - apps/web/src/pages/notifications/notifications/notification-item.tsx
---

## Summary

Replaced hardcoded animation duration values with shared durationsSec presets and performed final
validation.

### What Changed

- Replaced `duration: 0.2` → `durationsSec.normal` in dialog, lg-modal, notification-item
- Replaced `duration: 0.15` → `durationsSec.fast` in tooltip, lg-text-input
- Fixed lg-text-input.tsx framer-motion→motion/react import (missed by Plan 01 sed)
- Added durationsSec import to 5 files

### Final Audit Results

- Hardcoded durations: 25→3 remaining (all 0.25s — no exact preset match)
- Hardcoded springs: 33 remaining (all custom values, no exact preset matches)
- framer-motion imports: 0 (fully migrated)
- Web build: passes clean
