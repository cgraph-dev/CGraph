---
phase: 08-social-profiles
plan: 02
subsystem: ui
tags: [presence, websocket, react, react-native, contacts]

requires:
  - phase: 08-social-profiles/03
    provides: Custom status persistence in PresenceChannel with friend_status_changed events
provides:
  - Web contacts-presence-list component with real-time green/gray dots
  - Enhanced usePresence hook with statusMessages map
  - Mobile useContactsPresence hook with socketManager integration
  - Mobile contacts-screen with SectionList (Online/Offline)
affects: [08-05-onboarding, 08-06-blocking]

tech-stack:
  added: []
  patterns:
    - 'Presence dot pattern: absolute-positioned 8-10px circle on avatar corner'
    - 'SectionList for Online/Offline grouping on mobile'
    - 'socketManager.onGlobalStatusChange for mobile presence'

key-files:
  created:
    - apps/web/src/modules/social/components/contacts-presence-list.tsx
    - apps/mobile/src/hooks/useContactsPresence.ts
    - apps/mobile/src/screens/social/contacts-screen.tsx
  modified:
    - apps/web/src/modules/social/hooks/usePresence.ts
    - apps/mobile/src/hooks/index.ts
    - apps/mobile/src/screens/social/index.ts

key-decisions:
  - 'Enhanced existing usePresence hook rather than creating separate hook for status messages'
  - 'Used socketManager.onGlobalStatusChange for mobile (existing API) rather than raw channel
    subscriptions'
  - 'SectionList over FlatList for clear Online/Offline visual grouping on mobile'

patterns-established:
  - 'Presence dot: green bg-green-500 pulse for online, gray bg-gray-400 for offline'
  - 'Online-first sorting: online contacts always appear above offline'

duration: 8min
completed: 2026-03-01
---

# Plan 08-02: Contacts Presence List Summary

**Wired existing Phoenix.Presence system into dedicated contacts lists on both web and mobile with
real-time green/gray presence dots and status messages.**

## Performance

- **Duration:** 8 min
- **Tasks:** 2/2 completed
- **Files created:** 3
- **Files modified:** 3

## Accomplishments

- Web contacts-presence-list.tsx (178 lines): renders friends sorted online-first with green/gray
  dots, online count badge, status messages
- Enhanced usePresence hook (+38 lines): added statusMessages Map populated from
  friend_status_changed events, getStatusMessage helper
- Mobile useContactsPresence hook (106 lines): tracks onlineFriends Set via socketManager, handles
  app state foreground/background transitions
- Mobile contacts-screen.tsx (360 lines): SectionList with Online/Offline sections, 40px avatar with
  presence dot overlay, pull-to-refresh

## Task Commits

1. **Task 1: Web contacts list with presence indicators** — `ac6ff32b` (feat)
2. **Task 2: Mobile contacts screen with presence hook** — `592a08e4` (feat)

## Files Created/Modified

- `apps/web/src/modules/social/components/contacts-presence-list.tsx` — Web contacts list with
  online/offline sorting and presence dots (178 lines)
- `apps/web/src/modules/social/hooks/usePresence.ts` — Enhanced with statusMessages map and
  getStatusMessage helper (+38 lines)
- `apps/mobile/src/hooks/useContactsPresence.ts` — Presence tracking via socketManager with app
  state handling (106 lines)
- `apps/mobile/src/screens/social/contacts-screen.tsx` — SectionList contacts with presence dots and
  pull-to-refresh (360 lines)
- `apps/mobile/src/hooks/index.ts` — Barrel export for useContactsPresence
- `apps/mobile/src/screens/social/index.ts` — Barrel export for contacts-screen

## Decisions Made

- Enhanced existing `usePresence` hook rather than creating a separate hook — keeps web presence
  logic centralized
- Used `socketManager.onGlobalStatusChange` for mobile — leverages existing API rather than raw
  channel subscriptions
- SectionList with Online/Offline sections on mobile for clear visual grouping

## Deviations from Plan

None — plan executed as written.

## Issues Encountered

None.
