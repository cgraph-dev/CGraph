---
phase: 26-chat-superpowers
plan: 08
subsystem: crypto
tags: [e2ee, triple-ratchet, bootstrap, ratchet-header, key-backup, prekey-exhaustion, pqxdh]

requires:
  - phase: 26-03
    provides: e2ee hardening with cross-signing and key sync packages

provides:
  - E2EE bootstrap status check (ready/needs_prekeys/no_identity_key)
  - Ratchet header + session_id forwarding through ConversationChannel
  - Encrypted key backup store/retrieve (max 5 per user, upsert)
  - Pre-key exhaustion PubSub notification on bundle retrieval
  - Bootstrap REST endpoint (GET /api/v1/e2ee/bootstrap)
  - Key backup REST endpoints (POST/GET /api/v1/e2ee/keys/backup)

affects: [26-09, 26-10]

tech-stack:
  added: []
  patterns:
    - 'Opaque blob pattern: server stores ratchet_header as JSON map without parsing/validating'
    - 'Bootstrap status tri-state: no_identity_key → needs_prekeys → ready'
    - 'Blind relay key backup: encrypted client-side, server stores opaque binary'

key-files:
  created:
    - priv/repo/migrations/20260306220000_add_e2ee_message_fields_and_key_backup.exs
  modified:
    - lib/cgraph/crypto/e2ee.ex
    - lib/cgraph/crypto/e2ee/key_operations.ex
    - lib/cgraph/crypto/e2ee/key_sync.ex
    - lib/cgraph/messaging/message.ex
    - lib/cgraph_web/channels/conversation_channel.ex
    - lib/cgraph_web/controllers/api/v1/e2ee_controller.ex
    - lib/cgraph_web/controllers/api/v1/message_json.ex
    - lib/cgraph_web/router/user_routes.ex

key-decisions:
  - 'Ratchet header stored as :map field on messages, forwarded as-is (opaque to server)'
  - 'Bootstrap threshold: ≥10 prekeys = ready, <10 = needs_prekeys'
  - 'Key backup max 5 per user with upsert for same device'
  - 'Prekey exhaustion broadcast on user PubSub topic when no one-time prekeys left'

patterns-established:
  - 'Opaque crypto blob: server stores without inspecting or validating'
  - 'Bootstrap check pattern: called post-auth to determine client setup steps'

duration: 20min
completed: 2025-01-27
---

# Plan 26-08: DM E2EE Wiring Summary

**Triple Ratchet integration complete: E2EE bootstrap after auth, ratchet header pass-through in
channels, encrypted key backup across devices, and pre-key exhaustion notifications — 62 tests
passing.**

## What Was Done

### Task 1: E2EE Bootstrap + Channel Wiring

- **Bootstrap status**: Added `E2EE.check_bootstrap_status/1` that returns tri-state:
  `:no_identity_key` (new user), `:needs_prekeys` (low count), or `:ready` (≥10 prekeys)
- **Message schema**: Added `ratchet_header` (map) and `session_id` (string) fields via migration
- **Channel wiring**: `ConversationChannel.send_message/5` now passes `ratchet_header` and
  `session_id` from client params through to message creation
- **MessageJSON**: Both struct and map variants include `ratchetHeader` and `sessionId` in broadcast
  payload - recipients receive the opaque ratchet data as-is
- **Prekey exhaustion**: When `get_prekey_bundle` finds no one-time prekeys, broadcasts
  `{:prekey_exhaustion, %{count: 0}}` to `user:{user_id}` PubSub topic

### Task 2: REST Endpoints + Key Backup + Tests

- **Bootstrap endpoint**: `GET /api/v1/e2ee/bootstrap` returns `{status, prekey_count}`
- **Key backup**: `KeySync.store_encrypted_key_backup/3` with upsert, max 5 per user,
  `get_encrypted_key_backup/2`, `list_devices_with_backup/1`
- **Backup routes**: `POST /api/v1/e2ee/keys/backup` (store),
  `GET /api/v1/e2ee/keys/backup/:device_id` (retrieve)
- **Route ordering**: Bootstrap and backup routes placed before `:user_id` wildcard to avoid
  conflicts

## Test Results

```
62 tests, 0 failures
```
