# Backend API Specification for Global Theme System

## Overview
This document specifies all backend API endpoints, database schema, and business logic needed to support the global theme system. The frontend is already built and ready to integrate with these endpoints.

---

## Database Schema

### Option 1: JSONB Column in Users Table (Recommended)
Add a single JSONB column to the existing `users` table:

```elixir
# Migration: add_theme_preferences_to_users.exs
defmodule CGraph.Repo.Migrations.AddThemePreferencesToUsers do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :theme_preferences, :map, default: %{}
    end

    create index(:users, [:theme_preferences], using: :gin)
  end
end
```

**Advantages:**
- Simple, no joins needed
- Fast queries
- GIN index for JSON queries
- Embedded in user record

### Option 2: Separate UserThemes Table
Create a dedicated table for theme data:

```elixir
# Migration: create_user_themes.exs
defmodule CGraph.Repo.Migrations.CreateUserThemes do
  use Ecto.Migration

  def change do
    create table(:user_themes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :theme_data, :map, null: false, default: %{}
      add :is_premium, :boolean, default: false

      timestamps()
    end

    create unique_index(:user_themes, [:user_id])
    create index(:user_themes, [:theme_data], using: :gin)
  end
end
```

**Advantages:**
- Cleaner separation
- Easier to add theme-specific features
- Can track theme history

---

## Theme Data Structure

The `theme_data` JSONB field should store this structure:

```json
{
  "color_preset": "emerald",
  "custom_primary_color": null,
  "custom_secondary_color": null,
  "custom_glow_color": null,

  "avatar_border": "glow",
  "avatar_border_color": "emerald",
  "avatar_size": "medium",
  "selected_border_theme": "japanese",
  "selected_border_id": "sakura-petals-epic",

  "chat_bubble_style": "default",
  "chat_bubble_color": "emerald",
  "bubble_border_radius": 16,
  "bubble_shadow_intensity": 20,
  "bubble_entrance_animation": "slide",
  "bubble_glass_effect": false,
  "bubble_show_tail": true,
  "bubble_hover_effect": true,

  "selected_profile_theme_id": "jp-sakura",
  "profile_card_style": "detailed",
  "show_badges": true,
  "show_status": true,

  "effect": "glassmorphism",
  "animation_speed": "normal",
  "particles_enabled": true,
  "glow_enabled": true,
  "blur_enabled": true,
  "animated_background": false,

  "custom_css": null,
  "is_premium": false,
  "last_updated": "2026-01-18T10:30:00Z"
}
```

---

## API Endpoints

### 1. Get User Theme
**Endpoint:** `GET /api/v1/users/:id/theme`

**Purpose:** Fetch a user's theme preferences

**Authentication:** Optional (public themes for viewing others, authenticated for own theme)

**Request:**
```http
GET /api/v1/users/123/theme
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "data": {
    "user_id": "123",
    "theme": {
      "color_preset": "emerald",
      "avatar_border": "glow",
      "chat_bubble_style": "default",
      "chat_bubble_color": "emerald",
      "bubble_border_radius": 16,
      "effect": "glassmorphism",
      // ... full theme object
    },
    "updated_at": "2026-01-18T10:30:00Z"
  }
}
```

**Response Error (404):**
```json
{
  "error": "User not found"
}
```

**Business Logic:**
1. If user has no theme_preferences, return default theme
2. Public fields only if requesting another user's theme
3. Include premium status check

**Elixir Controller Example:**
```elixir
defmodule CGraphWeb.UserThemeController do
  use CGraphWeb, :controller
  alias CGraph.UserThemes

  def show(conn, %{"id" => user_id}) do
    current_user = conn.assigns[:current_user]

    case UserThemes.get_user_theme(user_id) do
      {:ok, theme} ->
        # Only include sensitive fields if viewing own theme
        theme_data = if current_user && current_user.id == user_id do
          theme
        else
          UserThemes.public_theme_fields(theme)
        end

        json(conn, %{data: theme_data})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "User not found"})
    end
  end
end
```

---

