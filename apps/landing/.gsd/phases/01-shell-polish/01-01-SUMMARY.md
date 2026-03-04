# 01-01 Summary — Fix PageLoader, Clean CSS, Remove gsap Chunk

**Status:** ✅ Complete  
**Commit:** `b0707285`  
**Duration:** ~2 min

## What Was Done

| Task              | Files          | Result                                                      |
| ----------------- | -------------- | ----------------------------------------------------------- |
| Fix PageLoader    | main.tsx       | `bg-pearl` + purple spinner replaces dark bg + emerald      |
| Clean index.css   | index.css      | Removed orphaned `transition: opacity 0.3s; z-index: -1; }` |
| Remove gsap chunk | vite.config.ts | Removed `gsap: ['gsap']` from manualChunks                  |

## Deviations

- **Legacy font-faces kept**: `font-zentry` and `font-robert` @font-face declarations kept in
  index.css because `About.tsx` (L243) and `PrivacyPolicy.tsx` (L346) still reference them. Will be
  cleaned during Phase 2 page migrations.

## Files Modified

- `apps/landing/src/main.tsx` — PageLoader colors
- `apps/landing/src/index.css` — orphaned CSS removed
- `apps/landing/vite.config.ts` — gsap chunk removed
