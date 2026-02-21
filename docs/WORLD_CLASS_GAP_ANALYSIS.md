# CGraph World-Class Gap Analysis

> **Version**: 0.9.37 | **Audit Date**: February 21, 2026 **Standard**: Google/Discord/Meta/Telegram
> | **Target**: 100% plan compliance **Methodology**: Automated codebase scan against all 15
> mandatory rules + 106 wave tasks

---

## Executive Summary

| Category             | Current | Target | Gap                                  |
| -------------------- | ------- | ------ | ------------------------------------ |
| Rule Compliance      | ~50%    | 100%   | 50% — 11 of 15 rules have violations |
| Wave Task Completion | ~8%     | 100%   | 92% — ~8 of 106 tasks done           |
| Composite Score      | 8.7/10  | 9.5/10 | 0.8 pts                              |

### Critical Gaps (Blocks World-Class)

1. **887 PascalCase filenames** in web (Rule 1 requires kebab-case)
2. **73 React.FC usages** (Rule 2 requires function declarations)
3. **949 type assertions** (`as X`) (Rule 11 requires type guards)
4. **1,115 useMemo/useCallback** occurrences (Rule 12 — React 19 Compiler handles this)
5. **7 remaining offset pagination** queries (Rule 10 — NEVER offset)
6. **6 missing shared packages** (Rule 5 — state, hooks, ui, config, core, test-utils)
7. **~98 undone wave tasks** out of 106 total

---

## PART 1: RULE COMPLIANCE AUDIT

### Rule 1: Google TypeScript Naming — FAIL

| Metric                        | Count     | Status                      |
| ----------------------------- | --------- | --------------------------- |
| PascalCase filenames (web)    | 887       | FAIL — should be kebab-case |
| PascalCase filenames (mobile) | 343       | FAIL — should be kebab-case |
| **Total files to rename**     | **1,230** |                             |

**Effort**: ~4h with automated codemod (rename files + update all imports) **Priority**: P2 — Large
blast radius, do in a dedicated PR with comprehensive import updates

**Action Items**:

- [ ] **1.1** Create codemod script to rename PascalCase → kebab-case (e.g., `MessageBubble.tsx` →
      `message-bubble.tsx`)
- [ ] **1.2** Run codemod on `apps/web/src/` (887 files)
- [ ] **1.3** Run codemod on `apps/mobile/src/` (343 files)
- [ ] **1.4** Update all import paths project-wide
- [ ] **1.5** Update ESLint config to enforce kebab-case filenames going forward

---

### Rule 2: Component Architecture — PARTIAL FAIL

| Metric                                 | Count   | Status                                     |
| -------------------------------------- | ------- | ------------------------------------------ |
| `React.FC` / `React.FunctionComponent` | 73      | FAIL — should use function declarations    |
| `forwardRef` usage                     | 2       | FAIL — should use `ref` as prop (React 19) |
| Helpers inside components              | Unknown | Needs manual audit                         |

**Files with React.FC** (sample — 30+):

- `apps/web/src/modules/forums/components/SubscriptionButton.tsx`
- `apps/web/src/modules/auth/components/AuthCardHeader.tsx` (+ 7 more auth)
- `apps/web/src/modules/premium/components/CoinShopWidget.tsx` (+ 9 more premium)
- `apps/web/src/modules/settings/components/UsernameHistory.tsx`
- `apps/web/src/components/layout/TopNav.tsx`, `Sidebar.tsx`
- `apps/web/src/components/dev/ProfilerWrapper.tsx`

**Action Items**:

- [ ] **2.1** Create codemod: `React.FC<Props>` →
      `function Component(props: Props): React.ReactElement`
- [ ] **2.2** Run codemod on all 73 occurrences
- [ ] **2.3** Replace 2 `forwardRef` calls with `ref` prop pattern
- [ ] **2.4** Add ESLint rule to ban `React.FC` (`@typescript-eslint/ban-types` or custom)
- [ ] **2.5** Audit for helper functions inside components (move to module level)

---

### Rule 3: State Management — PASS

| Metric                  | Status  | Notes                                                                      |
| ----------------------- | ------- | -------------------------------------------------------------------------- |
| Web Zustand stores      | PASS    | 29+ stores, module-based                                                   |
| Mobile Zustand stores   | PASS    | 11 stores — full Zustand migration complete                                |
| Mobile Context shims    | CLEANUP | 4 `@deprecated` re-export files in `contexts/` (no real Context API usage) |
| Store MAX constants     | PARTIAL | 20 MAX constants found, but some stores lack them                          |
| Unbounded array spreads | FAIL    | 20+ spreads without MAX bounds                                             |

**Action Items**:

- [ ] **3.1** Delete 4 deprecated mobile context shim files in `contexts/` + update imports to use
      stores directly
- [ ] **3.2** Add MAX constants to ALL store arrays (audit admin, chat, thread stores)
- [ ] **3.3** Add `.slice(-MAX)` bounds to all unbounded `[...state.X, newItem]` patterns
- [ ] **3.4** Add `reset()` action to every store (verify all stores have it)
- [ ] **3.5** Create mobile `stores/index.ts` facade matching web's 7-domain pattern

---

### Rule 4: Animation Standards — NEEDS AUDIT

| Metric                     | Status  | Notes                                 |
| -------------------------- | ------- | ------------------------------------- |
| Web animation presets      | EXISTS  | `apps/web/src/lib/animation-presets/` |
| Mobile AnimationLibrary    | EXISTS  | `apps/mobile/src/lib/animations/`     |
| Inline spring values       | UNKNOWN | Needs targeted audit                  |
| Deprecated Animated API    | UNKNOWN | Needs mobile audit                    |
| Shared animation constants | EXISTS  | `packages/animation-constants/`       |

**Action Items**:

- [ ] **4.1** Audit web for inline `transition: { duration: X }` without preset import
- [ ] **4.2** Audit mobile for deprecated `Animated` from `react-native` (should be Reanimated v4)
- [ ] **4.3** Extract any remaining inline animation values to preset files
- [ ] **4.4** Verify every interactive element has animation (buttons, toggles, etc.)

---

### Rule 5: Cross-Platform Parity — FAIL

| Package                         | Plan Says        | Actual      | Status |
| ------------------------------- | ---------------- | ----------- | ------ |
| `packages/shared-types/`        | EXISTS           | EXISTS      | PASS   |
| `packages/utils/`               | EXISTS           | EXISTS      | PASS   |
| `packages/crypto/`              | EXISTS           | EXISTS      | PASS   |
| `packages/socket/`              | EXISTS           | EXISTS      | PASS   |
| `packages/api-client/`          | EXISTS           | EXISTS      | PASS   |
| `packages/animation-constants/` | EXISTS           | EXISTS      | PASS   |
| `packages/state/`               | EXISTS           | **MISSING** | FAIL   |
| `packages/hooks/`               | EXISTS           | **MISSING** | FAIL   |
| `packages/ui/`                  | EXISTS           | **MISSING** | FAIL   |
| `packages/config/`              | EXISTS           | **MISSING** | FAIL   |
| `packages/core/`                | EXISTS           | **MISSING** | FAIL   |
| `packages/test-utils/`          | Task 0.6 creates | **MISSING** | FAIL   |

**The plan claims 9 shared packages exist — only 6 actually do.** Three packages listed as "EXISTS"
(`state`, `hooks`, `ui`, `config`, `core`) do NOT exist.

**Action Items**:

- [ ] **5.1** Create `packages/state/` — shared Zustand store logic (enables mobile/web code
      sharing)
- [ ] **5.2** Create `packages/hooks/` — shared React hooks (useDebounce, useLocalStorage, etc.)
- [ ] **5.3** Create `packages/ui/` — shared UI component primitives
- [ ] **5.4** Create `packages/config/` — shared configuration constants
- [ ] **5.5** Create `packages/core/` — core business logic
- [ ] **5.6** Create `packages/test-utils/` — test builders, MSW handlers, custom matchers (Task
      0.6)
- [ ] **5.7** Update plan to reflect actual package inventory honestly

---

### Rule 6: Documentation Requirements — PARTIAL FAIL

| Metric                                 | Count  | Status        |
| -------------------------------------- | ------ | ------------- |
| Files with JSDoc header (sampled 100)  | 83/100 | 83% — PARTIAL |
| Modules missing `@moduledoc`           | 2      | NEAR PASS     |
| `@doc` coverage (sampled messaging.ex) | 21/31  | 68% — FAIL    |
| Files lacking any top comment          | ~173   | FAIL          |

**Action Items**:

- [ ] **6.1** Add JSDoc file headers to ~173 module files missing them
- [ ] **6.2** Add `@moduledoc` to 2 remaining Elixir modules (settings_controller,
      customization_controller)
- [ ] **6.3** Add `@doc` to undocumented public Elixir functions (estimated 500+ functions)
- [ ] **6.4** Add JSDoc to all exported interfaces/types that lack them
- [ ] **6.5** Enforce JSDoc via ESLint rule (`jsdoc/require-jsdoc` for exported functions)

---

### Rule 7: Backend Standards — PARTIAL FAIL

