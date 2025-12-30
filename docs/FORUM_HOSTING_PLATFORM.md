# CGraph Forum Hosting Platform

## Overview

CGraph combines the best of two worlds:
1. **MyBB-style Forum Hosting**: Users can create fully-featured forums with boards, threads, posts, themes, plugins, and complete customization
2. **Reddit-style Discovery**: A discovery feed where users browse, vote on, and discover new forums created by other users

This creates a unique platform where forums compete for attention, and the best communities rise to the top.

---

## Architecture

### Core Concepts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CGraph Platform                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    DISCOVERY LAYER (Reddit-style)                     │   │
│  │                                                                        │   │
│  │  • Browse all forums by Hot/Top/New/Rising                            │   │
│  │  • Upvote/Downvote forums                                             │   │
│  │  • Forum leaderboards & competitions                                  │   │
│  │  • Categories: Gaming, Tech, Art, Music, etc.                         │   │
│  │  • Featured forums & trending                                          │   │
│  │                                                                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    FORUM INSTANCES (MyBB-style)                       │   │
│  │                                                                        │   │
│  │  Each forum is a complete, self-contained community:                  │   │
│  │                                                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │   │
│  │  │  Forum A    │  │  Forum B    │  │  Forum C    │                   │   │
│  │  │ (Gaming)    │  │ (Tech)      │  │ (Art)       │                   │   │
│  │  │             │  │             │  │             │                   │   │
│  │  │ • Boards    │  │ • Boards    │  │ • Boards    │                   │   │
│  │  │ • Threads   │  │ • Threads   │  │ • Threads   │                   │   │
│  │  │ • Members   │  │ • Members   │  │ • Members   │                   │   │
│  │  │ • Themes    │  │ • Themes    │  │ • Themes    │                   │   │
│  │  │ • Plugins   │  │ • Plugins   │  │ • Plugins   │                   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │   │
│  │                                                                        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### Forum (User-Created Community)

```elixir
# The main forum entity - represents a complete MyBB-style forum
schema "forums" do
  # Basic Info
  field :name, :string                    # "GamersUnite"
  field :slug, :string                    # "gamers-unite"
  field :title, :string                   # "Gamers Unite - Your Gaming Community"
  field :description, :string
  field :tagline, :string                 # Short description for cards
  
  # Branding
  field :icon_url, :string                # Forum icon (like subreddit icon)
  field :banner_url, :string              # Header banner
  field :favicon_url, :string             # Custom favicon
  field :logo_url, :string                # Full logo
  
  # Theming (MyBB-style)
  field :theme_id, :binary_id             # Selected theme
  field :custom_css, :string              # User-provided CSS
  field :custom_header_html, :string      # Custom header HTML
  field :custom_footer_html, :string      # Custom footer HTML
  field :primary_color, :string           # Theme primary color
  field :secondary_color, :string         # Theme secondary color
  field :font_family, :string             # Custom font
  
  # Settings
  field :is_public, :boolean              # Can anyone view?
  field :is_nsfw, :boolean                # Adult content
  field :require_approval, :boolean       # New members need approval
  field :registration_open, :boolean      # Can new users register?
  field :posting_requires_account, :boolean
  
  # Forum voting (Reddit-style discovery)
  field :score, :integer                  # upvotes - downvotes
  field :upvotes, :integer
  field :downvotes, :integer
  field :hot_score, :float                # For hot ranking
  field :weekly_score, :integer           # Weekly competition
  field :monthly_score, :integer          # Monthly competition
  field :featured, :boolean               # Admin-featured
  field :verified, :boolean               # Verified community
  
  # Stats
  field :member_count, :integer
  field :thread_count, :integer
  field :post_count, :integer
  field :active_users_today, :integer
  
  # Discovery categorization
  field :category, :string                # gaming, tech, art, music, etc.
  field :tags, {:array, :string}          # Additional tags
  
  # Subscription tier
  field :tier, :string                    # free, basic, pro, enterprise
  
  belongs_to :owner, User
  has_many :boards, Board                 # Forum categories/boards
  has_many :forum_members, ForumMember    # Forum-specific memberships
  has_many :forum_votes, ForumVote        # Discovery votes
  has_many :forum_themes, ForumTheme      # Available themes
  has_many :forum_plugins, ForumPlugin    # Installed plugins
  has_many :moderator_logs, ModeratorLog
end
```

