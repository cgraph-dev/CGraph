---
phase: 26-chat-superpowers
plan: 05
subsystem: webrtc
tags: [calls, quality, missed-calls, push-notifications, signaling]

requires:
  - phase: 26-01
    provides: 'Secret chat system (for secret call support)'
provides:
  - 'Call lifecycle state machine (ringing → active → ended)'
  - 'CallQuality module (ETS-backed metrics, summary on end)'
  - 'Missed call tracking with count and mark-seen'
  - 'Push notifications for incoming calls via Notifications'
  - 'CallChannel enhancements: quality_report, connection_state, screen_share'
  - 'New CallController endpoints: missed-count, missed-seen, ice-servers'
affects: [26-07-chat-completeness]

tech-stack:
  added: []
  patterns:
    - 'ETS for real-time metrics, flushed to DB on call end'
    - 'Quality score: weighted (loss 50%, jitter 25%, RTT 25%)'
    - 'Ring timeout: 30s, connection timeout: 10s, max duration: 4h'
    - 'ICE connection state tracking with restart signaling'

key-files:
  created:
    - lib/cgraph/webrtc/call_quality.ex
    - priv/repo/migrations/20260306210000_enhance_call_history.exs
    - test/cgraph/webrtc/calls_test.exs
    - test/cgraph_web/channels/call_channel_test.exs
  modified:
    - lib/cgraph/webrtc/calls.ex
    - lib/cgraph/webrtc/call_history.ex
    - lib/cgraph_web/channels/call_channel.ex
    - lib/cgraph_web/channels/webrtc_lobby_channel.ex
    - lib/cgraph_web/controllers/api/v1/call_controller.ex
    - lib/cgraph_web/router/messaging_routes.ex
    - test/support/factory.ex

key-decisions:
  - 'Quality summary uses string keys for JSON/PostgreSQL consistency'
  - 'Specific call routes (missed-count, ice-servers) before resources :id'
  - 'Channel tests use DataCase (not ChannelCase) — WebRTC GenServer not available in test'
  - 'Push notifications via Notifications.notify with :incoming_call type'

patterns-established:
  - 'ETS-backed real-time metrics flushed to persistent storage on lifecycle end'
  - 'Missed count pattern: end_reason + missed_seen boolean index'
---

## Summary

Plan 26-05 hardens the voice/video calling system with full lifecycle management.

### What was built

1. **CallQuality module** (`lib/cgraph/webrtc/call_quality.ex`):
   - ETS-backed metric collection during active calls
   - `report_metrics/3`: stores jitter, packet_loss, bitrate, RTT, codec, resolution
   - `build_summary/1`: aggregates all metrics into quality summary
   - `flush/1`: builds summary and cleans up ETS entries
   - Quality score: weighted composite (0-100)

2. **Calls module enhancements** (`lib/cgraph/webrtc/calls.ex`):
   - Full state machine: `initiate_call/3`, `accept_call/2`, `reject_call/3`, `end_call/2`
   - Ring timeout (30s), connection timeout (10s), max duration (4h)
   - `get_missed_call_count/1` and `mark_missed_calls_seen/1`
   - Quality summary automatically flushed on call end

3. **CallChannel enhancements**:
   - `quality_report` handler: stores metrics via CallQuality
   - `connection_state` handler: tracks ICE states, broadcasts restart/reconnecting
   - `screen_share_start/stop` handlers with broadcasts

4. **WebRTCLobbyChannel**: Push notifications via `Notifications.notify` for incoming calls

5. **CallController new endpoints**:
   - GET /api/v1/calls/missed-count
   - POST /api/v1/calls/missed-seen
   - GET /api/v1/calls/ice-servers

6. **Migration**: Added quality_summary, end_reason, missed_seen, conversation_id to call_history

### Test results

- **24 tests, 0 failures** (18 lifecycle + 6 channel integration)
