defmodule Cgraph.Forums.Forum do
  @moduledoc """
  Forum schema - combines Reddit-style discovery with MyBB-style full forum hosting.
  
  Each forum is a complete hosted forum with:
  - Custom theming with CSS, themes, and plugins
  - Boards (sections/categories within the forum)
  - Threads and posts
  - User groups and permissions
  - Polls, warnings, reputation
  
  Forums also participate in Reddit-style competition:
  - Users can upvote/downvote forums
  - Leaderboards show most popular forums
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :name, :slug, :description, :icon_url, :banner_url,
    :is_public, :member_count, :post_count, :score, :upvotes, :downvotes,
    :hot_score, :weekly_score, :featured, :category, :tier, :verified,
    :inserted_at
  ]}

  schema "forums" do
    field :name, :string
    field :slug, :string
    field :title, :string  # Display title
    field :description, :string
    field :icon_url, :string
    field :banner_url, :string

    # Extended branding (MyBB-style)
    field :favicon_url, :string
    field :logo_url, :string
    field :tagline, :string
    field :custom_header_html, :string
    field :custom_footer_html, :string

    # Customization
    field :custom_css, :string  # User-provided CSS (sanitized)
    field :primary_color, :string, default: "#1a73e8"
    field :secondary_color, :string
    field :font_family, :string
    field :sidebar_html, :string  # Sidebar content (sanitized HTML)

    # Settings
    field :is_public, :boolean, default: true
    field :is_nsfw, :boolean, default: false
    field :allow_posts, :boolean, default: true
    field :allow_comments, :boolean, default: true
    field :require_post_approval, :boolean, default: false
    field :restricted_posting, :boolean, default: false  # Only approved users
    field :require_approval, :boolean, default: false
    field :registration_open, :boolean, default: true
    field :posting_requires_account, :boolean, default: true

    # Post settings
    field :allowed_post_types, {:array, :string}, default: ["text", "link", "image", "poll"]
    field :default_sort, :string, default: "hot"

    # Stats (denormalized)
    field :member_count, :integer, default: 1
    field :post_count, :integer, default: 0
    field :thread_count, :integer, default: 0
    field :active_users_today, :integer, default: 0

    # Forum voting (competition/Reddit-style discovery)
    field :score, :integer, default: 0
    field :upvotes, :integer, default: 0
    field :downvotes, :integer, default: 0
    field :hot_score, :float, default: 0.0
    field :weekly_score, :integer, default: 0
    field :monthly_score, :integer, default: 0
    field :featured, :boolean, default: false
    field :verified, :boolean, default: false

    # Discovery categorization
    field :category, :string, default: "other"
    field :tags, {:array, :string}, default: []

    # Subscription tier
    field :tier, :string, default: "free"

    # Soft delete
    field :deleted_at, :utc_datetime

    # Relationships
    belongs_to :owner, Cgraph.Accounts.User
    belongs_to :theme, Cgraph.Forums.ForumTheme
    
    # Reddit-style posts (if used for simple reddit-like mode)
    has_many :posts, Cgraph.Forums.Post
    has_many :categories, Cgraph.Forums.Category
    has_many :moderators, Cgraph.Forums.Moderator
    has_many :rules, Cgraph.Forums.Rule
    has_many :bans, Cgraph.Forums.Ban
    has_many :forum_votes, Cgraph.Forums.ForumVote
    
    # MyBB-style forum hosting
    has_many :boards, Cgraph.Forums.Board
    has_many :themes, Cgraph.Forums.ForumTheme
    has_many :plugins, Cgraph.Forums.ForumPlugin
    has_many :user_groups, Cgraph.Forums.ForumUserGroup
    has_many :members, Cgraph.Forums.ForumMember
    has_many :announcements, Cgraph.Forums.ForumAnnouncement

    timestamps()
  end

  @doc """
  Create a new forum.
  """
  def changeset(forum, attrs) do
    forum
    |> cast(attrs, [
      :name, :slug, :title, :description, :icon_url, :banner_url, :owner_id,
      :favicon_url, :logo_url, :tagline,
      :is_public, :is_nsfw, :allow_posts, :allow_comments,
      :require_post_approval, :restricted_posting,
      :require_approval, :registration_open, :posting_requires_account,
      :allowed_post_types, :default_sort, :primary_color, :secondary_color,
      :category, :tier, :tags
    ])
    |> validate_required([:name, :owner_id])
    |> validate_length(:name, min: 3, max: 21)
    |> validate_format(:name, ~r/^[a-zA-Z0-9_]+$/,
      message: "can only contain letters, numbers, and underscores"
    )
    |> validate_length(:title, max: 100)
    |> validate_length(:description, max: 500)
    |> validate_length(:tagline, max: 150)
    |> validate_inclusion(:default_sort, ["hot", "new", "top", "controversial", "rising"])
    |> validate_inclusion(:tier, ["free", "starter", "pro", "business"])
    |> validate_inclusion(:category, [
      "gaming", "technology", "science", "sports", "entertainment",
      "music", "art", "education", "business", "politics", "news",
      "health", "lifestyle", "food", "travel", "fashion", "other"
    ])
    |> maybe_generate_slug()
    |> unique_constraint(:slug)
    |> unique_constraint(:name)
    |> foreign_key_constraint(:owner_id)
  end

  @doc """
  Update forum settings.
  """
  def settings_changeset(forum, attrs) do
    forum
    |> cast(attrs, [
      :title, :description, :icon_url, :banner_url,
      :favicon_url, :logo_url, :tagline,
      :is_public, :is_nsfw, :allow_posts, :allow_comments,
      :require_post_approval, :restricted_posting,
      :require_approval, :registration_open, :posting_requires_account,
      :allowed_post_types, :default_sort, :primary_color, :secondary_color,
      :category, :tags
    ])
    |> validate_length(:description, max: 500)
    |> validate_length(:tagline, max: 150)
    |> validate_inclusion(:default_sort, ["hot", "new", "top", "controversial", "rising"])
    |> validate_inclusion(:category, [
      "gaming", "technology", "science", "sports", "entertainment",
      "music", "art", "education", "business", "politics", "news",
      "health", "lifestyle", "food", "travel", "fashion", "other"
    ])
  end

  @doc """
  Update custom styling (CSS and sidebar).
  """
  def styling_changeset(forum, attrs) do
    forum
    |> cast(attrs, [
      :custom_css, :sidebar_html, :primary_color, :secondary_color,
      :font_family, :custom_header_html, :custom_footer_html, :theme_id
    ])
    |> validate_length(:custom_css, max: 100_000)
    |> validate_length(:sidebar_html, max: 10_000)
    |> validate_length(:custom_header_html, max: 10_000)
    |> validate_length(:custom_footer_html, max: 10_000)
    |> sanitize_css()
    |> sanitize_html()
  end

  # Only generate slug from name if slug not already provided
  defp maybe_generate_slug(changeset) do
    # If slug is already set (either provided or from previous change), don't override
    case get_change(changeset, :slug) do
      nil ->
        # No slug provided, generate from name
        case get_change(changeset, :name) do
          nil -> changeset
          name -> put_change(changeset, :slug, String.downcase(name))
        end
      _slug ->
        # Slug was explicitly provided, keep it
        changeset
    end
  end

  # Basic CSS sanitization - in production use a proper sanitizer
  defp sanitize_css(changeset) do
    case get_change(changeset, :custom_css) do
      nil -> changeset
      css ->
        # Remove potentially dangerous CSS
        sanitized = css
        |> String.replace(~r/expression\s*\(/i, "")
        |> String.replace(~r/javascript:/i, "")
        |> String.replace(~r/behavior\s*:/i, "")
        |> String.replace(~r/-moz-binding/i, "")
        put_change(changeset, :custom_css, sanitized)
    end
  end

  defp sanitize_html(changeset) do
    # In production, use HtmlSanitizeEx or similar
    changeset
  end
end
