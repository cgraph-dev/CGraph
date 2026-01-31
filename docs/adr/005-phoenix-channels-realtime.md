# Architecture Decision Record: Phoenix Channels for Real-time

## Status

Accepted

## Date

2025-01-01

## Context

CGraph requires real-time features:

- Instant message delivery
- Typing indicators
- Online presence
- Voice/video call signaling
- Live notifications

We needed a reliable, scalable real-time transport.

## Decision

We adopted **Phoenix Channels** (WebSocket-based) for all real-time communication.

### Channel Architecture

```
Phoenix Channels
├── UserChannel (user:user_id)
│   ├── Notifications
│   ├── Friend requests
│   └── Presence updates
├── ConversationChannel (conversation:conv_id)
│   ├── Messages
│   ├── Typing indicators
│   ├── Read receipts
│   └── Reactions
└── CallChannel (call:conv_id)
    ├── WebRTC signaling
    ├── Offer/Answer exchange
    └── ICE candidates
```

### Backend Implementation

```elixir
# UserSocket
defmodule CgraphWeb.UserSocket do
  use Phoenix.Socket

  channel "user:*", CgraphWeb.UserChannel
  channel "conversation:*", CgraphWeb.ConversationChannel
  channel "call:*", CgraphWeb.CallChannel

  def connect(%{"token" => token}, socket, _connect_info) do
    case verify_token(token) do
      {:ok, user_id} -> {:ok, assign(socket, :user_id, user_id)}
      {:error, _} -> :error
    end
  end
end
```

### Frontend Implementation

```typescript
// socket.ts
export const socketManager = {
  socket: null,
  channels: new Map(),

  connect(token: string) {
    this.socket = new Socket('/socket', { params: { token } });
    this.socket.connect();
  },

  joinConversation(convId: string) {
    const channel = this.socket.channel(`conversation:${convId}`);
    channel.join();
    return channel;
  },
};
```

## Consequences

### Positive

- **Built-in Presence**: Phoenix Presence tracks online users
- **Scalability**: Distributed PubSub via Redis/PG2
- **Reliability**: Automatic reconnection, heartbeats
- **Performance**: Binary WebSocket protocol, minimal overhead
- **Authentication**: Token-based auth at socket level

### Negative

- **Elixir Coupling**: Tightly coupled to Phoenix
- **Client Library**: Custom JS client needed
- **Debugging**: WebSocket debugging less intuitive than REST

## Scaling Strategy

```
┌─────────────┐     ┌─────────────┐
│   Client    │────>│ Load        │
│  (Browser)  │     │ Balancer    │
└─────────────┘     └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────┴────┐       ┌─────┴────┐      ┌─────┴────┐
   │ Phoenix │       │ Phoenix  │      │ Phoenix  │
   │ Node 1  │       │ Node 2   │      │ Node 3   │
   └────┬────┘       └────┬─────┘      └────┬─────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────┴──────┐
                    │    Redis    │
                    │   PubSub    │
                    └─────────────┘
```

## Alternatives Considered

1. **Socket.io**: Node.js WebSocket library
   - Rejected: Requires Node.js, less performant than Phoenix

2. **Pusher/Ably**: Managed WebSocket services
   - Rejected: Vendor lock-in, cost at scale

3. **GraphQL Subscriptions**: Apollo-style real-time
   - Rejected: Overhead for simple messaging

## References

- [Phoenix Channels Guide](https://hexdocs.pm/phoenix/channels.html)
- [Phoenix Presence](https://hexdocs.pm/phoenix/Phoenix.Presence.html)
