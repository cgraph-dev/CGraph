# WebRTC Architecture (v0.9.1)

## Scope

Signaling, media, TURN/STUN, call flows for 1:1 voice/video and small group calls.

## Signaling

- Phoenix Channels via `call:{room_id}` in `CGraphWeb.CallChannel`.
- Events: `signal:offer`, `signal:answer`, `signal:ice_candidate`, `participant:joined`,
  `participant:left`, `participant:media_updated`, `call:ended`.
- REST helpers: `POST /api/v1/calls` (create room), `POST /api/v1/calls/{room_id}/join`,
  `POST /api/v1/calls/{room_id}/leave`.

## Media Path

- P2P where possible; TURN relay fallback (config in `config/runtime.exs`).
- ICE servers from `CGraph.WebRTC` config; exposed on room join.
- Screen sharing supported via media track toggles.

## Limits

- Max participants: 10 (configurable `max_participants`).
- Call timeout: 60s default (`call_timeout_ms`).

## Security

- Auth: HTTP-only cookie session for REST; token param for socket.
- SRTP enforced by WebRTC; TURN credentials short-lived.
- No media recording server-side; clients may record—document consent requirements.

## Incomplete / TODO

- Voice channels (persistent ) marked planned.
- QoS/bitrate adaptation docs missing; add thresholds.
- No E2EE SRTP insertable streams yet—future work.
