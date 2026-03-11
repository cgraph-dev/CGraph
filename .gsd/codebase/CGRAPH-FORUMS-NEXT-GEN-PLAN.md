# CGraph Forums: Next-Generation Transformation Plan
**Status:** Strategic Framework v1.0  
**Date:** March 11, 2026  
**Scope:** Complete forum redesign from Reddit-like to enterprise-grade community platform  

---

## EXECUTIVE SUMMARY

Your current forums operate on a **Reddit-like threaded model** (flat/linear). The reference platforms (EpicNPC, elitepvpers, LeakForum, MMO-Champion) demonstrate a different paradigm: **categorized board-based hierarchies with rich personalization, reputation visibility, and identity persistence across communities**.

**Core Innovation:** Instead of repeating Discord's "one identity per community" model, CGraph will implement a **persistent, cross-platform identity system** where users carry verifiable history, titles, badges, and nameplates across ALL forums, groups, and DMs—showing their cumulative reputation and status anywhere they go.

This document details:
1. **Architecture transformation** (schema, database changes)
2. **10 forum themes** with design system integration
3. **340 cosmetic assets** (borders, badges, titles, nameplates, customization)
4. **Nameplate system** (game-inspired, LoL/Wild Rift/Mobile Legends design)
5. **Implementation roadmap** (phased, backend-first)
6. **Mobile/Web parity strategy** with optimization considerations

---

## PART 1: FORUM ARCHITECTURE TRANSFORMATION

### Current State (Reddit-like)
```
Forum (container)
├── Thread (flat list)
│   ├── Post
│   ├── Post
│   └── Post (nested replies)
```

**Problems:**
- No board hierarchy or organization
- No visual identity/personalization
- No sticky features, colored thread titles, or advanced moderation
- Reputation invisible across contexts
- Mobile/Web feature mismatch

### Target State (Enterprise Forum)
```
Forum
├── Board (category)
│   ├── Subcategory (optional)
│   ├── Thread
│   │   ├── Sticky (up to 3)
│   │   ├── Announcement (mod-pinned)
│   │   ├── Post (with user identity card)
│   │   │   ├── Nameplate (title + badge + border)
│   │   │   ├── Badges (row of cosmetics)
│   │   │   ├── Titles (active title display)
│   │   │   └── Reputation (votes, post count, joins)
│   │   └── Reply-to-Post (nested 1-2 levels)
│   └── Locked/Archived Threads
└── Global Filters/RSS
```

---

## PART 2: DATABASE SCHEMA ADDITIONS

### New Tables Required

