# Plan 13-02 Summary: LiveKit SFU Integration — Group Calls

**Status:** ✅ Complete
**Date:** 2026-03-01
**Duration:** Single session

## Objective

Integrate LiveKit SFU for group voice/video calls with 3+ participants, while preserving P2P mesh for 1:1 calls.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Backend LiveKit SDK integration + config | `32cdd743` | `livekit_token.ex`, `runtime.exs` |
| 2 | Backend LiveKit room management module | `991898c5` | `livekit.ex` |
| 3 | Backend LiveKit token controller + route | `7d1df38e` | `livekit_controller.ex`, `messaging_routes.ex` |
| 4 | Hybrid P2P/SFU routing in webrtc.ex | `d4cfae45` | `webrtc.ex`, `room.ex` |
| 5 | Web LiveKit client integration | `beb7efe3` | `package.json`, `livekitService.ts` |
| 6 | Web LiveKit React hooks + group call UI | `647e9836` | `useLiveKitRoom.ts`, `group-call-view.tsx`, `livekit-participant-tile.tsx`, barrel exports |
| 7 | Docker Compose for local LiveKit dev server | `7d95ad1b` | `docker-compose.livekit.yml` |

## Files Created

- `apps/backend/lib/cgraph/webrtc/livekit_token.ex` — JWT token generation using JOSE
- `apps/backend/lib/cgraph/webrtc/livekit.ex` — Room management via Twirp API
- `apps/backend/lib/cgraph_web/controllers/api/v1/livekit_controller.ex` — Token endpoint
- `apps/web/src/lib/webrtc/livekitService.ts` — Client-side LiveKit service singleton
- `apps/web/src/modules/calls/hooks/useLiveKitRoom.ts` — React hook for LiveKit rooms
- `apps/web/src/modules/calls/components/group-call-view.tsx` — Multi-participant grid UI
- `apps/web/src/modules/calls/components/livekit-participant-tile.tsx` — Single participant tile
- `infrastructure/docker-compose.livekit.yml` — Local dev LiveKit server

## Files Modified

- `apps/backend/config/runtime.exs` — Added LiveKit config section
- `apps/backend/lib/cgraph_web/router/messaging_routes.ex` — Added LiveKit token route
- `apps/backend/lib/cgraph/webrtc/webrtc.ex` — Hybrid P2P/SFU routing + auto-escalation
- `apps/backend/lib/cgraph/webrtc/room.ex` — Added `:mode` field (:p2p | :sfu)
- `apps/web/package.json` — Added `livekit-client` dependency
- `apps/web/src/modules/calls/hooks/index.ts` — Export useLiveKitRoom
- `apps/web/src/modules/calls/components/index.ts` — Export GroupCallView, LiveKitParticipantTile

## Architecture Decisions

1. **JOSE for JWT** — No external LiveKit SDK dependency needed; JOSE was already in mix.exs. LiveKit tokens are standard JWTs with video grant claims signed with HMAC-SHA256.

2. **:httpc for Twirp API** — Used Erlang's built-in HTTP client for LiveKit server API calls instead of adding a dependency. LiveKit's Twirp protocol supports JSON encoding.

3. **Auto-escalation** — When a P2P room gets a 3rd participant, it automatically creates a LiveKit room and broadcasts a `mode_changed` event. Clients re-connect via LiveKit.

4. **Room naming convention** — `group_{group_id}_channel_{channel_id}` for deterministic mapping from channel to LiveKit room.

5. **Docker Compose placement** — File placed at `infrastructure/docker-compose.livekit.yml` alongside `docker-compose.observability.yml` (same pattern) rather than the root-owned `docker/` subdirectory.

## Deviations

1. **Docker Compose file location**: Plan specified `infrastructure/docker/docker-compose.livekit.yml` but that directory is root-owned. Placed at `infrastructure/docker-compose.livekit.yml` to match existing pattern (`docker-compose.observability.yml`).

2. **No external livekit_server_sdk Elixir dep**: Used JOSE (already available) for JWT generation and :httpc for Twirp API calls instead of adding a dedicated LiveKit Elixir package. This reduces dependency surface.

3. **Group membership check**: LiveKit controller calls `CGraph.Groups.get_member/2` for authorization when `channel_id` + `group_id` are provided, rather than a channel-specific check.

## Requirements Addressed

- **CALL-03**: Group voice calls via SFU
- **CALL-04**: Group video calls via SFU
- **CALL-05**: Screen sharing in group calls (LiveKit native support)