| Metric                       | Count | Status                               |
| ---------------------------- | ----- | ------------------------------------ |
| Public functions             | 2,738 | —                                    |
| Functions with `@spec`       | 674   | **24.6%** — FAIL (target: 100%)      |
| Logger string interpolation  | 111   | FAIL — should be structured metadata |
| Modules missing `@moduledoc` | 2     | NEAR PASS                            |

**Action Items**:

- [ ] **7.1** Add `@spec` to remaining ~2,064 public functions (prioritize controllers + contexts)
- [ ] **7.2** Fix 111 Logger string interpolation → structured metadata
  - `Logger.info("User #{id} action")` → `Logger.info("user_action", user_id: id)`
- [ ] **7.3** Add `@moduledoc` to 2 remaining modules
- [ ] **7.4** Enable `mix credo --strict` rule for missing `@spec` annotations
- [ ] **7.5** Enable `mix credo --strict` rule for Logger interpolation

---

### Rule 8: File Size & Complexity Limits — FAIL

#### TSX Components Over 300 Lines (16 files)

| File                                 | Lines | Over By |
| ------------------------------------ | ----- | ------- |
| `ForumHierarchyAdmin.tsx`            | 536   | 236     |
| `ForumPermissionsPanel.tsx`          | 452   | 152     |
| `MatrixText.tsx`                     | 422   | 122     |
| `effects-customization/sections.tsx` | 405   | 105     |
| `ChannelsTab.tsx`                    | 396   | 96      |
| `SeasonalEffects.tsx`                | 382   | 82      |
| `EmojiTab.tsx`                       | 370   | 70      |
| `ChannelCategoriesPanel.tsx`         | 355   | 55      |
| `chat-bubble-settings/tabs.tsx`      | 352   | 52      |
| `chat-customization/sections.tsx`    | 342   | 42      |
| `ChatPanel.tsx`                      | 340   | 40      |
| `ProfilePanel.tsx`                   | 335   | 35      |
| `AccountSettings.tsx`                | 333   | 33      |
| `GlassCard.tsx`                      | 331   | 31      |
| `MatrixBackground.tsx`               | 325   | 25      |
| `AnimatedMessageWrapper.tsx`         | 312   | 12      |

#### Elixir Contexts Over 500 Lines (19 files)

| File                 | Lines | Over By |
| -------------------- | ----- | ------- |
| `jobs.ex`            | 1,253 | 753     |
| `data_export.ex`     | 1,059 | 559     |
| `presence.ex`        | 905   | 405     |
| `oauth.ex`           | 823   | 323     |
| `moderation.ex`      | 816   | 316     |
| `redis.ex`           | 802   | 302     |
| `cache.ex`           | 764   | 264     |
| `batch_processor.ex` | 717   | 217     |
| `api_versioning.ex`  | 686   | 186     |
| `request_context.ex` | 656   | 156     |
| `rate_limiter.ex`    | 641   | 141     |
| `metrics.ex`         | 604   | 104     |
| `health_check.ex`    | 594   | 94      |
| `idempotency.ex`     | 575   | 75      |
| `webhooks.ex`        | 566   | 66      |
| `tracing.ex`         | 564   | 64      |
| `mailer.ex`          | 562   | 62      |
| `permissions.ex`     | 556   | 56      |
| `error_reporter.ex`  | 555   | 55      |

**Action Items**:

- [ ] **8.1** Split 16 oversized TSX components into sub-components (extract sections, panels, tabs)
- [ ] **8.2** Split 19 oversized Elixir contexts into submodules with `defdelegate`
- [ ] **8.3** Add CI check: fail on files exceeding limits (component 300, store 400, context 500)

---

### Rule 9: Testing Requirements — FAIL

| Metric                    | Current | Target       | Gap               |
| ------------------------- | ------- | ------------ | ----------------- |
| Web components (non-test) | ~1,150  | —            | —                 |
| Web test files            | 205     | ~1,150 (1:1) | **~945 missing**  |
| Web test coverage ratio   | ~18%    | 100%         | ~82%              |
| Mobile test files         | 27      | —            | Needs assessment  |
| Backend test files        | 171     | —            | Likely sufficient |

**Module Test Coverage** (tests per module): | Module | Tests | Components | Gap |
|--------|-------|------------|-----| | chat | 17 | ~80 | 63 | | forums | 12 | ~90 | 78 | |
gamification | 11 | ~60 | 49 | | social | 6 | ~40 | 34 | | settings | 5 | ~50 | 45 | | auth | 4 |
~20 | 16 | | groups | 4 | ~40 | 36 | | moderation | 4 | ~20 | 16 | | calls | 3 | ~25 | 22 | |
premium | 3 | ~30 | 27 | | search | 3 | ~15 | 12 | | admin | 2 | ~30 | 28 |

**Action Items**:

