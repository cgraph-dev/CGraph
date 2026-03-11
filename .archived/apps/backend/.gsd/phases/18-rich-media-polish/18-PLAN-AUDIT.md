# Phase 18 — Plan Audit

> **Auditor**: gsd-plan-checker  
> **Date**: 2025-01-XX  
> **Scope**: All 5 plans (18-01 through 18-05)  
> **Claims checked**: 54  
> **Result**: **7 CRITICAL · 7 MEDIUM · 6 minor**

---

## Summary

Phase 18 plans contain **7 critical issues** that would cause compile-time or runtime failures
during execution. The most dangerous cluster is in 18-05 (Auto-Moderation), where the auto-action
pipeline has **three interlocking critical bugs**: wrong pattern-match on `check/2` return format
(C2), wrong argument types for `review_report/3` (C6), and wrong argument types for
`create_report/2` (C7). A developer following the plan verbatim would produce code that compiles but
crashes at runtime on every moderation action.

18-01 and 18-04 each have one function-name critical (C1 file size, C4 `list_all` vs `all_flags`).
18-02 references a function that doesn't exist (C3 `list_public_forums`). 18-05 has a wrong module
path (C5 `CGraph.Orchestrator` vs `CGraph.Workers.Orchestrator`).

Medium issues are mostly over/understated line counts and missing function stubs. Minor issues are
off-by-one line references.

**All plans require fixes before execution.**

---

## CRITICAL Issues

### C1 — 18-01 Task 4: voice-message-recorder.tsx is 146L, not 786L

- **Plan says**: "Components exist (web: 786L, mobile: 1,708L)"
- **Actual**: `apps/web/src/components/chat/voice-message-recorder.tsx` is **146 lines**
- **Impact**: Plan massively overstates the existing web voice recorder, inflating Task 4 scope.
  Developer expects a feature-complete 786L component and plans to extend it; the actual 146L file
  is a basic skeleton needing far more new code than estimated.
- **Fix**: Change "786L" → "146L" and re-scope Task 4 to account for building substantially more
  from scratch.

### C2 — 18-05 Task 1: `check/2` return format is wrong

- **Plan says**: Pattern-match on `{:block, confidence, categories}` from `AI.Moderation.check/2`
- **Actual**: `check/2` returns
  `{:ok, %{safe: bool, categories: [...], confidence: float, action: :allow | :flag | :block}}`
- **Impact**: **The entire auto-action pipeline will never trigger.** The `case` statement
  pattern-matches on `{:block, confidence, categories}` which is a 3-tuple, but the function always
  returns `{:ok, map}`. No clause matches → `CaseClauseError` on every moderation check.
- **Fix**: Pattern-match on
  `{:ok, %{action: :block, confidence: confidence, categories: categories}}` and handle `:flag` and
  `:allow` cases similarly.

### C3 — 18-02 Task 3: `Forums.list_public_forums/1` does not exist

- **Plan says**: `fetch_forums/5` calls
  `Forums.list_public_forums(%{category: ..., query: ..., limit: ..., offset: ...})`
- **Actual**: No function named `list_public_forums` exists anywhere in the `Forums` context.
  Closest matches: `Forums.Core.Listing.list_forums_for_user/2`, `Forums.Feeds.list_public_feed/1`
- **Impact**: Compile-time failure. The explore controller won't compile.
- **Fix**: Either (a) create `Forums.list_public_forums/1` as a new context function delegating to
  an appropriate repository query, or (b) rewrite `fetch_forums/5` to use
  `Forums.Core.Listing.list_forums_for_user/2` with a public-visibility filter.

### C4 — 18-04 Task 0: `FeatureFlags.list_all/0` does not exist

- **Plan says**: Admin dashboard calls `FeatureFlags.list_all()` to fetch all flags
- **Actual**: The function is `FeatureFlags.all_flags/0` at L128 of `feature_flags.ex`
- **Impact**: Compile-time failure in the admin feature-flags dashboard controller.
- **Fix**: Replace `FeatureFlags.list_all()` → `FeatureFlags.all_flags()` in all plan code.

### C5 — 18-05 Task 5: Wrong module path for Orchestrator

- **Plan says**: `CGraph.Orchestrator.enqueue(...)` in appeal notification worker
- **Actual**: Module is `CGraph.Workers.Orchestrator`
- **Impact**: Compile-time failure — `CGraph.Orchestrator` doesn't exist.
- **Fix**: Replace `CGraph.Orchestrator` → `CGraph.Workers.Orchestrator`.

### C6 — 18-05 Task 1: `review_report/3` takes `%User{}`, not IDs

- **Plan says**:
  `Enforcement.review_report(report.id, system_user_id(), %{action: action, notes: "..."})`
- **Actual**: Signature is `review_report(%User{} = reviewer, report_id, attrs)` — first argument is
  a User **struct**, second is the report ID
- **Impact**: Runtime failure. The auto-action code passes `report.id` (a UUID) as first arg where a
  `%User{}` struct is expected → `FunctionClauseError`. Also the argument order is swapped (report
  ID first, user ID second, but the function expects user struct first, then report ID).
- **Fix**: Load the system user struct first: `system_user = Repo.get!(User, system_user_id())`,
  then call `Enforcement.review_report(system_user, report.id, %{action: action, notes: "..."})`.

### C7 — 18-05 Task 1: `create_report/2` takes `%User{}`, not a map

- **Plan says**: `Reports.create_report(%{reporter_id: auto_reporter_id(), target_type: ..., ...})`
- **Actual**: Signature is `create_report(%User{} = reporter, attrs)` — first argument is a User
  **struct**, second is the attributes map
