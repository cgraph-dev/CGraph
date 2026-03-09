---
phase: 26-great-delete
plan: 02
status: complete
commit: feat(phase-26): plan 02 — frontend stores/facades/hooks delete
files_changed: 67
lines_added: 264
lines_deleted: 11825
---

# Plan 26-02 Summary: Frontend Stores/Facades/Hooks Delete

## What Was Done

Deleted all frontend gamification state management (Zustand stores, facades, hooks) from web and
mobile apps. Cleaned barrel re-exports. Fixed 16 dangling imports with typed stubs.

## Deletions

- **Web stores** (34 files): Entire `modules/gamification/store/` directory including all slices,
  actions, queries, types, utils, and tests
- **Web hooks** (6 files): Entire `modules/gamification/hooks/` directory including socket store,
  level gate, socket handler, and tests
- **Web facades** (4 files): useGamificationFacade, useMarketplaceFacade + their tests
- **Web store test** (1 file): stores/**tests**/gamificationStore.test.ts
- **Mobile stores** (4 files): gamificationStore.ts, marketplaceStore.ts + their tests

## Barrel Edits

- `apps/web/src/stores/index.ts` — Removed gamification, marketplace, prestige, seasonal, referral,
  avatarBorder re-exports
- `apps/web/src/hooks/facades/index.ts` — Removed gamification and marketplace facade exports +
  JSDoc table entries
- `apps/mobile/src/stores/index.ts` — Removed gamification/marketplace re-exports, imports, facade
  functions, and initializeStores reference

## Dangling Import Fixes (16 files)

All fixed with typed stubs and `// TODO(phase-26): Rewire` markers:

- auth-initializer.tsx, sidebar.tsx, notification-provider, identity-customization,
  theme-customization hooks, coin-shop, user-profile, useProfileData, badge-selection,
  title-selection, achievements.ts, full-profile-card, mini-profile-card, avatar-border-renderer,
  profile-card types
