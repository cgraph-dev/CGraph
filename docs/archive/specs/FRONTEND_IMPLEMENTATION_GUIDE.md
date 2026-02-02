# Frontend Implementation Guide - Global Theme System

## 📋 Overview

This guide provides step-by-step instructions for implementing the global theme system across all
frontend pages. The core infrastructure is ready - we just need to integrate it everywhere.

**Status**: ✅ Core built, 🚧 Integration needed

---

## ✅ Already Completed

### 1. Core Infrastructure

- ✅ **Theme Store** (`/apps/web/src/stores/themeStore.ts`)
  - Complete state management
  - 12 color presets
  - Persist to localStorage
  - Server sync preparation

- ✅ **Themed Components**
  - `ThemedAvatar.tsx` - Animated avatar with border effects
  - `ThemedChatBubble.tsx` - Chat bubbles with user themes

- ✅ **Theme Customization Page** (`/apps/web/src/pages/settings/ThemeCustomization.tsx`)
  - Live preview
  - 4 tabs of customization
  - Export/import functionality

- ✅ **App.tsx Integration**
  - Global CSS variables
  - Theme initialization
  - Server sync on login
  - Route added: `/settings/theme`

---

## 🚧 Implementation Checklist

### Phase 1: Message/Chat Components (Priority: HIGH)

#### 1.1 Update Conversation Component

**File**: `/apps/web/src/pages/messages/Conversation.tsx`

**Current State**: Uses standard message bubbles **Goal**: Replace with `ThemedChatBubble` component

**Steps**:

1. Import ThemedChatBubble:

```typescript
import { ThemedChatBubble } from '@/components/theme/ThemedChatBubble';
```

2. Find the message rendering section (usually inside a `.map()`)

3. Replace existing message bubble with:

```typescript
<ThemedChatBubble
  message={message.content}
  timestamp={formatTimestamp(message.timestamp)}
  isOwn={message.senderId === currentUserId}
  userTheme={message.senderThemeSnapshot} // From backend
  userName={message.sender Name}
  userAvatar={message.senderAvatar}
  showAvatar={true}
  showTimestamp={true}
/>
```

4. Update message type to include theme snapshot:

```typescript
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  senderThemeSnapshot?: Partial<UserTheme>; // Add this
  timestamp: string;
}
```

**Testing**:

- [ ] Messages render with correct themes
- [ ] Own messages use current user's theme
- [ ] Other user's messages use their theme
- [ ] Entrance animations work
- [ ] Hover effects functional

---

#### 1.2 Update Enhanced Conversation

**File**: `/apps/web/src/pages/messages/EnhancedConversation.tsx`

Same steps as 1.1

---

#### 1.3 Update Group Channel Messages

**File**: `/apps/web/src/pages/groups/GroupChannel.tsx`

Same steps as 1.1, but with group context

**Additional**:

- Show avatar for all messages (group context)
- Different theme per member

---

### Phase 2: Profile & Avatar Updates (Priority: HIGH)

#### 2.1 Update User Profile Page

**File**: `/apps/web/src/pages/profile/UserProfile.tsx`

**Steps**:

1. Import ThemedAvatar:

```typescript
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
```

2. Replace existing avatar image with:

```typescript
<ThemedAvatar
  src={user.avatarUrl}
  alt={user.displayName || user.username}
  size="xlarge"
  userTheme={profileUser.themePreferences} // Fetch from API
/>
```

3. Apply themed background:

```typescript
const { theme } = useThemeStore();
const colors = THEME_COLORS[theme.colorPreset];

// In component JSX
<div
  className="profile-header"
  style={{
    background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
    backdropFilter: theme.blurEnabled ? 'blur(10px)' : 'none',
  }}
>
```

4. Add animated particles for premium users:

```typescript
{theme.particlesEnabled && user.isPremium && (
  <div className="absolute inset-0 pointer-events-none">
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{ background: colors.primary }}
        animate={{ y: [-10, 10], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
      />
    ))}
  </div>
)}
```

**Testing**:

- [ ] Avatar displays with correct theme
- [ ] Profile background matches theme
- [ ] Particles render for premium users
- [ ] Responsive on mobile

---

#### 2.2 Update Settings Page Avatar

**File**: `/apps/web/src/pages/settings/Settings.tsx`

Find avatar section and replace with `ThemedAvatar`

