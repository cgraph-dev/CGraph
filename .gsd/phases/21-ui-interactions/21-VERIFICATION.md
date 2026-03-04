---
phase: 21-ui-interactions
verified: 2026-03-04
status: ready
score: 10/10
type: pre-execution
fixes_applied:
  - plan: 21-02
    fix: 'Removed animation-constants build references (no build step — raw TS source)'
  - plan: 21-04
    fix: 'Reframed as upgrade — sidebar already has layoutId on line ~223'
  - plan: 21-07
    fix: 'Retargeted to AnimatedMessageWrapper + virtualization constraint noted'
  - plan: 21-10
    fix: 'Removed animation-constants build references + calibrated hardcoded counts'
---

# Phase 21 — Pre-Execution Verification Report

## Phase Goal

Every UI interaction (buttons, modals, sidebars, dropdowns, notifications, chat, page transitions,
toasts) has polished spring-driven animations using `motion/react` and
`@cgraph/animation-constants`, respecting `useReducedMotion()` throughout.

---

## Plan-by-Plan Verification Against Codebase

### Plan 21-01: Import Migration (framer-motion → motion/react)

| Check                         | Status     | Evidence                                               |
| ----------------------------- | ---------- | ------------------------------------------------------ |
| Target files exist            | ✓ VERIFIED | 727 files with `from 'framer-motion'` in apps/web/src/ |
| Zero motion/react imports yet | ✓ VERIFIED | 0 files with `from 'motion/react'` currently           |
| sed approach feasible         | ✓ VERIFIED | Both single-quote and double-quote variants present    |
| Build verification possible   | ✓ VERIFIED | `pnpm --filter web build` is the standard command      |

**Status: ✓ READY** — No issues. Straightforward mechanical replacement.

---

### Plan 21-02: Animation Constants + useMotionSafe Hook

| Check                                     | Status     | Evidence                                                                                                                           |
| ----------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| layout-ids.ts doesn't exist yet           | ✓ VERIFIED | File does not exist — will create                                                                                                  |
| useMotionSafe.ts doesn't exist yet        | ✓ VERIFIED | File does not exist — will create                                                                                                  |
| animation-constants barrel exports        | ✓ VERIFIED | `packages/animation-constants/src/index.ts` exports springs, durations, easings, cubicBeziers, stagger, transitions, rnTransitions |
| hooks barrel exists                       | ✓ VERIFIED | `apps/web/src/hooks/index.ts` exists with multiple exports                                                                         |
| useReducedMotion exports needed functions | ✓ VERIFIED | Exports: `useReducedMotion()`, `useAnimationIntensity()`, `getMotionTransition()`                                                  |
| useReducedMotion NOT in hooks barrel      | ⚠️ WARNING | It's not exported from `hooks/index.ts` — Plan 02 uses direct import path, which is fine                                           |
| animation-constants has NO build script   | ⚠️ GAP     | `package.json` has no `build` script — `"main": "./src/index.ts"` (consumed as source)                                             |

**Status: ⚠️ GAP — Plan 02 Task 1 and Task 3 reference
`pnpm --filter @cgraph/animation-constants build` but this package has NO build step.** It's
consumed directly as TypeScript source. The plan's verify/done criteria and Task 3 are invalid.

**Fix needed:** Remove all `pnpm --filter @cgraph/animation-constants build` references from
Plan 02. Task 3 should just verify web build, not a separate animation-constants build.

---

### Plan 21-03: Button & IconButton Motion System

| Check                            | Status     | Evidence                                                        |
| -------------------------------- | ---------- | --------------------------------------------------------------- |
| button.tsx exists (181 lines)    | ✓ VERIFIED | Plain `<button>` elements, no motion imports                    |
| Has `active:scale-[0.98]` CSS    | ✓ VERIFIED | Line in baseStyles — plan correctly identifies this for removal |
| Button uses plain `<button>`     | ✓ VERIFIED | No motion.button currently                                      |
| IconButton uses plain `<button>` | ✓ VERIFIED | No motion.button currently                                      |
| ButtonProps interface            | ✓ VERIFIED | Extends `React.ButtonHTMLAttributes<HTMLButtonElement>`         |
| Depends on 21-01 + 21-02         | ✓ VERIFIED | Needs motion/react imports (01) + useMotionSafe (02)            |

