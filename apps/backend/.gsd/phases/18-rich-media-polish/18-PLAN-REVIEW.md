# Phase 18 — Rich Media & Polish: Plan Review

## Phase Goal

> "Voice messages, file sharing, GIFs, scheduled messages, search, animations, component polish,
> scale testing, AI moderation, and feature flags."

## Plan Summary

| Plan       | Title                                                 | Wave | Depends On | Requirements                                  | Tasks        | Key Deliverables                                                                                                                  |
| ---------- | ----------------------------------------------------- | ---- | ---------- | --------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 18-01      | Rich Media Messaging + E2EE                           | 1    | —          | MSG-10, MSG-11, MSG-12, MSG-15, E2EE-05, E2EE-06 | 10       | R2 storage wiring, file encryption, voice E2EE, file/image UI, GIF picker, scheduled messages CRUD, scheduled messages UI         |
| 18-02      | Search & Discovery                                    | 1    | —          | MSG-20, SEARCH-01, SEARCH-04, SEARCH-05       | 7            | Meilisearch message indexing, in-conversation search, quick switcher verification, explore backend + frontend                     |
| 18-03      | UI Polish & Component Library                         | 1    | —          | DESIGN-03, DESIGN-04, DESIGN-06               | 7            | animation tokens, page transitions, skeleton loading, empty states, Storybook 15→30+ stories, mobile polish, COMPONENTS.md       |
| 18-04      | Infrastructure Scale & Hardening                      | 1    | —          | INFRA-01, INFRA-04, INFRA-06, INFRA-07        | 8            | feature flag admin API + UI, rate limiting audit, WebSocket backpressure, 10K WS load test, realistic traffic test, results docs  |
| 18-05      | Moderation & Safety Hardening                         | 1    | —          | MOD-05, MOD-06, MOD-07                         | 7            | AI auto-action pipeline, moderation audit log, extended stats, dashboard metrics UI, bulk actions, appeal email notifications     |
| **Totals** |                                                       |      |            | **20/20**                                      | **39 tasks** |                                                                                                                                   |

## Wave Execution Plan

```
Wave 1 (all parallel — independent domains):
  ├── 18-01: Rich media messaging + E2EE      [full-stack, crypto, storage]
  ├── 18-02: Search & discovery               [full-stack, Meilisearch]
  ├── 18-03: UI polish & component library     [frontend-only]
  ├── 18-04: Infrastructure scale & hardening  [backend + infra + k6]
  └── 18-05: Moderation & safety hardening     [full-stack, AI, admin]
```

All 5 plans operate on independent domains with no cross-plan dependencies, enabling full parallel
execution in a single wave.

## Requirement Coverage

| Req       | Description                                          | Plan  | Status                                     |
| --------- | ---------------------------------------------------- | ----- | ------------------------------------------ |
| MSG-10    | Voice messages with waveform visualization           | 18-01 | Covered (90% exists — wire E2EE + polish)  |
| MSG-11    | File and image sharing (up to tier limit)            | 18-01 | Covered (80% exists — R2 storage + UI)     |
| MSG-12    | GIF search and inline send                           | 18-01 | Covered (95% exists — wire Tenor picker)   |
| MSG-15    | Schedule messages for future delivery                | 18-01 | Covered (50% — needs CRUD API + mobile)    |
| MSG-20    | Search message history with filters                  | 18-02 | Covered (90% — verify Meilisearch sync)    |
| E2EE-05   | File attachments encrypted before upload             | 18-01 | Covered (new crypto layer)                 |
| E2EE-06   | Voice message metadata encrypted E2E                 | 18-01 | Covered (new crypto layer)                 |
| SEARCH-01 | Search messages with filters (sender, date, channel) | 18-02 | Covered (90% — deduplicate with MSG-20)    |
| SEARCH-04 | Quick switcher (⌘K/Ctrl+K)                           | 18-02 | Covered (100% built — verify + polish)     |
| SEARCH-05 | Browse/discover public communities                   | 18-02 | Covered (30% backend — add aggregation)    |
| DESIGN-03 | Component library with consistent variants/states    | 18-03 | Covered (15 stories → 30+)                 |
| DESIGN-04 | Smooth animations and transitions                    | 18-03 | Covered (tokens + page transitions)        |
| DESIGN-06 | Empty states, error states, skeleton loading         | 18-03 | Covered (audit + expand)                   |
| INFRA-01  | 10,000+ concurrent WebSocket connections             | 18-04 | Covered (backpressure + load test)         |
| INFRA-04  | Load tested with realistic traffic patterns          | 18-04 | Covered (3 test scenarios + docs)          |
| INFRA-06  | Feature flags for gradual rollout                    | 18-04 | Covered (admin API + frontend SDK)         |
| INFRA-07  | Rate limiting on all public endpoints                | 18-04 | Covered (audit + per-tier + distributed)   |
| MOD-05    | AI-powered content moderation                        | 18-05 | Covered (auto-action pipeline + image stub)|
| MOD-06    | Admin moderation dashboard with metrics              | 18-05 | Covered (extended stats + trend UI + bulk) |
| MOD-07    | Appeal system for moderation decisions               | 18-05 | Covered (verify e2e + email notifications) |

## Success Criteria Mapping

