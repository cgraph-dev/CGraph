---
phase: 21-ui-interactions
plan: 09
status: complete
commit: 289e8a46
affects: []
subsystem: mobile
tech-stack:
  added: []
  used: [react-native-reanimated, expo-haptics, springs]
files:
  created: []
  modified:
    - apps/mobile/src/components/button.tsx
    - apps/mobile/src/components/icon-button.tsx
---

## Summary

Added haptic feedback and Reanimated spring press animation to mobile Button and IconButton.

### What Changed

- Button: Replaced RN Animated with react-native-reanimated, TouchableOpacity→Pressable, added
  Haptics.impactAsync(Light) on pressIn, spring scale(0.96) with snappy preset, useReducedMotion
  guard
- IconButton: Added Reanimated animated view wrapper, Pressable with haptic + spring scale(0.9),
  useReducedMotion guard
- Both import springs from @cgraph/animation-constants for consistent spring values
- No TypeScript errors introduced (pre-existing errors in other mobile files unchanged)
