---
phase: 29-secret-chat
plan: 01
status: complete
executed_at: 2026-03-10
---

# Plan 29-01 Summary: Secret Chat Backend Infrastructure

## What Was Built

### Task 1: Ghost Mode
- Redis-backed ghost mode module (`CGraph.Presence.GhostMode`)
- `activate/2` — sets `ghost:{user_id}` Redis key with configurable TTL (default 3600s)
- `deactivate/1` — removes ghost key
- `is_ghost?/1` — checks key existence
- `get_presence/2` — returns fake "offline" for ghost users, delegates to fallback otherwise
- `filter_ghost_users/1` — filters ghost users from online user lists
- `ttl/1` — returns remaining ghost mode TTL

### Task 2: Extended secret_conversations Schema
- Migration adding 8 new columns: `expires_at`, `ghost_initiator`, `ghost_recipient`, `alias_initiator`, `alias_recipient`, `secret_theme_id`, `panic_wipe_initiator`, `panic_wipe_recipient`
- Updated Ecto schema with new fields in `@optional_fields`
- Added length validations for alias and theme fields
- Partial index on `expires_at` for efficient expiry queries

### Task 3: Panic Wipe API
- Added `POST /api/v1/secret-chats/panic-wipe` route in messaging_routes.ex
- Controller action `panic_wipe/2` in SecretChatController
- Context function `panic_wipe/1` in SecretChat:
  - Terminates all active conversations for the user
  - Hard-deletes all messages in those conversations
  - Clears ghost mode Redis key
  - Broadcasts termination via PubSub
- Note: Routes for index/show/create/delete and timer were already wired

### Task 4: Timed Conversation Expiry
- Oban worker `CGraph.Workers.ExpireSecretConversations` (queue: `:cleanup`, max_attempts: 3)
- Finds active conversations where `expires_at < now()`
- Hard-deletes messages and marks conversations as "expired"
- Broadcasts expiry events via PubSub
- Context function `set_expires_at/3` to set/clear expiry on a conversation

## Files Created
- `apps/backend/lib/cgraph/presence/ghost_mode.ex`
- `apps/backend/priv/repo/migrations/20260310120000_extend_secret_conversations.exs`
- `apps/backend/lib/cgraph/workers/expire_secret_conversations.ex`

## Files Modified
- `apps/backend/lib/cgraph/messaging/secret_conversation.ex` — added 8 new fields + validations
- `apps/backend/lib/cgraph/messaging/secret_chat.ex` — added `panic_wipe/1`, `set_expires_at/3`, aliased Redis
- `apps/backend/lib/cgraph_web/controllers/api/v1/secret_chat_controller.ex` — added `panic_wipe/2` action
- `apps/backend/lib/cgraph_web/router/messaging_routes.ex` — added panic-wipe route

## Commits
| Hash | Message |
|------|---------|
| `7a509ac3` | feat(secret-chat): implement ghost mode with Redis-backed presence hiding |
| `782a5ed1` | feat(secret-chat): extend secret_conversations with ghost mode, aliases, expiry, theme, panic wipe fields |
| `3418070a` | feat(secret-chat): wire panic wipe route and implement panic wipe API endpoint |
| `7db2bd21` | feat(secret-chat): implement timed conversation expiry with Oban worker |

## Deviations from Plan
- **Routes already wired**: The plan stated routes were NOT wired, but `resources "/secret-chats"` and `put "/secret-chats/:id/timer"` were already present in `messaging_routes.ex`. Only the `panic-wipe` route was added.
- **Controller action name**: The existing controller uses `set_timer` (not `update_timer` as the plan referenced). Kept existing naming.
- **No `update_timer` route added**: The timer route was already wired as `put "/secret-chats/:id/timer", SecretChatController, :set_timer`.

## Verification
All tasks verified with `mix compile` — compiles cleanly with no new warnings.
