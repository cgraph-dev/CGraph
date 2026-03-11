# Plan 13-03 Summary: Persistent Voice Channels

## Result: ✅ COMPLETE

All 6 tasks executed successfully. Discord-style persistent voice channels are now implemented
across backend, web, and mobile.

## Tasks Completed

| #   | Task                          | Commit     | Files                                                                                                                |
| --- | ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Backend voice channel manager | `a5d4e423` | `apps/backend/lib/cgraph/webrtc/voice_channel_manager.ex`                                                            |
| 2   | Voice state Phoenix Channel   | `0564356b` | `apps/backend/lib/cgraph_web/channels/voice_state_channel.ex`, `apps/backend/lib/cgraph_web/channels/user_socket.ex` |
| 3   | Web voice state store + hook  | `a829d185` | `apps/web/src/stores/voiceStateStore.ts`, `apps/web/src/modules/calls/hooks/useVoiceChannel.ts`                      |
| 4   | Web voice channel list item   | `3461e417` | `apps/web/src/modules/groups/components/channel-list/voice-channel-item.tsx`                                         |
| 5   | Web voice channel panel       | `a1262f24` | `apps/web/src/modules/groups/components/voice-channel-panel.tsx`                                                     |
| 6   | Mobile voice channel screen   | `93ce6071` | `apps/mobile/src/stores/voiceStateStore.ts`, `apps/mobile/src/screens/groups/voice-channel-screen.tsx`               |

## Files Created (9)

### Backend (2)

- `apps/backend/lib/cgraph/webrtc/voice_channel_manager.ex` — VoiceChannelManager with
  Presence-backed state tracking, single-channel constraint, auto-cleanup on disconnect
- `apps/backend/lib/cgraph_web/channels/voice_state_channel.ex` — Phoenix Channel for `voice:*`
  topics with join/leave/mute/deafen/video events, cross-channel broadcasts to group

### Web (4)

- `apps/web/src/stores/voiceStateStore.ts` — Zustand store for voice channel state (currentChannel,
  members, mute/deafen/video)
- `apps/web/src/modules/calls/hooks/useVoiceChannel.ts` — Hook connecting Phoenix Channel ↔ LiveKit
  ↔ Zustand store
- `apps/web/src/modules/groups/components/channel-list/voice-channel-item.tsx` — Channel list item
  with live occupancy avatars and mute indicators
- `apps/web/src/modules/groups/components/voice-channel-panel.tsx` — Persistent bottom sidebar panel
  with participant list and controls

### Mobile (2)

- `apps/mobile/src/stores/voiceStateStore.ts` — Mirrors web voice state store with mobile
  socketManager patterns
- `apps/mobile/src/screens/groups/voice-channel-screen.tsx` — Full-screen participant grid with
  controls

## Files Modified (1)

- `apps/backend/lib/cgraph_web/channels/user_socket.ex` — Added `channel "voice:*"` route

## Architecture Decisions

1. **Presence-backed state**: Used Phoenix Presence for voice channel occupancy rather than a
   separate GenServer — automatic cleanup on disconnect, distributed across nodes
2. **Single-channel constraint**: VoiceChannelManager enforces one voice channel per user,
   auto-leaving previous on join
3. **Room naming**: `vc_{channel_id}` prefix distinguishes voice channel rooms from ad-hoc group
   call rooms (`group_*`)
4. **Cross-channel broadcasts**: VoiceStateChannel broadcasts `voice_member_update` to
   `group:{channelId}` so channel list items can show live occupancy without subscribing to every
   voice topic
5. **LiveKit room lifecycle**: Rooms created on first join, cleaned up 5s after last user leaves
   (spawn + sleep pattern)
6. **Mobile store mirrors web**: Both platforms use identical Zustand store shape for
   voiceStateStore, differing only in socket integration (web uses `useSocket()` hook, mobile uses
   `socketManager` singleton)

## Deviations

- **None**: All tasks executed as planned. Existing patterns (Presence tracking, LiveKit token
  generation, Zustand stores, Phoenix Channel conventions) were followed without modification.

## Requirements Covered

- **CALL-06**: Persistent voice channels — always-on voice lobbies with join/leave, live occupancy
  display, and persistent controls panel
