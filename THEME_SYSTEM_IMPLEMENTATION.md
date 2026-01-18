# Global Theme System Implementation Roadmap

## Overview
This document outlines the comprehensive implementation of a global theme system for CGraph that allows users to personalize their appearance across the entire application.

## ✅ Completed Components

### 1. Core Infrastructure
- ✅ **Global Theme Store** (`/apps/web/src/stores/themeStore.ts`)
  - Zustand-based state management with persistence
  - 12 color presets (emerald, purple, cyan, orange, pink, gold, crimson, arctic, sunset, midnight, forest, ocean)
  - Avatar border customization (10 types from static to mythic)
  - Chat bubble styling (8 presets)
  - Effect presets (6 types: glassmorphism, neon, holographic, minimal, aurora, cyberpunk)
  - Animation speed control
  - Export/import functionality
  - Server sync preparation

### 2. Themed Components
- ✅ **ThemedAvatar** (`/apps/web/src/components/theme/ThemedAvatar.tsx`)
  - Applies user's avatar border theme
  - Supports 10 border animation types
  - Particle effects for premium borders
  - Responsive sizing (small, medium, large, xlarge)
  - Displays other users' themes correctly

- ✅ **ThemedChatBubble** (`/apps/web/src/components/theme/ThemedChatBubble.tsx`)
  - Displays messages with user's chosen theme
  - 6 entrance animations (slide, fade, scale, bounce, flip)
  - Glass effect and shadow customization
  - Bubble tail support
  - Particle and holographic effects
  - Shows sender's theme (not changeable by receiver)

### 3. Theme Customization UI
- ✅ **ThemeCustomization Page** (`/apps/web/src/pages/settings/ThemeCustomization.tsx`)
  - Live preview panel
  - 4 tabs: Theme, Avatar, Chat Bubbles, Effects
  - Quick presets (minimal, modern, vibrant, elegant, gaming)
  - Export/Import theme functionality
  - Real-time preview updates

## 🚧 Required Implementation

### Phase 1: Backend API Integration
**Priority: HIGH** - Required for theme persistence

#### Files to Create/Update:
1. **Backend API Endpoints** (`apps/backend/lib/cgraph_web/controllers/user_theme_controller.ex`)
   ```elixir
   # GET /api/v1/users/:id/theme - Fetch user theme
   # PUT /api/v1/users/:id/theme - Update user theme
   # POST /api/v1/users/:id/theme/reset - Reset to default
   ```

2. **Database Migration** (`apps/backend/priv/repo/migrations/`)
   ```elixir
   # Add user_themes table or theme_preferences JSONB column to users table
   - user_id (references users)
   - theme_data (JSONB - stores entire UserTheme object)
   - created_at
   - updated_at
   ```

3. **Theme Context** (`apps/backend/lib/cgraph/user_themes.ex`)
   - CRUD operations for user themes
   - Validation logic
   - Default theme generation

4. **API Client** (`apps/web/src/lib/api.ts`)
   ```typescript
   export const themeApi = {
     getUserTheme: (userId: string) => api.get(`/users/${userId}/theme`),
     updateUserTheme: (userId: string, theme: UserTheme) =>
       api.put(`/users/${userId}/theme`, theme),
     resetUserTheme: (userId: string) =>
       api.post(`/users/${userId}/theme/reset`),
   };
   ```

### Phase 2: Message Components Integration
**Priority: HIGH** - Core user-facing feature

#### Files to Update:

1. **Conversation Component** (`apps/web/src/pages/messages/Conversation.tsx`)
   - Replace existing message bubbles with `ThemedChatBubble`
   - Fetch and store sender themes in message metadata
   - Apply correct theme per user

2. **EnhancedConversation** (`apps/web/src/pages/messages/EnhancedConversation.tsx`)
   - Same as above

3. **Group Channel** (`apps/web/src/pages/groups/GroupChannel.tsx`)
   - Apply themed chat bubbles in group conversations
   - Each member's messages show their personal theme

4. **Forum Post Comments** (`apps/web/src/pages/forums/ForumPost.tsx`)
   - Display user themes in comment sections
   - ThemedAvatar for commenter avatars

