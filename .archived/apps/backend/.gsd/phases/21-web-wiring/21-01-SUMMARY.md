---
phase: 21
plan: 01
title: 'Web Customization Pages & Forum Admin — Replace Mock Data with API Calls'
status: completed
commits:
  - 06576beb # feat(21-01): add standalone fetch functions for gamification APIs
  - d07978be # feat(21-01): wire progression customization page to real API
  - 7eff76e7 # feat(21-01): wire identity customization to real API
  - 667a4608 # feat(21-01): wire theme customization to real API
  - f39752e3 # feat(21-01): wire forum admin dashboard to real API
  - b815771d # feat(21-01): wire chat MOCK_USERS to real user search API
  - 9e38212a # feat(21-01): fix remaining MOCK_ references in borders-section and theme barrel
  - 49530c45 # feat(21-01): clean up MOCK_ re-exports from top-level barrel files
files_modified:
  - apps/web/src/modules/gamification/store/gamification-queries.ts
  - apps/web/src/pages/customize/progression-customization/ (4 files)
  - apps/web/src/pages/customize/identity-customization/ (5 files)
  - apps/web/src/pages/customize/theme-customization/ (3 files)
  - apps/web/src/pages/forums/forum-admin/useForumAdminInit.ts
  - apps/web/src/modules/chat/components/ (3 files)
---

## Results

### Task 1 — Gamification API query functions ✅

- Added 8 standalone fetch functions to `gamification-queries.ts`: `fetchLeaderboard`,
  `fetchDailyRewards`, `fetchBorders`, `fetchTitles`, `fetchBadges`, `fetchThemes`,
  `fetchAchievementsList`, `fetchQuestsList`
- Follow existing pattern: `api.get()` with `.data.data` extraction
- Commit: `06576beb`

### Task 2 — Progression Customization page ✅

- Replaced all 4 MOCK\_ imports (ACHIEVEMENTS, LEADERBOARD, QUESTS, DAILY_REWARDS) with `useState` +
  `useEffect` fetching from gamification API
- Added loading spinner during fetch
- Updated `categories.ts` to accept counts as parameters instead of importing mocks
- Gutted `mock-data.ts` with deprecation comment
- Removed MOCK\_ re-exports from `index.ts`
- Commit: `d07978be`

### Task 3 — Identity Customization page ✅

- `useIdentityCustomization.ts`: Added API fetching for borders/titles/badges with loading state
- Removed MOCK_BORDERS (18 items), MOCK_TITLES (12), MOCK_BADGES (12) from `constants.ts`
- Kept PROFILE_LAYOUTS, RARITIES, and helper functions (non-mock)
- Fixed `borders-section.tsx` to use dynamic `ALL_BORDERS.length`
- Commit: `7eff76e7`

### Task 4 — Theme Customization page ✅

- `hooks.ts`: Added API fetching for themes with loading state
- Removed all 20 MOCK_THEMES from `constants.ts`
- Commit: `667a4608`

### Task 5 — Forum Admin Dashboard ✅

- Replaced 4 inline mock data blocks in `useForumAdminInit.ts`:
  - Analytics → `GET /api/v1/forums/{slug}/analytics`
  - Rules → `GET /api/v1/forums/{slug}/rules`
  - Mod queue → `GET /api/v1/moderation/queue?forum_id={slug}`
  - Members → `GET /api/v1/forums/{slug}/members`
- Added error handling for each API call
- Commit: `f39752e3`

### Task 6 — Chat MOCK_USERS (bonus) ✅

- `new-chat-modal.tsx`: Replaced MOCK_USERS with debounced `api.get('/api/v1/users/search')`
- `mention-autocomplete.tsx`: Removed local MOCK_USERS and `filterMockUsers` fallback
- Removed MOCK_USERS from conversation-list `constants.ts` and `index.ts`
- Commits: `b815771d`, `9e38212a`, `49530c45`

## Deviations

- **Chat MOCK_USERS**: Not in original plan scope but discovered during research and fixed
  proactively. These were in `modules/chat/` not in customization pages.
- **live-preview-panel/constants.ts**: Contains `MOCK_BADGES` used for UI preview decoration —
  intentionally NOT replaced as it's cosmetic preview data, not a data-fetching mock.
- **Admin store mocks**: Left for Plan 21-02 which specifically targets the admin dashboard.
- **No TanStack Query migration**: Followed existing Zustand + imperative `api.get()` pattern rather
  than introducing `useQuery` hooks into pages that don't use them yet.

## Must-Have Verification

| Must-Have                                                           | Status                   |
| ------------------------------------------------------------------- | ------------------------ |
| Progression page fetches achievements from GET /api/v1/achievements | ✅                       |
| Leaderboard from API, not MOCK_LEADERBOARD                          | ✅                       |
| Quests from API, not MOCK_QUESTS                                    | ✅                       |
| Daily rewards from API, not MOCK_DAILY_REWARDS                      | ✅                       |
| mock-data.ts deleted or emptied                                     | ✅ (gutted with comment) |
| Borders/titles/badges from cosmetics API                            | ✅                       |
| MOCK_BORDERS/TITLES/BADGES removed from constants.ts                | ✅                       |
| Themes from GET /api/v1/themes                                      | ✅                       |
| MOCK_THEMES removed                                                 | ✅                       |
| Forum admin analytics from API                                      | ✅                       |
| Forum automod rules from API                                        | ✅                       |
| Mod queue from API                                                  | ✅                       |
| Forum members from API                                              | ✅                       |
| All pages show loading states                                       | ✅                       |
| Error handling on API failure                                       | ✅                       |
