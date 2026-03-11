# Summary 09-03: Notification Wiring Audit & Gap Fixes

## Result: ✅ Complete

## Audit Findings

### Already Wired Correctly (No Changes Needed)

- **Delivery pipeline** — `delivery.ex` correctly calls `Preferences.should_deliver?()` (from 09-01)
  then `Settings.should_notify?()` (covers DND + quiet hours from 09-02)
- **Web push chain** — Service worker handles push events, shows notifications, navigates to correct
  conversation on click
- **Notification center** — Web and mobile stores fetch/display notifications; real-time via user
  channel "notification" event
- **Web data export UI** — `data-export.tsx` exists and integrated into settings
- **Mobile data export UI** — `account-screen.tsx` has "Download My Data" with API call

### Gaps Found and Fixed

| Gap                                             | Fix                                                                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offline users not receiving push on new message | Added `notify_offline_participants/3` in `conversation_channel.ex` — checks `Presence.list()` for disconnected users, routes through full delivery pipeline |
| Email digest sent to active users               | Added `last_seen_at < 3 days ago` filter to `email_digest_worker.ex`                                                                                        |
| Digest email missing unsubscribe header         | Extended `add_unsubscribe_header` guard to include `:digest` type in `builder.ex`                                                                           |
| Shared notification types incomplete            | Added `Notification`, `PushPayload`, `NotificationStats` to `packages/shared-types/src/notifications.ts`                                                    |

## Files Changed

- **Modified:** 4 files (conversation_channel.ex, email_digest_worker.ex, mailer/builder.ex,
  shared-types/notifications.ts)

## Deviations

- Did not refactor web/mobile notification stores to import from shared-types (different local type
  shapes — would be a breaking change)

## Commit

`bd3f7120` — `feat(09-03): notification wiring audit and gap fixes`