### Board (Forum Section/Category)

```elixir
# Boards are sections within a forum (like MyBB's "Forums")
schema "boards" do
  field :name, :string                    # "General Discussion"
  field :slug, :string                    # "general-discussion"
  field :description, :string
  field :icon, :string                    # Icon or emoji
  field :position, :integer               # Display order
  
  # Permissions
  field :is_locked, :boolean              # No new threads
  field :is_hidden, :boolean              # Only visible to certain groups
  field :min_posts_to_post, :integer      # Required post count
  field :min_reputation_to_post, :integer
  
  # Stats
  field :thread_count, :integer
  field :post_count, :integer
  field :last_post_at, :utc_datetime
  
  belongs_to :forum, Forum
  belongs_to :parent_board, Board         # For sub-boards
  has_many :sub_boards, Board             # Child boards
  has_many :threads, Thread
  has_many :board_permissions, BoardPermission
end
```

### Thread (Discussion Topic)

```elixir
schema "threads" do
  field :title, :string
  field :slug, :string
  field :content, :string                 # First post content
  field :content_html, :string            # Rendered HTML
  
  # Thread type
  field :thread_type, :string             # normal, sticky, announcement, poll
  
  # Status
  field :is_locked, :boolean              # No new replies
  field :is_pinned, :boolean              # Sticky
  field :is_hidden, :boolean              # Soft delete
  field :is_approved, :boolean            # Moderation queue
  
  # Prefix/Tags (MyBB-style)
  field :prefix, :string                  # [SOLVED], [HELP], etc.
  field :prefix_color, :string
  
  # Stats
  field :view_count, :integer
  field :reply_count, :integer
  field :last_post_at, :utc_datetime
  
  # Voting (optional, for Reddit-style threads)
  field :score, :integer
  field :upvotes, :integer
  field :downvotes, :integer
  
  belongs_to :board, Board
  belongs_to :author, User
  belongs_to :last_poster, User
  has_many :posts, Post                   # Replies
  has_one :poll, Poll
end
```

### Post (Reply)

```elixir
schema "posts" do
  field :content, :string                 # BBCode/Markdown
  field :content_html, :string            # Rendered HTML
  field :is_edited, :boolean
  field :edit_count, :integer
  field :edit_reason, :string
  
  # Moderation
  field :is_hidden, :boolean
  field :is_approved, :boolean
  field :reported_count, :integer
  
  # Features
  field :attachments, {:array, :map}      # File attachments
  
  # Voting
  field :score, :integer
  field :upvotes, :integer
  field :downvotes, :integer
  
  belongs_to :thread, Thread
  belongs_to :author, User
  belongs_to :reply_to, Post              # Quote reply
end
```

### ForumMember (Forum-Specific Membership)

```elixir
schema "forum_members" do
  field :display_name, :string            # Forum-specific display name
  field :title, :string                   # Custom user title
  field :signature, :string               # Forum signature
  field :avatar_url, :string              # Forum-specific avatar
  
  # Stats (forum-specific)
  field :post_count, :integer
  field :thread_count, :integer
  field :reputation, :integer             # MyBB-style reputation
  field :reputation_received, :integer
  field :reputation_given, :integer
  
  # Permissions
  field :role, :string                    # member, moderator, admin
  field :user_group_id, :binary_id        # Forum user group
  
  # Status
  field :is_banned, :boolean
  field :ban_reason, :string
  field :ban_expires_at, :utc_datetime
  
  belongs_to :forum, Forum
  belongs_to :user, User
  belongs_to :user_group, ForumUserGroup
end
```

### ForumUserGroup (MyBB-style User Groups)

