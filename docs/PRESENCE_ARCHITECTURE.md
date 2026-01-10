# Phoenix Presence Architecture & Best Practices

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Sampled Presence for Large Channels](#sampled-presence-for-large-channels)
4. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
5. [Implementation Details](#implementation-details)
6. [Troubleshooting](#troubleshooting)

## Overview

CGraph uses Phoenix Presence, a distributed CRDT-based presence tracking system that provides real-time online/offline status across the cluster. For large channels (1000+ members), we've added a sampled presence layer that reduces bandwidth and memory usage while maintaining user experience.

This document details the architectural decisions, patterns, and best practices for working with presence tracking.

### Key Features
- **Real-time presence tracking** across multiple devices
- **Automatic conflict resolution** using CRDTs (Conflict-free Replicated Data Types)
- **Multi-device support** - users can be online from multiple clients
- **Typing indicators** synced across all participants
- **Last seen timestamps** for offline users
- **Sampled presence** for Telegram-scale channels (v0.7.32+)
- **HyperLogLog counting** — O(1) member counts using 12KB per channel

## Architecture

### Component Hierarchy

```
Backend (Phoenix)
├── Phoenix.Presence (CRDT state management)
├── ConversationChannel (per-conversation presence)
└── GroupChannel (per-group presence)

Frontend (Web/Mobile)
├── SocketManager (singleton connection manager)
├── Channel connections (Phoenix channels)
├── Presence instances (per-channel tracking)
└── Component subscriptions (React/React Native)
```

### Data Flow

```
User Action → Component → SocketManager → Phoenix Channel → Backend
                                ↓
Backend Presence → presence_diff → All connected clients
                                ↓
Presence.onSync/onJoin/onLeave → Component state update
```

## Sampled Presence for Large Channels

Standard Phoenix Presence works beautifully for conversations and small groups. But broadcasting presence updates for 100,000+ member channels would saturate both server bandwidth and client memory. We solved this with tiered sampling.

### The Problem at Scale

Imagine a public channel with 500,000 members. If 50,000 of them are online, standard presence would:
- Broadcast 50,000 user objects to every connected client
- Send a presence_diff for every join and leave
- Use ~100MB of RAM per client just for presence data

That's obviously not going to work.

### How Sampled Presence Works

`Cgraph.Presence.Sampled` implements tiered sampling based on channel size:

| Channel Size | Sample Rate | Broadcast Interval | What Users See |
|-------------|-------------|-------------------|-----------------|
| < 100 | 100% | Immediate | Everyone online |
| 100 - 1,000 | 50% | 1 second batched | Half the online users |
| 1,000 - 100,000 | 1% | 10 second batched | "~5,432 online" |
| 100,000+ | 0.1% | 30 second batched | "~523K online" |

For huge channels, we stop showing individual online users entirely and just show an approximate count. That's what Telegram does, and it works.

### HyperLogLog for Counting

We use the HyperLogLog algorithm to count unique online users. It's probabilistic but incredibly space-efficient:
- **12KB of memory** tracks 1 million unique users with ~1% error
- Counts merge across cluster nodes without conflicts
- Adding a user ID is O(1), getting count is O(1)

### Deterministic Sampling

When we sample 1% of online users for display, we don't pick randomly each time. That would make the "who's online" list flicker constantly. Instead, we hash each user ID and use the hash to determine if they're in the sample. The same users always appear in the sample, so the list stays stable.

### Configuration

```elixir
# config/runtime.exs
config :cgraph, Cgraph.Presence.Sampled,
  tiers: [
    %{max_size: 100, sample_rate: 1.0, batch_interval: 0},
    %{max_size: 1_000, sample_rate: 0.5, batch_interval: 1_000},
    %{max_size: 100_000, sample_rate: 0.01, batch_interval: 10_000},
    %{max_size: :infinity, sample_rate: 0.001, batch_interval: 30_000}
  ]
```

## Common Pitfalls & Solutions

### 1. Join/Leave Loops (CRITICAL)

**Problem:** Component remounting causes rapid channel join/leave cycles, flooding the server with presence diffs.

**Symptoms:**
```
[Socket] User abc123 joined conversation:456
[Socket] Presence sync: ["abc123"]
[Socket] User abc123 left conversation:456
[Socket] User abc123 joined conversation:456
... (repeats hundreds of times)
```

**Root Causes:**
- Component unmount/remount during navigation
- Hot module reload in development
- React state updates triggering re-renders
- Multiple components joining same channel

**Solution Implemented (v0.7.16):**

#### A. Socket Manager Debouncing
```typescript
// Track last join attempt per channel
private lastJoinAttempts: Map<string, number> = new Map();
private readonly JOIN_DEBOUNCE_MS = 1000;

joinChannel(topic: string): Channel | null {
  const now = Date.now();
  const lastAttempt = this.lastJoinAttempts.get(topic) || 0;
  
  if (now - lastAttempt < this.JOIN_DEBOUNCE_MS) {
    // Return existing channel without rejoining
    return this.channels.get(topic) || null;
  }
  
  this.lastJoinAttempts.set(topic, now);
  // ... proceed with join
}
```

**Benefits:**
- Prevents rapid join attempts within 1 second window
- Reuses existing healthy channels
- Reduces server load significantly

#### B. Component-Level Tracking
```typescript
// Track if channel already joined for this conversation
const channelJoinedRef = useRef<string | null>(null);

useEffect(() => {
  const channelTopic = `conversation:${conversationId}`;
  
  // Skip if already joined
  if (channelJoinedRef.current === channelTopic) {
    return;
  }
  
  channelJoinedRef.current = channelTopic;
  socketManager.joinChannel(channelTopic);
  
  return () => {
    socketManager.leaveChannel(channelTopic);
    channelJoinedRef.current = null;
  };
}, [conversationId]);
```

**Benefits:**
- Prevents duplicate joins from same component
- Survives re-renders (useRef doesn't trigger updates)
- Proper cleanup on unmount

#### C. Idempotent Handler Registration
```typescript
private channelHandlersSetUp: Set<string> = new Set();

if (!this.channelHandlersSetUp.has(topic)) {
  this.channelHandlersSetUp.add(topic);
  
  // Set up presence callbacks only once
  presence.onSync(() => { /* ... */ });
  presence.onJoin(() => { /* ... */ });
  presence.onLeave(() => { /* ... */ });
  
  // Set up message handlers only once
  channel.on('new_message', handler);
}
```

**Benefits:**
- Prevents duplicate event handlers
- Reduces memory leaks
- Ensures consistent behavior

### 2. Channel State Management

**Problem:** Channels can be in various states (joining, joined, closed, errored, leaving) and attempting operations on channels in bad states causes errors.

**Solution:**
```typescript
const existingChannel = this.channels.get(topic);
if (existingChannel) {
  const state = existingChannel.state;
  if (state === 'joined' || state === 'joining') {
    // Channel is healthy, reuse it
    return existingChannel;
  }
  // Channel in bad state, clean up and recreate
  this.channels.delete(topic);
  this.channelHandlersSetUp.delete(topic);
  // ... clean up all associated state
}
```

### 3. Memory Leaks

**Problem:** Not cleaning up subscriptions and channels leads to memory leaks, especially in development with hot reload.

**Solution:**
```typescript
useEffect(() => {
  const unsubscribe = socketManager.onStatusChange(callback);
  return () => unsubscribe();
}, [dependencies]);

// Always clean up on unmount
return () => {
  socketManager.leaveChannel(topic);
  channelJoinedRef.current = null;
};
```

### 4. Race Conditions

**Problem:** Async operations (socket connection, channel join) complete out of order, causing stale state updates.

**Solution:**
```typescript
useEffect(() => {
  let mounted = true;
  
  const init = async () => {
    await socketManager.connect();
    if (!mounted) return; // Component unmounted, abort
    
    socketManager.joinChannel(topic);
  };
  
  init();
  
  return () => {
    mounted = false;
  };
}, [topic]);
```

## Implementation Details

### Backend (Elixir/Phoenix)

#### ConversationChannel
```elixir
def handle_info(:after_join, socket) do
  user = socket.assigns.current_user
  
  # Track presence with metadata
  {:ok, _} = Presence.track(socket, user.id, %{
    online_at: DateTime.utc_now(),
    typing: false
  })
  
  # Send current presence state to joining client
  push(socket, "presence_state", Presence.list(socket))
  
  {:noreply, socket}
end
```

**Key Points:**
- Each socket connection is tracked separately
- Multiple devices = multiple presence entries (metas array)
- Presence tracked per channel, not globally
- Metadata can be updated without re-tracking

#### Presence Module
```elixir
defmodule Cgraph.Presence do
  use Phoenix.Presence,
    otp_app: :cgraph,
    pubsub_server: Cgraph.PubSub
  
  def track_user(topic, user_id, meta \\ %{}) do
    track(self(), topic, user_id, meta)
  end
  
  def handle_metas(topic, %{joins: joins, leaves: leaves}, presences, state) do
    # Log join/leave events
    # Update last_seen for leaving users
    # Broadcast presence_diff
    {:ok, state}
  end
end
```

### Frontend (TypeScript/React)

#### SocketManager (Singleton)
```typescript
class SocketManager {
  private socket: Socket | null = null;
  private channels: Map<string, Channel> = new Map();
  private presences: Map<string, Presence> = new Map();
  private onlineUsers: Map<string, Set<string>> = new Map();
  
  // Debouncing
  private lastJoinAttempts: Map<string, number> = new Map();
  private readonly JOIN_DEBOUNCE_MS = 1000;
  
  // Handler deduplication
  private channelHandlersSetUp: Set<string> = new Set();
}
```

**Singleton Pattern:**
```typescript
// Persist across Hot Module Reload
declare global {
  var __socketManager: SocketManager | undefined;
}

if (!global.__socketManager) {
  global.__socketManager = new SocketManager();
}

export const socketManager = global.__socketManager;
```

#### Component Integration
```typescript
function ConversationScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const channelJoinedRef = useRef<string | null>(null);
  
  // Subscribe to presence changes
  useEffect(() => {
    if (!conversationId || !otherUserId) return;
    
    // Initial check
    setIsOnline(socketManager.isUserOnline(conversationId, otherUserId));
    
    // Subscribe to changes
    const unsubscribe = socketManager.onStatusChange((convId, userId, online) => {
      if (convId === conversationId && userId === otherUserId) {
        setIsOnline(online);
      }
    });
    
    return () => unsubscribe();
  }, [conversationId, otherUserId]);
  
  // Join channel once
  useEffect(() => {
    const topic = `conversation:${conversationId}`;
    
    if (channelJoinedRef.current === topic) return;
    
    const init = async () => {
      await socketManager.connect();
      channelJoinedRef.current = topic;
      socketManager.joinChannel(topic);
    };
    
    init();
    
    return () => {
      socketManager.leaveChannel(topic);
      channelJoinedRef.current = null;
    };
  }, [conversationId]);
}
```

## Troubleshooting

### Debugging Presence Issues

#### 1. Enable Debug Logging
```typescript
// In socket manager
logger.log(`[joinChannel] Topic: ${topic}, State: ${channel.state}`);
logger.log(`[Presence] Online users:`, Array.from(onlineUsers));
```

#### 2. Check Channel State
```typescript
const channel = socketManager.getChannel(topic);
console.log('Channel state:', channel?.state);
// Possible states: 'closed', 'errored', 'joined', 'joining', 'leaving'
```

#### 3. Monitor Backend Logs
```bash
# Watch for join/leave spam
grep "joined conversation" apps/backend/_build/dev/logs/*
grep "left conversation" apps/backend/_build/dev/logs/*
```

#### 4. Inspect Presence State
```typescript
socketManager.getOnlineUsers(conversationId);
// Should return stable array, not rapidly changing
```

### Common Errors

#### "Socket not connected"
**Cause:** Attempting to join channel before socket connection established
**Solution:** Always await `socketManager.connect()` before joining

#### "Channel already joined"
**Cause:** Multiple join attempts without checking existing channel
**Solution:** Implemented in v0.7.16 - socket manager now handles this automatically

#### "User constantly appearing/disappearing"
**Cause:** Join/leave loop (see section above)
**Solution:** Applied debouncing + component tracking fixes

#### "Presence state out of sync"
**Cause:** Network interruption or backend restart
**Solution:** Phoenix Presence automatically resyncs on reconnect

## Best Practices

### DO ✅
- Use singleton SocketManager pattern
- Implement join debouncing (minimum 1 second)
- Track channel joins with refs in components
- Clean up channels on unmount
- Check channel state before operations
- Use idempotent handler registration
- Subscribe to presence changes via callbacks
- Handle async operations with mounted flags

### DON'T ❌
- Join channels directly in render functions
- Create multiple SocketManager instances
- Skip cleanup in useEffect returns
- Assume socket is always connected
- Re-register handlers on every render
- Ignore channel state when rejoining
- Poll for presence state (use callbacks)
- Leave channels alive indefinitely

## Version History

### v0.7.16 (Current)
- **MAJOR FIX**: Implemented join debouncing (1000ms minimum)
- Added component-level channel join tracking with refs
- Implemented idempotent handler registration
- Added comprehensive channel state validation
- Proper cleanup of all state on channel leave
- Fixed date parsing errors with null checks
- Fixed deprecated expo-file-system API

### v0.7.15
- Added voice message support
- Fixed Unknown usernames issue

### v0.7.14
- Initial presence tracking implementation
- Basic socket manager structure

## References

- [Phoenix Presence Documentation](https://hexdocs.pm/phoenix/Phoenix.Presence.html)
- [Phoenix Channel Documentation](https://hexdocs.pm/phoenix/channels.html)
- [CRDT Overview](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
- Phoenix JavaScript Client: [phoenix package](https://www.npmjs.com/package/phoenix)

---

**Last Updated:** v0.7.16  
**Author:** CGraph Development Team  
**License:** MIT
