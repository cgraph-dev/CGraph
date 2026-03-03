---
phase: 07-e2ee-mobile-security
plan: 01
subsystem: crypto
tags: [pqxdh, triple-ratchet, e2ee, zustand, auto-bootstrap, ml-kem-768]

requires:
  - phase: 05-message-transport
    provides: Session manager, Double Ratchet engine, message send/receive flow
  - phase: 06-message-features-sync
    provides: Encrypt-on-send wiring in chatStore messaging

provides:
  - PQXDH + Triple Ratchet enabled by default for new web sessions
  - Auto-bootstrap E2EE on first login (transparent key generation)
  - KEM prekeys (ML-KEM-768) generated and published during setup
  - Session manager routes new sessions through PQXDH when recipient supports it

affects: [07-04-decrypt-on-receive, 07-06-safety-numbers, 07-07-key-sync, mobile-pq-bridge]

tech-stack:
  added: []
  patterns:
    - Auto-bootstrap pattern in initialize() → setupE2EE() fallback
    - Triple Ratchet feature flag propagated from store to session manager

key-files:
  created:
    - .gsd/phases/07-e2ee-mobile-security/07-01-SUMMARY.md
  modified:
    - apps/web/src/lib/crypto/e2ee-store/store.ts
    - apps/web/src/lib/crypto/e2ee-store/core-actions.ts
    - apps/web/src/lib/crypto/e2ee-store/__tests__/core-actions.test.ts

key-decisions:
  - "useTripleRatchet defaults to true — all new sessions use PQXDH when recipient has KEM prekeys"
  - "Auto-bootstrap calls setupE2EE() transparently in initialize() when keys don't exist"
  - "Session manager Triple Ratchet flag set programmatically on init, not just via UI toggle"
  - "Skipped status field for 'Setting up encryption...' — isLoading already provides UI feedback"

patterns-established:
  - "Auto-bootstrap: initialize() detects missing keys and auto-calls setupE2EE()"
  - "Protocol negotiation: session manager checks _useTripleRatchet && bundleSupportsPQ()"

duration: 8min
completed: 2026-02-28
---

# Plan 07-01: Web PQXDH Enable + Auto-Bootstrap Summary

**Web E2EE now defaults to PQXDH + Triple Ratchet and auto-bootstraps key bundles on first login.**

## Tasks Completed

### Task 1: Enable Triple Ratchet by default + auto-bootstrap on initialize
**Commits:** `a0eb0ac2`, `9ef7a53c`

- Changed `useTripleRatchet` default from `false` to `true` in store.ts (initial state + reset)
- Modified `createInitialize` to auto-call `setupE2EE()` when `isE2EESetUp()` returns false
- After init or bootstrap, `sessionManager.setUseTripleRatchet(true)` ensures PQ routing
- KEM prekey generation (ML-KEM-768) already existed in `createSetupE2EE` — verified present
- Updated core-actions tests: added `setUseTripleRatchet` mock, replaced stale "not set up" test with auto-bootstrap and error-handling tests

### Task 2: Verify session manager routes to PQXDH for new sessions
**Commits:** None (verification only — wiring already correct)

- Confirmed `session-manager-class.ts` line 132: `_useTripleRatchet && bundleSupportsPQ(pqBundle)` routes to PQ path
- Confirmed `session-manager-pq.ts` correctly calls `createPQXDHSession` → `pqxdhInitiate` from `@cgraph/crypto`
- Confirmed `TripleRatchetEngine` initialized with split shared secret (EC + SCKA)
- Confirmed protocol version `PQXDH_V1` set on both initiator (line 71) and responder (line 171)
- Backward compatibility intact: classical X3DH sessions unaffected, protocol check on encrypt/decrypt

## Deviations

| # | Type | Description |
|---|------|-------------|
| 1 | Skipped sub-requirement | "Setting up encryption..." status field — store has no `status` field; `isLoading: true` provides equivalent UI feedback without type changes |
| 2 | Auto-fix (Rule 1) | Updated core-actions.test.ts — mock lacked `setUseTripleRatchet`, old test expected `isInitialized: false` when not set up (now auto-bootstraps) |

## Verification Results

- `useTripleRatchet: true` in store.ts: ✅ (lines 49, 88)
- Auto-bootstrap in initialize(): ✅ (`setupE2EE` called when not set up)
- KEM prekey generation in setupE2EE: ✅ (existing `generateKEMPreKey` call)
- Session manager PQ routing: ✅ (line 132, `bundleSupportsPQ` check)
- PQXDH_V1 protocol version: ✅ (session-manager-pq.ts lines 71, 171)
- Core-actions tests: ✅ (13/13 pass)
- No crypto-related type errors: ✅
- Pre-existing type errors (durations, helpers.ts): unchanged
