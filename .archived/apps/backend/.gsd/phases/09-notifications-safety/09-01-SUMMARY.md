# Summary 09-01: Per-Conversation & Per-Channel Notification Preferences

## Result: ✅ Complete

## What Was Done

### Backend

- Created `notification_preferences` migration with unique index on
  `(user_id, target_type, target_id)`
- Created `NotificationPreference` Ecto schema with mode validation (all/mentions_only/none) and
  optional `muted_until`
- Created `Notifications.Preferences` context module with full CRUD: `get_preference`,
  `set_preference`, `mute`, `unmute`, `should_deliver?`, `list_muted`, `list_all`,
  `bulk_get_preferences`
- Created `NotificationPreferenceController` with index/show/upsert/delete actions
- Added 4 routes to `user_routes.ex` for notification preferences API
- Integrated `Preferences.should_deliver?/4` check into `delivery.ex` pipeline

### Shared Types

- Created `packages/shared-types/src/notifications.ts` with `NotificationMode`,
  `NotificationPreference`, `MUTE_DURATIONS`
- Exported from package index

### Web

- Created `conversation-notification-settings.tsx` — dialog with mode picker + duration selector
- Added mute indicator (BellSlashIcon) to `conversation-item.tsx`
- Added notification settings button to `conversation-header.tsx`

### Mobile

- Created `conversation-notification-settings.tsx` — bottom sheet with same functionality
- Added mute indicator to `animated-conversation-item.tsx`

## Files Changed

- **Created:** 10 files (migration, schema, context, controller, shared types, web component, mobile
  component, etc.)
- **Modified:** 5 files (routes, delivery pipeline, shared-types index, conversation list items,
  conversation header)

## Deviations

- Removed `@spec changeset(t(), map())` from schema (Ecto schemas don't auto-define `t()`)
- Used notification.data fields for target type detection in delivery.ex
- Added `list_all/1` for controller index action

## Commit

`4669eb12` — `feat(09-01): per-conversation notification preferences`
