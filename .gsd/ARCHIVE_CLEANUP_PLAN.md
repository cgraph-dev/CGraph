# CGraph Archive & Cleanup Plan

> **Goal:** Bring the CGraph monorepo to Fortune 500 engineering standards by archiving all
> dead/deprecated/stale files while preserving recoverability through a mirror-structure archive.
>
> **Date:** 2026-03-11 **Status:** READY FOR EXECUTION

---

## Architecture

```
/CGraph/
├── .archived/                          ← NEW: mirror-structure archive
│   ├── README.md                       ← explains archive purpose + recovery instructions
│   ├── apps/
│   │   ├── backend/
│   │   │   ├── .gsd/                   ← old backend-level GSD (292 files, 3.5MB)
│   │   │   ├── .github/               ← duplicate prompts + __pycache__
│   │   │   ├── lib/cgraph/gamification/← deprecated gamification module tree
│   │   │   ├── lib/cgraph/shop/        ← empty shop dir
│   │   │   ├── lib/cgraph_web/controllers/api/v1/leaderboard_*
│   │   │   ├── test/                   ← dead gamification tests
│   │   │   └── priv/repo/migrations/  ← gamification migration comments
│   │   ├── mobile/src/
│   │   │   ├── components/premium/coin-shop-widget.tsx
│   │   │   ├── features/premium/components/coin-balance.tsx
│   │   │   ├── screens/premium/coin-shop-screen/
│   │   │   └── screens/forums/plugin-marketplace-screen/
│   │   └── web/src/
│   │       ├── modules/admin/api/marketplaceApi.ts
│   │       ├── modules/admin/components/admin-dashboard/marketplace-moderation.tsx
│   │       ├── pages/forums/plugin-marketplace.tsx
│   │       └── pages/forums/forum-user-leaderboard.tsx
│   ├── docs/
│   │   ├── api/GAMIFICATION_API.md
│   │   ├── api/API_REFERENCE_V0.9.4.md
│   │   ├── api/CHANGELOG_V0.9.4.md
│   │   ├── guides/GAMIFICATION.md
│   │   ├── V1_ACTION_PLAN.md
│   │   ├── ARCHITECTURE_TRANSFORMATION_PLAN.md
│   │   └── archive/decisions/         ← old ADR duplicates
│   ├── scripts/                        ← completed one-time codemods
│   ├── root/                           ← open-source-era root files
│   │   ├── CLA.md
│   │   ├── CONTRIBUTING.md
│   │   ├── CODE_OF_CONDUCT.md
│   │   └── CLOSED_SOURCE_TRANSITION_GUIDE.md
│   └── .github/
│       ├── FUNDING.yml
│       ├── PULL_REQUEST_TEMPLATE.md    ← duplicate (keep lowercase version)
│       └── prompts/ui-ux-pro-max/scripts/__pycache__/
├── .gsd/                              ← KEEP (project management)
├── .claude/                           ← KEEP (Claude config)
└── ... (clean production codebase)
```

---

## Phase Plan — 7 Phases

### Phase 1: Foundation — Create Archive Structure + README

**Risk:** None **Scope:** Create `.archived/` directory tree + README explaining recovery process

**Tasks:**

1. Create `.archived/README.md` with purpose, date, recovery instructions
2. Create all subdirectory structure matching project layout
3. Add `.archived/` to any relevant ignore rules

---

### Phase 2: Hygiene — Remove Tracked Junk + Fix .gitignore

**Risk:** LOW — no code changes, just tracked junk removal **Scope:** Remove artifacts that should
never be in version control

**Tasks:**

1. `git rm --cached` all 8 tracked `.pyc` files (`.github/prompts/` +
   `apps/backend/.github/prompts/`)