### Phase 3: Authentication Pages
**Priority: MEDIUM** - User onboarding experience

#### Files to Update:

1. **Login Page** (`apps/web/src/pages/auth/Login.tsx`)
   - Apply logged-in user's theme if cookie exists
   - Animated background based on theme
   - Theme-colored buttons and inputs

2. **Register Page** (`apps/web/src/pages/auth/Register.tsx`)
   - Default theme with animation
   - Preview of customization options

3. **Onboarding** (`apps/web/src/pages/auth/Onboarding.tsx`)
   - Add theme selection step
   - Quick preset chooser
   - Skip option with default theme

### Phase 4: Profile Pages
**Priority: HIGH** - User identity display

#### Files to Update:

1. **UserProfile** (`apps/web/src/pages/profile/UserProfile.tsx`)
   - Replace avatar with ThemedAvatar
   - Apply background effects from user theme
   - Animated profile cards
   - Display theme-colored badges and titles

2. **Profile Store** (`apps/web/src/stores/profileStore.ts`)
   - Include theme data in profile fetch
   - Cache theme per user

### Phase 5: Navigation & Layout
**Priority: MEDIUM** - Consistent experience

#### Files to Update:

1. **App Layout** (`apps/web/src/App.tsx`)
   - Load user theme on app initialization
   - Apply global CSS variables from theme
   - Sync theme with server on login

2. **Navigation Components**
   - Sidebar: Apply theme colors to active items
   - Header: Themed avatar in user menu
   - Mobile nav: Theme-colored highlights

### Phase 6: Settings Integration
**Priority: MEDIUM**

#### Files to Update:

1. **Settings Page** (`apps/web/src/pages/settings/Settings.tsx`)
   - Add "Theme Customization" link
   - Route to ThemeCustomization page

2. **Settings Store** (`apps/web/src/stores/settingsStore.ts`)
   - Include theme sync preferences
   - Auto-save toggle

### Phase 7: Premium Features
**Priority: LOW** - Monetization

#### Files to Create/Update:

1. **Premium Gate Component** (`apps/web/src/components/theme/PremiumThemeGate.tsx`)
   - Lock premium borders/effects behind paywall
   - Upgrade prompts

2. **Coin Shop Integration** (`apps/web/src/pages/premium/CoinShop.tsx`)
   - Add theme purchases
   - Themed border packs
   - Special effect unlocks

### Phase 8: Forum Integration
**Priority: MEDIUM**

#### Files to Update:

1. **Forum Post List** (`apps/web/src/pages/forums/Forums.tsx`)
   - ThemedAvatar for post authors
   - Theme-colored post titles for premium users

2. **Forum Board View** (`apps/web/src/pages/forums/ForumBoardView.tsx`)
   - Thread list with themed avatars
   - User theme preview on hover

3. **Create Post** (`apps/web/src/pages/forums/CreatePost.tsx`)
   - Preview how post will look with your theme

### Phase 9: Additional Pages

#### Files to Update:

1. **Friends Page** (`apps/web/src/pages/friends/Friends.tsx`)
   - ThemedAvatar for friend list
   - Theme preview in friend profiles

2. **Member List** (`apps/web/src/pages/members/MemberList.tsx`)
   - Themed avatars in member directory
   - Filter by theme color (fun feature)

3. **Leaderboard** (`apps/web/src/pages/leaderboard/LeaderboardPage.tsx`)
   - Themed avatars for top users
   - Animated effects for #1 position

4. **Notifications** (`apps/web/src/pages/notifications/Notifications.tsx`)
   - ThemedAvatar for notification senders
   - Theme-colored notification badges

## 📊 Implementation Statistics

### Total Files to Create: 8
- Backend API endpoints
- Database migration
- Theme context
- Premium gate component
- API client extensions

### Total Files to Update: 30+
- All message/chat components
- All profile components
- Authentication flow (3 files)
- Settings integration (2 files)
- Forum components (5 files)
- Navigation/layout (3 files)
- Member/social features (5+ files)