- [ ] **9.1** Create test infrastructure: `packages/test-utils/` with builders + MSW handlers (Task
      0.6)
- [ ] **9.2** Write tests for critical path first: auth (4→20), chat (17→80), settings (5→50)
- [ ] **9.3** Add test files for remaining modules (target: 3 tests per component minimum)
- [ ] **9.4** Set up coverage ratchet in CI (never decrease, only increase)
- [ ] **9.5** Add integration tests for store→API→component flows

---

### Rule 10: Performance & Scale Budgets — PARTIAL FAIL

| Metric                         | Status | Details                                                                                                                   |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Offset pagination              | FAIL   | **7 remaining** in `calendar.ex`, `messages.ex`, `conversations.ex`, `search.ex` (×2), `member_directory.ex`, `forums.ex` |
| N+1 query patterns             | FAIL   | 10+ `Repo.all`/`Repo.get` without preloads in forums modules                                                              |
| Redis KEYS command             | PASS   | 0 violations                                                                                                              |
| Virtualized lists (web)        | PASS   | `@tanstack/react-virtual` in ConversationMessages                                                                         |
| ScrollView+map (mobile)        | WARN   | 3 files using ScrollView (PollWidget, EditHistory, AttachmentPreview)                                                     |
| Message pruning (MAX_MESSAGES) | PASS   | 500 cap in chatStore                                                                                                      |
| Bundle size                    | PASS   | CI checks in performance.yml                                                                                              |

**Action Items**:

- [ ] **10.1** Migrate 7 remaining offset queries to `CGraph.Pagination.paginate/2`:
  - `calendar.ex:83` — `offset(^offset)`
  - `messages.ex:42` — `offset(^((page - 1) * per_page))`
  - `conversations.ex:42` — `offset(^((page - 1) * per_page))`
  - `search.ex:62` — `offset(^((page - 1) * per_page))`
  - `search.ex:99` — `offset(^((page - 1) * per_page))`
  - `member_directory.ex:42` — `offset(^offset)`
  - `forums.ex:142` — `offset(^((page - 1) * per_page))`
- [ ] **10.2** Add `preload()` to 10+ N+1 query patterns in forums modules
- [ ] **10.3** Replace 3 mobile ScrollView with FlatList where lists can grow
- [ ] **10.4** Run `EXPLAIN ANALYZE` on top 20 queries, add missing indexes

---

### Rule 11: Security — PARTIAL FAIL

| Metric                    | Count   | Status                              |
| ------------------------- | ------- | ----------------------------------- |
| Type assertions (`as X`)  | 949     | FAIL — should use type guards       |
| `dangerouslySetInnerHTML` | 8 files | WARN — needs XSS sanitization audit |
| CSP headers               | EXISTS  | PASS                                |
| Rate limit headers        | EXISTS  | PASS                                |
| Sentry integration        | EXISTS  | PASS                                |
| `.env` committed          | 0       | PASS                                |
| `eval()` usage            | 0       | PASS                                |

**Action Items**:

- [ ] **11.1** Audit and replace 949 type assertions with type guards (batch: 50 per PR)
  - Priority: API response parsing, store data, event handlers
  - Pattern: `data as User` → `isUser(data) ? data : throw`
- [ ] **11.2** Audit 8 `dangerouslySetInnerHTML` usages for XSS sanitization (DOMPurify)
  - `ForumThemeProvider.tsx`, `ThreadedComment.tsx`, `ContentPreview.tsx`, `AnnouncementItem.tsx`
  - `post-content.tsx`, `FeedSubscribeModal.tsx`, `SearchResultCard.tsx`, `BBCodeRenderer.tsx`
- [ ] **11.3** Add ESLint rule to prevent new `as` type assertions

---

### Rule 12: React 19 Patterns — FAIL

| Metric                      | Count              | Status                                |
| --------------------------- | ------------------ | ------------------------------------- |
| React version               | 19.x               | PASS                                  |
| `useContext()` (legacy)     | 14                 | FAIL — should use `use()` (React 19)  |
| `useOptimistic()` adoption  | 3                  | LOW — should be on all mutation UIs   |
| `useFormStatus()` adoption  | 0                  | FAIL — not used anywhere              |
| `useActionState()` adoption | 0                  | FAIL — not used anywhere              |
| `useMemo`/`useCallback`     | 1,115 in 270 files | FAIL — React 19 Compiler handles this |
| `React.FC`                  | 73                 | FAIL — already counted in Rule 2      |
| `forwardRef`                | 4                  | FAIL — already counted in Rule 2      |

**Action Items**:

- [ ] **12.1** Replace 14 `useContext()` → `use()` calls
  - `ThemeContext.tsx`, `hooks.ts` (theme-enhanced), `ChatEffectsProvider.tsx`
  - `seasonal-theme-provider/hooks.ts`, `holographic-ui/context.tsx`
  - `HoloProvider.tsx`, `popover.tsx`, `ProfilePhotoViewer.tsx`
  - `tabs.tsx`, `Toast.tsx`, `useNotification.ts`
- [ ] **12.2** Remove unnecessary `useMemo`/`useCallback` in 270 files
  - Only keep those verified by profiling as needed
  - React 19 Compiler auto-memoizes — manual memos add overhead
  - Process: grep → review → remove if no profiling justification
- [ ] **12.3** Add `useOptimistic()` to mutation UIs (message send, reaction, vote, friend request)
- [ ] **12.4** Add `useFormStatus()` to all form submit buttons (login, register, settings, post
      editor)
- [ ] **12.5** Add `useActionState()` for form actions (settings, profile edit, create group)

---

### Rule 13: CI/CD Quality Gates — PARTIAL PASS

| Metric               | Status | Notes                                                |
| -------------------- | ------ | ---------------------------------------------------- |
| GitHub workflows     | 17     | PASS                                                 |
| Permissions blocks   | 15/17  | FAIL — `backup.yml` and `deploy-backend.yml` missing |
| Coverage enforcement | EXISTS | PASS — CI gates at 60% web / 75% backend             |
| Bundle size check    | EXISTS | PASS — performance.yml, 2MB limit                    |
| Canary deploys       | EXISTS | PASS — Fly.io canary strategy                        |
| Auto-rollback        | EXISTS | PASS — Fly.io canary                                 |
| Renovate             | EXISTS | PASS                                                 |

**Action Items**:

- [ ] **13.1** Add `permissions:` block to `backup.yml`
- [ ] **13.2** Add `permissions:` block to `deploy-backend.yml`
- [ ] **13.3** Raise web coverage gate from 60% → 70% (incremental ratchet)
- [ ] **13.4** Add ESLint rules for: no React.FC, no forwardRef, no useContext, kebab-case files

---

### Rule 14: Observability Requirements — PASS

| Metric             | Status  | Notes                                     |
| ------------------ | ------- | ----------------------------------------- |
| Telemetry events   | 89      | PASS                                      |
| Structured logging | PARTIAL | 111 interpolation violations (see Rule 7) |
| Sentry (backend)   | EXISTS  | PASS                                      |
| OpenTelemetry      | EXISTS  | PASS — 5 OTel packages in mix.exs         |
| Grafana dashboards | EXISTS  | PASS                                      |
| SLO GenServer      | EXISTS  | PASS                                      |

**Action Items**:

- [ ] **14.1** Fix 111 Logger interpolation violations (same as Rule 7.2)
- [ ] **14.2** Add telemetry events to any new endpoints
- [ ] **14.3** Ensure all controllers emit latency metrics

---

### Rule 15: API Contract & Versioning — PARTIAL FAIL

| Metric                          | Status | Notes                                                 |
| ------------------------------- | ------ | ----------------------------------------------------- |
| Consistent JSON response shapes | FAIL   | ~67 `json(conn, ...)` calls NOT using `data:` wrapper |
| Rate limit headers              | PASS   | `rate_limiter_v2.ex` adds headers                     |
| Cursor-based pagination         | FAIL   | 7 remaining offset queries                            |
| API versioning                  | PASS   | `/api/v1/` namespace                                  |

**Action Items**:

- [ ] **15.1** Audit all 67 non-standard `json(conn, ...)` responses
  - Wrap in `%{data: ...}` format per Rule 15
  - Affects: `settings_controller.ex` (7), `payment_controller.ex` (4), `health_controller.ex` (1),
    `web_push_controller.ex` (2), `stripe_webhook_controller.ex` (1), others
- [ ] **15.2** Add `meta:` with cursor/has_more to all list endpoints
- [ ] **15.3** Create shared `render_response/3` helper for consistent shapes

---

## PART 2: WAVE TASK COMPLETION STATUS

### Wave 0: Foundation (7 tasks — 0 DONE)

| Task | Name                                   | Status      | Blocker                                                      |
| ---- | -------------------------------------- | ----------- | ------------------------------------------------------------ |
| 0.1  | Unify Mobile State (Context → Zustand) | NOT DONE    | 11 stores exist but 4 Contexts remain                        |
| 0.2  | Consolidate Mobile Folder Architecture | NOT DONE    | Still has `screens/` + `features/` split                     |
| 0.3  | Complete Web Legacy Migration          | NOT DONE    | 246+ files in legacy `components/` folder                    |
| 0.4  | Create Shared API Client Layer         | PARTIAL     | `packages/api-client/` exists but web still uses raw fetch   |
| 0.5  | Establish Shared Animation Constants   | PARTIAL     | `packages/animation-constants/` exists but not fully adopted |
| 0.6  | Create Shared Test Utilities Package   | NOT DONE    | `packages/test-utils/` doesn't exist                         |
| 0.7  | Harden CI/CD Pipeline                  | MOSTLY DONE | 17 workflows, coverage gates, but 2 missing permissions      |

