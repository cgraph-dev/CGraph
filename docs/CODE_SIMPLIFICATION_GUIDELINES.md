# Code Simplification & Best Practices Guidelines

This document outlines code standards, anti-patterns to avoid, and industry best practices for the
CGraph codebase. **All agents and developers must follow these guidelines.**

**Generated**: January 2026 **Version**: 4.2 **Status**: MANDATORY **Standards**: Google, Meta,
Telegram, Discord **Tech-Specific**: Oban, Stripe, E2EE, WebRTC, React 19.1, Expo 54, Phoenix 1.8,
Fly.io **Enforcement**: `code-simplifier@claude-plugins-official` plugin active

---

## Industry Standards Reference

This guide incorporates best practices from companies serving billions of users:

| Company      | Scale       | Tech Stack               | What We Adopted                                                       |
| ------------ | ----------- | ------------------------ | --------------------------------------------------------------------- |
| **Google**   | 4B+ users   | Various                  | SRE practices, TypeScript style, error budgets, SLO/SLI               |
| **Meta**     | 3.4B users  | PHP, Hack, C++           | TAO graph caching, multi-region architecture, request coalescing      |
| **Telegram** | 1B+ users   | C++, custom              | Event-driven architecture, MTProto efficiency, lean engineering       |
| **Discord**  | 200M+ users | **Elixir**, Rust, Python | Gateway sharding, Elixir+Rust NIFs, session resumption, data services |

> **Note**: Discord's architecture is most similar to CGraph - both use Elixir/Phoenix for real-time
> communication.

---

## Table of Contents

### Part 1: Industry Standards & Principles

