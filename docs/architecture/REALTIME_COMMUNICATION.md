# CGraph Real-Time Communication

**Status: v0.9.1 (January 2026)**

Complete documentation for CGraph's real-time communication stack, including messaging, presence
(sampled at scale), WebRTC voice/video, and HTTP-only cookie-authenticated sockets.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     REAL-TIME COMMUNICATION STACK                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       CLIENT LAYER                                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │ Messages│  │ Presence│  │ Typing  │  │  Calls  │  │  Media  │   │   │
│  │  │   UI    │  │   UI    │  │Indicator│  │   UI    │  │ Player  │   │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │   │
│  │       │            │            │            │            │         │   │
│  │       └────────────┴────────────┴─────┬──────┴────────────┘         │   │
│  │                                       │                              │   │
│  │                              ┌────────▼────────┐                    │   │
│  │                              │ Phoenix Socket  │                    │   │
│  │                              │   (WebSocket)   │                    │   │
│  │                              └────────┬────────┘                    │   │
│  └───────────────────────────────────────┼──────────────────────────────┘   │
│                                          │                                   │
│  ┌───────────────────────────────────────┼──────────────────────────────┐   │
│  │                       SERVER LAYER    │                               │   │
│  │                              ┌────────▼────────┐                     │   │
│  │                              │   UserSocket    │                     │   │
│  │                              └────────┬────────┘                     │   │
│  │       ┌───────────┬───────────┬───────┴───────┬───────────┐         │   │
│  │       ▼           ▼           ▼               ▼           ▼         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   ┌─────────┐ ┌─────────┐     │   │
│  │  │Convers- │ │ Group   │ │Presence │   │  Call   │ │  User   │     │   │
│  │  │ation    │ │ Channel │ │ Channel │   │ Channel │ │ Channel │     │   │
│  │  │ Channel │ │         │ │         │   │(WebRTC) │ │         │     │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘   └────┬────┘ └────┬────┘     │   │
│  │       │           │           │              │           │          │   │
│  │       └───────────┴───────────┴───────┬──────┴───────────┘          │   │
│  │                                       │                              │   │
│  │                              ┌────────▼────────┐                    │   │
│  │                              │  Phoenix PubSub │                    │   │
│  │                              │  (Redis-backed) │                    │   │
│  │                              └─────────────────┘                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Matrix

| Feature               | Status | Module                    | Notes                   |
| --------------------- | ------ | ------------------------- | ----------------------- |
| **Messaging**         |
| Real-time messages    | ✅     | `ConversationChannel`     | Phoenix Channels        |
| Typing indicators     | ✅     | `ConversationChannel`     | Auto-timeout 5s         |
| Read receipts         | ✅     | `MessageController`       | Opt-in per conversation |
| E2EE (1:1 DMs)        | ✅     | `Cgraph.Crypto.E2EE`      | PQXDH + AES-256-GCM     |
| Voice messages        | ✅     | `Storage`                 | AAC, 5min max           |
| **Presence**          |
| Online status         | ✅     | `Cgraph.Presence`         | Phoenix Presence (CRDT) |
| Sampled presence      | ✅     | `Cgraph.Presence.Sampled` | For channels >100 users |
| Multi-device          | ✅     | `Cgraph.Presence`         | Aggregated status       |
| Custom status         | ✅     | `Cgraph.Presence`         | Text + emoji            |
| **Voice/Video Calls** |
| 1:1 voice calls       | ✅     | `Cgraph.WebRTC`           | WebRTC peer-to-peer     |
| 1:1 video calls       | ✅     | `Cgraph.WebRTC`           | WebRTC peer-to-peer     |
| Group calls           | ✅     | `Cgraph.WebRTC`           | Up to 10 participants   |
| Screen sharing        | ✅     | `CallChannel`             | Via media tracks        |
| Voice channels        | 🔄     | Planned                   | persistent rooms        |

---

## Voice/Video Calling

### Implementation