```sql
-- Forum Structure (Enhanced)
CREATE TABLE forum_boards (
  id BIGINT PRIMARY KEY,
  forum_id BIGINT NOT NULL REFERENCES forums(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  icon_url VARCHAR(500),
  color HEX, -- board-specific accent color
  parent_board_id BIGINT REFERENCES forum_boards(id), -- for subcategories
  visibility ENUM ('public', 'private', 'restricted'),
  created_at TIMESTAMP,
  INDEX(forum_id, display_order)
);

CREATE TABLE forum_threads (
  id BIGINT PRIMARY KEY,
  board_id BIGINT NOT NULL REFERENCES forum_boards(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500),
  color HEX, -- colored thread title (optional)
  icon_emoji VARCHAR(20), -- thread icon
  is_sticky BOOLEAN DEFAULT FALSE,
  sticky_order INTEGER, -- 1-3 for multiple stickies
  is_announcement BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  post_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP,
  created_at TIMESTAMP,
  INDEX(board_id, is_sticky DESC, last_activity_at DESC),
  FULL TEXT(title)
);

CREATE TABLE forum_posts (
  id BIGINT PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES forum_threads(id),
  user_id BIGINT NOT NULL REFERENCES users(id),
  parent_post_id BIGINT REFERENCES forum_posts(id), -- for nested replies
  content TEXT NOT NULL,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  reaction_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  INDEX(thread_id, created_at),
  INDEX(user_id, created_at)
);

-- User Identity & Cosmetics (New!)
CREATE TABLE user_nameplates (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
  active_nameplate_id BIGINT REFERENCES cosmetic_nameplates(id),
  active_badge_ids JSONB, -- array of up to 5 active badge IDs
  active_title_id BIGINT REFERENCES cosmetic_titles(id),
  active_border_id BIGINT REFERENCES cosmetic_avatar_borders(id),
  active_frame_id BIGINT REFERENCES cosmetic_profile_frames(id),
  visible_in_forums BOOLEAN DEFAULT TRUE,
  visible_in_groups BOOLEAN DEFAULT TRUE,
  visible_in_dms BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE cosmetic_nameplates (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(50), -- what shows on profile (e.g., "Valorant Agent")
  description TEXT,
  rarity ENUM ('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  background_gradient_start HEX,
  background_gradient_end HEX,
  text_color HEX,
  border_style VARCHAR(50), -- 'solid', 'gradient', 'neon', 'holographic'
  icon_url VARCHAR(500),
  animation_type ENUM ('none', 'glow', 'pulse', 'shimmer') DEFAULT 'none',
  theme_id BIGINT REFERENCES forum_themes(id), -- which theme it belongs to
  is_purchasable BOOLEAN DEFAULT TRUE,
  price_nodes DECIMAL(10, 2),
  is_seasonal BOOLEAN DEFAULT FALSE,
  season_expires_at TIMESTAMP,
  created_at TIMESTAMP
);

CREATE TABLE cosmetic_avatar_borders (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  rarity ENUM ('common', 'rare', 'epic', 'legendary'),
  image_url VARCHAR(500), -- SVG or optimized PNG
  animation_type ENUM ('none', 'glow', 'rotate', 'pulse'),
  color HEX,
  thickness_px INTEGER DEFAULT 2,
  theme_id BIGINT REFERENCES forum_themes(id),
  price_nodes DECIMAL(10, 2),
  created_at TIMESTAMP
);

CREATE TABLE cosmetic_badges (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon_url VARCHAR(500),
  rarity ENUM ('common', 'rare', 'epic', 'legendary'),
  badge_type ENUM ('achievement', 'role', 'status', 'seasonal') DEFAULT 'achievement',
  description TEXT,
  theme_id BIGINT REFERENCES forum_themes(id),
  is_unlockable BOOLEAN DEFAULT TRUE,
  unlock_condition JSONB, -- e.g., {"type": "posts_count", "value": 100}
  price_nodes DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP
);

CREATE TABLE cosmetic_titles (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  text_color HEX,
  rarity ENUM ('common', 'rare', 'epic', 'legendary'),
  is_custom BOOLEAN DEFAULT FALSE, -- user-submitted
  theme_id BIGINT REFERENCES forum_themes(id),
  price_nodes DECIMAL(10, 2),
  created_at TIMESTAMP
);

CREATE TABLE cosmetic_profile_frames (
  id BIGINT PRIMARY KEY,
  name VARCHAR(100),
  border_style VARCHAR(50),
  background_pattern VARCHAR(50),
  color_primary HEX,
  color_secondary HEX,
  theme_id BIGINT REFERENCES forum_themes(id),
  rarity ENUM ('common', 'rare', 'epic', 'legendary'),
  price_nodes DECIMAL(10, 2),
  created_at TIMESTAMP
);

CREATE TABLE forum_themes (
  id BIGINT PRIMARY KEY,
  forum_id BIGINT NOT NULL REFERENCES forums(id),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  base_color HEX,
  accent_color HEX,
  secondary_color HEX,
  background_style ENUM ('solid', 'gradient', 'pattern', 'image') DEFAULT 'solid',
  background_image_url VARCHAR(500),
  css_custom_properties JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  theme_index INTEGER (0-9), -- 10 themes max
  created_at TIMESTAMP,
  INDEX(forum_id, is_default DESC)
);

CREATE TABLE user_cosmetic_inventory (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  cosmetic_type ENUM ('nameplate', 'badge', 'border', 'title', 'frame'),
  cosmetic_id BIGINT NOT NULL,
  acquired_at TIMESTAMP,
  expires_at TIMESTAMP, -- for seasonal items
  PRIMARY KEY(user_id, cosmetic_type, cosmetic_id),
  INDEX(user_id, cosmetic_type)
);

CREATE TABLE forum_thread_tags (
  id BIGINT PRIMARY KEY,
  thread_id BIGINT NOT NULL REFERENCES forum_threads(id),
  tag_name VARCHAR(50) NOT NULL,
  tag_color HEX NULLABLE,
  created_at TIMESTAMP,
  UNIQUE(thread_id, tag_name)
);

CREATE TABLE user_reputation_scores (
  id BIGINT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id),
  forum_id BIGINT NOT NULL REFERENCES forums(id),
  total_posts BIGINT DEFAULT 0,
  total_reactions BIGINT DEFAULT 0,
  helpful_count BIGINT DEFAULT 0, -- manual mod award
  verified_seller BOOLEAN DEFAULT FALSE,
  reputation_level ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond'),
  last_calculated_at TIMESTAMP,
  INDEX(forum_id, reputation_level)
);
```

---

## PART 3: COSMETICS LIBRARY (340 ASSETS)

### 1. Forum Themes (10 Total)

| Theme | Description | Primary Colors | Vibe |
|-------|-------------|-----------------|------|
| **Neon Cyber** | Dark with neon accents, glowing effects | #00FF00, #FF006E, #000000 | Futuristic hacker aesthetic |
| **Royal Gold** | Deep purples + gold trim | #4B0082, #FFD700, #1A0033 | Premium, corporate |
| **Midnight Ocean** | Dark blues + teal accents | #001F3F, #00CCFF, #003D5C | Calm, professional |
| **Sakura Blossom** | Soft pinks + whites + gold | #FFB6D9, #FFFFFF, #C8A2D0 | Asian-inspired, serene |
| **Lava Flow** | Reds + oranges + blacks | #FF4500, #FFD700, #1C0000 | Energy, gaming |
| **Forest Mist** | Greens + grays + earth tones | #2D5016, #87CEEB, #8B7355 | Natural, grounded |
| **Retro Arcade** | Pixel-art inspired, 80s colors | #FF00FF, #00FFFF, #111111 | Nostalgic gaming |
| **Ethereal Dream** | Purples + silvers + whites | #9D4EDD, #E0AAFF, #3C096C | Mystical, gradient-heavy |
| **Cyberpunk Metro** | High contrast blacks + neons + chrome | #00D9FF, #FF006E, #0A0E27 | Edgy, modern gaming |
| **Zen Garden** | Muted neutrals + accents | #6B5B4D, #B8860B, #F5F5DC | Minimalist, balanced |

