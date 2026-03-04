---
phase: 21-ui-interactions
verified: 2025-07-17
status: gaps_found
score: 18/20 truths verified
type: post-execution
gaps:
  - id: GAP-01
    truth: 'Web build passes with zero TypeScript errors in Phase 21 files'
    severity: blocker
    artifacts: [apps/web/src/hooks/useMotionSafe.ts, apps/web/src/components/ui/button.tsx]
    reason:
      'tapScale()/hoverScale() return `object`; whileTap/whileHover expect TargetAndTransition'
  - id: GAP-02
    truth: 'Zero framer-motion references in apps/web/src'
    severity: minor
    artifacts: [apps/web/src/pages/customize/effects-customization/animation-sets-section.tsx]
    reason: "import('framer-motion').Easing type reference missed by Plan 01 sed migration"
---

# Phase 21: UI Interactions & Motion Upgrade — Post-Execution Verification Report

**Phase Goal:** Every UI interaction (buttons, modals, sidebars, dropdowns, notifications, chat,
page transitions, toasts) has polished spring-driven animations using `motion/react` and
`@cgraph/animation-constants`, respecting `useReducedMotion()` throughout.

**Verified:** 2025-07-17 **Status:** gaps_found

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                  | Status     | Evidence                                                      |
| --- | -------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| 1   | Zero `from 'framer-motion'` imports in apps/web/src                                    | ✓ VERIFIED | grep: 0 matches                                               |
| 2   | 732+ `from 'motion/react'` imports in apps/web/src                                     | ✓ VERIFIED | grep: 732 matches                                             |
| 3   | LAYOUT_IDS exported from @cgraph/animation-constants                                   | ✓ VERIFIED | `export const LAYOUT_IDS = {` in layout-ids.ts                |
| 4   | useMotionSafe hook returns shouldAnimate, springs, getTransition, tapScale, hoverScale | ✓ VERIFIED | 14 references to key exports in useMotionSafe.ts              |
| 5   | Button uses motion.button with whileTap/whileHover                                     | ✓ VERIFIED | 4x motion.button, 4x whileTap/whileHover, 3x useMotionSafe    |
| 6   | Sidebar uses LAYOUT_IDS constant + useMotionSafe                                       | ✓ VERIFIED | 2x LAYOUT_IDS, 3x useMotionSafe/shouldAnimate                 |
| 7   | Dialog has AnimatePresence + spring animations + useReducedMotion                      | ✓ VERIFIED | 3x AnimatePresence, 6x useReducedMotion                       |
| 8   | Popover has AnimatePresence + scale+fade                                               | ✓ VERIFIED | 3x AnimatePresence                                            |
| 9   | Tooltip has AnimatePresence + scale+fade                                               | ✓ VERIFIED | 3x AnimatePresence                                            |
| 10  | Dropdown has AnimatePresence + spring animation                                        | ✓ VERIFIED | 3x AnimatePresence                                            |
| 11  | Notification items have stagger entrance                                               | ✓ VERIFIED | 4x stagger/index references                                   |
| 12  | messageEntranceVariants + messageListStagger + typingIndicatorVariants exported        | ✓ VERIFIED | 3 exports in chat-bubbles.ts                                  |
| 13  | AnimatedMessageWrapper respects useReducedMotion                                       | ✓ VERIFIED | 2x useReducedMotion references                                |
| 14  | Chat has directional entrance (sent/received)                                          | ✓ VERIFIED | 2x direction/sent/received/custom references                  |
| 15  | Page transition uses spring + useReducedMotion                                         | ✓ VERIFIED | 3x spring/useReducedMotion in page-transition.tsx             |
| 16  | Animated outlet uses spring + useReducedMotion                                         | ✓ VERIFIED | 3x spring/useReducedMotion in animated-outlet.tsx             |
| 17  | Toast uses spring enter + useReducedMotion                                             | ✓ VERIFIED | 5x spring/useReducedMotion in toast.tsx, 2x in toast-item.tsx |
| 18  | Mobile Button has expo-haptics + withSpring + useReducedMotion                         | ✓ VERIFIED | 4x Haptics/impactAsync, 5x withSpring/useAnimatedStyle        |
| 19  | Mobile IconButton has expo-haptics + useReducedMotion                                  | ✓ VERIFIED | 4x Haptics/impactAsync/useReducedMotion                       |
| 20  | Web build compiles cleanly with zero TS errors in Phase 21 files                       | ✗ FAILED   | 5 TS errors (see Gaps)                                        |

