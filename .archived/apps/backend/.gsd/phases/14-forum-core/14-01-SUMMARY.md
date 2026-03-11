---
phase: 14
plan: 01
status: complete
---

# Summary: Plan 14-01

## Tasks Completed

- **Task 1: BBCode parser** — Created `CGraph.Forums.BBCode` module with full tag support (b, i, u,
  s, url, img, quote, code, list, color, size, center, spoiler), XSS protection, URL scheme
  validation, and comprehensive test suite.
  - `apps/backend/lib/cgraph/forums/bbcode.ex` (274 lines)
  - `apps/backend/test/cgraph/forums/bbcode_test.exs` (226 lines)

- **Task 2: Schema wiring** — Replaced inline `maybe_render_html/escape_html` in Thread and
  ThreadPost schemas, delegating to `BBCode.to_html/1`.
  - `apps/backend/lib/cgraph/forums/thread.ex` (143 lines, modified)
  - `apps/backend/lib/cgraph/forums/thread_post.ex` (123 lines, modified)

- **Task 3: PollController** — Created PollController (show, create, vote, close, update), PollJSON
  view, and nested routes under `/threads/:thread_id/poll`.
  - `apps/backend/lib/cgraph_web/controllers/api/v1/poll_controller.ex` (150 lines)
  - `apps/backend/lib/cgraph_web/controllers/api/v1/poll_json.ex` (47 lines)
  - `apps/backend/lib/cgraph_web/router/forum_routes.ex` (132 lines, modified)

- **Task 4: Inline poll creation** — Modified `Threads.create_thread/3` to check for `"poll"` key in
  attrs and create poll atomically inside existing transaction.
  - `apps/backend/lib/cgraph/forums/threads.ex` (232 lines, modified)

- **Task 5: ThreadAttachment controller** — Created ThreadAttachments context (create, list, get,
  delete with ownership check), controller (upload, index, delete), JSON view, and routes.
  - `apps/backend/lib/cgraph/forums/thread_attachments.ex` (63 lines)
  - `apps/backend/lib/cgraph_web/controllers/api/v1/thread_attachment_controller.ex` (75 lines)
  - `apps/backend/lib/cgraph_web/controllers/api/v1/thread_attachment_json.ex` (50 lines)

## Commit History

| Hash       | Message                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `d4656712` | feat(forums): add BBCode parser with XSS protection                     |
| `920d63cc` | refactor(forums): wire BBCode parser into Thread and ThreadPost schemas |
| `2fe8194d` | feat(forums): add PollController with routes                            |
| `3096f109` | feat(forums): wire inline poll creation into create_thread              |
| `97c07cfe` | feat(forums): add ThreadAttachment controller and context               |

## Artifacts Created

| File                                                                             | Lines | Status   |
| -------------------------------------------------------------------------------- | ----- | -------- |
| `apps/backend/lib/cgraph/forums/bbcode.ex`                                       | 274   | new      |
| `apps/backend/test/cgraph/forums/bbcode_test.exs`                                | 226   | new      |
| `apps/backend/lib/cgraph/forums/thread.ex`                                       | 143   | modified |
| `apps/backend/lib/cgraph/forums/thread_post.ex`                                  | 123   | modified |
| `apps/backend/lib/cgraph_web/controllers/api/v1/poll_controller.ex`              | 150   | new      |
| `apps/backend/lib/cgraph_web/controllers/api/v1/poll_json.ex`                    | 47    | new      |
| `apps/backend/lib/cgraph/forums/threads.ex`                                      | 232   | modified |
| `apps/backend/lib/cgraph/forums/thread_attachments.ex`                           | 63    | new      |
| `apps/backend/lib/cgraph_web/controllers/api/v1/thread_attachment_controller.ex` | 75    | new      |
| `apps/backend/lib/cgraph_web/controllers/api/v1/thread_attachment_json.ex`       | 50    | new      |
| `apps/backend/lib/cgraph_web/router/forum_routes.ex`                             | 132   | modified |

## Notes

- All code compiles successfully (`mix compile` passes with only pre-existing warnings)
- BBCode parser uses regex-based approach with HTML escaping before tag processing for security
- Poll creation in `create_thread/3` rolls back on failure since it's inside the existing
  `Repo.transaction`
- ThreadAttachment deletion checks ownership (uploader_id match) before allowing delete
- No deviations from plan
