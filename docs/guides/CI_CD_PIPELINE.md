# CI/CD Pipeline (v0.9.1)

## Overview
- GitHub Actions workflows for lint/test/build, security, and deploy.
- Monorepo with pnpm + Turbo; backend Elixir jobs; Docker image builds.

## Workflows
- `ci.yml`: lint (ESLint), format (Prettier), typecheck (TS), tests (Vitest/Jest), backend `mix test`.
- `deploy.yml`: build Docker images, push to registry, optionally deploy (Fly/K8s).
- Security: gitleaks, hadolint, Sobelow, Grype (per CHANGELOG 0.9.1).

## Caching
- pnpm store cache, Turbo cache, Mix deps/build cache, _build artifacts.

## Required secrets
- Registry credentials, database URL (for integration), TURN credentials (if e2e tests), SENTRY_DSN (optional).

## Incomplete / TODO
- No e2e test stage documented; add Playwright/Detox plan.
- Deployment targets (staging/prod) not fully described—add environment matrix.
- Missing observability steps (upload coverage, tracing) in docs—document once enabled.