### 2. Update User Theme
**Endpoint:** `PUT /api/v1/users/:id/theme`

**Purpose:** Update current user's theme preferences

**Authentication:** Required (can only update own theme)

**Request:**
```http
PUT /api/v1/users/123/theme
Authorization: Bearer <token>
Content-Type: application/json

{
  "theme": {
    "color_preset": "purple",
    "avatar_border": "legendary",
    "chat_bubble_style": "modern",
    "effect": "neon",
    "particles_enabled": true
    // ... partial or full theme object
  }
}
```

**Response Success (200):**
```json
{
  "data": {
    "user_id": "123",
    "theme": {
      // ... updated full theme object
    },
    "updated_at": "2026-01-18T10:35:00Z"
  },
  "message": "Theme updated successfully"
}
```

**Response Error (403):**
```json
{
  "error": "Unauthorized - can only update your own theme"
}
```

**Response Error (422):**
```json
{
  "error": "Validation failed",
  "details": {
    "color_preset": ["must be one of: emerald, purple, cyan, orange, pink, gold, crimson, arctic, sunset, midnight, forest, ocean"],
    "bubble_border_radius": ["must be between 0 and 50"]
  }
}
```

**Business Logic:**
1. Verify user is updating their own theme
2. Validate all theme fields
3. Check premium features (legendary/mythic borders require premium)
4. Merge with existing theme (allow partial updates)
5. Update `updated_at` timestamp

**Elixir Validation Example:**
```elixir
defmodule CGraph.UserThemes.Theme do
  use Ecto.Schema
  import Ecto.Changeset

  embedded_schema do
    field :color_preset, :string
    field :avatar_border, :string
    field :chat_bubble_style, :string
    field :chat_bubble_color, :string
    field :bubble_border_radius, :integer
    field :bubble_shadow_intensity, :integer
    field :effect, :string
    field :animation_speed, :string
    field :particles_enabled, :boolean
    field :glow_enabled, :boolean
    field :blur_enabled, :boolean
    field :is_premium, :boolean
    field :last_updated, :utc_datetime
  end

  def changeset(theme, attrs) do
    theme
    |> cast(attrs, [
      :color_preset, :avatar_border, :chat_bubble_style,
      :chat_bubble_color, :bubble_border_radius, :effect,
      :animation_speed, :particles_enabled, :glow_enabled
    ])
    |> validate_inclusion(:color_preset, [
      "emerald", "purple", "cyan", "orange", "pink", "gold",
      "crimson", "arctic", "sunset", "midnight", "forest", "ocean"
    ])
    |> validate_inclusion(:avatar_border, [
      "none", "static", "glow", "pulse", "rotate", "fire",
      "ice", "electric", "legendary", "mythic"
    ])
    |> validate_number(:bubble_border_radius, greater_than_or_equal_to: 0, less_than_or_equal_to: 50)
    |> validate_premium_features()
  end

  defp validate_premium_features(changeset) do
    is_premium = get_field(changeset, :is_premium, false)
    avatar_border = get_field(changeset, :avatar_border)

    premium_borders = ["legendary", "mythic"]

    if avatar_border in premium_borders and not is_premium do
      add_error(changeset, :avatar_border, "requires premium subscription")
    else
      changeset
    end
  end
end
```

---

### 3. Reset User Theme
**Endpoint:** `POST /api/v1/users/:id/theme/reset`

**Purpose:** Reset user's theme to default

**Authentication:** Required

**Request:**
```http
POST /api/v1/users/123/theme/reset
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "data": {
    "user_id": "123",
    "theme": {
      // ... default theme object
    }
  },
  "message": "Theme reset to default"
}
```

**Business Logic:**
1. Replace user's theme with default theme
2. Preserve premium status
3. Update timestamp

---

### 4. Get User Theme (Bulk)
**Endpoint:** `POST /api/v1/users/themes/batch`

**Purpose:** Fetch themes for multiple users (for chat/forum rendering)

**Authentication:** Required

**Request:**
```http
POST /api/v1/users/themes/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_ids": ["123", "456", "789"]
}
```

