---
phase: 21
plan: 02
title: 'Web Admin Dashboard & Mock Data Audit — Remove All Remaining Mocks'
status: completed
commits:
  - 72e87a70  # feat(21-02): remove admin dashboard mock data fallbacks
  - af4e51ff  # feat(21-02): rename MOCK_BADGES to PREVIEW_BADGES, clean up mock references
  - bdbeb792  # chore(21-02): clean up legacy MOCK_ comments across codebase
files_modified:
  - apps/web/src/modules/admin/store/adminStore.ts
  - apps/web/src/modules/admin/store/admin-moderation-actions.ts
  - apps/web/src/modules/admin/store/admin-event-actions.ts
  - apps/web/src/modules/admin/store/admin-user-actions.ts
  - apps/web/src/modules/admin/store/admin-settings-actions.ts
  - apps/web/src/modules/admin/store/adminStore.mockData.ts
  - apps/web/src/pages/settings/live-preview-panel/ (5 files)
---

## Results

### Task 1 — Admin dashboard error handling ✅
- Removed mock data fallbacks from 5 admin store action files
- Each catch block now sets `error` message + `isLoading: false` instead of falling back to MOCK_ data
- Admin dashboard will show proper error states when API calls fail
- Gutted `adminStore.mockData.ts` with deprecation comment
- Commit: `72e87a70`

### Task 2 — Full mock data audit ✅
- Renamed `MOCK_BADGES` → `PREVIEW_BADGES` in live-preview-panel (cosmetic preview data, not API mock)
- Renamed `MockBadge` type → `PreviewBadge` for consistency
- Cleaned up remaining MOCK_ comments across codebase
- **Production MOCK_ references: 0** (test/storybook files excluded as expected)
- Commits: `af4e51ff`, `bdbeb792`

### Task 3 — @todo(api) check ✅
- Zero `@todo(api)` references remain — all resolved in Plan 21-01 when mock-data.ts was gutted
- No action needed

## Must-Have Verification

| Must-Have | Status |
|---|---|
| Admin dashboard shows error state on API failure, not fake stats | ✅ |
| adminStore.mockData.ts deleted/emptied | ✅ (gutted) |
| grep MOCK_ returns zero in production code | ✅ |
| All @todo(api) comments resolved | ✅ |
