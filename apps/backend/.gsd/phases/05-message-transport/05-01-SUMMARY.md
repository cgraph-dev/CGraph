# Summary: 05-01 Web Real-Time Message Transport

**Phase:** 05-message-transport
**Status:** Complete
**Completed:** 2026-02-28

## Tasks

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Add delivery status to message types and store | `93e2d5ee` | ✅ Done |
| 2 | Wire read receipt and delivery receipt socket handlers | `5e1799ca` | ✅ Done |
| 3 | Connect message status indicator and add typing refinements | `f1881ed2` | ✅ Done |

## Changes

### Task 1: Delivery Status Tracking
- Added `deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read'` to `Message` interface in both `packages/shared-types` and `chatStore.types.ts`
- Added `readReceipts` record and `updateMessageStatus`/`addReadReceipt` actions to `ChatState`
- Optimistic messages now start with `deliveryStatus: 'sending'`, updated to `'sent'` on server response
- Implemented `updateMessageStatus` (finds message in conversation array, sets status) and `addReadReceipt` (adds to receipts record, updates status to `'read'` if reader is conversation partner)
- Added `readReceipts: {}` to initial state and reset

### Task 2: Socket Receipt Handlers
- Added `msg_delivered` handler → calls `updateMessageStatus(convId, msgId, 'delivered')`
- Added `message_read` handler → calls `addReadReceipt()` AND `updateMessageStatus(convId, msgId, 'read')`
- Auto-pushes `msg_ack` back on receiving `new_message` from other users (delivery acknowledgment)
- Updated `markAsRead` to set `deliveryStatus: 'read'` on all partner messages after REST call succeeds

### Task 3: Status Indicator + Typing Refinements
- `MessageStatusIndicator` now uses `message.deliveryStatus` directly with metadata-based fallback
- Added `sendTypingDebounced()` utility: throttles `typing(true)` to max once per 3 seconds
- Auto-sends `typing(false)` after 5 seconds of keystroke inactivity
- Added typing auto-clear in store: 6-second timeout per user auto-clears stale typing indicators
- Routed `socketManager.sendTyping()` through debounced implementation

## Requirements Addressed

- **MSG-01**: Real-time 1:1 messaging via ConversationChannel (delivery pipeline complete)
- **MSG-06**: Delivery receipts (sending → sent → delivered → read status tracking)
- **MSG-18**: Read receipts with store tracking and socket handlers
- **MSG-19**: Typing indicators with debounce (3s throttle, 5s inactivity stop, 6s auto-clear)

## Deviations

- **None.** All 3 tasks executed as planned.

## Files Changed

- `packages/shared-types/src/models.ts`
- `apps/web/src/modules/chat/store/chatStore.types.ts`
- `apps/web/src/modules/chat/store/chatStore.messaging.ts`
- `apps/web/src/modules/chat/store/chatStore.message-ops.ts`
- `apps/web/src/modules/chat/store/chatStore.impl.ts`
- `apps/web/src/lib/socket/conversationChannel.ts`
- `apps/web/src/modules/chat/store/chatStore.operations.ts`
- `apps/web/src/modules/chat/components/message-bubble/message-bubble.tsx`
- `apps/web/src/lib/socket/socketUtils.ts`
- `apps/web/src/lib/socket/socket-manager.ts`
