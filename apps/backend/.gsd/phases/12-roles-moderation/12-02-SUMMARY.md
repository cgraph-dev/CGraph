---
phase: 12-roles-moderation
plan: 02
subsystem: moderation
tags: [elixir, phoenix, moderation, reporting, react-native, ban-management]

requires:
  - phase: 11-groups-explore
    provides: "group membership, audit logging, base moderation schemas"
provides:
  - "Kick/ban with structured reasons and audit logging"
  - "Ban management with expiry support (temporary bans)"
  - "Group-scoped moderation context (reports + actions per group)"
  - "Report button on web group messages + mobile long-press"
  - "Mobile report content screen with 13 categories"
  - "Mobile ban list management screen with unban"
  - "Reports tab in mobile moderation screen"
affects: [12-03-automod, administrator-tools]

tech-stack:
  added: []
  patterns:
    - "Group-scoped moderation: moderators see only their group's reports"
    - "Structured kick/ban: reason string stored in audit_log metadata"

key-files:
  created:
    - apps/backend/lib/cgraph/groups/moderation.ex
    - apps/backend/lib/cgraph_web/controllers/api/v1/group_moderation_controller.ex
    - apps/mobile/src/screens/groups/report-content-screen.tsx
    - apps/mobile/src/screens/groups/ban-list-screen.tsx
  modified:
    - apps/backend/lib/cgraph/groups/members.ex
    - apps/backend/lib/cgraph_web/controllers/api/v1/group_member_controller.ex
    - apps/backend/lib/cgraph_web/router/messaging_routes.ex
    - apps/web/src/modules/groups/components/group-settings/members-tab/confirm-action-modal.tsx
    - apps/mobile/src/screens/groups/channel-screen.tsx
    - apps/mobile/src/screens/groups/group-moderation-screen.tsx
    - apps/mobile/src/navigation/groups-navigator.tsx
    - apps/mobile/src/types/index.ts

key-decisions:
  - "Group-scoped moderation separate from platform-admin moderation"
  - "Reports submitted via generic /api/v1/reports endpoint but queried per-group"
  - "Ban list as standalone screen + inline tab in moderation screen"
  - "13 report categories matching backend schema"

patterns-established:
  - "Group moderation controller: all actions require group membership + manage_messages/ban_members permission"
  - "ActionSheet for mobile message long-press: Thread + Report options"
  - "Reason field pattern: optional textarea in confirmation modals"

duration: 20min
completed: 2025-01-20
---

# Plan 12-02: Ban/Kick + Content Reporting Summary

**Group moderation pipeline with structured kick/ban reasons, group-scoped report management, and full report submission + ban management on both web and mobile.**

## What Was Built

### Task 1: Enhance kick/ban with structured reasons
- group_member_controller.ex: kick accepts optional reason param, logged to audit
- Ban supports duration_hours → calculated expires_at for temporary bans
- list_bans endpoint: GET /groups/:id/bans returns active bans with reason/expiry
- Unban endpoint: DELETE /groups/:id/bans/:user_id
- Routes wired in messaging_routes.ex

### Task 2: Group-scoped moderation context + controller
- Created groups/moderation.ex (232L): list_group_reports/2, review_group_report/4, get_group_report/2, group_moderation_stats/1
- Created group_moderation_controller.ex (203L): index, show, review, stats actions
- All actions scoped to group — moderators only see reports for content in their group
- Routes: /groups/:group_id/moderation/reports + /review + /stats

### Task 3: Wire report button to message context menus
- Web: FlagIcon report button on channel-message-item.tsx (was already wired)
- Web: Added reason textarea to confirm-action-modal.tsx for kick/ban
- Web: Added ban duration selector (already existed)
- Mobile: Channel long-press now shows ActionSheet with Thread + Report options

### Task 4: Mobile report + ban list screens
- Created report-content-screen.tsx (210L): 13 category pills, description textarea, submit via POST /api/v1/reports
- Created ban-list-screen.tsx (230L): Active bans with reason/expiry, unban with confirmation, pull-to-refresh
- Added ReportContent + BanList to GroupsStackParamList and navigator
- Enhanced group-moderation-screen.tsx: added Reports tab fetching from group-scoped endpoint with status badges
