# CGraph Screens Documentation

**Version**: 0.9.4 **Last Updated**: January 20, 2026 **Total Pages**: 74 screens across Web
application

## Table of Contents

- [Overview](#overview)
- [Authentication Flows](#authentication-flows)
- [Main Application Screens](#main-application-screens)
- [Social Features](#social-features)
- [Forums System](#forums-system)
- [Groups & Channels](#groups--channels)
- [Messaging](#messaging)
- [Customization Hub](#customization-hub)
- [Gamification](#gamification)
- [Premium Features](#premium-features)
- [Settings](#settings)
- [Admin & Moderation](#admin--moderation)
- [Legal & Company](#legal--company)
- [Test & Demo Pages](#test--demo-pages)
- [Screen Flow Diagrams](#screen-flow-diagrams)

---

## Overview

CGraph features **74 distinct screens** organized into 15 categories. The application follows a
modern SPA (Single Page Application) architecture with React Router for navigation.

### Screen Categories

| Category       | Count | Status      | Description                                                  |
| -------------- | ----- | ----------- | ------------------------------------------------------------ |
| Authentication | 7     | ✅ Complete | Login, registration, OAuth, password recovery                |
| Main App       | 6     | ✅ Complete | Messages, social, forums, profile, customize, settings       |
| Forums         | 11    | ✅ Complete | Forum browsing, posting, moderation                          |
| Groups         | 2     | ✅ Complete | Server management, channel navigation                        |
| Messaging      | 3     | ✅ Complete | DMs, conversations, calls                                    |
| Customization  | 6     | 🟡 Partial  | Identity, themes, chat, effects (backend wiring in progress) |
| Gamification   | 5     | ✅ Complete | Achievements, quests, titles, leaderboard                    |
| Social         | 6     | ✅ Complete | Friends, notifications, search, members                      |
| Premium        | 2     | ✅ Complete | Premium features, coin shop                                  |
| Settings       | 9     | ✅ Complete | Account, security, notifications, privacy                    |
| Admin          | 1     | ✅ Complete | Admin dashboard                                              |
| Legal          | 4     | ✅ Complete | Terms, privacy, GDPR, cookies                                |
| Company        | 5     | ✅ Complete | About, careers, contact, press, status                       |
| Calendar       | 1     | ✅ Complete | Event calendar                                               |
| Test/Demo      | 6     | 🧪 Dev Only | Testing and demo pages                                       |

---

## Authentication Flows

### 1. Login (`/login`)

**File**: `apps/web/src/pages/auth/Login.tsx`

**Purpose**: Primary authentication entry point

**Features**:

- Email/password login
- OAuth buttons (Google, Apple, Facebook, TikTok)
- Ethereum wallet connection (MetaMask, WalletConnect)
- "Remember me" checkbox
- Link to registration and password recovery

**Flow**:

```
User enters credentials → Submit
  ├─ Success → Redirect to /messages (or stored redirect URL)
  ├─ 2FA Required → Redirect to 2FA verification
  └─ Failure → Show error message
```

**API Endpoints**:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/oauth/{provider}`
- `POST /api/v1/auth/wallet/challenge`
- `POST /api/v1/auth/wallet/verify`

---

### 2. Register (`/register`)

**File**: `apps/web/src/pages/auth/Register.tsx`

**Purpose**: New user account creation

**Features**:

- Username availability check (real-time)
- Email validation
- Password strength meter
- Checkbox for terms acceptance
- OAuth quick registration
- Wallet-based registration

**Validation**:

- Username: 3-20 characters, alphanumeric + underscore
- Email: Valid email format
- Password: Min 8 characters, 1 uppercase, 1 lowercase, 1 number

**Flow**:

```
User fills form → Submit → Email verification sent → Redirect to /verify-email
```

---

### 3. Email Verification (`/verify-email`)

**File**: `apps/web/src/pages/auth/VerifyEmail.tsx`

**Purpose**: Confirm user email address

**Features**:

- Auto-verification on page load (reads token from URL)
- Resend verification email button
- Countdown timer for resend (60 seconds)

**Flow**:

```
User clicks email link → Lands on /verify-email?token=xxx
  ├─ Valid token → Show success, redirect to /onboarding
  └─ Invalid/expired → Show error, offer resend
```

---

### 4. Onboarding (`/onboarding`)

**File**: `apps/web/src/pages/auth/Onboarding.tsx`

**Purpose**: First-time user setup wizard

**Steps**:

1. **Profile Setup**: Upload avatar, set display name, bio
2. **Interest Selection**: Choose topics (gaming, tech, art, etc.)
3. **Forum Recommendations**: Browse suggested forums based on interests
4. **Friend Suggestions**: Connect with users who share interests

**Flow**:

```
Step 1 → Step 2 → Step 3 → Step 4 → Complete → Redirect to /messages
```

**Skip Option**: Users can skip onboarding and complete later from settings

---

### 5. Forgot Password (`/forgot-password`)

**File**: `apps/web/src/pages/auth/ForgotPassword.tsx`

**Purpose**: Password reset request

**Features**:

- Email input
- Rate limiting (max 3 requests per hour)
- Success confirmation (without revealing if email exists)

---

### 6. Reset Password (`/reset-password`)

**File**: `apps/web/src/pages/auth/ResetPassword.tsx`

**Purpose**: Set new password after reset request

**Features**:

- Token validation (from email link)
- Password strength meter
- Confirm password field

---

### 7. OAuth Callback (`/auth/oauth/callback`)

**File**: `apps/web/src/pages/auth/OAuthCallback.tsx`

**Purpose**: Handle OAuth provider redirects

**Supported Providers**:

- Google (Sign in with Google)
- Apple (Sign in with Apple)
- Facebook (Facebook Login)
- TikTok (TikTok Login) - Backend ready, frontend button pending

**Flow**:

```
OAuth provider redirects → Parse auth code → Exchange for tokens
  ├─ New user → Create account, redirect to /onboarding
  └─ Existing user → Login, redirect to /messages
```

---

## Main Application Screens

### 8. Messages (`/messages`)

**File**: `apps/web/src/pages/messages/Messages.tsx`

**Purpose**: Central messaging hub (default landing page after login)

**Layout**:

```
┌────────────┬──────────────────────────────────────────┐
│ Sidebar    │  Main Content                            │
│            │                                           │
│ • Messages │  [No conversation selected state]        │
│ • Social   │  OR                                       │
│ • Forums   │  [Active conversation - see Conversation]│
│ • Customize│                                           │
│ • Profile  │                                           │
│ • Settings │                                           │
└────────────┴──────────────────────────────────────────┘
```

**Features**:

- Conversation list (left panel, 280px)
- Unread message badges
- Last message preview
- Online status indicators
- Search conversations
- "New Conversation" button

**State Management**: `chatStore` (Zustand)

---

### 9. Conversation View (`/messages/:conversationId`)

**File**: `apps/web/src/pages/messages/Conversation.tsx`

**Purpose**: One-on-one or group chat interface

**Features**:

- Infinite scroll message history
- Message composition with rich text
- File attachments (drag & drop)
- Emoji picker (with custom emojis)
- GIF picker integration
- Voice/video call buttons
- Message reactions
- Reply threading
- Read receipts
- Typing indicators

**Layout Components**:

- **Message List** (center, scrollable)
- **Message Input** (bottom, fixed)
- **User Info Panel** (right sidebar, 320px, collapsible - optional)

**Enhanced Conversation**: Alternative view (`EnhancedConversation.tsx`) with experimental features

---

### 10. Social Hub (`/social`)

**File**: `apps/web/src/pages/social/Social.tsx`

**Purpose**: Unified social features (friends, notifications, discovery)

**Tabs**:

1. **Friends** - Friend list, requests, suggestions
2. **Notifications** - Activity feed with filters
3. **Discover** - Trending content, user recommendations

**Features**:

- Global search bar (users, forums, groups, posts)
- Friend management (add, remove, block)
- Notification preferences
- Online status tracking

---

### 11. User Profile (`/user/:userId`)

**File**: `apps/web/src/pages/profile/UserProfile.tsx`

**Purpose**: Display user information and activity

**Sections**:

- **Header**: Avatar, banner, username, title, level
- **Stats Grid**: Karma, streak, posts, friends
- **Badge Showcase**: Top 5 equipped badges
- **Achievements**: Recent unlocks
- **Activity Feed**: Recent posts and comments
- **Mutual Connections**: Shared friends and forums

**Edit Mode** (own profile only):

- Toggle via "Edit Profile" button
- Inline editing for bio, avatar, banner
- Quick link to customization hub

**Actions** (other user's profile):

- Send Message
- Add Friend
- Block User
- Report User

---

### 12. Customize Hub (`/customize`)

**File**: `apps/web/src/pages/customize/Customize.tsx`

**Purpose**: Centralized personalization interface

**Layout**:

```
┌──────────┬─────────────────────┬──────────────┐
│ Category │  Customization      │ Live Preview │
│ Nav      │  Controls           │              │
│ (240px)  │  (Center)           │ (320px)      │
│          │                     │              │
│ Identity │  [Active Tab]       │ Profile Card │
│ Themes   │                     │ +            │
│ Chat     │  Options Grid       │ Message      │
│ Effects  │  +                  │ Bubbles      │
│ Progress │  Settings           │ +            │
│          │  +                  │ Effects      │
│          │  Save Button        │              │
└──────────┴─────────────────────┴──────────────┘
```

**Categories** (5 tabs): See [Customization Hub](#customization-hub) section below

---

### 13. Forums Homepage (`/forums`)

**File**: `apps/web/src/pages/forums/Forums.tsx`

**Purpose**: Browse and discover forums

**Features**:

- Forum categories with icons
- Forum descriptions and stats (threads, posts, members)
- "Create Forum" button (tier-restricted)
- Search forums
- Sort by: activity, members, alphabetical

**Forum Card Display**:

- Name + description
- Member count
- Thread count
- Last activity timestamp
- Join/Leave button

---

### 14. Settings (`/settings`)

**File**: `apps/web/src/pages/settings/Settings.tsx`

**Purpose**: Account configuration and preferences

**Sections** (9 total): See [Settings](#settings) section below

---

## Social Features

### 15. Friends List (`/friends`)

**File**: `apps/web/src/pages/friends/Friends.tsx`

**Purpose**: Manage friend connections

**Tabs**:

1. **All Friends** - Online status, mutual friends count
2. **Pending** - Incoming friend requests
3. **Blocked** - Blocked users management
4. **Suggestions** - Friend recommendations

**Features**:

- Search friends by username
- Filter by online status
- Quick message button
- View mutual friends
- Remove friend
- Block user

---

### 16. Notifications (`/notifications`)

**File**: `apps/web/src/pages/notifications/Notifications.tsx`

**Purpose**: Activity feed and alerts

**Notification Types**:

- Friend requests
- Mentions in posts/comments
- Replies to threads
- Achievements unlocked
- Level up notifications
- Event reminders
- System announcements

**Features**:

- Mark all as read
- Filter by type
- Clear all notifications
- Real-time updates (WebSocket)

---

### 17. Search (`/search`)

**File**: `apps/web/src/pages/search/Search.tsx`

**Purpose**: Global search interface

**Search Categories**:

- Users
- Forums
- Posts
- Groups
- Achievements

**Features**:

- Auto-complete suggestions
- Recent searches history
- Advanced filters (date range, category)
- Sort by relevance/date

---

### 18. Member List (`/members`)

**File**: `apps/web/src/pages/members/MemberList.tsx`

**Purpose**: Browse all registered users

**Features**:

- Pagination (50 users per page)
- Sort by: join date, karma, level
- Filter by: online status, role
- Avatar grid view

---

### 19. Who's Online (`/members/online`)

**File**: `apps/web/src/pages/members/WhosOnline.tsx`

**Purpose**: See currently active users

**Display**:

- Real-time online count
- User avatars with level badges
- Last seen timestamp
- Quick profile view

---

### 20. Referral Program (`/referrals`)

**File**: `apps/web/src/pages/referrals/ReferralPage.tsx`

**Purpose**: Referral system dashboard

**Features**:

- Personal referral code
- Share link (copy to clipboard)
- Referral stats (total referred, rewards earned)
- Referral leaderboard
- Reward tiers explanation

---

## Forums System

### 21. Forum Board View (`/forums/:forumId`)

**File**: `apps/web/src/pages/forums/ForumBoardView.tsx`

**Purpose**: View threads within a forum

**Features**:

- Thread list with pagination
- Thread sorting (hot, new, top, pinned)
- Thread filters (unanswered, solved, locked)
- "New Thread" button
- Forum info sidebar (description, rules, moderators)

**Thread Display**:

- Title + flair
- Author + avatar
- Reply count
- View count
- Last reply timestamp
- Vote score (karma)

---

### 22. Thread View (`/forums/:forumId/threads/:threadId`)

**File**: `apps/web/src/components/forums/ThreadView.tsx`

**Purpose**: View forum thread and replies

**Features**:

- Original post (OP) highlighting
- Nested replies (up to 5 levels)
- Upvote/downvote buttons
- Reply button (inline composer)
- Quote button
- Report button
- Edit/delete (own posts only)
- Moderator actions (pin, lock, move, delete)

**Post Components**:

- Author info (avatar, username, title, karma)
- Post content (Markdown rendered)
- Reactions (like, laugh, celebrate)
- Timestamp
- Edit history (if edited)

---

### 23. Create Forum (`/forums/create`)

**File**: `apps/web/src/pages/forums/CreateForum.tsx`

**Purpose**: Create new forum

**Form Fields**:

- Forum name
- Description
- Category
- Icon (emoji or upload)
- Visibility (public/private)
- Join approval (open/approval required)

**Tier Restrictions**:

- Free: 5 forums max
- Starter: 10 forums
- Pro: 50 forums
- Business: Unlimited

---

### 24. Create Post/Thread (`/forums/:forumId/create`)

**File**: `apps/web/src/pages/forums/CreatePost.tsx`

**Purpose**: Start new discussion thread

**Composer Features**:

- Rich text editor (Markdown)
- Title field
- Flair selection
- Tagging (optional)
- Preview mode
- File attachments
- Poll creation (optional)

---

### 25. Forum Settings (`/forums/:forumId/settings`)

**File**: `apps/web/src/pages/forums/ForumSettings.tsx`

**Purpose**: Configure forum (moderators/admins only)

**Tabs**:

1. **General** - Name, description, icon
2. **Permissions** - Who can post, comment, invite
3. **Moderation** - Auto-moderation rules, word filters
4. **Appearance** - Theme, colors, banner
5. **Rules** - Forum rules (displayed to members)

---

### 26. Forum Admin (`/forums/:forumId/admin`)

**File**: `apps/web/src/pages/forums/ForumAdmin.tsx`

**Purpose**: Advanced forum management

**Features**:

- Member management (roles, bans, mutes)
- Moderator assignment
- Audit log
- Analytics (posts per day, active users)
- Export data

---

### 27. Moderation Queue (`/forums/:forumId/moderation`)

**File**: `apps/web/src/pages/forums/ModerationQueue.tsx`

**Purpose**: Review flagged content

**Queue Items**:

- Reported posts
- Reported users
- Auto-flagged content (spam filters)
- Pending approval posts

**Actions**:

- Approve
- Remove
- Ban user
- Send warning

---

### 28. Forum Leaderboard (`/forums/:forumId/leaderboard`)

**File**: `apps/web/src/pages/forums/ForumLeaderboard.tsx`

**Purpose**: Top contributors in forum

**Leaderboards**:

- Top Posters (by post count)
- Most Helpful (by upvotes)
- Most Active (by recent activity)
- Rising Stars (new members gaining karma)

---

### 29. Plugin Marketplace (`/forums/:forumId/plugins`)

**File**: `apps/web/src/pages/forums/PluginMarketplace.tsx`

**Purpose**: Browse and install forum plugins

**Plugin Categories**:

- Moderation tools
- Gamification
- Integrations (CGraph, Slack, etc.)
- Custom themes
- Analytics

**Note**: Plugin system in development (v1.0.0 target)

---

### 30. Forum Post Detail (`/forums/:forumId/posts/:postId`)

**File**: `apps/web/src/pages/forums/ForumPost.tsx`

**Purpose**: Single post view (for direct links)

**Features**:

- Breadcrumb navigation
- Post content
- Comment section
- Related posts sidebar

---

## Groups & Channels

### 31. Groups Overview (`/groups`)

**File**: `apps/web/src/pages/groups/Groups.tsx`

**Purpose**: Browse and manage servers

**Display**:

- Server icons (grid view)
- Server names + member count
- "Create Server" button
- Joined servers highlighted

**Features**:

- Search servers
- Public server discovery
- Invitations pending

---

### 32. Group Channel View (`/groups/:groupId/:channelId`)

**File**: `apps/web/src/pages/groups/GroupChannel.tsx`

**Purpose**: Channel-based messaging within server

**Layout**:

```
┌─────────────┬─────────────────────┬────────────┐
│ Server List │  Channel Content    │ Member List│
│ (70px)      │  (Center)           │ (240px)    │
│             │                     │            │
│ [Server 1]  │  #general           │ Online (5) │
│ [Server 2]  │                     │ User 1     │
│ [Server 3]  │  Messages           │ User 2     │
│             │  +                  │            │
│ + Add       │  Input Box          │ Offline(2) │
│             │                     │ User 3     │
└─────────────┴─────────────────────┴────────────┘
```

**Channel Types**:

- Text channels (#general, #random)
- Voice channels (🔊 voice-chat)
- Announcement channels (📢 announcements)

---

## Messaging

### 33. Messages List

Covered in [Messages (#8)](#8-messages-messages)

### 34. Conversation

Covered in [Conversation View (#9)](#9-conversation-view-messagesconversationid)

### 35. Enhanced Conversation (`/messages/:conversationId/enhanced`)

**File**: `apps/web/src/pages/messages/EnhancedConversation.tsx`

**Purpose**: Experimental conversation view with advanced features

**Extra Features**:

- Message translations
- Message summarization
- Smart replies (AI-suggested)
- Advanced search within conversation
- Message bookmarks

**Status**: 🧪 Experimental (not enabled by default)

---

### 36. Call Screen (`/calls/:callId`)

**File**: `apps/web/src/pages/calls/CallScreen.tsx`

**Purpose**: Voice/video call interface

**Features**:

- Local video preview
- Remote video streams
- Audio controls (mute, unmute)
- Video controls (camera on/off)
- Screen share
- Call stats (latency, bitrate)
- Participant list (for group calls)

**WebRTC Integration**: Using Simple-peer library

---

## Customization Hub

### 37. Customize Main (`/customize`)

Covered in [Customize Hub (#12)](#12-customize-hub-customize)

### 38. Identity Customization (`/customize/identity`)

**File**: `apps/web/src/pages/customize/IdentityCustomization.tsx`

**Purpose**: Personalize user identity elements

**Options**:

**Avatar Borders** (150+ options):

- Rarity tiers: Common, Rare, Epic, Legendary, Mythic
- Animated borders (particles, glow effects)
- Seasonal/event exclusives
- Preview with live animation

**Titles** (25+ options):

- Animated text effects (glow, wave, rainbow)
- Unlock conditions (level, achievements, premium)
- Equip/unequip

**Badges** (Showcase):

- Equip up to 5 badges
- Drag to reorder
- Badge rarity indicators
- Unlock status

**Profile Card Layouts** (7 styles):

- Classic
- Compact
- Expanded
- Gaming
- Minimalist
- Card
- Terminal

**Backend Status**: 🟡 UI complete, backend integration in progress (Phase 2)

---

### 39. Theme Customization (`/customize/themes`)

**File**: `apps/web/src/pages/customize/ThemeCustomization.tsx`

**Purpose**: Customize visual themes

**Theme Types**:

**1. Profile Themes** (20 presets):

- Purple Haze
- Ocean Blue
- Forest Green
- Sunset Orange
- Midnight Black
- Custom (RGB picker)

**2. Chat Themes** (6 presets):

- Default
- Dark
- High Contrast
- Synthwave
- Terminal
- Pastel

**3. Forum Themes** (10 presets, admin only):

- Classic
- Modern
- Compact
- Gaming
- Business
- Custom CSS (premium)

**4. App Theme**:

- Dark/Light mode toggle
- Accent color picker
- Font size adjustment

**Backend Status**: 🟡 Selection works, CSS application in progress (Phase 2)

---

### 40. Chat Customization (`/customize/chat`)

**File**: `apps/web/src/pages/customize/ChatCustomization.tsx`

**Purpose**: Personalize chat message appearance

**Options**:

**Message Bubbles** (50+ styles from chatBubbleStore):

- Shapes: Round, Square, Pill, Speech Bubble
- Colors: Solid, Gradient, Glassmorphic
- Borders: None, Thin, Thick, Glow
- Shadows: None, Light, Heavy, Neon

**Message Effects** (30+ effects):

- Entrance animations (fade, slide, bounce)
- Hover effects
- Send animations (confetti, particles)

**Typing Indicators** (8 styles):

- Dots (classic)
- Pulse
- Wave
- Bounce
- Fade
- Spinner
- Bars
- Custom

**Reaction Styles**:

- Emoji size
- Animation on react
- Position (below/inline)

**Backend Status**: 🟡 UI complete, message styling integration in progress (Phase 2)

---

### 41. Effects Customization (`/customize/effects`)

**File**: `apps/web/src/pages/customize/EffectsCustomization.tsx`

**Purpose**: Add visual flair and animations

**Options**:

**Border Particles** (16 types):

- None
- Sparkles
- Stars
- Hearts
- Snow
- Rain
- Fireflies
- Bubbles
- Flames
- Lightning
- Matrix
- Binary
- Leaves
- Sakura
- Confetti
- Custom

**Profile Backgrounds**:

- Static color/gradient
- Animated gradient
- Particle systems
- Video backgrounds (premium)
- Custom upload

**Entrance Animations**:

- None
- Fade In
- Slide Up
- Scale
- Bounce
- Flip
- Zoom
- Rotate

**Animation Intensity** (slider):

- Off
- Subtle
- Normal
- Energetic
- Maximum

**Backend Status**: 🟡 Demos work, global application in progress (Phase 2)

---

### 42. Progression Customization (`/customize/progression`)

**File**: `apps/web/src/pages/customize/ProgressionCustomization.tsx`

**Purpose**: View and manage gamification progress

**Sections**:

**Level & XP**:

- Current level display
- XP progress bar
- XP multiplier (premium)
- Next level requirements

**Achievements**:

- All achievements grid
- Completion percentage
- Recent unlocks
- Categories (social, forum, messaging, gaming)

**Leaderboards** (moved from main nav):

- Global leaderboard
- Forum-specific leaderboards
- Friend leaderboard
- Category leaders

**Quests**:

- Daily quests (3 per day)
- Weekly quests
- Monthly challenges
- Event quests
- Quest rewards

**Prestige System**:

- Prestige level
- Prestige points
- Prestige shop (exclusive items)
- Prestige benefits

**Backend Status**: ✅ Fully functional with real data

---

## Gamification

### 43. Achievements Page (`/gamification/achievements`)

**File**: `apps/web/src/pages/gamification/AchievementsPage.tsx`

**Purpose**: Browse all achievements

**Categories**:

- Social (add friends, join groups)
- Forum (create threads, earn karma)
- Messaging (send messages, voice calls)
- Gaming (play games, win matches)
- Special (seasonal, event-exclusive)

**Achievement Display**:

- Icon + name
- Description
- Unlock condition
- Rarity (common, rare, epic, legendary)
- Unlock date (if completed)
- Progress bar (if in progress)

**Filters**:

- Show unlocked only
- Show locked only
- Sort by rarity/date

---

### 44. Quests Page (`/gamification/quests`)

**File**: `apps/web/src/pages/gamification/QuestsPage.tsx`

**Purpose**: View and track quests

**Quest Types**:

- **Daily** - Reset every 24 hours
- **Weekly** - Reset every Monday
- **Monthly** - Reset first of month
- **Event** - Time-limited special quests

**Quest Display**:

- Title + icon
- Description
- Progress bar
- Rewards (XP, coins, items)
- Time remaining
- Claim button (if complete)

---

### 45. Titles Page (`/gamification/titles`)

**File**: `apps/web/src/pages/gamification/TitlesPage.tsx`

**Purpose**: Browse and equip titles

**Title Display**:

- Title text with animation preview
- Unlock condition
- Rarity
- "Equip" button

**Equipped Title**: Shown below username throughout app

---

### 46. Gamification Hub (`/gamification`)

**File**: `apps/web/src/pages/gamification/GamificationHubPage.tsx`

**Purpose**: Central gamification dashboard

**Widgets**:

- Level progress
- Daily quest tracker
- Recent achievements
- Leaderboard preview
- Quest completion streak
- XP earned today

**Note**: Redirects to `/customize/progression` in new navigation

---

### 47. Leaderboard (`/leaderboard`)

**File**: `apps/web/src/pages/leaderboard/LeaderboardPage.tsx`

**Purpose**: Global ranking system

**Leaderboard Types**:

- **Global Karma** - Top 100 users by karma score
- **Forum Activity** - Most active forum posters
- **Level** - Highest levels
- **Achievements** - Most achievements unlocked
- **Referrals** - Most referrals
- **Event** - Seasonal event rankings

**Display**:

- Rank number
- User avatar + username
- Score/stat
- Change from yesterday (▲▼)
- "View Profile" button

---

### 48. User Leaderboard (`/community/leaderboard`)

**File**: `apps/web/src/pages/community/UserLeaderboard.tsx`

**Purpose**: Community leaderboard variant

**Features**:

- Filter by timeframe (today, week, month, all-time)
- Category selection
- Your rank highlight
- Top 3 podium display

---

## Premium Features

### 49. Premium Page (`/premium`)

**File**: `apps/web/src/pages/premium/PremiumPage.tsx`

**Purpose**: Premium subscription information and purchase

**Tiers**:

**Free**:

- 5 forums max
- 5 groups max
- Basic customization
- Standard support

**Starter** ($4.99/month):

- 10 forums
- 10 groups
- Enhanced customization
- 1.2x XP multiplier

**Pro** ($9.99/month):

- 50 forums
- 50 groups
- Full customization
- 1.5x XP multiplier
- Priority support
- Custom profile themes

**Business** ($19.99/month):

- Unlimited forums
- Unlimited groups
- All premium features
- 2.0x XP multiplier
- Dedicated support
- API access

**Features**:

- Tier comparison table
- Payment options (Stripe, PayPal, crypto)
- Trial period (7 days)
- Upgrade/downgrade options

---

### 50. Coin Shop (`/premium/shop`)

**File**: `apps/web/src/pages/premium/CoinShop.tsx`

**Purpose**: Purchase virtual coins for cosmetics

**Products**:

- Coin bundles (100, 500, 1000, 5000, 10000)
- Bonus coins for larger purchases
- Payment methods (card, PayPal)

**Uses for Coins**:

- Cosmetic items (avatar borders, badges)
- Boost posts (increase visibility)
- Gift premium to friends
- Event battle passes

---

## Settings

### 51. Settings Main (`/settings`)

**File**: `apps/web/src/pages/settings/Settings.tsx`

**Purpose**: Account configuration hub

**Sections** (9 categories):

**1. Account**:

- Display name
- Username
- Email
- Avatar upload
- Bio
- Delete account

**2. Security**:

- Change password
- Two-factor authentication
- Active sessions
- Login history
- API tokens

**3. Notifications**:

- Push notifications
- Email notifications
- Notification sounds
- Do Not Disturb mode
- Notification filters

**4. Privacy**:

- Profile visibility
- Who can message you
- Who can add you as friend
- Activity status
- Data sharing preferences

**5. Appearance**:

- Theme (dark/light/auto)
- Accent color
- Font size
- Compact mode
- Animations toggle

**6. Language**:

- Interface language
- Date format
- Time format
- Timezone

**7. Blocked Users**:

- List of blocked users
- Unblock button
- Block reason

**8. Email Preferences**:

- Daily digest
- Weekly summary
- Marketing emails
- Security alerts

**9. Billing** (Premium only):

- Current plan
- Payment method
- Billing history
- Cancel subscription

---

### 52. App Theme Settings (`/settings/appearance`)

**File**: `apps/web/src/pages/settings/AppThemeSettings.tsx`

**Purpose**: Application-wide theme settings

**Options**:

- Dark/light/auto mode
- Accent color picker
- Font family (3 options)
- Font size (small, medium, large)
- Reduce animations
- High contrast mode

---

### 53. Badge Selection (`/settings/badges`)

**File**: `apps/web/src/pages/settings/BadgeSelection.tsx`

**Purpose**: Manage equipped badges

**Features**:

- All unlocked badges
- Equip up to 5
- Drag to reorder
- Show on profile toggle

**Note**: Functionality moved to `/customize/identity`

---

### 54. Title Selection (`/settings/titles`)

**File**: `apps/web/src/pages/settings/TitleSelection.tsx`

**Purpose**: Select active title

**Features**:

- All unlocked titles
- Preview with animation
- Equip button
- "None" option

**Note**: Functionality moved to `/customize/identity`

---

### 55. Theme Customization (Settings) (`/settings/themes`)

**File**: `apps/web/src/pages/settings/ThemeCustomization.tsx`

**Purpose**: Duplicate theme customization (legacy)

**Status**: 🔴 Marked for removal - functionality moved to `/customize/themes`

---

### 56. Blocked Users (`/settings/blocked`)

**File**: `apps/web/src/pages/settings/BlockedUsers.tsx`

**Purpose**: Manage blocked users list

**Features**:

- User avatar + username
- Block date
- Block reason
- Unblock button
- Search blocked users

---

### 57. Email Notification Settings (`/settings/notifications/email`)

**File**: `apps/web/src/pages/settings/EmailNotificationSettings.tsx`

**Purpose**: Configure email notification preferences

**Options**:

- New messages
- Friend requests
- Mentions
- Replies to posts
- Achievements
- Weekly digest
- Marketing emails

**Frequency**:

- Instant
- Daily
- Weekly
- Never

---

### 58. Two-Factor Authentication (`/settings/security/2fa`)

**File**: `apps/web/src/pages/settings/TwoFactorSetup.tsx`

**Purpose**: Enable/disable 2FA

**Methods**:

- Authenticator app (TOTP)
- SMS (optional)
- Backup codes

**Setup Flow**:

1. Scan QR code with authenticator app
2. Enter verification code
3. Save backup codes
4. 2FA enabled

---

## Admin & Moderation

### 59. Admin Dashboard (`/admin`)

**File**: `apps/web/src/pages/admin/AdminDashboard.tsx`

**Purpose**: Site-wide administration panel

**Access**: Admin role required

**Sections**:

**Overview**:

- User count (total, active today, new this week)
- Post count
- Forum count
- Server health metrics

**User Management**:

- Search users
- Ban/unban users
- Assign roles
- View user reports

**Content Moderation**:

- Flagged posts queue
- User reports
- Auto-mod rules
- Word filters

**System Settings**:

- Site-wide announcements
- Feature flags
- Maintenance mode
- Backup/restore

**Analytics**:

- User growth chart
- Activity heatmap
- Popular forums
- Traffic sources

---

## Legal & Company

### 60. Terms of Service (`/legal/terms`)

**File**: `apps/web/src/pages/legal/TermsOfService.tsx`

**Purpose**: Legal terms and conditions

**Sections**:

- Acceptance of terms
- User responsibilities
- Prohibited conduct
- Intellectual property
- Termination
- Disclaimer
- Governing law

---

### 61. Privacy Policy (`/legal/privacy`)

**File**: `apps/web/src/pages/legal/PrivacyPolicy.tsx`

**Purpose**: Data collection and privacy practices

**Sections**:

- Information collected
- How data is used
- Data sharing
- Cookies
- User rights
- Data retention
- Contact information

---

### 62. Cookie Policy (`/legal/cookies`)

**File**: `apps/web/src/pages/legal/CookiePolicy.tsx`

**Purpose**: Cookie usage disclosure

**Cookie Types**:

- Essential (authentication, session)
- Functional (preferences, settings)
- Analytics (usage tracking)
- Advertising (none - we don't use)

---

### 63. GDPR Compliance (`/legal/gdpr`)

**File**: `apps/web/src/pages/legal/GDPR.tsx`

**Purpose**: GDPR rights and data requests

**Features**:

- Data export request
- Data deletion request (right to be forgotten)
- Data portability
- Withdraw consent

---

### 64. About Page (`/company/about`)

**File**: `apps/web/src/pages/company/About.tsx`

**Purpose**: Company information and mission

**Content**:

- Mission statement
- Team members
- Company values
- Technology stack
- Open source info

---

### 65. Careers (`/company/careers`)

**File**: `apps/web/src/pages/company/Careers.tsx`

**Purpose**: Job openings and hiring

**Sections**:

- Open positions
- Company culture
- Benefits
- Application form

---

### 66. Contact (`/company/contact`)

**File**: `apps/web/src/pages/company/Contact.tsx`

**Purpose**: Contact information and support

**Contact Methods**:

- Email: support@cgraph.org
- CGraph server link
- Social/X
- GitHub issues
- Contact form

---

### 67. Press Kit (`/company/press`)

**File**: `apps/web/src/pages/company/Press.tsx`

**Purpose**: Media resources and press releases

**Assets**:

- Logo downloads (SVG, PNG)
- Brand guidelines
- Press releases
- Screenshots
- Media contact

---

### 68. Status Page (`/company/status`)

**File**: `apps/web/src/pages/company/Status.tsx`

**Purpose**: Service status and uptime

**Status Indicators**:

- API (operational, degraded, down)
- WebSocket (operational, degraded, down)
- Database (operational, degraded, down)
- File storage (operational, degraded, down)

**Incidents**:

- Current incidents
- Incident history
- Scheduled maintenance

---

## Calendar

### 69. Calendar Page (`/calendar`)

**File**: `apps/web/src/pages/calendar/CalendarPage.tsx`

**Purpose**: Event calendar and scheduling

**Features**:

- Month/week/day views
- Create events
- RSVP to events
- Event reminders
- Export to Google Calendar / iCal

**Event Types**:

- Community events
- Gaming sessions
- Meetups
- Seasonal events

---

## Test & Demo Pages

### 70. Landing Page (GSAP) (`/`)

**File**: `apps/web/src/pages/LandingPageGSAP.tsx`

**Purpose**: Main landing page with animations (production)

**Features**:

- Hero section with GSAP animations
- Feature showcase
- Pricing cards
- Testimonials
- CTA buttons (Sign Up, Login)

**Status**: ✅ Active landing page

---

### 71. Landing Page (Legacy) (`/landing-legacy`)

**File**: `apps/web/src/pages/LandingPage.tsx`

**Status**: 🔴 Deprecated - kept for reference

---

### 72. Landing Page Enhanced (`/landing-enhanced`)

**File**: `apps/web/src/pages/LandingPageEnhanced.tsx`

**Status**: 🔴 Deprecated - kept for reference

---

### 73. Landing Page Optimized (`/landing-optimized`)

**File**: `apps/web/src/pages/LandingPageOptimized.tsx`

**Status**: 🔴 Deprecated - kept for reference

---

### 74. Landing Page Ultimate (`/landing-ultimate`)

**File**: `apps/web/src/pages/LandingPageUltimate.tsx`

**Status**: 🔴 Deprecated - kept for reference

---

### 75. Landing Demo (`/demo`)

**File**: `apps/web/src/pages/demo/LandingDemo.tsx`

**Purpose**: Interactive feature demos

**Status**: 🧪 Development only

---

### 76. Enhanced Demo (`/test/demo`)

**File**: `apps/web/src/pages/test/EnhancedDemo.tsx`

**Purpose**: Component playground

**Status**: 🧪 Development only

---

### 77. Matrix Test (`/test/matrix`)

**File**: `apps/web/src/pages/test/MatrixTest.tsx`

**Purpose**: Test Matrix rain background effect

**Status**: 🧪 Development only

---

### 78. Theme Application Test (`/test/theme`)

**File**: `apps/web/src/pages/test/ThemeApplicationTest.tsx`

**Purpose**: Test theme application system

**Status**: 🧪 Development only

---

### 79. Not Found (`/404` or any invalid route)

**File**: `apps/web/src/pages/NotFound.tsx`

**Purpose**: 404 error page

**Features**:

- Friendly 404 message
- Search bar
- Links to home, forums, messages
- Random funny image/GIF

---

## Screen Flow Diagrams

### New User Journey

```
Landing Page
    ├─> Register
    │     └─> Verify Email
    │           └─> Onboarding (4 steps)
    │                 └─> Messages (default landing)
    │
    └─> Login
          ├─> 2FA (if enabled)
          └─> Messages
```

### Main Navigation Flow

```
Messages (Default Home)
    ├─> Conversation View
    │     ├─> Call Screen
    │     └─> User Profile
    │
    ├─> Social Hub
    │     ├─> Friends
    │     ├─> Notifications
    │     └─> Search
    │
    ├─> Forums
    │     ├─> Forum Board View
    │     │     └─> Thread View
    │     │           └─> User Profile
    │     │
    │     ├─> Create Forum
    │     └─> Forum Settings
    │
    ├─> Groups
    │     └─> Group Channel
    │           └─> Call Screen
    │
    ├─> Customize
    │     ├─> Identity
    │     ├─> Themes
    │     ├─> Chat
    │     ├─> Effects
    │     └─> Progression
    │
    ├─> Profile
    │     └─> [Your profile page]
    │
    └─> Settings
          └─> [9 settings sections]
```

### Gamification Flow

```
Messages
    └─> Actions (post, friend, level up)
          └─> Unlock Achievement
                ├─> Notification
                └─> Level Progress
                      └─> Unlock Title
                            └─> Customize > Progression
                                  └─> View Leaderboard
```

---

## Mobile Application Screens

**Note**: Mobile app (`apps/mobile`) has similar screens but optimized for mobile layout. See mobile
documentation for details.

---

## Component Documentation

For component-level documentation, see:

- [Component Library](../packages/ui/README.md)
- [Storybook](http://localhost:6006) (when running `pnpm storybook`)

---

## API Endpoints

For API documentation, see:

- [API Reference](./api/README.md)
- [OpenAPI Spec](./api/openapi.yaml)

---

## Navigation Changes (v0.9.4)

**Simplified from 9 to 6 main tabs**:

| Old Navigation | New Navigation          | Change                   |
| -------------- | ----------------------- | ------------------------ |
| Messages       | Messages                | ✅ Kept                  |
| Friends        | Social (tab 1)          | 🔀 Consolidated          |
| Notifications  | Social (tab 2)          | 🔀 Consolidated          |
| Search         | Social (search bar)     | 🔀 Consolidated          |
| Forums         | Forums                  | ✅ Kept                  |
| Groups         | Groups                  | ✅ Kept                  |
| Leaderboard    | Customize > Progression | 🔀 Moved                 |
| Gamification   | Customize > Progression | 🔀 Moved                 |
| Profile        | Profile                 | ✅ Kept (now quick link) |
| Settings       | Settings                | ✅ Kept                  |
| **NEW**        | **Customize**           | ✨ **Added**             |

---

## Status Legend

- ✅ **Complete** - Fully implemented and functional
- 🟡 **Partial** - UI complete, backend integration in progress
- 🔴 **Deprecated** - Marked for removal
- 🧪 **Dev Only** - Not available in production
- ⏳ **Planned** - Scheduled for future release

---

## Statistics Summary

- **Total Screens**: 74
- **Authentication**: 7 screens
- **Main App**: 6 core screens
- **Forums**: 11 screens
- **Social**: 6 screens
- **Customization**: 6 screens
- **Gamification**: 5 screens
- **Premium**: 2 screens
- **Settings**: 9 screens
- **Legal**: 4 screens
- **Test/Demo**: 6 screens

**Production-Ready**: 68 screens (92%) **In Development**: 6 screens (8%)

---

**Last Reviewed**: January 20, 2026 **Next Review**: After Phase 2 customization backend completion
**Maintained by**: Development team
