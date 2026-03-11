# Plan 16-05 Summary: Cosmetics Rendering, Animated Borders & Title Propagation

**Status:** COMPLETE **Commits:** 8 tasks, 8 commits

## Completed Tasks

### Task 1 — Animated border CSS keyframes (11 types)

- **Commit:** `5acf558c`
- 11 animated CSS keyframes: pulse, rotate, shimmer, wave, breathe, spin, rainbow, particles, glow,
  flow, spark
- Types `none` and `static` handled in React component (no CSS needed)
- ALL animations use only GPU-composited properties: transform, opacity, filter
- `contain: layout style`, `will-change: transform` for performance
- `@media (prefers-reduced-motion: reduce)` disables all animations
- CSS custom properties (`--border-color`) for customizable colors

### Task 2 — AnimatedBorder and BorderRenderer React components

- **Commit:** `435c95c1`
- `AnimatedBorder` applies CSS class per animation type with reduced-motion detection
- `BorderRenderer` resolves AvatarBorder data to AnimatedBorder props
- Barrel export from avatar-border/index.tsx

### Task 3 — Integrate animated borders into shared Avatar component

- **Commit:** `c839e6c5`
- Added optional `equippedBorder` prop to ThemedAvatar component
- Wraps with `BorderRenderer` when border present
- Zero breaking changes — prop is optional, existing usage unchanged

### Task 4 — Cosmetic preview modal

- **Commit:** `210f4acc`
- Large preview with user's actual avatar + animated border
- In-context preview showing how border looks in a message bubble
- Border details: name, rarity badge, animation type
- Purchase button with coin cost

### Task 5 — InlineTitle and TitleDisplay components

- **Commit:** `20e4ae97`
- `InlineTitle`: lightweight inline title with rarity-based gradients
- Rarity hierarchy: common (gray), uncommon (green), rare (blue), epic (purple gradient), legendary
  (gold gradient), mythic (pink→purple), unique (rainbow)
- `TitleDisplay`: full card for profile views with rarity border and icon
- ~20 DOM nodes for InlineTitle (designed for frequent rendering)

### Task 6 — Title propagation into message bubbles and forum posts

- **Commit:** `ebb1cb11`
- Message bubble header: `<InlineTitle>` after sender name + `equippedBorder` on avatar
- Forum comment header: `<InlineTitle>` after author name + `equippedBorder` on avatar
- Null handling — graceful rendering when user has no title/border

### Task 7 — Mobile animated border with Reanimated

- **Commit:** `9f0bac9d`
- React Native Reanimated + SVG for 60fps border animations
- All 13 types supported (11 animated + none/static passthrough)
- `useReducedMotion()` respects accessibility preferences
- Mobile Avatar component enhanced with optional `equippedBorder` prop

### Task 8 — Mobile InlineTitle with rarity gradients

- **Commit:** `4b73de6e`
- Mobile InlineTitle using solid colors for common→rare, LinearGradient + MaskedView for epic+
- Size variants: sm (10px), md (12px), lg (14px)
- Barrel export added to gamification components index

## Architecture

```
Border Rendering Pipeline:
  AvatarBorder schema (13 types) → BorderRenderer → AnimatedBorder
    → CSS class applied (11 animated types)
    → `none`/`static` render without animation class
    → prefers-reduced-motion: no animation class

Avatar Integration:
  <Avatar equippedBorder={border}>
    └── <BorderRenderer border={border} size={size}>
          └── <AnimatedBorder animationType={type} borderColor={color}>

Title Propagation:
  Message Bubble: [Avatar+Border] [Username] [InlineTitle]
  Forum Post:     [Avatar+Border] [Author]   [InlineTitle]
  Leaderboard:    [Avatar+Border] [Rank] [Name] [InlineTitle]
  Profile:        [Avatar+Border] [TitleDisplay]

Mobile:
  AnimatedBorder → Reanimated + SVG (60fps native)
  InlineTitle → LinearGradient + MaskedView (epic+) | solid Text (common-rare)
```

## Verification

- All 11 animated CSS types use only transform/opacity/filter (zero layout-triggering properties)
- prefers-reduced-motion disables all animations
- Avatar component renders equipped border app-wide without breaking existing usage
- Titles display in message bubbles, forum posts, profile cards
- Mobile borders use Reanimated for native 60fps
- Mobile titles render with rarity-appropriate styling
