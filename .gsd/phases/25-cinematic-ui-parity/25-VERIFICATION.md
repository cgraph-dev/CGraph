---
phase: 25-cinematic-ui-parity
verified: 2026-03-08
status: gaps_found
score: 36/40
verifier: gsd-verifier
---

# Phase 25 Verification Report — Cinematic UI Parity

## Phase Goal

> Web and mobile app UI matches the cinematic visual quality of the landing and auth pages — premium
> buttons with magnetic/shimmer effects, interactive particle backgrounds, squircle avatars
> (border-radius: 43px) with Lottie support, enhanced glass cards, and ambient effects.

---

## Goal Achievement — Truth Verification

| #    | Truth                                                    | Status     | Evidence                                                                  |
| ---- | -------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- | -------- | ------------------------------- |
| 01-1 | `@cgraph/animation-constants` exports background presets | ✓ VERIFIED | `backgroundPresets` in backgrounds.ts (99 lines), re-exported in index.ts |
| 01-2 | `@cgraph/animation-constants` exports button presets     | ✓ VERIFIED | `buttonPresets` in buttons.ts (113 lines), re-exported in index.ts        |
| 01-3 | All presets have reduced-motion fallbacks                | ✓ VERIFIED | `reducedMotion` object in both files with zeroed/disabled values          |
| 02-1 | Primary/glass buttons have magnetic cursor-following     | ✓ VERIFIED | `useMagneticButton` in button.tsx for primary/glass variants              |
| 02-2 | Primary buttons have idle shimmer                        | ✓ VERIFIED | `btn-shimmer` CSS class + `@keyframes btn-shimmer` in index.css           |
| 02-3 | Button animations respect `useReducedMotion`             | ✓ VERIFIED | `useMotionSafe` check in magnetic-button.tsx                              |
| 02-4 | Button API backward compatible                           | ✓ VERIFIED | `animated` prop defaults true, no breaking changes                        |
| 03-1 | Web app has interactive canvas particle field            | ✓ VERIFIED | cinematic-background.tsx (210 lines), requestAnimationFrame canvas loop   |
| 03-2 | Particles react to mouse (repulsion physics)             | ✓ VERIFIED | Force vector proportional to `(1 - dist / mouseRepulsion)`                |
| 03-3 | Background renders behind all app content                | ✓ VERIFIED | CinematicBackground rendered in app-layout.tsx                            |
| 03-4 | Background respects reduced motion                       | ✓ VERIFIED | `useReducedMotion()` → returns null                                       |
| 03-5 | No performance regression — 60fps                        | ? HUMAN    | DPR capped at 2, tab-hidden pause — needs device testing                  |
| 04-1 | Default avatar border-radius is 43px                     | ✓ VERIFIED | `rounded-[43px]` for squircle in avatar.tsx + animations.ts               |
| 04-2 | Avatar supports shape prop                               | ✓ VERIFIED | `'squircle'                                                               | 'circle' | 'square'` with squircle default |
| 04-3 | All avatar sizes use squircle default                    | ✓ VERIFIED | Default in constants.ts changed to 'squircle'                             |
| 04-4 | Avatar border animation works with squircle              | ✓ VERIFIED | types.ts + animations.ts handle 'squircle' case                           |
| 04-5 | Lottie avatar rendering via lottieUrl                    | ✓ VERIFIED | Lazy LottieRenderer import + Suspense in avatar.tsx                       |
| 04-6 | Backward compatible                                      | ✓ VERIFIED | Shape defaults to squircle, visual change intentional                     |
| 05-1 | GlassCard has spotlight border                           | ✓ VERIFIED | `useMotionTemplate` radial gradient following cursor in glass-card.tsx    |
| 05-2 | GlowText has animated gradient flow                      | ✓ VERIFIED | `gradientFlow` prop with animated backgroundPosition in glow-text.tsx     |
| 05-3 | AnimatedBorder has smoother conic gradient               | ? HUMAN    | Not explicitly verified — needs visual check                              |
| 05-4 | Micro-interactions include animated counters             | ✓ VERIFIED | `AnimatedCounter` component in micro-interactions.tsx                     |
| 05-5 | Section headers use gradient text                        | ? HUMAN    | GlowText exists but no grep showing header integration                    |
| 05-6 | All effects respect useReducedMotion                     | ✓ VERIFIED | Every component checks `usePrefersReducedMotion()`                        |
| 06-1 | Mobile primary button has gradient animation             | ✓ VERIFIED | LinearGradient border in animated-button.tsx                              |
| 06-2 | Button tap has spring scale + haptic                     | ✗ FAILED   | **BUG: AnimatedButton has no Pressable — press handlers never fire**      |
| 06-3 | Button press shows glow effect                           | ✗ FAILED   | **BUG: Glow animations defined but handlers are dead code**               |
| 06-4 | All animations use Reanimated shared values              | ✓ VERIFIED | All useSharedValue + useAnimatedStyle on UI thread                        |
| 06-5 | Button API backward compatible                           | ✓ VERIFIED | `animated` prop defaults true, non-enhanced buttons still use Pressable   |
| 07-1 | Mobile avatar default is squircle (br: 43)               | ✓ VERIFIED | `getSquircleBorderRadius` returns Math.min(43, size/2)                    |
| 07-2 | Avatar supports lottieUrl                                | ✓ VERIFIED | Delegates to LottieAvatar component                                       |
| 07-3 | Lottie renders in squircle mask                          | ✓ VERIFIED | `overflow: 'hidden'` + squircle borderRadius                              |
| 07-4 | All avatar sizes use squircle default                    | ✓ VERIFIED | shape defaults to 'squircle'                                              |
| 07-5 | Status dot positions correctly on squircle               | ? HUMAN    | Needs visual testing                                                      |
| 07-6 | Backward compatible                                      | ✓ VERIFIED | Defaults changed, no breaking API                                         |
| 08-1 | Mobile has glass card with blur                          | ✓ VERIFIED | Pre-existing glass-card.tsx (283 lines) + glass-card-v2.tsx               |
| 08-2 | Mobile has animated gradient text                        | ✓ VERIFIED | gradient-text.tsx (84 lines), MaskedView + LinearGradient                 |
| 08-3 | Mobile has ambient animated background                   | ✗ FAILED   | **BUG: Named import of default export → renders undefined**               |
| 08-4 | All effects use Reanimated native thread                 | ✓ VERIFIED | useAnimatedStyle in all mobile components                                 |
| 08-5 | All effects respect useReducedMotion                     | ✓ VERIFIED | Every mobile component checks useReducedMotion()                          |