```elixir
schema "forum_user_groups" do
  field :name, :string                    # "Moderators", "VIP Members"
  field :color, :string                   # Username color
  field :icon, :string                    # Group icon/badge
  field :is_staff, :boolean               # Staff indicator
  field :is_default, :boolean             # Default group for new members
  
  # Permissions (MyBB-style granular permissions)
  field :can_view_boards, :boolean
  field :can_create_threads, :boolean
  field :can_reply, :boolean
  field :can_edit_own_posts, :boolean
  field :can_delete_own_posts, :boolean
  field :can_upload_attachments, :boolean
  field :can_use_signature, :boolean
  field :can_give_reputation, :boolean
  field :can_receive_reputation, :boolean
  field :can_view_profiles, :boolean
  field :can_send_pm, :boolean
  
  # Moderation permissions
  field :can_moderate, :boolean
  field :can_edit_posts, :boolean
  field :can_delete_posts, :boolean
  field :can_move_threads, :boolean
  field :can_lock_threads, :boolean
  field :can_ban_users, :boolean
  field :can_manage_users, :boolean
  
  # Limits
  field :max_attachments_per_post, :integer
  field :max_attachment_size_kb, :integer
  field :max_signature_length, :integer
  field :post_flood_limit_seconds, :integer
  
  belongs_to :forum, Forum
  has_many :members, ForumMember
end
```

### ForumTheme (Customizable Themes)

```elixir
schema "forum_themes" do
  field :name, :string
  field :description, :string
  field :thumbnail_url, :string
  field :css, :string                     # Full CSS
  field :variables, :map                  # CSS variables
  field :is_default, :boolean
  field :is_official, :boolean            # CGraph official theme
  
  belongs_to :forum, Forum
  belongs_to :parent_theme, ForumTheme    # Based on another theme
end
```

### ForumPlugin (Plugin System)

```elixir
schema "forum_plugins" do
  field :plugin_id, :string               # Unique plugin identifier
  field :name, :string
  field :description, :string
  field :version, :string
  field :author, :string
  field :is_enabled, :boolean
  field :settings, :map                   # Plugin configuration
  
  # Plugin type
  field :plugin_type, :string             # widget, moderation, integration, theme
  
  belongs_to :forum, Forum
end
```

### Subscription (Paid Tiers)

```elixir
schema "subscriptions" do
  field :tier, :string                    # free, basic, pro, enterprise
  field :status, :string                  # active, cancelled, expired
  field :forums_allowed, :integer         # Number of forums
  field :current_period_start, :utc_datetime
  field :current_period_end, :utc_datetime
  field :stripe_subscription_id, :string
  
  belongs_to :user, User
end
```

---

## Subscription Tiers

| Feature | Free | Basic ($5/mo) | Pro ($15/mo) | Enterprise ($50/mo) |
|---------|------|---------------|--------------|---------------------|
| Forums Allowed | 1 | 3 | 10 | Unlimited |
| Custom Domain | ❌ | ❌ | ✅ | ✅ |
| Remove CGraph Branding | ❌ | ❌ | ✅ | ✅ |
| Custom CSS | Limited | Full | Full | Full |
| Custom Themes | 1 | 5 | Unlimited | Unlimited |
| Plugins | 3 | 10 | Unlimited | Unlimited |
| Storage | 100MB | 1GB | 10GB | 100GB |
| Members | 100 | 1,000 | 10,000 | Unlimited |
| Analytics | Basic | Advanced | Advanced | Enterprise |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ | ✅ |
| SSO Integration | ❌ | ❌ | ❌ | ✅ |

---

## Discovery Feed (Reddit-style)

The main discovery page shows user-created forums like Reddit shows subreddits/posts:

