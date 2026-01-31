# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the CGraph project.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context
and consequences. ADRs help new team members understand why things are the way they are.

## Index

| ADR                                     | Title                          | Status   | Date       |
| --------------------------------------- | ------------------------------ | -------- | ---------- |
| [001](001-monorepo-structure.md)        | Monorepo Structure             | Accepted | 2025-01-01 |
| [002](002-dual-app-architecture.md)     | Dual App Architecture          | Accepted | 2025-01-01 |
| [003](003-zustand-state-management.md)  | Zustand State Management       | Accepted | 2025-01-01 |
| [004](004-signal-protocol-e2ee.md)      | Signal Protocol E2EE           | Accepted | 2025-01-01 |
| [005](005-phoenix-channels-realtime.md) | Phoenix Channels for Real-time | Accepted | 2025-01-01 |

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