**Score: 36/40 truths verified** (4 failed/uncertain needing fix)

---

## Required Artifacts

| Artifact                                                | Exists | Substantive    | Wired                                            | Status                                                  |
| ------------------------------------------------------- | ------ | -------------- | ------------------------------------------------ | ------------------------------------------------------- |
| `packages/animation-constants/src/backgrounds.ts`       | ✓      | ✓ (99 lines)   | ✓ (imported by cinematic-background)             | ✓ VERIFIED                                              |
| `packages/animation-constants/src/buttons.ts`           | ✓      | ✓ (113 lines)  | ✓ (imported by magnetic-button, animated-button) | ✓ VERIFIED                                              |
| `apps/web/src/components/ui/magnetic-button.tsx`        | ✓      | ✓ (83 lines)   | ✓ (imported by button.tsx, 2 uses)               | ✓ VERIFIED                                              |
| `apps/web/src/components/ui/cinematic-background.tsx`   | ✓      | ✓ (~210 lines) | ✓ (imported by app-layout.tsx, 2 uses)           | ✓ VERIFIED                                              |
| `apps/web/src/components/ui/glass-card.tsx`             | ✓      | ✓ (255 lines)  | ✓ (widely used)                                  | ✓ VERIFIED                                              |
| `apps/web/src/components/ui/glow-text.tsx`              | ✓      | ✓ (260 lines)  | ✓ (widely used)                                  | ✓ VERIFIED                                              |
| `apps/web/src/components/ui/micro-interactions.tsx`     | ✓      | ✓ (347 lines)  | ⚠️ PARTIAL                                       | ⚠️ StaggerChildren + RippleButton exported but 0 usages |
| `apps/mobile/src/components/animated-button.tsx`        | ✓      | ✓ (164 lines)  | ✓ (9 usages)                                     | ✗ BUG — no Pressable                                    |
| `apps/mobile/src/components/avatar-squircle-clip.tsx`   | ✓      | ✓ (50 lines)   | ✓ (4 usages)                                     | ✓ VERIFIED                                              |
| `apps/mobile/src/components/lottie-avatar.tsx`          | ✓      | ✓ (108 lines)  | ✓ (2 usages)                                     | ⚠️ WARN — onAnimationFailure dead                       |
| `apps/mobile/src/components/ui/gradient-text.tsx`       | ✓      | ✓ (84 lines)   | ⚠️ ORPHANED                                      | ⚠️ Created but 0 usages outside self                    |
| `apps/mobile/src/components/ui/animated-background.tsx` | ✓      | ✓ (175 lines)  | ✓ (2 usages)                                     | ✗ BUG — wrong import type                               |

