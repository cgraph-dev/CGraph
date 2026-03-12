# CGraph API Contracts
> Single source of truth. Backend MUST update after every endpoint change.
> Frontend MUST read before implementing any API call.

## Base URLs
- Dev: http://localhost:4000/api/v1
- Prod: https://api.cgraph.app/api/v1
- WebSocket Dev: ws://localhost:4000/socket
- WebSocket Prod: wss://api.cgraph.app/socket

## Auth
All authenticated requests: `Authorization: Bearer <jwt>`
Web clients: httpOnly cookie auto-translated by CookieAuth plug

## WebSocket Channels
| Topic Pattern    | Purpose                    |
|-----------------|----------------------------|
| conversation:*  | DM/group chat, typing      |
| group:*         | Group events, members      |
| user:*          | Notifications, presence    |
| presence:*      | User presence tracking     |
| ai:*            | Streaming AI responses     |
| document:*      | Yjs CRDT sync              |
| forum:*         | Forum real-time updates    |
| call:*          | WebRTC signaling           |
| voice:*         | Voice state updates        |
| webrtc:lobby    | WebRTC lobby signaling     |

## Shared Types
All types in packages/shared-types/src/ — NEVER redefine them in apps.

## Endpoints
### Auth
- POST /auth/register    → {user, access_token, refresh_token}
- POST /auth/login       → {user, access_token, refresh_token}
- POST /auth/refresh     → {access_token}
- POST /auth/logout      → {ok: true}
- POST /auth/oauth/:provider → {user, access_token, refresh_token}

## Changelog
| Date       | Change                        |
|------------|-------------------------------|
| 2026-03-03 | Initial contract file created |