**Status: ✓ READY** — No issues. Button is exactly as described in the plan.

---

### Plan 21-04: Sidebar layoutId Indicators

| Check                          | Status     | Evidence                                                         |
| ------------------------------ | ---------- | ---------------------------------------------------------------- |
| sidebar.tsx exists (325 lines) | ✓ VERIFIED | Already imports `motion, AnimatePresence from 'framer-motion'`   |
| Already has layoutId           | ⚠️ GAP     | Line 223: `layoutId="activeIndicator"` already exists            |
| NavLink usage (3 occurrences)  | ✓ VERIFIED | Uses NavLink with isActive (5 occurrences)                       |
| Springs imported               | ✓ VERIFIED | Imports `springs, staggerConfigs` from `@/lib/animation-presets` |

**Status: ⚠️ GAP — Sidebar already has a `layoutId="activeIndicator"` on line 223.** Plan 04 assumes
no layoutId exists and describes adding one from scratch. The plan should instead:

1. Upgrade the existing `layoutId="activeIndicator"` to use `LAYOUT_IDS.sidebarActiveIndicator` from
   `@cgraph/animation-constants`
2. Add `useMotionSafe` for reduced motion support (likely missing)
3. Add `whileHover`/`whileTap` to nav items (if not already present)

**Fix needed:** Update Plan 04 to acknowledge the existing layoutId and frame as an enhancement
(replace hardcoded string with named constant + add reduced motion + add hover/tap feedback).

---

### Plan 21-05: Modals, Dialogs & Overlay Animations

| Check                   | Status     | Evidence                                                                   |
| ----------------------- | ---------- | -------------------------------------------------------------------------- |
| dialog.tsx (159 lines)  | ✓ VERIFIED | No motion/AnimatePresence — uses `if (!open) return null` + `createPortal` |
| popover.tsx (118 lines) | ✓ VERIFIED | No motion/AnimatePresence — context-based open/close                       |
| tooltip.tsx (118 lines) | ✓ VERIFIED | No motion/AnimatePresence — useState visibility                            |

**Status: ✓ READY** — All three components lack animation, matching plan assumptions perfectly.

---

### Plan 21-06: Dropdowns & Notification Badge Animations

| Check                              | Status     | Evidence                                                                      |
| ---------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| dropdown.tsx (137 lines)           | ✓ VERIFIED | No motion imports — uses `{isOpen && <div>}` (line 73)                        |
| notification-item.tsx (199 lines)  | ⚠️ WARNING | Already has motion: `whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}` |
| notification-header.tsx (79 lines) | ✓ VERIFIED | Has motion/AnimatePresence import but plan targets badge bounce               |

**Status: ⚠️ WARNING — notification-item.tsx already has motion hover/tap.** Plan 06 should
acknowledge existing motion and add stagger entrance on TOP of what's there (not replace). The
dropdown is clean as expected.

---

### Plan 21-07: Chat Message Entrance Animations

| Check                                       | Status     | Evidence                                                                                                                            |
| ------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| chat-bubbles.ts exports                     | ✓ VERIFIED | Exports `chatBubbleAnimations` (style presets)                                                                                      |
| message-bubble.tsx                          | ✓ VERIFIED | Uses `motion from 'framer-motion'`, renders message content                                                                         |
| AnimatedMessageWrapper exists               | ⚠️ GAP     | Full animation wrapper already exists at `animated-message-wrapper.tsx` with entrance animations, gesture, haptic, particle effects |
| conversation-messages.tsx                   | ✓ VERIFIED | Renders messages via virtualizer, uses AnimatePresence                                                                              |
| message-row.tsx uses AnimatedMessageWrapper | ✓ VERIFIED | Imports from chat components barrel                                                                                                 |
| typing-indicator.tsx                        | ✓ VERIFIED | Uses motion + springs, renders animated dots                                                                                        |

