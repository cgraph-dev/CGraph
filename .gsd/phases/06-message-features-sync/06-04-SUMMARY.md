---
phase: 06-message-features-sync
plan: "04"
execution_date: "2026-02-28"
status: complete
---

## Objective

Build edit history viewer on web and mobile, and add the missing mobile inline edit form, so users can see previous message versions and mobile users can edit their own messages.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Web edit history viewer & interactive edited indicator | `e6a8b379` | 7 files (edit-history-viewer.tsx created, message-bubble.tsx, chatStore.message-ops.ts, chatStore.types.ts, chatStore.impl.ts, normalizers.ts, index.ts) |
| 2 | Mobile edit form, history viewer & edited indicator | `57dd9e47` | 5 files (message-edit-form.tsx created, edit-history-viewer.tsx created, message-bubble.tsx, chatStore.ts, types/index.ts) |

## Files Modified

### Created
- `apps/web/src/modules/chat/components/message-bubble/edit-history-viewer.tsx` — Popover component showing all previous versions
- `apps/mobile/src/screens/messages/conversation-screen/components/message-edit-form.tsx` — Inline edit form with save/cancel
- `apps/mobile/src/screens/messages/conversation-screen/components/edit-history-viewer.tsx` — Bottom sheet modal for edit history

### Modified
- `apps/web/src/modules/chat/components/message-bubble/message-bubble.tsx` — "(edited)" now clickable, opens EditHistoryViewer
- `apps/web/src/modules/chat/store/chatStore.message-ops.ts` — Optimistic edit history entry on editMessage
- `apps/web/src/modules/chat/store/chatStore.types.ts` — fetchEditHistory action type
- `apps/web/src/lib/api-utils/normalizers.ts` — normalizeEditHistory helper
- `apps/mobile/src/screens/messages/conversation-screen/components/message-bubble.tsx` — "(edited)" tappable, edit mode inline form
- `apps/mobile/src/stores/chatStore.ts` — edits mapped from socket events
- `apps/mobile/src/types/index.ts` — EditHistory interface added

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Web normalizer for edit history**
- Web needed a `normalizeEditHistory` helper in `api-utils/normalizers.ts` to map snake_case backend payload to camelCase `EditHistory[]`
- Added to support the `message_updated` socket handler

**2. [Rule 2 - Missing Critical] Mobile EditHistory type**
- Mobile uses its own type system (`apps/mobile/src/types/index.ts`) separate from shared-types
- Added `EditHistory` interface and `edits?: EditHistory[]` to mobile `Message` type

## Verification Results

- Web type check: Pre-existing errors only, 0 new errors from edit history changes
- Mobile type check: Pre-existing errors only, 0 new errors from edit form/history changes
- Functional: "(edited)" indicators are interactive on both platforms

## Must-Haves Status

| Must-Have | Status |
|-----------|--------|
| Web "(edited)" clickable → opens edit history | ✅ Confirmed |
| Real-time edit updates for other users | ✅ Socket handler maps edits |
| Mobile inline edit form from action menu | ✅ Created |
| Mobile "(edited)" tappable → opens history | ✅ Created |
