---
phase: 22-modern-ui-overhaul
plan: 01
status: complete
started: 2026-03-05
completed: 2026-03-05
commit: 0f14a786

affects:
  - 22-03 (web chat relies on design tokens + avatar)
  - 22-05 (conversation list uses avatar, skeleton, context-menu)
  - 22-06 (profiles use avatar, status-indicator)
  - 22-07 (groups use avatar, context-menu, scroll-area)

subsystem: web-ui-primitives

tech_stack:
  added:
    - "@radix-ui/react-context-menu"
  used:
    - "@radix-ui/react-scroll-area"
    - "motion/react"
    - "tailwind-merge + clsx (via cn)"

artifacts:
  created:
    - apps/web/src/styles/design-tokens.css
    - apps/web/src/styles/typography.css
    - apps/web/src/styles/spacing.css
    - apps/web/src/components/ui/status-indicator.tsx
    - apps/web/src/components/ui/context-menu.tsx
    - apps/web/src/components/ui/scroll-area.tsx
    - apps/web/src/components/ui/divider.tsx
  modified:
    - apps/web/src/index.css
    - apps/web/src/components/ui/avatar.tsx
    - apps/web/src/components/ui/skeleton.tsx
    - apps/web/src/components/ui/tooltip.tsx
    - apps/web/src/components/ui/index.ts
    - apps/web/tailwind.config.js

patterns:
  - CSS custom properties for design tokens (--space-*, --radius-*, --shadow-*, --z-*, --duration-*)
  - cn() utility from @/lib/utils for conditional classnames
  - Radix primitives for accessible context-menu and scroll-area
  - motion/react for tooltip and avatar typing animation
  - Gradient initials from name hash for avatar fallback
---

## Summary

Plan 22-01 established the web design token system and enhanced 8 core UI primitives to Discord/Instagram/Messenger quality.

### Deliverables

**Design Token System (3 CSS files):**
- `design-tokens.css`: Spacing scale (17 values), border radii (7), elevation shadows (5 levels), z-index layers (8), transition curves (4), duration scale (5)
- `typography.css`: Type scale (10 sizes, Discord-density 13-16px base), line heights (4), font weights (4), letter spacing (3)
- `spacing.css`: Layout containers (sidebar, header, chat), panel widths (sm/md/lg)

**Enhanced UI Primitives (8 components):**
1. **Avatar** — 7 sizes (xs→3xl), 5 status states (online/offline/idle/dnd/invisible), story ring, typing indicator overlay, square variant for server icons, gradient initials from name hash
2. **AvatarGroup** — stacked avatars with configurable max + overflow pill
3. **StatusIndicator** — standalone presence dot with optional pulse animation, 5 states including streaming
4. **Skeleton** — shimmer effect (translateX gradient sweep), 5 shapes (text/avatar/card/message/thumbnail), count prop for repeating, backward-compatible legacy API
5. **ContextMenu** — Radix-based with keyboard shortcut hints, sub-menu support, separators, labels, destructive items, Discord-dark styling
6. **ScrollArea** — Radix-based thin scrollbar (4px→8px on hover), auto-hide, vertical/horizontal/both
7. **Divider** — horizontal/vertical, optional centered label (for date dividers), gradient fade edges
8. **Tooltip** — arrow pointer, side prop (top/right/bottom/left), Discord-style dark bg, 300ms delay, backward-compatible position prop

### Key Decisions
- Avatar size scale changed from 5 (xs-xl) to 7 (xs-3xl) with pixel-based sizes
- Status values changed from `away/busy` to `idle/dnd` to match Discord convention
- Shimmer keyframe updated from backgroundPosition to translateX for GPU acceleration
- All new components use `cn()` utility for conditional classnames

### Issues
- None. Zero new TypeScript errors.