**Score:** 18/20 truths verified

---

## Required Artifacts

| Artifact                                                             | Purpose                        | Exists        | Substantive           | Wired                                       | Status      |
| -------------------------------------------------------------------- | ------------------------------ | ------------- | --------------------- | ------------------------------------------- | ----------- |
| packages/animation-constants/src/layout-ids.ts                       | LAYOUT_IDS constants           | ✓ (20 lines)  | ✓ No stubs            | ✓ Re-exported from index.ts                 | ✓ VERIFIED  |
| apps/web/src/hooks/useMotionSafe.ts                                  | Reduced motion + spring hook   | ✓ (75 lines)  | ✓ No stubs            | ✓ Imported in button.tsx, sidebar.tsx       | ✓ VERIFIED  |
| apps/web/src/lib/animation-presets/chat-bubbles.ts                   | Chat animation presets         | ✓ (190 lines) | ✓ No stubs            | ✓ Re-exported from presets/index.ts         | ✓ VERIFIED  |
| apps/web/src/lib/animation-presets/index.ts                          | Barrel re-exports              | ✓ (39 lines)  | ✓ Exports all presets | ✓ Used by AnimatedMessageWrapper            | ✓ VERIFIED  |
| apps/web/src/components/ui/button.tsx                                | motion.button with interaction | ✓ (193 lines) | ✓ No stubs            | ✓ Imports useMotionSafe, motion             | ⚠️ TS ERROR |
| apps/web/src/components/ui/dialog.tsx                                | AnimatePresence spring dialog  | ✓ (162 lines) | ✓ No stubs            | ✓ Uses AnimatePresence, useReducedMotion    | ✓ VERIFIED  |
| apps/web/src/components/ui/popover.tsx                               | AnimatePresence scale+fade     | ✓ (124 lines) | ✓ No stubs            | ✓ Uses AnimatePresence                      | ✓ VERIFIED  |
| apps/web/src/components/ui/tooltip.tsx                               | AnimatePresence scale+fade     | ✓ (127 lines) | ✓ No stubs            | ✓ Uses AnimatePresence                      | ✓ VERIFIED  |
| apps/web/src/components/navigation/dropdown.tsx                      | Spring dropdown                | ✓ (149 lines) | ✓ No stubs            | ✓ Uses AnimatePresence                      | ✓ VERIFIED  |
| apps/web/src/pages/notifications/notifications/notification-item.tsx | Stagger entrance               | ✓ (210 lines) | ✓ No stubs            | ✓ Uses stagger                              | ✓ VERIFIED  |
| apps/web/src/modules/chat/components/animated-message-wrapper.tsx    | Directional variants           | ✓ (231 lines) | ✓ No stubs            | ✓ Imports animation-presets                 | ✓ VERIFIED  |
| apps/web/src/shared/components/page-transition.tsx                   | Spring page transition         | ✓ (53 lines)  | ✓ No stubs            | ✓ Imports motion/react                      | ✓ VERIFIED  |
| apps/web/src/layouts/app-layout/animated-outlet.tsx                  | Spring outlet                  | ✓ (53 lines)  | ✓ No stubs            | ✓ Imports AnimatePresence, useReducedMotion | ✓ VERIFIED  |
| apps/web/src/layouts/app-layout/sidebar.tsx                          | LayoutId indicator             | ✓ (328 lines) | ✓ No stubs            | ✓ Imports LAYOUT_IDS, useMotionSafe         | ✓ VERIFIED  |
| apps/web/src/components/ui/toast.tsx                                 | Spring toast enter             | ✓ (155 lines) | ✓ No stubs            | ✓ Uses spring, useReducedMotion             | ✓ VERIFIED  |
| apps/web/src/providers/notification-provider/toast-item.tsx          | Toast reduced motion           | ✓ (239 lines) | ✓ No stubs            | ✓ Uses useReducedMotion                     | ✓ VERIFIED  |
| apps/mobile/src/components/button.tsx                                | Haptic spring button           | ✓ (173 lines) | ✓ No stubs            | ✓ Imports expo-haptics, Reanimated          | ✓ VERIFIED  |
| apps/mobile/src/components/icon-button.tsx                           | Haptic spring icon button      | ✓ (142 lines) | ✓ No stubs            | ✓ Imports expo-haptics, Reanimated          | ✓ VERIFIED  |