**Theme System:**
- Each theme ships with matching borders, badges, titles, nameplates
- Custom CSS variables in `forum_themes.css_custom_properties`
- Light/Dark mode support per theme
- Accessible color contrast (WCAG AA minimum)

### 2. Avatar Borders (42 Total)

**Categories:**

| Category | Count | Examples |
|----------|-------|----------|
| **Elemental** | 6 | Fire Ring, Ice Crystal, Thunderbolt, Nature, Toxic Green, Cosmic |
| **Ranked/Tier** | 12 | Bronze/Silver/Gold/Platinum/Diamond x2 (standard + animated) + Legendary x2 |
| **Game Inspired** | 10 | LoL summoner frames, Valorant ranks, Wild Rift style, Naraka vibes |
| **Seasonal** | 8 | Halloween pumpkin, Christmas snow, Valentine hearts, Spring blossoms x2, Summer sun, Holiday |
| **Exclusive** | 6 | Early founder, OG member (beta tester), Verified seller, Content creator, Moderator, Admin |

**Nameplate Implementation Example (LoL-inspired):**
```typescript
// Avatar border with gradient animation
<div class="avatar-border border-valorant-immortal">
  <img src="user.avatar" alt="user" />
</div>

// CSS
.border-valorant-immortal {
  border: 3px solid;
  background: linear-gradient(135deg, #b51ef7, #d939ef);
  animation: glow-pulse 2s ease-in-out infinite;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(181, 30, 247, 0.6);
}
```

### 3. Badges (70 Total)

**Categories:**

| Category | Count | Examples |
|----------|-------|----------|
| **Achievement** | 20 | First post, 100 posts, 1000 posts, Helpful contributor, Verified, Streamer, Developer, etc. |
| **Role-Based** | 10 | Moderator, Admin, Senior Moderator, Verified Seller, Creator, Bot, System, VIP, Premium, Trusted |
| **Status** | 15 | Online, Away, Do Not Disturb, Verified Email, Phone Verified, 2FA Enabled, Community Leader, Rising Star, Respected, etc. |
| **Seasonal** | 15 | Halloween 2026, Christmas 2026, New Year 2027, Spring Festival, etc. (rotated) |
| **Exclusive** | 10 | Beta Tester, Founding Member, 1-Year Member, Legendary Status, Hall of Fame, Content Creator, Speaker Badge, Partner |

**Example Badge Layout (Profile Card):**
```
┌─────────────────────────────────┐
│  [👤 Avatar with Border]        │
│  ★ Username                     │
│  [Crown] [Verified] [🎮] [🔥]  │  ← Badges (max 5 shown)
│  "Your Title Here" (title)      │
│  Level 42 | 2,547 Posts         │
│  ▰▰▰▰▰ Reputation: GOLD         │
│  Last seen: 2 hours ago         │
└─────────────────────────────────┘
```

### 4. Titles (70 Total)

**Categories:**

| Category | Count | Format |
|----------|-------|--------|
| **Achievement** | 15 | "Post Master", "Knowledge Seeker", "Community Hero", "Helpful Soul", etc. |
| **Rank/Tier** | 12 | "Iron Rank", "Gold Rank", "Platinum Elite", "Legendary", "Mythic", etc. |
| **Role** | 10 | "Moderator", "Verified Seller", "Content Creator", "VIP Member", "Ambassador" |
| **Custom** | 18 | User-created (moderated, profanity-filtered) with theme color |
| **Seasonal** | 10 | "Winter Guardian", "Spring Bloomer", "Summer King", "Autumn Sage", etc. |
| **Event-Based** | 5 | "Tournament Winner", "Community Choice Award", "Bug Bounty Hunter" |

**Title Example (appears under username):**
```
👤 Username
✨ "Legendary Contributor" (gold text with glow)
```

### 5. Nameplates (45 Total)

**KEY FEATURE:** Nameplates combine borders + badge + title into a single "identity card" shown in forums, groups, DMs, and profiles.

**Categories:**

| Category | Count | Design Inspiration |
|----------|-------|-------------------|
| **Game Legends** | 12 | LoL championship plates, Valorant agent plates, Wild Rift ranks, Mobile Legends tier, Naraka prestige |
| **Rank Seasons** | 8 | Season 1-8 exclusive plates (limited-time, acquired each season) |
| **Premium Tier** | 8 | Diamond, Platinum, Gold, Silver tiers with premium styling |
| **Exclusive** | 10 | Founder plate, Beta tester, Hall of fame, Moderator, Admin, Creator, Partner |
| **Themed** | 7 | Cyberpunk, Fantasy, Steampunk, Cosmic, Retro, Minimalist, Holographic |

