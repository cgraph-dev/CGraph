# Plan 22-02 Summary — Mobile Store Facades & Hooks

## Result: ✅ Complete

## Commits

| Hash       | Message                                                                          |
| ---------- | -------------------------------------------------------------------------------- |
| `5ce331aa` | fix(mobile): wire community facade forums to real forum store                    |
| `494a7ec4` | fix(mobile): wire marketplace facade balance to gamification store               |
| `73d1828a` | fix(mobile): document UI facade web-only methods, clean up stubs                 |
| `77c2227d` | fix(mobile): wire useVoiceRecording to real expo-audio implementation            |
| `5e8449be` | fix(mobile): uncomment VoiceMessageRecorder export with correct path             |
| `026be73e` | feat(mobile): create forum hooks directory with useForumList and useForumDetail  |
| `e06d325f` | fix(mobile): replace Math.random audio levels with WebRTC stats or zero fallback |

## What Changed

### Task 1: Community Facade

- `useCommunityFacade().forums` now returns `useForumStore.getState().forums` (real data)
- Replaced `[] as unknown[]` stub

### Task 2: Marketplace Facade

- `useMarketplaceFacade().balance` now returns `useGamificationStore.getState().coins` (real
  balance)
- Replaced hardcoded `0`

### Task 3: UI Facade

- Documented sidebar methods as web-only (no-op with explanation)
- Modal methods annotated with "Mobile: managed by React Navigation"

### Task 4: Voice Recording Hook

- `useVoiceRecording()` now delegates to real `useVoiceRecorder` from voice-message-recorder
  component
- Maps real hook interface to expected shape: `{ isRecording, duration, start, stop, cancel }`
- Uses expo-audio under the hood (was already a dependency)

### Task 5: VoiceMessageRecorder Export

- Uncommented export in features/messaging/components/index.ts
- Fixed path from `@/components/conversation/voice-message-recorder` to
  `@/components/voice-message-recorder`

### Task 6: Forum Hooks Directory

- Created `features/forums/hooks/index.ts`, `useForumList.ts`, `useForumDetail.ts`
- Follows existing feature hook directory pattern
- Wraps forumStore with selector hooks

### Task 7: Voice Call Audio Levels

- Removed `Math.random()` simulation from voice-call-screen.tsx
- Replaced with WebRTC stats audio level reading (falls to 0 when stats unavailable)

## Files Modified (8)

- `stores/index.ts` (3 facade changes)
- `features/messaging/hooks/index.ts`
- `features/messaging/components/index.ts`
- `features/forums/hooks/index.ts` (new)
- `features/forums/hooks/useForumList.ts` (new)
- `features/forums/hooks/useForumDetail.ts` (new)
- `features/forums/index.ts` (updated barrel)
- `screens/calls/voice-call-screen.tsx`