Add link to theme customization:

```typescript
<Link
  to="/settings/theme"
  className="flex items-center gap-3 p-4 rounded-lg border border-gray-700 hover:border-emerald-500 transition-colors"
>
  <span className="text-2xl">🎨</span>
  <div>
    <div className="font-medium">Theme Customization</div>
    <div className="text-sm text-gray-400">
      Personalize your avatar, chat bubbles, and more
    </div>
  </div>
  <ChevronRightIcon className="ml-auto w-5 h-5 text-gray-400" />
</Link>
```

---

### Phase 3: Authentication Pages (Priority: MEDIUM)

#### 3.1 Update Login Page

**File**: `/apps/web/src/pages/auth/Login.tsx`

**Steps**:

1. Import theme store:

```typescript
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
```

2. Add animated background:

```typescript
const { theme } = useThemeStore();
const colors = THEME_COLORS[theme.colorPreset];

return (
  <div className="min-h-screen relative">
    {/* Animated background */}
    {theme.animatedBackground && (
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
    )}

    {/* Login form */}
    <div className="relative z-10">
      {/* ... existing form ... */}
    </div>
  </div>
);
```

3. Apply theme to buttons:

```typescript
<button
  type="submit"
  style={{
    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
    boxShadow: theme.glowEnabled ? `0 0 20px ${colors.glow}` : 'none',
  }}
  className="w-full py-3 rounded-lg text-white font-medium transition-all hover:scale-105"
>
  Login
</button>
```

**Testing**:

- [ ] Background animates smoothly
- [ ] Buttons use theme colors
- [ ] Glow effect works when enabled
- [ ] Theme persists after logout

---

#### 3.2 Update Register Page

**File**: `/apps/web/src/pages/auth/Register.tsx`

Same approach as Login page.

---

#### 3.3 Update Onboarding

**File**: `/apps/web/src/pages/auth/Onboarding.tsx`

**Steps**:

1. Add theme selection step (Step 3 of onboarding)

2. Show quick preset picker:

```typescript
const presets = ['minimal', 'modern', 'vibrant', 'elegant', 'gaming'];

<div className="grid grid-cols-5 gap-4">
  {presets.map((preset) => (
    <button
      key={preset}
      onClick={() => applyPreset(preset)}
      className="p-4 rounded-lg border-2 border-gray-700 hover:border-emerald-500 transition-all"
    >
      <div className="text-sm font-medium capitalize">{preset}</div>
    </button>
  ))}
</div>

<button
  onClick={() => skipToNextStep()}
  className="mt-4 text-gray-400 text-sm"
>
  Skip - I'll customize later
</button>
```

**Testing**:

- [ ] Theme picker appears in onboarding
- [ ] Skip button works
- [ ] Selected theme persists
- [ ] Preview updates in real-time

---

### Phase 4: Forum Integration (Priority: MEDIUM)

#### 4.1 Update Forum Post List

**File**: `/apps/web/src/pages/forums/Forums.tsx`

**Steps**:

1. Add ThemedAvatar to post author:

```typescript
<ThemedAvatar
  src={post.author.avatarUrl}
  alt={post.author.username}
  size="medium"
  userTheme={post.authorThemeSnapshot}
/>
```

2. Add theme-colored post title for premium users:

```typescript
{post.author.isPremium && (
  <h3
    className="text-lg font-bold"
    style={{
      background: `linear-gradient(135deg, ${authorColors.primary}, ${authorColors.secondary})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    }}
  >
    {post.title}
  </h3>
)}
```

**Testing**:

- [ ] Author avatars show theme borders
- [ ] Premium posts have gradient titles
- [ ] List loads quickly with many posts

---

#### 4.2 Update Forum Post View

**File**: `/apps/web/src/pages/forums/ForumPost.tsx`

**Steps**:

1. Update post author avatar (large)
2. Update comment avatars (small)
3. Apply theme to comment bubbles:

```typescript
<div
  className="comment-bubble p-4 rounded-lg"
  style={{
    background: comment.authorThemeSnapshot?.chatBubbleColor
      ? THEME_COLORS[comment.authorThemeSnapshot.chatBubbleColor].primary + '20'
      : undefined,
    borderLeft: `4px solid ${THEME_COLORS[comment.authorThemeSnapshot?.chatBubbleColor || 'emerald'].primary}`,
  }}