**Nameplate Anatomy (LoL-inspired):**
```
┌────────────────────────────────────────┐
│   ✨ LEGENDARY [Glow Animation]        │  ← Rarity indicator
│   [Avatar with Border] ⭐ Username     │
│   "Your Active Title Here"             │
│   📊 100 Posts | 🏆 GOLD Rep          │  ← Reputation mini-card
│   Last: Forum Category • 2 hrs ago     │
└────────────────────────────────────────┘
```

**Display Locations:**
1. **Forum Posts:** Nameplate shown left of post content
2. **Profile Cards (hover):** Full nameplate expands
3. **Group Member List:** Compact nameplate chip
4. **DM Headers:** Nameplate identifies conversation partner
5. **Forum Leaderboard:** Top reputation users display nameplates

### 6. Name Customization Styles (50 Total)

**Categories:**

| Category | Count | Examples |
|----------|-------|----------|
| **Font Styles** | 8 | Bold, Italic, Monospace, Serif, Sans-serif decorative, Underline, Strikethrough, Mixed |
| **Text Effects** | 12 | Rainbow gradient, Neon glow, Shadow, Outline, Reflection, Blur, Shake (hover), Sparkle |
| **Color Presets** | 15 | By-theme colors, gradients (blue-to-purple, fire gradient, ocean, forest, etc.) |
| **Decorative Prefixes** | 10 | ✨ Sparkle, 🔥 Flame, ⚡ Lightning, 🌙 Moon, 👑 Crown, 🎮 Gaming, etc. |
| **Suffixes** | 5 | ™, ®, ✓, ⭐, 💎 |

**Example Usage in Thread:**
```
✨ [Username] 💎  (with rainbow gradient text)
```

---

## PART 4: NAMEPLATE SYSTEM DESIGN (Game-Inspired)

### Design Principles (LoL, Wild Rift, Mobile Legends Reference)

#### What Makes These Game Nameplates Work:

**League of Legends Ranked Borders:**
- Hextech-inspired border frames (animated, glowing)
- Rank tier (Iron → Challenger) clearly displayed
- Season indicator (what season earned)
- Glow effect on hover
- Distinct visual hierarchy

**Wild Rift Prestige Points:**
- Prestige skin-like visual (ornate, premium)
- Level badge separate from nameplate
- Accent color per tier
- Sparkle/shimmer animation on profile

**Mobile Legends Rank Season Skin:**
- Colorful seasonal skins updated monthly
- Animated particles around nameplate
- Clear tier progression (Warrior → Mythic)
- "What rank are you THIS season?" instantly visible

#### CGraph Application:

```typescript
// Nameplate Component (React)
interface Nameplate {
  userId: string;
  activeBorder: Border; // avatar border style
  activeTitle: Title;   // subtitle under username
  activeNameplate: NameplateFrame; // main identity card
  badges: Badge[]; // display up to 5
  reputationLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  lastActivityForum?: Forum; // "Last seen in: Gaming Discussion"
  hiddenInContexts?: ('forums' | 'groups' | 'dms')[]; // user controls visibility
}

// Rendered Nameplate (in forum thread):
<NameplateCard user={user} context="forum_post">
  {/* Top: Rarity indicator + animation */}
  <RarityBadge rarity={nameplate.rarity} animation="glow" />
  
  {/* Middle: Avatar + Username + Badges */}
  <AvatarSection>
    <Avatar border={border} user={user} />
    <UsernameAndTitle>
      <Username style={nameplate.textStyle}>{user.name}</Username>
      <Title>{activeTitle.name}</Title>
    </UsernameAndTitle>
    <BadgeRow badges={badges.slice(0, 5)} />
  </AvatarSection>
  
  {/* Bottom: Reputation + Context */}
  <ReputationBar 
    postCount={reputationScore.totalPosts} 
    level={reputationScore.reputationLevel}
    lastSeenForum={lastActivityForum}
  />
</NameplateCard>
```

### Nameplate Visibility Rules (CRITICAL for Cross-Platform Identity)

**User can control WHERE their nameplate shows:**
```javascript
const nameplate_visibility = {
  visible_in_forums: true,        // ✓ Show in forum threads
  visible_in_groups: true,        // ✓ Show in group channels
  visible_in_dms: true,           // ✓ Show in direct messages
  visible_in_leaderboards: true,  // ✓ Show in reputation rankings
  visible_in_directory: true,     // ✓ Show in member directory
}

// When user visits NEW forum (not previously joined):
// - Old nameplate/badges/title PERSIST
// - System: "Meet @username - they brought 1,247 posts from other forums!"
// - Mobile: nameplate shown on profile card, optional in message header
```

**Key Difference from Discord:**
```
Discord:  Join Server A → Create Server A persona
          Join Server B → Create Server B persona
          No history shown across servers

CGraph:   Join Forum 1 → Display nameplate earned from Forums 1-5
          Join Forum 2 → Display same nameplate + history
          Switch to Group → Same nameplate visible
          Enter DM → Same nameplate shown in header
          = Unified identity
```

---

## PART 5: IMPLEMENTATION ROADMAP

### Phase 0: Preparation (Week 1-2, ~40 hours)