**Response Success (200):**
```json
{
  "data": [
    {
      "user_id": "123",
      "theme": {
        "chat_bubble_color": "emerald",
        "chat_bubble_style": "default",
        "avatar_border": "glow",
        "avatar_border_color": "emerald"
        // ... public theme fields only
      }
    },
    {
      "user_id": "456",
      "theme": {
        "chat_bubble_color": "purple",
        "chat_bubble_style": "modern",
        "avatar_border": "legendary",
        "avatar_border_color": "purple"
      }
    }
  ]
}
```

**Business Logic:**
1. Limit to 100 user_ids per request
2. Return only public theme fields
3. Return default theme for users without custom theme
4. Cache results (5 min TTL)

---

## WebSocket Integration (Phoenix Channels)

### Theme Update Broadcast

When a user updates their theme, broadcast to relevant channels:

**Channel:** `user:{user_id}`
**Event:** `theme_updated`

```elixir
defmodule CGraphWeb.UserChannel do
  use CGraphWeb, :channel

  def handle_in("update_theme", %{"theme" => theme_data}, socket) do
    user_id = socket.assigns.user_id

    case UserThemes.update_theme(user_id, theme_data) do
      {:ok, updated_theme} ->
        # Broadcast to user's channel
        broadcast!(socket, "theme_updated", %{theme: updated_theme})

        # Broadcast to conversations/groups where user is active
        notify_active_channels(user_id, updated_theme)

        {:reply, {:ok, %{theme: updated_theme}}, socket}

      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset.errors}}, socket}
    end
  end
end
```

**Frontend Listener:**
```typescript
// In chatStore or themeStore
channel.on('theme_updated', (payload) => {
  // Update local cache of user themes
  updateUserTheme(userId, payload.theme);

  // Re-render affected messages
  refreshMessages();
});
```

---

## Message Schema Updates

### Add Theme Snapshot to Messages

Messages should include a snapshot of the sender's theme at send time:

```elixir
# Migration: add_sender_theme_to_messages.exs
defmodule CGraph.Repo.Migrations.AddSenderThemeToMessages do
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add :sender_theme_snapshot, :map, default: %{}
    end
  end
end
```

**Message Creation Logic:**
```elixir
defmodule CGraph.Messaging do
  def create_message(attrs) do
    sender_id = attrs[:sender_id]

    # Fetch sender's current theme
    {:ok, sender_theme} = UserThemes.get_user_theme(sender_id)

    # Extract only needed fields for rendering
    theme_snapshot = %{
      chat_bubble_color: sender_theme.chat_bubble_color,
      chat_bubble_style: sender_theme.chat_bubble_style,
      bubble_border_radius: sender_theme.bubble_border_radius,
      bubble_shadow_intensity: sender_theme.bubble_shadow_intensity,
      bubble_entrance_animation: sender_theme.bubble_entrance_animation,
      bubble_glass_effect: sender_theme.bubble_glass_effect,
      bubble_show_tail: sender_theme.bubble_show_tail,
      bubble_hover_effect: sender_theme.bubble_hover_effect,
      avatar_border: sender_theme.avatar_border,
      avatar_border_color: sender_theme.avatar_border_color,
      effect: sender_theme.effect,
      particles_enabled: sender_theme.particles_enabled
    }

    attrs_with_theme = Map.put(attrs, :sender_theme_snapshot, theme_snapshot)

    %Message{}
    |> Message.changeset(attrs_with_theme)
    |> Repo.insert()
  end
end
```

---

## Forum Posts/Comments Schema Updates

Same approach for forum content:

```elixir
# Migration: add_author_theme_to_posts.exs
defmodule CGraph.Repo.Migrations.AddAuthorThemeToPosts do
  use Ecto.Migration

  def change do
    alter table(:posts) do
      add :author_theme_snapshot, :map, default: %{}
    end

    alter table(:comments) do
      add :author_theme_snapshot, :map, default: %{}
    end
  end
end
```

---

## Premium Validation

### Premium Features List

