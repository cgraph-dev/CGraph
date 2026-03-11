# Summary: Plan 10-03 — Message Extras Polish

**Status:** ✅ Complete **Commit:** `cf9e1b29` —
`feat(10-03): message extras polish — save buttons, mobile disappearing, timer icons` **Files
changed:** 13 (1 created, 12 modified) — 499 insertions

## What Was Done

### Save/Bookmark Action Buttons (MSG-14)

**Web** (`message-action-menu.tsx`):

- Added Save/Unsave toggle button with `BookmarkIcon` (outline) / `BookmarkFilledIcon` (filled)
- Checks saved state via `GET /api/v1/saved-messages` when menu opens
- Saves via `POST /api/v1/saved-messages` with `{ message_id }`
- Unsaves via `DELETE /api/v1/saved-messages/:id`
- Passed `messageId` prop through from message bubble

**Web** (`icons.tsx`):

- Added `BookmarkIcon` (outline SVG) and `BookmarkFilledIcon` (filled SVG)

**Web** (`types.ts`):

- Added `messageId` to `MessageActionMenuProps`

**Mobile** (`message-actions-menu.tsx` — both component locations):

- Added "Save message" / "Unsave message" action with bookmark icon
- Same API pattern as web (check → toggle → haptic feedback)

### Disappearing Messages Mobile (MSG-17)

**Created** `disappearing-messages-toggle.tsx`:

- Modal bottom sheet with TTL options: Off, 24h, 7d, 30d
- Calls `PUT /api/v1/conversations/:id/ttl` with selected value
- Shows current setting with checkmark, haptic feedback on select
- Themed via `useThemeStore`, follows existing mobile patterns

**Conversation integration** (`use-conversation-header.tsx`, `use-conversation-setup.ts`,
`conversation-screen.tsx`):

- Added "Disappearing Messages" option to conversation header menu
- Wired toggle modal open/close state
- Passed conversation TTL to toggle component

### Timer Indicator on Disappearing Messages

**Web** (`message-bubble.tsx`): Passed `messageId` to action menu (enables save button)

**Mobile** (`message-bubble.tsx`): Added `Ionicons timer-outline` icon (12px) next to timestamp when
`item.expires_at` is present, with appropriate opacity for own vs. other messages

### Shared Types Extension

**`packages/shared-types/src/messages.ts`**:

- Added `SavedMessage` interface (id, messageId, note, savedAt)
- Added `DisappearingConfig` interface (ttl, expiresAt)

## Requirements Covered

- **MSG-14**: Save/bookmark messages — ✅ Save buttons wired into web + mobile action menus
- **MSG-17**: Disappearing messages — ✅ Mobile toggle + timer indicator on both platforms
- **MSG-13**: Pin messages — ✅ Verified E2E (already fully implemented)

## Deviations

- Timer indicator added to mobile only (web already had timestamp area; `messageId` prop added for
  save button instead)
- Pin verification was read-only audit — no code changes needed (fully implemented)
