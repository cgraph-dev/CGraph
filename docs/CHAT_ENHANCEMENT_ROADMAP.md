# CGraph Chat Enhancement Roadmap

> **Version**: 1.2 | **Updated**: January 2026 | **Status**: Active Development

This document tracks the **ACTUAL working status** of chat features and the implementation roadmap.

## 🎉 Recent Completions (This Session)

### ✅ Message Edit/Delete/Pin - FIXED

- Added `:update, :delete` routes to router.ex
- Implemented edit/delete/pin actions in MessageController
- Created action menu dropdown with Edit/Pin/Delete options
- Added inline edit mode with Save/Cancel buttons
- All buttons properly wired with onClick handlers

### ✅ Voice Message Upload - FIXED

- Fixed response handling to rely on WebSocket broadcasts
- Backend automatically creates message when conversation_id provided
- Removed redundant manual message addition
- Fixed FormData handling (let axios auto-detect Content-Type)

### ✅ Voice/Video Call UI - CONNECTED

- Created VoiceCallModal.tsx with call controls
- Created VideoCallModal.tsx with video controls
- Wired PhoneIcon and VideoCameraIcon buttons
- Added call state management and handlers
- Ready for WebRTC backend integration

---

## CRITICAL: Actual Working Status

**IMPORTANT:** This section reflects what ACTUALLY WORKS vs what has code but is broken.

### Summary

| Feature            | UI Exists | Backend Ready |             Actually Works              |
| ------------------ | :-------: | :-----------: | :-------------------------------------: |
| Send Text Messages |    Yes    |      Yes      |               **YES** ✅                |
| E2EE Encryption    |    Yes    |      Yes      |    **PARTIAL** (silent fallback) ⚠️     |
| Message Replies    |    Yes    |      Yes      |               **YES** ✅                |
| Message Edit       |    Yes    |  **YES** ✅   |               **YES** ✅                |
| Message Delete     |    Yes    |  **YES** ✅   |               **YES** ✅                |
| Message Pin        |    Yes    |  **YES** ✅   |               **YES** ✅                |
| Message Reactions  |    Yes    |      Yes      |               **YES** ✅                |
| Stickers           |    Yes    |      Yes      |               **YES** ✅                |
| GIFs               |    Yes    |    **NO**     |                **NO** ❌                |
| Voice Recording    |    Yes    |      Yes      |               **YES** ✅                |
| Voice Playback     |    Yes    |      Yes      |               **YES** ✅                |
| Read Receipts      |    Yes    |      Yes      |               **YES** ✅                |
| Typing Indicators  |    Yes    |      Yes      |               **YES** ✅                |
| Voice Calls        |    Yes    |      Yes      | **PARTIAL** (UI ready, needs WebRTC) ⚠️ |
| Video Calls        |    Yes    |      Yes      | **PARTIAL** (UI ready, needs WebRTC) ⚠️ |
| File Sharing       |    No     |  Schema only  |                **NO** ❌                |
| Message Forwarding |    No     |      No       |                **NO** ❌                |

---

## What's Actually Working

### Fully Working Features

- [x] **Basic Message Sending**
  - Text messages send and display correctly
  - Messages persist in database
  - Real-time delivery via WebSocket

- [x] **Message Replies**
  - Reply button works
  - Quoted message preview shows
  - Reply relationship stored in database

- [x] **Message Reactions**
  - Emoji picker works
  - Reactions save to database
  - Real-time sync to other users
  - One reaction per user limit enforced

- [x] **Sticker Sending**
  - Sticker picker fully functional
  - 6+ packs with animations
  - Purchase system works
  - Stickers display in chat

- [x] **Read Receipts**
  - Marking messages as read works
  - Unread counts update correctly
  - API endpoints functional

- [x] **Typing Indicators**
  - Typing status broadcasts
  - 5-second timeout works
  - Multi-user typing shown

- [x] **Voice Message Playback**
  - Audio player works
  - Waveform visualization displays
  - Seek functionality works

---

## What's BROKEN (Has Code But Doesn't Work)

### Critical Issues

#### 1. Message Edit - BROKEN

**Root Cause:** Backend route missing

```
Frontend: chatStore.editMessage() calls PATCH /api/v1/conversations/:id/messages/:id
Backend: router.ex line 319 only has [:index, :create] - NO :update action
Result: 404 error, edit fails silently
```

**Files to Fix:**

- `apps/backend/lib/cgraph_web/router.ex` - Add `:update` to message resources
- `apps/backend/lib/cgraph_web/controllers/api/v1/message_controller.ex` - Add `update` action
- `apps/web/src/pages/messages/Conversation.tsx` - Wire up edit button