2. `git rm --cached apps/mobile/nohup.out apps/web/nohup.out`
3. Delete untracked `apps/backend/nohup.out`
4. Add to `.gitignore`: `nohup.out`, `__pycache__/`, `*.pyc`, `*.bak`
5. Delete untracked `.bak` files: 3 test backup files in backend
6. Remove duplicate PR template (keep `.github/pull_request_template.md`, archive
   `.github/PULL_REQUEST_TEMPLATE.md`)
7. Remove `.github/FUNDING.yml` (closed-source, no sponsors)
8. Remove tracked empty `.terraform.lock.hcl` (2-line empty file)
9. Remove empty `infrastructure/docker/init-db.sql/` directory

**Files affected:** ~15 files removed from tracking

---

### Phase 3: Archive Backend GSD + Duplicate Prompts

**Risk:** LOW — these are documentation files, not code **Scope:** Move 292-file backend `.gsd/` to
archive, remove duplicate `.github/prompts/`

**Tasks:**

1. Move `apps/backend/.gsd/` → `.archived/apps/backend/.gsd/`
2. Move `apps/backend/.github/` → `.archived/apps/backend/.github/`
3. Verify root `.gsd/` and `.github/` are untouched

**Files affected:** ~295 files moved

---

### Phase 4: Archive Open-Source-Era Root Files + Stale Docs

**Risk:** LOW — historical documents only **Scope:** Move completed/irrelevant root docs and stale
project docs to archive

**Tasks:**

1. Move to `.archived/root/`:
   - `CLA.md` (185 lines — CLA for open-source era)
   - `CONTRIBUTING.md` (214 lines — open-source contributing guide)
   - `CODE_OF_CONDUCT.md` (67 lines — community CoC)
   - `CLOSED_SOURCE_TRANSITION_GUIDE.md` (964 lines — transition complete)
   - `CHANGELOG.md` (7,410 lines — unmaintained since Jul 2025)

2. Move to `.archived/docs/`:
   - `docs/V1_ACTION_PLAN.md` (1,141 lines — v1 shipped, plan complete)
   - `docs/ARCHITECTURE_TRANSFORMATION_PLAN.md` (4,222 lines — transformation executed)
   - `docs/api/GAMIFICATION_API.md` (789 lines — deprecated API)
   - `docs/api/API_REFERENCE_V0.9.4.md` (versioned, superseded by current)
   - `docs/api/CHANGELOG_V0.9.4.md` (versioned, superseded)
   - `docs/guides/GAMIFICATION.md` (gamification deprecated)
   - `docs/archive/decisions/` → `.archived/docs/archive/decisions/` (duplicate ADRs, keep
     `docs/adr/` as canonical)

**Files affected:** ~20 files moved

---

### Phase 5: Archive Dead Gamification Backend Code

**Risk:** MEDIUM — code changes, requires careful verification **Scope:** Archive deprecated
gamification module tree, dead controllers, dead tests

> **CRITICAL WARNING:** Do NOT delete migrations. Only add archive comments. **CRITICAL WARNING:**
> Achievement/cosmetics schemas are STILL BACKED BY LIVE TABLES. The gamification context facade
> (`gamification.ex`) wraps both live and dead code. The gamification_routes.ex serves achievement
> endpoints that ARE still active.

**Tasks:**

#### 5A. Archive PURELY dead backend files (safe to move):

1. Move dead controllers to archive:
   - `apps/backend/lib/cgraph_web/controllers/api/v1/leaderboard_controller.ex` → archive (calls
     non-existent functions, will crash)
   - `apps/backend/lib/cgraph_web/controllers/api/v1/leaderboard_json.ex` → archive

2. Move dead test files to archive:
   - `apps/backend/test/cgraph/gamification_test.exs`
   - `apps/backend/test/cgraph/marketplace_test.exs`
   - `apps/backend/test/cgraph_web/controllers/admin/marketplace_controller_test.exs`
   - `apps/backend/test/cgraph_web/controllers/api/v1/leaderboard_controller_test.exs`
   - `apps/backend/test/cgraph_web/controllers/coins_controller_test.exs`
   - `apps/backend/test/cgraph_web/controllers/gamification_controller_test.exs`
   - `apps/backend/test/cgraph_web/controllers/marketplace_controller_test.exs`
   - `apps/backend/test/cgraph_web/controllers/prestige_controller_test.exs`
   - `apps/backend/test/cgraph_web/controllers/quest_controller_test.exs`

