---
phase: 13-voice-video
plan: 04
subsystem: security, webrtc
tags: [e2ee, sframe, livekit, encryption, react-native, webrtc]

requires:
  - phase: 13-02
    provides: LiveKit SFU integration (livekitService, useLiveKitRoom, livekit_token.ex)
  - phase: 7
    provides: E2EE infrastructure (PQXDH, Triple Ratchet, lock icons)
provides:
  - SFrame E2EE for all LiveKit voice/video calls
  - Per-room encryption key management with rotation
  - Mobile LiveKit SDK for group calls
  - Encryption indicators on web and mobile
affects: [voice-channels, group-calls, security-audit]

tech-stack:
  added: ['@livekit/react-native', '@livekit/react-native-webrtc', 'SFrame encryption']
  patterns:
    [
      'ExternalE2EEKeyProvider for call E2EE',
      'per-room AES-256 key with HKDF derivation',
      'ETS-backed key lifecycle',
    ]

key-files:
  created:
    - apps/backend/lib/cgraph/webrtc/call_encryption.ex
    - apps/web/src/lib/webrtc/callEncryption.ts
    - apps/web/src/modules/calls/components/encryption-indicator.tsx
    - apps/mobile/src/lib/webrtc/livekitService.ts
    - apps/mobile/src/lib/webrtc/callEncryption.ts
  modified:
    - apps/backend/lib/cgraph_web/channels/call_channel.ex
    - apps/web/src/lib/webrtc/livekitService.ts
    - apps/web/src/modules/calls/hooks/useLiveKitRoom.ts
    - apps/mobile/src/screens/calls/call-screen.tsx
    - apps/mobile/src/screens/groups/voice-channel-screen.tsx
    - apps/mobile/package.json

key-decisions:
  - 'SFrame via ExternalE2EEKeyProvider — industry-standard encrypted frames'
  - 'Per-room 256-bit AES keys stored in ETS — key lifecycle tied to room lifecycle'
  - 'HKDF-SHA256 key derivation for frame encryption keys'
  - 'Key rotation on participant leave for forward secrecy'
  - '@livekit/react-native-webrtc replaces standalone react-native-webrtc for LiveKit compatibility'

patterns-established:
  - 'Call E2EE: backend generates room key → delivers in channel join → client derives frame key via
    HKDF'
  - 'Encryption indicator: green lock for active, amber for degraded'

duration: 12min
completed: 2026-03-01
---

# Phase 13 Plan 04: Call E2EE (SFrame) + Mobile LiveKit Summary

**SFrame end-to-end encryption for all LiveKit calls with per-room key management and mobile LiveKit
SDK integration**

## Performance

- **Duration:** 12 min
- **Tasks:** 6/6
- **Files modified:** 12

## Accomplishments

- Backend per-room encryption key management with ETS-backed lifecycle and key rotation
- Web SFrame E2EE integration — ExternalE2EEKeyProvider with HKDF-SHA256 key derivation
- Web encryption indicator component (green lock / amber degraded) added to call UIs
- Mobile @livekit/react-native SDK installed with full service layer
- Mobile call E2EE mirroring web implementation
- Mobile group call screens wired to LiveKit with E2EE indicators

## Task Commits

1. **Task 1: Backend per-room E2EE key management** — `93dfbabb` (feat)
2. **Task 2: Web SFrame E2EE integration** — `258f6a8d` (feat)
3. **Task 3: Web encryption indicator** — `44d56750` (feat)
4. **Task 4: Mobile LiveKit SDK + service** — `7c1fe1c0` (feat)
5. **Task 5: Mobile call E2EE** — `e4fdd8c3` (feat)
6. **Task 6: Mobile group call screens with LiveKit** — `566adfc7` (feat)

## Files Created/Modified

- `apps/backend/lib/cgraph/webrtc/call_encryption.ex` — Per-room key generation, rotation, ECDH
  wrapping
- `apps/web/src/lib/webrtc/callEncryption.ts` — SFrame E2EE setup with ExternalE2EEKeyProvider
- `apps/web/src/modules/calls/components/encryption-indicator.tsx` — Lock icon component
- `apps/mobile/src/lib/webrtc/livekitService.ts` — Mobile LiveKit service (connect, publish,
  subscribe)
- `apps/mobile/src/lib/webrtc/callEncryption.ts` — Mobile E2EE with SFrame key derivation
- `apps/backend/lib/cgraph_web/channels/call_channel.ex` — Modified to include e2ee_key in join
  response
- `apps/web/src/lib/webrtc/livekitService.ts` — E2EE setup after Room.connect()
- `apps/web/src/modules/calls/hooks/useLiveKitRoom.ts` — Added isE2EEEnabled state
- `apps/mobile/src/screens/calls/call-screen.tsx` — Group call mode with LiveKit + E2EE
- `apps/mobile/src/screens/groups/voice-channel-screen.tsx` — LiveKit connection + encryption lock

## Decisions Made

- Used ExternalE2EEKeyProvider (not built-in key exchange) for full control over key material
- HKDF-SHA256 derivation: roomKey + salt "livekit-e2ee" + info roomName → 256-bit frame key
- @livekit/react-native-webrtc used instead of standalone react-native-webrtc for LiveKit compat
- Key rotation triggered on participant leave to maintain forward secrecy

## Deviations from Plan

None — plan executed as written.

## Issues Encountered

None.

## Next Phase Readiness

Phase 13 complete — all 4 plans executed. Ready for verification.