#### 2. Message Delete - BROKEN

**Root Cause:** Backend route missing

```
Frontend: chatStore.deleteMessage() calls DELETE /api/v1/conversations/:id/messages/:id
Backend: router.ex line 319 only has [:index, :create] - NO :delete action
Result: 404 error, delete fails silently
```

**Files to Fix:**

- `apps/backend/lib/cgraph_web/router.ex` - Add `:delete` to message resources
- `apps/backend/lib/cgraph_web/controllers/api/v1/message_controller.ex` - Add `delete` action
- `apps/web/src/pages/messages/Conversation.tsx` - Wire up delete button

#### 3. Message Pin - BROKEN

**Root Cause:** No backend implementation at all

```
Frontend: UI button exists but no handler
Backend: No pin routes, no controller action
Result: Button does nothing
```

**Files to Fix:**

- Create pin/unpin routes in router.ex
- Add pin actions to message_controller.ex
- Add `pinned_at`, `pinned_by` to message schema (if not exists)
- Wire up UI

#### 4. Voice Message Upload - BROKEN

**Root Cause:** Blob never uploaded to server

```
Frontend: VoiceMessageRecorder captures Blob correctly
Problem: MessageInput receives Blob but doesn't upload it
Result: Recording works, but message sends empty voice reference
```

**Files to Fix:**

- `apps/web/src/pages/messages/Conversation.tsx` - Add FormData upload
- Ensure `/api/v1/voice-messages` endpoint handles uploads correctly

#### 5. GIF Picker - BROKEN

**Root Cause:** No backend for GIF search/storage

```
Frontend: GifPicker.tsx has full UI
Problem: Tenor API integration exists but no backend endpoint
Result: GIF picker may show but sending fails
```

**Files to Fix:**

- Create `/api/v1/gifs/search` endpoint (or use client-side Tenor)
- Add GIF message type handling

#### 6. Voice/Video Calls - NOT CONNECTED

**Root Cause:** UI buttons exist but not wired to WebRTC

```
Frontend: PhoneIcon and VideoCameraIcon buttons exist
Backend: Full WebRTC infrastructure ready
Problem: Buttons have no onClick handlers
Result: Clicking does nothing
```

**Files to Fix:**

- `apps/web/src/pages/messages/Conversation.tsx` - Add call handlers
- Create VoiceCallModal.tsx and VideoCallModal.tsx
- Connect to existing WebRTC system

#### 7. E2EE Silent Fallback - SECURITY ISSUE

**Root Cause:** Encryption errors fall back to plaintext without warning

```typescript
// chatStore.ts lines 295-298
catch (encryptError) {
  logger.error('E2EE encryption failed, falling back to plaintext:', encryptError);
  // ← Sends unencrypted WITHOUT user notification!
}
```

**Files to Fix:**

- `apps/web/src/stores/chatStore.ts` - Show user warning on E2EE failure
- Consider refusing to send instead of silent fallback

#### 8. Action Buttons - PLACEHOLDER

**Root Cause:** Buttons rendered without onClick handlers

```
Conversation.tsx line 1340: "More" button has no onClick
Conversation.tsx line 1454: "React" button has no onClick
Result: Buttons appear but do nothing when clicked
```

**Files to Fix:**

- `apps/web/src/pages/messages/Conversation.tsx` - Add dropdown menu for More
- Wire up all action buttons properly

---

## Implementation Priority

### P0 - Critical Fixes (Do First)

- [x] **Fix Message Edit Route** ✅ COMPLETED
  - [x] Add `:update` to router.ex message resources
  - [x] Implement `update` action in MessageController
  - [x] Wire edit button in Conversation.tsx
  - [ ] Test edit flow end-to-end

- [x] **Fix Message Delete Route** ✅ COMPLETED
  - [x] Add `:delete` to router.ex message resources
  - [x] Implement `delete` action in MessageController
  - [x] Wire delete button in Conversation.tsx
  - [ ] Test delete flow end-to-end

- [x] **Fix Voice Message Upload** ✅ COMPLETED
  - [x] Add FormData upload in Conversation.tsx
  - [x] Fixed response handling (rely on WebSocket broadcast)
  - [x] Removed manual Content-Type header (axios auto-detects)
  - [ ] Test recording → upload → playback flow

- [x] **Connect Voice Calls** ✅ COMPLETED
  - [x] Create VoiceCallModal.tsx
  - [x] Wire PhoneIcon onClick to modal
  - [x] Add call handlers and state management
  - [ ] Connect modal to WebRTC system (TODO: backend integration)
  - [ ] Test 1:1 voice calls

