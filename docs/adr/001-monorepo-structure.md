# Architecture Decision Record: Monorepo Structure

## Status

Accepted

## Date

2025-01-01

## Context

CGraph is a multi-platform communication platform with:

- Web application (React + Vite)
- Mobile application (React Native)
- Backend API (Elixir/Phoenix)
- Shared packages (utilities, types)

We needed to decide on code organization strategy.

## Decision

We adopted a **pnpm monorepo** structure with Turborepo for orchestration.

```
CGraph/
├── apps/
│   ├── web/        # React web application
│   ├── mobile/     # React Native mobile app
│   ├── landing/    # Marketing landing page
│   └── backend/    # Elixir/Phoenix API
├── packages/       # Shared packages
│   ├── utils/      # Shared utilities
│   └── ui/         # Shared UI components
└── infrastructure/ # Docker, deployment configs
```

## Consequences

### Positive

- **Code Sharing**: Shared packages (`@cgraph/utils`) eliminate duplication
- **Unified Tooling**: Single ESLint, TypeScript, and Prettier config
- **Atomic Changes**: Cross-package changes in single commits
- **Cached Builds**: Turborepo caches unchanged packages

### Negative

- **Complexity**: More complex CI/CD setup
- **Learning Curve**: Team must understand workspace structure
- **Lock File Size**: Single large pnpm-lock.yaml

## Alternatives Considered

1. **Polyrepo**: Separate repos per app
   - Rejected: Would require complex version synchronization

2. **Yarn Workspaces**: Alternative package manager
   - Rejected: pnpm offers better disk efficiency and strictness

## References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