3. Remove empty directory:
   - `apps/backend/lib/cgraph/shop/` (empty, no files)

4. Remove dead Oban queue from `config.exs`:
   - Delete `gamification: 5` queue entry (no worker uses this queue)

#### 5B. Fix P0 runtime crash risks (code edits, NOT archiving):

5. Fix `apps/backend/lib/cgraph/workers/email_digest_worker.ex`:
   - Remove/stub `calculate_xp_earned/2` function (queries dropped `xp_transactions` table — **DAILY
     PROD CRASH**)

6. Remove dead leaderboard route from `apps/backend/lib/cgraph_web/router/user_routes.ex`:
   - Delete the `/leaderboard` route that dispatches to archived `LeaderboardController`

7. Clean dead factories from `test/support/factory.ex`:
   - Remove `user_prestige_factory`, `seasonal_event_factory`, `battle_pass_tier_factory`,
     `prestige_reward_factory`, `marketplace_listing_factory`

#### 5C. DO NOT TOUCH (still wired to live DB tables):

- `apps/backend/lib/cgraph/gamification.ex` — wraps achievement system (live)
- `apps/backend/lib/cgraph/gamification/*.ex` — schemas for live achievement/cosmetics tables
- `apps/backend/lib/cgraph_web/controllers/gamification_controller.ex` — serves achievement
  endpoints
- `apps/backend/lib/cgraph_web/controllers/gamification_json.ex` — serves achievement responses
- `apps/backend/lib/cgraph_web/router/gamification_routes.ex` — routes achievement URLs

> **Future work:** Rename gamification → achievements namespace (separate phase, requires API
> versioning)

**Files affected:** ~12 files moved, ~3 code edits

---

### Phase 6: Archive Dead Gamification Frontend Code

**Risk:** MEDIUM — UI files, requires import cleanup **Scope:** Archive deprecated
marketplace/coin-shop/leaderboard UI in web + mobile

**Tasks:**

#### 6A. Web — Archive dead gamification UI:

1. Archive marketplace admin:
   - `apps/web/src/modules/admin/api/marketplaceApi.ts`
   - `apps/web/src/modules/admin/components/admin-dashboard/marketplace-moderation.tsx`

2. Archive dead pages:
   - `apps/web/src/pages/forums/plugin-marketplace.tsx`
   - `apps/web/src/pages/forums/forum-user-leaderboard.tsx`

3. Remove imports of archived files from barrel exports and route definitions

#### 6B. Mobile — Archive dead gamification UI:

4. Archive coin shop:
   - `apps/mobile/src/components/premium/coin-shop-widget.tsx`
   - `apps/mobile/src/features/premium/components/coin-balance.tsx`
   - `apps/mobile/src/screens/premium/coin-shop-screen/` (entire directory)

5. Archive marketplace:
   - `apps/mobile/src/screens/forums/plugin-marketplace-screen/` (entire directory)

6. Remove imports of archived files from navigation + barrel exports

> **DO NOT ARCHIVE (still active, just pattern-matched on "leaderboard/explore"):**
>
> - `apps/web/src/modules/forums/components/leaderboard-widget/` — forum reputation leaderboard,
>   LIVE feature
> - `apps/web/src/pages/forums/forum-leaderboard/` — forum leaderboard page, LIVE
> - `apps/mobile/src/screens/forums/forum-leaderboard-screen.tsx` — LIVE, part of forum feature
> - `apps/mobile/src/screens/referrals/referral-screen/components/leaderboard-section.tsx` —
>   referral leaderboard, LIVE
> - `apps/web/src/pages/explore/` — explore page, LIVE feature
> - `apps/mobile/src/screens/explore/` — explore screen, LIVE
> - Any "export" in settings (theme/data export) — LIVE features