WebRTC calling uses Phoenix Channels for signaling with peer-to-peer media transport.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WEBRTC CALL FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Alice (Caller)                 Server                    Bob (Callee)      │
│       │                            │                            │           │
│       │ 1. WebRTC.create_room()    │                            │           │
│       │───────────────────────────▶│                            │           │
│       │                            │                            │           │
│       │◀── room_id, ice_servers ───│                            │           │
│       │                            │                            │           │
│       │ 2. WebRTC.ring(bob_id)     │                            │           │
│       │───────────────────────────▶│                            │           │
│       │                            │ 3. {:incoming_call, ...}   │           │
│       │                            │───────────────────────────▶│           │
│       │                            │                            │           │
│       │                            │ 4. join "call:room_id"     │           │
│       │                            │◀───────────────────────────│           │
│       │                            │                            │           │
│       │ 5. Join call:room_id       │                            │           │
│       │───────────────────────────▶│                            │           │
│       │                            │                            │           │
│       │◀────────── Signaling: SDP offer/answer, ICE ───────────▶│           │
│       │                            │                            │           │
│       │◀══════════════════ P2P Media Stream ═══════════════════▶│           │
│       │                            │                            │           │
│       │ 6. call:leave              │                            │           │
│       │───────────────────────────▶│ {:participant_left}        │           │
│       │                            │───────────────────────────▶│           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Modules

| Module                      | Purpose                                               |
| --------------------------- | ----------------------------------------------------- |
| `Cgraph.WebRTC`             | Room management, ICE server config, signaling helpers |
| `Cgraph.WebRTC.Room`        | Room state (participants, type, duration)             |
| `Cgraph.WebRTC.Participant` | Participant state (media, device, connection)         |
| `CgraphWeb.CallChannel`     | Phoenix Channel for WebSocket signaling               |

### Channel Events

**Client → Server:**

| Event                  | Payload            | Description                   |
| ---------------------- | ------------------ | ----------------------------- |
| `signal:offer`         | `{to, sdp}`        | Send SDP offer to peer        |
| `signal:answer`        | `{to, sdp}`        | Send SDP answer to peer       |
| `signal:ice_candidate` | `{candidate, to?}` | Send ICE candidate            |
| `media:update`         | `{media}`          | Update audio/video/mute state |
| `media:mute`           | -                  | Mute microphone               |
| `media:unmute`         | -                  | Unmute microphone             |
| `media:video_on`       | -                  | Enable camera                 |
| `media:video_off`      | -                  | Disable camera                |
| `media:screen_share`   | `{enabled}`        | Toggle screen sharing         |
| `call:leave`           | -                  | Leave the call                |
| `call:end`             | -                  | End call for all participants |
| `call:ring`            | `{user_ids}`       | Ring specified users          |

**Server → Client:**

| Event                       | Payload                           | Description            |
| --------------------------- | --------------------------------- | ---------------------- |
| `signal:offer`              | `{from, sdp}`                     | Received SDP offer     |
| `signal:answer`             | `{from, sdp}`                     | Received SDP answer    |
| `signal:ice_candidate`      | `{from, candidate}`               | Received ICE candidate |
| `participant:joined`        | `{participant_id, device, media}` | Peer joined            |
| `participant:left`          | `{participant_id}`                | Peer left              |
| `participant:media_updated` | `{participant_id, media}`         | Peer changed media     |
| `call:ended`                | -                                 | Call has ended         |
| `call:error`                | `{reason}`                        | Error occurred         |

### ICE Server Configuration

```elixir
# config/runtime.exs

config :cgraph, Cgraph.WebRTC,
  stun_servers: [
    "stun:stun.l.google.com:19302",
    "stun:stun1.l.google.com:19302"
  ],
  turn_servers: [
    %{
      urls: "turn:turn.cgraph.org:3478",
      username: System.get_env("TURN_USERNAME"),
      credential: System.get_env("TURN_PASSWORD")
    }
  ],
  max_participants: 10,
  call_timeout_ms: 60_000
```

### Client Integration (TypeScript)