**Artifacts:** 17/18 verified (1 has TS type errors)

---

## Key Link Verification

| From                         | To                           | Via                                  | Status  | Detail                                                                            |
| ---------------------------- | ---------------------------- | ------------------------------------ | ------- | --------------------------------------------------------------------------------- |
| useMotionSafe.ts             | @cgraph/animation-constants  | `import { springs }`                 | ✓ WIRED | Line 12: `import { springs as sharedSprings } from '@cgraph/animation-constants'` |
| button.tsx                   | useMotionSafe.ts             | `import { useMotionSafe }`           | ✓ WIRED | Uses tapScale, hoverScale, springs                                                |
| sidebar.tsx                  | layout-ids.ts                | `import { LAYOUT_IDS }`              | ✓ WIRED | `layoutId={LAYOUT_IDS.sidebarActiveIndicator}`                                    |
| animated-message-wrapper.tsx | animation-presets            | `import { tweens, springs }`         | ✓ WIRED | Uses presets for directional animations                                           |
| animation-presets/index.ts   | chat-bubbles.ts              | re-export                            | ✓ WIRED | Exports messageEntranceVariants, messageListStagger, typingIndicatorVariants      |
| page-transition.tsx          | motion/react                 | `import { motion }`                  | ✓ WIRED | Uses motion components + useReducedMotion                                         |
| animated-outlet.tsx          | motion/react                 | `import { motion, AnimatePresence }` | ✓ WIRED | Uses AnimatePresence + useReducedMotion                                           |
| mobile button.tsx            | expo-haptics                 | `import * as Haptics`                | ✓ WIRED | `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`                          |
| layout-ids.ts                | animation-constants/index.ts | barrel export                        | ✓ WIRED | Re-exported from package barrel                                                   |

**Wiring:** 9/9 connections verified

---

## Anti-Patterns Found

| File   | Issue                                                                     | Severity |
| ------ | ------------------------------------------------------------------------- | -------- |
| (none) | No TODO, FIXME, HACK, console.log, or `any` types found in Phase 21 files | ✓ Clean  |

---

## Gaps Summary

### GAP-01: TypeScript type mismatch in button.tsx (Blocker)

**Truth:** Web build compiles cleanly with zero TS errors in Phase 21 files

**Errors:**

```
src/components/ui/button.tsx(65,7): error TS2322: Type 'object' is not assignable to type 'TargetAndTransition | VariantLabels | undefined'.
src/components/ui/button.tsx(66,7): error TS2322: Type 'object' is not assignable to type 'TargetAndTransition | VariantLabels | undefined'.
src/components/ui/button.tsx(177,7): error TS2322: Type 'object' is not assignable to type 'TargetAndTransition | VariantLabels | undefined'.
src/components/ui/button.tsx(178,7): error TS2322: Type 'object' is not assignable to type 'TargetAndTransition | VariantLabels | undefined'.
```

**Root cause:** `useMotionSafe.ts` defines `tapScale()` and `hoverScale()` return type as `object`.
The motion library's `whileTap` and `whileHover` props expect
`TargetAndTransition | VariantLabels | undefined`. TypeScript correctly rejects assigning `object`
to the more specific union type.

