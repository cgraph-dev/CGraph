---
phase: 27-lottie-emoji-upgrade
plan: 03
subsystem: ui
tags: [react, typescript, lottie-web, indexeddb, emoji, animations]

requires:
  - phase: 27-01
    provides: Backend Lottie API endpoints and animation catalog
  - phase: 27-02
    provides: Noto Emoji manifest with animated codepoint mappings
provides:
  - Core Lottie library (renderer, cache, hook, types)
  - Emoji picker with animated Noto emojis (hover-to-play)
  - Animated message reactions with Lottie pop effects
  - Forum emoji picker with Lottie support
  - Group emoji grid with Lottie previews
  - Custom emoji upload accepting Lottie JSON files
  - Updated shared types with animation fields
affects: [27-04-avatar-borders, 27-05-mobile-lottie]

tech-stack:
  added: [lottie-web]
  patterns: [indexeddb-cache, hover-to-play, reduced-motion-fallback]

key-files:
  created:
    - apps/web/src/lib/lottie/lottie-renderer.tsx
    - apps/web/src/lib/lottie/lottie-cache.ts
    - apps/web/src/lib/lottie/lottie-types.ts
    - apps/web/src/lib/lottie/use-lottie.ts
    - apps/web/src/lib/lottie/index.ts
  modified:
    - apps/web/src/modules/chat/components/emoji-picker/emoji-grid.tsx
    - apps/web/src/modules/chat/components/emoji-picker/emojiData.ts
    - apps/web/src/modules/chat/components/emoji-picker/types.ts
    - apps/web/src/modules/chat/components/message-reactions.tsx
    - apps/web/src/modules/chat/components/reaction-bar.tsx
    - apps/web/src/modules/forums/components/emoji-picker/custom-emoji-picker.tsx
    - apps/web/src/modules/forums/components/emoji-picker/grids.tsx
    - apps/web/src/modules/groups/components/group-settings/emoji-grid.tsx
    - apps/web/src/modules/groups/components/group-settings/emoji-tab.tsx
    - apps/web/src/pages/settings/custom-emoji/upload-emoji-modal.tsx
    - apps/web/src/pages/settings/custom-emoji/types.ts
    - packages/shared-types/src/forum-emoji.ts
    - packages/shared-types/src/models.ts

key-decisions:
  - 'lottie-web light build (SVG renderer) for ~150KB bundle size'
  - 'IndexedDB cache with 200-entry LRU eviction for Lottie JSON data'
  - 'Hover-to-play interaction: static WebP at rest, Lottie on hover'
  - 'Custom emoji upload validates Lottie JSON structure (max 10s, 64-1024px)'

patterns-established:
  - 'LottieRenderer: reusable component wrapping lottie-web with fallback'
  - 'useLottie hook: manages loading state, play controls, reduced motion'
  - 'LottieCacheManager: IndexedDB singleton with preload and LRU'

duration: 20min
completed: 2026-03-07
---

# Plan 27-03: Web Lottie Integration Summary

**Full web Lottie layer shipped — emoji picker, reactions, forums, groups, and custom upload all
animated.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-07
- **Completed:** 2026-03-07
- **Tasks:** 6/6
- **Files created:** 5
- **Files modified:** 13

## Accomplishments

1. **Core Lottie library** — LottieRenderer component, IndexedDB cache (200-entry LRU), useLottie
   hook, TypeScript types. Uses lottie-web light build (SVG renderer) for minimal bundle impact.
2. **Animated emoji picker** — Emoji grid renders animated Noto emojis: static WebP at rest, Lottie
   animation on hover. Prefetches visible section. "Animated" filter toggle.
3. **Animated reactions** — Reaction chips play Lottie on hover, pop effect when adding reaction,
   quick-react bar preloads top 6 emojis.
4. **Forum & group integration** — Forum emoji picker, custom emoji picker, and group emoji grid all
   use LottieRenderer for animated emojis. backward compatible with existing GIF/APNG.
5. **Custom emoji upload** — Accepts .json Lottie files with validation (structure, duration,
   dimensions, size). Live preview renders animation before save.
6. **Shared types** — LottieAsset, AnimatedEmojiCatalog models. Reaction animation field.
   CustomEmoji lottie_url/animation_format. EmojiPack has_lottie_emojis flag.

## Technical Notes

- All components respect `prefers-reduced-motion` — show static WebP fallback
- IndexedDB cache scoped to `cgraph_lottie_cache` database
- Backward compatible: emojis without Lottie animations render as before

## Issues

None.