>
  <div className="flex items-start gap-3">
    <ThemedAvatar
      src={comment.author.avatarUrl}
      size="small"
      userTheme={comment.authorThemeSnapshot}
    />
    <div className="flex-1">
      <div className="font-medium">{comment.author.username}</div>
      <div className="text-sm text-gray-300 mt-1">{comment.content}</div>
    </div>
  </div>
</div>
```

**Testing**:

- [ ] Post author avatar themed correctly
- [ ] Comments show author themes
- [ ] Theme colors don't clash
- [ ] Readable on all backgrounds

---

### Phase 5: Navigation & Layout (Priority: MEDIUM)

#### 5.1 Update App Layout

**File**: `/apps/web/src/layouts/AppLayout.tsx`

**Steps**:

1. Import theme store:

```typescript
import { useThemeStore, THEME_COLORS } from '@/stores/themeStore';
```

2. Apply theme to sidebar active items:

```typescript
const { theme } = useThemeStore();
const colors = THEME_COLORS[theme.colorPreset];

// In navigation item
<NavLink
  to="/messages"
  style={({ isActive }) =>
    isActive
      ? {
          background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
          borderLeft: `3px solid ${colors.primary}`,
        }
      : {}
  }
>
  Messages
</NavLink>
```

3. Update user menu avatar:

```typescript
<ThemedAvatar
  src={user.avatarUrl}
  size="small"
  alt={user.displayName}
/>
```

**Testing**:

- [ ] Active nav items use theme color
- [ ] User avatar in header has border
- [ ] Theme persists across pages
- [ ] Smooth transitions

---

### Phase 6: Additional Pages

#### 6.1 Friends Page

**File**: `/apps/web/src/pages/friends/Friends.tsx`

Replace all friend avatars with `ThemedAvatar`:

```typescript
<ThemedAvatar
  src={friend.avatarUrl}
  alt={friend.displayName}
  size="medium"
  userTheme={friend.themePreferences} // Fetch from API
/>
```

---

#### 6.2 Member List

**File**: `/apps/web/src/pages/members/MemberList.tsx`

Same as Friends page.

**Optional Enhancement**: Filter by theme color:

```typescript
<select onChange={(e) => setFilterTheme(e.target.value)}>
  <option value="">All Themes</option>
  {Object.keys(THEME_COLORS).map((color) => (
    <option key={color} value={color}>
      {THEME_COLORS[color].name}
    </option>
  ))}
</select>
```

---

#### 6.3 Leaderboard

**File**: `/apps/web/src/pages/leaderboard/LeaderboardPage.tsx`

**Steps**:

1. Add ThemedAvatar for all users
2. Special animation for #1 position:

```typescript
{rank === 1 && (
  <motion.div
    className="absolute -inset-2"
    style={{
      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      opacity: 0.3,
    }}
    animate={{
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
    }}
    transition={{ duration: 3, repeat: Infinity }}
  />
)}
```

---

#### 6.4 Notifications

**File**: `/apps/web/src/pages/notifications/Notifications.tsx`

**Steps**:

1. Add ThemedAvatar for notification senders
2. Theme-colored notification badges:

```typescript
<div
  className="notification-badge"
  style={{
    background: colors.primary,
    boxShadow: `0 0 10px ${colors.glow}`,
  }}
>
  {unreadCount}
</div>
```

---

### Phase 7: Premium Features

#### 7.1 Create Premium Theme Gate Component

**File**: `/apps/web/src/components/theme/PremiumThemeGate.tsx`

```typescript
import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';

interface PremiumThemeGateProps {
  feature: string;
  requiredTier: 'starter' | 'pro' | 'business';
  children: React.ReactNode;
}

