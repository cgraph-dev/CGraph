# CGraph Development Session - Comprehensive Updates

This document details all the changes, enhancements, and bug fixes made during the development session.

## Table of Contents
1. [Bug Fixes](#bug-fixes)
2. [New Features](#new-features)
3. [UI/UX Improvements](#uiux-improvements)
4. [Architecture Changes](#architecture-changes)
5. [Component Library](#component-library)

---

## Bug Fixes

### Critical Fixes

#### 1. Private Forum Access Control
**Problem:** Private forums were accessible to non-members.
**Solution:** Added membership verification in `ForumController.show/2` and `authorize_action/3`.
**Files Changed:**
- `apps/backend/lib/cgraph/forums.ex`
- `apps/backend/lib/cgraph_web/controllers/api/v1/forum_controller.ex`

#### 2. Mobile API Paths
**Problem:** Mobile app API calls were missing the `/api/v1/` prefix.
**Solution:** Updated all API endpoints in mobile screens.
**Files Changed:**
- `apps/mobile/src/screens/forums/PostScreen.tsx`
- `apps/mobile/src/screens/forums/CreatePostScreen.tsx`

### High Priority Fixes

#### 3. isSubscribed Always False
**Problem:** Forum subscription status was not being populated from database.
**Solution:** Added `is_forum_subscribed/2` function and enriched API responses.
**Files Changed:**
- `apps/backend/lib/cgraph/forums.ex`
- `apps/backend/lib/cgraph_web/controllers/api/v1/forum_json.ex`

#### 4. isOwner Check Bug
**Problem:** `isOwner` was checking truthy value instead of comparing IDs.
**Solution:** Fixed comparison: `currentForum.ownerId === user?.id`
**Files Changed:**
- `apps/web/src/pages/forums/ForumBoardView.tsx`

#### 5. Vote Removal Wrong Field
**Problem:** `remove_vote/2` was using `vote_type` instead of `value`.
**Solution:** Corrected field name to `value`.
**Files Changed:**
- `apps/backend/lib/cgraph/forums.ex`

#### 6. Forum Lookup by Slug
**Problem:** Forum 404 errors when accessed by slug instead of UUID.
**Solution:** Backend now handles both UUID and slug lookups.
**Files Changed:**
- `apps/backend/lib/cgraph_web/controllers/api/v1/forum_controller.ex`

### Medium Priority Fixes

#### 7. toLocaleString Null Access
**Problem:** Crashes when calling `toLocaleString()` on undefined values.
**Solution:** Added null coalescing: `(value ?? 0).toLocaleString()`
**Files Changed:**
- Multiple forum component files

---

## New Features

### Forum Privacy Controls

#### Public/Private Forums
Users can now create forums with privacy settings:
- **Public forums:** Visible to all, anyone can view posts
- **Private forums:** Only members can view content

**API Fields Added:**
- `is_public: boolean` - Forum visibility
- `is_member: boolean` - Current user's membership status
- `is_subscribed: boolean` - Current user's subscription status
- `owner_id: string` - Forum owner's user ID

### Forum Settings Page
New settings page for forum owners at `/forums/:slug/settings`:
- Toggle forum privacy (public/private)
- Toggle NSFW content
- Edit forum name and description
- Delete forum with confirmation

**Files Created:**
- `apps/web/src/pages/forums/ForumSettings.tsx`

### Markdown Support

#### MarkdownRenderer Component
Renders markdown content with GitHub Flavored Markdown support:
- Headers (h1-h6)
- Bold, italic, strikethrough
- Code blocks with syntax classes
- Links (external open in new tab)
- Images
- Lists (ordered, unordered, task lists)
- Tables
- Blockquotes

**File:** `apps/web/src/components/MarkdownRenderer.tsx`

#### MarkdownEditor Component
Rich markdown editor with toolbar:
- Bold, Italic, Code buttons
- Link and Image insertion
- Ordered/Unordered list helpers
- Write/Preview toggle
- Character insertion helpers

**File:** `apps/web/src/components/MarkdownEditor.tsx`

### Post Creation Page
New dedicated page for creating posts at `/forums/:slug/create-post`:
- Post type selection (Text, Image, Link)
- Rich markdown editing for text posts
- Forum validation
- Membership requirement check

**File:** `apps/web/src/pages/forums/CreatePost.tsx`

---

## UI/UX Improvements

### Animation System
Enhanced Tailwind animation configuration:
- `fade-in-up` - Elements fade in while sliding up
- `slide-in-right` - Slide in from left
- `bounce-in` - Playful bounce entrance
- `shimmer` - Loading placeholder effect
- `glow` - Pulsing glow effect

### Shadow System
New box-shadow utilities:
- `shadow-glow-sm/md/lg` - Glowing shadows
- `shadow-card` - Subtle card elevation
- `shadow-card-hover` - Enhanced hover state

### Skeleton Loading States
Replaced spinner loading with content-aware skeletons:
- `PostCardSkeleton` - Matches post card layout
- `ForumCardSkeleton` - Matches forum card layout
- `CommentSkeleton` - Matches comment layout

**File:** `apps/web/src/components/ui/Skeleton.tsx`

### Post Cards
- Added subtle hover animations
- Smooth shadow transitions
- Fade-in animation on load

### CSS Utilities
New utility classes in `index.css`:
- `.card-interactive` - Card with hover lift effect
- `.stagger-animation` - Staggered child animations
- `.text-gradient` - Gradient text effect
- `.glass` - Glassmorphism backdrop blur
- `.markdown-content *` - Markdown element styling

---

## Architecture Changes

### Backend Forum Functions

#### New Functions in `forums.ex`:
```elixir
# Check if user is a forum member
is_forum_member(forum_id, user_id)

# Check if user is subscribed
is_forum_subscribed(forum_id, user_id)

# Authorize forum actions
authorize_action(:manage, forum, user)  # For owners only
```

#### Updated Functions:
```elixir
# Now creates membership when subscribing
subscribe_to_forum(forum_id, user_id)

# Now removes membership when unsubscribing  
unsubscribe_from_forum(forum_id, user_id)

# Includes membership status in results
list_forums_for_user(user_id)
```

### Store Updates

#### forumStore.ts
Added new functions:
```typescript
updateForum(forumId: string, data: UpdateForumData): Promise<void>
deleteForum(forumId: string): Promise<void>
```

New interface:
```typescript
interface UpdateForumData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  isNsfw?: boolean;
}
```

---

## Component Library

### New UI Components

All in `apps/web/src/components/ui/`:

#### Card (`Card.tsx`)
```tsx
<Card variant="default|interactive|elevated" padding="none|sm|md|lg" animate>
  <CardHeader>...</CardHeader>
  <CardTitle as="h1|h2|h3|h4">...</CardTitle>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

#### Badge (`Badge.tsx`)
```tsx
<Badge variant="default|primary|success|warning|danger|info" size="sm|md|lg" dot icon={...}>
  Label
</Badge>

// Presets:
<NewBadge /> <HotBadge /> <NsfwBadge /> <PinnedBadge />
<PrivateBadge /> <PublicBadge /> <OwnerBadge /> <ModeratorBadge />
<MemberBadge /> <CountBadge count={1234} />
```

#### Button (`Button.tsx`)
```tsx
<Button 
  variant="primary|secondary|ghost|danger|success|outline"
  size="sm|md|lg|icon"
  loading
  icon={<Icon />}
  iconPosition="left|right"
  fullWidth
>
  Click me
</Button>

<IconButton icon={<Icon />} variant="ghost" size="md" tooltip="Hint" />
```

#### Avatar (`Avatar.tsx`)
```tsx
<Avatar 
  src="/path/to/image.jpg"
  name="John Doe"
  size="xs|sm|md|lg|xl"
  status="online|offline|away|busy"
  badge={<NotificationDot />}
/>

<AvatarGroup max={5}>
  <Avatar name="User 1" />
  <Avatar name="User 2" />
  {/* Shows +N for overflow */}
</AvatarGroup>
```

#### Skeleton (`Skeleton.tsx`)
```tsx
<Skeleton variant="text|circular|rectangular" width={100} height={20} lines={3} />

<PostCardSkeleton />
<ForumCardSkeleton />
<CommentSkeleton depth={0} />
```

### Component Exports
All components exported from:
- `apps/web/src/components/index.ts`
- `apps/web/src/components/ui/index.ts`

---

## Dependencies Added

### Web (`apps/web/package.json`)
```json
{
  "react-markdown": "^9.x",
  "remark-gfm": "^4.x"
}
```

---

## File Changes Summary

### Files Created
| Path | Description |
|------|-------------|
| `apps/web/src/pages/forums/CreatePost.tsx` | New post creation page |
| `apps/web/src/pages/forums/ForumSettings.tsx` | Forum settings page |
| `apps/web/src/components/MarkdownRenderer.tsx` | Markdown display |
| `apps/web/src/components/MarkdownEditor.tsx` | Markdown editing |
| `apps/web/src/components/ui/Card.tsx` | Card component |
| `apps/web/src/components/ui/Badge.tsx` | Badge component |
| `apps/web/src/components/ui/Button.tsx` | Button component |
| `apps/web/src/components/ui/Avatar.tsx` | Avatar component |
| `apps/web/src/components/ui/Skeleton.tsx` | Skeleton loaders |
| `apps/web/src/components/ui/index.ts` | UI component exports |
| `docs/SESSION_UPDATES.md` | This document |

### Files Modified
| Path | Changes |
|------|---------|
| `apps/backend/lib/cgraph/forums.ex` | Membership functions, vote fix |
| `apps/backend/lib/cgraph_web/controllers/api/v1/forum_controller.ex` | Auth checks, slug handling |
| `apps/backend/lib/cgraph_web/controllers/api/v1/forum_json.ex` | New fields |
| `apps/web/src/App.tsx` | New routes |
| `apps/web/src/stores/forumStore.ts` | CRUD functions |
| `apps/web/src/pages/forums/Forums.tsx` | Skeleton loading, animations |
| `apps/web/src/pages/forums/ForumPost.tsx` | Markdown rendering, skeleton |
| `apps/web/src/pages/forums/ForumBoardView.tsx` | Owner check fix |
| `apps/web/src/components/index.ts` | New exports |
| `apps/web/src/index.css` | New utilities |
| `apps/web/tailwind.config.js` | New animations |
| `apps/mobile/src/screens/forums/PostScreen.tsx` | API path fix |
| `apps/mobile/src/screens/forums/CreatePostScreen.tsx` | API path fix |

---

## Testing Recommendations

1. **Forum Privacy:**
   - Create public and private forums
   - Verify non-members can't access private forum content
   - Test join/leave functionality

2. **Post Creation:**
   - Create text posts with markdown
   - Verify markdown renders correctly
   - Test image and link post types

3. **Settings:**
   - Toggle forum privacy
   - Update forum details
   - Delete forum (as owner)

4. **Mobile:**
   - Verify all API calls work
   - Test forum browsing and post viewing

5. **Karma System:**
   - Upvote a post and verify author's karma increases
   - Downvote a post and verify author's karma decreases
   - Change vote direction and verify karma swing (±2)
   - Remove vote and verify karma reverts

6. **User Leaderboard:**
   - Navigate to `/community/leaderboard`
   - Verify top users are sorted by karma
   - Test pagination with Next/Previous buttons
   - Click on a user to navigate to their profile

---

## Karma & Reputation System

### Overview
A Reddit-style karma system that tracks user reputation based on community engagement. Users earn karma when their posts and comments receive upvotes, and lose karma when receiving downvotes.

### Backend Changes

#### User Karma Tracking
**Field Added:** `karma` field on User model (integer, default 0)

#### Karma Updates on Votes
When voting on posts or comments, the author's karma is automatically updated:

```elixir
# In forums.ex - create_vote/2
# Increments author karma by +1 for upvote, -1 for downvote
update_author_karma(post.author_id, value)

# In forums.ex - update_vote/2  
# Swings karma by ±2 when changing vote direction
swing = (new_value - old_value)  # Results in +2 or -2
update_author_karma(author_id, swing)

# In forums.ex - remove_vote/2
# Reverses karma when vote is removed
update_author_karma(author_id, -vote.value)
```

**Files Modified:**
- `apps/backend/lib/cgraph/forums.ex` - Vote functions updated

### User API Updates

#### Karma in User Responses
The user API now includes karma, verification, and premium status:

```elixir
# user_json.ex - user_data/1 and public_profile/1
%{
  karma: user.karma || 0,
  is_verified: user.is_verified || false,
  is_premium: user.is_premium || false,
  # ... other fields
}
```

**Files Modified:**
- `apps/backend/lib/cgraph_web/controllers/api/v1/user_json.ex`

### User Leaderboard

#### Backend
New endpoint to retrieve top users ranked by karma:

```elixir
# GET /api/v1/users/leaderboard?page=1&limit=25
def leaderboard(conn, params) do
  page = Map.get(params, "page", "1") |> String.to_integer()
  limit = Map.get(params, "limit", "25") |> String.to_integer() |> min(100)
  
  {users, meta} = Accounts.list_top_users_by_karma(page: page, limit: limit)
  render(conn, :leaderboard, users: users, meta: meta)
end
```

**Files Modified:**
- `apps/backend/lib/cgraph/accounts.ex` - Added `list_top_users_by_karma/1`
- `apps/backend/lib/cgraph_web/controllers/api/v1/user_controller.ex` - Added `leaderboard/2`
- `apps/backend/lib/cgraph_web/controllers/api/v1/user_json.ex` - Added `leaderboard/1` and `leaderboard_entry/2`
- `apps/backend/lib/cgraph_web/router.ex` - Added route

#### Frontend
New User Leaderboard page at `/community/leaderboard`:

**Features:**
- Top 3 spotlight with podium-style display
- Full ranked list with user avatars and karma
- Pagination controls
- Navigation to user profiles
- Sidebar link with trophy icon

**Files Created:**
- `apps/web/src/pages/community/UserLeaderboard.tsx`

**Files Modified:**
- `apps/web/src/App.tsx` - Added route and import
- `apps/web/src/layouts/AppLayout.tsx` - Added leaderboard to sidebar
- `apps/web/src/pages/forums/Forums.tsx` - Added "Top Users" quick link

### Profile Page Updates

#### Karma Display
User profile now displays karma with visual indicators:

```tsx
// UserProfile.tsx
<div className="flex items-center gap-2">
  <TrophyIcon className="h-5 w-5 text-yellow-500" />
  <span className="text-lg font-semibold text-white">
    {user.karma >= 0 ? '+' : ''}{formatNumber(user.karma)}
  </span>
  <span className="text-sm text-gray-400">karma</span>
</div>
```

**Features:**
- Trophy icon with golden color
- Formatted number (1.2K, 1.5M, etc.)
- Positive/negative indicator
- Additional stats display (post count, comment count)

**Files Modified:**
- `apps/web/src/pages/profile/UserProfile.tsx`

---

*Last Updated: Current Session*
*Author: Development Session*
