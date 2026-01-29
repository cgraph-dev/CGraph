# CGraph Landing Page

> Enterprise-grade marketing and authentication gateway for CGraph

## Overview

The CGraph Landing Page is a standalone React application designed for maximum performance and
scalability, following Discord's architecture pattern of separating the marketing site from the main
application.

## Architecture

```
cgraph.org/          → Landing Page (this app)
cgraph.org/login     → Login Page
cgraph.org/register  → Registration Page
app.cgraph.org/      → Main Web App (separate deployment)
```

### Why Separate Apps?

Following Discord's architecture:

1. **Performance**: Marketing pages can be statically generated and aggressively cached
2. **SEO**: Landing pages need different SEO strategies than SPAs
3. **Scalability**: Marketing traffic spikes (launches, viral content) don't affect app users
4. **A/B Testing**: Easy to test different landing page variants
5. **Deployment**: Can deploy landing page changes without touching the main app

## Features

### Landing Page (`/`)

- **GSAP ScrollTrigger** animations with zoom sections
- **3D TiltCard** components with glare effects
- **Feature showcase** with hover-to-reveal premium features
- **Security section** with portal tooltips
- **Pricing tiers** with highlighted recommended plan
- **Premium typography** with Robert, Zentry, and General fonts
- **Responsive design** with mobile-first approach

### Authentication Pages

- **Login** (`/login`) - Email/password + OAuth (Google, GitHub) + Web3 wallet
- **Register** (`/register`) - Full registration with password strength indicator
- **Forgot Password** (`/forgot-password`) - Email-based password reset

## Tech Stack

- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **React Router 6** for client-side routing
- **GSAP 3.14** with ScrollTrigger for scroll animations
- **Framer Motion 12** for micro-interactions
- **Tailwind CSS** for styling
- **Custom Fonts**: Robert, Zentry, General (woff2)

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev --filter=@cgraph/landing

# Build for production
pnpm build --filter=@cgraph/landing

# Preview production build
pnpm preview --filter=@cgraph/landing
```

## Environment Variables

Create a `.env` file in the landing app directory:

```env
# Web App URL for authentication redirects
VITE_WEB_APP_URL=https://app.cgraph.org

# Optional: Analytics
VITE_GA_TRACKING_ID=UA-XXXXXXXX-X
```

## Deployment

### Vercel (Recommended)

The app is configured for Vercel deployment with:

- **Multi-region deployment**: fra1 (Frankfurt), iad1 (N. Virginia), sfo1 (San Francisco)
- **CDN caching**: Static assets cached for 1 year
- **Security headers**: CSP, X-Frame-Options, HSTS
- **Clean URLs**: No trailing slashes, no .html extensions

```bash
# Deploy to Vercel
vercel --prod
```

### Domain Configuration

1. Add `cgraph.org` as primary domain in Vercel
2. Configure `app.cgraph.org` to point to the web app
3. Set up redirects in Vercel dashboard if needed

## Performance Optimizations

1. **Lazy Loading**: All pages are code-split and lazy-loaded
2. **Font Preloading**: Critical fonts are preloaded in index.html
3. **Image Optimization**: SVG icons, optimized assets
4. **CSS Optimization**: Tailwind purging, minimal runtime CSS
5. **JS Optimization**: Tree-shaking, minification, compression

## File Structure

```
apps/landing/
├── public/
│   ├── favicon.svg
│   ├── og-image.svg
│   └── apple-touch-icon.svg
├── src/
│   ├── assets/
│   │   └── fonts/
│   │       ├── robert-regular.woff2
│   │       ├── robert-medium.woff2
│   │       ├── zentry-regular.woff2
│   │       └── general.woff2
│   ├── components/
│   │   └── Logo.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── landing-page.css
│   │   └── auth/
│   │       ├── AuthLayout.tsx
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       └── ForgotPassword.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT © CGraph Team