**Free Tier:**
- Color presets: emerald, arctic, crimson, gold (4 presets)
- Avatar borders: none, static, glow, pulse
- Chat styles: default, rounded, sharp
- Effects: minimal, glassmorphism

**Starter Tier ($4.99/mo):**
- All free features
- Additional colors: purple, cyan, orange, pink (8 total)
- Avatar borders: rotate
- Chat styles: cloud, modern
- Effects: aurora

**Pro Tier ($9.99/mo):**
- All starter features
- Additional colors: sunset, midnight, forest, ocean (12 total)
- Avatar borders: fire, ice, electric
- Chat styles: retro, bubble, glassmorphism (all 8)
- Effects: neon, holographic, cyberpunk (all 6)
- Particle effects
- Animated backgrounds

**Business Tier ($19.99/mo):**
- All pro features
- Avatar borders: legendary, mythic (all 10)
- Custom CSS injection
- Priority theme loading
- Themed border collections (150+ borders)

**Validation Function:**
```elixir
defmodule CGraph.UserThemes.PremiumValidator do
  @free_colors ["emerald", "arctic", "crimson", "gold"]
  @starter_colors @free_colors ++ ["purple", "cyan", "orange", "pink"]
  @pro_colors @starter_colors ++ ["sunset", "midnight", "forest", "ocean"]

  @free_borders ["none", "static", "glow", "pulse"]
  @starter_borders @free_borders ++ ["rotate"]
  @pro_borders @starter_borders ++ ["fire", "ice", "electric"]
  @business_borders @pro_borders ++ ["legendary", "mythic"]

  def validate_theme_for_tier(theme, user_tier) do
    errors = []

    errors = validate_color(theme.color_preset, user_tier, errors)
    errors = validate_border(theme.avatar_border, user_tier, errors)
    errors = validate_effects(theme, user_tier, errors)

    if Enum.empty?(errors), do: :ok, else: {:error, errors}
  end

  defp validate_color(color, tier, errors) do
    allowed = case tier do
      :free -> @free_colors
      :starter -> @starter_colors
      :pro -> @pro_colors
      :business -> @pro_colors
    end

    if color in allowed do
      errors
    else
      [{:color_preset, "requires #{required_tier_for_color(color)} subscription"} | errors]
    end
  end

  defp validate_border(border, tier, errors) do
    allowed = case tier do
      :free -> @free_borders
      :starter -> @starter_borders
      :pro -> @pro_borders
      :business -> @business_borders
    end

    if border in allowed do
      errors
    else
      [{:avatar_border, "requires #{required_tier_for_border(border)} subscription"} | errors]
    end
  end
end
```

---

## Caching Strategy

### Redis Cache Structure

```elixir
defmodule CGraph.UserThemes.Cache do
  @cache_ttl 300 # 5 minutes

  def get_cached_theme(user_id) do
    case Cachex.get(:user_themes_cache, "theme:#{user_id}") do
      {:ok, nil} ->
        # Cache miss, fetch from DB
        case UserThemes.get_user_theme(user_id) do
          {:ok, theme} ->
            Cachex.put(:user_themes_cache, "theme:#{user_id}", theme, ttl: @cache_ttl)
            {:ok, theme}
          error -> error
        end

      {:ok, theme} ->
        {:ok, theme}
    end
  end

  def invalidate_theme_cache(user_id) do
    Cachex.del(:user_themes_cache, "theme:#{user_id}")
  end
end
```

**Cache Keys:**
- `theme:{user_id}` - Full user theme
- `themes:batch:{hash}` - Batch request results
- `theme:public:{user_id}` - Public theme fields only

**Invalidation:**
- On theme update
- On user premium status change
- Manual invalidation endpoint for admins

---

## Analytics & Metrics

### Track Theme Usage

Useful for product decisions and premium conversion:

```elixir
# Migration: create_theme_analytics.exs
defmodule CGraph.Repo.Migrations.CreateThemeAnalytics do
  use Ecto.Migration

  def change do
    create table(:theme_analytics, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id)
      add :event_type, :string # "theme_updated", "preset_applied", "export", "import"
      add :theme_snapshot, :map
      add :metadata, :map # Extra info like which preset, etc.

      timestamps()
    end

    create index(:theme_analytics, [:user_id])
    create index(:theme_analytics, [:event_type])
    create index(:theme_analytics, [:inserted_at])
  end
end
```

