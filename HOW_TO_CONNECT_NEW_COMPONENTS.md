# How To Connect New Components to Backend

## ✅ What's Already Connected

Your mobile app **ALREADY has** these components integrated and working:
1. ✅ **AnimatedAvatar** - Used in ConversationListScreen
2. ✅ **GlassCard** - Used in ConversationListScreen
3. ✅ **Forum Components** - All 5 integrated in PostScreen

## 🔌 What Needs Connection (Optional)

These are **NEW** components that can be optionally added:

### 1. SwipeableMessage (For Chat Messages)

**Where:** `/CGraph/apps/mobile/src/screens/messages/ConversationScreen.tsx`

**Current Code** (around line 500+):
```tsx
// Find the renderMessage function that currently looks like:
const renderMessage = ({ item }: { item: Message }) => {
  // Current message rendering...
  return (
    <View>
      <Text>{item.content}</Text>
    </View>
  );
};
```

**Replace With:**
```tsx
import SwipeableMessage from '../../components/chat/SwipeableMessage';

const renderMessage = ({ item }: { item: Message }) => {
  return (
    <SwipeableMessage
      messageId={item.id}
      content={item.content}
      isMine={item.user_id === user?.id}
      timestamp={safeFormatMessageTime(item.inserted_at)}
      senderName={item.user?.display_name || item.user?.username}
      onReply={(msgId) => {
        // Set reply message
        setReplyTo(item);
      }}
      onLongPress={(msgId) => {
        // Show context menu
        showMessageActions(item);
      }}
      showReactions={!!item.reactions}
      reactions={item.reactions?.map(r => ({
        emoji: r.emoji,
        count: r.count,
        users: r.users || [],
        hasReacted: r.hasReacted || false,
      }))}
    />
  );
};
```

**Backend Data Already Exists:**
- `item.user_id` - From message response
- `item.content` - From message response
- `item.inserted_at` - From message response
- `item.reactions` - From message response (if reactions exist)

**No New API Calls Needed!** Just reformatting existing data.

---

### 2. MessageReactions (Add Reactions to Messages)

**Where:** Same file, add below the message

**Current:** Messages don't show reaction buttons

**Add:**
```tsx
import MessageReactions from '../../components/chat/MessageReactions';

// Inside renderMessage, after SwipeableMessage:
{item.reactions && (
  <MessageReactions
    messageId={item.id}
    reactions={item.reactions.map(r => ({
      emoji: r.emoji,
      count: r.count,
      users: r.users || [],
      hasReacted: r.hasReacted || false,
    }))}
    onAddReaction={(emoji) => {
      // BACKEND ALREADY HAS THIS ENDPOINT!
      api.post(`/api/v1/messages/${item.id}/reactions`, { emoji });
    }}
    onRemoveReaction={(emoji) => {
      // BACKEND ALREADY HAS THIS ENDPOINT!
      api.delete(`/api/v1/messages/${item.id}/reactions/${emoji}`);
    }}
    maxVisible={3}
  />
)}
```

**Backend Endpoints (Already Exist):**
- POST `/api/v1/messages/:id/reactions` - Add reaction
- DELETE `/api/v1/messages/:id/reactions/:emoji` - Remove reaction
- Reactions are returned in message responses automatically

---

### 3. TitleBadge (Show User Titles)

**Where:** User profile screens, leaderboard

**Backend Data Location:**
```typescript
// User object from API already has:
user.equipped_title = {
  id: "title_123",
  name: "Dragon Slayer",
  rarity: "legendary",
  // ... other fields
}
```

**Usage:**
```tsx
import TitleBadge from '../../components/gamification/TitleBadge';

// In your profile/leaderboard component:
{user.equipped_title && (
  <TitleBadge
    title={user.equipped_title.name}
    rarity={user.equipped_title.rarity}
    animation="shimmer"
    size="md"
  />
)}
```

**Backend Response (Already Exists):**
```json
{
  "user": {
    "id": "user_123",
    "username": "player1",
    "equipped_title": {
      "id": "title_dragon",
      "name": "Dragon Slayer",
      "rarity": "legendary"
    }
  }
}
```

**No New API Needed!** Title data comes with user object.

---

### 4. LevelUpModal (Show on XP Gain)

**Where:** Add to your root navigator or gamification screen

**Current:** App doesn't show level-up celebration