### Estimated Development Time
- **Phase 1 (Backend)**: 8-12 hours
- **Phase 2 (Messages)**: 6-8 hours
- **Phase 3 (Auth)**: 4-6 hours
- **Phase 4 (Profiles)**: 6-8 hours
- **Phase 5 (Layout)**: 4-6 hours
- **Phase 6 (Settings)**: 2-3 hours
- **Phase 7 (Premium)**: 4-6 hours
- **Phase 8 (Forums)**: 6-8 hours
- **Phase 9 (Additional)**: 8-10 hours

**Total**: 48-67 hours of development

## 🎨 Design Principles

### User Identity
- **Each user's theme is their digital identity**
- Theme follows user everywhere (chat, forums, profiles)
- Other users see your theme on your content
- Cannot change others' themes

### Performance
- Themes cached in localStorage (Zustand persistence)
- Server sync on login/changes only
- CSS variables for dynamic theming
- Lazy load premium effects

### Accessibility
- Maintain WCAG 2.1 AA contrast ratios
- Respect prefers-reduced-motion
- Provide "Simple Mode" toggle
- Alt text for all visual effects

### Premium Tiers
- **Free**: Basic borders, 4 color presets, simple effects
- **Starter**: 8 colors, rotating borders, glass effects
- **Pro**: All colors, animated borders (fire/ice/electric), particle effects
- **Business**: Legendary/Mythic borders, custom CSS, priority rendering

## 🔧 Technical Considerations

### State Management
```typescript
// Theme loads on app init from localStorage
// Syncs with server on user login
// Auto-saves to server on changes (debounced 2s)
// Fallback to default theme if sync fails
```

### CSS Architecture
```css
/* Global CSS variables set by theme */
:root {
  --theme-primary: #10b981;
  --theme-secondary: #34d399;
  --theme-glow: rgba(16, 185, 129, 0.5);
  /* ... */
}

/* Used throughout the app */
.button-primary {
  background: var(--theme-primary);
  box-shadow: 0 0 20px var(--theme-glow);
}
```

### Message Protocol
```typescript
// Messages include sender theme snapshot
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderTheme: {
    chatBubbleColor: ThemeColorPreset;
    chatBubbleStyle: ChatBubbleStylePreset;
    // ... minimal theme data for rendering
  };
  timestamp: string;
}
```

## 📝 Migration Strategy

### Existing Users
1. Generate default theme on first login post-deployment
2. Migrate existing chat bubble preferences to new theme system
3. Preserve avatar customizations
4. Email announcement with theme customization link

### New Users
1. Show theme picker during onboarding (Step 3 of 5)
2. Allow skip with "Emerald" default
3. Link to full customization in welcome email

## 🧪 Testing Checklist

- [ ] Theme persistence across sessions
- [ ] Server sync on login/logout
- [ ] Correct theme display for other users' content
- [ ] Premium features properly gated
- [ ] Export/import functionality
- [ ] Reset to default works
- [ ] Performance with 100+ messages with different themes
- [ ] Mobile responsiveness
- [ ] Dark mode compatibility
- [ ] Accessibility compliance

## 🚀 Deployment Plan

### Pre-deployment
1. Backend database migration
2. Deploy backend API endpoints
3. Test theme sync with staging data

### Deployment
1. Deploy backend changes
2. Run migration script
3. Deploy frontend with feature flag
4. Enable for 10% users (A/B test)
5. Monitor performance metrics
6. Gradual rollout to 100%

### Post-deployment
1. Monitor error rates
2. Collect user feedback
3. Track theme customization adoption
4. Analyze premium conversion rates

## 📚 Documentation Needs

### User Documentation
- [ ] Theme customization guide
- [ ] Video tutorial
- [ ] FAQ section
- [ ] Premium features comparison

### Developer Documentation
- [ ] Theme API reference
- [ ] Component usage examples
- [ ] Migration guide
- [ ] Performance best practices

---

## Next Steps

To continue implementation, we need to decide on the prioritized phases. I recommend:

**Week 1**: Phase 1 (Backend) + Phase 2 (Messages)
**Week 2**: Phase 3 (Auth) + Phase 4 (Profiles)
**Week 3**: Phase 5-7 (Layout, Settings, Premium)
**Week 4**: Phase 8-9 (Forums, Additional) + Testing

Would you like me to proceed with any specific phase, or shall I continue building out the core components?