1. [Core Principles](#core-principles)
2. [Google SRE Practices](#google-sre-practices)
3. [Google TypeScript Standards](#google-typescript-standards)
4. [Meta Scale Patterns](#meta-scale-patterns)
5. [Telegram Architecture Patterns](#telegram-architecture-patterns)
6. [Discord Architecture Patterns](#discord-architecture-patterns)
7. [Observability & Monitoring](#observability--monitoring)

### Part 2: Code Quality Fundamentals

8. [SOLID Principles](#solid-principles)
9. [Clean Code Fundamentals](#clean-code-fundamentals)
10. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

### Part 3: Frontend Development

11. [TypeScript/React Best Practices](#typescriptreact-best-practices)
12. [React Performance Patterns](#react-performance-patterns)
13. [State Management Patterns](#state-management-patterns)
14. [Real-Time WebSocket Patterns](#real-time-websocket-patterns)

### Part 4: Backend Development

15. [Phoenix Channels & Real-Time](#phoenix-channels--real-time)
16. [CGraph Caching Patterns](#cgraph-caching-patterns)
17. [Rate Limiting Patterns](#rate-limiting-patterns)
18. [Elixir/Phoenix Best Practices](#elixirphoenix-best-practices)
19. [Database & Query Patterns](#database--query-patterns)

### Part 5: Scale & Performance (100M+ Users)

20. [Scaling Architecture](#scaling-architecture)
21. [Forum System Optimization](#forum-system-optimization)
22. [Performance Budgets](#performance-budgets)

### Part 6: Quality & Security

23. [Error Handling Patterns](#error-handling-patterns)
24. [API Design Patterns](#api-design-patterns)
25. [Security Best Practices](#security-best-practices)
26. [Testing Guidelines](#testing-guidelines)
27. [Accessibility Standards](#accessibility-standards)

### Part 7: Reference

28. [Code Review Checklist](#code-review-checklist)
29. [Summary of Changes Made](#summary-of-changes-made)
30. [Reference Files](#reference-files)
31. [Quick Reference Card](#quick-reference-card)

### Part 8: CGraph Implementation Status

32. [Implementation Roadmap](#implementation-roadmap)
33. [Current State vs Target State](#current-state-vs-target-state)
34. [Frontend Quick Wins](#frontend-quick-wins)

### Part 9: CGraph Technology-Specific Patterns

35. [Oban Background Jobs](#oban-background-jobs)
36. [Stripe Integration](#stripe-integration)
37. [E2EE Signal Protocol](#e2ee-signal-protocol)
38. [WebRTC Voice/Video](#webrtc-voicevideo)
39. [React 19 Patterns](#react-19-patterns)
40. [Expo 54 Mobile](#expo-54-mobile)
41. [Phoenix 1.8 Specifics](#phoenix-18-specifics)
42. [Fly.io Deployment](#flyio-deployment)

### Part 10: Advanced Patterns & Scalability

43. [Dependency Injection Patterns](#dependency-injection-patterns)
44. [Feature Flags & Gradual Rollouts](#feature-flags--gradual-rollouts)
45. [Event Sourcing Patterns](#event-sourcing-patterns)
46. [Graceful Degradation](#graceful-degradation)
47. [Idempotency Patterns](#idempotency-patterns)
48. [Dead Letter Queue Handling](#dead-letter-queue-handling)
49. [Configuration Management](#configuration-management)
50. [Code Organization Patterns](#code-organization-patterns)

---

## Core Principles

### The Golden Rules

1. **Clarity over cleverness** - Code is read 10x more than it's written
2. **DRY (Don't Repeat Yourself)** - But don't abstract prematurely
3. **KISS (Keep It Simple, Stupid)** - The simplest solution is usually the best
4. **YAGNI (You Aren't Gonna Need It)** - Don't build for hypothetical futures
5. **Fail fast** - Catch errors early, at the boundary
6. **Explicit over implicit** - Make behavior obvious

### The 30-Second Rule

> "Would a new team member understand this code in 30 seconds?"

If the answer is no, refactor for clarity.

### The Boy Scout Rule

> "Leave the code cleaner than you found it."

Small, incremental improvements compound over time.

---

## Google SRE Practices

Google's Site Reliability Engineering practices are the gold standard for operating services at
scale. CGraph adopts these for managing reliability.

### Service Level Indicators (SLIs)

SLIs are quantitative measures of service quality. Define SLIs for every critical path.

```typescript
// CGraph SLIs
const SERVICE_LEVEL_INDICATORS = {
  // Availability: fraction of successful requests
  availability: {
    metric: 'http_requests_total{status!~"5.."}',
    description: 'Percentage of requests that succeed',
  },

  // Latency: response time distribution
  latency: {
    metric: 'http_request_duration_seconds',
    thresholds: {
      p50: 100, // ms
      p95: 200, // ms
      p99: 500, // ms
    },
  },

  // Throughput: requests per second
  throughput: {
    metric: 'http_requests_total rate(5m)',
    capacity: 10000, // requests/second
  },

  // Error rate: fraction of failed requests
  errorRate: {
    metric: 'http_requests_total{status=~"5.."}',
    description: 'Percentage of requests that fail',
  },
} as const;
```

### Service Level Objectives (SLOs)

SLOs are target values for SLIs. Set realistic targets based on user expectations.

```elixir
# CGraph SLO Definitions
defmodule CGraph.SLO do
  @slos %{
    # API Availability: 99.9% (43.2 min downtime/month)
    api_availability: %{
      target: 0.999,
      window: :rolling_28_days,
      error_budget: 0.001  # 0.1% of requests can fail
    },

    # Message Delivery: 99.95% within 1 second
    message_delivery: %{
      target: 0.9995,
      latency_threshold_ms: 1000,
      window: :rolling_28_days
    },

    # Forum Feed Load: 99.5% under 200ms
    forum_feed_latency: %{
      target: 0.995,
      latency_threshold_ms: 200,
      window: :rolling_7_days
    },

    # Search Results: 99% under 500ms
    search_latency: %{
      target: 0.99,
      latency_threshold_ms: 500,
      window: :rolling_7_days
    }
  }

  def error_budget(slo_name) do
    slo = Map.fetch!(@slos, slo_name)
    1 - slo.target
  end

  # Calculate remaining error budget
  def remaining_budget(slo_name, current_error_rate) do
    budget = error_budget(slo_name)
    remaining = budget - current_error_rate
    %{
      total: budget,
      consumed: current_error_rate,
      remaining: max(remaining, 0),
      percentage_remaining: remaining / budget * 100
    }
  end
end
```

### Error Budget Policy

Error budgets balance reliability with feature velocity. When budget is exhausted, halt releases.

```elixir
defmodule CGraph.ErrorBudgetPolicy do
  @doc """
  Error Budget Policy (Google SRE standard):

  1. If error budget > 50% remaining: Normal development
  2. If error budget 20-50% remaining: Increased monitoring
  3. If error budget < 20% remaining: Freeze non-critical releases
  4. If error budget exhausted: All hands on reliability

  Single incident consuming >20% budget requires postmortem.
  """

  def policy_action(remaining_percentage) do
    cond do
      remaining_percentage > 50 ->
        {:normal, "Continue normal development velocity"}

      remaining_percentage > 20 ->
        {:caution, "Increase monitoring, prioritize reliability work"}

      remaining_percentage > 0 ->
        {:freeze, "Halt non-critical releases, focus on stability"}

      true ->
        {:emergency, "All hands on deck, reliability-only work"}
    end
  end

  def requires_postmortem?(budget_consumed_by_incident) do
    budget_consumed_by_incident > 0.20  # >20% of budget
  end
end
```

### Alerting on SLOs (Multi-Window, Multi-Burn-Rate)

```elixir
# Alert when burning error budget too fast
defmodule CGraph.SLOAlerting do
  @doc """
  Multi-window, multi-burn-rate alerting (Google best practice):

  - 2% budget consumed in 1 hour = page immediately (36x burn rate)
  - 5% budget consumed in 6 hours = page (10x burn rate)
  - 10% budget consumed in 3 days = ticket (1x burn rate)
  """

  @alert_rules [
    # Critical: will exhaust budget in <2 days
    %{window: :timer.hours(1), budget_consumed: 0.02, severity: :critical},

    # Warning: will exhaust budget in <10 days
    %{window: :timer.hours(6), budget_consumed: 0.05, severity: :warning},

    # Info: on track to exhaust budget
    %{window: :timer.hours(72), budget_consumed: 0.10, severity: :info}
  ]

  def check_burn_rate(slo_name, errors_in_window, total_requests, window) do
    error_rate = errors_in_window / total_requests
    budget = CGraph.SLO.error_budget(slo_name)

    # Calculate burn rate (how fast we're consuming budget)
    burn_rate = error_rate / budget

    # Find matching alert rule
    Enum.find(@alert_rules, fn rule ->
      rule.window == window && error_rate > rule.budget_consumed * budget
    end)
  end
end
```

---

## Google TypeScript Standards

Following [Google's TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) for
consistency.

### Naming Conventions

```typescript
// Classes, interfaces, types, enums: PascalCase
class UserService {}
interface MessagePayload {}
type ConversationId = string;
enum MessageStatus {
  Pending,
  Sent,
  Delivered,
}

// Variables, functions, methods: camelCase
const messageCount = 0;
function sendMessage() {}

// Constants: CONSTANT_CASE for truly immutable values
const MAX_MESSAGE_LENGTH = 10000;
const API_ENDPOINTS = { users: '/api/v1/users' } as const;

// Private members: no underscore prefix (use TypeScript's private)
class Service {
  private cache: Map<string, unknown>; // NOT: _cache
}

// File names: kebab-case
// user-service.ts, message-handler.ts, api-utils.ts

// React components: PascalCase (required for JSX)
function UserProfile() {} // Component
function formatDate() {} // NOT a component (lowercase)
```

### Type Annotations

```typescript
// ALWAYS annotate function parameters and return types
function calculateScore(votes: number, age: number): number {
  return votes / Math.pow(age + 2, 1.8);
}

// Use `unknown` instead of `any` for unknown types
function processInput(data: unknown): Result {
  if (isValidInput(data)) {
    return process(data);
  }
  throw new ValidationError('Invalid input');
}

// Prefer interfaces for object shapes
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

// Use type for unions and intersections
type Status = 'pending' | 'active' | 'archived';
type AdminUser = User & { permissions: string[] };

// Avoid type assertions - use type guards instead
// BAD
const user = data as User;

// GOOD
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'id' in data && 'email' in data;
}

if (isUser(data)) {
  // data is User here
}
```

### Null/Undefined Handling

```typescript
// Use nullish coalescing (??) over OR (||)
// BAD - fails for empty string or 0
const name = user.name || 'Anonymous';

// GOOD - only replaces null/undefined
const name = user.name ?? 'Anonymous';

// Use optional chaining (?.)
// BAD
const city = user && user.address && user.address.city;

// GOOD
const city = user?.address?.city;

// Explicit null checks for clarity
function getUser(id: string): User | null {
  const user = cache.get(id);
  if (user === undefined) {
    return null; // Explicit: not found
  }
  return user;
}
```

### Async/Await Patterns

```typescript
// Always use async/await over raw promises
// BAD
function fetchUser(id: string): Promise<User> {
  return api
    .get(`/users/${id}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new ApiError(error);
    });
}

// GOOD
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    throw new ApiError(error);
  }
}

// Use Promise.all for parallel operations
async function loadDashboard(userId: string) {
  const [user, messages, notifications] = await Promise.all([
    fetchUser(userId),
    fetchMessages(userId),
    fetchNotifications(userId),
  ]);

  return { user, messages, notifications };
}

// Use Promise.allSettled when some failures are acceptable
async function loadOptionalData(userId: string) {
  const results = await Promise.allSettled([fetchRecommendations(userId), fetchAnalytics(userId)]);

  return results
    .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
    .map((r) => r.value);
}
```

---

## Meta Scale Patterns

Meta serves 3.4 billion users with sophisticated caching and data access patterns. We adopt their
key strategies.

### TAO-Style Graph Caching

Meta's TAO (The Associations and Objects) system is optimized for social graph queries. Apply
similar patterns.

```elixir
defmodule CGraph.GraphCache do
  @moduledoc """
  TAO-inspired caching for social graph data.

  Key principles from Meta:
  1. Objects and associations are cached separately
  2. Read-through caching with write-through invalidation
  3. Multi-tier caching (like our L1/L2/L3)
  4. Leader-follower pattern for consistency
  """

  alias CGraph.Cache

  # Object cache (users, forums, threads)
  def get_object(type, id) do
    Cache.fetch("obj:#{type}:#{id}", fn ->
      load_object_from_db(type, id)
    end, ttl: ttl_for_type(type))
  end

  # Association cache (user->friends, thread->comments)
  def get_associations(type, id, assoc_type) do
    Cache.fetch("assoc:#{type}:#{id}:#{assoc_type}", fn ->
      load_associations_from_db(type, id, assoc_type)
    end, ttl: :timer.minutes(2))
  end

  # Association count (faster than loading full list)
  def get_association_count(type, id, assoc_type) do
    Cache.fetch("assoc_count:#{type}:#{id}:#{assoc_type}", fn ->
      count_associations_from_db(type, id, assoc_type)
    end, ttl: :timer.minutes(5))
  end

  # Write-through: update cache on writes
  def update_object(type, id, attrs) do
    case Repo.update(changeset) do
      {:ok, object} ->
        # Invalidate object cache
        Cache.delete("obj:#{type}:#{id}")
        # Invalidate any computed caches
        invalidate_computed_caches(type, id)
        {:ok, object}

      error ->
        error
    end
  end

  # Add association (friend, follow, etc.)
  def add_association(type, id, assoc_type, target_id) do
    case Repo.insert(association) do
      {:ok, assoc} ->
        # Invalidate association list and count
        Cache.delete("assoc:#{type}:#{id}:#{assoc_type}")
        Cache.increment("assoc_count:#{type}:#{id}:#{assoc_type}")
        {:ok, assoc}

      error ->
        error
    end
  end

  defp ttl_for_type(:user), do: :timer.minutes(5)
  defp ttl_for_type(:thread), do: :timer.minutes(2)
  defp ttl_for_type(:forum), do: :timer.minutes(5)
  defp ttl_for_type(_), do: :timer.minutes(1)
end
```

### Multi-Region Architecture

Meta's architecture supports multiple regions with leader-follower replication.

```elixir
defmodule CGraph.MultiRegion do
  @moduledoc """
  Multi-region data access pattern (Meta style).

  Architecture:
  - One leader region handles all writes
  - Follower regions serve reads with eventual consistency
  - Async replication with <3 second lag (p99)
  """

  @leader_region "fra"  # Frankfurt
  @current_region System.get_env("FLY_REGION", "fra")

  def is_leader?, do: @current_region == @leader_region

  # Writes always go to leader
  def write(changeset) do
    if is_leader?() do
      Repo.insert(changeset)
    else
      # Forward to leader region
      forward_to_leader(:write, changeset)
    end
  end

  # Reads prefer local region
  def read(query, opts \\ []) do
    consistency = Keyword.get(opts, :consistency, :eventual)

    case consistency do
      :eventual ->
        # Read from local replica (fast)
        ReadRepo.all(query)

      :strong ->
        # Read from leader (consistent but slower)
        if is_leader?() do
          Repo.all(query)
        else
          forward_to_leader(:read, query)
        end
    end
  end

  # Read-after-write: use leader for immediate consistency
  def read_after_write(id, read_fn) do
    # After a write, read from leader for a short window
    # to ensure consistency before replication completes
    if recently_wrote?(id) do
      read_fn.(:strong)
    else
      read_fn.(:eventual)
    end
  end
end
```

### Memcache-Style Request Coalescing

Prevent thundering herd by coalescing identical requests.

```elixir
defmodule CGraph.RequestCoalescing do
  @moduledoc """
  Request coalescing to prevent cache stampedes (Meta pattern).

  When multiple requests arrive for the same uncached key:
  1. First request computes the value
  2. Subsequent requests wait for first request
  3. All requests receive the same result
  """

  use GenServer

  def get_or_compute(key, compute_fn, opts \\ []) do
    case Cache.get(key) do
      {:ok, value} ->
        value

      :miss ->
        # Try to acquire lock
        case acquire_lock(key) do
          :acquired ->
            # We're the leader - compute and cache
            try do
              value = compute_fn.()
              Cache.set(key, value, opts)
              broadcast_result(key, {:ok, value})
              value
            rescue
              e ->
                broadcast_result(key, {:error, e})
                reraise e, __STACKTRACE__
            after
              release_lock(key)
            end

          {:waiting, ref} ->
            # Another process is computing - wait for result
            receive do
              {:result, ^ref, {:ok, value}} -> value
              {:result, ^ref, {:error, e}} -> raise e
            after
              opts[:timeout] || 5000 ->
                # Timeout - compute ourselves as fallback
                compute_fn.()
            end
        end
    end
  end
end
```

---

## Telegram Architecture Patterns

Telegram handles 1 billion+ users with a lean team through event-driven architecture and extreme
efficiency.

### Event-Driven Message Processing

Every action in Telegram triggers events that are processed asynchronously.

```elixir
defmodule CGraph.EventBus do
  @moduledoc """
  Event-driven architecture (Telegram pattern).

  Benefits:
  - Decouples message sending from delivery
  - Enables instant response to user
  - Background processing for heavy operations
  - Easy to add new event handlers
  """

  use GenStage

  # Event types
  @type event :: %{
    type: atom(),
    payload: map(),
    timestamp: DateTime.t(),
    trace_id: String.t()
  }

  # Publish event (non-blocking)
  def publish(type, payload) do
    event = %{
      type: type,
      payload: payload,
      timestamp: DateTime.utc_now(),
      trace_id: generate_trace_id()
    }

    # Queue for async processing
    Oban.insert(EventWorker.new(event))

    # Also broadcast for real-time subscribers
    Phoenix.PubSub.broadcast(CGraph.PubSub, "events:#{type}", event)

    :ok
  end

  # Example: Message sending flow
  def send_message(conversation_id, sender_id, content) do
    # 1. Validate and persist (fast)
    with {:ok, message} <- Messaging.create_message(attrs) do
      # 2. Publish event (non-blocking)
      publish(:message_sent, %{
        message_id: message.id,
        conversation_id: conversation_id,
        sender_id: sender_id
      })

      # 3. Return immediately to user
      {:ok, message}
    end
  end
end

# Event handlers process asynchronously
defmodule CGraph.EventHandlers.MessageSent do
  @moduledoc "Handles message_sent events"

  def handle(%{payload: %{message_id: id, conversation_id: conv_id}}) do
    # These happen in background, not blocking the sender
    Task.async_stream([
      fn -> deliver_to_recipients(conv_id, id) end,
      fn -> send_push_notifications(conv_id, id) end,
      fn -> update_conversation_preview(conv_id, id) end,
      fn -> index_for_search(id) end,
    ], max_concurrency: 4)
    |> Stream.run()
  end
end
```

### MTProto-Inspired Efficiency

Telegram's MTProto protocol minimizes overhead. Apply similar principles.

```typescript
// Minimize payload sizes (Telegram pattern)
interface MinimalMessagePayload {
  i: string; // id (short key names)
  c: string; // content
  s: string; // sender_id
  t: number; // timestamp (unix ms, not ISO string)
  f?: number; // flags (bit field for booleans)
}

// Flag bits for boolean fields
const MessageFlags = {
  IS_EDITED: 1 << 0, // 1
  IS_PINNED: 1 << 1, // 2
  HAS_MEDIA: 1 << 2, // 4
  IS_ENCRYPTED: 1 << 3, // 8
} as const;

// Encode message for transmission
function encodeMessage(msg: Message): MinimalMessagePayload {
  let flags = 0;
  if (msg.isEdited) flags |= MessageFlags.IS_EDITED;
  if (msg.isPinned) flags |= MessageFlags.IS_PINNED;
  if (msg.mediaUrl) flags |= MessageFlags.HAS_MEDIA;
  if (msg.isEncrypted) flags |= MessageFlags.IS_ENCRYPTED;

  return {
    i: msg.id,
    c: msg.content,
    s: msg.senderId,
    t: msg.createdAt.getTime(),
    f: flags || undefined, // omit if 0
  };
}

// Decode on client
function decodeMessage(payload: MinimalMessagePayload): Message {
  return {
    id: payload.i,
    content: payload.c,
    senderId: payload.s,
    createdAt: new Date(payload.t),
    isEdited: Boolean(payload.f && payload.f & MessageFlags.IS_EDITED),
    isPinned: Boolean(payload.f && payload.f & MessageFlags.IS_PINNED),
    hasMedia: Boolean(payload.f && payload.f & MessageFlags.HAS_MEDIA),
    isEncrypted: Boolean(payload.f && payload.f & MessageFlags.IS_ENCRYPTED),
  };
}
```

### Lean Engineering Principles

Telegram achieves massive scale with minimal team. Apply these principles.

```typescript
// 1. Automate everything
// Every manual process should be automated

// 2. No middle management in code
// Direct function calls, no unnecessary abstraction layers

// BAD - Over-engineered
class MessageServiceFactory {
  createService(config: Config): IMessageService {
    return new MessageServiceImpl(
      new MessageRepositoryFactory().create(config),
      new NotificationServiceFactory().create(config),
      new ValidationServiceFactory().create(config)
    );
  }
}

// GOOD - Direct and simple
async function sendMessage(conversationId: string, content: string) {
  const message = await db.messages.create({ conversationId, content });
  await notify(message);
  return message;
}

// 3. Build for the common case, handle edge cases gracefully
// 99% of messages are text - optimize for that
function processMessage(message: Message) {
  // Fast path for common case
  if (message.type === 'text' && !message.isEncrypted) {
    return processTextMessage(message); // Highly optimized
  }

  // Slow path for special cases
  return processSpecialMessage(message);
}

// 4. Measure everything, optimize bottlenecks
// Don't optimize prematurely, but track metrics to know where to focus
```

---

## Discord Architecture Patterns

Discord serves 200M+ users with an architecture nearly identical to CGraph: Elixir for real-time,
Rust for performance-critical paths. Their patterns are directly applicable.

### Gateway Sharding

Discord shards WebSocket connections across multiple gateway servers, each handling ~5,000 users.

```elixir
defmodule CGraph.Gateway.Shard do
  @moduledoc """
  Gateway sharding pattern (Discord style).

  Each shard handles ~5,000 concurrent users.
  If a shard crashes, only that subset of users is affected.

  Benefits:
  - Horizontal scaling: add shards as users grow
  - Fault isolation: shard failure affects only 5K users
  - Load distribution: even spread across servers
  """

  @users_per_shard 5_000

  def calculate_shard(user_id, total_shards) do
    # Consistent hashing ensures user always lands on same shard
    :erlang.phash2(user_id, total_shards)
  end

  def required_shards(total_users) do
    ceil(total_users / @users_per_shard)
  end

  # Shard state management
  defmodule State do
    defstruct [
      :shard_id,
      :session_id,
      :sequence,
      :heartbeat_interval,
      :connected_users,
      :guilds  # Discord calls servers "guilds"
    ]
  end

  # Each shard maintains its own state
  def init(shard_id) do
    %State{
      shard_id: shard_id,
      session_id: generate_session_id(),
      sequence: 0,
      heartbeat_interval: 41_250,  # Discord's heartbeat interval
      connected_users: MapSet.new(),
      guilds: %{}
    }
  end
end
```

### Elixir + Rust NIFs for Performance

Discord uses Rust NIFs (Native Implemented Functions) for CPU-intensive operations, allowing Elixir
to handle massive concurrency while Rust handles heavy computation.

````elixir
defmodule CGraph.Sorting.Native do
  @moduledoc """
  Rust NIF for sorting large member lists (Discord pattern).

  Problem: Elixir's immutable data structures cause memory pressure
  when sorting lists of 100K+ members.

  Solution: Use Rust NIF for O(1) memory sorting operations.

  Discord case study: Reduced member list updates from 5+ seconds
  to milliseconds for servers with 100K+ members.
  """

  use Rustler, otp_app: :cgraph, crate: "cgraph_native"

  # Rust NIF stubs - actual implementation in Rust
  def sort_members(_members, _sort_key), do: :erlang.nif_error(:nif_not_loaded)
  def merge_member_list(_existing, _new_member), do: :erlang.nif_error(:nif_not_loaded)
  def search_members(_members, _query), do: :erlang.nif_error(:nif_not_loaded)
end

# Example Rust implementation (src/lib.rs)
# ```rust
# use rustler::{Encoder, Env, NifResult, Term};
#
# #[rustler::nif]
# fn sort_members(members: Vec<Member>, sort_key: String) -> NifResult<Vec<Member>> {
#     let mut sorted = members;
#     match sort_key.as_str() {
#         "name" => sorted.sort_by(|a, b| a.name.cmp(&b.name)),
#         "joined_at" => sorted.sort_by(|a, b| a.joined_at.cmp(&b.joined_at)),
#         "status" => sorted.sort_by(|a, b| a.status.cmp(&b.status)),
#         _ => {}
#     }
#     Ok(sorted)
# }
# ```
````

### Session Resumption

Discord allows clients to resume sessions after brief disconnections without losing messages.

```elixir
defmodule CGraph.Gateway.SessionResumption do
  @moduledoc """
  Session resumption for graceful reconnection (Discord pattern).

  When a client disconnects briefly:
  1. Server keeps session alive for 30 seconds
  2. Client reconnects with session_id and last sequence number
  3. Server replays all missed events
  4. No messages are lost

  This dramatically improves UX during network hiccups.
  """

  alias CGraph.Cache

  @session_ttl :timer.seconds(30)
  @max_replay_events 1000

  # Store session state on disconnect
  def suspend_session(session_id, state) do
    Cache.set(
      "session:#{session_id}",
      %{
        user_id: state.user_id,
        subscriptions: state.subscriptions,
        last_sequence: state.sequence,
        events_buffer: state.pending_events,
        suspended_at: DateTime.utc_now()
      },
      ttl: @session_ttl
    )
  end

  # Attempt to resume session
  def resume_session(session_id, last_sequence) do
    case Cache.get("session:#{session_id}") do
      {:ok, session} ->
        # Calculate events to replay
        events_to_replay = get_events_since(session, last_sequence)

        if length(events_to_replay) <= @max_replay_events do
          # Resume successful - replay events
          {:ok, session, events_to_replay}
        else
          # Too many events missed - require fresh connection
          {:error, :too_many_missed_events}
        end

      :miss ->
        # Session expired
        {:error, :session_not_found}
    end
  end

  # Client-side handling
  def handle_disconnect(socket) do
    # Store last known state
    suspend_session(socket.assigns.session_id, socket.assigns)

    # Client will attempt resume with:
    # { op: 6, d: { token: "...", session_id: "...", seq: 1337 } }
  end
end
```

### Data Services Layer (Rust)

Discord's data services layer, written in Rust, handles database access with request coalescing.

```elixir
defmodule CGraph.DataServices do
  @moduledoc """
  Data services layer pattern (Discord style).

  Rust service that sits between Elixir and the database:
  1. Request coalescing: 1000 requests for same data = 1 DB query
  2. Connection pooling: Efficient database connection management
  3. Caching: In-memory cache for hot data
  4. Batching: Automatic batching of writes

  Discord uses this for their ScyllaDB message store.
  """

  # gRPC client to Rust data service
  def get_messages(channel_id, opts \\ []) do
    request = %{
      channel_id: channel_id,
      limit: opts[:limit] || 50,
      before: opts[:before],
      after: opts[:after]
    }

    # Rust service handles coalescing automatically
    # Multiple Elixir processes requesting same channel's messages
    # result in single database query
    DataServicesClient.get_messages(request)
  end

  # Write with automatic batching
  def create_message(channel_id, content, author_id) do
    request = %{
      channel_id: channel_id,
      content: content,
      author_id: author_id,
      nonce: generate_nonce()  # For deduplication
    }

    # Rust service batches writes for efficiency
    DataServicesClient.create_message(request)
  end
end
```

### Rate Limiting (Discord Style)

Discord enforces strict rate limits with per-route buckets.

```elixir
defmodule CGraph.RateLimiter.Discord do
  @moduledoc """
  Discord-style rate limiting with route buckets.

  Discord limits:
  - 120 requests per minute per route (with exceptions)
  - Gateway: 120 events per 60 seconds
  - Messages: 5 per 5 seconds per channel

  Headers returned:
  - X-RateLimit-Limit: Max requests in window
  - X-RateLimit-Remaining: Requests left
  - X-RateLimit-Reset: Unix timestamp when bucket resets
  - X-RateLimit-Bucket: Unique bucket identifier
  """

  @gateway_limit {120, 60_000}  # 120 events per minute
  @message_limit {5, 5_000}     # 5 messages per 5 seconds per channel

  def check_gateway_limit(user_id) do
    check_limit("gateway:#{user_id}", @gateway_limit)
  end

  def check_message_limit(channel_id, user_id) do
    # Per-channel, per-user limit
    check_limit("message:#{channel_id}:#{user_id}", @message_limit)
  end

  defp check_limit(key, {limit, window_ms}) do
    now = System.system_time(:millisecond)
    bucket = get_or_create_bucket(key, limit, window_ms)

    cond do
      bucket.remaining > 0 ->
        decrement_bucket(key)
        {:ok, bucket}

      bucket.reset_at > now ->
        retry_after = bucket.reset_at - now
        {:error, :rate_limited, retry_after}

      true ->
        # Window expired, reset bucket
        reset_bucket(key, limit, window_ms)
        {:ok, %{bucket | remaining: limit - 1}}
    end
  end

  # Response headers for rate limit info
  def rate_limit_headers(bucket) do
    [
      {"x-ratelimit-limit", to_string(bucket.limit)},
      {"x-ratelimit-remaining", to_string(bucket.remaining)},
      {"x-ratelimit-reset", to_string(div(bucket.reset_at, 1000))},
      {"x-ratelimit-reset-after", to_string(div(bucket.reset_at - now(), 1000))},
      {"x-ratelimit-bucket", bucket.id}
    ]
  end
end
```

### Presence Updates (Lazy Loading)

Discord uses lazy presence loading to reduce bandwidth.

```elixir
defmodule CGraph.Presence.LazyLoad do
  @moduledoc """
  Lazy presence loading (Discord pattern).

  For large servers (>75K members), Discord doesn't send all
  presence data upfront. Instead:

  1. Client receives guild with member count only
  2. Client requests presence for visible members
  3. Server sends presence in chunks as user scrolls

  This reduces initial payload from megabytes to kilobytes.
  """

  @lazy_threshold 75_000  # Members before lazy loading kicks in
  @chunk_size 100

  def should_lazy_load?(guild) do
    guild.member_count >= @lazy_threshold
  end

  # Initial guild data (minimal)
  def guild_payload(guild, lazy: true) do
    %{
      id: guild.id,
      name: guild.name,
      member_count: guild.member_count,
      # Don't include members or presences
      members: [],
      presences: []
    }
  end

  # Client requests members for visible area
  def request_guild_members(guild_id, opts) do
    %{
      guild_id: guild_id,
      query: opts[:query] || "",     # Search filter
      limit: min(opts[:limit], @chunk_size),
      presences: true,               # Include presence data
      user_ids: opts[:user_ids]      # Specific users (for sidebar)
    }
  end

  # Server responds with chunked data
  def guild_members_chunk(guild_id, members, chunk_index, chunk_count) do
    %{
      guild_id: guild_id,
      members: members,
      chunk_index: chunk_index,
      chunk_count: chunk_count,
      presences: Enum.map(members, &get_presence/1),
      not_found: []  # User IDs that don't exist
    }
  end
end
```

### Message Storage (ScyllaDB Patterns)

Discord migrated from Cassandra to ScyllaDB for message storage. Key patterns apply to PostgreSQL
too.

```elixir
defmodule CGraph.Messages.Storage do
  @moduledoc """
  Message storage patterns inspired by Discord's ScyllaDB migration.

  Key learnings from Discord:
  1. Partition by channel_id for locality
  2. Sort by message_id (time-based) within partition
  3. Use bucket suffixes for very active channels
  4. Separate hot (recent) and cold (old) data
  """

  # Bucket messages by time to prevent hot partitions
  # Very active channels get bucketed by day
  def message_bucket(channel_id, message_id) do
    timestamp = extract_timestamp(message_id)  # Snowflake ID contains timestamp
    bucket = div(timestamp, :timer.hours(24))  # Daily buckets

    "#{channel_id}:#{bucket}"
  end

  # Query recent messages (hot path - optimized)
  def get_recent_messages(channel_id, limit \\ 50) do
    current_bucket = message_bucket(channel_id, generate_snowflake())

    # Query current bucket first (most likely to have data)
    Message
    |> where(bucket: ^current_bucket)
    |> order_by(desc: :id)
    |> limit(^limit)
    |> Repo.all()
  end

  # Query historical messages (cold path)
  def get_historical_messages(channel_id, before_id, limit \\ 50) do
    target_bucket = message_bucket(channel_id, before_id)

    # May need to query multiple buckets
    Message
    |> where(bucket: ^target_bucket)
    |> where([m], m.id < ^before_id)
    |> order_by(desc: :id)
    |> limit(^limit)
    |> Repo.all()
  end

  # Snowflake ID generation (Discord style)
  # Encodes timestamp in ID for efficient time-based queries
  @discord_epoch 1_420_070_400_000  # Discord's epoch

  def generate_snowflake do
    timestamp = System.system_time(:millisecond) - @discord_epoch
    worker_id = get_worker_id()
    sequence = get_next_sequence()

    # 64-bit ID: timestamp (42 bits) | worker (10 bits) | sequence (12 bits)
    (timestamp <<< 22) ||| (worker_id <<< 12) ||| sequence
  end

  def extract_timestamp(snowflake) when is_integer(snowflake) do
    (snowflake >>> 22) + @discord_epoch
  end
end
```

---

## Observability & Monitoring

Comprehensive observability following Google SRE and Meta practices.

### Structured Logging

```elixir
defmodule CGraph.Logger do
  @moduledoc """
  Structured logging for observability.
  All logs must include: trace_id, service, duration_ms
  """

  require Logger

  def info(message, metadata \\ []) do
    Logger.info(message, enrich_metadata(metadata))
  end

  def error(message, metadata \\ []) do
    Logger.error(message, enrich_metadata(metadata))
  end

  defp enrich_metadata(metadata) do
    base = [
      trace_id: get_trace_id(),
      service: "cgraph",
      region: System.get_env("FLY_REGION"),
      instance: System.get_env("FLY_ALLOC_ID"),
      timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
    ]

    Keyword.merge(base, metadata)
  end

  # Log with timing
  def with_timing(operation, fun) do
    start = System.monotonic_time(:microsecond)

    try do
      result = fun.()
      duration = System.monotonic_time(:microsecond) - start

      info("#{operation} completed", [
        operation: operation,
        duration_us: duration,
        status: :success
      ])

      result
    rescue
      e ->
        duration = System.monotonic_time(:microsecond) - start

        error("#{operation} failed", [
          operation: operation,
          duration_us: duration,
          status: :error,
          error: inspect(e)
        ])

        reraise e, __STACKTRACE__
    end
  end
end
```

### Metrics Collection

```elixir
defmodule CGraph.Metrics do
  @moduledoc """
  Prometheus-style metrics for SLO tracking.
  """

  use Prometheus.Metric

  # Request metrics
  def setup do
    Counter.declare(
      name: :http_requests_total,
      labels: [:method, :path, :status],
      help: "Total HTTP requests"
    )

    Histogram.declare(
      name: :http_request_duration_ms,
      labels: [:method, :path],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
      help: "HTTP request duration in milliseconds"
    )

    Gauge.declare(
      name: :websocket_connections,
      labels: [:channel_type],
      help: "Active WebSocket connections"
    )

    Counter.declare(
      name: :cache_operations_total,
      labels: [:cache_level, :operation, :result],
      help: "Cache operations (hit/miss/error)"
    )
  end

  def track_request(method, path, status, duration_ms) do
    Counter.inc(
      name: :http_requests_total,
      labels: [method, path, status]
    )

    Histogram.observe(
      name: :http_request_duration_ms,
      labels: [method, path],
      value: duration_ms
    )
  end

  def track_cache(level, operation, result) do
    Counter.inc(
      name: :cache_operations_total,
      labels: [level, operation, result]
    )
  end
end
```

### Distributed Tracing

```elixir
defmodule CGraph.Tracing do
  @moduledoc """
  Distributed tracing for request flow visibility.
  """

  def start_span(name, parent_id \\ nil) do
    span_id = generate_span_id()
    trace_id = parent_id || generate_trace_id()

    Process.put(:current_span, %{
      span_id: span_id,
      trace_id: trace_id,
      parent_id: parent_id,
      name: name,
      start_time: System.monotonic_time(:microsecond)
    })

    span_id
  end

  def end_span(metadata \\ []) do
    case Process.get(:current_span) do
      nil ->
        :ok

      span ->
        duration = System.monotonic_time(:microsecond) - span.start_time

        emit_span(%{
          span
          | duration_us: duration,
            metadata: metadata
        })

        Process.delete(:current_span)
    end
  end

  # Wrap function with automatic span
  defmacro trace(name, do: block) do
    quote do
      CGraph.Tracing.start_span(unquote(name))

      try do
        result = unquote(block)
        CGraph.Tracing.end_span(status: :ok)
        result
      rescue
        e ->
          CGraph.Tracing.end_span(status: :error, error: inspect(e))
          reraise e, __STACKTRACE__
      end
    end
  end
end

# Usage
defmodule CGraph.Forums do
  import CGraph.Tracing

  def get_thread(id) do
    trace "forums.get_thread" do
      thread = Repo.get(Thread, id)

      trace "forums.get_thread.load_comments" do
        Repo.preload(thread, :comments)
      end
    end
  end
end
```

---

## SOLID Principles

### S - Single Responsibility Principle

Each module/function/class should have ONE reason to change.

```typescript
// BAD - Multiple responsibilities
function saveUserAndSendEmail(user: User) {
  db.save(user);
  emailService.send(user.email, 'Welcome!');
  analytics.track('user_created', user.id);
}

// GOOD - Single responsibility each
function saveUser(user: User) {
  db.save(user);
}
function sendWelcomeEmail(email: string) {
  emailService.send(email, 'Welcome!');
}
function trackUserCreated(userId: string) {
  analytics.track('user_created', userId);
}

// Orchestration layer combines them
async function onUserRegistration(user: User) {
  await saveUser(user);
  await sendWelcomeEmail(user.email);
  trackUserCreated(user.id);
}
```

### O - Open/Closed Principle

Open for extension, closed for modification.

```typescript
// BAD - Must modify function to add new types
function getIcon(type: string) {
  if (type === 'success') return '✓';
  if (type === 'error') return '✗';
  if (type === 'warning') return '⚠'; // Added later, modified existing code
}

// GOOD - Extend via configuration
const ICONS: Record<NotificationType, string> = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ', // Added without modifying existing code
};

function getIcon(type: NotificationType): string {
  return ICONS[type];
}
```

### L - Liskov Substitution Principle

Subtypes must be substitutable for their base types.

```typescript
// BAD - Violates LSP
class Rectangle {
  setWidth(w: number) {
    this.width = w;
  }
  setHeight(h: number) {
    this.height = h;
  }
}

class Square extends Rectangle {
  setWidth(w: number) {
    this.width = w;
    this.height = w;
  } // Breaks expectation
}

// GOOD - Use composition or separate types
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(
    private width: number,
    private height: number
  ) {}
  getArea() {
    return this.width * this.height;
  }
}

class Square implements Shape {
  constructor(private side: number) {}
  getArea() {
    return this.side * this.side;
  }
}
```

### I - Interface Segregation Principle

Clients shouldn't depend on interfaces they don't use.

```typescript
// BAD - Fat interface
interface User {
  id: string;
  email: string;
  password: string;
  creditCard: string;
  shippingAddress: string;
  preferences: UserPreferences;
}

// GOOD - Segregated interfaces
interface UserIdentity {
  id: string;
  email: string;
}

interface UserAuth extends UserIdentity {
  password: string;
}

interface UserPayment {
  creditCard: string;
}

interface UserShipping {
  shippingAddress: string;
}

// Components only receive what they need
function ProfileHeader({ user }: { user: UserIdentity }) { ... }
function PaymentForm({ payment }: { payment: UserPayment }) { ... }
```

### D - Dependency Inversion Principle

Depend on abstractions, not concretions.

```typescript
// BAD - Direct dependency on implementation
class UserService {
  private db = new PostgresDatabase();

  getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}

// GOOD - Depend on abstraction
interface Database {
  query<T>(sql: string, params: unknown[]): Promise<T>;
}

class UserService {
  constructor(private db: Database) {}

  getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}

// Now testable with mock database
const mockDb: Database = { query: jest.fn() };
const service = new UserService(mockDb);
```

---

## Clean Code Fundamentals

### Naming Conventions

```typescript
// BAD - Unclear names
const d = new Date();
const u = users.filter((x) => x.a);
function calc(n: number) {
  return n * 1.1;
}

// GOOD - Intention-revealing names
const currentDate = new Date();
const activeUsers = users.filter((user) => user.isActive);
function calculatePriceWithTax(basePrice: number): number {
  return basePrice * 1.1;
}
```

**Rules:**

- Use **nouns** for variables: `user`, `messageList`, `isLoading`
- Use **verbs** for functions: `getUser`, `sendMessage`, `validateInput`
- Use **adjectives** for booleans: `isActive`, `hasPermission`, `canEdit`
- Avoid abbreviations: `usr`, `msg`, `btn` → `user`, `message`, `button`
- Be specific: `data` → `userData`, `items` → `cartItems`

### Function Design

```typescript
// BAD - Too many parameters
function createUser(
  name: string,
  email: string,
  age: number,
  country: string,
  language: string,
  timezone: string,
  isAdmin: boolean
) { ... }

// GOOD - Use options object
interface CreateUserOptions {
  name: string;
  email: string;
  age?: number;
  country?: string;
  language?: string;
  timezone?: string;
  isAdmin?: boolean;
}

function createUser(options: CreateUserOptions) { ... }
```

**Rules:**

- Max 3 parameters, use options object for more
- Functions should be < 20 lines (aim for < 10)
- One level of abstraction per function
- No side effects in pure functions
- Return early to reduce nesting

### Comments

```typescript
// BAD - Stating the obvious
// Increment counter by 1
counter++;

// BAD - Outdated comment
// Returns user's full name
function getDisplayName(user: User) {
  return user.nickname || user.email; // Comment is wrong!
}

// GOOD - Explain WHY, not WHAT
// Using nickname as fallback because some OAuth providers
// don't provide a display name
function getDisplayName(user: User): string {
  return user.displayName || user.nickname || user.email;
}

// GOOD - Document non-obvious behavior
// NOTE: This timeout matches the server's session expiry (30 min)
// to ensure tokens are refreshed before they expire
const TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000;
```

**Rules:**

- Code should be self-documenting
- Comments explain WHY, not WHAT
- Delete commented-out code (use git history)
- Update comments when code changes
- Use JSDoc for public APIs

---

## Anti-Patterns to Avoid

### 1. Nested Ternary Operators

```typescript
// NEVER DO THIS
const result = a ? (b ? c : d) : e ? f : g;

// RULE: Max one `?` per expression
// ALWAYS extract to function if more than one condition
function getResult(a: boolean, b: boolean, e: boolean): Result {
  if (a && b) return c;
  if (a) return d;
  if (e) return f;
  return g;
}
```

### 2. Duplicate Code Blocks

```typescript
// NEVER copy-paste logic
// If you find yourself copying, extract to a function

// BAD
function handleSuccess(data: Data) {
  setState({ loading: false, error: null, data });
  toast.success('Operation completed');
  analytics.track('success');
}

function handleUpdate(data: Data) {
  setState({ loading: false, error: null, data }); // Duplicated!
  toast.success('Operation completed'); // Duplicated!
  analytics.track('success'); // Duplicated!
}

// GOOD
function completeOperation(data: Data, eventName: string) {
  setState({ loading: false, error: null, data });
  toast.success('Operation completed');
  analytics.track(eventName);
}
```

### 3. Switch Statements for Simple Mappings

```typescript
// BAD
switch (status) {
  case 'pending':
    return 'yellow';
  case 'active':
    return 'green';
  case 'inactive':
    return 'gray';
  case 'error':
    return 'red';
  default:
    return 'gray';
}

// GOOD
const STATUS_COLORS: Record<Status, string> = {
  pending: 'yellow',
  active: 'green',
  inactive: 'gray',
  error: 'red',
};
return STATUS_COLORS[status] ?? 'gray';
```

### 4. Functions Inside Components

```typescript
// BAD - Recreated every render
function UserList({ users }: Props) {
  const formatName = (user: User) => `${user.firstName} ${user.lastName}`;
  const sortByName = (a: User, b: User) => a.name.localeCompare(b.name);
  // ...
}

// GOOD - Module level pure functions
function formatUserName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

function sortUsersByName(a: User, b: User): number {
  return a.name.localeCompare(b.name);
}

function UserList({ users }: Props) {
  // Uses stable references
}
```

### 5. God Objects/Functions

```typescript
// BAD - Does everything
function handleFormSubmit(event: FormEvent) {
  event.preventDefault();
  const data = new FormData(event.target);
  const name = data.get('name');
  const email = data.get('email');
  // Validate name...
  // Validate email...
  // Format data...
  // Call API...
  // Handle response...
  // Update state...
  // Show toast...
  // Redirect...
  // 200 lines later...
}

// GOOD - Composed of focused functions
function handleFormSubmit(event: FormEvent) {
  event.preventDefault();
  const formData = extractFormData(event);
  const validation = validateUserData(formData);

  if (!validation.isValid) {
    showValidationErrors(validation.errors);
    return;
  }

  submitUserData(formData);
}
```

### 6. Magic Numbers/Strings

```typescript
// BAD
if (user.role === 2) { ... }
setTimeout(callback, 86400000);
if (items.length > 50) { ... }

// GOOD
const ROLES = { USER: 1, ADMIN: 2, SUPER_ADMIN: 3 } as const;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ITEMS_PER_PAGE = 50;

if (user.role === ROLES.ADMIN) { ... }
setTimeout(callback, ONE_DAY_MS);
if (items.length > MAX_ITEMS_PER_PAGE) { ... }
```

### 7. Premature Abstraction

```typescript
// BAD - Over-engineered for one use case
class AbstractNotificationFactory<T extends Notification> {
  abstract create(config: NotificationConfig): T;
  abstract validate(notification: T): ValidationResult;
  // ... 100 lines of "flexibility"
}

// GOOD - Simple and direct
function showNotification(message: string, type: 'success' | 'error' = 'success') {
  toast[type](message);
}

// Abstract ONLY when you have 3+ concrete use cases (Rule of Three)
```

### 8. Boolean Parameter Blindness

```typescript
// BAD - What does `true` mean?
fetchUsers(true, false, true);

// GOOD - Use options object
fetchUsers({
  includeInactive: true,
  includeDeleted: false,
  sortByDate: true,
});

// OR use separate functions
fetchActiveUsers();
fetchAllUsersIncludingInactive();
```

### 9. Callback Hell

```typescript
// BAD
getUser(userId, (user) => {
  getOrders(user.id, (orders) => {
    getOrderDetails(orders[0].id, (details) => {
      updateUI(details);
    });
  });
});

// GOOD - async/await
async function loadUserOrderDetails(userId: string) {
  const user = await getUser(userId);
  const orders = await getOrders(user.id);
  const details = await getOrderDetails(orders[0].id);
  updateUI(details);
}
```

### 10. Unnecessary Type Assertions

```typescript
// BAD - Hiding type errors
const user = data as User;
const value = obj.prop as any;
element.style.color = color as string;

// GOOD - Type guards and proper typing
function isUser(data: unknown): data is User {
  return data !== null && typeof data === 'object' && 'id' in data;
}

if (isUser(data)) {
  // data is typed as User here
}
```

---

## TypeScript/React Best Practices

### Component Structure

```typescript
// Standard component file structure:
// 1. Imports
// 2. Types/Interfaces
// 3. Constants
// 4. Helper functions (pure, at module level)
// 5. Component
// 6. Exports

// Example:
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui';

// Types
interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
}

// Constants
const AVATAR_SIZES: Record<Size, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

// Pure helpers at module level
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

// Component
export function UserCard({ user, onSelect }: UserCardProps) {
  const handleClick = useCallback(() => {
    onSelect?.(user);
  }, [user, onSelect]);

  return (
    <div onClick={handleClick}>
      {/* ... */}
    </div>
  );
}
```

### Props Interface Design

```typescript
// BAD - Optional everything
interface ButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
  // 20 more optional props...
}

// GOOD - Required props are required, logical groupings
interface ButtonProps {
  /** Button text content */
  children: ReactNode;
  /** Click handler - required for interactive buttons */
  onClick: () => void;
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state - shows spinner and disables */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// For icon buttons, create a separate component
interface IconButtonProps {
  icon: ReactNode;
  label: string; // For accessibility
  onClick: () => void;
  // ...
}
```

### Hooks Usage

```typescript
// BAD - Unnecessary state
function SearchInput() {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  // ...
}

// GOOD - Use a custom hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function SearchInput() {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, 300);
  // ...
}
```

### Type Guards

```typescript
// Always use type guards for runtime checks
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

function isUser(value: unknown): value is User {
  return (
    value !== null &&
    typeof value === 'object' &&
    'id' in value &&
    'email' in value &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).email === 'string'
  );
}

function isApiError(error: unknown): error is ApiError {
  return error !== null && typeof error === 'object' && 'code' in error && 'message' in error;
}
```

### Exhaustive Switch Pattern

Use the `never` type to ensure all union cases are handled at compile time:

```typescript
// CGraph message types - must handle ALL cases
type MessageType = 'text' | 'image' | 'video' | 'file' | 'audio' | 'sticker' | 'gif' | 'system';

function getMessageIcon(type: MessageType): string {
  switch (type) {
    case 'text':
      return '💬';
    case 'image':
      return '🖼️';
    case 'video':
      return '🎬';
    case 'file':
      return '📎';
    case 'audio':
      return '🎵';
    case 'sticker':
      return '🎨';
    case 'gif':
      return '🎞️';
    case 'system':
      return 'ℹ️';
    default:
      // TypeScript error if a case is missing!
      const _exhaustive: never = type;
      throw new Error(`Unhandled message type: ${_exhaustive}`);
  }
}

// ❌ BAD: Silent default fallback hides bugs
function getIconBad(type: MessageType): string {
  switch (type) {
    case 'text':
      return '💬';
    case 'image':
      return '🖼️';
    default:
      return '📄'; // Silently handles new types - DANGEROUS
  }
}
```

### Discriminated Unions

Use a shared literal property to enable TypeScript's type narrowing:

```typescript
// API response with discriminated 'status' field
type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string; code: number }
  | { status: 'loading' };

function handleResponse<T>(response: ApiResponse<T>): T | null {
  switch (response.status) {
    case 'success':
      // TypeScript knows `data` exists here
      return response.data;
    case 'error':
      // TypeScript knows `error` and `code` exist here
      logger.error(`API error ${response.code}: ${response.error}`);
      throw new Error(response.error);
    case 'loading':
      return null;
    default:
      const _exhaustive: never = response;
      throw new Error(`Unhandled status: ${_exhaustive}`);
  }
}

// Real CGraph example: User status
type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

function getStatusColor(status: UserStatus): string {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'idle':
      return 'bg-yellow-500';
    case 'dnd':
      return 'bg-red-500';
    case 'offline':
      return 'bg-gray-500';
    default:
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
  }
}
```

### Barrel Exports (index.ts)

Organize module exports with barrel files for clean imports:

```typescript
// packages/ui/src/index.ts - named exports with types
export { cn } from './lib/utils';
export { Button, buttonVariants, type ButtonProps } from './components/button';
export { Input, type InputProps } from './components/input';
export { Dialog, DialogContent, DialogHeader } from './components/dialog';

// packages/shared/src/index.ts - re-export modules
export * from './format';
export * from './validation';
export * from './permissions';
export * from './helpers';

// ❌ AVOID: Default exports in barrel files
export { default as Button } from './Button'; // Harder to tree-shake

// ✅ PREFER: Named exports
export { Button } from './Button';
```

---

## React Performance Patterns

### Memoization

```typescript
// Use React.memo for expensive renders
const ExpensiveList = React.memo(function ExpensiveList({ items }: Props) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});

// Custom comparison for complex props
const UserCard = React.memo(
  function UserCard({ user, onSelect }: Props) { ... },
  (prev, next) => prev.user.id === next.user.id
);

// useMemo for expensive calculations
function Dashboard({ data }: Props) {
  const statistics = useMemo(() => {
    return calculateExpensiveStatistics(data);
  }, [data]);

  return <StatsDisplay stats={statistics} />;
}

// useCallback for stable function references
function Parent() {
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  return <ChildList onSelect={handleSelect} />;
}
```

### Avoid Re-renders

```typescript
// BAD - New object every render
<Component style={{ color: 'red' }} />
<Component data={{ id: 1, name: 'test' }} />
<Component onClick={() => handleClick(id)} />

// GOOD - Stable references
const styles = useMemo(() => ({ color: 'red' }), []);
const data = useMemo(() => ({ id: 1, name: 'test' }), []);
const handleClick = useCallback(() => onClick(id), [id, onClick]);

// Or define outside component if static
const RED_STYLE = { color: 'red' };
```

### Code Splitting

```typescript
// Lazy load heavy components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AnalyticsChart = lazy(() => import('./AnalyticsChart'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

### Virtualization

```typescript
// For long lists, use virtualization
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
            }}
          >
            <ItemRow item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## State Management Patterns

CGraph uses Zustand for state management with domain-specific stores. These patterns are based on
actual CGraph infrastructure.

### Zustand Store Architecture

```typescript
// CGraph store pattern with middleware composition
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';
import { chatLogger as logger } from '@/lib/logger';

// PATTERN 1: devtools only (most stores)
// Use for: stores that don't need persistence
export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      messages: {},
      // Actions
      addMessage: (convId, message) => {
        logger.debug('Adding message', { convId, messageId: message.id });
        set((state) => ({
          messages: {
            ...state.messages,
            [convId]: [...(state.messages[convId] || []), message],
          },
        }));
      },
    }),
    { name: 'ChatStore' }
  )
);

// PATTERN 2: persist + devtools (user preferences)
// Use for: settings that should survive page refresh
export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        colorPreset: 'emerald',
        animationSpeed: 'normal',
        setColorPreset: (preset) => set({ colorPreset: preset }),
      }),
      {
        name: 'cgraph-theme',
        storage: createJSONStorage(() => safeLocalStorage),
        partialize: (state) => ({
          colorPreset: state.colorPreset,
          animationSpeed: state.animationSpeed,
        }),
      }
    ),
    { name: 'ThemeStore' }
  )
);

// PATTERN 3: No middleware (lightweight stores)
// Use for: transient UI state
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

### Domain-Specific Stores (CGraph Structure)

```typescript
// CGraph uses domain-specific stores, NOT a monolithic store:
// ├── authStore.ts        - Authentication, user session
// ├── chatStore.ts        - Conversations, messages, typing
// ├── groupStore.ts       - Group servers, channels
// ├── forumStore.ts       - Forums, threads, posts
// ├── themeStore.ts       - UI theming, color presets
// ├── customizationStore.ts - User customizations, items
// ├── notificationStore.ts - Push notifications
// └── gamificationStore.ts - XP, achievements, rewards

// Each store manages its own domain, reducing complexity
// Inter-store communication via direct imports (not global state)
```

### Selector Patterns (CGraph Actual)

```typescript
// BAD - Selecting entire store causes re-renders
const { user, messages, settings } = useStore();

// GOOD - Select only what you need
const user = useAuthStore((state) => state.user);
const conversations = useChatStore((state) => state.conversations);

// GOOD - Memoized selectors for derived data
const selectUnreadCount = (state: ChatState) =>
  state.conversations.reduce((sum, c) => sum + c.unreadCount, 0);

const unreadCount = useChatStore(selectUnreadCount);

// GOOD - Computed selectors with stable reference
const selectActiveConversation = (state: ChatState) => {
  const id = state.activeConversationId;
  return id ? state.conversations.find((c) => c.id === id) : null;
};
```

### Immutable Updates (Spread Pattern)

```typescript
// CGraph uses spread operators for immutable updates (NOT Immer)
// This is simpler and more predictable for most use cases

// BAD - Direct mutation
state.messages.push(newMessage);

// GOOD - Spread operator (CGraph standard)
const useChatStore = create<ChatState>()((set) => ({
  messages: {},

  addMessage: (convId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]: [...(state.messages[convId] || []), message],
      },
    })),

  updateMessage: (convId, messageId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]:
          state.messages[convId]?.map((m) => (m.id === messageId ? { ...m, ...updates } : m)) ?? [],
      },
    })),

  removeMessage: (convId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [convId]: state.messages[convId]?.filter((m) => m.id !== messageId) ?? [],
      },
    })),
}));
```

### Store Helpers Utilities

```typescript
// CGraph provides shared utilities in stores/utils/storeHelpers.ts

import {
  createToggle,
  createToggles,
  toApiParams,
  fromApiParams,
} from '@/stores/utils/storeHelpers';

// Toggle factory - creates toggle functions for boolean fields
const useSettingsStore = create<SettingsState>((set) => ({
  darkMode: false,
  notifications: true,
  toggleDarkMode: createToggle(set, 'darkMode'),
  toggleNotifications: createToggle(set, 'notifications'),
}));

// Bulk toggle creation
const toggles = createToggles(set, ['darkMode', 'notifications', 'soundEnabled']);
// Creates: toggleDarkMode, toggleNotifications, toggleSoundEnabled

// API serialization (camelCase <-> snake_case)
const apiParams = toApiParams(
  { colorPreset: 'emerald', animationSpeed: 'fast' },
  { colorPreset: 'color_preset', animationSpeed: 'animation_speed' }
);
// Result: { color_preset: 'emerald', animation_speed: 'fast' }
```

### Centralized Mappings Pattern

```typescript
// CGraph uses centralized mappings for ID resolution
// See: stores/customization/mappings.ts

// Maps item IDs to their visual types
export const BORDER_ID_TO_TYPE: Record<string, AvatarBorderType> = {
  b1: 'static',
  b5: 'pulse',
  b6: 'rotate',
  b10: 'fire',
  b14: 'legendary',
  b15: 'mythic',
};

// Maps theme IDs to color presets
export const THEME_ID_TO_PRESET: Record<string, ThemePreset> = {
  'profile-ocean': 'cyan',
  'profile-forest': 'emerald',
  'chat-neon': 'pink',
};

// Helper functions for consistent resolution
export function getBorderType(itemId: string): AvatarBorderType {
  return BORDER_ID_TO_TYPE[itemId] ?? 'static';
}

export function getThemeColor(themeId: string): ThemePreset {
  return THEME_ID_TO_PRESET[themeId] ?? 'purple';
}
```

---

## Real-Time WebSocket Patterns

CGraph uses Phoenix Channels for all real-time communication. Follow these patterns for efficient
WebSocket handling.

### Channel Connection Management

```typescript
// BAD - Creating new channels without checking existing
function joinConversation(conversationId: string) {
  const channel = socket.channel(`conversation:${conversationId}`);
  channel.join();
}

// GOOD - Reuse existing channels, debounce joins
const channelCache = new Map<string, Channel>();
const joinDebounce = new Map<string, number>();
const JOIN_DEBOUNCE_MS = 1000;

function joinConversation(conversationId: string): Channel {
  const topic = `conversation:${conversationId}`;

  // Check for existing channel
  const existing = channelCache.get(topic);
  if (existing?.state === 'joined' || existing?.state === 'joining') {
    return existing;
  }

  // Debounce rapid join attempts
  const lastJoin = joinDebounce.get(topic) || 0;
  if (Date.now() - lastJoin < JOIN_DEBOUNCE_MS) {
    return existing!;
  }
  joinDebounce.set(topic, Date.now());

  const channel = socket.channel(topic);
  channelCache.set(topic, channel);

  channel
    .join()
    .receive('ok', () => console.log(`Joined ${topic}`))
    .receive('error', ({ reason }) => console.error(`Failed: ${reason}`));

  return channel;
}
```

### Event Handler Registration

```typescript
// BAD - Registering handlers multiple times
useEffect(() => {
  channel.on('new_message', handleNewMessage);
  channel.on('typing', handleTyping);
}, [channel]); // Runs on every channel change!

// GOOD - Idempotent handler registration with cleanup
const handlerRefs = useRef<Set<string>>(new Set());

useEffect(() => {
  if (!channel) return;

  const handlers = [
    { event: 'new_message', handler: handleNewMessage },
    { event: 'typing', handler: handleTyping },
    { event: 'message_deleted', handler: handleDelete },
  ];

  handlers.forEach(({ event, handler }) => {
    const key = `${channel.topic}:${event}`;
    if (!handlerRefs.current.has(key)) {
      channel.on(event, handler);
      handlerRefs.current.add(key);
    }
  });

  return () => {
    handlers.forEach(({ event }) => {
      const key = `${channel.topic}:${event}`;
      channel.off(event);
      handlerRefs.current.delete(key);
    });
  };
}, [channel]);
```

### Presence Tracking

```typescript
// CGraph channel types and their purposes
const CHANNEL_TOPICS = {
  // Per-user notifications (private)
  user: (userId: string) => `user:${userId}`,

  // Global friend presence
  presenceLobby: () => 'presence:lobby',

  // Direct message conversations
  conversation: (id: string) => `conversation:${id}`,

  // Group server channels
  channel: (id: string) => `channel:${id}`,

  // Forum-wide updates
  forum: (id: string) => `forum:${id}`,

  // Thread-specific updates
  thread: (id: string) => `thread:${id}`,
} as const;

// Presence peek for temporary joins (don't maintain connection)
async function peekPresence(topic: string): Promise<PresenceState> {
  return new Promise((resolve, reject) => {
    const channel = socket.channel(topic);

    channel
      .join()
      .receive('ok', () => {
        const presence = channel.presenceState();
        channel.leave(); // Immediately leave after getting state
        resolve(presence);
      })
      .receive('error', reject)
      .receive('timeout', () => reject(new Error('Timeout')));
  });
}
```

### Typing Indicators

```typescript
// BAD - Sending typing event on every keystroke
function handleInput(e: ChangeEvent<HTMLInputElement>) {
  setValue(e.target.value);
  channel.push('typing', { userId });
}

// GOOD - Debounced typing with automatic stop
const TYPING_DEBOUNCE = 500;
const TYPING_TIMEOUT = 3000;

function useTypingIndicator(channel: Channel, userId: string) {
  const typingTimeout = useRef<NodeJS.Timeout>();
  const lastTyping = useRef<number>(0);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTyping.current > TYPING_DEBOUNCE) {
      channel.push('typing', { userId, isTyping: true });
      lastTyping.current = now;

      // Auto-stop typing after timeout
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        channel.push('typing', { userId, isTyping: false });
      }, TYPING_TIMEOUT);
    }
  }, [channel, userId]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimeout.current);
    channel.push('typing', { userId, isTyping: false });
    lastTyping.current = 0;
  }, [channel, userId]);

  return { sendTyping, stopTyping };
}
```

### Reconnection Strategy

```typescript
// Exponential backoff for reconnection
const RECONNECT_CONFIG = {
  initialDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
  jitter: 0.1, // 10% jitter to prevent thundering herd
};

function calculateBackoff(attempt: number): number {
  const { initialDelay, maxDelay, multiplier, jitter } = RECONNECT_CONFIG;
  const delay = Math.min(initialDelay * Math.pow(multiplier, attempt), maxDelay);
  const jitterAmount = delay * jitter * (Math.random() * 2 - 1);
  return Math.floor(delay + jitterAmount);
}

// Socket setup with reconnection
const socket = new Socket('/socket', {
  params: { token: getAuthToken() },
  reconnectAfterMs: (tries) => calculateBackoff(tries),
  heartbeatIntervalMs: 30000,
});
```

---

## CGraph Infrastructure Patterns

These patterns are specific to CGraph's architecture and solve real problems encountered in
production.

### Token Service (Circular Dependency Fix)

```typescript
// PROBLEM: Circular dependency between api.ts and authStore.ts
// api.ts needs tokens from authStore
// authStore.ts needs api for HTTP requests
// Result: "Cannot access 'X' before initialization" in production builds

// SOLUTION: Token Service as intermediary
// See: lib/tokenService.ts

// tokenService.ts - Stateless token access layer
type TokenGetter = () => string | null | undefined;
type TokenSetter = (tokens: { accessToken: string; refreshToken?: string | null }) => void;

let tokenConfig: {
  getAccessToken: TokenGetter;
  getRefreshToken: TokenGetter;
  setTokens: TokenSetter;
  onLogout: () => void;
} | null = null;

// Called by authStore on initialization
export function registerTokenHandlers(config: typeof tokenConfig): void {
  tokenConfig = config;
}

// Used by api.ts (no direct store import)
export function getAccessToken(): string | null {
  return tokenConfig?.getAccessToken() ?? null;
}

export function getRefreshToken(): string | null {
  return tokenConfig?.getRefreshToken() ?? null;
}

// authStore.ts - Registers handlers on load
import { registerTokenHandlers } from '@/lib/tokenService';

export const useAuthStore = create<AuthState>()((set, get) => {
  // Register token handlers immediately
  registerTokenHandlers({
    getAccessToken: () => get().accessToken,
    getRefreshToken: () => get().refreshToken,
    setTokens: ({ accessToken, refreshToken }) => {
      set({ accessToken, refreshToken });
    },
    onLogout: () => get().logout(),
  });

  return {
    accessToken: null,
    refreshToken: null,
    // ...rest of store
  };
});

// api.ts - Uses tokenService instead of authStore
import { getAccessToken, getRefreshToken, setTokensInStore } from '@/lib/tokenService';

export const api = createHttpClient({
  getAccessToken: () => getAccessToken(),
  getRefreshToken: () => getRefreshToken(),
  setTokens: async (tokens) => setTokensInStore(tokens),
});
```

### Production Logger with Error Tracking

```typescript
// CGraph uses namespaced loggers for consistent, trackable logging
// See: lib/logger.ts

import { captureError, captureMessage, addBreadcrumb } from '@/lib/errorTracking';

const isDev = import.meta.env?.DEV === true;

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (error: Error | string, ...args: unknown[]) => void;
  breadcrumb: (message: string, data?: Record<string, unknown>) => void;
}

/**
 * Creates a namespaced logger with error tracking integration
 */
export const createLogger = (namespace: string): Logger => {
  const prefix = `[${namespace}]`;

  return {
    debug: (...args) => {
      if (isDev) console.debug(prefix, ...args);
    },

    info: (...args) => {
      if (isDev) console.info(prefix, ...args);
    },

    warn: (...args) => {
      if (isDev) {
        console.warn(prefix, ...args);
      } else {
        // Production: sanitize and track
        captureMessage(`${namespace}: Warning`, 'warning', { component: namespace });
      }
    },

    error: (error, ...args) => {
      console.error(prefix, error, ...args);
      if (!isDev && error instanceof Error) {
        captureError(error, { component: namespace });
      }
    },

    breadcrumb: (message, data) => {
      addBreadcrumb({ category: namespace, message, data });
    },
  };
};

// Pre-configured loggers for different domains
export const chatLogger = createLogger('Chat');
export const socketLogger = createLogger('Socket');
export const e2eeLogger = createLogger('E2EE');
export const authLogger = createLogger('Auth');

// Usage in components/services:
import { chatLogger as logger } from '@/lib/logger';

function sendMessage(content: string) {
  logger.debug('Sending message', { length: content.length });
  logger.breadcrumb('Message sent');

  try {
    // ...
  } catch (error) {
    logger.error(error as Error, 'Failed to send message');
  }
}
```

### Safe Storage Pattern

```typescript
// CGraph uses safeLocalStorage for SSR compatibility and error handling
// See: lib/safeStorage.ts

/**
 * Safe localStorage wrapper that handles:
 * - SSR (window undefined)
 * - Private browsing mode
 * - Storage quota exceeded
 * - Corrupted storage data
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage.setItem failed:', e);
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

// Usage with Zustand persist middleware
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeLocalStorage } from '@/lib/safeStorage';

const useThemeStore = create(
  persist(
    (set) => ({
      /* state */
    }),
    {
      name: 'cgraph-theme',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
```

### API Client with Token Refresh

```typescript
// CGraph's API client handles token refresh, retry, and idempotency
// See: lib/api.ts

import { createHttpClient } from '@cgraph/utils';
import { getAccessToken, getRefreshToken, setTokensInStore, triggerLogout } from './tokenService';

export const api = createHttpClient({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  timeoutMs: 30000,
  withCredentials: true,

  // Token access via tokenService (no circular dependency)
  getAccessToken: () => getAccessToken(),
  getRefreshToken: () => getRefreshToken(),
  setTokens: async ({ accessToken, refreshToken }) => {
    setTokensInStore({ accessToken, refreshToken: refreshToken ?? null });
    // Reconnect socket with new token
    const { socketManager } = await import('./socket');
    if (socketManager.isConnected()) {
      await socketManager.reconnectWithNewToken();
    }
  },
  onLogout: async () => {
    await triggerLogout();
    window.location.href = '/login';
  },

  // Automatic token refresh
  refresh: {
    endpoint: '/api/v1/auth/refresh',
    buildBody: (rt) => ({ refresh_token: rt }),
    withCredentials: true,
    parseTokens: (data) => ({
      accessToken: data?.tokens?.access_token || data?.token,
      refreshToken: data?.tokens?.refresh_token,
    }),
  },

  // Retry with exponential backoff
  retry: {
    attempts: 3,
    backoffMs: 400,
    maxBackoffMs: 5000,
  },

  // Idempotency for safe retries
  idempotency: {
    enabled: true,
  },
});
```

### Socket Manager Class Pattern

```typescript
// CGraph uses a SocketManager class for WebSocket lifecycle management
// See: lib/socket.ts

class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private reconnectAttempts = 0;

  connect(token: string): void {
    if (this.socket?.isConnected()) return;

    this.socket = new Socket(getSocketUrl(), {
      params: { token },
      reconnectAfterMs: (tries) => this.calculateBackoff(tries),
      heartbeatIntervalMs: 30000,
    });

    this.socket.onOpen(() => {
      socketLogger.info('Connected');
      this.reconnectAttempts = 0;
    });

    this.socket.onError((error) => {
      socketLogger.error(error, 'Socket error');
    });

    this.socket.connect();
  }

  // Channel caching to prevent duplicate joins
  joinChannel(topic: string, params?: object): Channel {
    const existing = this.channels.get(topic);
    if (existing?.state === 'joined') return existing;

    const channel = this.socket!.channel(topic, params);
    this.channels.set(topic, channel);

    channel
      .join()
      .receive('ok', () => socketLogger.debug(`Joined ${topic}`))
      .receive('error', ({ reason }) => socketLogger.error(`Failed to join ${topic}: ${reason}`));

    return channel;
  }

  leaveChannel(topic: string): void {
    const channel = this.channels.get(topic);
    if (channel) {
      channel.leave();
      this.channels.delete(topic);
    }
  }

  async reconnectWithNewToken(): Promise<void> {
    const token = getAccessToken();
    if (!token) return;

    this.disconnect();
    await new Promise((r) => setTimeout(r, 100));
    this.connect(token);

    // Rejoin all channels
    for (const [topic] of this.channels) {
      this.joinChannel(topic);
    }
  }

  private calculateBackoff(attempt: number): number {
    const base = Math.min(1000 * Math.pow(2, attempt), 30000);
    const jitter = base * 0.1 * (Math.random() * 2 - 1);
    return Math.floor(base + jitter);
  }
}

export const socketManager = new SocketManager();
```

### Hooks Best Practices

```typescript
// CGraph hooks follow a consistent pattern
// See: hooks/useDebounce.ts

// Hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Hook for debounced callbacks (more flexible)
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
  };
}

// Hook for throttled callbacks (rate limiting)
export function useThrottledCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRunRef.current >= limit) {
      lastRunRef.current = now;
      callback(...args);
    }
  };
}

// Hook index pattern (centralized exports)
// See: hooks/index.ts
export { useDebounce, useDebouncedCallback, useThrottledCallback } from './useDebounce';
export { useLocalStorage } from './useLocalStorage';
export { useClickOutside } from './useClickOutside';
export { useMediaQuery } from './useMediaQuery';
// ... other hooks
```

---

## Phoenix Channels & Real-Time

Backend patterns for Phoenix Channels at scale.

### Channel Module Structure

```elixir
defmodule CGraphWeb.ConversationChannel do
  use CGraphWeb, :channel

  alias CGraph.{Messaging, Presence, Cache}

  # Always authenticate on join
  @impl true
  def join("conversation:" <> conversation_id, _params, socket) do
    with {:ok, user} <- get_user(socket),
         {:ok, conversation} <- Messaging.get_conversation(conversation_id),
         :ok <- authorize_member(user, conversation) do

      # Track presence
      send(self(), :after_join)

      {:ok, assign(socket, :conversation_id, conversation_id)}
    else
      {:error, :not_found} -> {:error, %{reason: "not_found"}}
      {:error, :unauthorized} -> {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    {:ok, _} = Presence.track(socket, socket.assigns.user_id, %{
      online_at: inspect(System.system_time(:second)),
      device: socket.assigns.device_type
    })

    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  # Rate limit message sending
  @impl true
  def handle_in("new_message", params, socket) do
    user_id = socket.assigns.user_id

    case RateLimiter.check("message:#{user_id}", limit: 60, window: 60_000) do
      :ok ->
        case Messaging.create_message(socket.assigns.conversation_id, user_id, params) do
          {:ok, message} ->
            broadcast!(socket, "new_message", MessageView.render("message.json", message))
            {:reply, :ok, socket}

          {:error, changeset} ->
            {:reply, {:error, format_errors(changeset)}, socket}
        end

      {:error, :rate_limited} ->
        {:reply, {:error, %{reason: "rate_limited"}}, socket}
    end
  end
end
```

### Efficient Broadcasting

```elixir
# BAD - Broadcasting to all subscribers with full payload
def broadcast_message(conversation_id, message) do
  CGraphWeb.Endpoint.broadcast!(
    "conversation:#{conversation_id}",
    "new_message",
    %{message: message, conversation: get_conversation(conversation_id), user: get_user(message.user_id)}
  )
end

# GOOD - Minimal payload, let clients fetch details if needed
def broadcast_message(conversation_id, message) do
  CGraphWeb.Endpoint.broadcast!(
    "conversation:#{conversation_id}",
    "new_message",
    %{
      id: message.id,
      sender_id: message.user_id,
      preview: String.slice(message.content, 0..100),
      created_at: message.inserted_at,
      # Include only what's needed for immediate display
      # Clients can fetch full message if needed
    }
  )
end

# For forum threads with many subscribers, use batched broadcasts
def broadcast_to_forum(forum_id, event, payload) do
  # Get subscriber count to decide strategy
  case Presence.count("forum:#{forum_id}") do
    count when count < 1000 ->
      # Direct broadcast for small audiences
      CGraphWeb.Endpoint.broadcast!("forum:#{forum_id}", event, payload)

    _large_count ->
      # Queue for background processing to avoid blocking
      Oban.insert(BroadcastWorker.new(%{
        topic: "forum:#{forum_id}",
        event: event,
        payload: payload
      }))
  end
end
```

### PubSub for Multi-Node (Required for Scale)

```elixir
# config/prod.exs - Use Redis PubSub for multi-node
config :cgraph, CGraphWeb.Endpoint,
  pubsub_server: CGraph.PubSub

config :cgraph, CGraph.PubSub,
  adapter: Phoenix.PubSub.Redis,
  host: System.get_env("REDIS_HOST"),
  port: System.get_env("REDIS_PORT"),
  node_name: System.get_env("FLY_ALLOC_ID") || node()

# For massive forums, use dedicated Redis channels
defmodule CGraph.ForumPubSub do
  @redis_pool :forum_pubsub

  def broadcast_thread_update(thread_id, event, payload) do
    channel = "thread:#{thread_id}"
    message = Jason.encode!(%{event: event, payload: payload})

    Redix.command(@redis_pool, ["PUBLISH", channel, message])
  end

  def subscribe_to_thread(thread_id) do
    Redix.PubSub.subscribe(@redis_pool, "thread:#{thread_id}", self())
  end
end
```

---

## CGraph Caching Patterns

CGraph uses a three-tier caching system. Follow these patterns for optimal performance.

### Cache Tier Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cache Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request → L1 (ETS) → L2 (Cachex) → L3 (Redis) → Database       │
│            ~1μs        ~100μs        ~1ms         ~10-100ms      │
│                                                                  │
│  L1: Process-local, 10K entries, 30s-5min TTL                   │
│  L2: Cluster-shared, 100K entries, configurable TTL             │
│  L3: Cross-region, unlimited, persistence across deploys        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Using the Cache Module

```elixir
alias CGraph.Cache

# GOOD - Use appropriate TTL namespaces
# These are predefined in CGraph for consistency:
#   users:       5 min    (profile data, slow-changing)
#   sessions:    15 min   (auth tokens, medium-changing)
#   messages:    1 min    (hot data, fast-changing)
#   groups:      5 min    (server info, slow-changing)
#   presence:    30 sec   (real-time status)
#   rate_limits: 60 sec   (rate limit counters)
#   feeds:       2 min    (forum feeds, computed)
#   search:      5 min    (search results)

# Basic get/set
def get_user(user_id) do
  Cache.fetch("users:#{user_id}", fn ->
    Repo.get(User, user_id)
  end, ttl: :timer.minutes(5))
end

# With stale-while-revalidate for hot paths
def get_forum_feed(forum_id, page) do
  Cache.fetch(
    "feeds:forum:#{forum_id}:page:#{page}",
    fn -> compute_forum_feed(forum_id, page) end,
    ttl: :timer.minutes(2),
    stale_ttl: :timer.minutes(5),  # Serve stale while refreshing
    refresh_probability: 0.1       # 10% early refresh to prevent stampede
  )
end
```

### Cache Invalidation Patterns

```elixir
# BAD - Forgetting to invalidate on updates
def update_user(user, attrs) do
  user
  |> User.changeset(attrs)
  |> Repo.update()
end

# GOOD - Always invalidate related caches
def update_user(user, attrs) do
  case Repo.update(User.changeset(user, attrs)) do
    {:ok, updated_user} ->
      # Invalidate all related caches
      Cache.delete("users:#{user.id}")
      Cache.delete("users:email:#{user.email}")

      # Invalidate computed caches that depend on user
      Cache.delete_pattern("feeds:*:user:#{user.id}:*")

      {:ok, updated_user}

    error ->
      error
  end
end

# For forum posts - invalidate multiple levels
def create_forum_post(forum_id, thread_id, user_id, attrs) do
  case Repo.insert(Post.changeset(%Post{}, attrs)) do
    {:ok, post} ->
      # Invalidate thread cache
      Cache.delete("threads:#{thread_id}")

      # Invalidate forum feed (paginated)
      Cache.delete_pattern("feeds:forum:#{forum_id}:*")

      # Invalidate user's post history
      Cache.delete_pattern("feeds:user:#{user_id}:posts:*")

      # Update counters (don't invalidate, increment)
      Cache.increment("stats:forum:#{forum_id}:post_count")
      Cache.increment("stats:thread:#{thread_id}:reply_count")

      {:ok, post}

    error ->
      error
  end
end
```

### Preventing Cache Stampede

```elixir
# BAD - All requests hit DB when cache expires
def get_popular_threads(forum_id) do
  case Cache.get("popular:#{forum_id}") do
    {:ok, threads} -> threads
    :miss ->
      threads = compute_popular_threads(forum_id)  # Expensive!
      Cache.set("popular:#{forum_id}", threads, ttl: :timer.minutes(5))
      threads
  end
end

# GOOD - Use built-in stampede prevention
def get_popular_threads(forum_id) do
  Cache.fetch_with_lock(
    "popular:#{forum_id}",
    fn -> compute_popular_threads(forum_id) end,
    ttl: :timer.minutes(5),
    lock_ttl: :timer.seconds(10),      # Lock expires if holder crashes
    stale_while_revalidate: true,      # Return stale data during refresh
    early_refresh_probability: 0.1     # 10% refresh before expiry
  )
end

# For critical paths, use background refresh
def warm_popular_threads_cache do
  # Run via Oban every 4 minutes (before 5 min TTL expires)
  forums = Forums.list_active_forums()

  Enum.each(forums, fn forum ->
    threads = compute_popular_threads(forum.id)
    Cache.set("popular:#{forum.id}", threads, ttl: :timer.minutes(5))
  end)
end
```

### Cache Key Conventions

```elixir
# Follow this naming convention for cache keys:
#
# Pattern: {namespace}:{entity}:{id}:{variant}
#
# Examples:
#   users:123                     - User by ID
#   users:email:john@example.com  - User by email
#   threads:456:with_posts        - Thread with preloaded posts
#   feeds:forum:789:hot:page:1    - Forum hot feed, page 1
#   stats:forum:789:post_count    - Forum post count
#   presence:user:123             - User presence state

defmodule CGraph.CacheKeys do
  def user(id), do: "users:#{id}"
  def user_by_email(email), do: "users:email:#{email}"

  def thread(id), do: "threads:#{id}"
  def thread_with_posts(id), do: "threads:#{id}:with_posts"

  def forum_feed(forum_id, sort, page) do
    "feeds:forum:#{forum_id}:#{sort}:page:#{page}"
  end

  def forum_stats(forum_id), do: "stats:forum:#{forum_id}"

  # Pattern for bulk invalidation
  def forum_feed_pattern(forum_id), do: "feeds:forum:#{forum_id}:*"
end
```

---

## Rate Limiting Patterns

CGraph uses distributed rate limiting with Redis + ETS fallback.

### Rate Limiter Usage

```elixir
alias CGraph.RateLimiter

# Available algorithms:
# - :token_bucket  - Best for burst allowance
# - :sliding_window - Best for precise limits
# - :fixed_window  - Simplest, best for cost control

# API endpoint rate limiting
def create_post(conn, params) do
  user_id = conn.assigns.current_user.id

  case RateLimiter.check("posts:#{user_id}", limit: 10, window: :timer.minutes(1)) do
    :ok ->
      # Proceed with post creation
      do_create_post(conn, params)

    {:error, :rate_limited, retry_after} ->
      conn
      |> put_resp_header("retry-after", to_string(retry_after))
      |> put_status(429)
      |> json(%{error: "rate_limited", retry_after: retry_after})
  end
end

# Different limits for different actions
defmodule CGraph.RateLimits do
  @limits %{
    # Authentication
    login: {5, :timer.minutes(5), :fixed_window},
    login_ip: {20, :timer.minutes(5), :fixed_window},
    password_reset: {3, :timer.hours(1), :fixed_window},

    # Messaging
    message: {60, :timer.minutes(1), :sliding_window},
    message_burst: {10, :timer.seconds(10), :token_bucket},

    # Forums
    thread_create: {5, :timer.hours(1), :sliding_window},
    post_create: {30, :timer.minutes(10), :sliding_window},
    vote: {100, :timer.minutes(1), :token_bucket},

    # Search
    search: {30, :timer.minutes(1), :sliding_window},

    # Uploads
    upload: {10, :timer.hours(1), :token_bucket},
    upload_size: {100_000_000, :timer.hours(1), :token_bucket},  # 100MB/hour
  }

  def check(action, identifier) do
    {limit, window, algorithm} = Map.fetch!(@limits, action)
    RateLimiter.check("#{action}:#{identifier}", limit: limit, window: window, algorithm: algorithm)
  end
end
```

### Rate Limiting in Plugs

```elixir
defmodule CGraphWeb.Plugs.RateLimiter do
  import Plug.Conn
  alias CGraph.RateLimits

  def init(opts), do: opts

  def call(conn, action: action) do
    identifier = get_identifier(conn, action)

    case RateLimits.check(action, identifier) do
      :ok ->
        conn

      {:error, :rate_limited, retry_after} ->
        conn
        |> put_resp_header("x-ratelimit-limit", to_string(get_limit(action)))
        |> put_resp_header("x-ratelimit-remaining", "0")
        |> put_resp_header("x-ratelimit-reset", to_string(retry_after))
        |> put_resp_header("retry-after", to_string(div(retry_after, 1000)))
        |> put_status(429)
        |> json(%{error: %{code: "RATE_LIMITED", retry_after: retry_after}})
        |> halt()
    end
  end

  defp get_identifier(conn, action) when action in [:login_ip, :password_reset] do
    # IP-based for auth endpoints
    conn.remote_ip |> :inet.ntoa() |> to_string()
  end

  defp get_identifier(conn, _action) do
    # User-based for authenticated endpoints
    conn.assigns[:current_user]&.id || get_identifier(conn, :login_ip)
  end
end

# Usage in router
pipeline :api do
  plug :accepts, ["json"]
  plug CGraphWeb.Plugs.RateLimiter, action: :api
end

scope "/api/v1", CGraphWeb do
  pipe_through :api

  post "/auth/login", AuthController, :login
  # Add specific rate limit for login
  plug CGraphWeb.Plugs.RateLimiter, action: :login
end
```

---

## Scaling Architecture

Patterns for scaling CGraph to 100M+ users.

### Connection Pool Sizing

```elixir
# Database connection formula:
# pool_size = (cpu_cores × 4) + load_factor
# load_factor = (requests_per_second × avg_query_ms) / 1000

# Current: 50 connections per instance
# For scale:

defmodule CGraph.Repo.PoolConfig do
  def pool_size do
    base = System.schedulers_online() * 4
    load_factor = estimate_load_factor()
    min(base + load_factor, max_pool_size())
  end

  defp max_pool_size do
    # Supabase Pro: 500 total connections
    # With 10 instances: 50 each
    # With PgBouncer: can handle 10K+ app connections
    String.to_integer(System.get_env("MAX_POOL_SIZE", "50"))
  end
end

# For 100M users, add PgBouncer layer:
# App (10K connections) → PgBouncer (pooling) → PostgreSQL (500 connections)
```

### Read Replica Pattern

```elixir
# Configure read replica for query distribution
defmodule CGraph.ReadRepo do
  use Ecto.Repo,
    otp_app: :cgraph,
    adapter: Ecto.Adapters.Postgres,
    read_only: true
end

# Route reads to replica, writes to primary
defmodule CGraph.Forums do
  alias CGraph.{Repo, ReadRepo}

  # Reads go to replica (eventual consistency OK)
  def list_threads(forum_id, opts \\ []) do
    Thread
    |> where(forum_id: ^forum_id)
    |> order_by(desc: :inserted_at)
    |> ReadRepo.all()  # Uses read replica
  end

  # Writes go to primary
  def create_thread(attrs) do
    %Thread{}
    |> Thread.changeset(attrs)
    |> Repo.insert()  # Uses primary
  end

  # For read-after-write consistency, use primary
  def get_thread_for_update(id) do
    Thread
    |> Repo.get(id)  # Uses primary for consistency
  end
end
```

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CGraph Scale Architecture (100M Users)                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Users ──► CDN (Cloudflare) ──► Load Balancer (Fly.io)                 │
│                                         │                                │
│                    ┌────────────────────┼────────────────────┐          │
│                    ▼                    ▼                    ▼          │
│              ┌──────────┐        ┌──────────┐        ┌──────────┐       │
│              │ Phoenix  │        │ Phoenix  │        │ Phoenix  │       │
│              │ Node 1   │        │ Node 2   │   ...  │ Node N   │       │
│              └────┬─────┘        └────┬─────┘        └────┬─────┘       │
│                   │                   │                   │             │
│                   └───────────────────┼───────────────────┘             │
│                                       │                                  │
│                    ┌──────────────────┼──────────────────┐              │
│                    ▼                  ▼                  ▼              │
│              ┌──────────┐      ┌──────────┐      ┌──────────┐          │
│              │  Redis   │      │  Redis   │      │ Kafka/   │          │
│              │  Cache   │      │  PubSub  │      │ RabbitMQ │          │
│              │ (L3)     │      │          │      │          │          │
│              └──────────┘      └──────────┘      └──────────┘          │
│                                       │                                  │
│                    ┌──────────────────┼──────────────────┐              │
│                    ▼                  ▼                  ▼              │
│              ┌──────────┐      ┌──────────┐      ┌──────────┐          │
│              │ PgBouncer│      │ PgBouncer│      │ PgBouncer│          │
│              └────┬─────┘      └────┬─────┘      └────┬─────┘          │
│                   │                 │                 │                 │
│                   └─────────────────┼─────────────────┘                 │
│                                     ▼                                    │
│                    ┌────────────────────────────────┐                   │
│                    │         PostgreSQL             │                   │
│                    │   Primary + Read Replicas      │                   │
│                    │   (Sharded by region/forum)    │                   │
│                    └────────────────────────────────┘                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### User Count Scaling Table

| Users | Instances | DB Connections       | Redis        | Special Considerations |
| ----- | --------- | -------------------- | ------------ | ---------------------- |
| 10K   | 2         | 100                  | Optional     | Current setup          |
| 100K  | 5         | 250                  | Required     | Add PgBouncer          |
| 1M    | 20        | 500 + PgBouncer      | Cluster      | Add read replicas      |
| 10M   | 50        | Sharded              | Cluster      | Regional deployments   |
| 100M  | 200+      | Multi-region sharded | Multi-region | Full geo-distribution  |

---

## Forum System Optimization

Forums are the most resource-intensive feature. Follow these patterns.

### Vote Denormalization

```elixir
# BAD - Computing vote counts on read
def get_thread(id) do
  thread = Repo.get(Thread, id)
  votes = Repo.aggregate(from(v in Vote, where: v.thread_id == ^id), :sum, :value)
  %{thread | vote_count: votes}
end

# GOOD - Denormalized vote counts, updated async
defmodule CGraph.Forums.Thread do
  schema "threads" do
    field :title, :string
    field :content, :string
    # Denormalized fields - updated by background job
    field :upvote_count, :integer, default: 0
    field :downvote_count, :integer, default: 0
    field :vote_score, :integer, default: 0
    field :hot_score, :float, default: 0.0
    field :reply_count, :integer, default: 0
  end
end

# Vote handler updates denormalized counts
def cast_vote(thread_id, user_id, value) do
  Multi.new()
  |> Multi.insert(:vote, Vote.changeset(%Vote{}, %{
    thread_id: thread_id,
    user_id: user_id,
    value: value
  }))
  |> Multi.update_all(:update_counts, fn _ ->
    from(t in Thread,
      where: t.id == ^thread_id,
      update: [
        inc: [
          upvote_count: ^(if value > 0, do: 1, else: 0),
          downvote_count: ^(if value < 0, do: 1, else: 0),
          vote_score: ^value
        ]
      ]
    )
  end)
  |> Repo.transaction()
end

# Background job recalculates hot scores every 5 minutes
defmodule CGraph.Workers.HotScoreCalculator do
  use Oban.Worker, queue: :default, max_attempts: 3

  # Hot score formula: score / (age_hours + 2)^1.8
  @impl Oban.Worker
  def perform(_job) do
    Repo.update_all(
      Thread,
      set: [
        hot_score: fragment(
          "vote_score / POWER(EXTRACT(EPOCH FROM (NOW() - inserted_at))/3600 + 2, 1.8)"
        )
      ]
    )

    :ok
  end
end
```

### Efficient Feed Queries

```elixir
# BAD - Loading full threads for feed
def list_forum_feed(forum_id) do
  Thread
  |> where(forum_id: ^forum_id)
  |> preload([:author, :category, :tags, comments: :author])
  |> order_by(desc: :hot_score)
  |> Repo.all()
end

# GOOD - Cursor pagination with minimal data
def list_forum_feed(forum_id, opts \\ []) do
  cursor = opts[:cursor]
  limit = min(opts[:limit] || 20, 50)
  sort = opts[:sort] || :hot

  Thread
  |> where(forum_id: ^forum_id)
  |> where(^cursor_condition(cursor, sort))
  |> select([t], %{
    id: t.id,
    title: t.title,
    preview: fragment("LEFT(?, 200)", t.content),
    author_id: t.author_id,
    vote_score: t.vote_score,
    reply_count: t.reply_count,
    hot_score: t.hot_score,
    inserted_at: t.inserted_at
  })
  |> order_by(^sort_clause(sort))
  |> limit(^(limit + 1))  # Fetch one extra to know if there's more
  |> Repo.all()
  |> build_paginated_response(limit)
end

defp cursor_condition(nil, _sort), do: true
defp cursor_condition(cursor, :hot) do
  dynamic([t], t.hot_score < ^cursor.hot_score or
    (t.hot_score == ^cursor.hot_score and t.id < ^cursor.id))
end
defp cursor_condition(cursor, :new) do
  dynamic([t], t.inserted_at < ^cursor.inserted_at or
    (t.inserted_at == ^cursor.inserted_at and t.id < ^cursor.id))
end

defp sort_clause(:hot), do: [desc: :hot_score, desc: :id]
defp sort_clause(:new), do: [desc: :inserted_at, desc: :id]
defp sort_clause(:top), do: [desc: :vote_score, desc: :id]
```

### Thread View Counter

```elixir
# BAD - Incrementing on every view
def view_thread(thread_id) do
  Repo.update_all(
    from(t in Thread, where: t.id == ^thread_id),
    inc: [view_count: 1]
  )
end

# GOOD - Batch view counts with Redis, flush periodically
defmodule CGraph.Forums.ViewCounter do
  @flush_interval :timer.seconds(30)
  @batch_size 100

  def increment(thread_id) do
    # Increment in Redis (atomic, fast)
    Redix.command(:view_counter, ["HINCRBY", "thread_views", thread_id, 1])
  end

  # Oban job flushes to database every 30 seconds
  def flush_to_database do
    case Redix.command(:view_counter, ["HGETALL", "thread_views"]) do
      {:ok, []} ->
        :ok

      {:ok, pairs} ->
        pairs
        |> Enum.chunk_every(2)
        |> Enum.map(fn [thread_id, count] -> {thread_id, String.to_integer(count)} end)
        |> Enum.chunk_every(@batch_size)
        |> Enum.each(&batch_update/1)

        # Clear Redis after successful flush
        Redix.command(:view_counter, ["DEL", "thread_views"])
    end
  end

  defp batch_update(updates) do
    # Single query to update multiple threads
    Enum.each(updates, fn {thread_id, count} ->
      Repo.update_all(
        from(t in Thread, where: t.id == ^thread_id),
        inc: [view_count: ^count]
      )
    end)
  end
end
```

### Threaded Comments (Efficient Loading)

```elixir
# BAD - Recursive queries for nested comments
def get_comments(thread_id) do
  comments = Repo.all(from c in Comment, where: c.thread_id == ^thread_id)
  build_tree(comments)  # O(n²) in worst case
end

# GOOD - Materialized path for efficient tree queries
defmodule CGraph.Forums.Comment do
  schema "comments" do
    field :content, :string
    field :thread_id, :binary_id
    field :parent_id, :binary_id
    field :path, :string  # "001/002/003" - materialized path
    field :depth, :integer
  end
end

def get_comments(thread_id, opts \\ []) do
  max_depth = opts[:max_depth] || 5
  limit = opts[:limit] || 100

  Comment
  |> where(thread_id: ^thread_id)
  |> where([c], c.depth <= ^max_depth)
  |> order_by([c], asc: c.path)  # Natural tree order
  |> limit(^limit)
  |> preload(:author)
  |> Repo.all()
  # Already in tree order, just group by depth for rendering
end

# Creating nested comment
def create_reply(parent_id, attrs) do
  parent = Repo.get!(Comment, parent_id)

  new_path = "#{parent.path}/#{generate_sortable_id()}"
  new_depth = parent.depth + 1

  %Comment{}
  |> Comment.changeset(Map.merge(attrs, %{
    parent_id: parent_id,
    thread_id: parent.thread_id,
    path: new_path,
    depth: new_depth
  }))
  |> Repo.insert()
end
```

### Forum Search Optimization

```elixir
# Use PostgreSQL full-text search with proper indexes
defmodule CGraph.Forums.Search do
  @search_limit 50

  def search_threads(query, opts \\ []) do
    forum_id = opts[:forum_id]
    limit = min(opts[:limit] || 20, @search_limit)

    # Use plainto_tsquery for user input (safer than to_tsquery)
    Thread
    |> where([t], fragment(
      "to_tsvector('english', ? || ' ' || ?) @@ plainto_tsquery('english', ?)",
      t.title, t.content, ^query
    ))
    |> maybe_filter_forum(forum_id)
    |> order_by([t], [
      desc: fragment(
        "ts_rank(to_tsvector('english', ? || ' ' || ?), plainto_tsquery('english', ?))",
        t.title, t.content, ^query
      ),
      desc: t.hot_score
    ])
    |> limit(^limit)
    |> select([t], %{
      id: t.id,
      title: t.title,
      preview: fragment("ts_headline('english', ?, plainto_tsquery('english', ?), 'MaxWords=30')",
        t.content, ^query),
      forum_id: t.forum_id,
      vote_score: t.vote_score
    })
    |> Repo.all()
  end
end

# Required index (add in migration):
# CREATE INDEX threads_search_idx ON threads
#   USING GIN (to_tsvector('english', title || ' ' || content));
```

---

## Performance Budgets

Define and enforce performance budgets for all features.

### Response Time Budgets

```elixir
# Define performance SLOs
defmodule CGraph.Performance.Budgets do
  @budgets %{
    # API endpoints (p95 latency)
    api_auth: 100,           # ms - Login/register
    api_messages: 50,        # ms - Send/receive message
    api_threads_list: 100,   # ms - Forum feed
    api_thread_view: 150,    # ms - Single thread with comments
    api_search: 200,         # ms - Full-text search

    # Real-time events
    ws_message_delivery: 100,  # ms - Message to recipient
    ws_typing_indicator: 50,   # ms - Typing broadcast
    ws_presence_update: 200,   # ms - Online status change

    # Background jobs
    job_hot_score: 60_000,   # ms - Hot score recalculation
    job_digest: 300_000,     # ms - Email digest generation
  }

  def budget(key), do: Map.fetch!(@budgets, key)
end

# Enforce in tests
defmodule CGraph.PerformanceTest do
  use CGraph.DataCase
  import CGraph.Performance.Budgets

  @tag :performance
  test "forum feed loads within budget" do
    forum = insert(:forum)
    insert_list(100, :thread, forum: forum)

    {time_us, _result} = :timer.tc(fn ->
      Forums.list_forum_feed(forum.id, limit: 20)
    end)

    time_ms = div(time_us, 1000)
    assert time_ms < budget(:api_threads_list),
      "Forum feed took #{time_ms}ms, budget is #{budget(:api_threads_list)}ms"
  end
end
```

### Frontend Performance Budgets

```typescript
// Performance monitoring
const PERFORMANCE_BUDGETS = {
  // Initial load
  firstContentfulPaint: 1500, // ms
  largestContentfulPaint: 2500, // ms
  timeToInteractive: 3500, // ms

  // Runtime
  messageListRender: 16, // ms (60fps)
  forumFeedRender: 50, // ms
  searchResults: 100, // ms

  // Bundle sizes
  mainBundle: 200_000, // bytes (gzipped)
  vendorBundle: 150_000, // bytes (gzipped)
  routeChunk: 50_000, // bytes (gzipped)
} as const;

// Enforce in CI
export function checkBundleSize(stats: WebpackStats) {
  const mainSize = stats.assets.find((a) => a.name.includes('main'))?.size ?? 0;

  if (mainSize > PERFORMANCE_BUDGETS.mainBundle) {
    throw new Error(
      `Main bundle (${mainSize} bytes) exceeds budget (${PERFORMANCE_BUDGETS.mainBundle} bytes)`
    );
  }
}

// Runtime monitoring
export function measureRender(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;

  if (duration > PERFORMANCE_BUDGETS[name as keyof typeof PERFORMANCE_BUDGETS]) {
    console.warn(`[PERF] ${name} took ${duration.toFixed(2)}ms`);
    // Send to monitoring service
    analytics.track('performance_budget_exceeded', { name, duration });
  }
}
```

### Database Query Budgets

```elixir
# Log slow queries
config :cgraph, CGraph.Repo,
  log: :debug,
  log_slow_query: 100,        # Log queries > 100ms
  log_slow_query_level: :warn

# Query complexity limits
defmodule CGraph.QueryLimits do
  @max_joins 4
  @max_preloads 3
  @max_results 1000

  def validate_query(query) do
    # Enforce limits at compile time where possible
    joins = count_joins(query)
    preloads = count_preloads(query)

    cond do
      joins > @max_joins ->
        raise "Query exceeds max joins (#{joins} > #{@max_joins})"

      preloads > @max_preloads ->
        raise "Query exceeds max preloads (#{preloads} > #{@max_preloads})"

      true ->
        :ok
    end
  end
end
```

---

## Error Handling Patterns

### TypeScript Error Types

```typescript
// Define error types
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public field: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
```

### Result Pattern

```typescript
// Use Result type for operations that can fail
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

async function fetchUser(id: string): Promise<Result<User, ApiError>> {
  try {
    const response = await api.get(`/users/${id}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: parseApiError(error),
    };
  }
}

// Usage
const result = await fetchUser(userId);
if (result.success) {
  setUser(result.data);
} else {
  showError(result.error.message);
}
```

### Error Boundaries

```typescript
// Create reusable error boundary
class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logErrorToService(error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorUI error={this.state.error} />;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={<ChatErrorUI />}>
  <ChatContainer />
</ErrorBoundary>
```

---

## Elixir/Phoenix Best Practices

### Pattern Matching

```elixir
# BAD - Nested conditionals
def process_user(user) do
  if user do
    if user.active do
      if user.verified do
        {:ok, do_something(user)}
      else
        {:error, :not_verified}
      end
    else
      {:error, :inactive}
    end
  else
    {:error, :not_found}
  end
end

# GOOD - Pattern matching in function heads
def process_user(nil), do: {:error, :not_found}
def process_user(%{active: false}), do: {:error, :inactive}
def process_user(%{verified: false}), do: {:error, :not_verified}
def process_user(%{active: true, verified: true} = user) do
  {:ok, do_something(user)}
end
```

### With Statement

```elixir
# BAD - Nested case statements
def create_order(user_id, items) do
  case Accounts.get_user(user_id) do
    {:ok, user} ->
      case validate_items(items) do
        {:ok, validated} ->
          case calculate_total(validated) do
            {:ok, total} ->
              Orders.create(user, validated, total)
            {:error, reason} -> {:error, reason}
          end
        {:error, reason} -> {:error, reason}
      end
    {:error, reason} -> {:error, reason}
  end
end

# GOOD - With statement
def create_order(user_id, items) do
  with {:ok, user} <- Accounts.get_user(user_id),
       {:ok, validated} <- validate_items(items),
       {:ok, total} <- calculate_total(validated) do
    Orders.create(user, validated, total)
  end
end
```

### Pipelines

```elixir
# BAD - Nested function calls
result = do_final(do_third(do_second(do_first(input))))

# GOOD - Pipeline operator
result =
  input
  |> do_first()
  |> do_second()
  |> do_third()
  |> do_final()

# With transformations
user_names =
  users
  |> Enum.filter(&(&1.active))
  |> Enum.map(&(&1.name))
  |> Enum.sort()
  |> Enum.take(10)
```

### Context Modules

```elixir
# Keep contexts focused on one domain
defmodule CGraph.Accounts do
  @moduledoc """
  The Accounts context - user management and authentication.
  """

  alias CGraph.Repo
  alias CGraph.Accounts.User

  def get_user(id), do: Repo.get(User, id)
  def get_user!(id), do: Repo.get!(User, id)
  def get_user_by_email(email), do: Repo.get_by(User, email: email)

  def create_user(attrs) do
    %User{}
    |> User.changeset(attrs)
    |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end
end
```

### Changesets for Validation

```elixir
# All data validation through changesets
defmodule CGraph.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :email, :string
    field :name, :string
    field :password_hash, :string
    timestamps()
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :name])
    |> validate_required([:email, :name])
    |> validate_format(:email, ~r/@/)
    |> validate_length(:name, min: 2, max: 100)
    |> unique_constraint(:email)
  end

  def registration_changeset(user, attrs) do
    user
    |> changeset(attrs)
    |> cast(attrs, [:password])
    |> validate_required([:password])
    |> validate_length(:password, min: 8)
    |> hash_password()
  end
end
```

---

## API Design Patterns

### RESTful Conventions

```
GET    /api/v1/users           # List users
GET    /api/v1/users/:id       # Get single user
POST   /api/v1/users           # Create user
PUT    /api/v1/users/:id       # Update user (full)
PATCH  /api/v1/users/:id       # Update user (partial)
DELETE /api/v1/users/:id       # Delete user

# Nested resources
GET    /api/v1/users/:user_id/posts     # User's posts
POST   /api/v1/users/:user_id/posts     # Create post for user

# Actions that don't fit CRUD
POST   /api/v1/users/:id/activate       # Custom action
POST   /api/v1/auth/login               # Auth actions
POST   /api/v1/auth/logout
```

### Response Format

```typescript
// Success response
{
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Email is invalid" },
      { "field": "password", "message": "Password too short" }
    ]
  }
}
```

### Error Handling

```elixir
# Consistent error responses in controllers
defmodule CGraphWeb.FallbackController do
  use CGraphWeb, :controller

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> json(%{error: %{code: "NOT_FOUND", message: "Resource not found"}})
  end

  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(:unauthorized)
    |> json(%{error: %{code: "UNAUTHORIZED", message: "Authentication required"}})
  end

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: %{
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details: format_changeset_errors(changeset)
    }})
  end
end
```

---

## Database & Query Patterns

### N+1 Query Prevention

```elixir
# BAD - N+1 queries
def list_posts do
  posts = Repo.all(Post)
  Enum.map(posts, fn post ->
    %{post | author: Repo.get(User, post.author_id)}  # N additional queries!
  end)
end

# GOOD - Preload associations
def list_posts do
  Post
  |> preload(:author)
  |> Repo.all()
end

# For conditional preloads
def list_posts(opts \\ []) do
  Post
  |> maybe_preload_author(opts[:include_author])
  |> Repo.all()
end

defp maybe_preload_author(query, true), do: preload(query, :author)
defp maybe_preload_author(query, _), do: query
```

### Query Composition

```elixir
# Build queries with composable functions
defmodule CGraph.Posts.Query do
  import Ecto.Query

  def base, do: from(p in Post)

  def published(query) do
    where(query, [p], p.published == true)
  end

  def by_author(query, author_id) do
    where(query, [p], p.author_id == ^author_id)
  end

  def recent(query, days \\ 7) do
    cutoff = DateTime.add(DateTime.utc_now(), -days, :day)
    where(query, [p], p.inserted_at > ^cutoff)
  end

  def ordered(query, field \\ :inserted_at, dir \\ :desc) do
    order_by(query, [p], [{^dir, field(p, ^field)}])
  end
end

# Usage - compose queries
Posts.Query.base()
|> Posts.Query.published()
|> Posts.Query.by_author(user_id)
|> Posts.Query.recent(30)
|> Posts.Query.ordered()
|> Repo.all()
```

### Pagination

```elixir
# Consistent pagination pattern
defmodule CGraph.Pagination do
  import Ecto.Query

  @default_page_size 20
  @max_page_size 100

  def paginate(query, opts \\ []) do
    page = max(opts[:page] || 1, 1)
    per_page = min(opts[:per_page] || @default_page_size, @max_page_size)
    offset = (page - 1) * per_page

    entries =
      query
      |> limit(^per_page)
      |> offset(^offset)
      |> Repo.all()

    total = Repo.aggregate(query, :count)

    %{
      entries: entries,
      page: page,
      per_page: per_page,
      total: total,
      total_pages: ceil(total / per_page)
    }
  end
end
```

---

## Security Best Practices

### Input Validation

```typescript
// Validate at system boundaries
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(72),
});

async function createUser(input: unknown) {
  const result = CreateUserSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError(result.error.flatten());
  }

  return await userService.create(result.data);
}
```

### SQL Injection Prevention

```elixir
# NEVER interpolate user input into queries
# BAD
query = "SELECT * FROM users WHERE email = '#{email}'"

# GOOD - Use parameterized queries
Repo.all(from u in User, where: u.email == ^email)

# Or with raw SQL
Repo.query("SELECT * FROM users WHERE email = $1", [email])
```

### XSS Prevention

```typescript
// Always escape user content
import DOMPurify from 'dompurify';

// For rendering HTML content
function SafeHTML({ content }: { content: string }) {
  const clean = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// For text content - React escapes by default
function UserName({ name }: { name: string }) {
  return <span>{name}</span>; // Safe - React escapes
}
```

### Authentication Tokens

```typescript
// Store tokens securely
// BAD - localStorage is XSS vulnerable
localStorage.setItem('token', token);

// GOOD - HTTP-only cookies (set by backend)
// Backend sets: Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict

// For SPA needing token in memory
const useAuth = create<AuthState>((set) => ({
  token: null, // In memory only, not persisted
  setToken: (token) => set({ token }),
  clearToken: () => set({ token: null }),
}));
```

---

## Testing Guidelines

### Test Structure

```typescript
describe('UserService', () => {
  // Group by feature
  describe('createUser', () => {
    // Happy path first
    it('creates a user with valid data', async () => {
      const result = await createUser(validUserData);
      expect(result.success).toBe(true);
      expect(result.data.email).toBe(validUserData.email);
    });

    // Edge cases
    it('returns error for duplicate email', async () => {
      await createUser(validUserData);
      const result = await createUser(validUserData);
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('DUPLICATE_EMAIL');
    });

    // Validation
    it('validates email format', async () => {
      const result = await createUser({ ...validUserData, email: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
```

### Testing Principles

```typescript
// 1. Test behavior, not implementation
// BAD
it('calls setState with correct value', () => {
  // Testing implementation detail
});

// GOOD
it('displays updated count after increment', () => {
  render(<Counter />);
  fireEvent.click(screen.getByText('Increment'));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});

// 2. Avoid testing implementation details
// BAD - Testing internal state
expect(component.state.count).toBe(1);

// GOOD - Testing visible output
expect(screen.getByText('Count: 1')).toBeInTheDocument();

// 3. Use realistic test data
const validUser = {
  id: 'usr_123',
  email: 'john@example.com',
  name: 'John Doe',
};

// 4. One assertion per concept (not one assertion total)
it('creates user and returns with ID', async () => {
  const result = await createUser(validData);

  expect(result.success).toBe(true);
  expect(result.data.id).toBeDefined();
  expect(result.data.email).toBe(validData.email);
});
```

### Elixir Testing

```elixir
defmodule CGraph.AccountsTest do
  use CGraph.DataCase, async: true

  alias CGraph.Accounts

  describe "create_user/1" do
    test "creates user with valid attributes" do
      attrs = %{email: "test@example.com", name: "Test User"}

      assert {:ok, user} = Accounts.create_user(attrs)
      assert user.email == "test@example.com"
      assert user.name == "Test User"
    end

    test "returns error for invalid email" do
      attrs = %{email: "invalid", name: "Test"}

      assert {:error, changeset} = Accounts.create_user(attrs)
      assert "has invalid format" in errors_on(changeset).email
    end

    test "enforces unique email" do
      attrs = %{email: "test@example.com", name: "Test"}

      {:ok, _} = Accounts.create_user(attrs)
      assert {:error, changeset} = Accounts.create_user(attrs)
      assert "has already been taken" in errors_on(changeset).email
    end
  end
end
```

---

## Accessibility Standards

### Semantic HTML

```typescript
// BAD - Divs everywhere
<div onClick={handleClick}>Click me</div>
<div className="input">
  <input />
</div>

// GOOD - Semantic elements
<button onClick={handleClick}>Click me</button>
<label>
  <span>Email</span>
  <input type="email" />
</label>
```

### ARIA Labels

```typescript
// Interactive elements need accessible names
<button aria-label="Close dialog">
  <XIcon />
</button>

// Forms need proper labeling
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-error" />
{error && <span id="email-error" role="alert">{error}</span>}

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>
```

### Keyboard Navigation

```typescript
// Ensure keyboard accessibility
function Modal({ isOpen, onClose, children }: ModalProps) {
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      firstFocusableRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div role="dialog" aria-modal="true" onKeyDown={handleKeyDown}>
      <button ref={firstFocusableRef} onClick={onClose}>
        Close
      </button>
      {children}
    </div>
  );
}
```

### Color Contrast

```typescript
// Ensure 4.5:1 contrast ratio for normal text
// Ensure 3:1 for large text (18pt+ or 14pt+ bold)

const ACCESSIBLE_COLORS = {
  // Background: #1a1a1a (dark)
  textPrimary: '#ffffff', // 16.5:1 ratio
  textSecondary: '#a3a3a3', // 7.2:1 ratio
  textMuted: '#737373', // 4.6:1 ratio (minimum)

  // Never use colors alone to convey information
  error: '#ef4444', // Also use icon + text
  success: '#22c55e', // Also use icon + text
};
```

---

## Code Review Checklist

### Before Submitting PR

- [ ] **No nested ternaries** (max one `?` per expression)
- [ ] **No duplicate code** across functions
- [ ] **Pure functions at module level** not inside components
- [ ] **Switch statements replaced** with `Record` lookups
- [ ] **No unnecessary type assertions** (`as` keyword)
- [ ] **Helper functions have descriptive names**
- [ ] **Early returns** used to reduce nesting
- [ ] **No magic numbers/strings** - use named constants
- [ ] **No `any` types** - use `unknown` with type guards
- [ ] **All props typed** with interfaces
- [ ] **Error states handled** in all async operations
- [ ] **Loading states** shown during data fetching
- [ ] **Keyboard accessible** - can use without mouse
- [ ] **No console.log** left in code
- [ ] **Tests cover** happy path and main error cases

### Reviewer Checklist

- [ ] Does the code solve the stated problem?
- [ ] Is the solution the simplest that works?
- [ ] Would a new team member understand this in 30 seconds?
- [ ] Are there any security concerns?
- [ ] Are there any performance concerns?
- [ ] Is error handling complete?
- [ ] Are edge cases considered?
- [ ] Is the code accessible?
- [ ] Do tests cover the important cases?

---

## Summary of Changes Made

This section documents all code simplifications made to the CGraph codebase.

### 1. `apps/web/src/lib/apiUtils.ts`

**Problem**: Nested ternary operators **Solution**: Extracted `extractValue` helper with type guards
**Principle**: Functions should be readable in 30 seconds

### 2. `apps/web/src/components/Button.tsx`

**Problem**: Duplicate spinner SVG code **Solution**: Created unified `LoadingSpinner` component
**Principle**: DRY - Don't Repeat Yourself

### 3. `apps/web/src/stores/chatStore.ts`

**Problem**: Duplicate loop logic in multiple functions **Solution**: Added
`findConversationForMessage` and `updateMessageReactions` helpers **Principle**: Extract common
patterns into reusable functions

### 4. `apps/mobile/src/components/Button.tsx`

**Problem**: Verbose switch statements **Solution**: Object lookups with `Record<K, V>` types
**Principle**: Data over control flow

### 5. `apps/web/src/stores/forumStore.ts`

**Problem**: Switch statement with identical cases **Solution**: Direct object property mapping
**Principle**: Eliminate redundant code

### 6. `apps/web/src/components/Dropdown.tsx`

**Problem**: Nested ternary in className **Solution**: `getDropdownItemClass` helper function
**Principle**: Named functions are self-documenting

### 7. `apps/web/src/components/VoiceMessageRecorder.tsx`

**Problem**: Pure function inside component **Solution**: Moved `formatTime` to module level
**Principle**: Pure functions belong at module level

### 8. `apps/web/src/components/Select.tsx`

**Problem**: Nested ternary for border class **Solution**: `getBorderClass` helper function
**Principle**: Extract conditional logic to named functions

### 9. `apps/web/src/components/gamification/LevelProgress.tsx`

**Problem**: Nested ternary for multiplier **Solution**: `getStreakMultiplier` helper function
**Principle**: Make business logic explicit and named

### 10. `apps/web/src/components/Avatar.tsx`

**Problem**: Helper functions inside component **Solution**: Moved to module level constants and
functions **Principle**: Stable references for better performance

---

## Reference Files

These files follow best practices - use them as templates:

### CGraph Infrastructure Patterns (PRIORITY)

- `apps/web/src/lib/tokenService.ts` - Circular dependency solution pattern
- `apps/web/src/lib/logger.ts` - Production logger with error tracking
- `apps/web/src/lib/safeStorage.ts` - SSR-safe localStorage wrapper
- `apps/web/src/lib/api.ts` - API client with token refresh
- `apps/web/src/stores/utils/storeHelpers.ts` - Store utility functions
- `apps/web/src/stores/customization/mappings.ts` - Centralized ID mappings

### Well-Structured Components

- `apps/web/src/components/FileUpload.tsx` - Clear function separation
- `apps/web/src/components/Modal.tsx` - Good Record type usage
- `apps/web/src/components/Toast.tsx` - Clean context pattern
- `apps/web/src/components/Input.tsx` - Proper forwardRef
- `apps/web/src/components/chat/TypingIndicator.tsx` - Extracted chat component
- `apps/web/src/components/chat/ConversationHeader.tsx` - Clean component pattern

### Good State Management

- `apps/web/src/stores/authStore.ts` - Token service registration pattern
- `apps/web/src/stores/chatStore.ts` - Real-time message handling
- `apps/web/src/stores/theme/index.ts` - Consolidated theme store
- `apps/web/src/stores/forumStore.ts` - Complex state with pagination

### Hooks Patterns

- `apps/web/src/hooks/useDebounce.ts` - Debounce + throttle hooks
- `apps/web/src/hooks/usePresence.ts` - Presence tracking hook
- `apps/web/src/hooks/index.ts` - Centralized hook exports

### Real-Time Patterns

- `apps/web/src/lib/socket.ts` - SocketManager class pattern
- `apps/web/src/lib/chat/reactionUtils.ts` - Store-accessing utilities

### Clean Utilities

- `packages/utils/src/format.ts` - Well-organized formatters
- `packages/utils/src/http.ts` - HTTP client factory

### Backend - Core Modules

- `apps/backend/lib/cgraph/accounts.ex` - Clean context module
- `apps/backend/lib/cgraph/forums.ex` - Forum context with voting
- `apps/backend/lib/cgraph/messaging.ex` - Messaging context
- `apps/backend/lib/cgraph/release.ex` - Production migration runner

### Backend - Infrastructure

- `apps/backend/lib/cgraph/cache/unified.ex` - Three-tier cache
- `apps/backend/lib/cgraph/cache/distributed.ex` - Redis cache layer
- `apps/backend/lib/cgraph/rate_limiter/distributed.ex` - Rate limiting
- `apps/backend/lib/cgraph_web/plugs/cors.ex` - Runtime CORS configuration

### Backend - Web Layer

- `apps/backend/lib/cgraph_web/channels/conversation_channel.ex` - Channel pattern
- `apps/backend/lib/cgraph_web/channels/forum_channel.ex` - Forum real-time
- `apps/backend/lib/cgraph_web/controllers/fallback_controller.ex` - Error handling

---

## Quick Reference Card

### Code Quality

```
+----------------------------------+----------------------------------+
|            AVOID                 |            PREFER                |
+----------------------------------+----------------------------------+
| Nested ternaries                 | Named helper functions           |
| a ? b ? c : d : e                | getResult(a, b)                  |
+----------------------------------+----------------------------------+
| Switch for mappings              | Record<K, V> objects             |
| switch(x) { case: ... }          | const MAP = { a: 1, b: 2 }       |
+----------------------------------+----------------------------------+
| Functions inside components      | Module-level pure functions      |
| const fn = () => {}              | function fn() {} // top level    |
+----------------------------------+----------------------------------+
| Magic numbers                    | Named constants                  |
| if (x > 86400000)                | if (x > ONE_DAY_MS)              |
+----------------------------------+----------------------------------+
| Deeply nested if/else            | Early returns                    |
| if (a) { if (b) { if (c) {} } }  | if (!a) return; if (!b) return;  |
+----------------------------------+----------------------------------+
| any type                         | unknown + type guards            |
| data as any                      | if (isUser(data)) { ... }        |
+----------------------------------+----------------------------------+
| Duplicate code blocks            | Extracted helper functions       |
| Copy-pasted logic                | Single source of truth           |
+----------------------------------+----------------------------------+
```

### CGraph-Specific Patterns

```
+----------------------------------+----------------------------------+
|            AVOID                 |            PREFER                |
+----------------------------------+----------------------------------+
| Offset pagination                | Cursor-based pagination          |
| LIMIT 20 OFFSET 100              | WHERE id < cursor LIMIT 20       |
+----------------------------------+----------------------------------+
| Computing counts on read         | Denormalized counters            |
| SELECT COUNT(*) FROM votes       | thread.vote_count (cached col)   |
+----------------------------------+----------------------------------+
| Direct vote increment            | Redis buffer + batch flush       |
| UPDATE SET views = views + 1     | HINCRBY + periodic flush         |
+----------------------------------+----------------------------------+
| Creating channels repeatedly     | Channel cache + debounce         |
| socket.channel(topic).join()     | channelCache.get(topic) ?? join  |
+----------------------------------+----------------------------------+
| Handlers on every render         | Idempotent handler registration  |
| channel.on('event', handler)     | if (!registered) channel.on(...) |
+----------------------------------+----------------------------------+
| Full payload broadcasts          | Minimal payload + fetch if needed|
| broadcast(full_message_object)   | broadcast({id, preview, ts})     |
+----------------------------------+----------------------------------+
| Nested case in Elixir            | with statement                   |
| case x do case y do case z do    | with {:ok, a} <- x, {:ok, b} <-y |
+----------------------------------+----------------------------------+
| N+1 queries                      | Preload associations             |
| Enum.map(&Repo.get/1)            | Repo.preload(query, :assoc)      |
+----------------------------------+----------------------------------+
```

### Cache Key Naming Convention

```
Pattern: {namespace}:{entity}:{id}:{variant}

Examples:
  users:123                     - User by ID
  users:email:john@example.com  - User by email
  threads:456:with_posts        - Thread with preloaded posts
  feeds:forum:789:hot:page:1    - Forum hot feed, page 1
  stats:forum:789:post_count    - Forum post count
  presence:user:123             - User presence state

TTL Guidelines:
  users:       5 min    (slow-changing)
  sessions:    15 min   (auth tokens)
  messages:    1 min    (hot data)
  presence:    30 sec   (real-time)
  feeds:       2 min    (computed)
```

### Performance Budgets

```
API Response Times (p95):
  Auth endpoints:     100ms
  Message send:       50ms
  Forum feed:         100ms
  Thread + comments:  150ms
  Search:             200ms

Real-Time Events:
  Message delivery:   100ms
  Typing indicator:   50ms
  Presence update:    200ms

Frontend:
  FCP:                1.5s
  LCP:                2.5s
  TTI:                3.5s
  Main bundle:        200KB gzipped
```

### SLO Targets (Google SRE)

```
Service Level Objectives:
  API Availability:      99.9%  (43 min downtime/month)
  Message Delivery:      99.95% within 1 second
  Forum Feed Latency:    99.5%  under 200ms
  Search Latency:        99%    under 500ms

Error Budget:
  Monthly error budget:  0.1% of requests
  >50% remaining:        Normal development
  20-50% remaining:      Prioritize reliability
  <20% remaining:        Freeze non-critical releases
  Exhausted:             All hands on reliability
```

### Industry Standards Quick Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     INDUSTRY STANDARDS ADOPTED                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GOOGLE SRE:                                                            │
│  ├─ SLI/SLO/Error Budgets for reliability management                   │
│  ├─ Multi-window, multi-burn-rate alerting                             │
│  ├─ Postmortem for incidents consuming >20% budget                     │
│  └─ Rolling 28-day windows for SLO measurement                         │
│                                                                          │
│  GOOGLE TYPESCRIPT:                                                     │
│  ├─ PascalCase: classes, interfaces, types, enums, components          │
│  ├─ camelCase: variables, functions, methods                           │
│  ├─ CONSTANT_CASE: immutable constants                                 │
│  ├─ unknown over any, with type guards                                 │
│  └─ Explicit return types on all functions                             │
│                                                                          │
│  META ARCHITECTURE:                                                     │
│  ├─ TAO-style object/association caching                               │
│  ├─ Request coalescing to prevent stampedes                            │
│  ├─ Multi-region with leader-follower replication                      │
│  ├─ Write-through cache invalidation                                   │
│  └─ Denormalized counts for O(1) reads                                 │
│                                                                          │
│  TELEGRAM PATTERNS:                                                     │
│  ├─ Event-driven architecture for all actions                          │
│  ├─ Minimal payload encoding (short keys, bit flags)                   │
│  ├─ Non-blocking message sends with async delivery                     │
│  ├─ Lean engineering - no unnecessary abstractions                     │
│  └─ Optimize for common case (99% text messages)                       │
│                                                                          │
│  DISCORD PATTERNS (Elixir-specific):                                    │
│  ├─ Gateway sharding: ~5,000 users per shard                           │
│  ├─ Rust NIFs for CPU-intensive operations (sorting, search)           │
│  ├─ Session resumption: 30-second window for reconnection              │
│  ├─ Lazy presence loading for large servers (>75K members)             │
│  ├─ Snowflake IDs: timestamp encoded in ID for efficient queries       │
│  └─ Data services layer: Rust gRPC service for DB access               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Naming Conventions (Google Style)

```
┌──────────────────┬────────────────────────────────────────────────────┐
│ Type             │ Convention                                          │
├──────────────────┼────────────────────────────────────────────────────┤
│ Classes          │ PascalCase        class UserService {}             │
│ Interfaces       │ PascalCase        interface MessagePayload {}      │
│ Types            │ PascalCase        type ConversationId = string     │
│ Enums            │ PascalCase        enum MessageStatus {}            │
│ Components       │ PascalCase        function UserProfile() {}        │
│ Variables        │ camelCase         const messageCount = 0           │
│ Functions        │ camelCase         function sendMessage() {}        │
│ Constants        │ CONSTANT_CASE     const MAX_LENGTH = 10000         │
│ Files            │ kebab-case        user-service.ts                  │
│ Props            │ [Component]Props  interface UserCardProps {}       │
│ Event handlers   │ on* / handle*     onClick, handleClick             │
└──────────────────┴────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

This section clarifies which industry patterns are currently implemented in CGraph vs. planned for
future development.

### Implementation Status Legend

- ✅ **Implemented**: Production-ready, fully integrated
- 🚧 **Planned**: On roadmap, prioritized for upcoming releases
- 📋 **Aspirational**: Best practice from industry, not yet scheduled

### Current Implementation Status

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        CGRAPH IMPLEMENTATION STATUS                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✅ IMPLEMENTED (Production-Ready)                                         │
│  ├─ Multi-tier Caching (L1-ETS, L2-Cachex, L3-Redis)                       │
│  ├─ Rate Limiting (token bucket, sliding window, distributed Redis)        │
│  ├─ E2EE Signal Protocol (X3DH, Double Ratchet, AES-256-GCM)              │
│  ├─ Circuit Breaker (:fuse library)                                        │
│  ├─ Phoenix Channels (real-time messaging)                                 │
│  ├─ JWT Authentication (Guardian + HTTP-only cookies)                      │
│  ├─ Zustand State Management (frontend)                                    │
│  ├─ OAuth Integration (Google, Apple, Facebook)                            │
│  ├─ Stripe Payments (subscription tiers)                                   │
│  └─ Oban Background Jobs (email, cleanup, notifications)                   │
│                                                                             │
│  🚧 PLANNED (Roadmap Priority)                                             │
│  ├─ SLO/SLI Tracking (metrics collection + alerting)          [P1]        │
│  ├─ Gateway Sharding (~5K users per shard)                     [P1]        │
│  ├─ Multi-region Deployment (EU + US)                          [P2]        │
│  ├─ Session Resumption (30-second reconnect window)            [P2]        │
│  ├─ Request Coalescing (stampede prevention)                   [P2]        │
│  └─ Performance Monitoring (OpenTelemetry)                     [P3]        │
│                                                                             │
│  📋 ASPIRATIONAL (Industry Best Practice)                                  │
│  ├─ Rust NIFs (CPU-intensive path optimization)                            │
│  ├─ Data Services Layer (gRPC microservices)                               │
│  ├─ Snowflake IDs (timestamp-encoded)                                      │
│  └─ Lazy Presence (75K+ member optimization)                               │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### When to Implement Aspirational Patterns

| Pattern          | Trigger Point               | Current State          |
| ---------------- | --------------------------- | ---------------------- |
| Gateway Sharding | >50K concurrent users       | Not needed yet         |
| Rust NIFs        | Profiled CPU hotspot >100ms | No hotspots identified |
| Multi-region     | International user base     | Single region (EU)     |
| Data Services    | Team >10 engineers          | Small team             |

---

## Current State vs Target State

Comparison of Discord-standard patterns vs CGraph's current implementation.

### Scale Readiness Matrix

| Pattern            | Discord Standard | CGraph Current       | Gap   | Priority |
| ------------------ | ---------------- | -------------------- | ----- | -------- |
| **Sharding**       | ~5K users/shard  | Not implemented      | 100%  | P1       |
| **SLO Tracking**   | 99.99% targets   | No tracking          | 100%  | P1       |
| **Session Resume** | 30s reconnect    | No resume            | 100%  | P2       |
| **Multi-region**   | Global + edge    | Single region        | 100%  | P2       |
| **Caching**        | Multi-tier       | L1+L2+L3             | 0% ✅ | -        |
| **Rate Limiting**  | Distributed      | Redis + token bucket | 0% ✅ | -        |
| **E2EE**           | Not applicable   | Signal Protocol      | 0% ✅ | -        |
| **Rust NIFs**      | Hot path         | Not applicable       | N/A   | P3       |

### Backend Readiness Score

```
Current Scale Readiness: 60/100

Breakdown:
  ├─ Caching Layer:           95/100  ████████████████████▌
  ├─ Rate Limiting:           95/100  ████████████████████▌
  ├─ Real-time Messaging:     85/100  ██████████████████░░░
  ├─ E2EE Implementation:     90/100  ███████████████████░░
  ├─ Database Patterns:       70/100  ██████████████░░░░░░░
  ├─ Sharding/Distribution:   10/100  ██░░░░░░░░░░░░░░░░░░░
  ├─ Observability:           20/100  ████░░░░░░░░░░░░░░░░░
  └─ Multi-region:            0/100   ░░░░░░░░░░░░░░░░░░░░░

Target for 100M users: 85/100
```

### Frontend Readiness Score

```
Current Frontend Quality: 77/100

Breakdown:
  ├─ State Management:        90/100  ███████████████████░░
  ├─ TypeScript Strictness:   85/100  ██████████████████░░░
  ├─ Error Handling:          80/100  █████████████████░░░░
  ├─ Performance:             65/100  █████████████░░░░░░░░
  ├─ React 19 Adoption:       40/100  ████████░░░░░░░░░░░░░
  ├─ Memoization:             50/100  ██████████░░░░░░░░░░░
  └─ Debug Code Cleanup:      60/100  ████████████░░░░░░░░░

Target for production: 85/100
```

---

## Frontend Quick Wins

Immediate improvements to bring frontend to production quality.

### 1. Console.log Cleanup

48 `console.log` statements found in production code. Remove or replace with proper logging.

```typescript
// ❌ AVOID: Debug logs in production
console.log('User data:', user);
console.log('API response:', response);

// ✅ PREFER: Conditional or structured logging
if (import.meta.env.DEV) {
  console.log('User data:', user);
}

// ✅ BETTER: Proper logging service
import { logger } from '@/lib/logger';
logger.debug('User data loaded', { userId: user.id });
```

**Files to clean**:

- `apps/web/src/stores/*.ts` - State management debug logs
- `apps/web/src/lib/*.ts` - Utility debug logs
- `apps/web/src/components/**/*.tsx` - Component debug logs

### 2. React 19 Adoption

Adopt new React 19 patterns for improved performance and DX.

```typescript
// ❌ CURRENT: useEffect for data fetching
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;
  return <Profile user={user} />;
}

// ✅ REACT 19: use() hook for data fetching
function UserProfile({ userId }: { userId: string }) {
  const userPromise = fetchUser(userId);
  const user = use(userPromise);  // Suspense-compatible
  return <Profile user={user} />;
}
```

```typescript
// ❌ CURRENT: Manual form state management
function LoginForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await login(formData);
    setLoading(false);
  }

  return <button disabled={loading}>Login</button>;
}

// ✅ REACT 19: useFormStatus hook
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Login</button>;
}
```

### 3. Memoization for Heavy Components

Add memoization to prevent unnecessary re-renders.

```typescript
// ❌ AVOID: Inline objects/functions in props
function MessageList({ messages }: Props) {
  return messages.map(msg => (
    <Message
      key={msg.id}
      message={msg}
      style={{ marginBottom: 8 }}  // New object every render!
      onDelete={() => deleteMessage(msg.id)}  // New function every render!
    />
  ));
}

// ✅ PREFER: Stable references
const messageStyle = { marginBottom: 8 };  // Module-level

function MessageList({ messages }: Props) {
  const handleDelete = useCallback((id: string) => {
    deleteMessage(id);
  }, []);

  return messages.map(msg => (
    <Message
      key={msg.id}
      message={msg}
      style={messageStyle}
      onDelete={handleDelete}
    />
  ));
}
```

### 4. Performance Monitoring

Add basic performance monitoring hooks.

```typescript
// apps/web/src/hooks/usePerformance.ts
export function usePerformance(componentName: string) {
  useEffect(() => {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      if (duration > 16) {
        // Longer than one frame
        console.warn(`[Perf] ${componentName} render took ${duration.toFixed(2)}ms`);
      }
    };
  });
}

// Usage in components
function ExpensiveComponent() {
  usePerformance('ExpensiveComponent');
  // ...
}
```

---

## Oban Background Jobs

Oban is CGraph's background job processor. Follow these patterns for reliable async processing.

### Queue Configuration

```elixir
# config/config.exs
config :cgraph, Oban,
  repo: CGraph.Repo,
  queues: [
    default: 10,           # General tasks
    mailers: 5,            # Email sending
    notifications: 20,     # Push notifications (high volume)
    media: 3,              # File processing (CPU-intensive)
    cleanup: 1,            # Scheduled cleanup (low priority)
    webhooks: 10           # External API calls
  ],
  plugins: [
    {Oban.Plugins.Pruner, max_age: 60 * 60 * 24 * 7},  # 7 days
    {Oban.Plugins.Cron, crontab: [
      {"0 3 * * *", CGraph.Workers.CleanupWorker},      # Daily 3am
      {"*/15 * * * *", CGraph.Workers.DigestWorker}    # Every 15min
    ]}
  ]
```

### Job Implementation Patterns

```elixir
defmodule CGraph.Workers.EmailWorker do
  use Oban.Worker,
    queue: :mailers,
    max_attempts: 3,
    unique: [period: 60, states: [:available, :scheduled, :executing]]

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "template" => template}}) do
    case CGraph.Accounts.get_user(user_id) do
      nil ->
        # User deleted, discard job
        :discard

      user ->
        case CGraph.Mailer.deliver_email(user, String.to_existing_atom(template)) do
          {:ok, _} ->
            :ok

          {:error, :rate_limited} ->
            # Retry with backoff
            {:snooze, 60}

          {:error, reason} ->
            {:error, reason}  # Will retry up to max_attempts
        end
    end
  end
end
```

### Job Enqueueing Best Practices

```elixir
# ❌ AVOID: No uniqueness constraint
Oban.insert(EmailWorker.new(%{user_id: user.id, template: "welcome"}))

# ✅ PREFER: Unique constraint prevents duplicates
Oban.insert(
  EmailWorker.new(%{user_id: user.id, template: "welcome"},
    unique: [period: 300, keys: [:user_id, :template]]
  )
)

# ❌ AVOID: Fire and forget without error handling
Oban.insert!(NotificationWorker.new(%{...}))

# ✅ PREFER: Handle insertion errors
case Oban.insert(NotificationWorker.new(%{...})) do
  {:ok, job} -> {:ok, job.id}
  {:error, changeset} -> {:error, format_errors(changeset)}
end

# ✅ PREFER: Bulk insert for multiple jobs
Oban.insert_all([
  EmailWorker.new(%{user_id: 1, template: "digest"}),
  EmailWorker.new(%{user_id: 2, template: "digest"}),
  EmailWorker.new(%{user_id: 3, template: "digest"})
])
```

### Error Handling and Telemetry

```elixir
# lib/cgraph/oban_reporter.ex
defmodule CGraph.ObanReporter do
  def handle_event([:oban, :job, :exception], measure, meta, _config) do
    Logger.error("Oban job failed",
      worker: meta.worker,
      queue: meta.queue,
      attempt: meta.attempt,
      error: inspect(meta.error),
      duration_ms: System.convert_time_unit(measure.duration, :native, :millisecond)
    )

    # Report to error tracking
    Sentry.capture_exception(meta.error, stacktrace: meta.stacktrace)
  end
end

# Attach in application.ex
:telemetry.attach(
  "oban-errors",
  [:oban, :job, :exception],
  &CGraph.ObanReporter.handle_event/4,
  nil
)
```

---

## Stripe Integration

Patterns for reliable payment processing with Stripe.

### Webhook Handling

```elixir
defmodule CGraphWeb.StripeWebhookController do
  use CGraphWeb, :controller

  @webhook_secret System.get_env("STRIPE_WEBHOOK_SECRET")

  def handle(conn, _params) do
    payload = conn.assigns.raw_body
    signature = get_req_header(conn, "stripe-signature") |> List.first()

    case Stripe.Webhook.construct_event(payload, signature, @webhook_secret) do
      {:ok, event} ->
        handle_event(event)
        send_resp(conn, 200, "OK")

      {:error, %Stripe.SignatureVerificationError{}} ->
        send_resp(conn, 400, "Invalid signature")
    end
  end

  # Idempotent event handling
  defp handle_event(%{id: event_id, type: type} = event) do
    # Check if already processed (idempotency)
    case CGraph.Payments.get_processed_event(event_id) do
      nil ->
        process_event(type, event)
        CGraph.Payments.mark_event_processed(event_id)

      _existing ->
        :already_processed
    end
  end

  defp process_event("customer.subscription.created", event) do
    CGraph.Subscriptions.activate_subscription(event.data.object)
  end

  defp process_event("customer.subscription.updated", event) do
    CGraph.Subscriptions.update_subscription(event.data.object)
  end

  defp process_event("customer.subscription.deleted", event) do
    CGraph.Subscriptions.cancel_subscription(event.data.object)
  end

  defp process_event("invoice.payment_failed", event) do
    CGraph.Subscriptions.handle_payment_failure(event.data.object)
  end

  defp process_event(_type, _event), do: :ignored
end
```

### Subscription Tier Management

```elixir
defmodule CGraph.Subscriptions do
  @tier_limits %{
    "free" => %{max_groups: 5, max_forums: 5, max_members: 100},
    "starter" => %{max_groups: 10, max_forums: 10, max_members: 500},
    "pro" => %{max_groups: 50, max_forums: 50, max_members: 2000},
    "business" => %{max_groups: :unlimited, max_forums: :unlimited, max_members: :unlimited}
  }

  def check_tier_limit(user, :groups) do
    tier = get_user_tier(user)
    limit = @tier_limits[tier].max_groups

    case limit do
      :unlimited -> :ok
      n -> check_count(user, :groups, n)
    end
  end

  def upgrade_subscription(user, new_tier, payment_method_id) do
    with {:ok, _intent} <- create_payment_intent(user, new_tier, payment_method_id),
         {:ok, subscription} <- Stripe.Subscription.update(user.stripe_subscription_id, %{
           items: [%{price: get_price_id(new_tier)}]
         }),
         {:ok, user} <- update_user_tier(user, new_tier) do
      # Clear cached tier
      CGraph.Cache.delete("user:#{user.id}:tier")
      {:ok, user}
    end
  end
end
```

### Frontend Stripe Integration

```typescript
// apps/web/src/lib/stripe.ts
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export async function createCheckoutSession(tier: SubscriptionTier): Promise<string> {
  const response = await api.post('/subscriptions/checkout', { tier });
  const { sessionId } = response.data;

  const stripe = await stripePromise;
  if (!stripe) throw new Error('Stripe failed to load');

  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) throw error;

  return sessionId;
}

// Subscription management component
function SubscriptionManager() {
  const { tier, loading } = useSubscription();

  const handleUpgrade = async (newTier: SubscriptionTier) => {
    try {
      await createCheckoutSession(newTier);
    } catch (error) {
      toast.error('Failed to start checkout');
    }
  };

  return (
    <div className="subscription-tiers">
      {TIERS.map(t => (
        <TierCard
          key={t.id}
          tier={t}
          current={t.id === tier}
          onSelect={() => handleUpgrade(t.id)}
        />
      ))}
    </div>
  );
}
```

---

## E2EE Signal Protocol

End-to-end encryption patterns using Signal Protocol (X3DH + Double Ratchet).

### Key Management (Frontend)

```typescript
// apps/web/src/lib/crypto/keys.ts
import { generateKeyPair, deriveSharedSecret } from './primitives';

export interface IdentityKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface PreKeyBundle {
  identityKey: Uint8Array;
  signedPreKey: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  };
  preKey?: {
    keyId: number;
    publicKey: Uint8Array;
  };
}

// Generate and store identity keys
export async function initializeIdentity(): Promise<IdentityKeyPair> {
  const existing = await getStoredIdentity();
  if (existing) return existing;

  const keyPair = await generateKeyPair();
  await storeIdentity(keyPair);

  // Upload public key to server
  await api.post('/crypto/identity-key', {
    publicKey: base64Encode(keyPair.publicKey),
  });

  return keyPair;
}

// Generate signed prekey (rotates monthly)
export async function generateSignedPreKey(
  identityKeyPair: IdentityKeyPair,
  keyId: number
): Promise<SignedPreKey> {
  const preKeyPair = await generateKeyPair();
  const signature = await sign(identityKeyPair.privateKey, preKeyPair.publicKey);

  return {
    keyId,
    publicKey: preKeyPair.publicKey,
    privateKey: preKeyPair.privateKey,
    signature,
  };
}

// Generate one-time prekeys (100 at a time)
export async function generatePreKeys(startId: number, count: number = 100): Promise<PreKey[]> {
  const preKeys: PreKey[] = [];

  for (let i = 0; i < count; i++) {
    const keyPair = await generateKeyPair();
    preKeys.push({
      keyId: startId + i,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    });
  }

  return preKeys;
}
```

### X3DH Key Agreement

```typescript
// apps/web/src/lib/crypto/x3dh.ts
export async function initiateSession(
  myIdentity: IdentityKeyPair,
  theirBundle: PreKeyBundle
): Promise<SessionState> {
  // Generate ephemeral key pair
  const ephemeralKey = await generateKeyPair();

  // Compute DH values
  const dh1 = await deriveSharedSecret(myIdentity.privateKey, theirBundle.signedPreKey.publicKey);
  const dh2 = await deriveSharedSecret(ephemeralKey.privateKey, theirBundle.identityKey);
  const dh3 = await deriveSharedSecret(ephemeralKey.privateKey, theirBundle.signedPreKey.publicKey);

  let dh4: Uint8Array | undefined;
  if (theirBundle.preKey) {
    dh4 = await deriveSharedSecret(ephemeralKey.privateKey, theirBundle.preKey.publicKey);
  }

  // Derive root key and chain key
  const sharedSecret = concatBytes(dh1, dh2, dh3, dh4 ?? new Uint8Array());
  const { rootKey, chainKey } = await kdf(sharedSecret);

  return {
    rootKey,
    sendingChain: { key: chainKey, index: 0 },
    receivingChain: null,
    ephemeralKey: ephemeralKey.publicKey,
    usedPreKeyId: theirBundle.preKey?.keyId,
  };
}
```

### Message Encryption/Decryption

```typescript
// apps/web/src/lib/crypto/ratchet.ts
export async function encryptMessage(
  session: SessionState,
  plaintext: string
): Promise<{ ciphertext: Uint8Array; header: MessageHeader }> {
  // Derive message key from chain
  const { messageKey, newChainKey } = await deriveMessageKey(session.sendingChain.key);
  session.sendingChain.key = newChainKey;
  session.sendingChain.index++;

  // Encrypt with AES-256-GCM
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await encrypt(messageKey, nonce, new TextEncoder().encode(plaintext));

  return {
    ciphertext,
    header: {
      ephemeralKey: session.ephemeralKey,
      previousChainLength: session.previousChainLength,
      messageIndex: session.sendingChain.index - 1,
      nonce,
    },
  };
}

export async function decryptMessage(
  session: SessionState,
  ciphertext: Uint8Array,
  header: MessageHeader
): Promise<string> {
  // Check if we need to ratchet
  if (!constantTimeEqual(header.ephemeralKey, session.remoteEphemeralKey)) {
    await ratchetReceiving(session, header.ephemeralKey);
  }

  // Derive message key
  const messageKey = await deriveMessageKeyAtIndex(session.receivingChain!, header.messageIndex);

  // Decrypt
  const plaintext = await decrypt(messageKey, header.nonce, ciphertext);
  return new TextDecoder().decode(plaintext);
}
```

### Backend Key Storage

```elixir
# lib/cgraph/crypto/prekey_store.ex
defmodule CGraph.Crypto.PrekeyStore do
  alias CGraph.Repo
  alias CGraph.Crypto.{IdentityKey, SignedPrekey, OneTimePrekey}

  def store_identity_key(user_id, public_key) do
    %IdentityKey{}
    |> IdentityKey.changeset(%{
      user_id: user_id,
      public_key: public_key,
      created_at: DateTime.utc_now()
    })
    |> Repo.insert(on_conflict: :replace_all, conflict_target: :user_id)
  end

  def get_prekey_bundle(user_id) do
    identity = Repo.get_by(IdentityKey, user_id: user_id)
    signed = Repo.get_by(SignedPrekey, user_id: user_id)

    # Pop one-time prekey (delete after use)
    one_time = pop_one_time_prekey(user_id)

    %{
      identity_key: identity.public_key,
      signed_prekey: %{
        key_id: signed.key_id,
        public_key: signed.public_key,
        signature: signed.signature
      },
      one_time_prekey: one_time && %{
        key_id: one_time.key_id,
        public_key: one_time.public_key
      }
    }
  end

  defp pop_one_time_prekey(user_id) do
    Repo.transaction(fn ->
      prekey = from(p in OneTimePrekey,
        where: p.user_id == ^user_id,
        order_by: [asc: :key_id],
        limit: 1
      )
      |> Repo.one()

      if prekey, do: Repo.delete!(prekey)
      prekey
    end)
    |> elem(1)
  end

  # Alert when prekeys running low
  def check_prekey_count(user_id) do
    count = Repo.one(from p in OneTimePrekey,
      where: p.user_id == ^user_id,
      select: count(p.id)
    )

    if count < 20 do
      # Notify client to generate more
      CGraphWeb.Endpoint.broadcast("user:#{user_id}", "prekeys_low", %{remaining: count})
    end

    count
  end
end
```

---

## WebRTC Voice/Video

Patterns for real-time voice and video calls.

### Peer Connection Setup

```typescript
// apps/web/src/lib/webrtc/connection.ts
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: import.meta.env.VITE_TURN_SERVER,
    username: import.meta.env.VITE_TURN_USERNAME,
    credential: import.meta.env.VITE_TURN_CREDENTIAL,
  },
];

export class CallConnection {
  private pc: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private channel: Channel;

  constructor(callId: string, channel: Channel) {
    this.channel = channel;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.channel.push('ice_candidate', { candidate: candidate.toJSON() });
      }
    };

    this.pc.ontrack = ({ streams }) => {
      this.onRemoteStream?.(streams[0]);
    };

    this.pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(this.pc.connectionState);
    };
  }

  async startCall(video: boolean = true): Promise<void> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { width: 1280, height: 720 } : false,
    });

    this.localStream.getTracks().forEach((track) => {
      this.pc.addTrack(track, this.localStream!);
    });

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.channel.push('offer', { sdp: offer.sdp });
  }

  async handleOffer(sdp: string): Promise<void> {
    await this.pc.setRemoteDescription({ type: 'offer', sdp });

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    this.localStream.getTracks().forEach((track) => {
      this.pc.addTrack(track, this.localStream!);
    });

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this.channel.push('answer', { sdp: answer.sdp });
  }

  async handleAnswer(sdp: string): Promise<void> {
    await this.pc.setRemoteDescription({ type: 'answer', sdp });
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.pc.addIceCandidate(candidate);
  }

  toggleMute(): boolean {
    const audioTrack = this.localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled;
    }
    return false;
  }

  toggleVideo(): boolean {
    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled;
    }
    return false;
  }

  hangup(): void {
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.pc.close();
    this.channel.push('hangup', {});
  }

  // Event handlers
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}
```

### Call Channel (Backend)

```elixir
defmodule CGraphWeb.CallChannel do
  use CGraphWeb, :channel

  def join("call:" <> call_id, _params, socket) do
    call = CGraph.Calls.get_call!(call_id)

    # Verify user is participant
    if socket.assigns.user_id in [call.caller_id, call.callee_id] do
      send(self(), :after_join)
      {:ok, assign(socket, :call_id, call_id)}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def handle_info(:after_join, socket) do
    # Notify other participant
    broadcast_from(socket, "user_joined", %{user_id: socket.assigns.user_id})
    {:noreply, socket}
  end

  def handle_in("offer", %{"sdp" => sdp}, socket) do
    broadcast_from(socket, "offer", %{sdp: sdp, from: socket.assigns.user_id})
    {:noreply, socket}
  end

  def handle_in("answer", %{"sdp" => sdp}, socket) do
    broadcast_from(socket, "answer", %{sdp: sdp, from: socket.assigns.user_id})
    {:noreply, socket}
  end

  def handle_in("ice_candidate", %{"candidate" => candidate}, socket) do
    broadcast_from(socket, "ice_candidate", %{candidate: candidate})
    {:noreply, socket}
  end

  def handle_in("hangup", _params, socket) do
    CGraph.Calls.end_call(socket.assigns.call_id)
    broadcast(socket, "call_ended", %{})
    {:stop, :normal, socket}
  end
end
```

### Call Quality Monitoring

```typescript
// apps/web/src/lib/webrtc/stats.ts
export async function getCallStats(pc: RTCPeerConnection): Promise<CallQuality> {
  const stats = await pc.getStats();
  let quality: CallQuality = { audio: 'good', video: 'good' };

  stats.forEach((report) => {
    if (report.type === 'inbound-rtp') {
      const packetsLost = report.packetsLost || 0;
      const packetsReceived = report.packetsReceived || 1;
      const lossRate = packetsLost / (packetsLost + packetsReceived);

      if (report.kind === 'audio') {
        quality.audio = lossRate > 0.1 ? 'poor' : lossRate > 0.02 ? 'fair' : 'good';
      } else if (report.kind === 'video') {
        quality.video = lossRate > 0.05 ? 'poor' : lossRate > 0.01 ? 'fair' : 'good';
      }
    }
  });

  return quality;
}

// Monitor and adapt
export function monitorCallQuality(
  pc: RTCPeerConnection,
  onQualityChange: (quality: CallQuality) => void
): () => void {
  const interval = setInterval(async () => {
    const quality = await getCallStats(pc);
    onQualityChange(quality);

    // Adapt video quality based on network
    if (quality.video === 'poor') {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        const params = sender.getParameters();
        if (params.encodings[0]) {
          params.encodings[0].maxBitrate = 250000; // Reduce to 250kbps
          await sender.setParameters(params);
        }
      }
    }
  }, 5000);

  return () => clearInterval(interval);
}
```

---

## React 19 Patterns

> **✅ CURRENT STANDARD**: CGraph is on **React 19.1.0** (apps/web, apps/mobile, apps/landing).
> These patterns are the **preferred approach** for all new code. Use `use()`, `useOptimistic()`,
> and `useFormStatus()` in new components. Legacy `useEffect` data-fetching patterns still work but
> should be migrated when touching existing code.

Modern React 19 patterns for improved performance and developer experience.

### The `use()` Hook

React 19's `use()` hook replaces `useEffect` for data fetching — cleaner code, no race conditions.

```typescript
// ❌ OLD: useEffect for data fetching
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchUser(userId)
      .then(data => {
        if (!cancelled) setUser(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error('Unknown error'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <Profile user={user!} />;
}

// ✅ REACT 19: use() with Suspense
import { use, Suspense } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);  // Suspends until resolved
  return <Profile user={user} />;
}

// Parent handles loading/error states
function UserPage({ userId }: { userId: string }) {
  const userPromise = useMemo(() => fetchUser(userId), [userId]);

  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Spinner />}>
        <UserProfile userPromise={userPromise} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Form Actions with `useFormStatus`

```typescript
// ❌ OLD: Manual loading state
function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData(e.currentTarget);
      await submitContact(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" required />
      <button disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

// ✅ REACT 19: Form actions
import { useFormStatus, useActionState } from 'react';

async function submitAction(prevState: State, formData: FormData) {
  try {
    await submitContact(formData);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending}>
      {pending ? 'Sending...' : 'Send'}
    </button>
  );
}

function ContactForm() {
  const [state, formAction] = useActionState(submitAction, { success: false });

  return (
    <form action={formAction}>
      <input name="email" required />
      <SubmitButton />
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

### Optimistic Updates with `useOptimistic`

```typescript
// ❌ OLD: Manual optimistic updates
function MessageThread({ messages: initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [pending, setPending] = useState<Message[]>([]);

  async function sendMessage(text: string) {
    const tempId = crypto.randomUUID();
    const optimistic = { id: tempId, text, pending: true };

    setPending(prev => [...prev, optimistic]);

    try {
      const saved = await api.sendMessage(text);
      setMessages(prev => [...prev, saved]);
    } finally {
      setPending(prev => prev.filter(m => m.id !== tempId));
    }
  }

  return (
    <div>
      {[...messages, ...pending].map(m => (
        <Message key={m.id} message={m} />
      ))}
    </div>
  );
}

// ✅ REACT 19: useOptimistic
import { useOptimistic } from 'react';

function MessageThread({ messages }: Props) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMessage: Message) => [...state, { ...newMessage, pending: true }]
  );

  async function sendMessage(text: string) {
    const optimistic = { id: crypto.randomUUID(), text };
    addOptimistic(optimistic);
    await api.sendMessage(text);
  }

  return (
    <div>
      {optimisticMessages.map(m => (
        <Message key={m.id} message={m} />
      ))}
    </div>
  );
}
```

### Document Metadata

```typescript
// ❌ OLD: useEffect for title
function ProfilePage({ user }: { user: User }) {
  useEffect(() => {
    document.title = `${user.name} - CGraph`;
  }, [user.name]);

  return <Profile user={user} />;
}

// ✅ REACT 19: Native metadata
function ProfilePage({ user }: { user: User }) {
  return (
    <>
      <title>{user.name} - CGraph</title>
      <meta name="description" content={user.bio} />
      <Profile user={user} />
    </>
  );
}
```

---

## Expo 54 Mobile

Modern patterns for React Native with Expo 54.

### Push Notifications

```typescript
// apps/mobile/src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get Expo push token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  });

  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
    });
  }

  return token.data;
}

