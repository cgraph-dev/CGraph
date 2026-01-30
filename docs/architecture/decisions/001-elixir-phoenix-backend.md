# ADR-001: Elixir/Phoenix for Backend

## Status

**Accepted**

## Date

2025-06-01

## Authors

- @cgraph-dev/core-team

## Context

CGraph requires a backend that can handle:

- Real-time messaging with potentially millions of concurrent connections
- WebSocket-based communication with low latency
- High reliability and fault tolerance
- Horizontal scalability

We needed to choose a technology stack that could support Discord-scale real-time features while
remaining maintainable by a small team.

## Decision Drivers

- Real-time performance (sub-100ms message delivery)
- Concurrent connection handling (100K+ simultaneous users)
- Developer productivity
- Operational simplicity
- Industry precedent for similar applications

## Considered Options

### Option 1: Elixir/Phoenix

**Description**: Functional language on the Erlang VM (BEAM) with Phoenix web framework.

**Pros**:

- Built for concurrency and fault tolerance (Erlang heritage)
- Phoenix Channels provide native WebSocket support
- Process isolation prevents cascading failures
- Discord uses Elixir for their gateway servers
- Pattern matching makes complex message handling elegant
- Hot code reloading for zero-downtime deployments

**Cons**:

- Smaller talent pool than mainstream languages
- Learning curve for developers unfamiliar with functional programming
- Less mature ecosystem for some libraries

### Option 2: Node.js/Express + Socket.io

**Description**: JavaScript runtime with popular WebSocket library.

**Pros**:

- Large developer talent pool
- Extensive npm ecosystem
- Team familiarity

**Cons**:

- Single-threaded event loop limits CPU-bound operations
- Requires clustering for multi-core utilization
- Less robust error handling than BEAM
- Memory leaks more common in long-running processes

### Option 3: Go with custom WebSocket handling

**Description**: Compiled language with goroutines for concurrency.

**Pros**:

- Excellent performance
- Strong typing
- Good concurrency primitives

**Cons**:

- No batteries-included web framework
- Manual WebSocket implementation needed
- Less productive for rapid iteration

### Option 4: Rust with Actix-web

**Description**: Systems language with actor-based web framework.

**Pros**:

- Maximum performance
- Memory safety guarantees
- Good concurrency model

**Cons**:

- Steeper learning curve
- Slower development velocity
- Overkill for application-level code

## Decision

**Chosen option: Elixir/Phoenix**

We chose Elixir/Phoenix because:

1. **Proven at scale**: Discord handles millions of concurrent connections with Elixir
2. **Native real-time**: Phoenix Channels provide pub/sub out of the box
3. **Fault tolerance**: BEAM's "let it crash" philosophy prevents cascading failures
4. **Developer experience**: Mix tooling, IEx REPL, and hot reloading accelerate development
5. **Oban for jobs**: First-class background job processing with persistence

## Consequences

### Positive

- Sub-50ms message delivery in production
- Zero-downtime deployments via hot code reloading
- Simplified real-time architecture with Phoenix Presence
- Excellent observability with Telemetry

### Negative

- Smaller hiring pool (mitigated by remote-first approach)
- Team required Elixir training (2-4 weeks ramp-up)
- Some npm libraries required reimplementation

### Neutral

- Different mental model from OOP (functional paradigm)
- Pattern matching takes time to master

## Related Decisions

- ADR-002: PostgreSQL for primary database
- ADR-003: Redis for caching and pub/sub
- ADR-004: Phoenix Channels for real-time

## References

- [How Discord Scaled Elixir to 5M Concurrent Users](https://discord.com/blog/how-discord-scaled-elixir-to-5-million-concurrent-users)
- [Phoenix Channels Documentation](https://hexdocs.pm/phoenix/channels.html)
- [BEAM VM Documentation](https://www.erlang.org/doc/efficiency_guide/introduction.html)