**Backend Setup:**
- [ ] Create all new Ecto schemas (nameplates, borders, badges, titles, themes, etc.)
- [ ] Write migrations (90+ migration files)
- [ ] Design repository query patterns for cosmetics bulk-loading
- [ ] Create seed data for 10 themes + 340 cosmetics
- [ ] Setup Cloudflare R2 bucket for cosmetic assets (SVG/PNG storage)

**Frontend Skeleton:**
- [ ] Design Storybook stories for all cosmetic components
- [ ] Create CSS-in-JS tokens for 10 themes (Tailwind integration)
- [ ] Build Nameplate component with Framer Motion (glow, pulse, shimmer)
- [ ] Create cosmetic inventory management UI (Zustand store)

### Phase 1: Forum Architecture (Week 3-5, ~60 hours)

**Database & Backend:**
- [ ] Implement Board/Category CRUD (Phoenix controllers)
- [ ] Implement Thread sticky/color/announcement features
- [ ] Implement Post creation with user nameplate attachment
- [ ] Create forum theme application logic (per-forum CSS override)
- [ ] Implement thread tagging + filtering system

**API Endpoints:**
```
POST   /api/v1/forums/:id/boards              # Create board
PUT    /api/v1/forums/:id/boards/:board_id   # Update board
GET    /api/v1/forums/:id/boards             # List boards
GET    /api/v1/boards/:id/threads            # List threads (paginated)
POST   /api/v1/boards/:id/threads            # Create thread
PUT    /api/v1/threads/:id                   # Update (sticky, color, lock)
POST   /api/v1/threads/:id/posts             # Create post
GET    /api/v1/threads/:id/posts             # Get posts with nameplate
```

**WebSocket Enhancements:**
- [ ] `forum_channel.ex` for real-time thread updates
- [ ] `board_channel.ex` for board activity (new threads)
- [ ] Presence: who's viewing which board/thread

### Phase 2: Cosmetics System (Week 6-8, ~80 hours)

**Backend:**
- [ ] Implement cosmetic purchase/acquisition logic (Nodes economy)
- [ ] Implement cosmetic inventory (user_cosmetic_inventory)
- [ ] Implement nameplate activation (user_nameplates)
- [ ] Create cosmetic shop endpoints
- [ ] Implement seasonal item rotation
- [ ] Create admin cosmetic management (CRUD all 340 items)

**API Endpoints:**
```
GET    /api/v1/user/cosmetics/inventory             # Get user inventory
PUT    /api/v1/user/cosmetics/activate              # Activate items
POST   /api/v1/shop/cosmetics                       # Browse shop
POST   /api/v1/shop/cosmetics/:id/purchase          # Purchase with Nodes
GET    /api/v1/cosmetics/:id                        # Get cosmetic details
# Admin
POST   /api/v1/admin/cosmetics                      # Create cosmetic
PUT    /api/v1/admin/cosmetics/:id                  # Update cosmetic
```

**Frontend:**
- [ ] Cosmetic Shop UI (grid + filter by theme/rarity/type)
- [ ] Inventory management UI (equipped vs. unequipped)
- [ ] Preview system (3D avatar with live cosmetic preview)
- [ ] Nameplate editor (drag-drop customize appearance)
- [ ] Theme selector + preview

### Phase 3: Web App Integration (Week 9-11, ~70 hours)

**Web UI Components:**
- [ ] Forum board list view (EpicNPC-style layout)
- [ ] Thread list view (with sticky pins, colors, tags)
- [ ] Thread detail view (posts with nameplates)
- [ ] User profile card (expanded nameplate)
- [ ] Forum member directory
- [ ] Reputation leaderboard
- [ ] Moderation tools UI (ban user, delete thread, etc.)

**Mobile Considerations (Web):**
- [ ] Responsive board list (mobile collapse subcategories)
- [ ] Sticky threads mobile-optimized (swipe expand)
- [ ] Nameplate compact mode (mobile): show avatar + name, expand on tap
- [ ] Touch-friendly cosmetic editor

### Phase 4: Mobile App Integration (Week 12-14, ~90 hours)

**React Native Components:**
- [ ] Forum board list (FlatList with sticky sections)
- [ ] Thread list view (pagination, pull-to-refresh)
- [ ] Thread detail + post list
- [ ] Nameplate display (mobile compact or full card?)
- [ ] Cosmetic shop (tabbed navigation)
- [ ] Profile/inventory screen
- [ ] Settings: nameplate visibility controls

**Mobile-Specific Optimizations:**
```typescript
// Strategy: Nameplate variant system
type NameplateVariant = 'full' | 'compact' | 'header-only' | 'hidden';

// On Forum Post (Mobile):
// Compact: [Avatar] [Name] [1 badge] 
//          "Level 42"
// (tap to expand to full nameplate)

// In Thread List (Mobile):
// Header Only: Shows username + badge count only
// (nameplate shown on tap-to-open user card)

// In Group Channel (Mobile):
// Compact: [Avatar] [Name] 
// (nameplate shown in member list view)
```

**Storage (WatermelonDB):**
- [ ] Cache forum threads/posts
- [ ] Sync cosmetics inventory offline
- [ ] Queue new posts for sync when online

### Phase 5: Testing & Optimization (Week 15-16, ~60 hours)

