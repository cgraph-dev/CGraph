---
phase: 26-chat-superpowers
plan: 03
subsystem: crypto
tags: [e2ee, ratchet, sessions, safety-numbers, prekey, oban]

requires:
  - phase: 26-01
    provides: 'Secret chat system with conversations and messages'
provides:
  - 'E2EE session tracking (e2ee_sessions table)'
  - 'SecretSession module with ratchet key rotation detection'
  - 'RatchetState module with safety number computation'
  - 'Pre-key watermark monitoring with client notification'
  - 'DeleteExpiredSecretMessages Oban worker (every minute)'
  - 'Expiry-on-read behavior for self-destruct messages'
affects: [26-08-dm-e2ee-wiring]

tech-stack:
  added: []
  patterns:
    - 'E2EE sessions track public ratchet keys only (server never sees private keys)'
    - 'Key rotation threshold at 100 messages'
    - 'Safety numbers: 60-digit string (12 groups of 5) from SHA-256 of sorted public keys'
    - 'Pre-key watermark broadcasts to user channel when below 25'

key-files:
  created:
    - lib/cgraph/crypto/e2ee/secret_session.ex
    - lib/cgraph/crypto/e2ee/ratchet_state.ex
    - lib/cgraph/workers/delete_expired_secret_messages.ex
    - priv/repo/migrations/20260306190000_add_e2ee_ratchet_tracking.exs
    - test/cgraph/crypto/e2ee/secret_session_test.exs
    - test/cgraph/crypto/e2ee/ratchet_state_test.exs
  modified:
    - lib/cgraph/crypto/e2ee/key_operations.ex
    - lib/cgraph/messaging/secret_chat.ex
    - config/config.exs

key-decisions:
  - 'Self-destruct expiry computed on read not send (more aligned with Telegram behavior)'
  - 'Rotation threshold set at 100 messages (configurable via module attribute)'
  - 'Stale session detection: 30 days of inactivity'
  - 'Safety numbers use Signal-compatible algorithm (sorted keys + SHA-256)'
  - 'Pre-key replenishment uses PubSub broadcast to user channel'

patterns-established:
  - 'E2EE session tracking: public-key-only server storage with rotation monitoring'
  - 'Safety number computation: deterministic, order-independent, 60-digit format'
---

# Plan 26-03 Summary: E2EE Hardening

## What Was Built

Server-side E2EE infrastructure hardening: session tracking, ratchet state management, safety
numbers, pre-key watermark monitoring, and self-destruct message cleanup worker.

### Database

- `e2ee_sessions` table: tracks active E2EE sessions with public ratchet keys, message counts,
  rotation timestamps
- Added `one_time_prekey_count`, `prekey_low_watermark`, `last_prekey_replenish_at` to
  `e2ee_identity_keys`

### SecretSession Module

- `create_session/5` — registers E2EE session for user/peer/conversation
- `update_ratchet_key/2` — advances ratchet, detects rotation needed
- `get_session/3`, `list_sessions/1` — query active sessions
- `terminate_session/1` — marks session terminated
- `needs_key_rotation?/1` — true every 100 messages
- `mark_stale_sessions/0` — marks 30+ day inactive sessions as stale

### RatchetState Module

- `verify_ratchet_advance/2` — validates ratchet header advances
- `compute_safety_number/2` — 60-digit string (12x5 groups) from SHA-256
- `safety_number_qr_data/2` — QR verification data
- `fingerprint/1` — 16-char hex fingerprint from public key

### Key Operations Updates

- `check_prekey_watermark/1` — counts prekeys, broadcasts when below 25
- `replenish_prekeys/2` — bulk insert new one-time prekeys

### Self-Destruct Worker

- `DeleteExpiredSecretMessages` — runs every minute via Oban cron
- Hard-deletes expired secret messages
- Marks stale E2EE sessions

### Behavior Change

- Self-destruct expiry now computed on read, not send (message stays until read)

## Test Results

- **20 session tests** — lifecycle, ratchet key, rotation, stale detection
- **12 ratchet state tests** — validation, safety numbers, fingerprints
- **30 secret chat tests** — updated for expiry-on-read behavior
- **62 total, 0 failures**

## Commit

`38b11960` — feat(26-03): e2ee hardening with session tracking and ratchet state