- **Impact**: Runtime failure. Passes a bare map where a `%User{}` struct is expected →
  `FunctionClauseError`.
- **Fix**: Load the auto-reporter user struct first, then call
  `Reports.create_report(auto_reporter_user, %{target_type: ..., target_id: ..., ...})`.

---

## MEDIUM Issues

### M1 — 18-01: schedule-message-modal.tsx overstated as 451L

- **Plan says**: "schedule-message-modal.tsx (451L)" in scope section
- **Actual**: File is **207 lines**
- **Impact**: Inflates scope estimates for scheduling UI tasks.
- **Fix**: Correct to 207L.

### M2 — 18-03: Reanimated file count overstated

- **Plan says**: "231+ Reanimated files" in animation audit scope
- **Actual**: **150 files** reference Reanimated
- **Impact**: Overstates the animation migration scope by 54%.
- **Fix**: Correct to ~150 files.

### M3 — 18-04 Task 2: Rate limiter has 12 scopes, not 9

- **Plan says**: "9 scope presets"
- **Actual**: **12 scopes**: `api`, `api_burst`, `login`, `login_ip`, `signup`, `password_reset`,
  `upload`, `message`, `message_burst`, `search`, `webhook`, `export`
- **Impact**: Audit task will miss 3 scopes (`message_burst`, `webhook`, `export`) unless corrected.
- **Fix**: Update plan to reference 12 scopes and explicitly include the missing 3.

### M4 — 18-04 Task 0: `FeatureFlags.get_history/1` does not exist

- **Plan says**: Admin controller `history/2` action calls `FeatureFlags.get_history(name)`
- **Actual**: No `get_history/1` function exists in `feature_flags.ex`
- **Impact**: The admin history endpoint won't work without creating this function.
- **Fix**: Add a note that `get_history/1` must be **created**, not just called. Define it to query
  the audit log or flag change history table.

### M5 — 18-02 Task 0: Messages index already exists in search_engine.ex

- **Plan says**: "Check if a messages index exists. If not, add…"
- **Actual**: `search_engine.ex` already defines a `messages` index at L117-123
- **Impact**: Task 0 is mostly verification-only; no creation needed. Time estimate is inflated.
- **Fix**: Reframe Task 0 as "verify and extend existing messages index" rather than "check and
  possibly create."

### M6 — 18-05: Admin module total understated

- **Plan says**: "Admin module totals 3,120L"
- **Actual**: Admin module totals **7,909 lines**
- **Impact**: Understates the integration surface by 2.5×, which affects effort estimation for
  moderation admin UI work.
- **Fix**: Correct to ~7,900L.

### M7 — 18-05 Task 1: Ecto.Enum atoms vs string values

- **Plan says**: Auto-action code uses string values like `"spam"`, `"hate_speech"` for report
  categories
- **Actual**: Report schema defines categories with `~w(...)a` — **atom** values (`:spam`,
  `:hate_speech`, etc.)
- **Impact**: String values passed to Ecto changesets won't match atom enum values. Reports created
  by auto-action may fail validation or store incorrect data.
- **Fix**: Use atom values (`:spam`, `:hate_speech`) or ensure the changeset casts strings to atoms.

---

## Minor Issues

### m1 — 18-01: runtime.exs env var line reference off

- **Plan says**: R2 env vars at L272-279
- **Actual**: R2 env vars at L264-266
- **Fix**: Correct line reference.

### m2 — 18-01: voice_message.ex schema line off by 1

- **Plan says**: Schema starts at L114
- **Actual**: Schema starts at L113
- **Fix**: Correct line reference.

### m3 — 18-01: ScheduledMessageWorker line count off by 1

- **Plan says**: 125L
- **Actual**: 126L
- **Fix**: Trivial.

### m4 — 18-02: search_engine.ex line count off by 1

- **Plan says**: 301L
- **Actual**: 302L
- **Fix**: Trivial.

### m5 — 18-02: conversation_id parameter description misleading

- **Plan says**: `search_messages/3` accepts `conversation_id` as a direct parameter
- **Actual**: `conversation_id` is in the opts keyword list via
  `Keyword.get(opts, :conversation_id)`
- **Fix**: Clarify that it's an opts key, not a positional parameter.

### m6 — 18-04: Scope presets file reference

- **Plan says**: Scopes defined in `rate_limit_plug.ex`
- **Actual**: Scope presets are in `rate_limiter.ex`
- **Fix**: Correct file reference.

---

## Scores by Plan

| Plan      | Claims | Verified | Critical     | Medium    | Minor     |
| --------- | ------ | -------- | ------------ | --------- | --------- |
| 18-01     | 12     | 8        | 1 (C1)       | 1 (M1)    | 3 (m1-m3) |
| 18-02     | 10     | 7        | 1 (C3)       | 1 (M5)    | 2 (m4-m5) |
| 18-03     | 8      | 7        | 0            | 1 (M2)    | 0         |
| 18-04     | 10     | 6        | 1 (C4)       | 2 (M3-M4) | 1 (m6)    |
| 18-05     | 14     | 7        | 4 (C2,C5-C7) | 2 (M6-M7) | 0         |
| **Total** | **54** | **35**   | **7**        | **7**     | **6**     |

---

## Recommendation

**Block execution until all CRITICAL issues are fixed.** The 18-05 auto-action pipeline (C2 + C6 +
C7) is the highest-risk cluster — three interacting bugs that would produce runtime crashes on every
moderation action. Fix these first, then address C1 (scope misestimate), C3 (missing function), C4
(wrong function name), and C5 (wrong module path).

Medium and minor issues should be corrected for accuracy but won't prevent execution.