**Fix:** Update `useMotionSafe.ts` return types for `tapScale` and `hoverScale` to return
`TargetAndTransition` (imported from `motion/react`), or use `Record<string, number>` /
`{ scale: number } | Record<string, never>`. Also update the `springs` return types from `object` to
motion's `Transition` type.

### GAP-02: Stale framer-motion type reference (Minor)

**Truth:** Zero framer-motion references in apps/web/src

**Error:**

```
src/pages/customize/effects-customization/animation-sets-section.tsx(99,53): error TS2307: Cannot find module 'framer-motion' or its corresponding type declarations.
```

**Root cause:** Line 99 uses `import('framer-motion').Easing` as a type assertion. Plan 01's sed
migration only targeted `from 'framer-motion'` import statements, missing this dynamic import type
syntax.

**Fix:** Replace `import('framer-motion').Easing` with `import('motion/react').Easing` or
`import('motion').Easing`.

### Note: Out-of-Scope Remnants

12 `framer-motion` imports remain in `packages/ui/src/` — a separate shared UI package that was
**not** in Phase 21 scope (Phase 21 targeted `apps/web/src/`, `apps/mobile/src/`, and
`packages/animation-constants/`). These are pre-existing and do not count as gaps.

26 hardcoded duration values remain in `apps/web/src/` but are in GSAP animation engine types
(`animation-engine.types.ts`), CSS border collection data (`borderCollections.ts`), and custom
per-component values with no matching preset. These are acceptable residuals.

---

## Human Verification Required

### 1. Visual Animation Quality

**Test:** Navigate through the app, click buttons, open dialogs/popovers/tooltips, expand dropdowns,
switch sidebar items, navigate between pages **Expected:** All interactions feel smooth with
spring-driven motion — no jank, no sudden jumps, no missed exit animations **Why human:** Visual
animation quality cannot be verified programmatically

### 2. Reduced Motion Respect

**Test:** Enable "Reduce motion" in OS accessibility settings, repeat all interactions **Expected:**
All animations either skip instantly or use minimal fade (duration: 0), no springs or bounces when
reduced motion is active **Why human:** Requires OS-level accessibility setting + visual
confirmation

### 3. Mobile Haptic Feedback

**Test:** Run the mobile app on a physical device, tap buttons and icon buttons **Expected:** Subtle
haptic tap feedback (Light impact) on button press with spring scale animation **Why human:** Haptic
feedback requires physical device testing

### 4. Chat Message Direction

**Test:** Send and receive messages in a chat conversation **Expected:** Sent messages slide in from
the right, received messages from the left. Smooth stagger on message list load. **Why human:**
Directional animation requires real conversation context

---

## Recommended Fix Plan

### 21-11-PLAN.md: Fix TypeScript Type Errors

**Objective:** Resolve 5 TS errors introduced by Phase 21

**Tasks:**

1. **Fix useMotionSafe return types** — Update `tapScale`/`hoverScale` return types from `object` to
   `TargetAndTransition` (from `motion/react`). Update `springs` types from `object` to motion's
   transition type.
   - Files: `apps/web/src/hooks/useMotionSafe.ts`
   - Verify: `npx tsc --noEmit` shows 0 errors for button.tsx

2. **Fix stale framer-motion type reference** — Replace `import('framer-motion').Easing` with
   `import('motion/react').Easing`
   - Files: `apps/web/src/pages/customize/effects-customization/animation-sets-section.tsx`
   - Verify: `npx tsc --noEmit` shows 0 errors for animation-sets-section.tsx

3. **Re-verify build** — Run full tsc check
   - Verify: `npx tsc --noEmit 2>&1 | grep "error TS" | wc -l` = 0

**Estimated scope:** Small (< 15 min)

---

## Verification Metadata

- **Approach:** Goal-backward (truths → artifacts → wiring → anti-patterns)
- **Truths checked:** 20
- **Artifacts checked:** 18
- **Key links checked:** 9
- **Anti-pattern files scanned:** 16
- **TypeScript build:** 5 errors found (4 type mismatches + 1 missing module)
- **Build blocker:** Yes — button.tsx type errors / animation-sets-section.tsx missing module
