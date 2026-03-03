---
phase: 12-roles-moderation
plan: 01
subsystem: permissions
tags: [elixir, bitmask, channel-overrides, react-native, permissions]

requires:
  - phase: 11-groups-explore
    provides: "group channel infrastructure, role CRUD, permission_overwrite schema"
provides:
  - "calculate_effective_permissions/3 merging role bitmask + channel overrides"
  - "manage_automod permission bit (1 <<< 23)"
  - "Effective permissions REST endpoint"
  - "Mobile role editor with 24 permission toggles"
  - "Mobile channel permissions screen with 3-state overrides"
affects: [12-03-automod, 12-04-emoji-e2ee, moderation]

tech-stack:
  added: []
  patterns:
    - "Effective permissions: base OR → admin bypass → role allow/deny → member allow/deny"
    - "3-state permission override: inherit/allow/deny with segmented control"

key-files:
  created:
    - apps/mobile/src/screens/groups/channel-permissions-screen.tsx
  modified:
    - apps/backend/lib/cgraph/groups/role.ex
    - apps/backend/lib/cgraph/groups/roles.ex
    - apps/backend/lib/cgraph_web/channels/group_channel.ex
    - apps/backend/lib/cgraph/groups.ex
    - apps/backend/lib/cgraph_web/controllers/api/v1/role_controller.ex
    - apps/mobile/src/screens/groups/group-roles-screen.tsx
    - apps/mobile/src/navigation/groups-navigator.tsx
    - apps/mobile/src/types/index.ts

key-decisions:
  - "Administrator bit always bypasses channel overrides"
  - "Member-specific overrides trump role overrides (Discord model)"
  - "Effective permissions endpoint returns full boolean map for client display"

patterns-established:
  - "Effective permissions: has_effective_permission?/4 used in all channel authorization"
  - "3-state toggle: inherit(neutral)/allow(green)/deny(red) for channel overrides"

duration: 15min
completed: 2025-01-20
---

# Plan 12-01: Roles & Permissions Hardening Summary

**Effective permission system merges role bitmasks with per-channel allow/deny overrides, enforced in group_channel.ex for join, send, delete, and pin operations.**

## What Was Built

### Task 1: manage_automod bit + effective permissions calculator
- Added `manage_automod: 1 <<< 23` to role.ex @permissions map
- Built `calculate_effective_permissions/3` in roles.ex: base OR → admin bypass → role overrides → member overrides
- Added `has_effective_permission?/4` convenience function

### Task 2: Wire effective permissions into group_channel.ex
- Added delegations in groups.ex facade
- Changed `verify_channel_access/2` to use effective permissions for view_channels
- Changed `verify_send_permission` to check send_messages effective permission
- Updated delete/pin handlers for manage_messages effective permission
- Added `GET /groups/:group_id/channels/:channel_id/permissions/:member_id` endpoint

### Task 3: Mobile role editor with full permission toggles
- Expanded group-roles-screen.tsx from 131L to 493L+
- 24 permission toggles in categorized sections (General, Membership, Text, Voice, Advanced)
- Role CRUD: create with name+color, edit permissions, delete with confirmation
- Bitmask utilities for toggle operations

### Task 4: Mobile channel permissions screen
- Created channel-permissions-screen.tsx (563L)
- Fetches channel overrides and group roles
- 3-state permission toggles: Inherit/Allow/Deny per permission per role
- Full override CRUD (add, edit, delete)
- Registered in navigator with ChannelPermissions route
