# CGraph Real-Time Communication Roadmap

**Status: v0.7.26 (January 2026)**

This document defines the scope of real-time communication features in CGraph, distinguishing between what's currently implemented vs. planned.

---

## Current Implementation (v0.7.x)

### ✅ Voice Messages
Fully implemented asynchronous audio messaging:

| Feature | Status | Notes |
|---------|--------|-------|
| Recording | ✅ Complete | Native recording on iOS/Android |
| Waveform visualization | ✅ Complete | Real-time during recording and playback |
| Playback | ✅ Complete | In-app audio player with seek |
| Compression | ✅ Complete | AAC encoding for efficient transfer |
| Storage | ✅ Complete | Cloudflare R2 with signed URLs |
| Encryption | ✅ Complete | E2EE in DMs |

**Limitations:**
- Maximum duration: 5 minutes
- File size limit: 25 MB
- No live streaming (async only)

### ✅ Text-Based Real-Time
| Feature | Status |
|---------|--------|
| WebSocket channels | ✅ Phoenix Channels |
| Presence tracking | ✅ Phoenix Presence (CRDT) |
| Typing indicators | ✅ Real-time broadcast |
| Read receipts | ✅ Opt-in per conversation |
| Push notifications | ✅ Expo Push / APNs / FCM |

---

## NOT Implemented (Roadmap)

### ❌ Live Voice Calls (v0.9.0 Target)

**Why not in v0.7?**
Live voice/video requires:
- WebRTC peer-to-peer connections
- TURN/STUN server infrastructure
- Selective Forwarding Unit (SFU) for group calls
- Significant mobile battery/performance optimization
- Additional security audit for real-time media

**Planned Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                     VOICE/VIDEO ARCHITECTURE (PLANNED)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Client A                                        Client B       │
│   ┌───────┐                                      ┌───────┐      │
│   │ WebRTC│◄─────── DTLS-SRTP Encrypted ────────►│ WebRTC│      │
│   └───┬───┘                                      └───┬───┘      │
│       │                                              │          │
│       │    ICE Candidates via Phoenix Channels       │          │
│       └──────────────────┬───────────────────────────┘          │
│                          │                                       │
│                   ┌──────▼──────┐                               │
│                   │   Signaling  │ ← Phoenix Channels           │
│                   │    Server    │                               │
│                   └──────────────┘                               │
│                                                                  │
│   For Group Calls (3+ participants):                            │
│                                                                  │
│                   ┌──────────────┐                               │
│                   │     SFU      │ ← Janus/mediasoup/Jitsi      │
│                   │  (Planned)   │                               │
│                   └──────────────┘                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Dependencies:**
- [ ] WebRTC stack integration (React Native WebRTC / web)
- [ ] TURN/STUN server deployment
- [ ] SFU selection (Janus, mediasoup, or Jitsi)
- [ ] End-to-end encryption for real-time media (Oranek or similar)
- [ ] Call history and CDR (Call Detail Records)

### ❌ Video Calls (v0.10.0 Target)

All voice call dependencies, plus:
- [ ] Camera permission handling
- [ ] Video encoding optimization (H.264/VP8)
- [ ] Screen sharing
- [ ] Virtual backgrounds (nice-to-have)

### ❌ Voice Channels (Discord-style) (v1.0.0 Target)

Persistent audio rooms in Groups:
- [ ] Spatial audio (nice-to-have)
- [ ] Push-to-talk option
- [ ] Channel moderation (mute, deafen, kick)
- [ ] Stage channels (speakers/listeners)

---

## Why This Approach?

### 1. Ship Quality Over Quantity
Voice messages are a proven, high-value feature that works reliably. Shipping broken live calls would damage user trust.

### 2. Infrastructure Cost
SFU/TURN infrastructure is expensive. We want organic growth before committing to media server costs.

### 3. Battery & Performance
Poorly optimized live audio drains mobile batteries. We need dedicated performance testing.

### 4. Security Audit
Real-time media encryption (SRTP) requires separate security review from our text E2EE.

---

## Timeline

| Version | Target | Features |
|---------|--------|----------|
| v0.7.26 | ✅ Now | Voice messages, presence, typing |
| v0.8.0 | Q2 2026 | Group DM conversations |
| v0.9.0 | Q3 2026 | 1:1 Voice calls (WebRTC) |
| v0.10.0 | Q4 2026 | 1:1 Video calls |
| v1.0.0 | 2027 | Voice channels, group calls |

---

## Contributing

If you want to help accelerate real-time features:
1. WebRTC expertise (especially React Native)
2. SFU deployment experience (Janus, mediasoup)
3. Security audit for media encryption

Contact: engineering@cgraph.org

---

*Last Updated: January 8, 2026*
