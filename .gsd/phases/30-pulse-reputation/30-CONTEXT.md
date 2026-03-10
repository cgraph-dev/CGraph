# Phase 30 — Pulse Reputation: Infrastructure Context

## Purpose

This document captures the infrastructure audit findings for Phase 30 plans. Created during plan
validation to ensure the executing agent has accurate codebase context. Same pattern as
29-CONTEXT.md.

---

## 1. Existing Reputation System (CRITICAL)

An existing `CGraph.Reputation` context (144 LOC) already exists:

- **File**: `lib/cgraph/reputation.ex` — `get_user_reputation/2`, `give_reputation/1`,
  `get_reputation_summary/1`
- **Schema**: `lib/cgraph/reputation/reputation_entry.ex` — `reputation_entries` table
  (from_user_id, to_user_id, value, post_id, forum_id, comment)
- **Routes**: `GET/POST /profiles/:username/reputation`

**Relationship to Pulse**: Pulse is SEPARATE from this system:

- Existing Reputation = user-to-user, global, simple +/- value
- Pulse = community-scoped, weighted voting, 6 tiers, decay
- Both systems coexist. Pulse does NOT replace existing reputation.

---

## 2. Controller Convention

All controllers live at `controllers/api/v1/` with module `CGraphWeb.API.V1.*Controller`.

- ✅ Corrected: `pulse_controller.ex` → `controllers/api/v1/pulse_controller.ex`
- Module: `CGraphWeb.API.V1.PulseController`

---

## 3. Router Convention

Routes are split into macro files in `router/*.ex`, imported into `router.ex`. 12 existing route
files: forum_routes, messaging_routes, auth_routes, etc.

- ✅ Corrected: Create `router/pulse_routes.ex` with `defmacro pulse_routes`
- Pattern: `scope "/api/v1", CGraphWeb.API.V1 do ... end`

---

## 4. Worker Convention

All Oban workers live at `lib/cgraph/workers/` with module `CGraph.Workers.*`. 21+ existing workers
follow this pattern.

- ✅ Corrected: `pulse/decay_worker.ex` → `workers/pulse_decay_worker.ex`
- Module: `CGraph.Workers.PulseDecayWorker`
- IMPORTANT: Add to Oban crontab in BOTH `config.exs` AND `prod.exs` (Phase 29 lesson)

---

## 5. Profile Card Architecture

Profile card lives at `modules/social/components/profile-card/` with 7 layout variants:

- `profile-card.tsx` (main), `compact-layout.tsx`, `minimal-layout.tsx`, `social-layout.tsx`,
  `detailed-layout.tsx`, `gaming-layout.tsx`, `creator-layout.tsx`
- Types in `types.ts`, constants in `constants.ts`, barrel in `index.ts`
- ✅ Corrected: Plans reference these paths, not `components/profile/ProfileCard.tsx`

---

## 6. Frontend Module Convention

Features live in `modules/`, not `components/` at root level.

- ✅ Corrected: PulseDots → `modules/pulse/components/PulseDots.tsx`

---

## 7. Achievement System

Full system at `lib/cgraph/gamification/`:

- `achievement_triggers.ex` — `@action_achievement_map` with action types: message_sent,
  forum_thread, forum_post, forum_upvote_received, friend_added, etc.
- `achievement_system.ex` — handles progress tracking, auto-unlock
- Pattern: `AchievementTriggers.check_all(user_id, :action_type)`
- ✅ Corrected: Plan 30-02 Task 4 uses this exact pattern with `:pulse_tier_reached`

---

## 8. Existing Emoji Reactions

Full emoji reaction system exists at `ReactionController` (`/messages/:id/reactions`).

- ✅ Corrected: Pulse uses `POST /api/v1/pulse/vote` (not `/pulse/react`) to avoid conceptual
  collision with the existing emoji reaction system.

---

## Corrections Applied

| #   | Issue                           | Fix                                         |
| --- | ------------------------------- | ------------------------------------------- |
| 1   | Controller path wrong           | → `controllers/api/v1/pulse_controller.ex`  |
| 2   | Router pattern wrong            | → `router/pulse_routes.ex` macro            |
| 3   | Worker path wrong               | → `workers/pulse_decay_worker.ex`           |
| 4   | Profile card path wrong         | → `modules/social/components/profile-card/` |
| 5   | PulseDots path wrong            | → `modules/pulse/components/PulseDots.tsx`  |
| 6   | Existing reputation unaccounted | → Documented as separate coexisting system  |
| 7   | API naming collision            | → `/pulse/vote` instead of `/pulse/react`   |
| 8   | Achievement trigger pattern     | → Uses `@action_achievement_map` pattern    |
