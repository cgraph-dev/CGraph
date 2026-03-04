# Lighthouse Baseline — Liquid Glass Landing

## Date

<!-- Run date: pending first build deploy -->

## How to Run

```bash
cd apps/landing
pnpm build
pnpm preview &
npx lighthouse http://localhost:4173 --output=json --output=html --output-path=./lighthouse-report --chrome-flags="--headless"
```

## Target Thresholds

| Category       | Target | Notes                       |
| -------------- | ------ | --------------------------- |
| Performance    | ≥ 85   | Three.js hero may lower FCP |
| Accessibility  | ≥ 90   | Semantic HTML + ARIA labels |
| Best Practices | ≥ 90   | HTTPS, no console errors    |
| SEO            | ≥ 90   | Meta tags via SEO component |

## Baseline Scores

> **Status**: Pending first CI run. Execute the command above after deploy to populate.

| Category       | Score | Notes |
| -------------- | ----- | ----- |
| Performance    | —     |       |
| Accessibility  | —     |       |
| Best Practices | —     |       |
| SEO            | —     |       |

## Known Considerations

- **Three.js bundle**: HeroSection loads `@react-three/fiber` + `@react-three/drei` which adds
  ~200KB to JS bundle. Consider lazy-loading below the fold.
- **Font loading**: Inter font loaded via Google Fonts CDN. Ensure `font-display: swap` is set.
- **Image optimization**: Download page platform icons should use WebP with proper dimensions.
- **CLS**: `glass-surface` cards use `backdrop-blur` which can cause layout shifts on slower GPUs.

## Improvement Backlog

1. Lazy-load Three.js canvas (code-split GlassOrb)
2. Add `loading="lazy"` to below-fold images
3. Preload critical fonts
4. Add `width`/`height` attributes to all images
