# Summary 09-02: DND Schedule UI & Timezone-Aware Quiet Hours

## Result: ✅ Complete

## What Was Done

### Backend

- Created migration adding `dnd_until` column to `user_settings` (timezone already existed)
- Updated `in_quiet_hours?/1` for timezone awareness using Timex
- Updated `should_notify?/2` with instant DND check (`dnd_until` field)
- Added `set_dnd/2`, `clear_dnd/1`, `get_dnd_state/1` to `settings.ex`
- Added DND endpoints (GET/POST/DELETE) to `settings_controller.ex`
- Added DND routes to `user_routes.ex`
- Added `set_dnd`/`clear_dnd` socket handlers in `presence_channel.ex`

### Web

- Created `dnd-schedule-panel.tsx` — quiet hours toggle, time pickers, timezone selector
- Created `dnd-toggle.tsx` — nav bar quick toggle with duration dropdown
- Added DND section link to `notification-settings-panel.tsx`
- Updated settings store types and mappers for `dndUntil`

### Mobile

- Created `dnd-schedule-screen.tsx` — quiet hours configuration screen
- Created `dnd-quick-toggle.tsx` — bottom sheet with duration options
- Added DND navigation to `notifications-screen.tsx`
- Updated settings store and navigation types for DND

## Files Changed

- **Created:** 5 files (migration, web schedule panel, web toggle, mobile schedule screen, mobile
  toggle)
- **Modified:** 12 files (user_settings schema, settings context, controller, routes, presence
  channel, web settings panel/store/mappers, mobile settings screen/store/types)

## Deviations

- No `timezone` migration needed — field already existed
- Used Timex (already a dependency) for timezone conversion
- Used static timezone list instead of `Intl.supportedValuesOf`

## Commit

`977fe299` — `feat(09-02): DND schedule UI and timezone-aware quiet hours`