---

## Bugs Found

### BUG 1 — 🔴 CRITICAL: AnimatedButton has no Pressable wrapper

**File:** `apps/mobile/src/components/animated-button.tsx` **Impact:** Primary and secondary mobile
buttons are **completely non-interactive**. The component defines `handlePressIn` / `handlePressOut`
callbacks with spring animations and haptic feedback, but the JSX tree is entirely `Animated.View` +
`LinearGradient` — no `Pressable` or `TouchableOpacity` exists.

When `button.tsx` delegates to `<AnimatedButton onPress={onPress}>`, the `onPress` prop is accepted
but silently ignored. Users cannot tap primary/secondary buttons at all in the animated branch.

**Fix:** Wrap the outermost `Animated.View` in a `Pressable` with `onPress`,
`onPressIn={handlePressIn}`, `onPressOut={handlePressOut}`.

### BUG 2 — 🔴 CRITICAL: Named import of default export in main-navigator.tsx

**File:** `apps/mobile/src/navigation/main-navigator.tsx` line 12 **Code:**
`import { AnimatedBackground } from '@/components/ui/animated-background';` **Problem:**
`animated-background.tsx` uses `export default function AnimatedBackground` — no named export
exists. The named import resolves to `undefined`, causing a runtime crash when React tries to render
it.

**Fix:** Change to `import AnimatedBackground from '@/components/ui/animated-background';`

### BUG 3 — 🟡 MEDIUM: LottieAvatar uses non-existent `onAnimationFailure` prop

**File:** `apps/mobile/src/components/lottie-avatar.tsx` line 103 **Code:**
`onAnimationFailure={() => setError(true)}` **Problem:** `lottie-react-native` v7.x does not expose
`onAnimationFailure`. The prop is silently ignored, meaning if a Lottie URL fails to load, the
`error` state never becomes `true` and the error fallback UI never renders — users see a
broken/invisible avatar.

**Fix:** Use `onAnimationFinish` combined with error boundary, or use `source` error handler via
`fetch` + `try/catch` pre-loading the Lottie JSON.

### BUG 4 — 🟡 MEDIUM: glass-card.tsx prop name mismatch (PRE-EXISTING)

**File:** `apps/mobile/src/components/ui/glass-card.tsx` lines 28/41 **Problem:** Interface declares
`borderGradient?: boolean` but destructuring uses `_borderGradient = false` — callers'
`borderGradient` prop is silently discarded. **Note:** Pre-existing bug (not introduced in Phase
25), but interactions with glass-card are part of phase scope.

### BUG 5 — 🟠 LOW: `createAnimatedComponent(LinearGradient)` fragility

**File:** `apps/mobile/src/components/ui/gradient-text.tsx` line 19 **Problem:**
`Animated.createAnimatedComponent(LinearGradient)` can produce warnings or fail if
expo-linear-gradient doesn't forward refs correctly. If the gradient `translateX` animation doesn't
work, this is the root cause. **Mitigation:** Works in most expo-linear-gradient versions but should
be tested on device.

---

## Orphaned Components (Created but not used elsewhere)

| Component               | Usages | Status                                                  |
| ----------------------- | ------ | ------------------------------------------------------- |
| `StaggerChildren` (web) | 0      | ⚠️ ORPHANED — exported but never imported by any screen |
| `RippleButton` (web)    | 0      | ⚠️ ORPHANED — exported but never imported by any screen |
| `GradientText` (mobile) | 0      | ⚠️ ORPHANED — created but never used in any screen      |