// Hook for notification handling
export function usePushNotifications() {
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();
  const navigation = useNavigation();

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) {
        api.post('/push-tokens', { token, platform: Platform.OS });
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Handle foreground notification
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      // Navigate based on notification type
      if (data.type === 'message') {
        navigation.navigate('Conversation', { id: data.conversationId });
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
```

### Deep Linking

```typescript
// apps/mobile/src/navigation/linking.ts
import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'cgraph://',
    'https://cgraph.org',
    'https://app.cgraph.org'
  ],
  config: {
    screens: {
      Messages: 'messages',
      Conversation: 'conversation/:id',
      Groups: 'groups',
      Group: 'group/:id',
      Forums: 'forums',
      Thread: 'thread/:id',
      Profile: 'profile/:username',
      Settings: 'settings',
    },
  },
  async getInitialURL() {
    // Handle cold start from notification
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      return response.notification.request.content.data.url as string;
    }
    return await Linking.getInitialURL();
  },
};

// Usage in App.tsx
function App() {
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

### Offline Support

```typescript
// apps/mobile/src/lib/offline.ts
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Queue for offline actions
const OFFLINE_QUEUE_KEY = 'offline_queue';

interface QueuedAction {
  id: string;
  type: 'sendMessage' | 'createPost' | 'vote';
  payload: unknown;
  timestamp: number;
}

export async function queueOfflineAction(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
  const queue = await getOfflineQueue();
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function processOfflineQueue() {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return;

  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  for (const action of queue) {
    try {
      await processAction(action);
      await removeFromQueue(action.id);
    } catch (error) {
      // Keep in queue for retry
      console.error('Failed to process offline action:', error);
    }
  }
}

// Auto-process when coming online
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    processOfflineQueue();
  }
});

// Offline-aware message sending
export async function sendMessage(conversationId: string, text: string) {
  const state = await NetInfo.fetch();

  const message = {
    id: crypto.randomUUID(),
    conversationId,
    text,
    status: state.isConnected ? 'sending' : 'queued',
    createdAt: new Date().toISOString(),
  };

  // Optimistically add to local store
  messageStore.addOptimistic(message);

  if (state.isConnected) {
    try {
      const saved = await api.sendMessage(conversationId, text);
      messageStore.confirmMessage(message.id, saved);
    } catch (error) {
      messageStore.markFailed(message.id);
      await queueOfflineAction({ type: 'sendMessage', payload: { conversationId, text } });
    }
  } else {
    await queueOfflineAction({ type: 'sendMessage', payload: { conversationId, text } });
  }
}
```

### Background Tasks

```typescript
// apps/mobile/src/tasks/background.ts
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const SYNC_TASK = 'BACKGROUND_SYNC';

TaskManager.defineTask(SYNC_TASK, async () => {
  try {
    // Sync unread counts
    const unread = await api.get('/messages/unread-count');
    await Notifications.setBadgeCountAsync(unread.count);

    // Process offline queue
    await processOfflineQueue();

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync() {
  const status = await BackgroundFetch.getStatusAsync();

  if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
    await BackgroundFetch.registerTaskAsync(SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
  }
}
```

---

## Phoenix 1.8 Specifics

Modern patterns for Phoenix 1.8 with verified routes and improved socket handling.

### Verified Routes

```elixir
# Phoenix 1.8 verified routes replace `Routes.*_path` helpers
# Old: Routes.user_path(conn, :show, user)
# New: ~p"/users/#{user}"

defmodule CGraphWeb.Router do
  use CGraphWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug CGraphWeb.Plugs.RateLimiterV2
    plug CGraphWeb.Plugs.CookieAuth
  end

  scope "/api/v1", CGraphWeb do
    pipe_through :api

    # Users
    get "/users/:id", UserController, :show
    put "/users/:id", UserController, :update

    # Messages - using verified routes in controllers
    resources "/conversations", ConversationController do
      resources "/messages", MessageController, only: [:index, :create]
    end
  end
end

# In controllers, use verified routes
defmodule CGraphWeb.UserController do
  use CGraphWeb, :controller

  def show(conn, %{"id" => id}) do
    user = CGraph.Accounts.get_user!(id)

    conn
    |> put_resp_header("location", ~p"/api/v1/users/#{user}")
    |> render(:show, user: user)
  end
end
```

### Improved Socket Handling

```elixir
# lib/cgraph_web/channels/user_socket.ex
defmodule CGraphWeb.UserSocket do
  use Phoenix.Socket

  channel "user:*", CGraphWeb.UserChannel
  channel "conversation:*", CGraphWeb.ConversationChannel
  channel "group:*", CGraphWeb.GroupChannel
  channel "presence:*", CGraphWeb.PresenceChannel

  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    case CGraph.Guardian.decode_and_verify(token) do
      {:ok, claims} ->
        user_id = claims["sub"]
        {:ok, assign(socket, :user_id, user_id)}

      {:error, _reason} ->
        :error
    end
  end

  def connect(_params, _socket, _connect_info), do: :error

  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"
end

# Phoenix 1.8 channel with improved error handling
defmodule CGraphWeb.ConversationChannel do
  use CGraphWeb, :channel

  @impl true
  def join("conversation:" <> conv_id, _payload, socket) do
    if authorized?(socket.assigns.user_id, conv_id) do
      send(self(), :after_join)
      {:ok, assign(socket, :conversation_id, conv_id)}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    # Track presence
    {:ok, _} = CGraphWeb.Presence.track(socket, socket.assigns.user_id, %{
      online_at: System.system_time(:second)
    })

    # Push recent messages
    messages = CGraph.Messaging.recent_messages(socket.assigns.conversation_id, 50)
    push(socket, "recent_messages", %{messages: messages})

    {:noreply, socket}
  end

  @impl true
  def handle_in("new_message", %{"content" => content}, socket) do
    case CGraph.Messaging.create_message(
      socket.assigns.conversation_id,
      socket.assigns.user_id,
      content
    ) do
      {:ok, message} ->
        broadcast!(socket, "new_message", %{message: message})
        {:reply, {:ok, %{id: message.id}}, socket}

      {:error, changeset} ->
        {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
    end
  end

  @impl true
  def terminate(_reason, socket) do
    # Clean up on disconnect
    CGraph.Presence.untrack(socket, socket.assigns.user_id)
    :ok
  end
end
```

### LiveView Integration Points

```elixir
# For admin dashboards or real-time features
defmodule CGraphWeb.AdminLive.Dashboard do
  use CGraphWeb, :live_view

  @impl true
  def mount(_params, session, socket) do
    if connected?(socket) do
      # Subscribe to real-time stats
      Phoenix.PubSub.subscribe(CGraph.PubSub, "stats:live")
    end

    {:ok, assign(socket,
      active_users: CGraph.Stats.active_users(),
      messages_today: CGraph.Stats.messages_today(),
      active_calls: CGraph.Stats.active_calls()
    )}
  end

  @impl true
  def handle_info({:stats_update, stats}, socket) do
    {:noreply, assign(socket, stats)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="dashboard">
      <.stat_card label="Active Users" value={@active_users} />
      <.stat_card label="Messages Today" value={@messages_today} />
      <.stat_card label="Active Calls" value={@active_calls} />
    </div>
    """
  end
end
```

---

## Fly.io Deployment

Production deployment patterns for Fly.io infrastructure.

### fly.toml Configuration

```toml
# apps/backend/fly.toml
app = "cgraph-backend"
primary_region = "fra"  # Frankfurt

[build]
  dockerfile = "Dockerfile"

[env]
  PHX_HOST = "api.cgraph.org"
  PORT = "4000"
  RELEASE_COOKIE = "cgraph-secret-cookie"

[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

  [http_service.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 800

[[services]]
  protocol = "tcp"
  internal_port = 4000

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = 10000
    grace_period = "10s"
    method = "get"
    path = "/health"
    protocol = "http"
    timeout = 2000

# Health check for database
[[services.tcp_checks]]
  grace_period = "30s"
  interval = "15s"
  restart_limit = 0
  timeout = "2s"
```

### Multi-region Deployment (Future)

```toml
# Multi-region configuration (when scaling)
primary_region = "fra"

# Read replicas in other regions
[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"
  processes = ["app"]

[processes]
  app = "/app/bin/server"

# Region-specific environment
[env.fra]
  DATABASE_URL = "postgres://fra-primary.supabase.co/cgraph"

[env.iad]
  DATABASE_URL = "postgres://iad-replica.supabase.co/cgraph"
  READ_ONLY = "true"
```

### Deployment Scripts

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

echo "🚀 Deploying CGraph Backend to Fly.io"

# Run migrations first (blocking)
echo "📦 Running migrations..."
fly ssh console -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"

# Deploy new version
echo "🔄 Deploying new version..."
fly deploy --strategy rolling

# Verify deployment
echo "✅ Verifying deployment..."
fly status

# Check health endpoint
echo "🏥 Checking health..."
curl -s https://api.cgraph.org/health | jq

echo "✨ Deployment complete!"
```

### Secrets Management

```bash
# Set all required secrets
fly secrets set \
  DATABASE_URL="postgres://..." \
  DATABASE_SSL="true" \
  SECRET_KEY_BASE="$(mix phx.gen.secret)" \
  JWT_SECRET="$(openssl rand -base64 32)" \
  ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..."

# List secrets (names only, values hidden)
fly secrets list

# Rotate a secret
fly secrets set JWT_SECRET="$(openssl rand -base64 32)"
```

### Health Checks

```elixir
# lib/cgraph_web/controllers/health_controller.ex
defmodule CGraphWeb.HealthController do
  use CGraphWeb, :controller

  def index(conn, _params) do
    json(conn, %{
      status: "ok",
      version: Application.spec(:cgraph, :vsn) |> to_string(),
      timestamp: DateTime.utc_now()
    })
  end

  def ready(conn, _params) do
    checks = %{
      database: check_database(),
      cache: check_cache(),
      redis: check_redis()
    }

    status = if Enum.all?(Map.values(checks), & &1), do: "ready", else: "degraded"
    http_status = if status == "ready", do: 200, else: 503

    conn
    |> put_status(http_status)
    |> json(%{status: status, checks: checks})
  end

  defp check_database do
    case Ecto.Adapters.SQL.query(CGraph.Repo, "SELECT 1", []) do
      {:ok, _} -> true
      _ -> false
    end
  end

  defp check_cache do
    case CGraph.Cache.get("health:check") do
      {:error, _} -> false
      _ -> true
    end
  end

  defp check_redis do
    case CGraph.Redis.command(["PING"]) do
      {:ok, "PONG"} -> true
      _ -> false
    end
  rescue
    _ -> false
  end
end
```

### Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

echo "⚠️ Rolling back CGraph Backend"

# Get previous deployment
PREVIOUS=$(fly releases | head -3 | tail -1 | awk '{print $1}')

echo "Rolling back to release: $PREVIOUS"

# Rollback
fly deploy --image registry.fly.io/cgraph-backend:$PREVIOUS

# Verify
fly status

echo "✅ Rollback complete"
```

---

## Dependency Injection Patterns

Proper dependency injection improves testability and makes code more modular.

### TypeScript DI Patterns

```typescript
// ❌ BAD: Hard-coded dependencies
class UserService {
  private api = new ApiClient();
  private cache = new RedisCache();
  private logger = new Logger();

  async getUser(id: string): Promise<User> {
    return this.api.get(`/users/${id}`);
  }
}

// ✅ GOOD: Constructor injection
interface UserServiceDeps {
  api: ApiClient;
  cache: CacheService;
  logger: Logger;
}

class UserService {
  constructor(private deps: UserServiceDeps) {}

  async getUser(id: string): Promise<User> {
    this.deps.logger.debug('Fetching user', { id });

    const cached = await this.deps.cache.get(`user:${id}`);
    if (cached) return cached;

    const user = await this.deps.api.get(`/users/${id}`);
    await this.deps.cache.set(`user:${id}`, user);
    return user;
  }
}

// Factory for production
function createUserService(): UserService {
  return new UserService({
    api: new ApiClient(),
    cache: new RedisCache(),
    logger: createLogger('UserService'),
  });
}

// Easy testing
const mockDeps = {
  api: { get: vi.fn() },
  cache: { get: vi.fn(), set: vi.fn() },
  logger: { debug: vi.fn() },
};
const testService = new UserService(mockDeps);
```

### Elixir DI with Behaviors

```elixir
# Define behavior for dependency interface
defmodule CGraph.Cache.Behaviour do
  @callback get(String.t()) :: {:ok, term()} | :miss
  @callback set(String.t(), term(), keyword()) :: :ok | {:error, term()}
  @callback delete(String.t()) :: :ok
end

# Production implementation
defmodule CGraph.Cache.Redis do
  @behaviour CGraph.Cache.Behaviour

  @impl true
  def get(key), do: Redix.command(:cache, ["GET", key])

  @impl true
  def set(key, value, opts) do
    ttl = Keyword.get(opts, :ttl, 300)
    Redix.command(:cache, ["SETEX", key, ttl, value])
  end

  @impl true
  def delete(key), do: Redix.command(:cache, ["DEL", key])
end

# Test implementation
defmodule CGraph.Cache.InMemory do
  @behaviour CGraph.Cache.Behaviour
  use Agent

  def start_link(_), do: Agent.start_link(fn -> %{} end, name: __MODULE__)

  @impl true
  def get(key), do: Agent.get(__MODULE__, &Map.get(&1, key))

  @impl true
  def set(key, value, _opts), do: Agent.update(__MODULE__, &Map.put(&1, key, value))

  @impl true
  def delete(key), do: Agent.update(__MODULE__, &Map.delete(&1, key))
end

# Configuration-based injection
defmodule CGraph.Cache do
  @cache_impl Application.compile_env(:cgraph, :cache_impl, CGraph.Cache.Redis)

  defdelegate get(key), to: @cache_impl
  defdelegate set(key, value, opts \\ []), to: @cache_impl
  defdelegate delete(key), to: @cache_impl
end

# config/test.exs
config :cgraph, cache_impl: CGraph.Cache.InMemory
```

### React Context for Dependencies

```typescript
// Create typed context for services
interface Services {
  api: ApiClient;
  socket: SocketManager;
  storage: StorageService;
  analytics: AnalyticsService;
}

const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return services;
}

// Provider with lazy initialization
export function ServicesProvider({ children }: { children: ReactNode }) {
  const services = useMemo<Services>(() => ({
    api: createApiClient(),
    socket: createSocketManager(),
    storage: createStorageService(),
    analytics: createAnalyticsService(),
  }), []);

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

// Usage in components
function UserProfile({ userId }: { userId: string }) {
  const { api, analytics } = useServices();

  useEffect(() => {
    analytics.track('profile_viewed', { userId });
  }, [userId, analytics]);

  // ...
}
```

---

## Feature Flags & Gradual Rollouts

Safely deploy new features with gradual rollouts and kill switches.

### Feature Flag Service

```typescript
// apps/web/src/lib/featureFlags.ts
interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  allowedUserIds?: string[];
  allowedTiers?: SubscriptionTier[];
}

const FLAGS: Record<string, FeatureFlag> = {
  NEW_CHAT_UI: {
    name: 'new_chat_ui',
    enabled: true,
    rolloutPercentage: 25, // 25% of users
  },
  VOICE_MESSAGES: {
    name: 'voice_messages',
    enabled: true,
    allowedTiers: ['pro', 'business', 'enterprise'],
  },
  AI_SUGGESTIONS: {
    name: 'ai_suggestions',
    enabled: false, // Kill switch
    allowedUserIds: ['internal-testers'],
  },
};

export function isFeatureEnabled(
  flagName: string,
  userId: string,
  userTier?: SubscriptionTier
): boolean {
  const flag = FLAGS[flagName];
  if (!flag || !flag.enabled) return false;

  // Check user allowlist first
  if (flag.allowedUserIds?.includes(userId)) return true;

  // Check tier restrictions
  if (flag.allowedTiers && userTier) {
    if (!flag.allowedTiers.includes(userTier)) return false;
  }

  // Check rollout percentage (deterministic based on userId)
  if (flag.rolloutPercentage !== undefined) {
    const hash = hashString(userId + flagName);
    const bucket = hash % 100;
    return bucket < flag.rolloutPercentage;
  }

  return true;
}

// Deterministic hash for consistent bucketing
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// React hook
export function useFeatureFlag(flagName: string): boolean {
  const user = useAuthStore((s) => s.user);
  return useMemo(
    () => isFeatureEnabled(flagName, user?.id ?? '', user?.tier),
    [flagName, user?.id, user?.tier]
  );
}
```

### Elixir Feature Flags

```elixir
defmodule CGraph.FeatureFlags do
  @moduledoc """
  Feature flag system for gradual rollouts and kill switches.
  """

  alias CGraph.{Cache, Accounts}

  @flags %{
    "new_forum_algorithm" => %{
      enabled: true,
      rollout_percentage: 50,
      allowed_tiers: [:pro, :business, :enterprise]
    },
    "e2ee_group_chats" => %{
      enabled: true,
      rollout_percentage: 10,
      allowed_user_ids: ["beta-testers"]
    },
    "ai_moderation" => %{
      enabled: false  # Kill switch - disabled for all
    }
  }

  def enabled?(flag_name, user_id) do
    flag = Map.get(@flags, flag_name)
    check_flag(flag, user_id)
  end

  defp check_flag(nil, _user_id), do: false
  defp check_flag(%{enabled: false}, _user_id), do: false
  defp check_flag(flag, user_id) do
    cond do
      # Check user allowlist
      user_id in (flag[:allowed_user_ids] || []) ->
        true

      # Check tier restrictions
      flag[:allowed_tiers] ->
        user = Accounts.get_user(user_id)
        user && user.tier in flag.allowed_tiers

      # Check rollout percentage
      flag[:rollout_percentage] ->
        bucket = :erlang.phash2({user_id, flag.name}, 100)
        bucket < flag.rollout_percentage

      # Default enabled
      true ->
        true
    end
  end

  # Plug for feature-gated routes
  defmodule Plug do
    import Plug.Conn

    def init(opts), do: opts

    def call(conn, flag: flag_name) do
      user_id = conn.assigns[:current_user]&.id

      if CGraph.FeatureFlags.enabled?(flag_name, user_id) do
        conn
      else
        conn
        |> put_status(:not_found)
        |> Phoenix.Controller.json(%{error: "Feature not available"})
        |> halt()
      end
    end
  end
end

# Usage in router
scope "/api/v1", CGraphWeb do
  pipe_through [:api, :auth]

  # Feature-gated endpoint
  scope "/ai" do
    plug CGraph.FeatureFlags.Plug, flag: "ai_moderation"
    post "/moderate", AIController, :moderate
  end
end
```

---

## Event Sourcing Patterns

Event sourcing for audit trails and temporal queries.

### Event Store Design

```elixir
defmodule CGraph.Events do
  @moduledoc """
  Event sourcing for critical business events.
  Provides audit trail and enables event replay.
  """

  alias CGraph.Repo
  alias CGraph.Events.Event

  @doc """
  Append an event to the event store.
  """
  def append(aggregate_type, aggregate_id, event_type, data, metadata \\ %{}) do
    %Event{}
    |> Event.changeset(%{
      aggregate_type: aggregate_type,
      aggregate_id: aggregate_id,
      event_type: event_type,
      data: data,
      metadata: Map.merge(metadata, %{
        timestamp: DateTime.utc_now(),
        version: get_next_version(aggregate_type, aggregate_id)
      })
    })
    |> Repo.insert()
  end

  @doc """
  Get all events for an aggregate.
  """
  def get_events(aggregate_type, aggregate_id) do
    Event
    |> where(aggregate_type: ^aggregate_type, aggregate_id: ^aggregate_id)
    |> order_by(asc: :version)
    |> Repo.all()
  end

  @doc """
  Replay events to rebuild state.
  """
  def replay(aggregate_type, aggregate_id, initial_state, reducer) do
    get_events(aggregate_type, aggregate_id)
    |> Enum.reduce(initial_state, fn event, state ->
      reducer.(state, event)
    end)
  end

  defp get_next_version(aggregate_type, aggregate_id) do
    Event
    |> where(aggregate_type: ^aggregate_type, aggregate_id: ^aggregate_id)
    |> select([e], max(e.version))
    |> Repo.one()
    |> Kernel.||(0)
    |> Kernel.+(1)
  end
end

# Usage: Forum moderation with audit trail
defmodule CGraph.Forums.Moderation do
  alias CGraph.Events

  def remove_post(post_id, moderator_id, reason) do
    # Record the event
    Events.append(
      "post",
      post_id,
      "post_removed",
      %{reason: reason},
      %{actor_id: moderator_id}
    )

    # Apply the change
    CGraph.Forums.soft_delete_post(post_id)
  end

  def restore_post(post_id, moderator_id, reason) do
    Events.append(
      "post",
      post_id,
      "post_restored",
      %{reason: reason},
      %{actor_id: moderator_id}
    )

    CGraph.Forums.restore_post(post_id)
  end

  # Get moderation history for a post
  def get_moderation_history(post_id) do
    Events.get_events("post", post_id)
    |> Enum.filter(&(&1.event_type in ["post_removed", "post_restored", "post_edited"]))
  end
end
```

### Frontend Event Tracking

```typescript
// apps/web/src/lib/eventTracking.ts
interface TrackedEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

class EventTracker {
  private queue: TrackedEvent[] = [];
  private flushInterval: number;
  private sessionId: string;

  constructor() {
    this.sessionId = crypto.randomUUID();
    this.flushInterval = window.setInterval(() => this.flush(), 5000);
  }

  track(type: string, payload: Record<string, unknown> = {}) {
    const event: TrackedEvent = {
      type,
      payload,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: useAuthStore.getState().user?.id,
    };

    this.queue.push(event);

    // Flush immediately for critical events
    if (type.startsWith('error_') || type === 'purchase') {
      this.flush();
    }
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await api.post('/analytics/events', { events });
    } catch {
      // Re-queue on failure
      this.queue.unshift(...events);
    }
  }

  destroy() {
    clearInterval(this.flushInterval);
    this.flush();
  }
}

export const eventTracker = new EventTracker();

// Usage
eventTracker.track('message_sent', { conversationId, hasMedia: true });
eventTracker.track('forum_post_created', { forumId, threadId });
```

---

## Graceful Degradation

Ensure the application remains usable when services fail.

### Circuit Breaker Pattern (Detailed)

```typescript
// apps/web/src/lib/circuitBreaker.ts
type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenRequests: number;
}

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailure = 0;
  private halfOpenSuccesses = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenRequests: 3,
    }
  ) {}

  async execute<T>(fn: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.config.resetTimeout) {
        this.state = 'half-open';
        this.halfOpenSuccesses = 0;
      } else {
        if (fallback) return fallback();
        throw new CircuitOpenError(this.name);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) return fallback();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'half-open') {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.config.halfOpenRequests) {
        this.state = 'closed';
        this.failures = 0;
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}

// Usage with fallbacks
const searchCircuitBreaker = new CircuitBreaker('search');

async function searchMessages(query: string): Promise<SearchResult[]> {
  return searchCircuitBreaker.execute(
    () => api.get(`/search?q=${query}`),
    () => {
      // Fallback: local search in cached messages
      const cached = useChatStore.getState().messages;
      return localSearch(cached, query);
    }
  );
}
```

### Fallback UI Components

```typescript
// apps/web/src/components/FallbackUI.tsx
interface GracefulDegradationProps {
  children: ReactNode;
  fallback: ReactNode;
  featureName: string;
}

export function GracefulDegradation({
  children,
  fallback,
  featureName,
}: GracefulDegradationProps) {
  const isHealthy = useServiceHealth(featureName);

  if (!isHealthy) {
    return (
      <div className="degraded-feature">
        <div className="degraded-banner">
          <AlertIcon />
          <span>Limited functionality - some features temporarily unavailable</span>
        </div>
        {fallback}
      </div>
    );
  }

  return <>{children}</>;
}

// Usage
function ForumPage() {
  return (
    <GracefulDegradation
      featureName="forum-service"
      fallback={<CachedForumFeed />}
    >
      <LiveForumFeed />
    </GracefulDegradation>
  );
}

// Cached fallback component
function CachedForumFeed() {
  const cachedThreads = useLocalStorage('cached-forum-threads', []);

  return (
    <div>
      <p className="text-muted">Showing cached content from your last visit</p>
      {cachedThreads.map(thread => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
    </div>
  );
}
```

---

## Idempotency Patterns

Ensure operations can be safely retried without side effects.

### Idempotency Keys

```typescript
// apps/web/src/lib/idempotency.ts
const pendingRequests = new Map<string, Promise<unknown>>();

export async function idempotentRequest<T>(
  key: string,
  request: () => Promise<T>,
  ttlMs: number = 60000
): Promise<T> {
  // Check for in-flight request with same key
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  // Create new request
  const promise = request().finally(() => {
    // Clean up after TTL
    setTimeout(() => pendingRequests.delete(key), ttlMs);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// Usage: Prevent duplicate message sends
async function sendMessage(conversationId: string, content: string) {
  const idempotencyKey = `send-msg:${conversationId}:${hashContent(content)}`;

  return idempotentRequest(idempotencyKey, () =>
    api.post('/messages', {
      conversation_id: conversationId,
      content,
      idempotency_key: idempotencyKey,
    })
  );
}
```

### Backend Idempotency

```elixir
defmodule CGraph.Idempotency do
  @moduledoc """
  Idempotency handling for safe request retries.
  """

  alias CGraph.{Cache, Repo}

  @ttl :timer.hours(24)

  @doc """
  Execute a function idempotently using the provided key.
  Returns cached result if key was seen before.
  """
  def execute(key, fun) do
    cache_key = "idempotency:#{key}"

    case Cache.get(cache_key) do
      {:ok, result} ->
        # Return cached result
        {:ok, result, :cached}

      :miss ->
        # Execute and cache
        result = fun.()
        Cache.set(cache_key, result, ttl: @ttl)
        {:ok, result, :executed}
    end
  end

  @doc """
  Wrap a changeset operation with idempotency.
  """
  def insert_idempotent(changeset, key) do
    execute(key, fn ->
      Repo.insert(changeset)
    end)
    |> case do
      {:ok, {:ok, record}, _status} -> {:ok, record}
      {:ok, {:error, changeset}, _status} -> {:error, changeset}
      error -> error
    end
  end
end

# Usage in controller
defmodule CGraphWeb.MessageController do
  def create(conn, %{"idempotency_key" => key} = params) do
    case Idempotency.execute(key, fn ->
      Messaging.create_message(params)
    end) do
      {:ok, {:ok, message}, :cached} ->
        conn
        |> put_resp_header("x-idempotent-replayed", "true")
        |> render(:show, message: message)

      {:ok, {:ok, message}, :executed} ->
        conn
        |> put_status(:created)
        |> render(:show, message: message)

      {:ok, {:error, changeset}, _} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:errors, changeset: changeset)
    end
  end
end
```

---

## Dead Letter Queue Handling

Handle failed background jobs gracefully.

```elixir
defmodule CGraph.DeadLetterQueue do
  @moduledoc """
  Dead letter queue for failed Oban jobs.
  Stores failed jobs for manual review and potential replay.
  """

  alias CGraph.Repo
  alias CGraph.DeadLetterQueue.FailedJob

  @max_dlq_age_days 30

  def store_failed_job(job, error) do
    %FailedJob{}
    |> FailedJob.changeset(%{
      worker: job.worker,
      args: job.args,
      queue: job.queue,
      attempt: job.attempt,
      max_attempts: job.max_attempts,
      error_message: format_error(error),
      error_stacktrace: format_stacktrace(error),
      original_job_id: job.id,
      failed_at: DateTime.utc_now()
    })
    |> Repo.insert()
  end

  @doc """
  Replay a failed job (manual intervention).
  """
  def replay_job(failed_job_id) do
    failed_job = Repo.get!(FailedJob, failed_job_id)
    worker = String.to_existing_atom(failed_job.worker)

    case Oban.insert(worker.new(failed_job.args)) do
      {:ok, new_job} ->
        Repo.update!(FailedJob.changeset(failed_job, %{
          replayed_at: DateTime.utc_now(),
          replayed_job_id: new_job.id
        }))
        {:ok, new_job}

      error ->
        error
    end
  end

  @doc """
  Clean up old DLQ entries.
  """
  def cleanup do
    cutoff = DateTime.add(DateTime.utc_now(), -@max_dlq_age_days, :day)

    from(f in FailedJob,
      where: f.failed_at < ^cutoff,
      where: not is_nil(f.replayed_at) or f.failed_at < ^cutoff
    )
    |> Repo.delete_all()
  end

  defp format_error(%{message: msg}), do: msg
  defp format_error(error), do: inspect(error)

  defp format_stacktrace(%{stacktrace: st}), do: Exception.format_stacktrace(st)
  defp format_stacktrace(_), do: nil
end

# Oban error handler
defmodule CGraph.ObanErrorHandler do
  def handle_event([:oban, :job, :exception], _measure, meta, _config) do
    if meta.attempt >= meta.max_attempts do
      # Job exhausted all retries - move to DLQ
      CGraph.DeadLetterQueue.store_failed_job(meta.job, meta.error)

      # Alert on critical failures
      if critical_worker?(meta.worker) do
        CGraph.Alerts.send_alert(:job_failed, %{
          worker: meta.worker,
          args: meta.args,
          error: inspect(meta.error)
        })
      end
    end
  end

  defp critical_worker?(worker) do
    worker in [
      CGraph.Workers.PaymentWorker,
      CGraph.Workers.SubscriptionWorker,
      CGraph.Workers.SecurityAlertWorker
    ]
  end
end
```

---

## Configuration Management

Centralized, type-safe configuration patterns.

### TypeScript Configuration

```typescript
// apps/web/src/config/index.ts
import { z } from 'zod';

const configSchema = z.object({
  api: z.object({
    baseUrl: z.string().url(),
    timeout: z.number().min(1000).max(60000),
    retryAttempts: z.number().min(0).max(5),
  }),
  socket: z.object({
    url: z.string(),
    heartbeatInterval: z.number(),
    reconnectBackoff: z.object({
      initial: z.number(),
      max: z.number(),
      multiplier: z.number(),
    }),
  }),
  features: z.object({
    e2eeEnabled: z.boolean(),
    voiceCallsEnabled: z.boolean(),
    maxUploadSizeMb: z.number(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    enableRemote: z.boolean(),
  }),
});

type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const raw = {
    api: {
      baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
      timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 30000),
      retryAttempts: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS ?? 3),
    },
    socket: {
      url: import.meta.env.VITE_SOCKET_URL ?? 'ws://localhost:4000/socket',
      heartbeatInterval: 30000,
      reconnectBackoff: {
        initial: 1000,
        max: 30000,
        multiplier: 2,
      },
    },
    features: {
      e2eeEnabled: import.meta.env.VITE_E2EE_ENABLED === 'true',
      voiceCallsEnabled: import.meta.env.VITE_VOICE_CALLS_ENABLED !== 'false',
      maxUploadSizeMb: Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB ?? 50),
    },
    logging: {
      level: (import.meta.env.VITE_LOG_LEVEL ?? 'info') as Config['logging']['level'],
      enableRemote: import.meta.env.PROD,
    },
  };

  // Validate at startup
  const result = configSchema.safeParse(raw);
  if (!result.success) {
    console.error('Invalid configuration:', result.error.flatten());
    throw new Error('Configuration validation failed');
  }

  return result.data;
}

export const config = loadConfig();

// Freeze to prevent accidental mutations
Object.freeze(config);
Object.freeze(config.api);
Object.freeze(config.socket);
Object.freeze(config.features);
Object.freeze(config.logging);
```

### Elixir Runtime Configuration

```elixir
# config/runtime.exs
import Config

defmodule ConfigHelper do
  def get_env!(key, type \\ :string) do
    value = System.get_env(key) || raise "Missing required env var: #{key}"
    cast(value, type)
  end

  def get_env(key, default, type \\ :string) do
    case System.get_env(key) do
      nil -> default
      value -> cast(value, type)
    end
  end

  defp cast(value, :string), do: value
  defp cast(value, :integer), do: String.to_integer(value)
  defp cast("true", :boolean), do: true
  defp cast("false", :boolean), do: false
  defp cast(value, :list), do: String.split(value, ",", trim: true)
  defp cast(value, :json), do: Jason.decode!(value)
end

import ConfigHelper

if config_env() == :prod do
  config :cgraph, CGraph.Repo,
    url: get_env!("DATABASE_URL"),
    ssl: get_env("DATABASE_SSL", false, :boolean),
    pool_size: get_env("POOL_SIZE", 10, :integer),
    socket_options: [:inet6]

  config :cgraph, CGraphWeb.Endpoint,
    url: [host: get_env!("PHX_HOST"), port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: get_env("PORT", 4000, :integer)
    ],
    secret_key_base: get_env!("SECRET_KEY_BASE")

  config :cgraph, CGraph.Guardian,
    secret_key: get_env!("JWT_SECRET")

  # Feature flags from environment
  config :cgraph, :feature_flags,
    e2ee_enabled: get_env("FEATURE_E2EE", true, :boolean),
    voice_calls_enabled: get_env("FEATURE_VOICE_CALLS", true, :boolean),
    max_upload_size_mb: get_env("MAX_UPLOAD_SIZE_MB", 50, :integer)

  # Stripe configuration
  config :stripity_stripe,
    api_key: get_env!("STRIPE_SECRET_KEY"),
    webhook_secret: get_env!("STRIPE_WEBHOOK_SECRET")

  # CORS allowed origins
  config :cgraph, :cors_origins,
    get_env("CORS_ORIGINS", "https://cgraph.org,https://app.cgraph.org", :list)
end
```

---

## Code Organization Patterns

Patterns for maintainable codebase structure.

### Feature-Based Directory Structure

```
apps/web/src/
├── features/                     # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── types.ts
│   │   └── index.ts              # Public API
│   │
│   ├── messaging/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   └── index.ts
│   │
│   └── forums/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── store/
│       └── index.ts
│
├── shared/                       # Shared across features
│   ├── components/               # Generic UI components
│   │   ├── Button/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── hooks/                    # Generic hooks
│   ├── lib/                      # Utilities
│   └── types/                    # Shared types
│
├── pages/                        # Route pages (thin, import from features)
│   ├── messages/
│   ├── forums/
│   └── settings/
│
└── app/                          # App shell
    ├── App.tsx
    ├── Router.tsx
    └── providers/
```

### Module Boundary Rules

```typescript
// Feature module index.ts - defines public API
// apps/web/src/features/messaging/index.ts

// Components
export { MessageList } from './components/MessageList';
export { MessageComposer } from './components/MessageComposer';
export { ConversationSidebar } from './components/ConversationSidebar';

// Hooks
export { useConversations } from './hooks/useConversations';
export { useMessages } from './hooks/useMessages';

// Types
export type { Message, Conversation, MessageStatus } from './types';

// DO NOT export internal components, utilities, or store internals
// Internal imports should use relative paths within the feature

// ❌ BAD: Cross-feature import of internals
import { formatMessageTime } from '../messaging/utils/format';

// ✅ GOOD: Import from public API
import { MessageList } from '@/features/messaging';

// ✅ GOOD: Or move shared utility to shared/
import { formatTime } from '@/shared/lib/format';
```

### Elixir Context Boundaries

```elixir
# Contexts define clear boundaries
# Only interact with other contexts through their public API

# ❌ BAD: Direct Repo access across contexts
defmodule CGraph.Forums do
  def create_thread(attrs) do
    # Don't directly query users!
    user = CGraph.Repo.get(CGraph.Accounts.User, attrs.author_id)
    # ...
  end
end

# ✅ GOOD: Use context APIs
defmodule CGraph.Forums do
  alias CGraph.Accounts

  def create_thread(attrs) do
    with {:ok, author} <- Accounts.get_user(attrs.author_id),
         :ok <- Accounts.can_post?(author) do
      # Create thread...
    end
  end
end

# Context module structure
defmodule CGraph.Forums do
  @moduledoc """
  The Forums context - all forum-related business logic.

  Public API:
  - list_threads/2
  - get_thread/1
  - create_thread/1
  - update_thread/2
  - delete_thread/1
  - create_post/1
  - vote/3
  """

  # Delegate to submodules for complex operations
  defdelegate search_threads(query, opts), to: CGraph.Forums.Search
  defdelegate calculate_hot_score(thread), to: CGraph.Forums.Scoring
  defdelegate moderate_content(content), to: CGraph.Forums.Moderation

  # Core CRUD operations
  def list_threads(forum_id, opts \\ []) do
    # Implementation...
  end

  def get_thread(id) do
    # Implementation...
  end
end
```

### Import Organization

```typescript
// Consistent import ordering (enforced by ESLint)
// 1. React/framework imports
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import { motion } from 'framer-motion';
import { z } from 'zod';

// 3. Internal absolute imports (features, shared)
import { useAuth } from '@/features/auth';
import { Button, Modal } from '@/shared/components';
import { formatDate } from '@/shared/lib/format';

// 4. Relative imports (same feature)
import { MessageBubble } from './MessageBubble';
import { useMessageActions } from '../hooks/useMessageActions';

// 5. Types (always last in their category)
import type { Message, Conversation } from '../types';
import type { User } from '@/shared/types';
```

---

## Additional Anti-Patterns

### Avoid These Common Mistakes

```typescript
// ❌ Anti-Pattern: Prop Drilling
function App() {
  const [user, setUser] = useState<User | null>(null);
  return (
    <Layout user={user}>
      <Sidebar user={user}>
        <UserInfo user={user}>
          <Avatar user={user} />  {/* Drilled through 4 levels! */}
        </UserInfo>
      </Sidebar>
    </Layout>
  );
}

// ✅ Solution: Use context or state management
function App() {
  return (
    <AuthProvider>
      <Layout>
        <Sidebar>
          <UserInfo />  {/* Gets user from context/store */}
        </Sidebar>
      </Layout>
    </AuthProvider>
  );
}

// ❌ Anti-Pattern: useEffect for derived state
function UserStats({ posts }: { posts: Post[] }) {
  const [totalLikes, setTotalLikes] = useState(0);

  useEffect(() => {
    setTotalLikes(posts.reduce((sum, p) => sum + p.likes, 0));
  }, [posts]);

  return <span>Total likes: {totalLikes}</span>;
}

// ✅ Solution: Derive during render
function UserStats({ posts }: { posts: Post[] }) {
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  return <span>Total likes: {totalLikes}</span>;
}

// ❌ Anti-Pattern: Storing server data in useState
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  // Manual refetch, stale data, no caching...
}

// ✅ Solution: Use React Query / TanStack Query
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });

  // Automatic caching, refetching, deduplication
}

// ❌ Anti-Pattern: Unbounded arrays in state
interface ChatState {
  messages: Message[];  // Grows forever!
}

// ✅ Solution: Bounded collections with eviction
interface ChatState {
  messages: Map<string, Message>;  // Keyed by ID
  messageOrder: string[];          // Bounded to last N
}

const MAX_MESSAGES = 500;

function addMessage(state: ChatState, message: Message): ChatState {
  const newMessages = new Map(state.messages).set(message.id, message);
  let newOrder = [...state.messageOrder, message.id];

  // Evict old messages
  while (newOrder.length > MAX_MESSAGES) {
    const oldestId = newOrder.shift()!;
    newMessages.delete(oldestId);
  }

  return { messages: newMessages, messageOrder: newOrder };
}
```

### Elixir Anti-Patterns

```elixir
# ❌ Anti-Pattern: String keys in maps
def process(%{"user_id" => user_id, "action" => action}) do
  # String keys are error-prone and not compile-time checked
end

# ✅ Solution: Atom keys with pattern matching
def process(%{user_id: user_id, action: action}) do
  # Atom keys are safer and faster
end

# ❌ Anti-Pattern: Overly broad try/rescue
def get_user(id) do
  try do
    user = Repo.get!(User, id)
    {:ok, user}
  rescue
    _ -> {:error, :not_found}  # Catches ALL errors!
  end
end

# ✅ Solution: Specific error handling
def get_user(id) do
  case Repo.get(User, id) do
    nil -> {:error, :not_found}
    user -> {:ok, user}
  end
end

# ❌ Anti-Pattern: Large functions with multiple concerns
def process_order(order_params) do
  # Validate
  # Calculate totals
  # Check inventory
  # Process payment
  # Send confirmation
  # Update analytics
  # ... 200 lines later
end

# ✅ Solution: Pipeline of focused functions
def process_order(order_params) do
  with {:ok, validated} <- validate_order(order_params),
       {:ok, with_totals} <- calculate_totals(validated),
       :ok <- check_inventory(with_totals),
       {:ok, payment} <- process_payment(with_totals),
       {:ok, order} <- create_order(with_totals, payment) do
    # Side effects after success
    send_confirmation_async(order)
    track_order_analytics(order)
    {:ok, order}
  end
end
```

---

## Quick Wins Checklist

Use this checklist when reviewing or writing code:

### Before Committing

- [ ] No `any` types - use `unknown` with type guards
- [ ] No nested ternaries - use early returns or switch
- [ ] No inline object/function props - extract to constants/useCallback
- [ ] No `console.log` - use logger utility
- [ ] No magic numbers - use named constants
- [ ] All async operations have error handling
- [ ] Loading and error states are handled in UI
- [ ] No direct DOM manipulation - use React state
- [ ] No synchronous localStorage in render - use effects

### Code Quality

- [ ] Functions are under 20 lines
- [ ] Maximum 3 parameters (use options object for more)
- [ ] Pure functions are at module level
- [ ] Complex conditionals extracted to named functions
- [ ] Types exported from index files
- [ ] No cross-feature internal imports

### Performance

- [ ] Lists with >50 items are virtualized
- [ ] Heavy computations are memoized
- [ ] Images have explicit dimensions
- [ ] Lazy loading for routes/heavy components
- [ ] No unnecessary re-renders (check with React DevTools)

### Accessibility

- [ ] Interactive elements are focusable
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] Keyboard navigation works

---

_Last updated: January 2026_ _Maintainer: Engineering Team_
