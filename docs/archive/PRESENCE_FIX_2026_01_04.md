# Presence Tracking Fix - January 4, 2026

## Problem Summary

The online/offline status was showing incorrect data due to a fundamental architectural flaw:

### Root Cause

1. **Database `users.status` field was NEVER updated** when users connected/disconnected from
   WebSocket
2. **Mobile and Web used this stale database field as a fallback** when Phoenix Presence returned
   false
3. **Result**: Users appeared "online" indefinitely, even after disconnecting

### Why This Happened

- Database status was meant for "away", "busy", "invisible" custom statuses
- It was incorrectly being used as an online/offline indicator
- Phoenix Presence is the ONLY source of truth for actual WebSocket connection status
- The fallback logic: `const isOnline = presenceOnline || apiStatus === 'online'` masked the problem

## Solution

### Removed Database Status Fallback

**Phoenix Presence is now the single source of truth for online status.**

#### Mobile Changes (`apps/mobile/src/screens/messages/ConversationScreen.tsx`)

**Before:**

```typescript
// Check online status from multiple sources:
// 1. Real-time presence (most accurate if available)
// 2. User's status field from API (fallback for initial render)
const presenceOnline = socketManager.isUserOnline(conversationId, otherUserId);
const apiStatus = (otherParticipant?.user as any)?.status;
const isOnline = presenceOnline || apiStatus === 'online'; // ❌ WRONG!
```

**After:**

```typescript
// Use ONLY Phoenix Presence for online status (single source of truth)
// Database status field is never updated and shows stale data
const presenceOnline = socketManager.isUserOnline(conversationId, otherUserId);
setIsOtherUserOnline(presenceOnline); // ✅ CORRECT!
```

#### Web Changes (`apps/web/src/pages/messages/Messages.tsx`)

**Before:**

```typescript
const isOnline = otherParticipant?.user.status === 'online'; // ❌ Stale data
```

**After:**

```typescript
// Integrated with Phoenix Presence for real-time tracking
const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});

useEffect(() => {
  const unsubscribe = socketManager.onStatusChange((convId, userId, isOnline) => {
    setOnlineStatus((prev) => ({
      ...prev,
      [`${convId}-${userId}`]: isOnline,
    }));
  });
  return unsubscribe;
}, []);

// In ConversationItem component:
const isOnline = otherParticipant
  ? onlineStatus[`${conversation.id}-${otherParticipant.userId}`] || false
  : false; // ✅ CORRECT!
```

#### Friends Page Changes (`apps/web/src/pages/friends/Friends.tsx`)

**Disabled "Online" filter tab** until global presence tracking is implemented:

```typescript
const tabs = [
  { id: 'all' as Tab, label: 'All', count: friends.length },
  // Note: "Online" tab disabled - requires global presence tracking
  // Database status field is never updated and shows stale data
  { id: 'pending' as Tab, label: 'Pending', count: pendingRequests.length },
  { id: 'blocked' as Tab, label: 'Blocked', count: 0 },
];
```

## How Phoenix Presence Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENCE FLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. User connects to WebSocket                               │
│     ↓                                                         │
│  2. Channel join in conversation_channel.ex                  │
│     ↓                                                         │
│  3. handle_info(:after_join) called                          │
│     ↓                                                         │
│  4. Presence.track(socket, user.id, meta)                    │
│     ↓                                                         │
│  5. Phoenix broadcasts presence_state to all channel members │
│     ↓                                                         │
│  6. Frontend receives presence_state event                   │
│     ↓                                                         │
│  7. Presence.onSync() updates onlineUsers map                │
│     ↓                                                         │
│  8. Status change listeners notified                         │
│     ↓                                                         │
│  9. UI updates to show user as online                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Backend Implementation (`apps/backend/lib/cgraph_web/channels/conversation_channel.ex`)

```elixir
def join("conversation:" <> conversation_id, _params, socket) do
  # ... authorization checks ...

  send(self(), :after_join)
  {:ok, socket}
end

def handle_info(:after_join, socket) do
  user = socket.assigns.user
  conversation_id = socket.assigns.conversation_id

  # Track user presence in this conversation
  {:ok, _} = Presence.track(socket, user.id, %{
    user_id: user.id,
    username: user.username,
    online_at: DateTime.utc_now(),
    typing: false
  })

  {:noreply, socket}
end
```

