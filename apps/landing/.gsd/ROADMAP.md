# CGraph Landing — Liquid Glass Redesign Roadmap

> Generated: 2026-03-04 | Phases: 3 | Scope: `apps/landing/` only
>
> Redesign the CGraph landing site from dark cosmic theme to Liquid Glass
> (`cgraph-liquid-glass-v1`). LandingPage.tsx is already migrated. Remaining: shell polish,
> secondary pages, cleanup, tests.

---

## Phase Overview

| #   | Phase                     | Goal                                                         | Plans | Status      |
| --- | ------------------------- | ------------------------------------------------------------ | ----- | ----------- |
| 1   | Shell & Config Polish     | App shell (main.tsx, index.css, vite config) fully on-brand  | 2     | Not started |
| 2   | Secondary Pages Migration | All non-landing pages use Liquid Glass layout                | 3     | Not started |
| 3   | Cleanup & Testing         | Remove dead code, write component tests, pass Lighthouse ≥90 | 2     | Not started |

---

### Phase 1: Shell & Config Polish

**Goal:** The app shell, loading states, and build config are fully aligned with the Liquid Glass
design system. No dark-theme artifacts remain in shared infrastructure.

**Plans:** 2 plans

Plans:

- [ ] 01-01-PLAN.md — Fix main.tsx PageLoader, clean index.css, remove gsap
- [ ] 01-02-PLAN.md — Create LiquidGlassLayout wrapper for secondary pages

---

### Phase 2: Secondary Pages Migration

**Goal:** Every user-facing page (legal, company, resources, 404) renders with Liquid Glass styling.
Old `MarketingLayout` is no longer imported by any page.

**Plans:** 3 plans

Plans:

- [ ] 02-01-PLAN.md — Migrate legal pages (Privacy, Terms, Cookie, GDPR)
- [ ] 02-02-PLAN.md — Migrate company pages (About, Careers, Contact, Press)
- [ ] 02-03-PLAN.md — Migrate resource pages (Download, Docs, Blog, Status) + NotFound

---

### Phase 3: Cleanup & Testing

**Goal:** Dead code removed, test suite covers new components, Lighthouse performance ≥90 on mobile
for the landing page.

**Plans:** 2 plans

Plans:

- [ ] 03-01-PLAN.md — Delete old marketing tree + styles, remove gsap dep
- [ ] 03-02-PLAN.md — Write component tests for liquid-glass components + Lighthouse audit

---

## Constraints

- **React Router v7:** Preserve existing `BrowserRouter` + `Routes` + lazy loading pattern in
  `main.tsx`
- **Vite build:** Keep `terser` minify, `gzip`/`brotli` compression, manual chunks, CSS code split
- **Vercel deploy:** Do not change `vercel.json` rewrites, headers, or redirects
- **Data files:** `landing-data.ts` and `pricing-data.ts` are shared — do not break their interfaces
- **Incremental migration:** Secondary pages can be migrated one group at a time; old marketing tree
  stays until Phase 3