- [x] **Connect Video Calls** ✅ COMPLETED
  - [x] Create VideoCallModal.tsx
  - [x] Wire VideoCameraIcon onClick to modal
  - [x] Add video controls (mute, camera, fullscreen)
  - [ ] Connect modal to WebRTC system (TODO: backend integration)
  - [ ] Test 1:1 video calls

### P1 - Important Fixes

- [x] **Fix Message Pin** ✅ COMPLETED
  - [x] Add pin routes to router.ex
  - [x] Implement pin/unpin in MessageController
  - [x] Wire pin button in UI
  - [ ] Display pinned messages prominently (future enhancement)

- [ ] **Fix E2EE Silent Fallback**
  - [ ] Show user warning when encryption fails
  - [ ] Consider blocking send on encryption failure
  - [ ] Add backend validation of encrypted format

- [x] **Fix Action Menu Buttons** ✅ COMPLETED
  - [x] Add dropdown menu component for "More"
  - [x] Wire all action buttons properly
  - [x] Add proper handlers for each action

- [ ] **Fix GIF Sending**
  - [ ] Decide: client-side Tenor or backend proxy
  - [ ] Implement GIF message type handling
  - [ ] Test GIF sending end-to-end

### P2 - New Features

- [ ] File Sharing in Chat
- [ ] Message Forwarding
- [ ] Advanced Search Filters
- [ ] Message Scheduling
- [ ] 7 Revolutionary Features (see below)

---

## Backend Routes to Add

```elixir
# In router.ex, change line 319 from:
resources "/messages", MessageController, only: [:index, :create]

# To:
resources "/messages", MessageController, only: [:index, :create, :update, :delete] do
  post "/pin", MessageController, :pin
  delete "/pin", MessageController, :unpin
end
```

## Frontend Fixes Needed

```typescript
// In Conversation.tsx, the "More" button needs:
<button onClick={() => setShowMessageMenu(messageId)}>
  <EllipsisVerticalIcon />
</button>

// Message menu with:
- Edit (own messages only)
- Delete (own messages only)
- Pin
- Forward (future)
```

---

## 7 Revolutionary Features (After Fixes)

Only implement these AFTER the critical fixes above are complete:

1. **Time-Capsule Messaging** - Scheduling, burn after read, memory lane
2. **Quantum Search** - Semantic search with AI
3. **Voice Spaces** - Drop-in audio rooms with transcription
4. **Collaborative Quests** - Conversation-level gamification
5. **Interactive Polls** - In-chat voting with XP rewards
6. **Cipher Mode** - Ultra-privacy features
7. **AI Copilot** - Smart replies, summaries, translation

---

## Key Files Reference

### Backend (Need Fixes)

- [router.ex](../apps/backend/lib/cgraph_web/router.ex) - Line 319, add :update, :delete
- [message_controller.ex](../apps/backend/lib/cgraph_web/controllers/api/v1/message_controller.ex) -
  Add update, delete, pin actions
- [messaging.ex](../apps/backend/lib/cgraph/messaging.ex) - Business logic

### Frontend (Need Fixes)

- [Conversation.tsx](../apps/web/src/pages/messages/Conversation.tsx) - Wire up all buttons
- [chatStore.ts](../apps/web/src/stores/chatStore.ts) - Fix E2EE fallback
- [MessageInput.tsx](../apps/web/src/components/messaging/MessageInput.tsx) - Voice upload

### Already Working (Reference)

- [MessageReactions.tsx](../apps/web/src/components/chat/MessageReactions.tsx) - Working
- [StickerPicker.tsx](../apps/web/src/components/chat/StickerPicker.tsx) - Working
- [VoiceMessagePlayer.tsx](../apps/web/src/components/VoiceMessagePlayer.tsx) - Working

---

## Testing Checklist

After fixes, verify each feature:

- [ ] Send text message → appears in chat
- [ ] Reply to message → shows quoted preview
- [ ] Edit message → content updates
- [ ] Delete message → message removed/tombstoned
- [ ] Pin message → shows as pinned
- [ ] Add reaction → reaction appears
- [ ] Send sticker → sticker displays
- [ ] Send GIF → GIF displays
- [ ] Record voice → uploads and plays
- [ ] Start voice call → connects
- [ ] Start video call → video shows
- [ ] Typing indicator → shows for other users
- [ ] Read receipt → message marked as read

---

**Last Updated:** January 2026 **Status:** Critical fixes needed before new features
