---
phase: 22-modern-ui-overhaul
plan: 02
status: complete
started: 2026-03-05
completed: 2026-03-05
commit: 0f14a786

affects:
  - 22-04 (mobile chat relies on mobile tokens + avatar)
  - 22-06 (profiles use mobile avatar)
  - 22-08 (forums use mobile tokens)

subsystem: mobile-ui-primitives

tech_stack:
  used:
    - "react-native-reanimated"
    - "expo-haptics"
    - "expo-linear-gradient"

artifacts:
  created:
    - apps/mobile/src/theme/tokens.ts
    - apps/mobile/src/theme/typography.ts
    - apps/mobile/src/theme/shadows.ts
    - apps/mobile/src/theme/index.ts
    - apps/mobile/src/components/ui/avatar.tsx
    - apps/mobile/src/components/ui/avatar-group.tsx
    - apps/mobile/src/components/ui/status-indicator.tsx
    - apps/mobile/src/components/ui/skeleton.tsx
    - apps/mobile/src/components/ui/context-menu.tsx
    - apps/mobile/src/components/ui/divider.tsx
    - apps/mobile/src/components/ui/scroll-container.tsx
    - apps/mobile/src/components/ui/index.ts

patterns:
  - TS const objects for tokens (space, radius, zIndex, duration, layout)
  - Reanimated shared values for animations (shimmer, pulse, typing dots)
  - expo-haptics for context menu feedback
  - Platform.OS branching for shadows (iOS shadow props vs Android elevation)
---

## Summary

Plan 22-02 established the mobile design token system and created 7 mobile UI primitives matching the web counterparts.

### Deliverables

**Theme Token System (4 files):**
- `tokens.ts`: Spacing (17 values), border radii (7), z-index (8 layers), duration (5), layout dimensions
- `typography.ts`: Font sizes (10, matching web scale), line heights (4), font weights (4), letter spacing (3)
- `shadows.ts`: 5 elevation levels with iOS shadow props + Android elevation
- `index.ts`: Barrel re-export

**Mobile UI Primitives (7 components):**
1. **Avatar** — 7 sizes, 5 status states, story ring border, typing dots (Reanimated animated translateY), gradient initials from name hash
2. **AvatarGroup** — stacked with negative margin overlap + overflow pill
3. **StatusIndicator** — standalone presence dot with Reanimated pulse animation
4. **Skeleton** — Reanimated shimmer via animated translateX + expo LinearGradient, 5 shapes
5. **ContextMenu** — long-press (400ms) with expo-haptics medium impact, Modal + Reanimated scale/opacity animation, destructive items
6. **Divider** — horizontal/vertical with optional centered label
7. **ScrollContainer** — enhanced ScrollView with RefreshControl, hidden scroll indicators

### Key Decisions
- Mobile UI components placed in `components/ui/` namespace (existing `components/avatar.tsx` kept for backward compatibility)
- Theme tokens are TypeScript const objects (not CSS custom properties)
- ContextMenu uses React Native Modal (not third-party bottom sheet) for simplicity

### Issues
- None. Zero new TypeScript errors in new files.