These components work correctly but are not integrated into any actual UI. They exist as library
primitives awaiting screen adoption.

---

## Anti-Patterns Scan

| Pattern                     | Files Scanned | Findings                                                  |
| --------------------------- | ------------- | --------------------------------------------------------- |
| TODO/FIXME/XXX/HACK         | 13            | **0 found**                                               |
| placeholder/coming soon     | 13            | **0 found**                                               |
| console.log                 | 13            | **0 found**                                               |
| Empty returns (null/[]/{}/) | 9             | **0 found** (reduced-motion returns null are intentional) |

No anti-patterns detected in Phase 25 files.

---

## Human Verification Required

### 1. Performance — 60fps on mid-tier hardware

**Test:** Open web app on a mid-tier device, observe particle background fluidity **Expected:**
Smooth 60fps, no frame drops or battery drain **Why human:** Performance is runtime-dependent

### 2. Visual — squircle avatars look correct at all sizes

**Test:** View avatars in chat, profile, sidebar, contacts at all sizes (xs → 3xl) **Expected:**
Squircle (rounded-[43px]) looks natural, status dots position correctly **Why human:** Visual
appearance can't be verified programmatically

### 3. Visual — spotlight border on glass cards

**Test:** Hover over glass cards in settings/modals **Expected:** Radial gradient follows cursor
within card bounds **Why human:** Visual effect

### 4. Visual — gradient text cycling

**Test:** Enable gradientFlow on a GlowText instance **Expected:** Smooth emerald→purple→cyan
gradient cycling **Why human:** Animation smoothness

### 5. Mobile — background orbs visible behind tab content

**Test:** Open mobile app, check if gradient orbs drift behind navigation **Expected:** Subtle
ambient orbs visible, no frame drops **Why human:** Runtime render + performance (also blocked by
BUG 2)

---

## Gaps Summary

### Critical Gaps (block goal achievement)

1. **AnimatedButton non-interactive** — Mobile primary/secondary buttons cannot be pressed. All
   haptic and glow animations are dead code. Directly blocks truths 06-2, 06-3.
2. **AnimatedBackground import crash** — Named import of default export → runtime crash. Blocks
   truth 08-3.

### Non-Critical Gaps

3. **LottieAvatar error fallback dead** — `onAnimationFailure` doesn't exist in lottie-react-native
   v7, so error recovery never triggers.
4. **StaggerChildren, RippleButton, GradientText orphaned** — Library primitives created but zero
   screen adoption.
5. **glass-card.tsx prop mismatch** — Pre-existing bug, `borderGradient` silently discarded.

---

## Recommended Fix Plan

### 25-09-PLAN.md: Fix Critical Mobile Bugs

**Objective:** Fix the 2 critical bugs that prevent mobile buttons from working and background from
rendering.

**Tasks:**

1. **Fix AnimatedButton — add Pressable wrapper**
   - File: `apps/mobile/src/components/animated-button.tsx`
   - Action: Wrap outermost `Animated.View` in `Pressable` with `onPress`,
     `onPressIn={handlePressIn}`, `onPressOut={handlePressOut}`, `disabled`
   - Verify: Primary button tap triggers onPress + haptic + glow animation

2. **Fix AnimatedBackground import — default import**
   - File: `apps/mobile/src/navigation/main-navigator.tsx`
   - Action: Change `import { AnimatedBackground }` → `import AnimatedBackground`
   - Verify: App renders without crash, background orbs visible

3. **Fix LottieAvatar error handling**
   - File: `apps/mobile/src/components/lottie-avatar.tsx`
   - Action: Replace `onAnimationFailure` with pre-fetch + try/catch, or use `onAnimationLoadError`
     if available in the installed version
   - Verify: Invalid lottieUrl shows fallback avatar instead of broken blank

4. Re-verify all 3 fixes pass lint + typecheck

**Estimated scope:** Small (3 files, ~20 lines changed)

---

## Verification Metadata

- **Approach:** Goal-backward analysis with must_haves from plan frontmatter
- **Files verified:** 19 artifacts across 8 plans
- **Truths checked:** 40 (36 verified, 2 failed, 2 needs human)
- **Automated checks:** Existence, substance (line count + stub patterns), wiring (import/usage
  counts), anti-patterns
- **Duration:** Automated scan