### Frontend Implementation (Mobile)

```typescript
class SocketManager {
  private onlineUsers: Map<string, Set<string>> = new Map();

  joinConversation(conversationId: string): Channel | null {
    const channel = this.socket.channel(`conversation:${conversationId}`, {});
    const presence = new Presence(channel);

    // Initialize online users set
    this.onlineUsers.set(conversationId, new Set());

    // Handle presence sync (initial state)
    presence.onSync(() => {
      const onlineSet = new Set<string>();
      presence.list((id: string) => {
        onlineSet.add(id);
        return id;
      });
      this.onlineUsers.set(conversationId, onlineSet);
    });

    // Handle join events
    presence.onJoin((id: string) => {
      this.onlineUsers.get(conversationId)?.add(id);
      this.notifyStatusChange(conversationId, id, true);
    });

    // Handle leave events
    presence.onLeave((id: string) => {
      this.onlineUsers.get(conversationId)?.delete(id);
      this.notifyStatusChange(conversationId, id, false);
    });

    return channel;
  }

  isUserOnline(conversationId: string, userId: string): boolean {
    return this.onlineUsers.get(conversationId)?.has(userId) || false;
  }
}
```

## What About Database Status Field?

### Keep It For Custom Statuses

The `users.status` field should be used ONLY for:

- "away" - User manually set status
- "busy" - Do not disturb mode
- "invisible" - User wants to appear offline
- Custom status messages

### Don't Use It For Online/Offline

**NEVER** use `users.status` to determine if a user is connected:

- ❌ `if (user.status === 'online')`
- ✅ `if (socketManager.isUserOnline(conversationId, userId))`

## Testing Results

### Before Fix

```
User A disconnects from WebSocket
→ Mobile still shows "Online" ❌
→ Web still shows green dot ❌
→ Database status = "online" (never updated)
→ Presence returns false (correct)
→ Fallback uses stale database value
```

### After Fix

```
User A disconnects from WebSocket
→ Presence.onLeave() fires
→ onlineUsers map updated
→ Status listeners notified
→ Mobile shows "Offline" ✅
→ Web shows gray dot ✅
→ Database status ignored
```

## Future Enhancements

### Global Presence Tracking

For features like "Online Friends" list:

1. **Track users globally** in addition to per-conversation:

```elixir
# In user_socket.ex after authentication
Presence.track(socket, "users:global", user.id, %{
  user_id: user.id,
  username: user.username,
  online_at: DateTime.utc_now()
})
```

2. **Subscribe to global presence** in frontend:

```typescript
const globalChannel = socket.channel('users:global', {});
const globalPresence = new Presence(globalChannel);

globalPresence.onSync(() => {
  const onlineUserIds = globalPresence.list((id) => id);
  // Update global online users list
});
```

3. **Use for Friends page** "Online" tab

## Files Changed

### Mobile

- `apps/mobile/src/screens/messages/ConversationScreen.tsx` - Removed database status fallback

### Web

- `apps/web/src/pages/messages/Messages.tsx` - Integrated presence tracking with status change
  listeners
- `apps/web/src/pages/friends/Friends.tsx` - Disabled "Online" filter tab

### Documentation

- `docs/PRESENCE_FIX_2026_01_04.md` - This document

## Verification Checklist

- ✅ Mobile conversation shows correct online/offline status
- ✅ Web conversation list shows correct green/gray dots
- ✅ Status updates in real-time when users connect/disconnect
- ✅ No more stale "online" status after disconnect
- ✅ Presence tracking works across navigation
- ✅ No presence loops or duplicate handlers

## Key Takeaways

1. **Phoenix Presence is authoritative** for WebSocket connection status
2. **Database fields are never real-time** - don't use them for online/offline
3. **Fallback logic can mask bugs** - be intentional about data sources
4. **Per-conversation presence** is more accurate than global status
5. **Listen to status changes** instead of polling

---

**Status**: ✅ Fixed and Deployed  
**Date**: January 4, 2026  
**Version**: v0.7.18+
