# Summary 13-01: Mobile WebRTC Wiring + Call History API

## Result: **COMPLETE** ✅

All 5 tasks executed successfully. Mobile call screens now use real `react-native-webrtc` peer connections instead of simulated `setTimeout()` state. Backend exposes REST endpoints for call history. Mobile call history screen fetches from real API with cursor pagination.

## Tasks Completed

### Task 1 — Install react-native-webrtc and create call service + store
- **Commit:** `2d08b64d`
- **Files created:** `apps/mobile/src/services/callService.ts`, `apps/mobile/src/stores/callStore.ts`
- **Files modified:** `apps/mobile/package.json`
- Added `react-native-webrtc@^124.0.4` dependency
- Created `callService.ts` API client: `getCallHistory()`, `getCall()`
- Created `callStore.ts` Zustand store: activeCall, callHistory, incomingCall, startCall, answerCall, endCall, fetchCallHistory

### Task 2 — Wire mobile WebRTC service to real peer connections
- **Commit:** `e798d6df`
- **Files modified:** `apps/mobile/src/lib/webrtc/webrtcService.ts`
- Replaced `declare` stubs with real `import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices } from 'react-native-webrtc'`
- Replaced `navigator.mediaDevices.getUserMedia` with imported `mediaDevices.getUserMedia`
- Added `restartIce()` for WiFi→cellular network transitions
- Added `switchCamera()` via `videoTrack._switchCamera()` API
- Added `startScreenShare()` / `stopScreenShare()` via `getDisplayMedia`

### Task 3 — Replace simulated call state in mobile screens
- **Commit:** `786bdfa8`
- **Files modified:** `apps/mobile/src/screens/calls/call-screen.tsx`, `apps/mobile/src/screens/calls/voice-call-screen.tsx`, `apps/mobile/src/screens/calls/video-call-screen/use-video-call.ts`
- `call-screen.tsx`: removed `setTimeout` simulation, connects to Phoenix Channel on mount, real `onCallConnected`/`onCallEnded` events, mute/video toggle via `WebRTCManager`
- `voice-call-screen.tsx`: removed `simulateConnection()`, wired real peer connection events, mute via `manager.toggleMute()`
- `use-video-call.ts`: replaced `setTimeout → setCallState('connected')` with real RTCPeerConnection state, camera flip via `manager.switchCamera()`

### Task 4 — Backend call history REST controller
- **Commit:** `af617d62`
- **Files created:** `apps/backend/lib/cgraph_web/controllers/api/v1/call_controller.ex`
- **Files modified:** `apps/backend/lib/cgraph_web/router/messaging_routes.ex`
- `CallController` with `index/2` (cursor-paginated) and `show/2`
- Routes: `GET /api/v1/calls` and `GET /api/v1/calls/:id`
- Returns `{data: [...], meta: {cursor, has_more}}` format
- Delegates to existing `Calls.list_call_history/2` and `Calls.get_call/1`
- Backend compiles cleanly

### Task 5 — Wire mobile call history to real API
- **Commit:** `ee134756`
- **Files modified:** `apps/mobile/src/screens/calls/call-history-screen.tsx`
- Removed `MOCK_CALLS` constant entirely
- Uses `callStore.fetchCallHistory()` on mount and pull-to-refresh
- Maps `CallHistoryRecord` → UI `CallRecord` format (direction inference from creator_id)
- Infinite scroll with `onEndReached` + cursor pagination
- Call Back button triggers `callStore.startCall()` → then navigates to call screen
- Empty state preserved when no history

## Deviations

None. All tasks executed as planned.

## Artifacts Produced

| Artifact | Path | Lines |
|----------|------|-------|
| Call service API client | `apps/mobile/src/services/callService.ts` | 75 |
| Call Zustand store | `apps/mobile/src/stores/callStore.ts` | 206 |
| WebRTC service (rewritten) | `apps/mobile/src/lib/webrtc/webrtcService.ts` | ~635 |
| Backend call controller | `apps/backend/lib/cgraph_web/controllers/api/v1/call_controller.ex` | 110 |
| Call screen (wired) | `apps/mobile/src/screens/calls/call-screen.tsx` | ~655 |
| Voice call screen (wired) | `apps/mobile/src/screens/calls/voice-call-screen.tsx` | ~625 |
| Video call hook (wired) | `apps/mobile/src/screens/calls/video-call-screen/use-video-call.ts` | ~175 |
| Call history screen (wired) | `apps/mobile/src/screens/calls/call-history-screen.tsx` | ~565 |

## Requirements Addressed

- **CALL-01**: Mobile WebRTC P2P calls via real `RTCPeerConnection` + Phoenix Channel signaling
- **CALL-02**: Mobile voice call screen plays remote audio through real `ontrack` handler
- **CALL-05** (mobile): Call history screen fetches from `GET /api/v1/calls/history`, callback button initiates real calls
- **CALL-07**: Backend REST controller for call history with cursor pagination
