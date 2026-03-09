---
phase: 26-great-delete
plan: 03
status: complete
commit: feat(phase-26): plan 03 — frontend pages/components/screens delete
files_changed: 368
lines_deleted: ~35000
---

# Plan 26-03 Summary: Frontend Pages/Components/Screens Delete

## What Was Done

Deleted the entire gamification UI layer from web and mobile: pages, components, screens, features,
modules, and shared types. Fixed ~30 dangling imports with typed stubs.

## Deletions

### Web (330+ files)

- `pages/gamification/` — 33 files (hub, achievements, quests, titles, components)
- `pages/leaderboard/` — 19 files (leaderboard page, sections, filters)
- `pages/customize/progression-customization/` — 10 files + wrapper
- `pages/community/user-leaderboard.tsx`
- `modules/gamification/` — 205 components, types, services, barrel (entire module)

### Mobile (30+ files)

- `screens/gamification/` — 24 screens
- `features/gamification/` — types, hooks, components, services
- `components/gamification/` — achievement-notification, title-badge, level-progress, etc.
- `modules/gamification/` — AvatarBorder components

### Shared

- `packages/shared-types/src/gamification.ts` — 255 lines deleted
- `packages/shared-types/src/index.ts` — removed gamification re-export

## Dangling Import Fixes (~30 files)

Fixed with typed stubs and `// TODO(phase-26): Rewire` markers:

- TitleBadge/InlineTitle: replaced with plain `<span>` in 12 files
- UserStars: removed from forum components
- LevelProgress: removed from user-profile
- AchievementNotification: removed from notification-provider
- ReferralDashboard: stubbed in referral-page
- AvatarBorder: replaced with plain View in mobile ProfileCard
- BorderRenderer: replaced with div in themed-avatar
- Various barrel/navigator/route cleanups
