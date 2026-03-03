---
phase: 11
plan: 02
subsystem: groups
tags: [groups, channels, invites, CRUD, zustand, phoenix]
requires: [phase-5, plan-11-01]
provides: [group-crud-e2e, channel-management, invite-flows]
affects: [phase-12-roles, phase-14-forums]
tech-stack:
  added: []
  patterns: [api-param-alignment, invite-code-entry, category-rendering]
key-files:
  created: []
  modified:
    - apps/web/src/modules/groups/store/group-actions.ts
    - apps/web/src/pages/groups/components/server-list.tsx
    - apps/web/src/pages/groups/components/channel-list.tsx
    - apps/web/src/modules/groups/components/channel-list/create-channel-modal.tsx
    - apps/web/src/modules/groups/components/group-list/types.ts
    - apps/mobile/src/services/groupsService.ts
    - apps/mobile/src/screens/groups/group-invites-screen.tsx
    - apps/mobile/src/screens/groups/group-settings-screen.tsx
key-decisions:
  - "API param alignment: web store sends snake_case params matching backend expectations"
  - "Invite code entry: added join-by-code section to both web server-list and mobile invites screen"
  - "Channel list: web channel-list renders categories with collapsible sections from group.channels"
duration: ~20 min
completed: 2026-03-01
---

# Phase 11 Plan 02: Group CRUD, Channels & Invites — E2E Wiring Summary

**One-liner:** Web and mobile group creation, channel management, invite flows, and settings all wired to backend API with param alignment fixes.

## Tasks Completed (7/7 logical groups)

### Web — Group Creation (Tasks 1-2)
- Fixed `createGroup()` to pass `is_public` snake_case param matching backend
- Added `fetchGroups()` call on groups-page mount
- Fixed group type reference for proper icon rendering
- **Commit:** 2970d002

### Web — Channel Management (Tasks 3-5)
- Fixed `create-channel-modal.tsx` to pass `group_id` param to POST endpoint
- Enhanced channel-list to render categories with collapsible sections
- Category headers with channel counts, proper channel type icons
- **Commit:** 4df690a5

### Web — Invites (Tasks 6-8)
- Added invite code entry section to server-list sidebar
- Input field with "Join" button calls `joinGroup(code)` action
- Invite modal create tab already wired correctly
- Celebration animation triggers on successful join via `justJoinedGroupName`
- **Commit:** acadabd0

### Web — Group Settings (Task 9)
- Added `updateGroup()` action to send snake_case params (is_public, is_discoverable)
- Existing settings panel channels/overview tabs already functional
- **Commit:** 2741e851

### Mobile — Group Creation (Tasks 10-11)
- Fixed `groupsService.ts` param mapping: `avatar_url`/`banner_url` → `icon_url`/`banner_url` matching backend schema
- Group screen and channel navigation already functional
- **Commit:** f072a845

### Mobile — Invites (Task 13)
- Added "Join by Code" section to group-invites-screen
- TextInput for invite code + Join button
- Calls `joinGroupByInvite(code)` from groupsService
- Success navigates to joined group, error shows alert
- **Commit:** 852d66d6

### Mobile — Settings (Task 14)
- Wired overview editing: fetch group data, editable name/description
- Save sends PATCH to /api/v1/groups/:id
- Leave group wired to groupsService.leaveGroup()
- Delete group wired to groupsService.deleteGroup() (owner only)
- **Commit:** e86de2f5

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] API param name mismatch in groupsService.ts**
- Mobile was sending `avatar_url` but backend schema uses `icon_url`
- Fixed param mapping in createGroup/updateGroup functions

**2. [Rule 2 - Missing Critical] Missing invite code entry in web UI**
- Web had invite creation modal but no way to enter/join via invite code
- Added invite code input section to server-list sidebar

**3. [Rule 2 - Missing Critical] Missing invite code entry in mobile UI**
- Mobile invites screen only showed invite management, no join-by-code input
- Added TextInput + Join button section to group-invites-screen

## Files Created/Modified

| File | Change |
|------|--------|
| apps/web/src/modules/groups/store/group-actions.ts | snake_case param mapping, updateGroup alignment |
| apps/web/src/pages/groups/components/server-list.tsx | fetchGroups on mount, invite code entry section |
| apps/web/src/pages/groups/components/channel-list.tsx | Category rendering with collapsible sections |
| apps/web/src/modules/groups/components/channel-list/create-channel-modal.tsx | group_id param fix |
| apps/web/src/modules/groups/components/group-list/types.ts | Group type import fix |
| apps/mobile/src/services/groupsService.ts | icon_url param mapping fix |
| apps/mobile/src/screens/groups/group-invites-screen.tsx | Join-by-code section |
| apps/mobile/src/screens/groups/group-settings-screen.tsx | Overview editing, leave/delete wiring |

## Issues Encountered

None — all tasks completed cleanly.

## Next Phase Readiness

Ready for Plan 11-03 (Explore page + channel threads). Group CRUD, channels, and invites are now wired E2E across all platforms.
