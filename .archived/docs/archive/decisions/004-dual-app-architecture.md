# ADR-004: Dual-App Architecture

## Status

**Accepted**

## Date

2025-12-01

## Authors

- @cgraph-dev/core-team

## Context

CGraph needs both:

1. A **marketing website** for visitors (landing page, pricing, legal, company info)
2. An **application** for authenticated users (messaging, forums, settings)

Initially, both were served from the same React application. This created issues:

- Marketing pages bundled with app code (larger initial load)
- SEO challenges for marketing content
- Deployment coupling (marketing changes required full app deploy)
- Different caching requirements

## Decision Drivers

- SEO optimization for marketing pages
- Performance (fast initial load for both use cases)
- Independent deployment cycles
- Clear separation of concerns
- CDN caching efficiency

## Considered Options

### Option 1: Dual-App Architecture

**Description**: Separate apps for marketing (cgraph.org) and application (app.cgraph.org).

**Pros**:

- Independent deployments
- Optimized bundles for each use case
- Different caching strategies
- Clear team ownership
- SEO-friendly marketing site

**Cons**:

- Two apps to maintain
- Cross-domain auth considerations
- More complex deployment setup

### Option 2: Single SPA with Code Splitting

**Description**: One React app with lazy-loaded routes.

**Pros**:

- Single codebase
- Simpler deployment
- Shared components

**Cons**:

- Marketing pages still in SPA
- SEO requires SSR/prerendering
- Bundle includes unnecessary code for each context

### Option 3: SSR Framework (Next.js)

**Description**: Server-rendered React for everything.

**Pros**:

- Great SEO
- Unified framework
- Automatic code splitting

**Cons**:

- More complex than needed for app
- SSR overhead for authenticated app
- Different deployment requirements

## Decision

**Chosen option: Dual-App Architecture**

CGraph uses this pattern:

- `discord.com` → Marketing, legal, company pages
- `discord.com/app` or `app.discord.com` → Authenticated application

We adopted:

- `cgraph.org` → Marketing landing page, auth gateway, legal, company
- `app.cgraph.org` → Authenticated application (messages, forums, settings)

## Architecture

```
cgraph.org (Landing App)           app.cgraph.org (Web App)
┌────────────────────────┐        ┌────────────────────────┐
│  Marketing & Public    │        │   Authenticated App    │
│                        │        │                        │
│  • Landing page        │ Login  │  • Messages            │
│  • Features/Pricing    │ ────►  │  • Groups/Servers      │
│  • Legal pages         │        │  • Forums              │
│  • Company info        │        │  • Settings            │
│  • Auth pages          │        │  • Voice/Video         │
│                        │        │                        │
│  apps/landing/         │        │  apps/web/             │
└────────────────────────┘        └────────────────────────┘
```

## Implementation Details

### Monorepo Structure

```
apps/
├── landing/          # Marketing site (cgraph.org)
│   ├── src/pages/
│   │   ├── LandingPage.tsx
│   │   ├── auth/     # Login, Register, Forgot Password
│   │   ├── legal/    # Privacy, Terms, GDPR, Cookies
│   │   └── company/  # About, Careers, Contact, Press
│   └── vercel.json
│
├── web/              # Main app (app.cgraph.org)
│   ├── src/
│   │   ├── pages/    # Authenticated routes only
│   │   └── App.tsx
│   └── vercel.json
```

### Auth Flow

1. User visits `cgraph.org/login`
2. Authenticates via email/OAuth
3. Backend sets HTTP-only cookie
4. Redirects to `app.cgraph.org`
5. App reads cookie, establishes session

### Deployment

| App     | Domain         | Provider | Caching                         |
| ------- | -------------- | -------- | ------------------------------- |
| Landing | cgraph.org     | Vercel   | Aggressive (1 year static)      |
| Web App | app.cgraph.org | Vercel   | Conservative (no cache on HTML) |

## Consequences

### Positive

- 60% smaller initial bundle for landing page
- Independent release cycles
- Better SEO (landing is static-optimizable)
- Clear team ownership

### Negative

- Two Vercel projects to manage
- Cross-origin considerations for auth
- Shared component sync required

### Neutral

- Different build configurations
- Separate CI pipelines possible

## Related Decisions

- ADR-005: Vercel for frontend hosting
- ADR-007: Cookie-based auth for cross-domain

## References

- [CGraph's Architecture Blog](https://discord.com/blog/how-discord-stores-trillions-of-messages)
- [MULTI_APP_ARCHITECTURE_SUMMARY.md](../../../MULTI_APP_ARCHITECTURE_SUMMARY.md)