**Testing:**
- [ ] E2E: Forum post creation with nameplate
- [ ] E2E: Cosmetic purchase + activation
- [ ] E2E: Theme switching
- [ ] Load test: 10K threads, 100K posts with nameplate queries
- [ ] Mobile app Storybook review

**Performance:**
- [ ] Query optimization: N+1 query fixes for nameplate queries
- [ ] Asset CDN: cosmetics SVG → Cloudflare
- [ ] Component lazy-loading (Storybook/shop)
- [ ] Mobile bundle size audit

### Phase 6: Launch & Iteration (Week 17-18, ~40 hours)

**Pre-Launch:**
- [ ] Content moderation policies for cosmetics/titles
- [ ] Admin training (cosmetic management, theme updates)
- [ ] Launch announcement + onboarding tutorial

**Post-Launch (Monitor):**
- [ ] Track cosmetic purchase patterns
- [ ] Gather feedback on nameplate visibility/UX
- [ ] Monitor performance metrics
- [ ] Plan next cosmetics batch

---

## PART 6: TECHNICAL ARCHITECTURE

### Backend Structure (Elixir/Phoenix)

```
apps/backend/lib/cgraph/
├── forums/
│   ├── board.ex                    # Schema
│   ├── boards.ex                   # Context facade
│   ├── boards/
│   │   ├── queries.ex              # Efficient queries with nameplate
│   │   ├── operations.ex           # Create/update/delete
│   │   └── permissions.ex          # Board visibility rules
│   ├── thread.ex                   # Schema
│   ├── threads.ex                  # Context facade
│   ├── threads/
│   │   ├── queries.ex
│   │   ├── operations.ex
│   │   └── sticky_manager.ex       # Manage sticky priority
│   └── posts.ex / posts/ (similar)
│
├── cosmetics/
│   ├── nameplate.ex                # Schema
│   ├── border.ex, badge.ex, title.ex, frame.ex
│   ├── cosmetics.ex                # Context facade
│   ├── cosmetics/
│   │   ├── inventory.ex            # User inventory queries
│   │   ├── shop.ex                 # Shop logic + purchase
│   │   ├── activation.ex           # Set active cosmetics
│   │   └── seasonal_manager.ex     # Rotate seasonal items
│   └── cosmetics/seeds/
│       ├── nameplates.seed.exs     # 45 nameplates
│       ├── borders.seed.exs        # 42 borders
│       ├── badges.seed.exs         # 70 badges
│       ├── titles.seed.exs         # 70 titles
│       ├── themes.seed.exs         # 10 themes + CSS
│       └── frames.seed.exs         # 50+ frames
│
└── reputation/
    ├── score.ex                    # Schema
    ├── reputation.ex               # Context
    └── calculator.ex               # Recalc scores nightly
```

### Frontend Structure (React)

```
apps/web/src/
├── modules/forums/
│   ├── components/
│   │   ├── BoardList.tsx           # List all boards
│   │   ├── ThreadList.tsx          # List threads in board
│   │   ├── ThreadDetail.tsx        # Full thread + posts
│   │   ├── PostCard.tsx            # Individual post with nameplate
│   │   ├── Nameplate.tsx           # Main nameplate component
│   │   ├── NameplateCompact.tsx    # Mobile variant
│   │   ├── NameplateEditor.tsx     # Customize nameplate
│   │   ├── ThemeSelector.tsx       # Switch forum theme
│   │   └── ModTools.tsx            # Mod dashboard
│   ├── hooks/
│   │   ├── useBoard.ts
│   │   ├── useThread.ts
│   │   ├── usePosts.ts
│   │   └── useForumTheme.ts
│   ├── stores/
│   │   ├── forumStore.ts           # Zustand store
│   │   ├── cosmeticsStore.ts       # Active cosmetics
│   │   └── themeStore.ts           # Current theme
│   └── pages/
│       ├── ForumIndex.tsx
│       ├── Board.tsx
│       ├── Thread.tsx
│       └── Shop.tsx
│
├── modules/cosmetics/
│   ├── components/
│   │   ├── ShopGrid.tsx            # Cosmetic shop
│   │   ├── CosmicPreview.tsx       # 3D preview (avatar + cosmetics)
│   │   ├── InventoryUI.tsx         # User inventory
│   │   └── CosmecticCard.tsx       # Single cosmetic card
│   ├── hooks/
│   │   ├── useCosmetics.ts
│   │   ├── useShop.ts
│   │   └── usePreview.ts
│   └── pages/
│       ├── Shop.tsx
│       └── Inventory.tsx
│
└── components/ui/
    ├── Nameplate/
    │   ├── NameplateBase.tsx       # Framer Motion wrapper
    │   ├── NameplateFull.tsx       # Expanded view
    │   ├── NameplateCompact.tsx
    │   ├── NameplateHeader.tsx     # DM header variant
    │   └── animationVariants.ts
    └── cosmetic-previews/
        ├── BorderPreview.tsx
        ├── BadgeRow.tsx
        └── TitleDisplay.tsx
```

### Mobile Structure (React Native)