**Files affected:** ~10 files/dirs moved, ~5 import cleanups

---

### Phase 7: Archive Completed Scripts + Final Cleanup

**Risk:** LOW — utility scripts only **Scope:** Move completed one-time codemods to archive

**Tasks:**

1. Move completed codemods to `.archived/scripts/`:
   - `scripts/codemod-react-fc.py`
   - `scripts/codemod-springs.mjs`
   - `scripts/codemod-transitions.mjs`
   - `scripts/codemod-web-durations.mjs`
   - `scripts/codemod-mobile-durations.mjs`
   - `scripts/codemod-structured-logging.mjs`
   - `scripts/fix-all-errors.mjs`
   - `scripts/fix-circular-barrel.mjs`
   - `scripts/fix-jsx-errors.mjs`
   - `scripts/fix-non-null-assertions.mjs`
   - `scripts/fix-remaining-errors.mjs`
   - `scripts/fix-unused-vars.mjs`
   - `scripts/rename-dirs-to-kebab.mjs`
   - `scripts/rename-to-kebab.mjs`
   - `scripts/merge-duplicate-imports.mjs`

2. Keep active scripts:
   - `scripts/add-jsdoc.mjs` — ongoing utility
   - `scripts/add-reset-to-stores.mjs` — ongoing utility
   - `scripts/add-specs.mjs` — ongoing utility
   - `scripts/clean-jsdoc-directives.mjs` — ongoing utility
   - `scripts/fix-jsdoc-desc.mjs` — ongoing utility
   - `scripts/fix-type-assertions.mjs` — ongoing (348 remaining annotations)
   - `scripts/find-null-warnings.mjs` — diagnostic
   - `scripts/generate-lottie-borders.mjs` — ongoing utility
   - `scripts/list-web-errors.mjs` — diagnostic
   - `scripts/monitor_code.sh` — monitoring

3. Update `.gsd/codebase/` docs to reflect archive changes
4. Final `git status` verification
5. Single atomic commit + push

**Files affected:** ~15 scripts moved

---

## Execution Rules

1. **Mirror structure:** Every archived file goes to `.archived/<original-path>` so recovery is
   trivial
2. **Never delete migrations:** Only add `# ARCHIVED` comments to gamification migration files
3. **Never archive live schemas:** Achievement/cosmetics schemas map to live DB tables
4. **One commit per phase:** Each phase gets its own atomic commit with detailed message
5. **Verify compilation after Phase 5:** Run `mix compile` to ensure no broken references
6. **Verify TypeScript after Phase 6:** Run `npx tsc --noEmit` on web/mobile to catch broken imports
7. **Keep .gsd/ and .claude/:** These are active project management — never archive

---

## Impact Summary

| Metric                           | Before                         | After    |
| -------------------------------- | ------------------------------ | -------- |
| Tracked `.pyc` files             | 8                              | 0        |
| Tracked `nohup.out`              | 2                              | 0        |
| Backend `.gsd/` duplicate        | 292 files (3.5MB)              | Archived |
| Dead gamification backend files  | ~30                            | Archived |
| Dead gamification frontend files | ~15                            | Archived |
| Completed codemod scripts        | 15                             | Archived |
| Open-source-era root docs        | 5 (8,840 lines)                | Archived |
| Stale project docs               | 7+                             | Archived |
| P0 runtime crash risks           | 2 (leaderboard + email digest) | Fixed    |
| Dead Oban queue                  | 1                              | Removed  |
| Dead test factories              | 5                              | Removed  |
| **Total files archived/cleaned** | **~380+**                      | —        |

---

## Recovery

To recover any archived file:

```bash
# Find a file
find .archived/ -name "filename"

# Restore to original location
cp .archived/path/to/file path/to/file

# Or restore entire directory
cp -r .archived/apps/backend/.gsd/ apps/backend/.gsd/
```