### Wave 1: Fix Broken Customizations (10 tasks — UNKNOWN)

| Task | Name                                      | Status      | Notes                         |
| ---- | ----------------------------------------- | ----------- | ----------------------------- |
| 1.1  | Add Missing Bubble Style CSS Classes      | NEEDS CHECK | CSS classes for bubble styles |
| 1.2  | Wire Chat Bubble Styles to MessageBubble  | NEEDS CHECK | Style rendering               |
| 1.3  | Add Sender Customization to API Responses | NEEDS CHECK | Backend sender_data           |
| 1.4  | Render User Titles Everywhere             | NEEDS CHECK | Title badges                  |
| 1.5  | Connect Profile Theme CSS Variables       | NEEDS CHECK | Theme variables               |
| 1.6  | Wire Avatar Border Animations             | NEEDS CHECK | Border effects                |
| 1.7  | Create Background Effect Renderer         | NEEDS CHECK | Background effects            |
| 1.8  | Wire Message Effect Animations            | NEEDS CHECK | Message effects               |
| 1.9  | Wire Reaction Animation Styles            | NEEDS CHECK | Reaction animations           |
| 1.10 | Fix Mobile Chat Bubble Customization      | NEEDS CHECK | Mobile bubbles                |

### Wave 2: Animations (14 + 14 bonus = 28 tasks — PARTIALLY DONE)

Core animations exist for: typing indicators, reactions, level-up, achievements, friend cards,
toasts, modals. Missing: message entrance/exit, vote feedback, page transitions, list stagger,
loading skeletons, sidebar physics, search animations, presence animations, settings animations.

### Wave 3: Feature Completeness (3 tasks)

| Task | Name                                     | Status      |
| ---- | ---------------------------------------- | ----------- |
| 3.1  | Legal Pages (Mobile) — App Store Blocker | NEEDS CHECK |
| 3.2  | Data Export Page (Web) — GDPR            | NEEDS CHECK |
| 3.3  | Moderation Queue (Mobile)                | NEEDS CHECK |

### Wave 4: Database & Scaling (7 tasks — 2 DONE)

| Task | Name                               | Status                        |
| ---- | ---------------------------------- | ----------------------------- |
| 4.1  | Deploy PgBouncer                   | NOT DONE                      |
| 4.2  | Configure Read Replicas            | NOT DONE                      |
| 4.3  | Redis Sorted Sets for Leaderboards | **DONE** (Session 37)         |
| 4.4  | Activate Meilisearch               | NOT DONE                      |
| 4.5  | Message Archival Strategy          | NOT DONE                      |
| 4.6  | Migrate ALL Offset Pagination      | PARTIAL (3 done, 7 remaining) |
| 4.7  | Frontend Scaling Optimizations     | PARTIAL                       |

### Wave 5: Code Quality (5 tasks — 0 DONE)

| Task | Name                           | Status                        |
| ---- | ------------------------------ | ----------------------------- |
| 5.1  | Standardize Animation Usage    | NOT DONE                      |
| 5.2  | Update Memo Comparators        | NOT DONE                      |
| 5.3  | Customization Store Hydration  | NEEDS CHECK                   |
| 5.4  | Reduced Motion / Accessibility | NEEDS CHECK                   |
| 5.5  | File Size Compliance           | NOT DONE (35 oversized files) |

### Wave 6: Testing (3 tasks — 0 DONE)

| Task | Name                            | Status              |
| ---- | ------------------------------- | ------------------- |
| 6.1  | Customization Integration Tests | NOT DONE            |
| 6.2  | Backend Sender Data Tests       | NOT DONE            |
| 6.3  | Build Verification              | ONGOING (CI exists) |

### Wave 7-9: Features, Mobile, Backend (remaining tasks)

Most tasks in Waves 7-9 (Groups, Mobile, Backend features) are NOT STARTED. They cover channel
permissions, pinned messages, categories, custom status, DND mode, quick switcher, and various
mobile feature parity items.

---

## PART 3: PRIORITIZED IMPLEMENTATION PLAN

### Priority Tier 1: Critical Foundation (Do First — Weeks 1-2)