```
apps/mobile/src/
├── screens/forums/
│   ├── ForumListScreen.tsx         # FlatList of boards
│   ├── ThreadListScreen.tsx        # FlatList of threads
│   ├── ThreadDetailScreen.tsx      # Thread + FlatList posts
│   ├── PostScreen.tsx              # Expanded post view
│   ├── NameplateCardModal.tsx      # Full nameplate modal
│   └── ThemeSelectorScreen.tsx
│
├── screens/cosmetics/
│   ├── ShopScreen.tsx              # Tabbed (shop/inventory)
│   ├── NameplateEditorScreen.tsx
│   └── PreviewScreen.tsx
│
├── components/forums/
│   ├── BoardCard.tsx
│   ├── ThreadCard.tsx              # Thread preview
│   ├── PostItem.tsx                # Post with nameplate
│   ├── NameplateCompact.tsx        # Mobile variant
│   └── StickyThreadBadge.tsx
│
└── components/cosmetics/
    ├── CosmecticCard.tsx
    ├── InventorySlot.tsx
    └── ShopFilters.tsx
```

---

## PART 7: DATABASE QUERY OPTIMIZATION

### Critical N+1 Pitfall: Nameplate Loading

**❌ WRONG (N+1 queries):**
```elixir
def get_posts_with_users(thread_id) do
  from(p in Post, where: p.thread_id == ^thread_id)
  |> Repo.all()
  # Now for each post, loading user separately:
  |> Enum.map(fn post ->
    %{post | user: Repo.get(User, post.user_id)}  # EXPENSIVE!
  end)
end
```

**✅ CORRECT (Batch preload):**
```elixir
def get_posts_with_nameplates(thread_id) do
  from(p in Post, where: p.thread_id == ^thread_id)
  |> preload([
    user: [:user_nameplate, :user_cosmetic_inventory],
    thread: :board
  ])
  |> Repo.all()
end
```

**Efficient Nameplate Query:**
```elixir
# In cosmetics/inventory.ex
def load_user_nameplates(user_ids) when is_list(user_ids) do
  from(un in UserNameplate,
    where: un.user_id in ^user_ids,
    preload: [
      :active_nameplate,
      :active_badge_ids,  # Load badge objects
      :active_title,
      :active_border
    ]
  )
  |> Repo.all()
  |> Map.new(&{&1.user_id, &1})  # Return as map for fast lookup
end

# Usage in post serialization:
def serialize_post_with_nameplate(post, user_nameplates_map) do
  nameplate = user_nameplates_map[post.user_id]
  %{
    id: post.id,
    content: post.content,
    user: %{
      id: post.user.id,
      name: post.user.username,
      nameplate: serialize_nameplate(nameplate)
    }
  }
end
```

**Caching Strategy:**
```elixir
# Cache user nameplates in ETS for 5 minutes
def get_user_nameplate_cached(user_id) do
  cache_key = "nameplate:#{user_id}"
  case CGraph.Cache.get(cache_key) do
    {:ok, nameplate} -> nameplate
    :miss ->
      nameplate = CGraph.Cosmetics.get_active_nameplate(user_id)
      CGraph.Cache.put(cache_key, nameplate, ttl: 300)
      nameplate
  end
end
```

---

## PART 8: MOBILE STRATEGY & RESTRICTIONS

### Web vs Mobile Parity

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| **Nameplate Full View** | ✓ Full card in posts | ⚠️ Tap to expand (compact default) | Mobile space constraints |
| **Cosmetic Shop** | ✓ Full grid, all filters | ✓ Tabbed (Shop/Inventory) | Same functionality, different layout |
| **Forum Theme** | ✓ Full CSS override | ✓ Applied to entire UI | Theme applies globally |
| **Thread Coloring** | ✓ Colored thread titles | ✓ Colored thread cards | Both support |
| **Sticky Threads** | ✓ Floating UI | ✓ Top of list, visual indicator | Same behavior |
| **Board Hierarchy** | ✓ Nested view | ⚠️ Collapse/expand subcategories | Mobile: tap category to expand |
| **Nameplate Editor** | ✓ Full drag-drop UI | ⚠️ Simplified: tabbed editor | Mobile: one setting at a time |
| **Profile Card Hover** | ✓ Hover-triggered | ✓ Tap/long-press on username | Mobile UX adapted |

### Mobile Restrictions (Optional Features)

**If Performance Required:**
- [ ] Nameplate animations: disable on low-end devices (prefers-reduced-motion)
- [ ] Theme CSS: cache compiled theme styles on first app load
- [ ] Cosmetic preview: use lower-resolution avatar preview on mobile

### Mobile Optimizations (Recommended)

```typescript
// Mobile nameplate rendering strategy
const NameplateDisplay = ({ user, context = 'forum_post' }: Props) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  if (isMobile && context === 'forum_post') {
    // Show compact nameplate in thread, full card on tap-through
    return (
      <NameplateCompact user={user} />  // Just avatar + name + 1 badge
    );
  }
  
  if (context === 'group_member_list') {
    return <NameplateChip user={user} />; // Mini chip with border only
  }
  
  // Web: always full
  return <NameplateFull user={user} />;
};
```

### Mobile App Storage (WatermelonDB)

