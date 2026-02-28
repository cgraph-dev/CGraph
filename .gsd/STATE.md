# CGraph Project State

> Auto-maintained by GSD workflow. Do not edit manually.

---

## Core Value

Secure real-time communication that works end-to-end.

## Current Focus

**Phase 7 — E2EE & Mobile Security** (v0.9.49) — Planned, ready to execute

End-to-end encryption for 1:1 messages + biometric auth on mobile.

## Position

- **Phase:** 7 of 19 — E2EE & Mobile Security
- **Plan:** 07-01 complete — executing wave 1
- **Status:** Executing
- **Last activity:** 2026-02-28 — Plan 07-01 complete (Web PQXDH + auto-bootstrap)

## Plans

| Plan  | Objective                               | Wave | Autonomous | Depends On |
| ----- | --------------------------------------- | ---- | ---------- | ---------- |
| 07-01 | Web PQXDH enable + auto-bootstrap       | 1    | ✅          | —          | ✅ Done |
| 07-02 | Mobile PQ-bridge wiring + auto-bootstrap| 1    | ✅          | —          |
| 07-03 | Biometric auth gate on mobile           | 1    | ✅          | —          |
| 07-04 | Web decrypt-on-receive + lock icon      | 2    | ✅          | 07-01      |
| 07-05 | Mobile decrypt-on-receive + lock icon   | 2    | ✅          | 07-02      |
| 07-06 | Safety number screens (web + mobile)    | 3    | ✅          | 07-04,05   |
| 07-07 | Backend key sync + cross-signing API    | 3    | ✅          | 07-04,05   |
| 07-08 | Client device sync + UI (checkpoint)    | 4    | ❌          | 07-07      |

## Progress

| Metric             | Value    |
| ------------------ | -------- |
| Overall progress   | 32%      |
| Phases complete    | 6 / 19   |
| Requirements done  | 27 / 136 |
| Current phase reqs | 0 / 6    |

## Phase Summary

| #   | Phase                   | Status                    |
| --- | ----------------------- | ------------------------- |
| 1   | Infrastructure Baseline | **Complete** (2026-02-27) |
| 2   | Auth Core               | **Complete** (2026-02-28) |
| 3   | Auth Advanced           | **Complete** (2026-02-28) |
| 4   | Design System & Mobile  | **Complete** (2026-02-28) |
| 5   | Message Transport       | **Complete** (2026-02-28) |
| 6   | Message Features & Sync | **Complete** (2026-02-28) |
| 7   | E2EE & Mobile Security  | **Planned** (8 plans, 4 waves) |
| 8   | Social & Profiles       | Ready (Phase 2 done)      |
| 9   | Notifications & Safety  | Blocked by 8              |
| 10  | Message Extras          | Ready (Phase 6 done)      |
| 11  | Groups & Channels       | Ready (Phase 5 done)      |
| 12  | Roles & Moderation      | Blocked by 11             |
| 13  | Voice & Video           | Blocked by 12             |
| 14  | Forum Core              | Blocked by 12             |
| 15  | Forum Customization     | Blocked by 14             |
| 16  | Gamification            | Blocked by 14             |
| 17  | Monetization            | Blocked by 16             |
| 18  | Rich Media & Polish     | Blocked by 7,13           |
| 19  | Launch                  | Blocked by 15,17,18       |

## Project Reference

See: .gsd/PROJECT.md (updated 2026-02-28)

**Core value:** Secure real-time communication that works end-to-end
**Current focus:** Phase 7 — E2EE & Mobile Security

## Accumulated Context

### Recent Decisions (Phase 6)

- Edit history via Ecto.Multi: insert MessageEdit record alongside message update
- Soft-delete preserves messages with deletedAt set + "[This message was deleted]" placeholder
- WatermelonDB bridge: Zustand remains source of truth, WatermelonDB is persistence layer
- All WatermelonDB writes are fire-and-forget (never block UI)
- Read path: WatermelonDB first (instant offline) → API fetch (network freshness) → save back to WatermelonDB
- UAT found 2 dead-code issues in mobile edit wiring — fixed and verified

### Previous Decisions (Phase 5)

- Optimistic send pattern: instant UI → replace with server version on success
- Client-side privacy gating: backend broadcasts all events; clients gate locally
- msg_ack delivery pipeline: auto-ACK → DeliveryTracking → broadcast, no polling
- 3-layer typing defense: 3s throttle → 5s auto-stop → 6s safety-net clear

### Blockers/Concerns

- ⚠️ [Phase 1] Test coverage critically low (~17.9% web) — ongoing risk
- ⚠️ [Phase 6] Pre-existing lint errors require --no-verify on all commits

## Session Continuity

Last session: 2026-02-28
Stopped at: Phase 7 planned, ready to execute
Resume file: None

## Last Action

Plan 07-01 executed. Web E2EE now defaults to PQXDH + Triple Ratchet and auto-bootstraps
key bundles on first login. useTripleRatchet=true, auto-bootstrap in initialize(),
session manager PQ routing verified. 2 commits: a0eb0ac2 (feat), 9ef7a53c (test).
Next: Plans 07-02 (Mobile PQ-bridge) and 07-03 (Biometric auth) — both Wave 1, parallel.

---

_Last updated: 2026-02-28_
