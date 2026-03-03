---
phase: 07-e2ee-mobile-security
plan: 06
subsystem: ui
tags: [e2ee, safety-number, qr-code, react, react-native, expo-camera, verification]

requires:
  - phase: 07-04
    provides: E2EE key management and safety number API endpoint
  - phase: 07-05
    provides: E2EE mobile hooks and context (generateSafetyNumber, getSafetyNumber)
provides:
  - Web safety number verification dialog with QR code display
  - Mobile safety number screen with QR code display and camera scanner
  - Cross-platform safety number verification (web ↔ mobile QR scanning)
affects: [chat-ui, e2ee-verification, mobile-navigation]

tech-stack:
  added: []
  patterns: [safety-number-4x3-grid, qr-payload-json-envelope, camera-barcode-scanning]

key-files:
  created:
    - apps/web/src/modules/chat/components/safety-number-dialog.tsx
    - apps/mobile/src/screens/chat/safety-number-screen.tsx
    - apps/mobile/src/components/chat/QRCodeScanner.tsx
  modified:
    - apps/web/src/modules/chat/components/conversation-header.tsx
    - apps/web/src/modules/chat/components/conversation-modals.tsx
    - apps/web/src/modules/chat/components/index.ts
    - apps/web/src/modules/chat/hooks/useConversationUI.ts
    - apps/web/src/pages/messages/conversation/page.tsx
    - apps/web/src/pages/messages/conversation/useConversationPage.ts
    - apps/mobile/src/types/index.ts
    - apps/mobile/src/navigation/messages-navigator.tsx
    - apps/mobile/src/screens/messages/conversation-screen/hooks/use-conversation-header.tsx

key-decisions:
  - "QR payload uses JSON envelope {version, type, userId, safetyNumber, timestamp} for forward compatibility"
  - "Mobile scanner accepts both raw 60-digit strings and JSON payloads for cross-platform interop"
  - "Used existing react-native-qrcode-svg and expo-camera (already in dependencies) — no new packages added"
  - "Safety number screen registered under MessagesStack as 'SafetyNumber' route (not a separate navigator)"

patterns-established:
  - "Safety number format: 12 groups of 5 digits in 4×3 grid — consistent across web and mobile"
  - "QR verification flow: scan → extract → compare → show result overlay"
  - "Verify Identity button in conversation header on both platforms (fingerprint icon)"

duration: 12min
completed: 2026-02-28
---

# Plan 07-06: Safety Number Verification UI Summary

**Web dialog and mobile screen for verifying E2EE safety numbers via 60-digit grid display and QR code scanning**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-28T00:00:00Z
- **Completed:** 2026-02-28T00:12:00Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Web safety number dialog showing 60-digit number in Signal-style 4×3 grid with QR code and "Mark as Verified" action
- Mobile safety number screen with identical grid layout, QR code display, camera-based QR scanner, and clipboard copy
- Cross-platform QR interop — mobile scanner parses both JSON payloads (from web) and raw numeric strings
- Navigation wired on both platforms: fingerprint icon in conversation header opens verify flow

## Task Commits

1. **Task 1: Web safety number verification dialog** - `9afe0fb6` (feat)
2. **Task 2: Mobile safety number screen with QR scanner** - `e8094f09` (feat)

## Files Created/Modified

- `apps/web/src/modules/chat/components/safety-number-dialog.tsx` — Web dialog: fetches safety number from API, displays 4×3 grid, QR code via qrcode.react, Mark as Verified button
- `apps/web/src/modules/chat/components/conversation-header.tsx` — Added onVerifyIdentity prop and FingerPrintIcon button
- `apps/web/src/modules/chat/components/conversation-modals.tsx` — Wired SafetyNumberDialog into modal system
- `apps/web/src/modules/chat/components/index.ts` — Exported SafetyNumberDialog
- `apps/web/src/modules/chat/hooks/useConversationUI.ts` — Added showSafetyNumber panel state
- `apps/web/src/pages/messages/conversation/page.tsx` — Imported SafetyNumberDialog
- `apps/web/src/pages/messages/conversation/useConversationPage.ts` — Added showSafetyNumber state
- `apps/mobile/src/components/chat/QRCodeScanner.tsx` — Camera scanner: permission handling, QR parsing, match/mismatch overlay
- `apps/mobile/src/screens/chat/safety-number-screen.tsx` — Full screen: safety number grid, QR code via react-native-qrcode-svg, scanner toggle, verify action
- `apps/mobile/src/types/index.ts` — Added SafetyNumber route to MessagesStackParamList
- `apps/mobile/src/navigation/messages-navigator.tsx` — Registered SafetyNumber screen
- `apps/mobile/src/screens/messages/conversation-screen/hooks/use-conversation-header.tsx` — Added Verify Identity button to header actions

## Decisions Made

- QR payload uses JSON envelope `{version, type, userId, safetyNumber, timestamp}` matching the web dialog's `buildQRPayload` format — enables forward-compatible versioning
- Mobile scanner handles both JSON and raw 60-digit formats for maximum interop
- No new packages installed — `qrcode.react`, `react-native-qrcode-svg`, and `expo-camera` were all pre-existing dependencies
- SafetyNumber screen added to MessagesStack (not a separate chat navigator) to keep navigation flat

## Deviations from Plan

None — plan executed as specified. All dependencies were already available.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Safety number verification UI complete on both platforms (SC-2 satisfied)
- Backend verify endpoint (`POST /api/v1/e2ee/keys/:key_id/verify`) already exists from prior plans
- Ready for E2EE phase completion or further hardening

---

_Phase: 07-e2ee-mobile-security, Plan: 06_
_Completed: 2026-02-28_
