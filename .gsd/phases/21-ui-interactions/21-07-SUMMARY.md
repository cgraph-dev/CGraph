---
phase: 21-ui-interactions
plan: 07
status: complete
commit: 95f33ab1
affects: []
subsystem: web-ui
tech-stack:
  added: []
  used: [motion/react, useReducedMotion, messageEntranceVariants]
files:
  created: []
  modified:
    - apps/web/src/lib/animation-presets/chat-bubbles.ts
    - apps/web/src/lib/animation-presets/index.ts
    - apps/web/src/modules/chat/components/animated-message-wrapper.tsx
---

## Summary

Added directional chat entrance presets and useReducedMotion to AnimatedMessageWrapper.

### What Changed

- chat-bubbles.ts: Added `messageEntranceVariants` (sent from right, received from left),
  `messageListStagger`, `typingIndicatorVariants` exports
- Barrel re-exports all new presets
- AnimatedMessageWrapper: Added `useReducedMotion` — skips entrance/exit variants when reduced
  motion active
- Existing gestures, haptics, and particle effects preserved
- Compatible with @tanstack/react-virtual (no parent staggerChildren)