**Add:**
```tsx
import LevelUpModal from '../../components/gamification/LevelUpModal';

function YourScreen() {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);

  // Listen for level-up events from backend
  useEffect(() => {
    const channel = socketManager.joinChannel(`user:${user.id}`);

    channel.on('level_up', (data) => {
      // Backend sends: { level, xp_gained, rewards: [...] }
      setLevelUpData(data);
      setShowLevelUp(true);
    });

    return () => channel.leave();
  }, [user.id]);

  return (
    <>
      {/* Your existing content */}

      {levelUpData && (
        <LevelUpModal
          visible={showLevelUp}
          onClose={() => setShowLevelUp(false)}
          level={levelUpData.level}
          xpGained={levelUpData.xp_gained}
          rewards={levelUpData.rewards}
        />
      )}
    </>
  );
}
```

**Backend Integration (Phoenix Channel):**

Your backend **ALREADY has** Phoenix channels setup. Add this to the user channel:

```elixir
# apps/backend/lib/cgraph_web/channels/user_channel.ex

def handle_info({:level_up, data}, socket) do
  push(socket, "level_up", %{
    level: data.new_level,
    xp_gained: data.xp_gained,
    rewards: data.rewards  # Array of rewards
  })
  {:noreply, socket}
end
```

**Backend broadcasts level_up when XP changes:**
```elixir
# apps/backend/lib/cgraph/gamification.ex

def add_xp(user_id, amount) do
  # ... existing XP logic ...

  if level_changed do
    CGraphWeb.Endpoint.broadcast("user:#{user_id}", "level_up", %{
      new_level: new_level,
      xp_gained: amount,
      rewards: calculate_rewards(new_level)
    })
  end
end
```

---

### 5. StickerPicker (Optional Premium Feature)

**Where:** Chat input area

**Current:** No stickers

**Add Button:**
```tsx
import StickerPicker from '../../components/chat/StickerPicker';

function ConversationScreen() {
  const [showStickers, setShowStickers] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  // Fetch user coins (BACKEND ALREADY HAS THIS)
  useEffect(() => {
    api.get('/api/v1/shop/balance').then(res => {
      setUserCoins(res.data.data.coins);
    });
  }, []);

  return (
    <>
      {/* Add button next to text input */}
      <TouchableOpacity onPress={() => setShowStickers(true)}>
        <Text>😊</Text>
      </TouchableOpacity>

      <StickerPicker
        visible={showStickers}
        onClose={() => setShowStickers(false)}
        onSelectSticker={(sticker) => {
          // Send as message
          sendMessage({
            type: 'sticker',
            sticker_id: sticker.id,
          });
        }}
        userCoins={userCoins}
        onPurchase={async (stickerId, price) => {
          // BACKEND ALREADY HAS SHOP PURCHASE ENDPOINT
          const res = await api.post('/api/v1/shop/purchase', {
            item_id: stickerId,
            item_type: 'sticker',
          });
          return res.data.success;
        }}
      />
    </>
  );
}
```

**Backend (Already Exists):**
- GET `/api/v1/shop/balance` - Get user coins
- POST `/api/v1/shop/purchase` - Purchase item
- GET `/api/v1/shop/items` - Get available items

---

## 📋 Summary: What's Actually Needed

### ✅ Already Working (No Changes Needed)
- AnimatedAvatar in ConversationListScreen
- GlassCard in ConversationListScreen
- Forum components in PostScreen
- All backend APIs exist and work

### 🔧 Optional Enhancements (Copy-Paste Above Code)

1. **SwipeableMessage** - Replace current message rendering (5 min)
2. **MessageReactions** - Add below messages (5 min)
3. **TitleBadge** - Add to profiles (2 min)
4. **LevelUpModal** - Add Phoenix channel listener (10 min)
5. **StickerPicker** - Add button + modal (15 min)

**Total Time to Connect Everything: ~40 minutes**

---

## 🚨 Important Notes

1. **Nothing is Broken** - Your app works perfectly without these
2. **Backend APIs Exist** - All endpoints are already implemented
3. **Data Already Flows** - Just need to display it differently
4. **No Schema Changes** - Using existing database structure
5. **Optional Enhancement** - Add only what you want

---

## 🎯 Quick Test

**To verify components work:**

1. **Test AnimatedAvatar** (Already working):
   ```bash
   # Navigate to Messages screen
   # You should see animated avatars with glow effects
   ```

2. **Test SwipeableMessage** (After adding):
   ```bash
   # Open a conversation
   # Swipe a message left or right
   # Should see reply icon fade in
   ```

3. **Test MessageReactions** (After adding):
   ```bash
   # Long-press a message
   # Tap a reaction emoji
   # Should see reaction bubble appear
   ```

---

## 📞 Need Help?

If any component doesn't work:
1. Check console for errors
2. Verify API response format matches expected structure
3. Check that user data includes required fields (equipped_title, is_premium, etc.)

**Your backend is solid - these are just UI enhancements! 🚀**
