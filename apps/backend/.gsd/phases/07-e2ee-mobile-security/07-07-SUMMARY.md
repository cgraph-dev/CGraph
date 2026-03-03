---
phase: 07-e2ee-mobile-security
plan: 07
subsystem: crypto
tags: [e2ee, cross-signing, key-sync, elixir, ecto, phoenix]

requires:
  - phase: 07-04
    provides: E2EE key registration and identity key infrastructure
  - phase: 07-05
    provides: E2EE key operations and prekey bundle management

provides:
  - Cross-device signature schema and trust chain storage
  - Key sync encrypted material relay (blind server)
  - 4 new API endpoints for multi-device E2EE key management
  - Device trust verification logic

affects: [mobile-e2ee-client, web-e2ee-client, e2ee-testing]

tech-stack:
  added: []
  patterns: [cross-signing trust chain, blind relay key sync, same-user device ownership verification]

key-files:
  created:
    - apps/backend/lib/cgraph/crypto/e2ee/cross_signing.ex
    - apps/backend/lib/cgraph/crypto/e2ee/key_sync.ex
    - apps/backend/priv/repo/migrations/20260228000001_add_e2ee_cross_signatures.exs
    - apps/backend/priv/repo/migrations/20260228000002_add_e2ee_key_sync_packages.exs
  modified:
    - apps/backend/lib/cgraph_web/controllers/api/v1/e2ee_controller.ex
    - apps/backend/lib/cgraph_web/router/user_routes.ex

key-decisions:
  - "Nested CrossSignature schema inside CrossSigning module (defined before functions to avoid compile-time struct expansion issues)"
  - "SyncPackage schema nested inside KeySync module for colocation"
  - "Upsert on cross-signatures to allow re-signing without duplicates"
  - "Added e2ee_key_sync_packages migration (deviation: plan didn't explicitly mention a sync packages table but it's required for KeySync.create_sync_package)"

patterns-established:
  - "Blind relay pattern: server stores encrypted key material without inspection"
  - "Same-user device ownership verification before any cross-device operation"
  - "Cross-signature trust chain with verified/revoked status lifecycle"

duration: 8min
completed: 2026-02-28
---

# Plan 07-07: Multi-Device E2EE Key Sync Backend

**Backend schema, context modules, and API endpoints for cross-device key signing and encrypted key material synchronization.**

## Performance

- **Duration:** ~8 min
- **Tasks:** 2/2 completed
- **Files created:** 4
- **Files modified:** 2

## Accomplishments

- Cross-signing trust chain infrastructure: devices can cross-sign each other's identity keys to establish trust
- Encrypted key sync relay: existing devices can send encrypted key material to new devices via server (blind relay)
- 4 new authenticated API endpoints for cross-signing and key sync operations
- Same-user security invariant enforced at both query and schema level

## Task Commits

1. **Task 1: Cross-signing schema, migration, and context** — `0f344d7d`
   - Created `e2ee_cross_signatures` table with unique constraint on `[signer_device_id, signed_device_id]`
   - Created `CrossSigning` context with `create_cross_signature/5`, `get_device_trust_chain/1`, `verify_device_trust/2`, `revoke_device_trust/2`
   - Nested `CrossSignature` Ecto schema with validation

2. **Task 2: Key sync and cross-signing API endpoints** — `8f35df3d`
   - Created `KeySync` context with `SyncPackage` schema and `e2ee_key_sync_packages` table
   - Added `POST /api/v1/e2ee/devices/:device_id/cross-sign` → `cross_sign_device`
   - Added `GET /api/v1/e2ee/devices/trust-chain` → `device_trust_chain`
   - Added `POST /api/v1/e2ee/devices/:device_id/sync` → `sync_keys`
   - Added `GET /api/v1/e2ee/devices/sync-packages` → `get_sync_packages`
   - Routes registered under existing authenticated E2EE scope

## Files Created/Modified

- `apps/backend/lib/cgraph/crypto/e2ee/cross_signing.ex` — CrossSigning context + CrossSignature schema
- `apps/backend/lib/cgraph/crypto/e2ee/key_sync.ex` — KeySync context + SyncPackage schema
- `apps/backend/priv/repo/migrations/20260228000001_add_e2ee_cross_signatures.exs` — Cross-signatures table
- `apps/backend/priv/repo/migrations/20260228000002_add_e2ee_key_sync_packages.exs` — Key sync packages table
- `apps/backend/lib/cgraph_web/controllers/api/v1/e2ee_controller.ex` — 4 new actions + helpers
- `apps/backend/lib/cgraph_web/router/user_routes.ex` — 4 new route entries

## Decisions Made

- **Nested schema pattern**: CrossSignature and SyncPackage schemas defined as nested modules inside their respective context modules, placed before functions to avoid Elixir compile-time struct expansion issues.
- **Upsert for cross-signatures**: Uses `on_conflict: {:replace, [...]}` to allow re-signing without creating duplicates.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Added e2ee_key_sync_packages migration**

- **Found during:** Task 2 (Key sync endpoints)
- **Issue:** Plan specified `KeySync.create_sync_package` but didn't explicitly include a migration for the backing table
- **Fix:** Created `20260228000002_add_e2ee_key_sync_packages.exs` migration with appropriate schema
- **Files modified:** `apps/backend/priv/repo/migrations/20260228000002_add_e2ee_key_sync_packages.exs`
- **Verification:** `mix ecto.migrate` succeeded
- **Committed in:** `8f35df3d`

**2. [Rule 1 - Auto-fix Bug] Fixed nested module compile order**

- **Found during:** Task 1 (Cross-signing context)
- **Issue:** CrossSignature schema was defined after functions that referenced `%CrossSignature{}`, causing compile-time struct expansion error
- **Fix:** Moved nested `defmodule CrossSignature` above the public API functions
- **Verification:** `mix compile` succeeded
- **Committed in:** `0f344d7d`

---

**Total deviations:** 2 auto-fixed (1× Rule 1, 1× Rule 2)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## Verification Results

- `mix compile` — passes (only pre-existing warnings from other modules)
- `mix ecto.migrate` — both migrations ran successfully
- `mix phx.routes CGraphWeb.Router | grep e2ee` — all 4 new routes registered
- `grep -rn "cross_sign\|CrossSignature" apps/backend/lib/cgraph/crypto/e2ee/` — confirms module presence