| #   | Criterion                                                                              | Plan(s)     |
| --- | -------------------------------------------------------------------------------------- | ----------- |
| 1   | 10,000 simulated users connect without failures or degraded response times             | 18-04       |
| 2   | Page transitions and message animations feel 60fps smooth on both platforms             | 18-03       |
| 3   | User sends voice message with waveform and it's E2EE before upload                     | 18-01       |
| 4   | Quick switcher (⌘K) navigates to any conversation, channel, or forum instantly          | 18-02       |
| 5   | Every screen has appropriate loading skeletons, empty states, and error recovery        | 18-03       |

## Dependency Graph

```
18-01 ──┐
18-02 ──┤
18-03 ──┤  All Wave 1 (fully parallel, no cross-plan dependencies)
18-04 ──┤
18-05 ──┘
```

No inter-plan dependencies. Each plan operates on an independent domain:
- 18-01: Messaging + crypto + storage
- 18-02: Search + navigation + discovery
- 18-03: UI components + animations
- 18-04: Infrastructure + devops + load testing
- 18-05: Moderation + AI + admin

## Risk Assessment

| Risk                                      | Mitigation                                                                  | Plan  |
| ----------------------------------------- | --------------------------------------------------------------------------- | ----- |
| R2 presigned URL CORS/expiry issues       | Use existing `generate_presigned_url/2` pattern, test cross-origin uploads  | 18-01 |
| File encryption perf (large attachments)  | AES-GCM streaming encryption, chunked upload, size limits per tier          | 18-01 |
| Meilisearch index sync drift              | Oban worker for async indexing, reconciliation job, fallback to PostgreSQL  | 18-02 |
| k6 10K WS requires beefy test infra       | Docker Compose load-test profile, staged ramp (200→1K→5K→10K)              | 18-04 |
| Feature flag ETS single-node limitation   | Document as known limitation, Redis-backed flags in Phase 19 if needed      | 18-04 |
| AI moderation false positives on auto-act | High confidence threshold (0.9), auto-action limited to 4 categories only   | 18-05 |
| Storybook story explosion maintenance     | Autodoc plugin + consistent story template, component catalog doc           | 18-03 |

## Existing Infrastructure Leveraged

### Backend
- `uploads.ex` (437L) — Presigned URL generation via `generate_presigned_url/2`, file validation, tier limits
- `voice_message.ex` (347L) — Full schema with waveform (float array), transcription, processing pipeline
- `ai/moderation.ex` (135L) — LLM + heuristic fallback, 7 categories, check/2 returns :allow/:flag/:block
- `feature_flags.ex` (368L) — GenServer with boolean/percentage/variant/targeted types, CRUD functions
- `rate_limit_plug.ex` (284L) — 9 scope presets, 4 algorithms (fixed_window, sliding_window, token_bucket, leaky_bucket)
- `search.ex` (289L) + `messaging/search.ex` (183L) — Meilisearch with PostgreSQL ILIKE fallback
- `gif_controller.ex` (230L) — Tenor proxy with caching and fallback
- `moderation.ex` (87L) + `enforcement.ex` (312L) + `appeals.ex` (127L) — Full moderation stack
- `moderation/stats.ex` (61L) — Basic stats (reports_reviewed_today, avg_response_time)
- ExAws S3 configured for **Cloudflare R2** in `runtime.exs` (L272-279)

### Frontend (Web)
- `voice-message-recorder.tsx` (786L) — Web voice recording with waveform visualization
- `file-upload.tsx` (156L) + `useFileUpload.ts` — File upload with progress
- `gif-picker.tsx` (1,288L) — Full GIF search with Tenor integration
- `schedule-message-modal.tsx` (451L) — Scheduling UI with date/time picker
- `search-panel.tsx` (1,798L) — Search with filters, results, keyboard nav
- `quick-switcher.tsx` (249L) — ⌘K switcher with fuzzy search
- `explore-page.tsx` (206L) — Community discovery
- Admin module (3,120L) — Moderation queue, user management
- `appeals-queue.tsx` (257L) — Appeal review interface
- 15 Storybook stories, skeleton loading (519L), animated-empty-state (251L)

### Frontend (Mobile)
- `voice-message-player.tsx` (1,708L) — Voice playback with waveform
- `file-picker.tsx` (1,050L) — File selection and upload
- `search-screen.tsx` (3,242L) — Full search with filters
- `explore-screen.tsx` (481L) — Community discovery
- `content-moderation.ts` (678L) — Content reporting and moderation

### Packages
- `packages/crypto/src/aes.ts` (97L) — AES-GCM encrypt/decrypt (NO `encryptFile` yet)
- `packages/animation-constants/` (189L) — Duration, easing, spring, stagger tokens

### Infrastructure
- k6 load test scripts (5 existing, max 200 VUs) — needs expansion to 10K
- Docker Compose with observability stack (Prometheus, Grafana, Loki, Tempo)
- Fly.io deployment with clustering configured

## Files Modified (Aggregate)

**New files created:** ~35
**Existing files modified:** ~30
**New DB tables:** moderation_audit_logs, (scheduled_messages migration if not exists)
**New DB columns:** None anticipated (schemas already exist)
**New packages/deps:** None (all libraries already in deps)