### Sort Options
- **Hot**: Score weighted by recency (Reddit's hot algorithm)
- **Top**: Highest score (all time, this year, month, week, today)
- **New**: Most recently created
- **Rising**: Gaining votes quickly
- **Trending**: Most activity growth

### Categories
- Gaming
- Technology
- Art & Design
- Music
- Sports
- Science
- Entertainment
- Education
- Business
- Lifestyle
- Other

### Forum Cards (Discovery View)
```
┌─────────────────────────────────────────────────────────────────┐
│ [↑]                                                              │
│ [842]  [ICON] GamersUnite                    ⭐ Featured         │
│ [↓]         Your Ultimate Gaming Community                       │
│                                                                   │
│        🎮 Gaming • 15,342 members • 2,341 active now             │
│                                                                   │
│        Popular boards: General, PC Gaming, Console, Esports      │
│                                                                   │
│        [Join Forum]  [Browse]  [Share]                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Flow

### Creating a Forum

1. User clicks "Create Forum"
2. Enters basic info:
   - Forum name
   - Category
   - Description
   - Initial boards (templates available)
3. Chooses a theme (or starts with default)
4. Forum is created and listed on discovery
5. Owner can customize via Admin CP

### Joining a Forum

1. User discovers forum via:
   - Discovery feed
   - Search
   - Direct link
   - Invitation
2. Clicks "Join Forum"
3. (If required) Answers membership questions
4. (If required) Waits for approval
5. Becomes a forum member

### Forum Admin CP

Owners access a MyBB-style Admin Control Panel:

- **Dashboard**: Stats, recent activity, quick actions
- **Configuration**: Settings, permissions, registration
- **Boards**: Create/manage boards and sub-boards
- **Users**: Manage members, groups, bans
- **Templates & Themes**: Customize appearance
- **Plugins**: Install and configure plugins
- **Tools**: Backups, maintenance, logs

---

## API Endpoints

### Discovery
- `GET /api/v1/discover` - Discovery feed with sort/filter
- `GET /api/v1/discover/categories` - List categories
- `GET /api/v1/discover/trending` - Trending forums
- `POST /api/v1/forums/:id/vote` - Vote on forum

### Forum Management
- `POST /api/v1/forums` - Create forum
- `GET /api/v1/forums/:slug` - Get forum details
- `PUT /api/v1/forums/:id` - Update forum
- `DELETE /api/v1/forums/:id` - Delete forum
- `GET /api/v1/forums/:id/stats` - Forum statistics

### Boards
- `GET /api/v1/forums/:id/boards` - List boards
- `POST /api/v1/forums/:id/boards` - Create board
- `PUT /api/v1/boards/:id` - Update board
- `DELETE /api/v1/boards/:id` - Delete board

### Threads
- `GET /api/v1/boards/:id/threads` - List threads
- `POST /api/v1/boards/:id/threads` - Create thread
- `GET /api/v1/threads/:id` - Get thread with posts
- `PUT /api/v1/threads/:id` - Update thread
- `DELETE /api/v1/threads/:id` - Delete thread

### Posts
- `GET /api/v1/threads/:id/posts` - List posts (paginated)
- `POST /api/v1/threads/:id/posts` - Create reply
- `PUT /api/v1/posts/:id` - Edit post
- `DELETE /api/v1/posts/:id` - Delete post
- `POST /api/v1/posts/:id/vote` - Vote on post

### Membership
- `POST /api/v1/forums/:id/join` - Join forum
- `DELETE /api/v1/forums/:id/membership` - Leave forum
- `GET /api/v1/forums/:id/members` - List members
- `PUT /api/v1/forums/:id/members/:user_id` - Update member

### Themes & Plugins
- `GET /api/v1/forums/:id/themes` - List available themes
- `POST /api/v1/forums/:id/themes` - Install theme
- `PUT /api/v1/forums/:id/themes/:id` - Update theme
- `GET /api/v1/plugins` - List available plugins
- `POST /api/v1/forums/:id/plugins` - Install plugin

### Subscriptions
- `GET /api/v1/subscriptions` - Get user subscription
- `POST /api/v1/subscriptions` - Create subscription
- `PUT /api/v1/subscriptions` - Update subscription
- `DELETE /api/v1/subscriptions` - Cancel subscription

---

## Implementation Status

### Phase 1: Core Forum Structure ✅ COMPLETE
- [x] Forum schema with voting fields
- [x] Board schema (forum categories) - `Cgraph.Forums.Board`
- [x] Thread schema - `Cgraph.Forums.Thread`
- [x] Post schema (replies) - `Cgraph.Forums.ThreadPost`
- [x] Forum membership - `Cgraph.Forums.ForumMember`
- [x] Basic CRUD operations in `Cgraph.Forums` context
- [x] Board controller and routes
- [x] Thread controller and routes
- [x] Post controller and routes

### Phase 2: Discovery System ✅ COMPLETE
- [x] Forum voting (upvote/downvote)
- [x] Leaderboard API
- [x] Discovery feed with sorting (hot, top, new, rising)
- [x] Categories and tags
- [x] Hot score algorithm

### Phase 3: Forum Features ✅ COMPLETE
- [x] User groups and permissions - `Cgraph.Forums.ForumUserGroup`
- [x] Thread prefixes - migration created
- [x] Post voting - `Cgraph.Forums.PostVote`
- [x] Thread voting - `Cgraph.Forums.ThreadVote`
- [x] Reputation system - `reputation_entries` table
- [x] Moderation queue support
- [x] Warning system - `forum_warnings` table
- [x] Moderation logs - `forum_mod_logs` table

### Phase 4: Customization ✅ COMPLETE
- [x] Theme system - `Cgraph.Forums.ForumTheme`
- [x] Custom CSS support in Forum schema
- [x] Plugin architecture - `Cgraph.Forums.ForumPlugin`
- [x] Forum branding (logo, favicon, colors)
- [x] Announcements - `Cgraph.Forums.ForumAnnouncement`

### Phase 5: Subscription System 🔄 IN PROGRESS
- [x] Subscription table created
- [x] Tier field on forums
- [ ] Stripe integration
- [ ] Billing portal
- [ ] Usage limit enforcement

### Phase 6: Advanced Features 🔄 IN PROGRESS
- [x] Polls - `Cgraph.Forums.ThreadPoll`, `Cgraph.Forums.PollVote`
- [x] File attachments - `Cgraph.Forums.ThreadAttachment`
- [ ] Full-text search
- [ ] Email notifications
- [ ] Real-time updates (WebSocket)

---

## Database Tables Created

The following tables have been created for the forum hosting platform:

| Table | Description | Status |
|-------|-------------|--------|
| `forums` | Main forum entities | ✅ Extended |
| `boards` | Forum sections/categories | ✅ Created |
| `threads` | Discussion topics | ✅ Created |
| `thread_posts` | Thread replies | ✅ Created |
| `forum_members` | Forum memberships | ✅ Created |
| `forum_user_groups` | Permission groups | ✅ Created |
| `forum_votes` | Forum upvotes/downvotes | ✅ Created |
| `thread_votes` | Thread upvotes/downvotes | ✅ Created |
| `post_votes` | Post upvotes/downvotes | ✅ Created |
| `forum_themes` | Custom themes | ✅ Created |
| `forum_plugins` | Installed plugins | ✅ Created |
| `forum_announcements` | Forum announcements | ✅ Created |
| `thread_attachments` | File attachments | ✅ Created |
| `thread_polls` | Thread polls | ✅ Created |
| `poll_votes` | Poll responses | ✅ Created |
| `reputation_entries` | Reputation system | ✅ Created |
| `forum_warnings` | User warnings | ✅ Created |
| `forum_mod_logs` | Moderation logs | ✅ Created |
| `thread_prefixes` | Thread tags/prefixes | ✅ Created |
| `subscriptions` | Paid subscriptions | ✅ Created |

---

## Technical Considerations

### Multi-tenancy
Each forum is a logical tenant with:
- Isolated data (boards, threads, posts)
- Separate member lists
- Custom settings and theming
- Individual permissions

### Performance
- Denormalized counters for stats
- Hot score caching
- Pagination for all lists
- CDN for user uploads

### Security
- Sanitized custom CSS/HTML
- Rate limiting
- Spam detection
- Report system

---

## Related Documents
- [API Reference](./API_REFERENCE.md)
- [Architecture](./ARCHITECTURE.md)
- [Database Schema](./DATABASE.md)
- [Frontend Guide](./FRONTEND.md)
