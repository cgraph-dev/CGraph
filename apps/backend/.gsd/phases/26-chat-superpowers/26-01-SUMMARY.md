---
phase: 26-chat-superpowers
plan: 01
subsystem: messaging
tags: [secret-chat, e2ee, self-destruct, channels, privacy, ecto]

requires:
  - phase: 04-messaging
    provides: 'Messaging system with conversations, messages, user_socket'
provides:
  - 'SecretConversation schema (device-bound, one active per pair)'
  - 'SecretMessage schema (binary ciphertext, nonce, ratchet header)'
  - 'SecretChat context with full CRUD, self-destruct timers, hard-delete'
  - '5 REST API endpoints under /api/v1/secret-chats/'
  - 'SecretChatChannel for real-time encrypted messaging'
  - 'Factories: secret_conversation, secret_message'
affects: [26-03-e2ee-hardening, 26-05-voice-video, 26-07-chat-completeness]

tech-stack:
  added: []
  patterns:
    - 'Binary fields for ciphertext/nonce/ratchet_header (server never sees plaintext)'
    - 'Partial unique index for one-active-per-pair constraint'
    - 'Normalized user ordering (order_ids) for consistent pair indexing'
    - 'Hard-delete on termination (privacy feature, no recovery)'
    - 'Base64 encoding for binary fields over WebSocket JSON'

key-files:
  created:
    - lib/cgraph/messaging/secret_chat.ex
    - lib/cgraph/messaging/secret_conversation.ex
    - lib/cgraph/messaging/secret_message.ex
    - lib/cgraph_web/controllers/api/v1/secret_chat_controller.ex
    - lib/cgraph_web/controllers/api/v1/secret_chat_json.ex
    - lib/cgraph_web/channels/secret_chat_channel.ex
    - priv/repo/migrations/20260306180000_create_secret_conversations.exs
    - test/cgraph/messaging/secret_chat_test.exs
    - test/cgraph_web/controllers/api/v1/secret_chat_controller_test.exs
  modified:
    - lib/cgraph_web/router/messaging_routes.ex
    - lib/cgraph_web/channels/user_socket.ex
    - test/support/factory.ex

key-decisions:
  - 'User pair order normalized via order_ids/2 (smaller UUID first) for unique constraint'
  - 'Self-destruct valid values: nil, 5, 30, 60, 300, 3600, 86400, 604800'
  - 'Expiry set on send time initially, recomputed from read time on mark_secret_message_read'
  - 'JSON view never exposes ciphertext; encrypted content only via channel'
  - 'Channel rate-limited: 10 messages per 10 seconds'
  - 'Screenshot detection broadcasts alert to other participant'

patterns-established:
  - 'Binary blob storage pattern: :binary Ecto type for encrypted data'
  - 'Partial unique index for one-active-per-pair constraint on secret conversations'
  - 'Hard-delete pattern: Repo.delete_all in transaction before status update'
  - 'Channel PubSub integration: context broadcasts, channel handles_info'
---

# Plan 26-01 Summary: Secret Chat — Device-Bound E2EE Conversations

## What Was Built

Telegram-style secret chats with device-bound E2EE, self-destruct timers, and hard-delete on
termination.

### Database

- `secret_conversations` table: status, initiator/recipient with device IDs and fingerprints,
  self-destruct timer, termination tracking
- `secret_messages` table: binary ciphertext/nonce/ratchet_header, content type, optional
  file_metadata, expires_at for self-destruct
- Partial unique index on (initiator_id, recipient_id) WHERE status = 'active'
- Indexes on conversation messages and expiring messages

### Context (SecretChat)

- `create_secret_conversation/3` — normalized pair ordering, :already_exists and
  :cannot_chat_with_self guards
- `list_secret_conversations/1` — active only, preloads participants
- `get_secret_conversation/2` — participant verification
- `destroy_secret_chat/2` — transaction: hard-delete ALL messages then terminate, PubSub broadcast
- `send_secret_message/3` — validates active + participant, auto-computes expires_at from
  self_destruct_seconds
- `list_secret_messages/2` — cursor-paginated, excludes expired
- `mark_secret_message_read/2` — sets read_at, recomputes expiry from read time
- `set_self_destruct_timer/3` — validates against allowed values, PubSub broadcast
- `cleanup_expired_messages/0` — for Oban worker

### REST API (5 endpoints)

| Method | Path                           | Action    |
| ------ | ------------------------------ | --------- |
| POST   | /api/v1/secret-chats           | create    |
| GET    | /api/v1/secret-chats           | index     |
| GET    | /api/v1/secret-chats/:id       | show      |
| DELETE | /api/v1/secret-chats/:id       | delete    |
| PUT    | /api/v1/secret-chats/:id/timer | set_timer |

### Real-Time Channel (SecretChatChannel)

- Joins `secret_chat:<id>`, verifies participant + active status
- `new_message` — Base64 encode/decode for ciphertext, rate limited
- `typing` — broadcast_from for typing indicators
- `message_read` — triggers self-destruct timer
- `screenshot_detected` — broadcasts alert
- PubSub handlers for timer_changed and secret_chat_terminated

### JSON View

Renders conversation with participant info (id, username, display_name, avatar_url). Never includes
ciphertext in REST responses.

## Test Results

- **30 context tests** — conversation lifecycle, messages, self-destruct, cleanup
- **21 controller tests** — auth (5), CRUD (12), timer (4)
- **51 total, 0 failures**

## Commit

`e6dec1b3` — feat(26-01): secret chat device-bound e2ee conversations
