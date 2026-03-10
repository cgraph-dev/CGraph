# Phase 29: Secret Chat — Context

**Gathered:** 2026-03-10
**Status:** Ready for execution

<domain>
## Phase Boundary

Build complete Secret Chat with E2E encryption (custom Signal Protocol from packages/crypto/),
Ghost Mode, Secret Identity, Timed Conversations, Panic Wipe, and 12 secret themes.

Backend secret chat core is **80% built** (context, controller, channel, schemas, Oban worker,
E2EE session tracking — 975 lines). The features layer (Ghost Mode, aliases, themes, panic wipe)
is 100% greenfield. Frontend is 0% — entire `secret-chat` module to build from scratch.

</domain>

<decisions>
## Implementation Decisions

### Auto-resolved (no discussion needed)

Plans were validated against the actual codebase and **6 path/reference corrections applied**:

| Correction | Plan Originally Said | Fixed To |
|---|---|---|
| Context module path | `lib/cgraph/secret_chat/` | `lib/cgraph/messaging/secret_chat.ex` |
| Controller path | `controllers/secret_chat_controller.ex` | `controllers/api/v1/secret_chat_controller.ex` |
| Schema name | `secret_chat_sessions` | `secret_conversations` (schema: `SecretConversation`) |
| Schema field naming | `ghost_a/b, alias_a/b, panic_wipe_a/b` | `ghost_initiator/recipient` (matches existing naming) |
| Routes | Assumed wired | **Not wired** — Task 3 now explicitly wires routes first |
| Frontend chat path | `pages/chat/` | `modules/chat/` + `pages/messages/` |

### Copilot's Discretion

- Ghost mode auto-activates when secret chat is opened (per definitive plan)
- Panic wipe uses long-press confirmation (standard destructive action UX)
- 12 themes as CSS + WebP textures (ultra-lightweight, NOT Lottie per definitive plan)
- Decoy PIN is out of scope for Phase 29 (definitive plan notes it as "100% greenfield" — could be its own phase)

</decisions>

<specifics>
## Existing Infrastructure

### Backend (EXISTS — 975+ lines)

| Component | File | Lines | Status |
|---|---|---|---|
| Context module | `lib/cgraph/messaging/secret_chat.ex` | 338 | Full CRUD, send, read, self-destruct |
| Conversation schema | `lib/cgraph/messaging/secret_conversation.ex` | 104 | Schema with status, timer, devices, fingerprints |
| Message schema | `lib/cgraph/messaging/secret_message.ex` | 53 | Ciphertext blob, nonce, ratchet_header |
| REST controller | `controllers/api/v1/secret_chat_controller.ex` | 180 | 5 actions but NOT routed |
| JSON renderer | `controllers/api/v1/secret_chat_json.ex` | 53 | Renders metadata (never ciphertext) |
| Phoenix channel | `channels/secret_chat_channel.ex` | 206 | Join, message relay, typing, screenshot detect |
| E2EE sessions | `lib/cgraph/crypto/e2ee/secret_session.ex` | 211 | Ratchet key tracking, session states |
| Cleanup worker | `workers/delete_expired_secret_messages.ex` | 39 | Oban cron for expired messages |
| Tests | 3 test files | 836 | Context, controller, channel tests |

### Redis Infrastructure (EXISTS — 497 lines)
- `CGraph.Redis` with full submodules (KeyValue, Hash, Set, SortedSet)
- Circuit breaker via `fuse`, telemetry integration
- Already used for: presence storage, last-seen caching, rate limiting

### Presence Infrastructure (EXISTS — 869 lines)
- `Presence.Tracker` (194 lines) — Phoenix.Presence CRDT
- `Presence.Store` (397 lines) — Redis-backed sorted sets
- `Presence.Queries` (278 lines) — Ghost filtering integration target

### Crypto Package (EXISTS — 4,482 lines)
- PQXDH (Post-Quantum X3DH), Triple Ratchet, Double Ratchet
- AES-256-GCM, ML-KEM-768, file encryption
- Protocol stores (InMemoryProtocolStore, SessionStore, etc.)

### Frontend (DOES NOT EXIST)
- Zero `secret-chat` or `SecretChat` references in `apps/web/src/`
- Chat module at `apps/web/src/modules/chat/` (components, hooks, store, types)
- Message pages at `apps/web/src/pages/messages/`
- Customize page at `apps/web/src/pages/customize/`

</specifics>

<deferred>
## Deferred Ideas

- **Decoy PIN** — Per definitive plan, "100% greenfield" feature where a secondary PIN shows a clean/decoy chat history. Complex enough for its own phase.
- **Offline message queuing in Redis** — Definitive plan specifies 24h TTL Redis queue for offline recipients. Could be added as a follow-up if not covered in Task 4.

</deferred>

---

_Phase: 29-secret-chat_
_Context gathered: 2026-03-10_