```typescript
// Cache cosmetics for offline access
const cosmeticsTable = new Model.extend({
  _table: tableName('cosmetics'),
  
  async syncCosmetics(userId: string) {
    const { cosmetics, inventory } = await api.getCosmetics(userId);
    await database.batch(
      cosmetics.map(c => cosmeticsTable.create(c)),
      inventory.map(i => inventoryTable.create(i))
    );
  }
});
```

---

## PART 9: NEW FEATURES TO ADD (Beyond Nameplates)

### Real, implementable features:

1. **Forum Reputation Tracking**
   - Post count, helpful votes, reputation level
   - Automatic badge unlock (100 posts → "Contributor" badge)
   - Monthly leaderboard

2. **Sticky Thread Management**
   - Mods can sticky up to 3 threads per board
   - Reorder stickies via drag-drop
   - Sticky expiry (auto-unpin after X days)

3. **Thread Tagging + Filtering**
   - Mods create tags (e.g. "BUG", "SOLVED", "DISCUSSION")
   - Users filter by tag
   - Colored tag badges in thread list

4. **Advanced Search**
   - Full-text search (Meilisearch fallback)
   - Filter by: board, author, date, reputation
   - Save searches

5. **User Mention System**
   - @mention notifications
   - Mention in thread = notification
   - Mention autocomplete

6. **Quote Reply**
   - Quote text from other posts
   - Visual quote block styling
   - Edit quote inline

7. **Forum RSS**
   - RSS feed per board
   - RSS feed per user (their posts + threads)
   - Subscribe to thread updates (email/push)

8. **Mod Tools UI**
   - Delete post / delete thread
   - Ban user from forum temporarily
   - Soft delete (post hidden but recoverable)
   - Approve user posts (if forum configured)

9. **Forum Analytics Dashboard**
   - Activity graph (posts per day)
   - Top posters
   - Thread trends
   - New member retention

10. **Cross-Forum Invites**
    - Mods can invite users from other forums
    - "Hey, we noticed you in Forum X, join us here"
    - User consent required

---

## PART 10: IMPLEMENTATION CHECKLIST

### Week 1-2: Preparation
- [ ] Database schema finalized + reviewed
- [ ] Cosmetics library defined (all 340 items)
- [ ] Theme CSS tokens in Figma/design system
- [ ] API contract documentation (OpenAPI spec)
- [ ] Storybook setup + cosmetic component stories

### Week 3-5: Forum Architecture
- [ ] Phoenix migration files created
- [ ] Board/Thread/Post schemas + repos
- [ ] Forum theme system (CSS override logic)
- [ ] API endpoints live + tested
- [ ] Nameplate query optimization
- [ ] WebSocket channels for forums

### Week 6-8: Cosmetics System
- [ ] Nameplate/Border/Badge/Title schemas
- [ ] Cosmetics seed data loaded (340 items)
- [ ] Purchase logic (Nodes deduction)
- [ ] Activation logic (set active cosmetics)
- [ ] Shop API endpoints
- [ ] Admin CRUD for cosmetics

### Week 9-11: Web UI
- [ ] Forum board/thread/post views
- [ ] Nameplate component with animations
- [ ] Shop UI (grid + filters)
- [ ] Inventory management UI
- [ ] Profile cards with nameplate
- [ ] Moderation dashboard

### Week 12-14: Mobile App
- [ ] Forum screens (board → thread → posts)
- [ ] Nameplate compact variant
- [ ] Shop screen (tabbed)
- [ ] Profile/inventory screen
- [ ] WatermelonDB sync logic

### Week 15-16: Testing & Optimization
- [ ] E2E tests: post creation, cosmetic purchase, theme switch
- [ ] Load test: 100K posts + nameplate queries
- [ ] Performance audit: bundle size, query count
- [ ] Accessibility audit: WCAG AA

### Week 17-18: Launch
- [ ] Content policies finalized
- [ ] Admin training
- [ ] Public announcement + changelog
- [ ] Launch tutorial
- [ ] Monitor metrics

---

## CONCLUSION

This plan transforms CGraph forums from a **Reddit-like flat structure** into a **next-generation community platform** that rivals EpicNPC, elitepvpers, and professional gaming communities.

**Key Innovation:** Users bring their identity (nameplates, titles, badges, reputation) across ALL forums, groups, and DMs—solving the "rebuild identity per community" problem Discord created.

**Scale:** 10 themes × 42 borders × 70 badges × 70 titles × 45 nameplates × 50 customization styles = **340+ cosmetic assets** create genuine personalization and engagement.

**Timeline:** 18 weeks (4.5 months) from planning to launch with proper testing and optimization.

**ROI:** Premium cosmetics (Nodes-based economy) + engagement (cosmetic hunting) + retention (cross-platform identity) = monetization + stickiness.

---

## APPENDIX: Reference Links

- **EpicNPC:** www.epicnpc.com (thread colors, sticky threads, reputation badges)
- **elitepvpers:** www.elitepvpers.de (board hierarchy, theme customization)
- **LeakForum:** leakforum.io (colorful thread titles, tags)
- **MMO-Champion:** mmo-champion.com/forum.php (professional forum structure)

---

**Document Version:** 1.0  
**Last Updated:** March 11, 2026  
**Author:** CGraph Development Team  
**Status:** Ready for implementation sprint planning
