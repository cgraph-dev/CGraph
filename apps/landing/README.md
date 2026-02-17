# @cgraph/landing

The marketing and documentation site for [CGraph](https://cgraph.org) — a privacy-first community
platform with post-quantum end-to-end encryption.

## Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Framework  | React 19 + TypeScript 5.8 (strict)                   |
| Build      | Vite 6.4 · Terser minify · Gzip + Brotli compression |
| Routing    | React Router 7 — 20 lazy-loaded routes               |
| Styling    | Tailwind CSS 3.4 + BEM modules (16 split CSS files)  |
| Animation  | GSAP 3.14 (ScrollTrigger) + Framer Motion 12         |
| SEO        | react-helmet-async · 3 JSON-LD schemas · OG/Twitter  |
| Analytics  | Plausible (GDPR-compliant, no cookies)               |
| Testing    | Vitest 3.2 + jsdom + @testing-library/react 16       |
| Deployment | Vercel                                               |
| License    | BSL 1.1 (see root LICENSE)                           |

## Getting Started

```bash
# From the monorepo root
pnpm install
pnpm --filter @cgraph/landing dev    # http://localhost:3001
```

### Scripts

| Script       | Description                        |
| ------------ | ---------------------------------- |
| `dev`        | Vite dev server on port 3001       |
| `build`      | Production build (Terser + Brotli) |
| `preview`    | Preview production build           |
| `lint`       | ESLint check                       |
| `typecheck`  | `tsc --noEmit`                     |
| `test`       | Run Vitest                         |
| `test:watch` | Vitest in watch mode               |

## Project Structure

```
src/
├── main.tsx                      # Entry — Router, HelmetProvider, Suspense
├── constants.ts                  # WEB_APP_URL, LANDING_URL, external links
├── index.css                     # Tailwind directives + global styles
│
├── components/
│   ├── ErrorBoundary.tsx         # Global error boundary
│   ├── Logo.tsx                  # Logo component (renders /logo.png)
│   ├── SEO.tsx                   # Per-page <Helmet> + JSON-LD
│   ├── marketing/                # Landing page layout & sections
│   │   ├── MarketingLayout.tsx   #   Shared layout shell
│   │   ├── layout/               #   Navigation, Footer, GlobalBackground
│   │   ├── sections/             #   Hero, Features, Security, CTA, ValueProposition
│   │   ├── ui/                   #   FeatureCard, GlassCard, GradientText, LandingButton, …
│   │   └── effects/              #   GraphNetwork, NeuralBackground
│   ├── customization-demo/       # Theme/avatar/chat preview interactive demo
│   ├── forum-showcase/           # Forum threads/moderation/organize demo
│   ├── interactive-demo/         # Chat, Gamification, Achievements, Titles demos
│   └── effects/                  # ElectricBorder, StarBorder, TitleEffects
│
├── pages/
│   ├── LandingPage.tsx           # Main marketing page (all sections)
│   ├── NotFound.tsx              # 404 page
│   ├── company/                  # About, Careers, Contact, Press
│   ├── legal/                    # PrivacyPolicy, TermsOfService, CookiePolicy, GDPR
│   └── resources/                # Blog, BlogArticle, Documentation, DocArticle, Download, Status
│
├── data/
│   ├── landing-data.ts           # Stats, feature cards, pricing tiers
│   ├── blog/                     # 11 articles — posts.ts (metadata), articles.ts (HTML content)
│   └── docs/                     # 41 articles across 8 categories — categories.ts, articles.ts
│
├── styles/                       # 16 BEM-scoped CSS modules
│   ├── css-variables.css         #   Design tokens
│   ├── hero-landing.css          #   Hero section
│   ├── features-section.css      #   Features grid
│   ├── mobile.css                #   All responsive breakpoints (768/640/480/375px)
│   └── …                        #   buttons, cta, pricing, showcase, stats, etc.
│
├── assets/fonts/                 # 4 WOFF2 fonts (General Sans, Robert, Zentry)
└── __tests__/                    # Vitest test suite
```

## Routes

| Path          | Component      | Notes                         |
| ------------- | -------------- | ----------------------------- |
| `/`           | LandingPage    | Main marketing page           |
| `/about`      | About          | Company info                  |
| `/careers`    | Careers        | Job listings                  |
| `/contact`    | Contact        | Contact form                  |
| `/press`      | Press          | Press resources               |
| `/download`   | Download       | App download links            |
| `/docs`       | Documentation  | 41 articles, 8 categories     |
| `/docs/:slug` | DocArticle     | Individual doc article        |
| `/blog`       | Blog           | 11 engineering/security posts |
| `/blog/:slug` | BlogArticle    | Individual blog post          |
| `/status`     | Status         | Service status page           |
| `/privacy`    | PrivacyPolicy  | Privacy policy                |
| `/terms`      | TermsOfService | Terms of service              |
| `/cookies`    | CookiePolicy   | Cookie policy                 |
| `/gdpr`       | GDPR           | GDPR compliance               |
| `/features`   | → `/#features` | Hash redirect                 |
| `/security`   | → `/#security` | Hash redirect                 |
| `/pricing`    | → `/#pricing`  | Hash redirect                 |
| `*`           | NotFound       | 404 page                      |

Auth routes (`/login`, `/register`) are handled by Vercel redirects to `web.cgraph.org`.

## Build Configuration

- **Target**: ES2020
- **Minification**: Terser (drops `console.*` and `debugger`)
- **Compression**: Gzip + Brotli (threshold 1024 bytes) via `vite-plugin-compression2`
- **Code splitting**: CSS code split enabled; manual chunks for `gsap`, `framer-motion`,
  `react-vendor`
- **Chunk size warning**: 800 KB

## Public Assets

```
public/
├── favicon.ico / favicon.png / favicon-16x16.png / favicon-32x32.png
├── apple-touch-icon.png / android-chrome-{192,512}x{192,512}.png
├── logo.png / og-image.png
├── manifest.json / robots.txt / sitemap.xml
├── downloads/cgraph-press-kit.zip
├── fonts/   (woff2 — also mirrored in src/assets/fonts/)
└── press-kit/   (brand guidelines, fact sheet, press release)
```

## Styling Approach

- **Tailwind CSS** for utility classes and responsive layout
- **BEM CSS modules** (16 files in `src/styles/`) for complex component-specific styles
- **Design tokens** in `css-variables.css` (colors, spacing, typography)
- **Responsive**: Single consolidated `mobile.css` covering 768px / 640px / 480px / 375px
- **Performance**: `content-visibility: auto` and `contain` properties for off-screen sections
- **Accessibility**: `prefers-reduced-motion` disables all animations

## Testing

```bash
pnpm --filter @cgraph/landing test        # Run all tests
pnpm --filter @cgraph/landing test:watch   # Watch mode
```

Tests use Vitest with jsdom and `@testing-library/react`. Animation libraries (GSAP, Framer Motion)
are mocked in test files. Routing context is provided via `MemoryRouter`.

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
