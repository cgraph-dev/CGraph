# Summary: 05-02 Mobile Real-Time Message Transport

**Phase:** 05-message-transport
**Status:** Complete
**Completed:** 2026-02-28

## Tasks

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Wire delivery receipt ACK + status updates in chatStore | `9ec081ad` | ✅ Done |
| 2 | Render message status + auto-read on scroll visibility | `457cc283` | ✅ Done |
| 3 | Privacy toggle integration + typing refinements | `39c3f2a8` | ✅ Done |

## Changes

### Task 1: Delivery Receipt ACK + Status Updates
- Added `status`, `deliveredAt`, `readAt`, `isOptimistic`, `clientMessageId` to chatStore `Message` interface
- Updated `normalizeMessage` to extract delivery tracking fields from snake_case/camelCase payloads
- Added `updateMessageStatus` action: finds message by ID in conversation array, sets status + extra fields
- Implemented optimistic send: inserts message with `status: 'sending'` immediately, replaces with server version (`'sent'`) on API success, marks `'failed'` on error
- Uses `client_message_id` for idempotent optimistic message replacement (dedup via Set)
- On `new_message` from other user: pushes `msg_ack` back through channel for delivery confirmation
- Added `msg_delivered` handler → `updateMessageStatus(convId, msgId, 'delivered')`
- Added `message_read` handler → `updateMessageStatus(convId, msgId, 'read')`
- Added `msg_delivered` and `message_read` to socket.ts event listener pass-through array

### Task 2: Message Status Rendering + Auto-Read on Scroll
- Message bubbles already rendered status via `getMessageStatusInfo` (all 5 states: sending/sent/delivered/read/failed) — verified existing wiring works with new `status` field
- Added `msg_delivered` handler in `useConversationSocket` for delivery receipt socket events
- Added `handleSocketMessageDelivered` in `useSocketEventHandlers` to update message status
- Wired `onMessageDelivered` through `use-conversation-setup` to the socket
- Created `useAutoReadOnVisibility` hook: fires `mark_read` when messages from other user become visible
  - 2-second debounce to prevent flooding
  - 500ms initial read delay when opening a conversation with unread messages
  - Gated by `showReadReceipts` privacy setting
- Wired `onViewableItemsChanged` on FlatList with 50% visibility threshold

### Task 3: Privacy Toggles + Typing Refinements
- **Read receipt gating**: `mark_read` events only sent when `showReadReceipts === true` (checked in `useConversationSocket` and `useAutoReadOnVisibility`)
- **Typing indicator gating**: `sendTyping` events suppressed when `showTypingIndicators === false`; header typing display also gated
- **Typing throttle**: Max 1 `typing(true)` event per 3 seconds (was every keystroke)
- **Auto-stop typing**: Sends `typing(false)` after 5 seconds of no keystroke activity; clears immediately when text is emptied
- **Typing auto-clear safety net**: `useTypingAutoClear` hook — 6-second timer per typing user auto-clears stuck indicators when stop events are lost
- Imported `usePrivacySettings` in `use-conversation-setup` for centralized toggle access

## Requirements Addressed

- **MSG-01**: Real-time 1:1 messaging delivery lifecycle complete on mobile (sending → sent → delivered → read)
- **MSG-06**: Delivery receipts with optimistic send and `msg_ack` acknowledgment
- **MSG-18**: Read receipts with auto-read on scroll visibility, privacy toggle gating
- **MSG-19**: Typing indicators with 3s throttle, 5s auto-stop, 6s auto-clear, privacy toggle gating

## Deviations

- **None.** All 3 tasks executed as planned. Existing `getMessageStatusInfo` in utils already handled all status rendering, so no changes needed in `message-bubble.tsx` itself.

## Files Changed

- `apps/mobile/src/stores/chatStore.ts`
- `apps/mobile/src/lib/socket.ts`
- `apps/mobile/src/screens/messages/conversation-screen.tsx`
- `apps/mobile/src/screens/messages/conversation-screen/hooks/useConversationSocket.ts`
- `apps/mobile/src/screens/messages/conversation-screen/hooks/useConversationData.ts` (no changes needed — auto-read moved to useAutoReadOnVisibility)
- `apps/mobile/src/screens/messages/conversation-screen/hooks/useMessageSending.ts`
- `apps/mobile/src/screens/messages/conversation-screen/hooks/useSocketEventHandlers.ts`
- `apps/mobile/src/screens/messages/conversation-screen/hooks/use-conversation-setup.ts`