```typescript
// Connect to call channel
const socket = new Socket('/socket', { params: { token } });
socket.connect();

const channel = socket.channel(`call:${roomId}`, {
  device: 'web',
  media: { audio: true, video: true },
});

channel.join().receive('ok', (resp) => {
  const { room, ice_servers } = resp;
  initializePeerConnection(ice_servers);
});

// Handle incoming offer
channel.on('signal:offer', async ({ from, sdp }) => {
  const pc = getPeerConnection(from);
  await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  channel.push('signal:answer', { to: from, sdp: answer.sdp });
});

// Send ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    channel.push('signal:ice_candidate', { candidate: event.candidate });
  }
};
```

---

## Voice Messages

Asynchronous audio messaging with full encryption support:

| Feature      | Implementation                         |
| ------------ | -------------------------------------- |
| Recording    | Native iOS/Android + Web MediaRecorder |
| Format       | AAC/M4A (efficient compression)        |
| Max duration | 5 minutes                              |
| Max size     | 25 MB                                  |
| Storage      | Cloudflare R2 with signed URLs         |
| Encryption   | E2EE in DMs (AES-256-GCM)              |
| Waveform     | Generated client-side                  |

---

## Presence System

### Standard Presence

For small to medium channels (<100 users), full presence tracking via Phoenix Presence (CRDT):

```elixir
# Track user presence
Presence.track_user(socket, user_id, room_id, %{
  status: "online",
  device: "web"
})

# Update typing status
Presence.update_typing(socket, user_id, room_id, true)

# List online users
users = Presence.list_room_users(room_id)
```

### Sampled Presence (Large Channels)

For channels with 100+ users, sampled presence uses HyperLogLog to reduce memory and CPU:

| Channel Size | Sample Rate | Broadcast Interval | Memory |
| ------------ | ----------- | ------------------ | ------ |
| <100         | 100%        | Immediate          | ~10KB  |
| 100-1K       | 50%         | 1s batch           | ~5KB   |
| 1K-10K       | 10%         | 5s batch           | ~1KB   |
| 10K-100K     | 1%          | 10s batch          | ~12KB  |
| >100K        | 0.1%        | 30s summary        | ~12KB  |

```elixir
# Get approximate user count in O(1) time
{:ok, count} = Presence.Sampled.approximate_count(channel_id)
# => {:ok, 45_123}

# Get presence summary
summary = Presence.Sampled.get_summary(channel_id)
# => %{total: 1_234_567, online: 45_123, typing: 23, approximate: true}
```

---

## Performance Benchmarks

| Operation                 | Target | Actual (p99) |
| ------------------------- | ------ | ------------ |
| Message delivery          | <200ms | ~100ms       |
| Presence update broadcast | <50ms  | ~20ms        |
| Call connection time      | <3s    | ~1.5s        |
| ICE candidate exchange    | <500ms | ~200ms       |
| Typing indicator latency  | <100ms | ~30ms        |

---

## Configuration

### Environment Variables

```bash
# WebRTC
TURN_USERNAME=cgraph
TURN_PASSWORD=secure_password
TURN_SERVER_URL=turn:turn.cgraph.org:3478

# Redis (for distributed presence/rate limiting)
REDIS_URL=redis://localhost:6379

# Meilisearch (for message search)
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_API_KEY=your_master_key
```

### Supervision Tree

Services are started in `application.ex`:

```elixir
children = [
  # ...
  CGraph.Presence,           # Standard Phoenix Presence
  CGraph.WebRTC,             # WebRTC room management
  CGraph.Presence.Sampled,   # Large channel presence
  # ...
]
```

---

## Roadmap

| Feature               | Version | Status      |
| --------------------- | ------- | ----------- |
| Voice messages        | v0.7.0  | ✅ Complete |
| Text real-time        | v0.7.0  | ✅ Complete |
| 1:1 Voice/Video calls | v0.7.32 | ✅ Complete |
| Group calls (≤10)     | v0.7.32 | ✅ Complete |
| Screen sharing        | v0.7.32 | ✅ Complete |
| Sampled presence      | v0.7.32 | ✅ Complete |
| SFU for large calls   | v0.8.0  | 🔄 Planned  |
| Voice channels        | v0.9.0  | 🔄 Planned  |
| Spatial audio         | v1.0.0  | 🔄 Planned  |

---

_Last Updated: January 9, 2026_
