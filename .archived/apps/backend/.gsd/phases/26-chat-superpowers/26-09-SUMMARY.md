---
phase: 26-chat-superpowers
plan: '09'
status: complete
duration: ~45min
affects:
  - messaging
  - scheduling
  - polls
  - themes
  - translation
subsystem: messaging
requires:
  - '26-07'
tech-stack:
  added:
    - oban-scheduled-jobs
    - pluggable-adapter-pattern
  used:
    - ecto
    - phoenix
    - oban
    - pubsub
key_files:
  - lib/cgraph/messaging/scheduled_message.ex
  - lib/cgraph/messaging/chat_poll.ex
  - lib/cgraph/messaging/chat_poll_vote.ex
  - lib/cgraph/messaging/chat_theme.ex
  - lib/cgraph/messaging/message_translation.ex
  - lib/cgraph/workers/send_scheduled_message.ex
  - lib/cgraph_web/controllers/api/v1/chat_poll_controller.ex
  - lib/cgraph_web/controllers/api/v1/chat_theme_controller.ex
decisions:
  - 'Used chat_polls/chat_poll_votes table names to avoid conflict with forum polls/poll_votes'
  - 'ChatPollController named separately from existing PollController (forum)'
  - 'Translation uses adapter pattern with NoOp default; LibreTranslate stub ready'
  - 'Oban inline test mode means tests for cancel/list_pending bypass Oban by inserting directly'
---

## Summary

Added four competitive-edge features to the messaging subsystem:

### Scheduled Messages

- `ScheduledMessage` schema with `schedule_message/5`, `cancel/2`, `list_pending/2`
- Oban-backed `SendScheduledMessage` worker: fetches pending, sends via `Messaging.create_message`,
  broadcasts to channel, marks "sent"
- Validates: future time (30s–7d), conversation membership
- Existing `ScheduledMessages` + `ScheduledMessageController` from Phase 18 still intact (works via
  Message schema fields); new module uses standalone `scheduled_messages` table

### In-Chat Polls

- `ChatPoll` schema on `chat_polls` table (NOT `polls` which is forum-scoped)
- `ChatPollVote` schema on `chat_poll_votes` table
- `create_poll/5`: 2–10 options, single/multi choice, anonymous, optional auto-close
- `vote/3`: single-choice replaces, multi-choice adds; broadcasts `poll_vote_updated`
- `retract_vote/3`, `close_poll/2` (creator only), `get_poll_results/1`
- `ChatPollController` with create, show, vote, retract_vote, close

### Chat Themes

- `ChatTheme` schema on `chat_themes` table, upsert per user+conversation
- 10 presets: midnight, ocean, forest, sunset, lavender, minimal, dark, light, neon, pastel
- `set_theme/3`, `get_theme/2`, `delete_theme/2`, `list_preset_themes/0`
- `ChatThemeController` with update, show, delete, presets

### Message Translation

- `MessageTranslation` with pluggable adapter pattern (`@adapter` at compile time)
- `NoOp` adapter (passthrough), `LibreTranslate` stub adapter
- 20 supported languages, `translate/2` API
- `MessageController.translate/2` endpoint at `POST /messages/:id/translate`

### Routes Added to `messaging_routes.ex`

- `POST /conversations/:id/polls` — create poll
- `GET/POST/DELETE /chat-polls/:id/...` — show, vote, retract, close
- `PUT/GET/DELETE /conversations/:id/theme` — theme CRUD
- `GET /themes/presets` — built-in themes
- `POST /messages/:id/translate` — translation

### Tests

- 7 scheduled message tests (create, reject past/far-future/non-member, cancel, cancel unauthorized,
  list pending)
- 13 poll tests (create valid/too-few/too-many/non-member, vote, single-replace, multi-add, closed
  poll, invalid option, retract, close creator/non-creator/already-closed)
- **20 total, all passing**
