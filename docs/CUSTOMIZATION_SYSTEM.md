# CGraph Customization System — Complete Reference

> Generated: 2026-03-09 | Covers: `apps/web/src/pages/customize/`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Category: Identity](#2-identity-customization)
3. [Category: Themes](#3-theme-customization)
4. [Category: Chat Styling](#4-chat-styling-customization)
5. [Category: Effects](#5-effects-customization)
6. [Category: Progression](#6-progression-gamification-hub)
7. [Live Preview Panel](#7-live-preview-panel)
8. [Store Properties — Full Inventory](#8-store-properties--full-inventory)
9. [Rendering Pipeline Map](#9-rendering-pipeline-map)
10. [Known Issues & Dead Code](#10-known-issues--dead-code)
11. [Feature Combination Matrix](#11-feature-combination-matrix)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Customize Page (/customize)                                │
│  ┌──────────┐ ┌──────────────────────────────────────────┐  │
│  │ Sidebar  │ │ Active Category Content                  │  │
│  │          │ │                                          │  │
│  │ Identity │ │  ┌─────────────────┐ ┌───────────────┐  │  │
│  │ Themes   │ │  │ Feature Grid    │ │ Live Preview  │  │  │
│  │ Chat     │ │  │ (selection UI)  │ │ Panel         │  │  │
│  │ Effects  │ │  │                 │ │               │  │  │
│  │ Progress │ │  │ 7 sub-tabs      │ │ Profile Card  │  │  │
│  │          │ │  │ (Identity)      │ │ Chat Bubbles  │  │  │
│  │          │ │  │ 4 sub-tabs      │ │ Theme Preview │  │  │
│  │          │ │  │ (Chat/Effects)  │ │               │  │  │
│  └──────────┘ │  └────────┬────────┘ └───────┬───────┘  │  │
│               └───────────┼──────────────────┼──────────┘  │
└───────────────────────────┼──────────────────┼─────────────┘
                            │                  │
                    ┌───────▼──────────────────▼───────┐
                    │    useCustomizationStore (Zustand) │
                    │    46 state properties             │
                    │    12 legacy aliases               │
                    │    40+ action methods              │
                    └───────────────┬───────────────────┘
                                    │
                    ┌───────────────▼───────────────────┐
                    │  API: POST /api/v1/settings/       │
                    │  customizations                    │
                    └───────────────────────────────────┘
```

**Store:** `useCustomizationStore` — single Zustand store at `modules/settings/store/customization/`
**Persistence:** `fetchCustomizations()` / `saveCustomizations()` via REST API
**Live Preview:** `modules/settings/components/customize/live-preview-panel/`

---

## 2. Identity Customization

**Page:** `pages/customize/identity-customization/identity-customization.tsx`
**Hook:** `pages/customize/identity-customization/useIdentityCustomization.ts`
**Sub-tabs:** 7

### 2.1 Avatar Borders

| Property | Details |
|----------|---------|
| **Store keys** | `avatarBorderType`, `avatarBorderColor`, `selectedBorderId`, `selectedBorderTheme` |
| **Data source** | API `GET /api/v1/cosmetics/borders` → fallback to `ALL_BORDERS` from `data/borderCollections.ts` |
| **Item count** | **86 borders** across 9 themes (8-Bit, Japanese, Anime, Cyberpunk, Gothic, Kawaii, Elemental, Cosmic, Special) |
| **UI component** | `sections/borders-section.tsx` → `themed-border-card/themed-border-card.tsx` |
| **Preview rendering** | `AnimatedAvatar` → `renderBorderEffect()` for CSS types / `LottieBorderRenderer` for Lottie types |
| **Profile rendering** | `components/ui/avatar.tsx` → wraps in `LottieBorderRenderer` when border has `lottieFile` |
| **Affects** | Live preview avatar, profile avatar, chat avatar |

**Border types (AvatarBorderType):**

| Type | Rendering | Examples |
|------|-----------|---------|
| `none` | No border | Free borders |
| `static` | Solid colored ring | Basic borders |
| `glow` | CSS box-shadow pulse | Shimmer borders |
| `pulse` | CSS scale animation | Pulse borders |
| `rotate` | CSS gradient rotation | Orbit, holographic |
| `fire` | CSS flame particles | Inferno borders |
| `ice` | CSS crystal particles | Frost borders |
| `electric` | CSS spark arcs | Storm borders |
| `legendary` | Multi-layer CSS aura | Aurora, particles |
| `mythic` | CSS void warp | Void, dark borders |
| `lottie` | Lottie JSON animation | Avatar Frame, Profile Frame, some theme+rarity combos |

**Lottie border pipeline:**
```
Border selection → border.lottieFile exists?
  YES → type = 'lottie' → LottieBorderRenderer (CSS mask cuts avatar hole)
  NO  → type = getV2BorderType(animationType) → CSS renderBorderEffect()
```

**Available Lottie border map entries (40):** 8bit (4), anime (5), cosmic (5), cyberpunk (5), elemental (6), gothic (4), japanese (4), kawaii (3), special (2 — avatar-frame.json, profile-frame.json), avatar_frame (1), profile_frame (1)

### 2.2 Titles

| Property | Details |
|----------|---------|
| **Store keys** | `equippedTitle` (alias: `title`) |
| **Data source** | API `GET /api/v1/cosmetics/titles` → fallback to `ALL_TITLES` from `data/titlesCollection.ts` |
| **Item count** | **26 titles** across 6 rarities |
| **UI component** | `sections/titles-section.tsx` |
| **Preview rendering** | `ProfileContent` renders title text with `gradient` CSS and optional animation |
| **Affects** | Profile card title line |

**Title animation types:** none, fade, glow, pulse, shimmer, rainbow, typing, glitch, wave, bounce, neon-flicker

**Title examples:**
- Free (2): Newbie, Member
- Common (4): Adventurer, Chatterbox, Early Bird, Night Owl
- Rare (5): Veteran, Collector, Forum Master, Moderator, Social Butterfly
- Epic (6): Elite, Champion, Beta Tester, Speedrunner, PvP Master, VIP
- Legendary (5): Legend, Founder, Administrator, Completionist, No-Lifer
- Mythic (4): God, Immortal, Cosmic Entity, Mythic Hero

### 2.3 Badges

| Property | Details |
|----------|---------|
| **Store keys** | `equippedBadges` (string[], max 5) |
| **Data source** | API `GET /api/v1/cosmetics/badges` → fallback to `ALL_BADGES` from `data/badgesCollection.ts` |
| **Item count** | **36 badges** across 5 rarities |
| **UI component** | `sections/badges-section.tsx` |
| **Preview rendering** | `ProfileContent` resolves via `resolveEquippedBadges()` from mappings |
| **Affects** | Profile card badge row (up to 5 shown) |

### 2.4 Profile Layouts

| Property | Details |
|----------|---------|
| **Store keys** | `profileCardStyle` (alias: `profileLayout`) |
| **Data source** | Hardcoded in `identity-customization/constants.ts` |
| **Item count** | **7 layouts** (5 unlocked, 2 locked) |
| **UI component** | `sections/layouts-section.tsx` |
| **Preview rendering** | Sets `ProfileCardStyle` type which affects card structure |
| **Affects** | Profile card layout/arrangement |

**Layouts:** Classic, Modern, Compact, Showcase, Gaming (all unlocked), Professional, Artistic (locked)

### 2.5 Name Styles

| Property | Details |
|----------|---------|
| **Store keys** | `displayNameFont`, `displayNameEffect`, `displayNameColor`, `displayNameSecondaryColor` |
| **Data source** | Registries from `@cgraph/animation-constants`: `NAME_FONTS` (8), `NAME_EFFECTS` (5), `NAME_COLORS` (12) in `registries/displayNameStyles.ts` |
| **UI component** | `sections/name-styles-section.tsx` |
| **Preview rendering** | `ProfileContent` renders with `GlowText`/`FireText` based on effect |
| **Affects** | Display name appearance in profile card |

**Fonts:** default, serif, rounded, bold_italic, condensed, display, mono, handwritten
**Effects:** solid, gradient, neon, toon, pop
**Colors:** 12 preset colors + custom secondary color for gradients

### 2.6 Nameplates

| Property | Details |
|----------|---------|
| **Store keys** | `equippedNameplate` |
| **Data source** | `NAMEPLATE_REGISTRY` from `@cgraph/animation-constants/registries/nameplates.ts` |
| **Item count** | **24 nameplates** across 6 rarities (free → mythic) |
| **UI component** | `sections/nameplates-section.tsx` |
| **Preview rendering** | Store key passed to `ProfileContent` via settings — **partially wired** |
| **Affects** | Name banner/bar behind display name (Lottie background, text effects, emblems, particles, border) |

**Nameplate features per entry:** lottieFile, textColor, textEffect (11 types), textColorSecondary, emblem, particleType (10 types), barGradient, borderStyle (6 types), borderColor

**Examples:** None, Shadow, Starter, Gold, Sakura, Ocean Wave, Silver, Cyber Bar, Flame, Galaxy, Frost, Forest Spirit, Love, Void, Aurora Borealis, Thunder, Blood Moon, Divine, Phoenix, Dragon Scale, Eternal Frost, Cosmic Sovereign, Inferno Lord, Void Emperor

### 2.7 Profile Effects

| Property | Details |
|----------|---------|
| **Store keys** | `equippedProfileEffect` |
| **Data source** | `PROFILE_EFFECT_REGISTRY` from `@cgraph/animation-constants/registries/profileEffects.ts` |
| **Item count** | **12 effects** (1 none + 11 active effects) |
| **UI component** | `sections/profile-effects-section.tsx` |
| **Preview rendering** | Store key passed to `ProfileContent` via settings — **partially wired** |
| **Affects** | Overlay Lottie animation on profile card |

**Effects:** None, Sparkle, Autumn Leaves, Snowfall, Fireflies, Sakura Drift, The Magician, Neon Rain, Galaxy Drift, Fire Vortex, Divine Light, Void Rift

---

## 3. Theme Customization

**Page:** `pages/customize/theme-customization/page.tsx`
**Hook:** `pages/customize/theme-customization/hooks.ts`
**Sub-tabs:** 4

### 3.1 Profile Themes

| Property | Details |
|----------|---------|
| **Store keys** | `profileTheme` / `selectedProfileThemeId`, `profileThemePresetId`, `profileThemePrimary`, `profileThemeAccent`, `themePreset`, `avatarBorderColor` |
| **Data source** | **TWO parallel systems:** (1) API `fetchThemes()` → legacy `Theme[]` grid, (2) `ALL_PROFILE_THEMES` from `data/profileThemes.ts` via `ProfileThemePicker` |
| **Item count** | **18 themes** across 6 categories (3 per category) |
| **Preview rendering** | Applies background gradient, particles, overlays, glow to profile card |
| **Affects** | Profile card background, accent colors, particles |

**Categories & themes:**
| Category | Themes |
|----------|--------|
| 8-Bit | Arcade, Neon, Dreams |
| Japanese | Zen, Sakura, Wave |
| Anime | Power, Mystic, Hero |
| Cyberpunk | City, Matrix, Pulse |
| Gothic | Shadow, Blood, Void |
| Kawaii | Pastel, Candy, Rainbow |

**Theme config features:** backgroundGradient, backgroundAnimation, backgroundAnimationDuration, particleType (16 types), particleCount/Colors/Speed, overlayType (7 types), overlayOpacity, glowEnabled/Color/Intensity, accentPrimary/Secondary, textColor, tier, unlock requirements

### 3.2 Chat Themes

| Property | Details |
|----------|---------|
| **Store keys** | `chatTheme` / `chatBubbleColor` |
| **Data source** | API `fetchThemes()` filtered by `category === 'chat'` |
| **Preview rendering** | Changes chat bubble accent color via `ThemePreset` |
| **Affects** | Chat bubble colors |

### 3.3 Forum Themes

| Property | Details |
|----------|---------|
| **Store keys** | `forumTheme` |
| **Data source** | API `fetchThemes()` filtered by `category === 'forum'` |
| **Preview rendering** | **No preview panel exists** — applied when viewing actual forums |
| **Affects** | Forum page styling (unverified) |

### 3.4 App Themes

| Property | Details |
|----------|---------|
| **Store keys** | `appTheme` / `themePreset` |
| **Data source** | API `fetchThemes()` filtered by `category === 'app'` |
| **Preview rendering** | Changes global `ThemePreset` (8 color schemes) |
| **Affects** | App-wide accent colors |

**ThemePreset values (8):** emerald, purple, cyan, orange, pink, gold, crimson, arctic

---

## 4. Chat Styling Customization

**Page:** `pages/customize/chat-customization/page.tsx`
**Hook:** `pages/customize/chat-customization/useChatCustomization.ts`
**Sub-tabs:** 4

### 4.1 Bubble Styles

| Property | Details |
|----------|---------|
| **Store keys** | `chatBubbleStyle` (alias: `bubbleStyle`) |
| **Data source** | Hardcoded `BUBBLE_STYLES` in `chat-customization/constants.ts` |
| **Item count** | **9 styles** |
| **Preview rendering** | Chat preview panel renders bubble shape |
| **Affects** | Chat message bubble shape/appearance |

**Styles:** Default Rounded, Pill Shape, Sharp Corners, Asymmetric, Aero, Compact, Glassmorphic, Neon Glow, Comic Book

### 4.2 Message Effects

| Property | Details |
|----------|---------|
| **Store keys** | `bubbleEntranceAnimation` (alias: `messageEffect`) |
| **Data source** | Hardcoded `MESSAGE_EFFECTS` in `chat-customization/constants.ts` |
| **Item count** | **8 effects** |
| **Preview rendering** | Entrance animation for new messages |
| **Affects** | How new chat messages animate in |

**Effects:** No Animation, Fade In, Slide In, Bounce, Scale Pop, Rotate In, Typewriter, Glitch Effect

### 4.3 Reaction Styles

| Property | Details |
|----------|---------|
| **Store keys** | `reactionStyle` |
| **Data source** | Hardcoded `REACTION_STYLES` in `chat-customization/constants.ts` |
| **Item count** | **7 styles** (Bounce, Pop, Spin, Pulse, Shake, Float Up, Explode) |
| **UI component** | `reaction-styles-section.tsx` |
| **Preview rendering** | **NOT WIRED** — no rendering pipeline connects this to actual reactions |
| **Status** | ⚠️ **DEAD FEATURE** — value saved to store but never consumed |

### 4.4 Advanced Controls

| Property | Details |
|----------|---------|
| **Store keys** | `bubbleBorderRadius`, `bubbleShadowIntensity`, `bubbleGlassEffect`, `bubbleShowTail`, `bubbleHoverEffect`, `bubbleEntranceAnimation` |
| **UI component** | `advanced-controls-section.tsx` |
| **Preview rendering** | Partially wired — some controls affect chat bubble demo |
| **Affects** | Fine-grained bubble appearance tweaks |

---

## 5. Effects Customization

**Page:** `pages/customize/effects-customization/effects-customization.tsx`
**Hook:** `pages/customize/effects-customization/useEffectsCustomization.ts`
**Sub-tabs:** 3

### 5.1 Particle Effects

| Property | Details |
|----------|---------|
| **Store keys** | `particleEffect`, `effectPreset`, `particlesEnabled` |
| **Data source** | Hardcoded `PARTICLE_EFFECTS` in `effects-customization/constants.ts` |
| **Item count** | **12 effects** |
| **Preview rendering** | `ParticleField` component in profile card preview |
| **Affects** | Profile card floating particles |

**Effects:** None, Falling Snow, Confetti, Twinkling Stars, Fireflies, Rising Bubbles, Cherry Blossoms, Matrix Rain, Magic Sparkles, Rising Flames, Autumn Leaves, Floating Hearts

**⚠️ OVERLAP with Identity → Profile Effects:** Both add particle/overlay visuals to the profile card but use different store keys (`particleEffect` + `effectPreset` vs `equippedProfileEffect`), different data sources (hardcoded CSS vs Lottie registry), and different rendering pipelines.

### 5.2 Background Effects

| Property | Details |
|----------|---------|
| **Store keys** | `backgroundEffect`, `animatedBackground` |
| **Data source** | Hardcoded `BACKGROUND_EFFECTS` in `effects-customization/constants.ts` |
| **Item count** | **10 effects** |
| **Preview rendering** | **MINIMAL** — only toggles `animatedBackground` boolean; rich background config (CSS gradients, waves, mesh) is NOT passed to preview |
| **Status** | ⚠️ **PARTIALLY DEAD** — UI lets you pick effects but only animated/not-animated is stored |

**Effects:** Solid Dark, Static Gradient, Animated Gradient, Wave Motion, Particle Web, Aurora Borealis, Space Nebula, Mesh Gradient, Cyber Grid, Holographic

### 5.3 UI Animation Speed

| Property | Details |
|----------|---------|
| **Store keys** | `animationSpeed` |
| **Data source** | Hardcoded `ANIMATION_SETS` in `effects-customization/constants.ts` |
| **Item count** | **8 presets** |
| **Preview rendering** | `speedMultiplier` affects animation durations in preview |
| **Affects** | Global animation speed across all effects |

**Presets:** Instant, Fast & Snappy, Normal, Smooth, Bouncy, Elastic, Cinematic, Gaming

---

## 6. Progression (Gamification Hub)

**Page:** `pages/customize/progression-customization/progression-customization.tsx`
**Sub-tabs:** 4 (Achievements, Leaderboards, Quests, Daily Rewards)

| Property | Details |
|----------|---------|
| **Store** | Uses `useGamificationStore` (NOT `useCustomizationStore`) |
| **Data source** | API calls (`fetchAchievementsList`, `fetchLeaderboard`, `fetchQuestsList`, `fetchDailyRewards`) |
| **Affects** | **NOTHING visual** — read-only display of gamification progress |
| **Status** | ⚠️ **NOT actually customization** — it's a gamification dashboard placed in the customize section |

---

## 7. Live Preview Panel

**Component:** `modules/settings/components/customize/live-preview-panel/`

### Available Preview Panels

| Panel | File | Used By |
|-------|------|---------|
| Profile Card Preview | `profile-card-preview.tsx` → `profile-content.tsx` | Identity, Themes |
| Chat Bubble Demo | `chat-panel.tsx` → `chat-bubble-demo.tsx` | Chat Styling |
| Avatar Panel | `panels/avatar-panel.tsx` | Identity (borders) |
| Theme Panel | `panels/theme-panel.tsx` | Themes |
| Profile Panel | `panels/profile-panel.tsx` | Identity (layouts) |

### What the Profile Card Preview Actually Renders

```
ProfileCardPreview reads from store:
├── Avatar with border (AnimatedAvatar)
│   ├── borderType → CSS effect OR Lottie frame
│   ├── borderColor → ThemePreset colors
│   ├── lottieUrl → from getBorderById().lottieFile
│   └── avatar image / initials
├── Display Name (GlowText / FireText / gradient)
│   ├── displayNameFont
│   ├── displayNameEffect
│   ├── displayNameColor / displayNameSecondaryColor
│   └── equippedNameplate (partially wired)
├── Title line
│   ├── equippedTitle → gradient CSS
│   └── isLegendaryTitle → extra glow
├── Badge row (max 5)
│   └── equippedBadges → resolveEquippedBadges()
├── Status indicator
│   └── showStatus toggle
├── Particles overlay
│   ├── particlesEnabled + particleEffect → CSS particles
│   └── activeProfileTheme?.particleType → theme particles
├── Background
│   ├── profileTheme → gradient + overlay
│   └── glowEnabled → box-shadow pulse
└── Profile theme preset
    ├── profileThemePresetId → ProfileThemeConfig
    ├── profileThemePrimary / profileThemeAccent
    └── Background + particles + overlays from config
```

---

## 8. Store Properties — Full Inventory

### Actually Used (affect rendering)

| Store Key | Type | Default | Where Rendered |
|-----------|------|---------|----------------|
| `themePreset` | ThemePreset | `'emerald'` | Global accent color, preview colors |
| `effectPreset` | EffectPreset | `'glassmorphism'` | Profile card effect style |
| `animationSpeed` | AnimationSpeed | `'normal'` | All animation durations |
| `particlesEnabled` | boolean | `true` | Profile card particle overlay |
| `glowEnabled` | boolean | `true` | Profile card glow shadow |
| `blurEnabled` | boolean | `true` | Blur effects on panels |
| `avatarBorderType` | AvatarBorderType | `'glow'` | Avatar border CSS effect |
| `avatarBorderColor` | ThemePreset | `'emerald'` | Avatar border colors |
| `avatarSize` | string | `'medium'` | Avatar dimensions |
| `selectedBorderId` | string \| null | `null` | Specific border lookup for Lottie |
| `chatBubbleStyle` | ChatBubbleStyle | `'default'` | Chat bubble shape |
| `chatBubbleColor` | ThemePreset | `'emerald'` | Chat bubble accent |
| `bubbleBorderRadius` | number | `16` | Chat bubble radius |
| `bubbleShadowIntensity` | number | `30` | Chat bubble shadow |
| `bubbleEntranceAnimation` | BubbleAnimation | `'fade'` | Message entrance animation |
| `bubbleGlassEffect` | boolean | `true` | Glass effect on bubbles |
| `bubbleShowTail` | boolean | `true` | Bubble tail arrow |
| `bubbleHoverEffect` | boolean | `true` | Bubble hover animation |
| `profileCardStyle` | ProfileCardStyle | `'default'` | Profile card layout variant |
| `showBadges` | boolean | `true` | Badge row visibility |
| `showStatus` | boolean | `true` | Status dot visibility |
| `equippedTitle` | string \| null | `null` | Title in profile card |
| `equippedBadges` | string[] | `[]` | Badges in profile card |
| `displayNameFont` | string | `'default'` | Name font family |
| `displayNameEffect` | string | `'solid'` | Name text effect |
| `displayNameColor` | string | `'#ffffff'` | Name text color |
| `displayNameSecondaryColor` | string \| null | `null` | Name gradient second color |
| `selectedProfileThemeId` | string \| null | `null` | Active profile theme |
| `profileThemePresetId` | string \| null | `null` | New profile theme preset |
| `profileThemePrimary` | string \| null | `null` | Theme primary color |
| `profileThemeAccent` | string \| null | `null` | Theme accent color |

### Partially Used (stored but minimal rendering)

| Store Key | Type | Default | Issue |
|-----------|------|---------|-------|
| `equippedNameplate` | string \| null | `null` | Value reaches ProfileContent but nameplate visual rendering is incomplete |
| `equippedProfileEffect` | string \| null | `null` | Value reaches ProfileContent but Lottie overlay rendering is incomplete |
| `animatedBackground` | boolean | `false` | Only a toggle — the rich bg effect selection is lost |
| `particleEffect` | string \| null | `null` | Mapped through lossy `PARTICLE_ID_TO_EFFECT` — 12 particles collapse to 6 presets |

### Dead / Unused (stored but never consumed by rendering)

| Store Key | Type | Default | Issue |
|-----------|------|---------|-------|
| `showBio` | boolean | `true` | Toggle exists but preview doesn't conditionally show/hide bio |
| `glowEffects` | boolean | `true` | Overlaps with `glowEnabled` — unclear which is read |
| `particleEffects` | boolean | `false` | Overlaps with `particlesEnabled` — unclear which is read |
| `selectedBorderTheme` | string \| null | `null` | Used for filter state only, not rendering |
| `groupMessages` | boolean | `true` | Chat UX preference, not customization |
| `showTimestamps` | boolean | `true` | Chat UX preference, not customization |
| `compactMode` | boolean | `false` | Chat UX preference, not customization |

> **Note:** `reactionStyle`, `forumTheme`, `backgroundEffect`, and `particleEffect` are listed under Legacy Aliases above but also function as dead features — they are stored but have no rendering pipeline.

### Legacy Aliases (12 — all duplicate other keys)

| Alias | Points To | Should Use Instead |
|-------|-----------|-------------------|
| `chatTheme` | `chatBubbleColor` | `chatBubbleColor` |
| `bubbleStyle` | `chatBubbleStyle` | `chatBubbleStyle` |
| `messageEffect` | `bubbleEntranceAnimation` | `bubbleEntranceAnimation` |
| `avatarBorder` | `avatarBorderType` | `avatarBorderType` |
| `title` | `equippedTitle` | `equippedTitle` |
| `profileLayout` | `profileCardStyle` | `profileCardStyle` |
| `profileTheme` | `selectedProfileThemeId` | `selectedProfileThemeId` |
| `particleEffect` | (legacy alias) | `particleEffect` in effects |
| `backgroundEffect` | (legacy alias) | `backgroundEffect` in effects |
| `reactionStyle` | (legacy alias) | `reactionStyle` in chat |
| `forumTheme` | (legacy alias) | `forumTheme` in themes |
| `appTheme` | `themePreset` | `themePreset` |

---

## 9. Rendering Pipeline Map

### Border Selection → Avatar Rendering

```
User clicks border in grid
  │
  ├─ ThemedBorderCard.onSelect()
  │   └─ handleEquipBorder(borderId)
  │       └─ applyBorderToStore(borderId)
  │           ├─ getV2BorderType(border.animationType) → AvatarBorderType
  │           ├─ store.setAvatarBorder(type)
  │           └─ store.selectBorderId(borderId)
  │
  ├─ Live Preview reads:
  │   └─ ProfileCardPreview
  │       ├─ getBorderById(selectedBorderId) → border.lottieFile?
  │       ├─ lottieFile exists → effectiveBorderType = 'lottie'
  │       ├─ no lottieFile → effectiveBorderType = avatarBorderType
  │       └─ AnimatedAvatar(borderType, lottieUrl)
  │           ├─ 'lottie' → LottieBorderRenderer (Lottie JSON + CSS mask)
  │           └─ CSS type → renderBorderEffect() (fire/ice/glow/etc)
  │
  └─ Profile Avatar reads:
      └─ Avatar component
          ├─ getBorderById(borderId) → border.lottieFile?
          ├─ lottieFile exists → LottieBorderRenderer wrapper
          └─ no lottieFile → CSS borderStyle from getAvatarBorderStyle()
```

### Theme Selection → Profile Rendering

```
User selects profile theme
  │
  ├─ store.setProfileTheme(themeId)
  │   ├─ PROFILE_THEME_TO_COLOR[themeId] → ThemePreset → avatar border color
  │   └─ profileTheme state updated
  │
  └─ ProfileCardPreview reads:
      ├─ getThemeById(profileTheme) → ProfileThemeConfig
      ├─ Background: backgroundGradient + backgroundAnimation
      ├─ Particles: particleType + particleCount + particleColors
      ├─ Overlay: overlayType + overlayOpacity
      ├─ Glow: glowEnabled + glowColor + glowIntensity
      └─ Colors: accentPrimary + accentSecondary
```

---

## 10. Known Issues & Dead Code

### Critical Issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Duplicate border mappings** | `BORDER_ID_TO_TYPE` in mappings.ts AND `LEGACY_BORDER_ID_TO_V2_TYPE` in identity constants.ts — identical content | Maintenance burden, divergence risk |
| 2 | **Dual profile theme systems** | Legacy API `Theme[]` grid AND new `ProfileThemeConfig` from data file — toggled by `useNewProfileThemes` boolean | Confusing UX, two parallel rendering paths |
| 3 | **Particle effect overlap** | Identity → "Profile Effects" (Lottie, `equippedProfileEffect`) AND Effects → "Particle Effects" (CSS, `particleEffect`) | Two different features doing the same thing |
| 4 | **Lossy particle mapping** | 12 particles collapse to 6 `EffectPreset` values via `PARTICLE_ID_TO_EFFECT` | Selecting "Snow" vs "Sakura" may produce same preset |
| 5 | **Background effect data loss** | Rich config (waves, aurora, mesh) stored only as `animatedBackground: true/false` | 10 background effects → 1 boolean |

### Dead Features

| Feature | Store Key | Reason Dead |
|---------|-----------|-------------|
| Reaction Styles | `reactionStyle` | No rendering pipeline connects it to actual emoji reactions |
| Forum Themes | `forumTheme` | No preview panel, no confirmed rendering in forum pages |
| Background Effect ID | `backgroundEffect` | Preview only reads `animatedBackground` boolean |
| Show Bio toggle | `showBio` | Preview doesn't conditionally render bio section |

### Store Bloat

| Category | Count | Notes |
|----------|-------|-------|
| Dead/unused properties | 7 | Never consumed by rendering (showBio, glowEffects, particleEffects, selectedBorderTheme, groupMessages, showTimestamps, compactMode) |
| Legacy aliases | 12 | Duplicate canonical properties (4 of which are also dead features) |
| UX preferences (not cosmetic) | 3 | `groupMessages`, `showTimestamps`, `compactMode` (counted in dead above) |
| Sync state | 5 | `isLoading`, `isSaving`, `lastSyncedAt`, `error`, `isDirty` |
| **Total non-rendering** | **24** | Of 58 state properties |

### Progression Tab Misplacement

The Progression tab is a **gamification dashboard** (achievements, leaderboards, quests, daily rewards) that uses `useGamificationStore`, has no save button, and doesn't affect any visual customization. It should be moved to a dedicated Gamification page or merged into the main profile/settings.

---

## 11. Feature Combination Matrix

### What Actually Combines in the Profile Card

```
┌─────────────────────────────────────────────────────────┐
│ Profile Card                                            │
│                                                         │
│  ┌─ Background ─────────────────────────────────────┐   │
│  │ profileTheme.backgroundGradient                  │   │
│  │ + profileTheme.overlay                           │   │
│  │ + glowEnabled → box-shadow                       │   │
│  │ + animatedBackground → CSS animation             │   │
│  │ + profileThemePrimary/Accent → override colors   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Particles ──────────────────────────────────────┐   │
│  │ IF profileTheme has particleType → theme particles│   │
│  │ ELSE IF particlesEnabled → effectPreset particles │   │
│  │ (equippedProfileEffect Lottie NOT YET rendered)  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Avatar ─────────────────────────────────────────┐   │
│  │ avatarSize (small/medium/large)                  │   │
│  │ + selectedBorderId → border effect               │   │
│  │   ├─ lottieFile? → LottieBorderRenderer          │   │
│  │   └─ CSS type → fire/ice/glow/pulse/etc          │   │
│  │ + avatarBorderColor → ThemePreset colors          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Display Name ───────────────────────────────────┐   │
│  │ displayNameFont → font-family                    │   │
│  │ + displayNameEffect → solid/gradient/neon/toon/pop │   │
│  │ + displayNameColor + SecondaryColor              │   │
│  │ + equippedNameplate → bar behind name (partial)  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Title ──────────────────────────────────────────┐   │
│  │ equippedTitle → gradient text + animation        │   │
│  │ + isLegendaryTitle → extra glow effects          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Badges ─────────────────────────────────────────┐   │
│  │ equippedBadges[0..4] → icon + tooltip            │   │
│  │ + showBadges toggle                              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Status ─────────────────────────────────────────┐   │
│  │ showStatus → online/offline/idle/dnd dot         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Card Style ─────────────────────────────────────┐   │
│  │ profileCardStyle → layout variant                │   │
│  │ (classic/modern/compact/showcase/gaming)          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### What Combines in Chat Bubbles

```
┌─────────────────────────────────────────────────────────┐
│ Chat Bubble                                             │
│                                                         │
│  chatBubbleStyle → shape (pill/sharp/glass/neon/etc)    │
│  + chatBubbleColor → ThemePreset accent                 │
│  + bubbleBorderRadius → corner radius                   │
│  + bubbleShadowIntensity → shadow depth                 │
│  + bubbleGlassEffect → glass blur overlay               │
│  + bubbleShowTail → directional tail                    │
│  + bubbleHoverEffect → hover scale/glow                 │
│  + bubbleEntranceAnimation → entrance (fade/slide/etc)  │
│                                                         │
│  NOT wired: reactionStyle                               │
└─────────────────────────────────────────────────────────┘
```

---

## Appendix: Data File Locations

| Data | File | Count |
|------|------|-------|
| Borders | `src/data/borderCollections.ts` | 86 |
| Border Lottie Map | `src/assets/lottie/borders/borderLottieMap.ts` | 40 entries |
| Titles | `src/data/titlesCollection.ts` | 26 |
| Badges | `src/data/badgesCollection.ts` | 36 |
| Profile Themes | `src/data/profileThemes.ts` | 18 |
| Nameplates | `packages/animation-constants/src/registries/nameplates.ts` | 24 |
| Profile Effects | `packages/animation-constants/src/registries/profileEffects.ts` | 12 |
| Bubble Styles | `pages/customize/chat-customization/constants.ts` | 9 |
| Message Effects | `pages/customize/chat-customization/constants.ts` | 8 |
| Reaction Styles | `pages/customize/chat-customization/constants.ts` | 7 |
| Particle Effects | `pages/customize/effects-customization/constants.ts` | 12 |
| Background Effects | `pages/customize/effects-customization/constants.ts` | 10 |
| Animation Sets | `pages/customize/effects-customization/constants.ts` | 8 |
| Profile Layouts | `pages/customize/identity-customization/constants.ts` | 7 |
| Store Types | `modules/settings/store/customization/customizationStore.types.ts` | 58 state props (46 core+sync, 12 legacy) |
| Store Mappings | `modules/settings/store/customization/mappings.ts` | 6 maps + 9 helpers |

---

## Appendix: Feature Counts Summary

| What | Count | Status |
|------|-------|--------|
| **Sidebar categories** | 5 | All functional |
| **Sub-tabs total** | 22 | 18 functional, 4 questionable |
| **Store state properties** | 58 | 46 core+sync, 12 legacy aliases |
| **Cosmetic items total** | ~263 | 86 borders + 26 titles + 36 badges + 24 nameplates + 18 themes + 12 profile effects + 12 particles + 10 backgrounds + 8 animations + 9 bubbles + 8 message effects + 7 reaction styles + 7 layouts |
| **Legacy aliases** | 12 | All should be removed |
| **Dead features** | 4 | reactionStyle, forumTheme, backgroundEffect, showBio |
| **Overlapping features** | 3 | Particle/Profile effects, dual theme systems, duplicate border maps |