export function PremiumThemeGate({
  feature,
  requiredTier,
  children,
}: PremiumThemeGateProps) {
  const user = useAuthStore((state) => state.user);

  const tierOrder = { free: 0, starter: 1, pro: 2, business: 3 };
  const userTier = user?.subscriptionTier || 'free';
  const hasAccess = tierOrder[userTier] >= tierOrder[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 rounded-lg">
        <div className="text-center p-6">
          <div className="text-yellow-400 text-3xl mb-2">👑</div>
          <div className="font-medium mb-1">Premium Feature</div>
          <div className="text-sm text-gray-400 mb-4">
            {feature} requires {requiredTier} subscription
          </div>
          <Link
            to="/premium"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**Usage in ThemeCustomization.tsx**:

```typescript
<PremiumThemeGate feature="Legendary Border" requiredTier="business">
  <button onClick={() => setAvatarBorder('legendary')}>
    Legendary Border
  </button>
</PremiumThemeGate>
```

---

#### 7.2 Update Coin Shop

**File**: `/apps/web/src/pages/premium/CoinShop.tsx`

Add theme packs for purchase:

```typescript
const themeProducts = [
  {
    id: 'japanese-theme-pack',
    name: 'Japanese Theme Pack',
    description: '10 exclusive Japanese-themed borders',
    price: 500,
    icon: '🌸',
  },
  {
    id: 'cyberpunk-effects',
    name: 'Cyberpunk Effects',
    description: 'Neon glow and holographic effects',
    price: 300,
    icon: '🌆',
  },
  // ... more products
];
```

---

## 🎨 CSS Architecture

### Global CSS Variables

Add to `/apps/web/src/index.css`:

```css
:root {
  /* Theme colors (set by App.tsx) */
  --theme-primary: #10b981;
  --theme-secondary: #34d399;
  --theme-glow: rgba(16, 185, 129, 0.5);
  --theme-gradient: from-emerald-500 to-emerald-600;

  /* Usage throughout app */
  --nav-active-bg: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  --button-primary-bg: var(--theme-primary);
  --button-primary-shadow: 0 0 20px var(--theme-glow);
}

/* Themed buttons */
.btn-primary {
  background: var(--button-primary-bg);
  box-shadow: var(--button-primary-shadow);
  transition:
    transform 0.2s,
    box-shadow 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 30px var(--theme-glow);
}

/* Themed links */
.link-primary {
  color: var(--theme-primary);
  text-decoration: none;
}

.link-primary:hover {
  color: var(--theme-secondary);
}

/* Themed borders */
.border-themed {
  border-color: var(--theme-primary);
}

/* Themed text gradients */
.text-gradient-themed {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

**Theme Customization Page**:

- [ ] All color presets selectable
- [ ] Avatar border preview updates in real-time
- [ ] Chat bubble preview shows correct style
- [ ] Export theme downloads JSON file
- [ ] Import theme loads correctly
- [ ] Reset button works
- [ ] All sliders functional
- [ ] Toggles work correctly

**Messages/Chat**:

- [ ] Own messages use your theme
- [ ] Other user messages use their theme
- [ ] Themes don't clash visually
- [ ] Entrance animations smooth
- [ ] Hover effects work
- [ ] Bubbles resize correctly
- [ ] Timestamps visible
- [ ] Avatars display with borders

**Profiles**:

- [ ] Avatar border animates
- [ ] Profile background themed
- [ ] Particles render (if enabled)
- [ ] Theme matches customization
- [ ] Responsive on mobile

**Auth Pages**:

- [ ] Background animates
- [ ] Buttons use theme
- [ ] Login/register forms themed
- [ ] Theme persists after logout

**Navigation**:

- [ ] Active items use theme color
- [ ] User avatar in header themed
- [ ] Smooth transitions
- [ ] Theme applies to all routes

### Automated Testing

Create test file `/apps/web/src/tests/theme.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { useThemeStore } from '@/stores/themeStore';
import { ThemedAvatar } from '@/components/theme/ThemedAvatar';
import { ThemedChatBubble } from '@/components/theme/ThemedChatBubble';

describe('Theme System', () => {
  it('applies color preset correctly', () => {
    const { setColorPreset, theme } = useThemeStore.getState();
    setColorPreset('purple');
    expect(theme.colorPreset).toBe('purple');
  });

  it('renders themed avatar', () => {
    render(<ThemedAvatar src="/test-avatar.png" size="medium" />);
    const avatar = screen.getByRole('img');
    expect(avatar).toBeInTheDocument();
  });

  it('renders chat bubble with theme', () => {
    render(
      <ThemedChatBubble
        message="Test message"
        isOwn={true}
        userName="Test User"
      />
    );
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('exports theme as JSON', () => {
    const { exportTheme } = useThemeStore.getState();
    const json = exportTheme();
    const parsed = JSON.parse(json);
    expect(parsed.colorPreset).toBeDefined();
  });

  it('imports theme correctly', () => {
    const { importTheme, theme } = useThemeStore.getState();
    const testTheme = JSON.stringify({ colorPreset: 'cyan' });
    importTheme(testTheme);
    expect(theme.colorPreset).toBe('cyan');
  });
});
```

---

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] All components tested locally
- [ ] Theme persistence works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessibility checked (contrast ratios)
- [ ] Performance profiled (no lag with particles)

### Deployment

- [ ] Backend API ready (see BACKEND_API_SPECIFICATION.md)
- [ ] Environment variables set
- [ ] Build succeeds
- [ ] Feature flag enabled (if using)
- [ ] Analytics tracking added

### Post-deployment

- [ ] Monitor error rates
- [ ] Check theme adoption metrics
- [ ] Collect user feedback
- [ ] A/B test performance

---

## 📊 Performance Optimization

### 1. Lazy Load Particle Effects

```typescript
const ParticleEffect = lazy(() => import('@/components/theme/ParticleEffect'));

{theme.particlesEnabled && user.isPremium && (
  <Suspense fallback={null}>
    <ParticleEffect count={15} color={colors.primary} />
  </Suspense>
)}
```

### 2. Memoize Theme Colors

```typescript
const colors = useMemo(() => THEME_COLORS[theme.colorPreset], [theme.colorPreset]);
```

### 3. Debounce Theme Updates

```typescript
const debouncedSaveTheme = useMemo(
  () =>
    debounce((theme: UserTheme) => {
      saveToServer(userId, theme);
    }, 2000),
  [userId]
);
```

### 4. Cache User Themes

```typescript
// In your API client
const userThemeCache = new Map<string, UserTheme>();

export async function getUserTheme(userId: string) {
  if (userThemeCache.has(userId)) {
    return userThemeCache.get(userId);
  }

  const theme = await api.get(`/users/${userId}/theme`);
  userThemeCache.set(userId, theme.data);
  return theme.data;
}
```

---

## 🎯 Quick Win: Update Priorities

If you have limited time, implement in this order for maximum impact:

**Day 1** (4-6 hours):

1. Message/Chat components (Phase 1) - Most visible
2. Profile page avatars (Phase 2.1) - High traffic

**Day 2** (4-6 hours): 3. Settings page link (Phase 2.2) 4. Navigation active items (Phase 5.1) 5.
Friends/Members avatars (Phase 6.1-6.2)

**Day 3** (4-6 hours): 6. Forum integration (Phase 4.1-4.2) 7. Authentication pages (Phase 3.1-3.2)

**Day 4** (4-6 hours): 8. Premium features (Phase 7) 9. Testing & polish 10. Deploy!

---

## 📚 Reference Links

- Theme Store: `/apps/web/src/stores/themeStore.ts`
- Themed Components: `/apps/web/src/components/theme/`
- Customization UI: `/apps/web/src/pages/settings/ThemeCustomization.tsx`
- Backend API Spec: `/CGraph/BACKEND_API_SPECIFICATION.md`
- Implementation Roadmap: `/CGraph/THEME_SYSTEM_IMPLEMENTATION.md`

---

## 🆘 Troubleshooting

**Issue**: Theme doesn't persist after refresh **Solution**: Check localStorage, ensure zustand
persist middleware is configured correctly

**Issue**: Colors don't update in real-time **Solution**: Ensure CSS variables are being set in
App.tsx useEffect

**Issue**: Themed borders don't animate **Solution**: Check if framer-motion is imported, verify
animation props

**Issue**: Performance lag with particles **Solution**: Reduce particle count or use lazy loading

**Issue**: Themes clash in group chat **Solution**: Ensure each message uses sender's theme, not
receiver's

---

## ✅ Success Criteria

Your theme system is successfully implemented when:

1. ✅ Users can customize their theme in `/settings/theme`
2. ✅ Theme persists across sessions (localStorage)
3. ✅ Theme syncs with backend (when API ready)
4. ✅ Own messages show own theme
5. ✅ Others' messages show their themes
6. ✅ Avatars display with themed borders
7. ✅ Auth pages use user's theme
8. ✅ Navigation uses theme colors
9. ✅ Premium features are gated
10. ✅ Export/import works
11. ✅ Mobile responsive
12. ✅ No performance issues

---

**Ready to implement?** Start with Phase 1 (Messages) for immediate visual impact! 🚀

Each user's theme becomes their unique digital signature across CGraph. Let's make it happen!
