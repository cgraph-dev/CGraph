# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the CGraph project.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context
and consequences. ADRs help new team members understand why things are the way they are.

## Index

| ADR                                       | Title                            | Status     | Date       |
| ----------------------------------------- | -------------------------------- | ---------- | ---------- |
| [001](001-monorepo-structure.md)          | Monorepo Structure               | Accepted   | 2025-01-01 |
| [002](002-dual-app-architecture.md)       | Dual App Architecture            | Accepted   | 2025-01-01 |
| [003](003-zustand-state-management.md)    | Zustand State Management         | Accepted   | 2025-01-01 |
| [004](004-signal-protocol-e2ee.md)        | Signal Protocol E2EE             | Superseded | 2025-01-01 |
| [005](005-phoenix-channels-realtime.md)   | Phoenix Channels for Real-time   | Accepted   | 2025-01-01 |
| 006                                       | _Guardian JWT Authentication_    | Pending    | —          |
| 007                                       | _Redis Caching Strategy_         | Pending    | —          |
| 008                                       | _Fly.io Deployment Topology_     | Pending    | —          |
| 009                                       | _CORS & Origin Validation_       | Pending    | —          |
| 010                                       | _Rate Limiting Architecture_     | Pending    | —          |
| [011](011-post-quantum-triple-ratchet.md) | Post-Quantum Triple Ratchet E2EE | Accepted   | 2026-02-15 |
| 012                                       | _Subscription Tier Model_        | Pending    | —          |
| 013                                       | _MeiliSearch Integration_        | Pending    | —          |
| 014                                       | _WebSocket Protocol Design_      | Pending    | —          |
| 015                                       | _CI/CD Pipeline Architecture_    | Pending    | —          |
| 016                                       | _Error Handling Convention_      | Pending    | —          |
| 017                                       | _Observability Stack Selection_  | Pending    | —          |
| [018](018-reanimated-v4-migration.md)     | Reanimated v4 Migration          | Accepted   | 2026-01-01 |
| [019](019-elixir-phoenix-backend.md)      | Elixir/Phoenix for Backend       | Accepted   | 2025-07-15 |
| [020](020-postgresql-database.md)         | PostgreSQL as Primary Database   | Accepted   | 2025-07-15 |
| [021](021-ddd-feature-structure.md)       | DDD Feature Module Structure     | Accepted   | 2025-07-15 |

## Template

When creating a new ADR, use this template:

```markdown
# Architecture Decision Record: [Title]

## Status

[Proposed | Accepted | Deprecated | Superseded]

## Date

YYYY-MM-DD

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive

- Benefit 1
- Benefit 2

### Negative

- Drawback 1
- Drawback 2

## Alternatives Considered

What other options were evaluated and why were they rejected?

## References

- Links to relevant documentation, articles, or discussions
```

## Adding a New ADR

1. Create a new file: `NNN-short-title.md` (e.g., `006-authentication-strategy.md`)
2. Use the template above
3. Add an entry to this index
4. Submit a PR for review