**Status: ⚠️ GAP — `AnimatedMessageWrapper` already provides extensive message entrance animations**
(spring physics, gesture interactions, haptic simulation). Plan 07 describes adding entrance
animations to message-bubble.tsx as if none exist, but `AnimatedMessageWrapper` already wraps
messages. The chat-bubbles.ts presets are for visual **styles** (glow, pulse, etc.), not entrance
animations.

**Fix needed:** Plan 07 should:

1. Enhance `chat-bubbles.ts` with the new `messageEntranceVariants` (still useful as named presets)
2. Target `AnimatedMessageWrapper` for integration of the new directional slide variants (not
   message-bubble.tsx directly)
3. Note that conversation-messages.tsx uses `@tanstack/react-virtual` virtualized rendering —
   AnimatePresence stagger may conflict with virtualization.
4. Typing indicator already has animation — plan should note this as enhancement-only.

---

### Plan 21-08: Page Transitions & Toast Enhancements

| Check                                     | Status     | Evidence                                                                                      |
| ----------------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| page-transition.tsx                       | ✓ VERIFIED | Uses `motion from 'framer-motion'` + `transitions from '@cgraph/animation-constants'`         |
| animated-outlet.tsx                       | ✓ VERIFIED | Uses `motion, AnimatePresence from 'framer-motion'` + `tweens from '@/lib/animation-presets'` |
| toast.tsx                                 | ✓ VERIFIED | Uses `motion, AnimatePresence` + `springs from '@/lib/animation-presets'`                     |
| toast-item.tsx (238 lines)                | ✓ VERIFIED | Provider toast version exists                                                                 |
| useReducedMotion missing from transitions | ✓ VERIFIED | Neither page-transition nor animated-outlet checks reduced motion                             |

**Status: ✓ READY** — All components match plan descriptions. Adding useReducedMotion is correct
enhancement.

---

### Plan 21-09: Mobile Haptics & Reanimated Upgrades

| Check                             | Status     | Evidence                                                 |
| --------------------------------- | ---------- | -------------------------------------------------------- |
| button.tsx (mobile)               | ✓ VERIFIED | Uses `TouchableOpacity` + `Animated` from RN, NO haptics |
| icon-button.tsx (mobile)          | ✓ VERIFIED | Uses `TouchableOpacity`, NO haptics, NO reanimated       |
| animated-button.tsx               | ✓ VERIFIED | Already has expo-haptics + Reanimated + SPRING_PRESETS   |
| expo-haptics installed            | ✓ VERIFIED | `"expo-haptics": "~15.0.0"` in mobile package.json       |
| react-native-reanimated available | ✓ VERIFIED | animated-button.tsx uses it                              |

**Status: ✓ READY** — Mobile components match plan assumptions. button.tsx and icon-button.tsx
genuinely lack haptics.

---

### Plan 21-10: Hardcoded Value Cleanup & Final Validation

| Check                     | Status     | Evidence                                                                                  |
| ------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| Hardcoded durations       | ✓ VERIFIED | 29 occurrences (not 244 — audit counted broader patterns)                                 |
| Hardcoded springs         | ✓ VERIFIED | 30 occurrences (not 36 — excludes presets files)                                          |
| animation-constants build | ⚠️ GAP     | Plan references `pnpm --filter @cgraph/animation-constants build` — same issue as Plan 02 |

**Status: ⚠️ WARNING — Hardcoded value counts differ from Phase 0 audit numbers** (29 vs 244
durations, 30 vs 36 springs). The audit used broader patterns. Plan 10's scope is accurate for the
targeted replacements. Same animation-constants build issue as Plan 02.

