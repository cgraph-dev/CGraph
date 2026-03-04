# CGraph Landing — Project State

> Auto-maintained by GSD workflow. Do not edit manually.

---

## Core Value

First impression for every CGraph user — fast, polished, and on-brand with Liquid Glass.

## Current Focus

**Landing page redesign** — LandingPage.tsx is migrated. Shell, secondary pages, and cleanup remain.

## Position

- **Phase:** 0 of 3 — **Pre-Phase 1**
- **Plan:** 0/7 total plans
- **Status:** 🟡 Planning complete, ready for execution
- **Last activity:** 2026-03-04 — Planning

## Decisions

| #   | Decision                                                     | Rationale                                                                  |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1   | Use liquid-glass components inline (not from `packages/ui/`) | Landing needs bespoke sections; `packages/ui/` is for the main web app     |
| 2   | Keep old marketing tree until Phase 3                        | Secondary pages still depend on `MarketingLayout`                          |
| 3   | Create `LiquidGlassLayout` for secondary pages               | Shared shell (nav + footer + glass bg) for all non-landing routes          |
| 4   | Remove gsap after all pages migrated                         | Currently dead code for LandingPage but may be used by old secondary pages |

## Progress

| Metric           | Value     |
| ---------------- | --------- |
| Overall progress | 14%       |
| Phases complete  | 0 / 3     |
| Plans ready      | 7         |
| Landing page     | ✅ Done   |
| Secondary pages  | ❌ 0 / 14 |

█████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 14%

## What's Already Done (Pre-GSD)

- ✅ Installed deps: three, @react-three/fiber, @react-three/drei, CVA, clsx, tailwind-merge,
  lucide-react
- ✅ Created `src/components/liquid-glass/` (10 files): shared.ts, GlassOrb, Hero, Features,
  Pricing, SocialProof, CTA, Nav, Footer, index
- ✅ Updated `tailwind.config.js` with glass tokens (pearl, glow-\*, glass shadows, Inter font)
- ✅ Updated `index.css` for pearl-white body, glass utility classes
- ✅ Rewired `LandingPage.tsx` to use liquid-glass components
- ✅ Added Three.js to Vite manual chunks
- ✅ Committed as `9e0814ef`
