---
phase: 12-roles-moderation
plan: 04
subsystem: emoji-e2ee
tags: [elixir, emoji, e2ee, sender-key, ecdh, aes-gcm, react, react-native, zustand]

requires:
  - phase: 12-roles-moderation
    plan: 01
    provides: "effective permissions, manage_emojis permission"
  - phase: 10-e2ee-encryption
    provides: "E2EE infrastructure, crypto primitives"
provides:
  - "Permission-gated group emoji create/delete"
  - "Animated emoji validation with size limits"
  - "group_e2ee_sessions + group_sender_key_distributions DB tables"
  - "GroupSession and GroupSenderKeyDistribution Ecto schemas"
  - "GroupKeyDistribution context: register, distribute, rotate, cleanup"
  - "Sender key channel events: register, distribute, request_key_distribution"
  - "Web Sender Key E2EE (ECDH P-256 + AES-256-GCM)"
  - "Mobile Sender Key E2EE (React Native compatible)"
  - "Zustand groupE2eeStore for web client key management"
affects: [group-messages, encryption, emoji]

tech-stack:
  added: []
  patterns:
    - "Sender Key protocol: one key per sender, shared via ECDH-wrapped distribution"
    - "Chain index ratcheting: SHA-256(pubkey || chain-N) → AES key per message"
    - "Ephemeral ECDH + AES-GCM wrapping for sender key distribution"
    - "In-memory CryptoKey cache + serializable base64 in Zustand persist"

key-files:
  created:
    - apps/backend/priv/repo/migrations/20260301200001_create_group_e2ee_sessions.exs
    - apps/backend/lib/cgraph/crypto/e2ee/group_session.ex
    - apps/backend/lib/cgraph/crypto/e2ee/group_key_distribution.ex
    - apps/web/src/lib/crypto/group-e2ee.ts
    - apps/web/src/modules/groups/store/groupE2eeStore.ts
    - apps/mobile/src/lib/crypto/group-e2ee.ts
  modified:
    - apps/backend/lib/cgraph/groups/emojis.ex
    - apps/backend/lib/cgraph_web/channels/group_channel.ex

key-decisions:
  - "ECDH P-256 for interop with existing identity keys; AES-256-GCM for symmetric encryption"
  - "Chain index ratchet: pubkey+index → SHA-256 → AES key (no Double Ratchet for groups)"
  - "Sender key distribution via ephemeral ECDH agreement with recipient identity key"
  - "Session keys pushed on channel after_join for seamless key acquisition"
  - "Upsert on register_sender_key allows key rotation without conflicts"
  - "Static emoji max 128KB, animated max 256KB"
  - "CryptoKey objects cached in-memory Map (not serializable to Zustand persist)"

patterns-established:
  - "Group E2EE: generate sender key → register with server → distribute to peers"
  - "Message flow: encrypt(pubkey+chainIndex→AES) → send → recipient derives same AES key"
  - "Key rotation: invalidate old sessions → generate new key → re-register → re-distribute"

duration: 18min
completed: 2025-01-20
---

# Plan 12-04: Custom Emoji Permissions & Group E2EE Summary

**Permission-gated emoji operations plus full Sender Key protocol for group E2EE — backend schema, key distribution context, channel events, and client implementations for web and mobile.**

## What Was Built

### Task 1: Emoji permission enforcement
- Added `create_group_emoji_with_permission/4` and `delete_group_emoji_with_permission/3`
- Permission check via `Roles.has_effective_permission?/4` for `:manage_emojis`
- Animated emoji validation: file size limits (128KB static, 256KB animated)
- `validate_animated_emoji/1` checks content_type for gif/webp/apng

### Task 2: Group E2EE database schema
- Migration creates `group_e2ee_sessions` table: group_id, user_id, device_id, sender_key_id (unique), public_sender_key, chain_key_index, is_active
- Migration creates `group_sender_key_distributions` table: session_id (FK), recipient_user_id, recipient_device_id, encrypted_sender_key, distributed_at
- Indexes on (group_id, user_id, is_active) and (recipient_user_id, recipient_device_id)
- `GroupSession` and `GroupSenderKeyDistribution` Ecto schemas with changesets

### Task 3: Key distribution backend
- Created `group_key_distribution.ex` (180L) with full Sender Key lifecycle:
  - `register_sender_key/4`: upsert session with base64-decoded public key
  - `distribute_key/5`: store encrypted sender key for recipient
  - `get_session_keys/2`: fetch all active sessions for a group
  - `get_group_members_keys/1`: get all member keys for distribution
  - `rotate_keys/2`: invalidate old sessions per user
  - `invalidate_user_sessions/3`: mark user sessions inactive (leave/remove)
  - `cleanup_stale_sessions/1`: purge sessions older than 30 days
  - `increment_chain_index/1`: atomic chain index bump
- Wired into `group_channel.ex`:
  - `after_join`: push `e2ee_session_keys` event with all active group keys
  - `handle_in "register_sender_key"`: register + broadcast new key
  - `handle_in "distribute_sender_key"`: store encrypted key for recipient
  - `handle_in "request_key_distribution"`: broadcast key request to peers

### Task 4: Client-side E2EE implementations
- **Web** (`group-e2ee.ts`, 302L): generateSenderKey, encryptGroupMessage, decryptGroupMessage, encryptSenderKeyForRecipient, decryptReceivedSenderKey, exportPublicKey, importPublicKey
- **Web store** (`groupE2eeStore.ts`): Zustand persist store with sender key management, peer key import/cache, encrypt/decrypt actions, group E2EE enable/disable
- **Mobile** (`group-e2ee.ts`): Same API surface as web, adapted for React Native (Buffer-based base64, getSubtle() accessor for polyfilled SubtleCrypto, textEncoder/textDecoder shims)
