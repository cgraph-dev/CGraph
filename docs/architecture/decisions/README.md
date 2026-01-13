# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the CGraph project.

## What is an ADR?

An Architecture Decision Record is a document that captures an important architectural decision made along with its context and consequences.

## How to Create an ADR

1. Copy the template: `cp 000-template.md XXX-title.md`
2. Replace `XXX` with the next available number
3. Fill in all sections
4. Submit as a PR for review

## ADR Index

| Number | Title | Status | Date |
|--------|-------|--------|------|
| [006](./006-ddd-feature-structure.md) | DDD Feature Module Structure | Accepted | 2026-01 |

> Note: ADRs 001-005 document historical decisions made before this tracking system was established.

## Status Lifecycle

```
Proposed → Accepted → Deprecated → Superseded
                   ↘ Rejected
```

- **Proposed**: Under discussion
- **Accepted**: Decision has been made
- **Deprecated**: No longer recommended
- **Superseded**: Replaced by another ADR
- **Rejected**: Decision was not accepted

## Template

See [000-template.md](000-template.md) for the ADR template.