| #   | Action                                                                   | Effort | Impact                    | Rule   |
| --- | ------------------------------------------------------------------------ | ------ | ------------------------- | ------ |
| 1   | Create `packages/test-utils/` (builders, MSW, matchers)                  | 16h    | Unblocks all testing      | 9, 5   |
| 2   | Migrate 7 remaining offset → cursor pagination                           | 4h     | Performance + correctness | 10, 15 |
| 3   | Fix 111 Logger string interpolation → structured                         | 4h     | Observability             | 7, 14  |
| 4   | Add `permissions:` to backup.yml + deploy-backend.yml                    | 0.5h   | CI security               | 13     |
| 5   | Remove 4 remaining mobile Context providers                              | 4h     | Architecture              | 3, 5   |
| 6   | Fix plan: mark 3 packages as NOT EXISTS (state, hooks, ui, config, core) | 0.5h   | Accuracy                  | —      |

### Priority Tier 2: Major Standards Compliance (Weeks 2-4)

| #   | Action                                                      | Effort | Impact            | Rule  |
| --- | ----------------------------------------------------------- | ------ | ----------------- | ----- |
| 7   | Codemod: 73 React.FC → function declarations                | 4h     | Code standard     | 2, 12 |
| 8   | Codemod: 14 `useContext()` → `use()`                        | 2h     | React 19          | 12    |
| 9   | Replace 2 `forwardRef` → ref-as-prop                        | 0.5h   | React 19          | 2, 12 |
| 10  | Audit + fix 8 `dangerouslySetInnerHTML` for XSS             | 4h     | Security critical | 11    |
| 11  | Add `@spec` to top 200 public functions (controllers first) | 16h    | Backend quality   | 7     |
| 12  | Fix 67 non-standard JSON response shapes                    | 8h     | API consistency   | 15    |
| 13  | Split 5 worst oversized TSX components (>400 lines)         | 8h     | Maintainability   | 8     |
| 14  | Split 5 worst oversized Elixir contexts (>800 lines)        | 8h     | Maintainability   | 8     |
| 15  | Add N+1 preloads to 10+ forum queries                       | 4h     | Performance       | 10    |

### Priority Tier 3: Scale Improvements (Weeks 4-6)

| #   | Action                                                            | Effort | Impact            | Rule |
| --- | ----------------------------------------------------------------- | ------ | ----------------- | ---- |
| 16  | Remove unnecessary useMemo/useCallback (270 files)                | 16h    | React 19 Compiler | 12   |
| 17  | Add useOptimistic to mutation UIs (5 locations)                   | 4h     | UX quality        | 12   |
| 18  | Add useFormStatus to form buttons (8 forms)                       | 2h     | UX quality        | 12   |
| 19  | Create 5 missing shared packages (state, hooks, ui, config, core) | 40h    | Architecture      | 5    |
| 20  | Write 50 critical-path component tests                            | 40h    | Test coverage     | 9    |
| 21  | Add JSDoc to ~173 module files                                    | 16h    | Documentation     | 6    |
| 22  | Add `@doc` to 500+ Elixir functions                               | 40h    | Documentation     | 6, 7 |

### Priority Tier 4: File Naming Migration (Week 6-7)

| #   | Action                             | Effort | Impact          | Rule |
| --- | ---------------------------------- | ------ | --------------- | ---- |
| 23  | Create kebab-case rename codemod   | 4h     | Tooling         | 1    |
| 24  | Rename 887 web PascalCase files    | 8h     | Naming standard | 1    |
| 25  | Rename 343 mobile PascalCase files | 4h     | Naming standard | 1    |
| 26  | Update all imports project-wide    | 4h     | Imports         | 1    |

### Priority Tier 5: Type Safety Sprint (Weeks 7-10)

| #   | Action                                                  | Effort | Impact        | Rule |
| --- | ------------------------------------------------------- | ------ | ------------- | ---- |
| 27  | Replace 949 type assertions with type guards (50/PR)    | 80h    | Type safety   | 11   |
| 28  | Add `@spec` to remaining ~1,864 functions               | 80h    | Backend types | 7    |
| 29  | Add remaining component tests (target: 3 per component) | 160h   | Test coverage | 9    |

### Priority Tier 6: Wave Tasks (Weeks 10+)

Execute remaining wave tasks 0.1-0.3 (architecture), 1.x (customizations), 2.x (animations), 3.x
(features), 4.x (scaling), 5.x (quality), 6.x (testing), 7.x+ (features) as prioritized in the
master plan.

---

## PART 4: VERIFICATION CHECKLIST

Run these checks after each implementation sprint to track progress:

```bash
# Rule 1: File naming (target: 0)
find apps/web/src apps/mobile/src -name '*.tsx' -o -name '*.ts' | grep -v node_modules | sed 's|.*/||' | grep -E '^[A-Z]' | wc -l

# Rule 2: React.FC (target: 0)
grep -rn 'React\.FC\b' apps/web/src/ apps/mobile/src/ --include='*.tsx' | grep -v node_modules | grep -v __tests__ | wc -l

# Rule 7: Logger interpolation (target: 0)
grep -rn 'Logger\.' apps/backend/lib/ --include='*.ex' | grep '".*#{' | wc -l

# Rule 7: @spec coverage (target: >80%)
echo "$(grep -rn '@spec' apps/backend/lib/cgraph/ --include='*.ex' | wc -l) / $(grep -rn '^\s*def [a-z]' apps/backend/lib/cgraph/ --include='*.ex' | grep -v defp | wc -l)"

# Rule 10: Offset pagination (target: 0)
grep -rn 'offset(' apps/backend/lib/ --include='*.ex' | grep -v '#\|@doc\|moduledoc\|_offset\|time_offset' | wc -l

# Rule 11: Type assertions (target: <100)
grep -rn ' as [A-Z]' apps/web/src/ --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v __tests__ | grep -v import | wc -l

# Rule 12: useContext legacy (target: 0)
grep -rn 'useContext(' apps/web/src/ apps/mobile/src/ --include='*.tsx' --include='*.ts' | grep -v node_modules | grep -v __tests__ | wc -l

# Rule 12: useMemo/useCallback (target: <200)
grep -rn 'useMemo\|useCallback' apps/web/src/ --include='*.tsx' --include='*.ts' | grep -v node_modules | grep -v __tests__ | wc -l

# Rule 13: CI permissions (target: 17/17)
for f in .github/workflows/*.yml; do grep -c 'permissions:' "$f"; done | grep -c '^0$'

# Rule 15: JSON response consistency (target: 0 non-standard)
grep -rn 'json(conn' apps/backend/lib/cgraph_web/controllers/ --include='*.ex' | grep -v 'data:\|error:\|meta:\|render\|message:\|token:\|status:' | wc -l
```

---

## PART 5: CURRENT VS WORLD-CLASS SCORECARD

| Dimension                   | Current               | After Tier 1-2 | World-Class Target  |
| --------------------------- | --------------------- | -------------- | ------------------- |
| File Naming (Rule 1)        | 0% (1,230 violations) | 0%             | 100% (0 violations) |
| Component Patterns (Rule 2) | 90% (73 React.FC)     | 100%           | 100%                |
| State Management (Rule 3)   | 95%                   | 100%           | 100%                |
| Cross-Platform (Rule 5)     | 55% (6/12 packages)   | 55%            | 100% (12/12)        |
| Documentation (Rule 6)      | 75%                   | 80%            | 100%                |
| Backend Standards (Rule 7)  | 25% (@spec)           | 35%            | 100%                |
| File Size (Rule 8)          | 65% (35 violations)   | 80%            | 100%                |
| Testing (Rule 9)            | 18% ratio             | 25%            | 100%                |
| Performance (Rule 10)       | 85% (7 offsets)       | 100%           | 100%                |
| Security (Rule 11)          | 50% (949 assertions)  | 60%            | 100%                |
| React 19 (Rule 12)          | 30%                   | 70%            | 100%                |
| CI/CD (Rule 13)             | 90%                   | 100%           | 100%                |
| Observability (Rule 14)     | 85%                   | 100%           | 100%                |
| API Contract (Rule 15)      | 60%                   | 80%            | 100%                |
| **Overall**                 | **~58%**              | **~72%**       | **100%**            |

---

## APPENDIX: Total Effort Estimate

| Tier                        | Hours     | Weeks (1 dev) | Priority |
| --------------------------- | --------- | ------------- | -------- |
| Tier 1: Critical Foundation | 29h       | 1 week        | P0       |
| Tier 2: Major Standards     | 55h       | 1.5 weeks     | P1       |
| Tier 3: Scale Improvements  | 158h      | 4 weeks       | P1       |
| Tier 4: File Naming         | 20h       | 0.5 weeks     | P2       |
| Tier 5: Type Safety Sprint  | 320h      | 8 weeks       | P2       |
| Tier 6: Wave Tasks          | 400h+     | 10+ weeks     | P3       |
| **Total**                   | **~980h** | **~25 weeks** |          |

> **Bottom Line**: The codebase has strong infrastructure (CI, observability, security, E2EE) but
> significant gaps in code standards enforcement (naming, types, tests, React 19 patterns). Tier 1-2
> fixes (~84 hours) will jump compliance from ~55% to ~70%. Full world-class requires sustained
> investment in type safety, testing, and documentation over ~25 developer-weeks.