**Metrics to Track:**
1. Most popular color presets
2. Most popular avatar borders
3. Premium feature adoption rate
4. Theme customization completion rate
5. Export/import usage
6. Preset vs custom themes

---

## Migration Script for Existing Users

```elixir
defmodule CGraph.Release do
  def migrate_user_themes do
    alias CGraph.Repo
    alias CGraph.Accounts.User
    alias CGraph.UserThemes

    default_theme = UserThemes.default_theme()

    User
    |> Repo.all()
    |> Enum.each(fn user ->
      # Check if user already has theme
      case user.theme_preferences do
        nil ->
          # Create default theme
          user
          |> Ecto.Changeset.change(%{theme_preferences: default_theme})
          |> Repo.update!()

          IO.puts("Created default theme for user #{user.id}")

        _ ->
          IO.puts("User #{user.id} already has theme")
      end
    end)

    IO.puts("Theme migration complete")
  end
end
```

**Run Migration:**
```bash
# On production server
/app/bin/cgraph eval "CGraph.Release.migrate_user_themes()"
```

---

## API Rate Limiting

Apply rate limits to theme endpoints:

```elixir
# In your rate limiter configuration
defmodule CGraphWeb.RateLimiter do
  @theme_update_limit {5, :minute} # 5 updates per minute
  @theme_batch_limit {30, :minute} # 30 batch requests per minute

  plug :rate_limit, [
    {"/api/v1/users/:id/theme", method: :put, limit: @theme_update_limit},
    {"/api/v1/users/themes/batch", method: :post, limit: @theme_batch_limit}
  ]
end
```

---

## Error Codes Reference

| Code | Error | Description |
|------|-------|-------------|
| 200 | Success | Theme retrieved/updated successfully |
| 400 | Bad Request | Invalid theme data format |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Cannot modify another user's theme |
| 404 | Not Found | User not found |
| 422 | Validation Error | Theme data failed validation |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal server error |

---

## Testing Checklist

### Unit Tests
- [ ] Theme validation (valid/invalid values)
- [ ] Premium feature gating
- [ ] Default theme generation
- [ ] Theme merging (partial updates)
- [ ] Public vs private field filtering

### Integration Tests
- [ ] Create/update/delete theme via API
- [ ] Batch theme fetching
- [ ] WebSocket theme updates
- [ ] Cache hit/miss scenarios
- [ ] Rate limiting enforcement

### Performance Tests
- [ ] Load test batch endpoint (100 users)
- [ ] Cache performance (with/without)
- [ ] Message creation with theme snapshot (1000 messages)
- [ ] Concurrent theme updates

---

## Summary for Backend Developer

**What to Implement:**

1. **Database**
   - Add `theme_preferences` JSONB column to `users` table
   - Add `sender_theme_snapshot` to `messages` table
   - Add `author_theme_snapshot` to `posts` and `comments` tables

2. **API Endpoints**
   - `GET /api/v1/users/:id/theme` - Get user theme
   - `PUT /api/v1/users/:id/theme` - Update user theme
   - `POST /api/v1/users/:id/theme/reset` - Reset to default
   - `POST /api/v1/users/themes/batch` - Batch fetch themes

3. **Business Logic**
   - Theme validation with Ecto changeset
   - Premium feature gating
   - Theme snapshot on message/post creation
   - Cache layer (Cachex/Redis)

4. **WebSocket**
   - Broadcast theme updates on `user:*` channels
   - Notify active conversations/groups

5. **Utilities**
   - Migration script for existing users
   - Analytics tracking
   - Rate limiting

**Frontend is Ready:**
- Theme store with persistence ✓
- Themed components (Avatar, ChatBubble) ✓
- Customization UI ✓
- API integration points prepared ✓

Just plug in these endpoints and the system will work! 🚀