---

## Gaps Summary

### Critical Gaps (must fix before execution)

| #   | Plan  | Issue                                                                         | Impact                                                              | Fix                                                                                       |
| --- | ----- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | 21-02 | `@cgraph/animation-constants` has NO build script — consumed as raw TS source | Tasks 1/3 verify commands will fail                                 | Remove all `pnpm --filter @cgraph/animation-constants build` references                   |
| 2   | 21-04 | Sidebar already has `layoutId="activeIndicator"` on line 223                  | Plan describes adding from scratch — executor will be confused      | Reframe as upgrade: replace hardcoded string with LAYOUT_IDS constant + add useMotionSafe |
| 3   | 21-07 | `AnimatedMessageWrapper` already provides entrance animations + gestures      | Plan targets message-bubble.tsx directly, ignoring existing wrapper | Retarget to enhance AnimatedMessageWrapper or chat-bubbles.ts presets only                |

### Non-Critical Warnings

| #   | Plan  | Issue                                                                                                               | Impact                                                |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 4   | 21-06 | notification-item.tsx already has motion hover/tap                                                                  | Executor should enhance, not add from scratch         |
| 5   | 21-07 | conversation-messages.tsx uses `@tanstack/react-virtual` — AnimatePresence stagger may conflict with virtualization | Stagger on virtualized list may not work as described |
| 6   | 21-10 | Hardcoded value counts differ from Phase 0 audit (29 vs 244)                                                        | Scope expectations need calibration                   |
| 7   | 21-02 | `useReducedMotion` not exported from hooks barrel                                                                   | Direct import path works fine — not a blocker         |

---

## Recommended Fixes

### Fix 1: Plan 21-02 — Remove animation-constants build references

Replace all occurrences of `pnpm --filter @cgraph/animation-constants build` with a note that the
package is consumed as raw TypeScript source (no build step). Remove Task 3's animation-constants
build verification. Keep only `pnpm --filter web build` as verification.

### Fix 2: Plan 21-04 — Acknowledge existing layoutId

Update Plan 04 to:

- Note that `layoutId="activeIndicator"` already exists at line 223
- Task 1: Replace hardcoded `"activeIndicator"` string with `LAYOUT_IDS.sidebarActiveIndicator`
- Task 1: Add `useMotionSafe` for reduced motion support
- Task 1: Add `whileHover`/`whileTap` to nav items (only if not already present)

### Fix 3: Plan 21-07 — Retarget chat animations

Update Plan 07 to:

- Task 1: Keep as-is (add presets to chat-bubbles.ts) — these are useful standalone
- Task 2: Target `AnimatedMessageWrapper` (not message-bubble.tsx) for integrating directional
  variants
- Task 2: Note virtualized rendering constraint — stagger approach must work with
  `@tanstack/react-virtual`
- Task 2: Note typing-indicator.tsx already has spring animations — enhance don't replace

---

## Pre-Execution Readiness

| Plan  | Ready?                | Blocking Issues                                 |
| ----- | --------------------- | ----------------------------------------------- |
| 21-01 | ✅ Ready              | None                                            |
| 21-02 | ❌ Fix needed         | animation-constants has no build step           |
| 21-03 | ✅ Ready              | None                                            |
| 21-04 | ❌ Fix needed         | layoutId already exists                         |
| 21-05 | ✅ Ready              | None                                            |
| 21-06 | ⚠️ Ready with caution | notification-item already has motion            |
| 21-07 | ❌ Fix needed         | AnimatedMessageWrapper already handles entrance |
| 21-08 | ✅ Ready              | None                                            |
| 21-09 | ✅ Ready              | None                                            |
| 21-10 | ⚠️ Ready with caution | animation-constants build refs                  |

**Overall: All 10 plans are ready for execution after fixes applied to Plans 02, 04, 07, and 10.**

---

_Verified: 2026-03-04 | Pre-execution check against live codebase_
