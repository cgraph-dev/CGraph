# Architecture Decision Record: Dual App Architecture

## Status

Accepted

## Date

2025-01-01

## Context

CGraph has two frontend applications:

- **Web App**: Full-featured messaging platform
- **Landing Page**: Marketing and authentication

We needed to decide how to structure and deploy these.

## Decision

We adopted a **dual-app architecture** with shared infrastructure.

### Structure

```
apps/
├── web/              # Main application (Vite + React)
│   ├── src/
│   │   ├── pages/    # Messages, Settings, etc.
│   │   ├── components/
│   │   └── stores/
│   └── vite.config.ts
│
└── landing/          # Marketing site (Vite + React)
    ├── src/
    │   ├── pages/    # Home, Login, Register
    │   ├── components/
    │   └── animations/
    └── vite.config.ts
```

### Deployment (Vercel)

```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/app/:path*",
      "destination": "https://cgraph-web.vercel.app/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "https://cgraph-landing.vercel.app/$1"
    }
  ]
}
```

### Authentication Flow

```
Landing Page         Main App
(cgraph.com)         (app.cgraph.com)
     │                    │
     │  Login/Register    │
     │───────────────────>│
     │                    │
     │   Set cookies      │
     │<───────────────────│
     │                    │
     │   Redirect         │
     │───────────────────>│
     │                    │
     │   Access app       │
     │                    │
```

## Consequences

### Positive

- **Performance**: Landing page is lightweight (~200KB)
- **SEO**: Landing page can be SSR/static for SEO
- **Separation**: Different teams can work independently
- **Caching**: Different cache strategies per app

### Negative

- **Shared State**: Auth state must be synchronized
- **Deployment Complexity**: Two apps to deploy
- **Duplicate Code**: Some components duplicated

## Shared Resources

| Resource       | Mechanism               |
| -------------- | ----------------------- |
| Authentication | Shared cookies/tokens   |
| UI Components  | `@cgraph/ui` package    |
| Utilities      | `@cgraph/utils` package |
| Theme          | Shared Tailwind config  |
| API Client     | Shared in utils         |

## Alternatives Considered

1. **Single App**: Everything in one React app
   - Rejected: Landing page would bloat bundle

2. **Next.js App Router**: Single framework with route groups
   - Rejected: Already invested in Vite, simpler architecture

3. **Micro-frontends**: Module federation
   - Rejected: Overkill for two apps

## References

- [Vercel Monorepo Support](https://vercel.com/docs/monorepos)
- [Multi-Zones (Next.js concept)](https://nextjs.org/docs/advanced-features/multi-zones)
