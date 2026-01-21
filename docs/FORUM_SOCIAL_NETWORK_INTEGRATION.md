# CGraph Forum Social Network - Complete Integration Guide

**Version:** 1.1.0
**Last Updated:** January 2026
**Target Release:** v1.0.0

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Principles](#2-core-principles)
3. [Architecture Overview](#3-architecture-overview)
4. [Current Implementation Status](#4-current-implementation-status)
5. [Database Schema](#5-database-schema)
6. [Backend Implementation](#6-backend-implementation)
7. [Real-Time Phoenix Channels](#7-real-time-phoenix-channels)
8. [Frontend Integration](#8-frontend-integration)
9. [User Flows](#9-user-flows)
10. [Security & Permissions](#10-security--permissions)
11. [AI Moderation System](#11-ai-moderation-system)
12. [Implementation Tasks](#12-implementation-tasks)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment Checklist](#14-deployment-checklist)

---

## 1. Executive Summary

### Vision

CGraph Forums is a **Reddit-style social forum network** where users discover, create, and participate in community forums. Every CGraph user has **one identity** that works seamlessly across the entire platform - the same username, profile, avatar, and reputation they use for messaging also works in forums.

**Key Differentiators:**

- **Unified Identity**: Single username/profile across all of CGraph (messaging, forums, logistics)
- **Reddit-like Discovery**: Browse, join, and participate in any public forum instantly
- **User-Created Communities**: Users can create their own forums and build communities
- **Real-Time Everything**: WebSocket-powered live updates, typing indicators, instant posts
- **AI-Powered Moderation**: Intelligent content moderation with human oversight
- **Enterprise Scale**: Designed for 100M+ users with horizontal scaling

### Subscription Tiers

| Tier | Forum Creation | Storage | AI Moderation | Support |
|------|---------------|---------|---------------|---------|
| **Free** | 1 forum | 100MB | Basic | Community |
| **Premium** | 5 forums | 5GB | Advanced | Priority |
| **Enterprise** | Custom (unlimited) | Custom | Custom AI models | Dedicated |

> **Important**: All users can **join unlimited forums** regardless of tier. Tier limits only apply to forum **creation**.

### Key Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Backend Implementation | ~80% | 100% |
| Frontend Implementation | ~80% | 100% |
| Real-Time Features | 0% | 100% |
| AI Moderation | 0% | 100% |

---

## 2. Core Principles

### 2.1 Unified Identity (Like Reddit)

Every CGraph user has **one account** that works everywhere:

```
┌─────────────────────────────────────────────────────────────────┐
│                     CGraph User: @john_doe                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SAME IDENTITY ACROSS ALL FEATURES:                             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Messaging  │  │   Forums    │  │  Logistics  │             │
│  │             │  │             │  │             │             │
│  │ @john_doe   │  │ @john_doe   │  │ @john_doe   │             │
│  │ Same avatar │  │ Same avatar │  │ Same avatar │             │
│  │ Same bio    │  │ Same bio    │  │ Same bio    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  PROFILE DATA (from users table):                               │
│  • username: john_doe (globally unique)                         │
│  • display_name: John Doe                                       │
│  • avatar_url: https://...                                      │
│  • bio: "Software developer..."                                 │
│  • karma: 1,234 (accumulated from forums)                       │
│  • created_at: 2024-01-15                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Forums use `user_id` foreign key to the main `users` table
- No separate forum registration - users are already registered
- Profile data (username, avatar, bio) pulled from `users` table
- Forum-specific data (post count, reputation per forum) in `forum_members`

### 2.2 Reddit-Style Forum Participation

**Anyone can join any public forum instantly:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORUM PARTICIPATION MODEL                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PUBLIC FORUMS (default):                                       │
│  • Anyone can view content                                      │
│  • Anyone can join with one click                               │
│  • Joined users can post, comment, vote                         │
│  • No approval needed                                           │
│                                                                  │
│  PRIVATE FORUMS:                                                │
│  • Only members can view content                                │
│  • Request to join → Owner approves                             │
│  • Invitation system available                                  │
│                                                                  │
│  RESTRICTED FORUMS:                                             │
│  • Anyone can view content                                      │
│  • Only approved members can post                               │
│  • Good for announcement-style forums                           │
│                                                                  │
│  USER CAPABILITIES:                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Action              │ Free │ Premium │ Enterprise │        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ Join forums         │  ∞   │    ∞    │     ∞      │        │ │
│  │ Create forums       │  1   │    5    │  Custom    │        │ │
│  │ Post/comment        │  ✓   │    ✓    │     ✓      │        │ │
│  │ Vote                │  ✓   │    ✓    │     ✓      │        │ │
│  │ Create polls        │  ✓   │    ✓    │     ✓      │        │ │
│  │ Upload attachments  │ 10MB │  50MB   │  Custom    │        │ │
│  │ AI mod assistant    │  -   │    ✓    │  Custom    │        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Forum Discovery Feed

Like Reddit's front page, users see a personalized feed:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FORUM FEED TYPES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HOME FEED (personalized):                                      │
│  • Posts from forums user has joined                            │
│  • Sorted by: Hot / New / Top (day/week/month/year/all)        │
│  • Algorithm considers: recency, votes, comments, user prefs    │
│                                                                  │
│  POPULAR FEED (global):                                         │
│  • Top posts from all public forums                             │
│  • Great for discovery                                          │
│  • Trending topics highlighted                                  │
│                                                                  │
│  ALL FEED:                                                      │
│  • Everything from all public forums                            │
│  • Chronological or sorted                                      │
│                                                                  │
│  FORUM FEED (single forum):                                     │
│  • Posts from one specific forum                                │
│  • Forum-specific sorting and filters                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CGraph Forums                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│  │   Web App   │     │ Mobile App  │     │   API/SDK   │              │
│  │  (React 19) │     │(React Native│     │  Consumers  │              │
│  │             │     │  + Expo)    │     │             │              │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘              │
│         │                   │                   │                      │
│         └───────────────────┼───────────────────┘                      │
│                             │                                          │
│                    ┌────────▼────────┐                                 │
│                    │   API Gateway   │                                 │
│                    │  (Phoenix 1.8)  │                                 │
│                    └────────┬────────┘                                 │
│                             │                                          │
│    ┌────────────────────────┼────────────────────────┐                │
│    │                        │                        │                │
│  ┌─▼───────┐    ┌───────────▼──────┐    ┌───────────▼────┐           │
│  │REST API │    │    WebSocket     │    │  AI Moderation │           │
│  │/api/v1/*│    │    Channels      │    │    Service     │           │
│  └────┬────┘    └────────┬─────────┘    └───────┬────────┘           │
│       │                  │                      │                     │
│       └──────────────────┼──────────────────────┘                     │
│                          │                                            │
│                 ┌────────▼────────┐                                   │
│                 │  Forums Context │                                   │
│                 │   (Business     │                                   │
│                 │    Logic)       │                                   │
│                 └────────┬────────┘                                   │
│                          │                                            │
│    ┌─────────────────────┼─────────────────────┐                     │
│    │                     │                     │                     │
│  ┌─▼──────────┐   ┌──────▼─────┐   ┌──────────▼──┐                  │
│  │ PostgreSQL │   │   Redis    │   │  R2/S3      │                  │
│  │  Database  │   │   Cache    │   │  Storage    │                  │
│  └────────────┘   └────────────┘   └─────────────┘                  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Single Users Table**: Forums reference the main `users` table, not a separate forum users table
2. **Forum Members Table**: Stores forum-specific data (role, post count, reputation) per user per forum
3. **Lazy Membership**: Users can browse public forums without joining; membership created on first interaction
4. **Real-Time First**: All updates pushed via WebSocket, REST for initial load and writes

---

## 4. Current Implementation Status

### Backend Status: ~80% Complete

| Feature | Status | Notes |
|---------|--------|-------|
| Forum CRUD | ✅ | Create, read, update, delete forums |
| User Integration | ✅ | Forums use main users table |
| Board Management | ✅ | Nested boards/categories |
| Threads & Posts | ✅ | Full CRUD with voting |
| Voting System | ✅ | Reddit-style upvote/downvote |
| Permission System | ✅ | 30+ granular permissions |
| Subscriptions | ✅ | Forum-level subscriptions |
| Moderation Tools | ✅ | Warnings, bans, mod logs |
| Search | ✅ | Full-text search |
| **Phoenix Channels** | ❌ | **CRITICAL: No real-time** |
| **AI Moderation** | ❌ | **Planned for v1.1** |

### Frontend Status: ~80% Complete

| Feature | Status | Notes |
|---------|--------|-------|
| Forum Discovery | ✅ | Browse, search, filter |
| Forum View | ✅ | Threads, members, settings |
| Post Creation | ✅ | Text, links, images, polls |
| Voting UI | ✅ | Upvote/downvote with animations |
| User Profile | ✅ | Uses main profile system |
| **WebSocket Integration** | ❌ | **CRITICAL: Not connected** |
| **AI Mod Dashboard** | ❌ | **Planned for v1.1** |

---

## 5. Database Schema

### Core Principle: Single User Identity

```sql
-- Users table (ALREADY EXISTS - main CGraph users)
-- Forums reference this table, NOT a separate forum_users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(30) NOT NULL UNIQUE,  -- Global username
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  bio TEXT,
  -- Subscription tier
  tier VARCHAR(20) DEFAULT 'free',  -- 'free', 'premium', 'enterprise'
  tier_expires_at TIMESTAMP,
  -- Global karma (sum of all forum karma)
  karma INTEGER DEFAULT 0,
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Forums table
CREATE TABLE forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Owner references main users table
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(500),
  banner_url VARCHAR(500),
  custom_css TEXT,
  -- Privacy settings
  privacy_level VARCHAR(20) DEFAULT 'public',  -- 'public', 'private', 'restricted'
  -- Forum settings
  allow_posts BOOLEAN DEFAULT true,
  require_post_approval BOOLEAN DEFAULT false,
  -- Stats (denormalized)
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  -- Timestamps
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Forum members - tracks per-forum user data
-- This is created when a user JOINS a forum (not just views)
CREATE TABLE forum_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Role in this forum
  role VARCHAR(20) DEFAULT 'member',  -- 'owner', 'admin', 'moderator', 'member'
  -- Forum-specific stats
  post_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  karma INTEGER DEFAULT 0,  -- Karma earned in this forum
  -- Timestamps
  joined_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP,
  -- Moderation
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  ban_expires_at TIMESTAMP,
  -- Constraints
  UNIQUE(forum_id, user_id)
);

-- Threads (posts in forums)
CREATE TABLE threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  -- Author references main users table
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL,
  content TEXT,
  content_html TEXT,
  -- Thread type
  thread_type VARCHAR(20) DEFAULT 'text',  -- 'text', 'link', 'image', 'poll'
  link_url VARCHAR(2000),
  -- Stats
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  -- Status
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  -- AI moderation
  ai_flagged BOOLEAN DEFAULT false,
  ai_flag_reason TEXT,
  ai_reviewed_at TIMESTAMP,
  -- Timestamps
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(forum_id, slug)
);

-- Thread votes (who voted on what)
CREATE TABLE thread_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  inserted_at TIMESTAMP NOT NULL,
  UNIQUE(thread_id, user_id)
);

-- Comments on threads
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  -- Author references main users table
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Nested comments
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  depth INTEGER DEFAULT 0,
  content TEXT NOT NULL,
  content_html TEXT,
  -- Stats
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  -- Status
  is_hidden BOOLEAN DEFAULT false,
  -- AI moderation
  ai_flagged BOOLEAN DEFAULT false,
  ai_flag_reason TEXT,
  -- Timestamps
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- AI Moderation Queue
CREATE TABLE ai_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  -- What's being reviewed
  content_type VARCHAR(20) NOT NULL,  -- 'thread', 'comment', 'user'
  content_id UUID NOT NULL,
  -- AI analysis
  ai_model VARCHAR(50) NOT NULL,  -- 'claude-3-haiku', 'gpt-4o-mini', etc.
  ai_confidence DECIMAL(3,2),  -- 0.00 to 1.00
  ai_categories TEXT[],  -- ['spam', 'harassment', 'nsfw', etc.]
  ai_explanation TEXT,
  ai_suggested_action VARCHAR(20),  -- 'approve', 'remove', 'warn', 'ban'
  -- Review status
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'escalated'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  reviewer_action VARCHAR(20),
  reviewer_notes TEXT,
  -- Timestamps
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Forum tier limits (enforced at application level)
CREATE TABLE tier_limits (
  tier VARCHAR(20) PRIMARY KEY,
  max_forums INTEGER,
  max_storage_bytes BIGINT,
  ai_moderation_enabled BOOLEAN,
  custom_ai_model BOOLEAN,
  priority_support BOOLEAN
);

INSERT INTO tier_limits VALUES
  ('free', 1, 104857600, false, false, false),        -- 100MB
  ('premium', 5, 5368709120, true, false, true),      -- 5GB
  ('enterprise', NULL, NULL, true, true, true);       -- Unlimited
```

### Indexes for Performance

```sql
-- User lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_tier ON users(tier);

-- Forum discovery
CREATE INDEX idx_forums_owner ON forums(owner_id);
CREATE INDEX idx_forums_privacy ON forums(privacy_level);
CREATE INDEX idx_forums_slug ON forums(slug);

-- Member queries
CREATE INDEX idx_forum_members_user ON forum_members(user_id);
CREATE INDEX idx_forum_members_forum ON forum_members(forum_id);
CREATE INDEX idx_forum_members_role ON forum_members(forum_id, role);

-- Thread listing
CREATE INDEX idx_threads_forum ON threads(forum_id);
CREATE INDEX idx_threads_author ON threads(author_id);
CREATE INDEX idx_threads_score ON threads(forum_id, score DESC);
CREATE INDEX idx_threads_created ON threads(forum_id, inserted_at DESC);

-- AI moderation
CREATE INDEX idx_ai_queue_status ON ai_moderation_queue(status, inserted_at);
CREATE INDEX idx_ai_queue_forum ON ai_moderation_queue(forum_id, status);
```

---

## 6. Backend Implementation

### Tier Enforcement

```elixir
# lib/cgraph/forums.ex

@tier_limits %{
  "free" => %{max_forums: 1, max_storage: 100 * 1024 * 1024},
  "premium" => %{max_forums: 5, max_storage: 5 * 1024 * 1024 * 1024},
  "enterprise" => %{max_forums: :unlimited, max_storage: :unlimited}
}

def can_create_forum?(user) do
  user_tier = user.tier || "free"
  limit = @tier_limits[user_tier][:max_forums]

  case limit do
    :unlimited -> true
    max when is_integer(max) ->
      current_count = count_user_forums(user.id)
      current_count < max
  end
end

def create_forum(user, attrs) do
  with true <- can_create_forum?(user),
       {:ok, forum} <- do_create_forum(user, attrs) do
    # Auto-join creator as owner
    create_membership(forum.id, user.id, "owner")
    {:ok, forum}
  else
    false -> {:error, :tier_limit_reached}
    error -> error
  end
end

def count_user_forums(user_id) do
  from(f in Forum, where: f.owner_id == ^user_id)
  |> Repo.aggregate(:count, :id)
end
```

### Joining Forums (Reddit-style)

```elixir
# Anyone can join public forums instantly
def join_forum(forum_id, user_id) do
  forum = get_forum!(forum_id)

  case forum.privacy_level do
    "public" ->
      # Instant join
      create_membership(forum_id, user_id, "member")
      broadcast_member_joined(forum_id, user_id)
      {:ok, :joined}

    "restricted" ->
      # Can view but need approval to post
      create_membership(forum_id, user_id, "restricted")
      {:ok, :joined_restricted}

    "private" ->
      # Need owner approval
      create_join_request(forum_id, user_id)
      notify_forum_owner(forum_id, user_id)
      {:ok, :pending}
  end
end

# Check if user is member (for posting)
def member?(forum_id, user_id) do
  from(m in ForumMember,
    where: m.forum_id == ^forum_id and m.user_id == ^user_id,
    where: m.is_banned == false
  )
  |> Repo.exists?()
end

# Auto-join on first interaction (lazy membership)
def ensure_membership(forum_id, user_id) do
  unless member?(forum_id, user_id) do
    forum = get_forum!(forum_id)
    if forum.privacy_level == "public" do
      join_forum(forum_id, user_id)
    end
  end
end
```

### User Profile Integration

```elixir
# Get user data for forum display (from main users table)
def get_author_for_display(user_id) do
  from(u in User,
    where: u.id == ^user_id,
    select: %{
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      avatar_url: u.avatar_url,
      karma: u.karma
    }
  )
  |> Repo.one()
end

# Get forum-specific user stats
def get_member_stats(forum_id, user_id) do
  from(m in ForumMember,
    where: m.forum_id == ^forum_id and m.user_id == ^user_id,
    select: %{
      role: m.role,
      post_count: m.post_count,
      karma: m.karma,
      joined_at: m.joined_at
    }
  )
  |> Repo.one()
end
```

---

## 7. Real-Time Phoenix Channels

### Forum Channel

```elixir
# lib/cgraph_web/channels/forum_channel.ex

defmodule CGraphWeb.ForumChannel do
  use CGraphWeb, :channel
  alias CGraph.Forums

  def join("forum:" <> forum_id, _params, socket) do
    forum = Forums.get_forum(forum_id)
    user = socket.assigns[:current_user]

    cond do
      is_nil(forum) ->
        {:error, %{reason: "not_found"}}
      forum.privacy_level == "private" && !Forums.member?(forum_id, user&.id) ->
        {:error, %{reason: "private_forum"}}
      true ->
        send(self(), :after_join)
        {:ok, assign(socket, :forum_id, forum_id)}
    end
  end

  def handle_info(:after_join, socket) do
    # Track presence
    if user = socket.assigns[:current_user] do
      Presence.track(socket, user.id, %{
        username: user.username,
        avatar_url: user.avatar_url,
        joined_at: System.system_time(:second)
      })
    end

    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  # Broadcast handlers
  def handle_info({:new_thread, thread}, socket) do
    broadcast!(socket, "new_thread", serialize_thread(thread))
    {:noreply, socket}
  end

  def handle_info({:member_joined, user_data}, socket) do
    broadcast!(socket, "member_joined", user_data)
    {:noreply, socket}
  end
end
```

### Thread Channel

```elixir
# lib/cgraph_web/channels/thread_channel.ex

defmodule CGraphWeb.ThreadChannel do
  use CGraphWeb, :channel

  def join("thread:" <> thread_id, _params, socket) do
    thread = Forums.get_thread(thread_id)

    if can_view_thread?(thread, socket.assigns[:current_user]) do
      send(self(), :after_join)
      {:ok, assign(socket, :thread_id, thread_id)}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  # Real-time typing indicator
  def handle_in("typing", %{"is_typing" => is_typing}, socket) do
    user = socket.assigns.current_user

    broadcast_from!(socket, "typing", %{
      user_id: user.id,
      username: user.username,
      is_typing: is_typing
    })

    {:noreply, socket}
  end

  # Real-time voting
  def handle_in("vote", %{"value" => value}, socket) do
    user = socket.assigns.current_user
    thread_id = socket.assigns.thread_id

    case Forums.vote_on_thread(thread_id, user.id, value) do
      {:ok, thread} ->
        broadcast!(socket, "vote_changed", %{
          thread_id: thread_id,
          score: thread.score,
          upvotes: thread.upvotes,
          downvotes: thread.downvotes
        })
        {:reply, :ok, socket}
      {:error, reason} ->
        {:reply, {:error, reason}, socket}
    end
  end

  # Handle new comment broadcast
  def handle_info({:new_comment, comment}, socket) do
    broadcast!(socket, "new_comment", serialize_comment(comment))
    {:noreply, socket}
  end
end
```

---

## 8. Frontend Integration

### Socket Manager Extension

```typescript
// apps/web/src/lib/socket.ts

// Add to SocketManager class

joinForum(forumId: string): Channel | null {
  const topic = `forum:${forumId}`;

  if (this.channels.has(topic)) {
    return this.channels.get(topic)!;
  }

  const channel = this.socket!.channel(topic, {});

  channel.on('new_thread', (thread) => {
    useForumStore.getState().addThread(thread);
  });

  channel.on('member_joined', (data) => {
    useForumStore.getState().incrementMemberCount(forumId);
  });

  channel.on('presence_state', (state) => {
    // Update who's viewing
  });

  channel.join();
  this.channels.set(topic, channel);
  return channel;
}

joinThread(threadId: string): Channel | null {
  const topic = `thread:${threadId}`;

  if (this.channels.has(topic)) {
    return this.channels.get(topic)!;
  }

  const channel = this.socket!.channel(topic, {});

  channel.on('new_comment', (comment) => {
    useForumStore.getState().addComment(threadId, comment);
  });

  channel.on('vote_changed', (data) => {
    useForumStore.getState().updateThreadScore(data.thread_id, data);
  });

  channel.on('typing', (data) => {
    useForumStore.getState().setTypingUser(threadId, data);
  });

  channel.join();
  this.channels.set(topic, channel);
  return channel;
}

// Vote via WebSocket for instant feedback
voteOnThread(threadId: string, value: 1 | -1) {
  const channel = this.channels.get(`thread:${threadId}`);
  if (channel) {
    channel.push('vote', { value });
  }
}

sendTyping(threadId: string, isTyping: boolean) {
  const channel = this.channels.get(`thread:${threadId}`);
  if (channel) {
    channel.push('typing', { is_typing: isTyping });
  }
}
```

### React Hooks

```typescript
// apps/web/src/hooks/useForumSocket.ts

export function useForumSocket(forumId: string | undefined) {
  useEffect(() => {
    if (!forumId) return;

    const channel = socketManager.joinForum(forumId);

    return () => {
      socketManager.leaveForum(forumId);
    };
  }, [forumId]);
}

export function useThreadSocket(threadId: string | undefined) {
  const [viewers, setViewers] = useState<string[]>([]);
  const [typing, setTyping] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (!threadId) return;

    const channel = socketManager.joinThread(threadId);

    return () => {
      socketManager.leaveThread(threadId);
    };
  }, [threadId]);

  const vote = useCallback((value: 1 | -1) => {
    if (threadId) {
      socketManager.voteOnThread(threadId, value);
    }
  }, [threadId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (threadId) {
      socketManager.sendTyping(threadId, isTyping);
    }
  }, [threadId]);

  return { viewers, typing, vote, sendTyping };
}
```

---

## 9. User Flows

### Flow 1: Join and Post (Reddit-style)

```
┌─────────────────────────────────────────────────────────────────┐
│                    JOIN & POST FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User @john_doe browsing /forums                             │
│     └── Sees list of popular forums                             │
│                                                                  │
│  2. Clicks on "r/gaming" forum                                  │
│     └── Can view all threads (public forum)                     │
│     └── Sees "Join" button in header                            │
│                                                                  │
│  3. Clicks "Join"                                               │
│     └── POST /api/v1/forums/:id/join                           │
│     └── Creates forum_member record with user_id                │
│     └── Button changes to "Joined ✓"                           │
│     └── WebSocket: broadcasts "member_joined"                   │
│                                                                  │
│  4. Now can post/comment/vote                                   │
│     └── "Create Post" button enabled                            │
│     └── Vote arrows active                                      │
│     └── Reply boxes visible                                     │
│                                                                  │
│  5. Profile shows forum activity                                │
│     └── Same @john_doe profile everywhere                       │
│     └── Posts from all forums aggregated                        │
│     └── Total karma shown                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: Create Forum (Tier-Limited)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE FORUM FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks "Create Forum"                                  │
│                                                                  │
│  2. Check tier limit:                                           │
│     ├── Free user (1 forum limit):                              │
│     │   └── If has 0 forums → Show create form                 │
│     │   └── If has 1 forum → Show upgrade modal                │
│     │       "Upgrade to Premium for 5 forums"                   │
│     │                                                            │
│     ├── Premium user (5 forum limit):                           │
│     │   └── If has < 5 forums → Show create form               │
│     │   └── If has 5 forums → Show upgrade modal               │
│     │       "Upgrade to Enterprise for unlimited"               │
│     │                                                            │
│     └── Enterprise user (unlimited):                            │
│         └── Always show create form                             │
│                                                                  │
│  3. Fill form:                                                  │
│     • Name: "Gaming Community"                                  │
│     • Description: "Discuss all things gaming"                  │
│     • Privacy: Public / Private / Restricted                    │
│     • Icon: Upload                                              │
│                                                                  │
│  4. Submit:                                                     │
│     └── POST /api/v1/forums                                    │
│     └── Create forum with user as owner                        │
│     └── Auto-create default boards                             │
│     └── Redirect to /forums/:slug/settings                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Security & Permissions

### Permission Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION HIERARCHY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LEVEL 1: Platform Admin (CGraph staff)                         │
│  └── Can access any forum, override any setting                 │
│                                                                  │
│  LEVEL 2: Forum Owner                                           │
│  └── Full control of their forum                                │
│  └── Can delete forum, manage all settings                      │
│  └── Can promote admins/mods                                    │
│                                                                  │
│  LEVEL 3: Forum Admin                                           │
│  └── Can manage settings, boards, members                       │
│  └── Cannot delete forum or demote owner                        │
│                                                                  │
│  LEVEL 4: Forum Moderator                                       │
│  └── Can pin/lock/delete threads                                │
│  └── Can ban users, manage mod queue                            │
│  └── Can use AI moderation tools (if Premium+)                  │
│                                                                  │
│  LEVEL 5: Member                                                │
│  └── Can post, comment, vote                                    │
│  └── Subject to forum rules                                     │
│                                                                  │
│  LEVEL 6: Visitor (not joined)                                  │
│  └── Can view public forums                                     │
│  └── Must join to interact                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Rate Limits

```elixir
# Per-user rate limits
@rate_limits %{
  create_forum: {1, :per_day},      # 1 forum per day max
  create_thread: {10, :per_hour},   # 10 threads per hour
  create_comment: {60, :per_hour},  # 60 comments per hour
  vote: {300, :per_hour}            # 300 votes per hour
}
```

---

## 11. AI Moderation System

### Overview

CGraph Forums will integrate AI-powered moderation to help forum owners manage their communities at scale. This is a **Premium/Enterprise feature** that assists human moderators rather than replacing them.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI MODERATION PIPELINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CONTENT CREATED                                                │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    AI ANALYSIS                               ││
│  │  • Spam detection (promotional, repetitive)                  ││
│  │  • Toxicity analysis (harassment, hate speech)               ││
│  │  • NSFW detection (explicit content)                         ││
│  │  • Quality scoring (low effort, off-topic)                   ││
│  │  • Context awareness (forum rules, culture)                  ││
│  └─────────────────────────────────────────────────────────────┘│
│       │                                                          │
│       ▼                                                          │
│  CONFIDENCE SCORE (0-100%)                                      │
│       │                                                          │
│       ├── HIGH (>90%): Auto-action based on settings            │
│       │   └── Spam: Auto-remove                                 │
│       │   └── Severe toxicity: Auto-hide + notify mods          │
│       │                                                          │
│       ├── MEDIUM (50-90%): Flag for mod review                  │
│       │   └── Add to mod queue with AI explanation              │
│       │   └── Highlight concerning parts                        │
│       │                                                          │
│       └── LOW (<50%): Allow through                             │
│           └── Log for analytics                                 │
│                                                                  │
│  HUMAN REVIEW                                                   │
│       │                                                          │
│       ├── Approve: AI learns this was acceptable                │
│       ├── Remove: AI learns this should be caught               │
│       └── Adjust: Fine-tune detection thresholds                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Features by Tier

| Feature | Free | Premium | Enterprise |
|---------|------|---------|------------|
| Basic spam filter | ✓ | ✓ | ✓ |
| AI content analysis | - | ✓ | ✓ |
| AI mod suggestions | - | ✓ | ✓ |
| Auto-moderation rules | - | ✓ | ✓ |
| Custom AI training | - | - | ✓ |
| API for custom models | - | - | ✓ |
| Dedicated AI resources | - | - | ✓ |

### Database Schema for AI Moderation

```sql
-- AI moderation queue (shown earlier)
CREATE TABLE ai_moderation_queue (
  id UUID PRIMARY KEY,
  forum_id UUID NOT NULL REFERENCES forums(id),
  content_type VARCHAR(20) NOT NULL,  -- 'thread', 'comment'
  content_id UUID NOT NULL,
  -- AI results
  ai_model VARCHAR(50) NOT NULL,
  ai_confidence DECIMAL(3,2),
  ai_categories TEXT[],  -- ['spam', 'toxicity', 'nsfw']
  ai_explanation TEXT,
  ai_suggested_action VARCHAR(20),
  -- Human review
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  reviewer_action VARCHAR(20),
  reviewer_notes TEXT,
  -- Learning feedback
  was_correct BOOLEAN,  -- Did AI make right call?
  inserted_at TIMESTAMP NOT NULL
);

-- AI moderation settings per forum
CREATE TABLE ai_moderation_settings (
  forum_id UUID PRIMARY KEY REFERENCES forums(id),
  enabled BOOLEAN DEFAULT false,
  -- Thresholds
  auto_remove_spam_threshold DECIMAL(3,2) DEFAULT 0.95,
  auto_hide_toxicity_threshold DECIMAL(3,2) DEFAULT 0.90,
  flag_for_review_threshold DECIMAL(3,2) DEFAULT 0.50,
  -- What to detect
  detect_spam BOOLEAN DEFAULT true,
  detect_toxicity BOOLEAN DEFAULT true,
  detect_nsfw BOOLEAN DEFAULT true,
  detect_low_quality BOOLEAN DEFAULT false,
  -- Custom rules (Enterprise)
  custom_rules JSONB DEFAULT '{}',
  custom_model_id VARCHAR(100),
  updated_at TIMESTAMP NOT NULL
);

-- AI learning from mod decisions
CREATE TABLE ai_training_data (
  id UUID PRIMARY KEY,
  forum_id UUID REFERENCES forums(id),
  content_text TEXT NOT NULL,
  content_type VARCHAR(20) NOT NULL,
  -- What AI predicted
  ai_prediction JSONB NOT NULL,
  -- What human decided
  human_decision VARCHAR(20) NOT NULL,
  human_reasoning TEXT,
  -- For training
  should_train BOOLEAN DEFAULT true,
  trained_at TIMESTAMP,
  inserted_at TIMESTAMP NOT NULL
);
```

### API Endpoints

```elixir
# AI Moderation endpoints

# Get mod queue with AI suggestions
GET /api/v1/forums/:forum_id/moderation/queue
# Response: List of flagged content with AI analysis

# Review an item
POST /api/v1/forums/:forum_id/moderation/queue/:id/review
# Body: { action: "approve" | "remove" | "warn", notes: "..." }

# Get AI settings
GET /api/v1/forums/:forum_id/moderation/ai-settings

# Update AI settings (Premium+)
PUT /api/v1/forums/:forum_id/moderation/ai-settings
# Body: { enabled: true, auto_remove_spam_threshold: 0.95, ... }

# Get AI analytics
GET /api/v1/forums/:forum_id/moderation/ai-analytics
# Response: { accuracy: 0.94, false_positives: 12, ... }

# Enterprise: Custom model training
POST /api/v1/forums/:forum_id/moderation/train
# Triggers training on accumulated feedback data
```

### Frontend Components (Planned)

```typescript
// AI Moderation Dashboard
// apps/web/src/pages/forums/AIModerationDashboard.tsx

interface AIModQueueItem {
  id: string;
  content: {
    type: 'thread' | 'comment';
    text: string;
    author: User;
    createdAt: string;
  };
  ai: {
    confidence: number;
    categories: string[];
    explanation: string;
    suggestedAction: 'approve' | 'remove' | 'warn';
    highlightedParts: { start: number; end: number; reason: string }[];
  };
  status: 'pending' | 'reviewed';
}

// Components to build:
// - AIModQueue.tsx - List of flagged items
// - AIModReviewCard.tsx - Individual item with AI explanation
// - AISettingsPanel.tsx - Configure thresholds
// - AIAnalyticsDashboard.tsx - Accuracy, trends
// - AITrainingFeedback.tsx - Enterprise training UI
```

### Implementation Phases

**Phase 1: Basic Integration (v1.1)**
- Connect to Claude API for content analysis
- Basic spam/toxicity detection
- Manual mod queue with AI suggestions
- Premium tier gating

**Phase 2: Auto-Moderation (v1.2)**
- Configurable auto-actions
- Learning from mod decisions
- Improved accuracy through feedback
- Analytics dashboard

**Phase 3: Enterprise Features (v1.3)**
- Custom model fine-tuning
- Forum-specific training data
- API for external models
- Advanced analytics

---

## 12. Implementation Tasks

### Priority: CRITICAL (Week 1)

| Task | Description | Estimate |
|------|-------------|----------|
| Phoenix Channels | Create forum/thread channels | 2 days |
| Socket Manager | Add forum methods to frontend | 1 day |
| User Integration | Ensure forums use main users table | 0.5 days |
| Join Flow | Implement Reddit-style instant join | 0.5 days |
| Tier Enforcement | Enforce 1/5/unlimited limits | 0.5 days |

### Priority: HIGH (Week 2)

| Task | Description | Estimate |
|------|-------------|----------|
| Home Feed | Personalized feed from joined forums | 2 days |
| Popular Feed | Global trending posts | 1 day |
| Real-time Voting | WebSocket vote updates | 1 day |
| Typing Indicators | Show who's composing | 0.5 days |

### Priority: MEDIUM (Week 3-4)

| Task | Description | Estimate |
|------|-------------|----------|
| AI Mod Schema | Database tables for AI | 1 day |
| AI Analysis API | Connect to Claude API | 2 days |
| Mod Queue UI | AI-powered review interface | 2 days |
| AI Settings | Configuration panel | 1 day |

### Priority: LOW (Week 5+)

| Task | Description | Estimate |
|------|-------------|----------|
| AI Auto-Actions | Automated moderation | 2 days |
| AI Learning | Train from feedback | 3 days |
| Enterprise Custom Models | Fine-tuning support | 5 days |
| Mobile Forums | React Native screens | 5 days |

---

## 13. Testing Strategy

### Unit Tests

```elixir
# Tier enforcement
test "free user can create only 1 forum" do
  user = insert(:user, tier: "free")
  {:ok, _} = Forums.create_forum(user, %{name: "First"})
  {:error, :tier_limit_reached} = Forums.create_forum(user, %{name: "Second"})
end

test "premium user can create 5 forums" do
  user = insert(:user, tier: "premium")
  for i <- 1..5 do
    {:ok, _} = Forums.create_forum(user, %{name: "Forum #{i}"})
  end
  {:error, :tier_limit_reached} = Forums.create_forum(user, %{name: "Sixth"})
end

# User identity
test "thread author is from main users table" do
  user = insert(:user, username: "testuser")
  forum = insert(:forum)
  Forums.join_forum(forum.id, user.id)

  {:ok, thread} = Forums.create_thread(forum.id, user.id, %{title: "Test"})

  author = Forums.get_author_for_display(thread.author_id)
  assert author.username == "testuser"
end
```

### Integration Tests

```typescript
// E2E: Join and post flow
it('user can join forum and post immediately', () => {
  cy.login('testuser');
  cy.visit('/forums/gaming');

  // Should see content but not be joined
  cy.contains('Gaming Community');
  cy.contains('Join').click();

  // Should now be joined
  cy.contains('Joined ✓');

  // Can create post
  cy.contains('Create Post').click();
  cy.get('[name="title"]').type('My first post');
  cy.get('[name="content"]').type('Hello gaming community!');
  cy.contains('Submit').click();

  // Post appears in feed
  cy.contains('My first post');
});
```

---

## 14. Deployment Checklist

### Environment Variables

```bash
# Tiers
TIER_FREE_MAX_FORUMS=1
TIER_PREMIUM_MAX_FORUMS=5
TIER_ENTERPRISE_MAX_FORUMS=unlimited

# AI Moderation (Premium+)
ANTHROPIC_API_KEY=sk-ant-...
AI_MOD_MODEL=claude-3-haiku-20240307
AI_MOD_ENABLED=true
```

### Database Migrations

```bash
# Run migrations
fly ssh console -C "/app/bin/cgraph eval 'CGraph.Release.migrate()'"

# Verify tier_limits table
fly ssh console -C "/app/bin/cgraph eval 'CGraph.Repo.all(CGraph.Forums.TierLimit)'"
```

### Verification

```bash
# Test tier enforcement
curl -X POST https://api.cgraph.org/api/v1/forums \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Test Forum"}'

# Should succeed for first forum, fail if at limit
```

---

## 15. Forum Customization & Community Management System

### Vision: The Ultimate Platform for Community Leaders

CGraph Forums empowers **every type of community leader** - streamers, gamers, bloggers, writers, scientists, artists, educators, storytellers, and entrepreneurs - to create **unique, powerful communities** that perfectly serve their niche.

**Philosophy:**
- Every forum is a **unique world** with its own identity, layout, and features
- Community leaders need **powerful tools** to grow and engage their audience
- **Drag-and-drop simplicity** meets **enterprise-level customization**
- No coding required, but available for power users
- **Any niche welcomes**: gaming, writing, science, entertainment, education, art, music, business, storytelling, sports, lifestyle, and beyond

**Why Create a Forum on CGraph?**
- **Full control** over your community's look, feel, and structure
- **Flexible organization** - drag-and-drop boards, widgets, and sections
- **Niche-specific tools** - features designed for YOUR type of community
- **Growth features** - analytics, engagement tools, promotional features
- **Monetization potential** - premium memberships, digital goods (future)
- **No algorithms** - your content, your rules

---

### 15.1 Forum Layout & Organization

#### Drag-and-Drop Forum Builder

```
┌─────────────────────────────────────────────────────────────────┐
│              DRAG-AND-DROP FORUM BUILDER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🖱️ INTUITIVE ORGANIZATION:                                    │
│  Community leaders can arrange their forum structure visually:  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  EDIT MODE - Drag to Reorder                            │    │
│  │  ─────────────────────────────────────────────────────  │    │
│  │                                                          │    │
│  │  ☰ 📢 Announcements          [···] ↕️                   │    │
│  │  ☰ 💬 General Discussion     [···] ↕️                   │    │
│  │  ☰ 🎮 Gaming Corner          [···] ↕️                   │    │
│  │    ├─ ☰ PC Gaming            [···] ↕️                   │    │
│  │    ├─ ☰ Console Gaming       [···] ↕️                   │    │
│  │    └─ ☰ Mobile Gaming        [···] ↕️                   │    │
│  │  ☰ 🎨 Creative Showcase      [···] ↕️                   │    │
│  │  ☰ 📚 Resources & Guides     [···] ↕️                   │    │
│  │  ☰ 🤝 Introductions          [···] ↕️                   │    │
│  │                                                          │    │
│  │  [+ Add Board] [+ Add Category] [+ Add Widget]          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ORGANIZATION FEATURES:                                         │
│  • Drag boards into categories (create nested structures)      │
│  • Collapse/expand categories by default                       │
│  • Show/hide boards based on user roles                        │
│  • Set board-specific permissions                              │
│  • Reorder with smooth animations                              │
│  • Preview changes before publishing                           │
│                                                                  │
│  BOARD TYPES:                                                   │
│  • 📋 Standard Board - Classic threaded discussions           │
│  • 🖼️ Gallery Board - Image/media focused (Pinterest-style)   │
│  • ❓ Q&A Board - Stack Overflow-style with best answers      │
│  • 📰 Blog Board - Long-form articles with comments           │
│  • 🔗 Link Board - Curated links with upvotes (Reddit-style)  │
│  • 📅 Events Board - Calendar-integrated events               │
│  • 📁 Archive Board - Read-only historical content            │
│  • 🔒 Private Board - Members-only access                     │
│  • 💎 Premium Board - Subscribers/VIP access only             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Widget System

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMIZABLE WIDGETS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Drag-and-drop widgets to customize your forum's sidebar,       │
│  header, footer, and board pages:                               │
│                                                                  │
│  📊 COMMUNITY WIDGETS:                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • 👥 Online Members - Show who's active now               │ │
│  │ • 📈 Forum Stats - Members, posts, threads counts         │ │
│  │ • 🏆 Top Contributors - Leaderboard of active members     │ │
│  │ • 🔥 Trending Threads - Hot discussions                   │ │
│  │ • 🆕 Recent Activity - Latest posts feed                  │ │
│  │ • 🎂 Birthdays Today - Celebrate members                  │ │
│  │ • 📅 Upcoming Events - Calendar preview                   │ │
│  │ • 🏷️ Popular Tags - Tag cloud                            │ │
│  │ • 👋 Welcome Box - Greet new visitors                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🎯 ENGAGEMENT WIDGETS:                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • 📌 Pinned Announcements - Important messages            │ │
│  │ • 🗳️ Quick Polls - Sidebar polls for engagement          │ │
│  │ • 💬 Shoutbox - Real-time chat widget                     │ │
│  │ • 🎁 Daily Rewards - Gamification teaser                  │ │
│  │ • 🏅 Achievement Spotlight - Featured achievements        │ │
│  │ • 📢 Call-to-Action - Custom promo banners                │ │
│  │ • 🔔 Notification Digest - User's unread summary          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📺 MEDIA WIDGETS:                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • 🎥 Live Stream Embed - Twitch/YouTube integration       │ │
│  │ • 🎵 Music Player - Background/featured music             │ │
│  │ • 📸 Photo Gallery - Featured images carousel             │ │
│  │ • 🐦 Social Feed - Twitter/Discord/Instagram embed        │ │
│  │ • 📹 Video Showcase - Featured video player               │ │
│  │ • 🎙️ Podcast Player - Audio content widget               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🔧 UTILITY WIDGETS:                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • 🔍 Search Box - Quick forum search                      │ │
│  │ • 📜 Rules Summary - Community guidelines                 │ │
│  │ • 🔗 Quick Links - Important resources                    │ │
│  │ • 🌐 Discord Server - Join widget                         │ │
│  │ • 💰 Donation Goal - Progress bar (Ko-fi, Patreon)        │ │
│  │ • 📧 Newsletter Signup - Email capture                    │ │
│  │ • 🛒 Merch Store Preview - Product showcase               │ │
│  │ • 🗓️ Schedule Widget - Streaming/posting schedule        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  WIDGET PLACEMENT:                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │        [HEADER WIDGETS]                                    │ │
│  │  ┌─────────────────────────┬────────────────┐             │ │
│  │  │                         │                │             │ │
│  │  │     MAIN CONTENT        │   SIDEBAR      │             │ │
│  │  │     (boards/threads)    │   WIDGETS      │             │ │
│  │  │                         │                │             │ │
│  │  └─────────────────────────┴────────────────┘             │ │
│  │        [FOOTER WIDGETS]                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 15.2 Thread Customization

#### Colored & Styled Threads

```
┌─────────────────────────────────────────────────────────────────┐
│                    THREAD STYLING OPTIONS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  THREAD APPEARANCE (set by author):                             │
│                                                                  │
│  🎨 BACKGROUND COLORS:                                          │
│     • Solid colors (red, blue, green, purple, etc.)            │
│     • Gradients (sunset, ocean, forest, neon)                  │
│     • Patterns (stripes, dots, waves)                          │
│     • Custom hex colors (Premium)                              │
│                                                                  │
│  ✨ GLOW EFFECTS:                                               │
│     • Subtle glow (border highlight)                           │
│     • Pulsing glow (attention-grabbing)                        │
│     • Neon glow (cyberpunk aesthetic)                          │
│     • Rainbow glow (animated color cycle)                      │
│                                                                  │
│  🏷️ THREAD BORDERS:                                            │
│     • Rounded, sharp, or custom radius                         │
│     • Border animations (dash, pulse)                          │
│     • Double/triple borders                                     │
│     • Gradient borders                                          │
│                                                                  │
│  EXAMPLE THREAD CARD:                                           │
│  ┌─══════════════════════════════════════════════════════─┐    │
│  │ ✨ [ANNOUNCEMENT] Server Update v2.5 - New Features! ✨  │    │
│  │ ═══════════════════════════════════════════════════════ │    │
│  │ 🔥 Glowing neon border with gradient background         │    │
│  │ Posted by @Admin • 🏷️ Important • 💬 234 replies       │    │
│  └─══════════════════════════════════════════════════════─┘    │
│                                                                  │
│  USAGE LIMITS:                                                  │
│  • Free: Basic colors, no glow                                 │
│  • Premium: All colors, gradients, basic glow                  │
│  • Moderators: Special mod-only styles                         │
│  • Forum owner: Custom forum-wide themes                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Thread Icons & Emojis

```
┌─────────────────────────────────────────────────────────────────┐
│                    THREAD ICONS & EMOJIS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POST ICONS (MyBB-style mood indicators):                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  😊 Happy    😢 Sad      🤔 Question   💡 Idea             │ │
│  │  🔥 Hot      ❄️ Cool     ⚠️ Warning    ✅ Solved           │ │
│  │  🎮 Gaming   🎨 Art      🎵 Music      📚 Tutorial         │ │
│  │  🛠️ WIP      🐛 Bug      💬 Discussion 📢 Announcement     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  CUSTOM FORUM EMOJIS:                                           │
│  • Forum owners can upload custom emoji packs                  │
│  • Animated emojis (GIF) for Premium forums                    │
│  • Emoji reactions on posts                                    │
│  • Emoji-only replies (quick reactions)                        │
│                                                                  │
│  STICKERS (Premium):                                            │
│  • Large animated stickers in posts                            │
│  • Forum-specific sticker packs                                │
│  • User-created stickers (approved by mods)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 15.3 Forum-Wide Customization

#### Forum Themes

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORUM THEME SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  THEME COMPONENTS:                                              │
│                                                                  │
│  🎨 COLOR SCHEME:                                               │
│     • Primary color (buttons, links, accents)                  │
│     • Secondary color (highlights, badges)                     │
│     • Background (solid, gradient, or image)                   │
│     • Text colors (light/dark mode aware)                      │
│     • Card backgrounds (glassmorphism options)                 │
│                                                                  │
│  🖼️ BRANDING:                                                   │
│     • Forum logo (header)                                      │
│     • Favicon                                                   │
│     • Banner image (hero section)                              │
│     • Custom loading animation                                 │
│     • Watermark (optional)                                     │
│                                                                  │
│  📐 LAYOUT OPTIONS:                                             │
│     • Card style (rounded, sharp, floating)                    │
│     • Spacing (compact, comfortable, spacious)                 │
│     • Font family (from curated list or custom)                │
│     • Thread list style (cards, list, compact)                 │
│                                                                  │
│  ✨ PREMIUM THEME FEATURES:                                     │
│     • Custom CSS injection                                     │
│     • Background video/animation                               │
│     • Parallax scrolling effects                               │
│     • Custom cursor                                            │
│     • Sound effects (optional, user-toggleable)                │
│     • Seasonal auto-themes (holiday decorations)               │
│                                                                  │
│  PRESET THEMES:                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🌙 Dark Mode     ☀️ Light Mode    🎮 Gaming Neon          │ │
│  │  🌸 Pastel        🔥 Fire & Ice    🌊 Ocean Blue           │ │
│  │  🍂 Autumn        ❄️ Winter        🌺 Spring               │ │
│  │  🎨 Minimalist    📜 Classic       🚀 Cyberpunk            │ │
│  │  🌈 Pride         🎃 Halloween     🎄 Christmas            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Forum Categories & Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORUM ORGANIZATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  BOARD/CATEGORY CUSTOMIZATION:                                  │
│                                                                  │
│  📁 BOARD ICONS:                                                │
│     • Emoji icons (quick selection)                            │
│     • Custom uploaded icons                                    │
│     • Animated icons (Premium)                                 │
│                                                                  │
│  🎨 BOARD COLORS:                                               │
│     • Color-coded categories                                   │
│     • Custom backgrounds per board                             │
│     • Header images for boards                                 │
│                                                                  │
│  📋 BOARD DESCRIPTIONS:                                         │
│     • Rich text descriptions                                   │
│     • Pinned rules/guidelines                                  │
│     • Featured threads section                                 │
│                                                                  │
│  EXAMPLE FORUM STRUCTURE:                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  🎮 GAMING COMMUNITY                                        │ │
│  │  ├── 🔥 General Gaming (red accent)                        │ │
│  │  │   ├── News & Announcements                              │ │
│  │  │   ├── Game Reviews                                      │ │
│  │  │   └── Looking for Group                                 │ │
│  │  ├── 🎯 Competitive (gold accent)                          │ │
│  │  │   ├── Tournaments                                       │ │
│  │  │   ├── Team Recruitment                                  │ │
│  │  │   └── Strategy Guides                                   │ │
│  │  ├── 🛠️ Technical (blue accent)                            │ │
│  │  │   ├── PC Building                                       │ │
│  │  │   ├── Troubleshooting                                   │ │
│  │  │   └── Mods & Tools                                      │ │
│  │  └── 🎨 Creative (purple accent)                           │ │
│  │      ├── Fan Art                                           │ │
│  │      ├── Cosplay                                           │ │
│  │      └── Content Creation                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 15.4 Niche Forum Templates

**Every type of community leader should feel at home on CGraph.** We provide **30+ starter templates** optimized for specific niches:

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPREHENSIVE NICHE FORUM TEMPLATES                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│  📺 CONTENT CREATORS & STREAMERS                                │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  🎬 YOUTUBE/TWITCH STREAMERS:                                   │
│     • Live stream embed widget (auto-detect when live)         │
│     • VOD discussion boards                                    │
│     • Stream schedule calendar                                 │
│     • Clip highlights gallery                                  │
│     • Subscriber-only VIP boards                               │
│     • Merch store integration                                  │
│     • Fan art showcase                                         │
│     • Emote/badge request boards                               │
│     • Gaming neon/streamer aesthetic themes                    │
│                                                                  │
│  🎙️ PODCASTERS:                                                 │
│     • Episode discussion boards (auto-organized by episode)    │
│     • Audio player embed for episodes                          │
│     • Guest Q&A sections                                       │
│     • Listener stories/feedback                                │
│     • Topic suggestion boards                                  │
│     • Behind-the-scenes content                                │
│     • Podcast studio/professional themes                       │
│                                                                  │
│  📱 INFLUENCERS & CREATORS:                                     │
│     • Content calendar/announcements                           │
│     • Brand collaboration showcase                             │
│     • Fan interaction boards                                   │
│     • Exclusive content for supporters                         │
│     • Meet-up/event organization                               │
│     • Lifestyle/aesthetic themes                               │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│  🎮 GAMING COMMUNITIES                                          │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  🎮 GENERAL GAMING:                                             │
│     • LFG (Looking for Group) boards                           │
│     • Clan/guild recruitment                                   │
│     • Strategy guides & walkthroughs                           │
│     • Game-specific sub-boards                                 │
│     • Screenshot/clip gallery                                  │
│     • Leaderboard integration                                  │
│     • Dark neon/gaming aesthetic themes                        │
│                                                                  │
│  ⚔️ ESPORTS & COMPETITIVE:                                      │
│     • Tournament brackets & organization                       │
│     • Team roster management                                   │
│     • Scrim/practice scheduling                                │
│     • Match analysis boards                                    │
│     • Pro player highlights                                    │
│     • Competitive/bold themes                                  │
│                                                                  │
│  🎲 TABLETOP & RPG:                                             │
│     • Campaign logs & story archives                           │
│     • Character sheet sharing                                  │
│     • Homebrew content boards                                  │
│     • Session scheduling calendar                              │
│     • World-building wikis                                     │
│     • Fantasy/medieval themes                                  │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│  📝 WRITERS & STORYTELLERS                                      │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  📖 FICTION WRITERS:                                            │
│     • Story posting with chapter organization                  │
│     • Writing prompts board                                    │
│     • Beta reader matching                                     │
│     • Critique/feedback workshops                              │
│     • Genre-specific boards (fantasy, sci-fi, romance, etc.)   │
│     • Character creation showcases                             │
│     • World-building discussion                                │
│     • Elegant/book-inspired themes                             │
│                                                                  │
│  📰 BLOGGERS & JOURNALISTS:                                     │
│     • Article publishing with rich formatting                  │
│     • Newsletter archive                                       │
│     • Reader discussion boards                                 │
│     • News/current events sections                             │
│     • Editorial calendar                                       │
│     • Professional/editorial themes                            │
│                                                                  │
│  🎭 INTERACTIVE FICTION & ROLEPLAY:                             │
│     • Roleplay forums with character profiles                  │
│     • In-character vs out-of-character sections                │
│     • Story collaboration boards                               │
│     • World lore wikis                                         │
│     • Event/plot planning                                      │
│     • Immersive fantasy/sci-fi themes                          │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│  🔬 SCIENCE & ACADEMIA                                          │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  🧬 RESEARCH & SCIENCE:                                         │
│     • Paper discussion boards                                  │
│     • Lab notebook sharing                                     │
│     • Methodology Q&A                                          │
│     • Dataset/resource sharing                                 │
│     • Collaboration matching                                   │
│     • Citation formatting tools                                │
│     • Clean academic/scientific themes                         │
│                                                                  │
│  🎓 EDUCATION & COURSES:                                        │
│     • Lesson/module organization                               │
│     • Student Q&A boards                                       │
│     • Assignment submission areas                              │
│     • Study group formation                                    │
│     • Resource library                                         │
│     • Progress tracking                                        │
│     • Academic/clean themes                                    │
│                                                                  │
│  🤖 TECH & PROGRAMMING:                                         │
│     • Code syntax highlighting (50+ languages)                 │
│     • Stack Overflow-style Q&A                                 │
│     • Project showcase with GitHub integration                 │
│     • Tutorial boards with code blocks                         │
│     • Job board section                                        │
│     • Open source contribution matching                        │
│     • Terminal/developer themes                                │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│  🎨 CREATIVE & ARTS                                             │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  🖼️ VISUAL ARTISTS:                                             │
│     • Gallery-style portfolio boards                           │
│     • Commission marketplace                                   │
│     • Critique/feedback sections                               │
│     • WIP (work in progress) sharing                           │
│     • Tutorial/process breakdown                               │
│     • Art challenge events                                     │
│     • Pastel/artistic themes                                   │
│                                                                  │
│  🎵 MUSICIANS & PRODUCERS:                                      │
│     • Track sharing with audio player                          │
│     • Collaboration matching (find vocalists, producers)       │
│     • Genre-specific boards                                    │
│     • Feedback/critique sections                               │
│     • Sample/preset sharing                                    │
│     • Gear reviews & recommendations                           │
│     • Vinyl/retro music themes                                 │
│                                                                  │
│  📸 PHOTOGRAPHERS:                                              │
│     • High-res photo galleries                                 │
│     • EXIF data display                                        │
│     • Location/genre boards                                    │
│     • Editing tutorials                                        │
│     • Gear discussion                                          │
│     • Client showcase                                          │
│     • Minimal/photo-focused themes                             │
│                                                                  │
│  🎥 FILMMAKERS & VIDEO:                                         │
│     • Video embed boards                                       │
│     • Script/screenplay sharing                                │
│     • Crew collaboration matching                              │
│     • Film review discussions                                  │
│     • Behind-the-scenes content                                │
│     • Cinematic themes                                         │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│  🌟 ENTERTAINMENT & FANDOM                                      │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  🎬 MOVIE & TV FANS:                                            │
│     • Episode/movie discussion boards                          │
│     • Spoiler-tagged sections                                  │
│     • Fan theories board                                       │
│     • Cast/crew appreciation                                   │
│     • Watchalong event scheduling                              │
│     • Review/rating system                                     │
│     • Genre-appropriate themes                                 │
│                                                                  │
│  📺 ANIME & MANGA:                                              │
│     • Series discussion (episode threads)                      │
│     • Manga chapter discussions                                │
│     • Fan art galleries                                        │
│     • Cosplay showcases                                        │
│     • Merchandise collection sharing                           │
│     • Japanese/anime aesthetic themes                          │
│                                                                  │
│  🎤 MUSIC FANS & STANS:                                         │
│     • Artist/band discussion boards                            │
│     • Concert meetup organization                              │
│     • Setlist/tour tracking                                    │
│     • Fan content sharing                                      │
│     • Trading/collecting boards                                │
│     • Artist-inspired themes                                   │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│  💼 BUSINESS & PROFESSIONAL                                     │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  🚀 STARTUPS & ENTREPRENEURS:                                   │
│     • Pitch/idea feedback boards                               │
│     • Co-founder matching                                      │
│     • Investor networking                                      │
│     • Product launch announcements                             │
│     • Growth hacking tips                                      │
│     • Success story showcases                                  │
│     • Modern/startup themes                                    │
│                                                                  │
│  📈 INVESTING & FINANCE:                                        │
│     • Stock/crypto discussion                                  │
│     • DD (due diligence) sharing                               │
│     • Portfolio showcase                                       │
│     • News/analysis boards                                     │
│     • Educational resources                                    │
│     • Professional/finance themes                              │
│                                                                  │
│  🛍️ E-COMMERCE & SELLERS:                                      │
│     • Product showcase boards                                  │
│     • Seller tips & strategies                                 │
│     • Review/feedback sections                                 │
│     • Marketplace boards                                       │
│     • Shipping/logistics discussion                            │
│     • Shop/retail themes                                       │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│  🏠 LIFESTYLE & HOBBIES                                         │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  🏋️ FITNESS & HEALTH:                                          │
│     • Workout log sharing                                      │
│     • Progress photo boards                                    │
│     • Diet/nutrition sections                                  │
│     • Challenge/accountability groups                          │
│     • Equipment reviews                                        │
│     • Energetic/motivational themes                            │
│                                                                  │
│  🍳 FOOD & COOKING:                                             │
│     • Recipe sharing with ingredients list                     │
│     • Photo galleries of dishes                                │
│     • Cuisine-specific boards                                  │
│     • Restaurant reviews                                       │
│     • Cooking challenge events                                 │
│     • Warm/kitchen themes                                      │
│                                                                  │
│  ✈️ TRAVEL:                                                     │
│     • Destination guides                                       │
│     • Trip report/photo boards                                 │
│     • Travel tips & hacks                                      │
│     • Meetup organization                                      │
│     • Deals/budget travel                                      │
│     • Adventure/wanderlust themes                              │
│                                                                  │
│  🔧 DIY & CRAFTS:                                               │
│     • Project showcase with step-by-step                       │
│     • Tutorial boards                                          │
│     • Tool/material reviews                                    │
│     • Commission/sale boards                                   │
│     • Skill-sharing sections                                   │
│     • Rustic/workshop themes                                   │
│                                                                  │
│  🐾 PETS & ANIMALS:                                             │
│     • Pet photo sharing                                        │
│     • Breed-specific boards                                    │
│     • Health & care advice                                     │
│     • Adoption/rescue section                                  │
│     • Training tips                                            │
│     • Playful/cute themes                                      │
│                                                                  │
│  ══════════════════════════════════════════════════════════════ │
│  🌍 COMMUNITIES & CAUSES                                        │
│  ══════════════════════════════════════════════════════════════ │
│                                                                  │
│  🏘️ LOCAL COMMUNITIES:                                         │
│     • Event listings calendar                                  │
│     • Local business directory                                 │
│     • Neighborhood discussions                                 │
│     • Classified ads                                           │
│     • Lost & found boards                                      │
│     • Community-focused themes                                 │
│                                                                  │
│  ✊ ADVOCACY & CAUSES:                                          │
│     • Campaign organization boards                             │
│     • Resource/education sharing                               │
│     • Event planning                                           │
│     • Volunteer matching                                       │
│     • Success story sharing                                    │
│     • Cause-appropriate themes                                 │
│                                                                  │
│  ⛪ FAITH & SPIRITUALITY:                                       │
│     • Discussion boards by topic                               │
│     • Prayer request sections                                  │
│     • Study group organization                                 │
│     • Event/service announcements                              │
│     • Resource sharing                                         │
│     • Serene/spiritual themes                                  │
│                                                                  │
│  🧘 MENTAL HEALTH & SUPPORT:                                    │
│     • Moderated support boards                                 │
│     • Resource library                                         │
│     • Anonymous posting options                                │
│     • Professional directory                                   │
│     • Progress celebration                                     │
│     • Calming/supportive themes                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 15.5 Community Leader Tools

```
┌─────────────────────────────────────────────────────────────────┐
│              COMMUNITY LEADER DASHBOARD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🎯 GROWTH & ANALYTICS:                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Member growth tracking (daily, weekly, monthly)          │ │
│  │ • Active user metrics (DAU, WAU, MAU)                      │ │
│  │ • Engagement rates (posts, replies, reactions)             │ │
│  │ • Popular content identification                           │ │
│  │ • Member retention analytics                               │ │
│  │ • Traffic sources (referrals, social, direct)              │ │
│  │ • Peak activity times                                      │ │
│  │ • Geographic distribution (optional)                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📢 PROMOTIONAL TOOLS:                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Featured thread spotlights                               │ │
│  │ • Announcement banners (site-wide)                         │ │
│  │ • Welcome messages for new members                         │ │
│  │ • Email digest to subscribers                              │ │
│  │ • Social share cards (auto-generated OG images)            │ │
│  │ • Embed widgets for external sites                         │ │
│  │ • QR codes for easy sharing                                │ │
│  │ • Referral program management                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🎪 EVENT MANAGEMENT:                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Event creation wizard                                    │ │
│  │ • RSVP tracking                                            │ │
│  │ • Event reminders (email/push)                             │ │
│  │ • Recurring events support                                 │ │
│  │ • Event-specific discussion threads                        │ │
│  │ • Calendar integration (Google, iCal)                      │ │
│  │ • Livestream event scheduling                              │ │
│  │ • Post-event feedback collection                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🏆 MEMBER RECOGNITION:                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Custom role/badge creation                               │ │
│  │ • Member of the month spotlight                            │ │
│  │ • Contribution leaderboards                                │ │
│  │ • Anniversary celebrations                                 │ │
│  │ • Special flair for top contributors                       │ │
│  │ • Achievement system configuration                         │ │
│  │ • Custom titles for roles                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🛡️ MODERATION TOOLS:                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Mod queue for reported content                           │ │
│  │ • Auto-moderation rules (keyword filters, spam detection)  │ │
│  │ • User warning/strike system                               │ │
│  │ • Temporary/permanent ban management                       │ │
│  │ • IP ban for severe cases                                  │ │
│  │ • Mod action logs (audit trail)                            │ │
│  │ • Moderator team management                                │ │
│  │ • Custom automod rules                                     │ │
│  │ • AI-assisted moderation (Premium+)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📊 CONTENT MANAGEMENT:                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Bulk content operations                                  │ │
│  │ • Thread pinning/stickying                                 │ │
│  │ • Content scheduling (post later)                          │ │
│  │ • Archive old boards/threads                               │ │
│  │ • Content backup/export                                    │ │
│  │ • Duplicate detection                                      │ │
│  │ • Content migration tools                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 15.6 Engagement Features

```
┌─────────────────────────────────────────────────────────────────┐
│              MEMBER ENGAGEMENT SYSTEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🎮 GAMIFICATION (Forum-Level):                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Forum-specific XP and levels                             │ │
│  │ • Custom achievements (created by owner)                   │ │
│  │ • Leaderboards (daily, weekly, all-time)                   │ │
│  │ • Streaks for daily participation                          │ │
│  │ • Karma/reputation system                                  │ │
│  │ • Level-gated boards (unlock at level X)                   │ │
│  │ • Daily login rewards                                      │ │
│  │ • Challenges & quests                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🗳️ INTERACTIVE FEATURES:                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Polls (single/multiple choice, ranked)                   │ │
│  │ • Surveys with analytics                                   │ │
│  │ • AMAs (Ask Me Anything) with special formatting           │ │
│  │ • Debates (structured pro/con format)                      │ │
│  │ • Contests with voting                                     │ │
│  │ • Predictions/brackets                                     │ │
│  │ • Q&A with best answer selection                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💬 COMMUNICATION:                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Shoutbox (real-time chat widget)                         │ │
│  │ • Thread reactions (beyond upvote/downvote)                │ │
│  │ • @mentions with notifications                             │ │
│  │ • Thread subscriptions (watch for replies)                 │ │
│  │ • Digest emails (daily/weekly summary)                     │ │
│  │ • Push notifications                                       │ │
│  │ • Private messaging between members                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  🎁 REWARDS & INCENTIVES:                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Forum currency (earned through activity)                 │ │
│  │ • Currency shop (spend on cosmetics)                       │ │
│  │ • Giveaway/raffle system                                   │ │
│  │ • Reward codes distribution                                │ │
│  │ • Premium membership rewards                               │ │
│  │ • Referral bonuses                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📅 SCHEDULED CONTENT:                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Weekly discussion threads (auto-post)                    │ │
│  │ • Daily themes/prompts                                     │ │
│  │ • Recurring events                                         │ │
│  │ • Monthly recaps (auto-generated)                          │ │
│  │ • Anniversary posts                                        │ │
│  │ • Seasonal content rotation                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 15.7 Database Schema for Forum Customization

```sql
-- ═══════════════════════════════════════════════════════════════
-- FORUM LAYOUT & ORGANIZATION
-- ═══════════════════════════════════════════════════════════════

-- Forum layout configuration
CREATE TABLE forum_layouts (
  forum_id UUID PRIMARY KEY REFERENCES forums(id) ON DELETE CASCADE,
  -- Sidebar configuration
  sidebar_position VARCHAR(10) DEFAULT 'right',  -- 'left', 'right', 'none'
  sidebar_width INTEGER DEFAULT 300,
  -- Header configuration
  header_style VARCHAR(20) DEFAULT 'standard',  -- 'standard', 'hero', 'minimal', 'banner'
  header_height INTEGER DEFAULT 200,
  show_member_count BOOLEAN DEFAULT true,
  show_online_count BOOLEAN DEFAULT true,
  -- Board list style
  board_list_style VARCHAR(20) DEFAULT 'cards',  -- 'cards', 'list', 'compact', 'grid'
  boards_per_row INTEGER DEFAULT 1,
  show_board_descriptions BOOLEAN DEFAULT true,
  show_board_stats BOOLEAN DEFAULT true,
  -- Thread list style
  thread_list_style VARCHAR(20) DEFAULT 'cards',  -- 'cards', 'list', 'compact'
  threads_per_page INTEGER DEFAULT 25,
  -- Timestamps
  updated_at TIMESTAMP NOT NULL
);

-- Board organization (drag-and-drop ordering)
CREATE TABLE board_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  -- Hierarchy
  parent_category_id UUID REFERENCES board_categories(id),
  display_order INTEGER NOT NULL DEFAULT 0,
  -- Visibility
  is_collapsed_by_default BOOLEAN DEFAULT false,
  is_hidden_from_guests BOOLEAN DEFAULT false,
  -- Customization
  custom_icon VARCHAR(10),  -- Emoji
  custom_icon_url VARCHAR(500),  -- Custom uploaded icon
  accent_color VARCHAR(7),
  header_image_url VARCHAR(500),
  -- Timestamps
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(board_id, forum_id)
);

-- Board categories (for grouping boards)
CREATE TABLE board_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  -- Styling
  icon VARCHAR(10),
  accent_color VARCHAR(7),
  is_collapsed_by_default BOOLEAN DEFAULT false,
  -- Timestamps
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Widget configuration
CREATE TABLE forum_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  -- Widget type
  widget_type VARCHAR(50) NOT NULL,  -- 'online_members', 'stats', 'trending', etc.
  -- Placement
  placement VARCHAR(20) NOT NULL,  -- 'sidebar', 'header', 'footer', 'board_header'
  display_order INTEGER NOT NULL DEFAULT 0,
  -- Configuration
  config JSONB DEFAULT '{}',  -- Widget-specific settings
  -- Visibility
  is_enabled BOOLEAN DEFAULT true,
  visible_to TEXT[] DEFAULT '{all}',  -- '{all}', '{members}', '{premium}', '{mods}'
  -- Timestamps
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- FORUM THEMES
-- ═══════════════════════════════════════════════════════════════

-- Forum themes
CREATE TABLE forum_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  -- Colors
  primary_color VARCHAR(7) NOT NULL,
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  background_color VARCHAR(7),
  text_color VARCHAR(7),
  link_color VARCHAR(7),
  -- Background
  bg_image_url VARCHAR(500),
  bg_video_url VARCHAR(500),
  bg_overlay_opacity DECIMAL(3,2),
  bg_blur INTEGER DEFAULT 0,
  bg_position VARCHAR(20) DEFAULT 'center',
  bg_size VARCHAR(20) DEFAULT 'cover',
  bg_attachment VARCHAR(20) DEFAULT 'fixed',
  -- Cards/Components
  card_bg_color VARCHAR(7),
  card_border_radius INTEGER DEFAULT 12,
  card_shadow VARCHAR(100),
  glassmorphism_enabled BOOLEAN DEFAULT true,
  glassmorphism_blur INTEGER DEFAULT 10,
  -- Typography
  font_family VARCHAR(100),
  font_size_base INTEGER DEFAULT 16,
  heading_font_family VARCHAR(100),
  -- Layout
  layout_style VARCHAR(20) DEFAULT 'cards',
  spacing VARCHAR(20) DEFAULT 'comfortable',
  max_width INTEGER DEFAULT 1200,
  -- Effects
  enable_animations BOOLEAN DEFAULT true,
  parallax_enabled BOOLEAN DEFAULT false,
  custom_cursor_url VARCHAR(500),
  -- Sound (user-toggleable)
  enable_sounds BOOLEAN DEFAULT false,
  notification_sound_url VARCHAR(500),
  -- Advanced (Premium/Enterprise)
  custom_css TEXT,
  custom_js TEXT,
  -- Timestamps
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Preset themes (system-provided)
CREATE TABLE preset_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(30),  -- 'dark', 'light', 'gaming', 'seasonal', etc.
  -- Theme data
  theme_data JSONB NOT NULL,
  -- Display
  preview_image_url VARCHAR(500),
  is_premium BOOLEAN DEFAULT false,
  is_seasonal BOOLEAN DEFAULT false,
  available_from DATE,
  available_until DATE,
  -- Stats
  usage_count INTEGER DEFAULT 0,
  inserted_at TIMESTAMP NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- THREAD CUSTOMIZATION
-- ═══════════════════════════════════════════════════════════════

-- Thread customization
CREATE TABLE thread_styles (
  thread_id UUID PRIMARY KEY REFERENCES threads(id) ON DELETE CASCADE,
  -- Background
  bg_type VARCHAR(20) DEFAULT 'none',
  bg_color VARCHAR(7),
  bg_gradient_start VARCHAR(7),
  bg_gradient_end VARCHAR(7),
  bg_gradient_direction VARCHAR(20),
  bg_pattern VARCHAR(30),
  -- Border
  border_color VARCHAR(7),
  border_width INTEGER DEFAULT 1,
  border_style VARCHAR(20) DEFAULT 'solid',
  border_radius INTEGER DEFAULT 8,
  -- Glow effect
  glow_enabled BOOLEAN DEFAULT false,
  glow_color VARCHAR(7),
  glow_intensity VARCHAR(10),
  glow_animation VARCHAR(20),
  -- Icon
  post_icon VARCHAR(10),
  post_icon_custom_url VARCHAR(500),
  updated_at TIMESTAMP NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- FORUM CONTENT & MEDIA
-- ═══════════════════════════════════════════════════════════════

-- Forum custom emojis
CREATE TABLE forum_emojis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_animated BOOLEAN DEFAULT false,
  category VARCHAR(30),
  uploaded_by UUID REFERENCES users(id),
  inserted_at TIMESTAMP NOT NULL,
  UNIQUE(forum_id, name)
);

-- Forum sticker packs
CREATE TABLE sticker_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID REFERENCES forums(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  cover_image_url VARCHAR(500),
  is_premium BOOLEAN DEFAULT false,
  price_cents INTEGER,
  inserted_at TIMESTAMP NOT NULL
);

CREATE TABLE stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES sticker_packs(id) ON DELETE CASCADE,
  name VARCHAR(30) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_animated BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0
);

-- ═══════════════════════════════════════════════════════════════
-- FORUM TEMPLATES
-- ═══════════════════════════════════════════════════════════════

-- Niche templates
CREATE TABLE forum_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  -- Template content
  default_boards JSONB NOT NULL,
  default_theme JSONB NOT NULL,
  default_widgets JSONB DEFAULT '[]',
  default_settings JSONB NOT NULL,
  -- Display
  preview_image_url VARCHAR(500),
  icon VARCHAR(10),
  category VARCHAR(30),
  subcategory VARCHAR(30),
  -- Features
  included_features TEXT[],
  -- Stats
  usage_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  inserted_at TIMESTAMP NOT NULL
);

-- ═══════════════════════════════════════════════════════════════
-- ENGAGEMENT & GAMIFICATION
-- ═══════════════════════════════════════════════════════════════

-- Forum-specific achievements
CREATE TABLE forum_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  icon_url VARCHAR(500),
  -- Criteria
  criteria_type VARCHAR(50) NOT NULL,
  criteria_value INTEGER NOT NULL,
  criteria_board_id UUID REFERENCES boards(id),
  -- Rewards
  xp_reward INTEGER DEFAULT 0,
  currency_reward INTEGER DEFAULT 0,
  badge_reward_id UUID,
  -- Settings
  is_hidden BOOLEAN DEFAULT false,
  is_repeatable BOOLEAN DEFAULT false,
  max_awards_per_user INTEGER DEFAULT 1,
  inserted_at TIMESTAMP NOT NULL
);

-- Forum currency configuration
CREATE TABLE forum_currencies (
  forum_id UUID PRIMARY KEY REFERENCES forums(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL DEFAULT 'Points',
  icon VARCHAR(10) DEFAULT '💎',
  icon_url VARCHAR(500),
  -- Earning rates
  post_reward INTEGER DEFAULT 1,
  thread_reward INTEGER DEFAULT 5,
  upvote_received_reward INTEGER DEFAULT 1,
  daily_login_reward INTEGER DEFAULT 10,
  -- Settings
  is_enabled BOOLEAN DEFAULT true,
  show_in_profile BOOLEAN DEFAULT true,
  updated_at TIMESTAMP NOT NULL
);

-- Scheduled/recurring content
CREATE TABLE forum_scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  -- Content
  title_template VARCHAR(500) NOT NULL,
  body_template TEXT,
  -- Schedule
  schedule_type VARCHAR(20) NOT NULL,
  schedule_day INTEGER,
  schedule_time TIME NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  -- Settings
  is_enabled BOOLEAN DEFAULT true,
  pin_duration_hours INTEGER,
  last_posted_at TIMESTAMP,
  next_post_at TIMESTAMP,
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Forum events
CREATE TABLE forum_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url VARCHAR(500),
  -- Timing
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP,
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_all_day BOOLEAN DEFAULT false,
  -- Location
  location_type VARCHAR(20),
  location_url VARCHAR(500),
  location_address TEXT,
  -- Settings
  max_attendees INTEGER,
  requires_rsvp BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule VARCHAR(200),
  -- Discussion
  discussion_thread_id UUID REFERENCES threads(id),
  inserted_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- Event RSVPs
CREATE TABLE forum_event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES forum_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'going',
  responded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ═══════════════════════════════════════════════════════════════
-- ANALYTICS
-- ═══════════════════════════════════════════════════════════════

-- Forum analytics (daily snapshots)
CREATE TABLE forum_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- Member metrics
  total_members INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  -- Content metrics
  new_threads INTEGER DEFAULT 0,
  new_posts INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  -- Engagement
  total_reactions INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  inserted_at TIMESTAMP NOT NULL,
  UNIQUE(forum_id, date)
);
```

### 15.8 Frontend Components for Forum Customization

```typescript
// ═══════════════════════════════════════════════════════════════
// FORUM LAYOUT & ORGANIZATION COMPONENTS
// ═══════════════════════════════════════════════════════════════

// Drag-and-Drop Organization
'ForumLayoutBuilder.tsx'         // Main drag-and-drop forum builder
'BoardDragList.tsx'              // Draggable board list with categories
'BoardCategoryEditor.tsx'        // Create/edit board categories
'BoardOrganizer.tsx'             // Organize boards within categories
'BoardCard.tsx'                  // Individual board card in builder
'LayoutPreview.tsx'              // Live preview of layout changes

// Widget System
'WidgetManager.tsx'              // Add/remove/configure widgets
'WidgetPalette.tsx'              // Available widgets to drag
'WidgetConfigurator.tsx'         // Configure individual widget settings
'SidebarEditor.tsx'              // Customize sidebar layout
'HeaderEditor.tsx'               // Customize header layout

// Widget Components (actual widgets)
'OnlineMembersWidget.tsx'        // Show online members
'ForumStatsWidget.tsx'           // Member/post/thread counts
'TrendingThreadsWidget.tsx'      // Hot discussions
'RecentActivityWidget.tsx'       // Latest posts feed
'LeaderboardWidget.tsx'          // Top contributors
'CalendarWidget.tsx'             // Upcoming events
'ShoutboxWidget.tsx'             // Real-time chat widget
'StreamEmbedWidget.tsx'          // Twitch/YouTube embed
'SocialFeedWidget.tsx'           // Twitter/Discord embed
'WelcomeBoxWidget.tsx'           // New visitor greeting
'QuickPollWidget.tsx'            // Sidebar polls
'AnnouncementWidget.tsx'         // Important messages

// ═══════════════════════════════════════════════════════════════
// THEME CUSTOMIZATION COMPONENTS
// ═══════════════════════════════════════════════════════════════

// Theme Builder
'ThemeBuilder.tsx'               // Visual theme editor (main)
'ThemePreview.tsx'               // Live preview of theme changes
'ColorSchemeEditor.tsx'          // Pick colors with live preview
'ColorPicker.tsx'                // Advanced color picker with presets
'GradientBuilder.tsx'            // Create gradients visually
'BackgroundEditor.tsx'           // Configure background (image/video/color)
'TypographyEditor.tsx'           // Font selection and sizing
'CardStyleEditor.tsx'            // Configure card appearance
'GlassmorphismEditor.tsx'        // Glassmorphism effect settings

// Preset Themes
'ThemeGallery.tsx'               // Browse preset themes
'ThemeCard.tsx'                  // Preview card for a theme
'SeasonalThemePicker.tsx'        // Holiday/seasonal themes

// Advanced (Premium)
'CSSEditor.tsx'                  // Custom CSS with syntax highlighting
'AnimationPicker.tsx'            // Choose animation effects
'ParallaxEditor.tsx'             // Configure parallax effects
'SoundManager.tsx'               // Upload/configure forum sounds
'CustomCursorPicker.tsx'         // Custom cursor selection

// ═══════════════════════════════════════════════════════════════
// BOARD CUSTOMIZATION COMPONENTS
// ═══════════════════════════════════════════════════════════════

'BoardCustomizer.tsx'            // Customize board appearance
'BoardIconPicker.tsx'            // Select emoji or upload icon
'BoardColorPicker.tsx'           // Set board accent color
'BoardHeaderEditor.tsx'          // Custom header image for board
'BoardTypeSelector.tsx'          // Choose board type (standard, gallery, Q&A, etc.)
'BoardPermissionEditor.tsx'      // Configure board access

// ═══════════════════════════════════════════════════════════════
// THREAD CUSTOMIZATION COMPONENTS
// ═══════════════════════════════════════════════════════════════

'ThreadStylePicker.tsx'          // Choose thread colors/effects
'PostIconPicker.tsx'             // Select post mood icon
'GlowEffectSelector.tsx'         // Configure glow effects
'ThreadBackgroundPicker.tsx'     // Solid/gradient/pattern backgrounds
'ThreadBorderEditor.tsx'         // Border styling options

// ═══════════════════════════════════════════════════════════════
// CONTENT & MEDIA COMPONENTS
// ═══════════════════════════════════════════════════════════════

// Custom Emojis
'EmojiManager.tsx'               // Upload/manage custom emojis
'EmojiUploader.tsx'              // Bulk emoji upload
'EmojiCategoryEditor.tsx'        // Organize emoji categories
'EmojiPicker.tsx'                // Use custom emojis in posts

// Stickers
'StickerPackManager.tsx'         // Create/manage sticker packs
'StickerUploader.tsx'            // Upload stickers to a pack
'StickerPicker.tsx'              // Use stickers in posts

// ═══════════════════════════════════════════════════════════════
// COMMUNITY LEADER DASHBOARD COMPONENTS
// ═══════════════════════════════════════════════════════════════

// Analytics
'ForumAnalyticsDashboard.tsx'    // Main analytics dashboard
'MemberGrowthChart.tsx'          // Member growth over time
'EngagementMetrics.tsx'          // Posts, replies, reactions
'TrafficSourcesChart.tsx'        // Where visitors come from
'PopularContentList.tsx'         // Top performing threads
'PeakActivityHeatmap.tsx'        // When members are active

// Promotional Tools
'AnnouncementBannerEditor.tsx'   // Create announcement banners
'WelcomeMessageEditor.tsx'       // Customize new member greeting
'SocialSharePreview.tsx'         // Preview OG cards
'EmbedWidgetGenerator.tsx'       // Generate embed codes
'QRCodeGenerator.tsx'            // Generate forum QR codes
'ReferralProgramManager.tsx'     // Manage referral program

// Event Management
'EventCreator.tsx'               // Create new events
'EventCalendar.tsx'              // Calendar view of events
'RSVPManager.tsx'                // Track event RSVPs
'RecurringEventEditor.tsx'       // Set up recurring events

// Member Recognition
'RoleManager.tsx'                // Create/manage custom roles
'MemberSpotlight.tsx'            // Feature member of the month
'AchievementEditor.tsx'          // Create custom achievements
'LeaderboardConfig.tsx'          // Configure leaderboards

// Moderation
'ModQueueDashboard.tsx'          // Review reported content
'AutomodRuleEditor.tsx'          // Create automod rules
'BanManager.tsx'                 // Manage bans and warnings
'ModLogViewer.tsx'               // View moderation history

// ═══════════════════════════════════════════════════════════════
// ENGAGEMENT COMPONENTS
// ═══════════════════════════════════════════════════════════════

// Gamification
'XPSystemConfig.tsx'             // Configure XP earning rates
'LevelEditor.tsx'                // Define levels and rewards
'AchievementManager.tsx'         // Create/manage achievements
'CurrencyConfig.tsx'             // Configure forum currency
'CurrencyShopEditor.tsx'         // Set up currency shop

// Interactive Features
'PollCreator.tsx'                // Create polls
'SurveyBuilder.tsx'              // Build surveys
'ContestManager.tsx'             // Run contests with voting
'AMAManager.tsx'                 // Host Ask Me Anything events
'BracketCreator.tsx'             // Create prediction brackets

// Scheduled Content
'ScheduledPostEditor.tsx'        // Create recurring posts
'ContentCalendar.tsx'            // View/manage scheduled content
'AutoPostConfig.tsx'             // Configure automatic posts

// ═══════════════════════════════════════════════════════════════
// TEMPLATE SELECTION
// ═══════════════════════════════════════════════════════════════

'TemplateSelector.tsx'           // Pick niche template on creation
'TemplateGallery.tsx'            // Browse all templates
'TemplatePreview.tsx'            // Preview template before applying
'TemplateCustomizer.tsx'         // Customize template after selection
```

### 15.9 Forum Customization by Tier

| Feature | Free | Premium | Enterprise |
|---------|------|---------|------------|
| **Forum Creation** | | | |
| Forums allowed | 1 | 5 | Custom/Unlimited |
| Members per forum | Unlimited | Unlimited | Unlimited |
| Boards per forum | 10 | 50 | Unlimited |
| **Layout & Organization** | | | |
| Drag-and-drop organization | ✓ | ✓ | ✓ |
| Board categories | 3 | 10 | Unlimited |
| Board types | Standard only | All types | All types |
| Custom board icons | Emoji only | Emoji + Upload | Emoji + Upload + Animated |
| Sidebar widgets | 3 | 10 | Unlimited |
| Custom widget placement | - | ✓ | ✓ |
| **Themes & Branding** | | | |
| Preset themes | 5 | All (20+) | All + Seasonal |
| Color customization | Basic (5 colors) | Full palette | Full palette |
| Custom logo/banner | ✓ | ✓ | ✓ |
| Background image | - | ✓ | ✓ |
| Background video | - | - | ✓ |
| Custom fonts | - | 10 fonts | Any font |
| Glassmorphism effects | - | ✓ | ✓ |
| Parallax scrolling | - | - | ✓ |
| Custom CSS | - | - | ✓ |
| Custom cursor | - | - | ✓ |
| Sound effects | - | - | ✓ |
| **Thread Styling** | | | |
| Thread colors | 5 colors | Full palette | Full palette |
| Gradient backgrounds | - | ✓ | ✓ |
| Glow effects | - | ✓ | ✓ |
| Animated borders | - | ✓ | ✓ |
| Custom thread icons | Emoji only | + Upload | + Animated |
| **Content & Media** | | | |
| Custom emojis | - | 50 | 500 |
| Animated emojis | - | ✓ | ✓ |
| Sticker packs | - | 5 | Unlimited |
| File upload size | 10MB | 50MB | 100MB |
| **Community Leader Tools** | | | |
| Basic analytics | ✓ | ✓ | ✓ |
| Advanced analytics | - | ✓ | ✓ |
| Traffic sources | - | ✓ | ✓ |
| Export analytics | - | - | ✓ |
| Announcement banners | 1 active | 3 active | Unlimited |
| Scheduled posts | - | 10 | Unlimited |
| Email digests to members | - | ✓ | ✓ |
| Embed widgets | - | ✓ | ✓ |
| **Events & Engagement** | | | |
| Events per month | 3 | 20 | Unlimited |
| Recurring events | - | ✓ | ✓ |
| RSVP tracking | ✓ | ✓ | ✓ |
| Calendar integration | - | ✓ | ✓ |
| Polls per month | 5 | Unlimited | Unlimited |
| Contests/giveaways | - | ✓ | ✓ |
| AMA hosting | - | ✓ | ✓ |
| **Gamification** | | | |
| Basic XP/levels | ✓ | ✓ | ✓ |
| Custom achievements | 5 | 50 | Unlimited |
| Leaderboards | Basic | Advanced | Advanced |
| Forum currency | - | ✓ | ✓ |
| Daily login rewards | - | ✓ | ✓ |
| Level-gated boards | - | ✓ | ✓ |
| **Member Recognition** | | | |
| Custom roles | 5 | 20 | Unlimited |
| Custom role badges | - | ✓ | ✓ |
| Member spotlight | - | ✓ | ✓ |
| Anniversary celebrations | - | ✓ | ✓ |
| **Moderation** | | | |
| Mod team size | 3 | 10 | Unlimited |
| Basic automod | ✓ | ✓ | ✓ |
| Advanced automod rules | - | ✓ | ✓ |
| AI moderation assistance | - | ✓ | ✓ (custom model) |
| Mod action logs | 7 days | 30 days | Unlimited |
| IP banning | - | ✓ | ✓ |
| **Integrations** | | | |
| Discord integration | - | ✓ | ✓ |
| Twitch/YouTube embed | - | ✓ | ✓ |
| Social media widgets | - | ✓ | ✓ |
| API access | - | - | ✓ |
| Webhooks | - | - | ✓ |
| SSO/SAML | - | - | ✓ |

---

## 16. Creator Economy & Monetization (Future)

### Vision

Enable forum owners to **monetize their communities** while keeping the platform sustainable:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATOR ECONOMY FEATURES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  💰 MONETIZATION OPTIONS (Future Roadmap):                      │
│                                                                  │
│  SUBSCRIPTIONS:                                                 │
│  • Premium forum membership tiers                               │
│  • Exclusive boards for subscribers                             │
│  • Subscriber-only badges & flair                               │
│  • Revenue sharing with CGraph                                  │
│                                                                  │
│  DIGITAL GOODS:                                                 │
│  • Sell custom badges                                           │
│  • Sell sticker packs                                           │
│  • Sell avatar frames                                           │
│  • Sell theme packs                                             │
│                                                                  │
│  TIPPING:                                                       │
│  • Tip post authors                                             │
│  • Tip forum owners                                             │
│  • Highlight tipped posts                                       │
│                                                                  │
│  MARKETPLACE:                                                   │
│  • In-forum buy/sell boards                                     │
│  • Escrow for trades (future)                                   │
│  • Commission marketplace for creators                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

CGraph Forums is the **ultimate platform for community leaders** - a Reddit-style social forum network where **anyone can create and customize their own community**:

### Core Features

1. **Unified Identity**: Same username/profile across all of CGraph - join any forum instantly
2. **Tier-Based Creation**: Free (1 forum), Premium (5 forums), Enterprise (custom/unlimited)
3. **Real-Time Everything**: WebSocket-powered live updates, shoutbox, presence
4. **AI Moderation**: Intelligent content moderation assistance (Premium+)

### Forum Customization (The CGraph Difference)

5. **Drag-and-Drop Organization**: Visually arrange boards, categories, and widgets
6. **Rich Theming**: 20+ preset themes, custom colors, backgrounds, glassmorphism, parallax
7. **Widget System**: Add widgets for live streams, stats, events, social feeds, and more
8. **Thread Styling**: Colored threads, glowing borders, custom icons
9. **Custom Content**: Upload emojis, sticker packs, and custom icons

### Community Leader Tools

10. **Analytics Dashboard**: Track growth, engagement, popular content, traffic sources
11. **Event Management**: Create events, track RSVPs, calendar integration
12. **Gamification**: Custom achievements, XP levels, forum currency, leaderboards
13. **Member Recognition**: Custom roles, badges, spotlights, anniversary celebrations
14. **Promotional Tools**: Announcement banners, email digests, embed widgets, QR codes

### 30+ Niche Templates

Optimized for: **Streamers**, **Gamers**, **Writers**, **Artists**, **Musicians**, **Scientists**, **Educators**, **Bloggers**, **Podcasters**, **Fitness**, **DIY/Crafts**, **Entertainment**, **Local Communities**, and many more!

---

### Philosophy

> **"The platform where EVERY community leader feels at home"**

CGraph Forums is built for the **next generation of online communities**:

- **For Streamers**: Embed your live stream, schedule widgets, fan art galleries, subscriber boards
- **For Gamers**: LFG boards, clan recruitment, leaderboards, tournament brackets
- **For Writers**: Chapter organization, beta reader matching, writing prompts, critique sections
- **For Scientists**: Paper discussions, data sharing, methodology Q&A, collaboration matching
- **For Artists**: Gallery-style portfolios, commission marketplaces, WIP sharing
- **For Educators**: Course organization, student Q&A, progress tracking, resource libraries
- **For ANY Niche**: If you have a community, CGraph has the tools for you

We combine the **customization power of classic forums** (MyBB, vBulletin, phpBB) with **modern technology**:
- ✨ Drag-and-drop simplicity
- ⚡ Real-time everything
- 🤖 AI-powered moderation
- 📱 Mobile-first design
- 🎨 No coding required (but available for power users)

---

### Implementation Phases

| Phase | Features |
|-------|----------|
| **v1.0** | Core forums with WebSocket integration, basic organization |
| **v1.1** | AI moderation, analytics dashboard |
| **v1.2** | Drag-and-drop builder, widget system |
| **v1.3** | Theme builder, custom emojis, thread styling |
| **v1.4** | Full niche templates library, gamification system |
| **v1.5** | Event management, scheduled posts, advanced engagement |
| **v2.0** | Enterprise features, API access, creator economy |

---

*Document Version: 1.3.0*
*Last Updated: January 2026*
*Focus: Forum-level customization and community leader tools*
