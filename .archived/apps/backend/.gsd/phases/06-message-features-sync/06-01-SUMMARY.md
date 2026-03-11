---
phase: 06-message-features-sync
plan: '01'
execution_date: '2026-02-28'
duration: ~12min
status: complete
---

# Plan 06-01 Summary — Wire MessageEdit Record & EditHistory Type

## Objective Achieved

MessageEdit record creation is now wired into the `edit_message` flow. Every edit inserts a history
row with the previous content, sequential edit number, and editor ID. The `EditHistory` shared type
is exported for web and mobile consumption in Wave 2.

## Tasks Completed

| #   | Task                                                    | Commit     |
| --- | ------------------------------------------------------- | ---------- |
| 1   | Wire MessageEdit record creation into edit_message flow | `ef8bd42c` |
| 2   | Add EditHistory interface to shared-types               | `e2fb91b5` |
| 3   | Add edit history backend tests                          | `c16be9d0` |

## Files Modified

- `apps/backend/lib/cgraph/messaging/message_operations.ex` — Rewrote `edit_message/3` to use
  `Ecto.Multi` transaction: counts existing edits, inserts `MessageEdit` with previous content, then
  applies update. Returns message with edits preloaded.
- `apps/backend/lib/cgraph_web/channels/conversation_channel.ex` — Added `:edits` to preload list in
  `edit_message` handler so broadcasts include edit history.
- `packages/shared-types/src/models.ts` — Added `EditHistory` interface and `edits?: EditHistory[]`
  field to `Message`.
- `apps/backend/test/cgraph/messaging/message_operations_test.exs` — New test file with 6 tests
  covering edit history creation, sequential numbering, is_edited flag, edits preloading,
  authorization, and not-found cases.

## Deviations

None. Plan executed as specified.

## Verification Results

- **Backend tests**: 6 tests, 0 failures
  (`mix test test/cgraph/messaging/message_operations_test.exs --trace`)
- **Shared-types type check**: Clean (`pnpm tsc --noEmit` — no errors)
- **Backend compilation**: Clean (no new warnings introduced)

## Key Decisions

- Used `Multi.run/3` (dynamic steps) rather than `Multi.insert/3` to compute `edit_number` from the
  count query result within the same transaction.
- Preloaded edits with `force: true` after the Multi transaction to ensure the returned message
  includes the just-inserted edit record.
- Added `:edits` to channel broadcast preload so clients receive edit history in real-time
  `message_updated` events.
