# CGraph Landing — Liquid Glass Redesign

## What This Is

The CGraph public landing site at `cgraph.org`. A React 19 + Vite SPA with React Router v7, Tailwind
CSS, Framer Motion 12, and Three.js. Deployed to Vercel (multi-region). It serves as the marketing
frontend for the CGraph encrypted messaging platform.

## Core Value

**First impression for every potential user** — fast, polished, accessible, and on-brand with the
Liquid Glass design system (`cgraph-liquid-glass-v1`).

## Stack

| Component         | Technology                              | Version |
| ----------------- | --------------------------------------- | ------- |
| **Language**      | TypeScript                              | ~5.8    |
| **Runtime**       | React                                   | 19      |
| **Bundler**       | Vite                                    | 6.4     |
| **CSS**           | Tailwind CSS                            | 3.4     |
| **Animation**     | Framer Motion                           | ^12.0.0 |
| **3D**            | Three.js + @react-three/fiber + drei    | ^0.182  |
| **Routing**       | React Router DOM                        | ^7.6.1  |
| **SEO**           | react-helmet-async                      | ^2.0.5  |
| **Icons**         | Lucide React                            | latest  |
| **Class Utils**   | CVA + clsx + tailwind-merge             | latest  |
| **Deploy**        | Vercel (multi-region: fra1, iad1, sfo1) | —       |
| **Observability** | Vercel Speed Insights + custom vitals   | —       |

## Architecture

```
src/
├── main.tsx                        # BrowserRouter entry + lazy routes
├── index.css                       # Global styles (pearl-white base)
├── constants.ts                    # WEB_APP_URL, EXTERNAL_LINKS
├── components/
│   ├── liquid-glass/               # NEW: Liquid Glass components (10 files)
│   │   ├── shared.ts              #   cn(), springs, glass surface tokens
│   │   ├── HeroSection.tsx        #   3D GlassOrb hero
│   │   ├── FeaturesSection.tsx    #   12 glass feature cards
│   │   ├── PricingSection.tsx     #   3-tier glass pricing
│   │   ├── SocialProofSection.tsx #   Stats + testimonials
│   │   ├── CTASection.tsx         #   Final CTA
│   │   ├── Navigation.tsx         #   Floating glass pill nav
│   │   ├── Footer.tsx             #   Glass footer
│   │   ├── GlassOrb.tsx           #   Three.js 3D scene
│   │   └── index.ts              #   Barrel export
│   ├── marketing/                  # OLD: Dark cosmic theme (to be migrated)
│   ├── SEO.tsx                     # Shared
│   └── ErrorBoundary.tsx           # Shared
├── data/
│   ├── landing-data.ts            # Features, showcase, security, footer
│   └── pricing-data.ts            # 3-tier pricing data
├── pages/
│   ├── LandingPage.tsx            # ✅ Migrated to liquid-glass
│   ├── NotFound.tsx               # ❌ Still dark theme
│   ├── company/                   # ❌ All dark theme (About, Careers, Contact, Press)
│   ├── legal/                     # ❌ All dark theme (Privacy, Terms, Cookie, GDPR)
│   └── resources/                 # ❌ All dark theme (Download, Docs, Blog, Status)
└── styles/                         # OLD: 16 dark-theme CSS files (to be removed)
```

## Design System

Uses `cgraph-liquid-glass-v1` (MASTER.md at `design-system/cgraph-liquid-glass/MASTER.md`).

**Key tokens:**

- Background: `rgb(250, 250, 252)` (pearl-white)
- Glass surface: `bg-white/[0.72]` + `backdrop-blur-[20px]` + `backdrop-saturate-[1.6]`
- Glow palette: Blue `#93C5FD`, Purple `#C4B5FD`, Pink `#F9A8D4`, Green `#86EFAC`
- Font: Inter (400–800)
- Icons: Lucide (no emoji)
- Animation: Framer Motion spring physics (springPreset, springSnap, springGentle)
- Anti-patterns: No emoji icons, no dark mode, no CSS ease transitions, no vibrant neon

## Current State

**LandingPage.tsx** is migrated to Liquid Glass. All other pages and the routing shell (`main.tsx`)
still reference the old dark cosmic theme. Old marketing components and 16 CSS files are dead code
for the landing page but still used by secondary pages.
