defmodule CGraph.Forums.Forum do
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

    # Hierarchy (infinite nesting support)
    field :display_order, :integer, default: 0
    field :path, :string, default: "/"
    field :depth, :integer, default: 0
    field :show_in_navigation, :boolean, default: true
    field :collapsed_by_default, :boolean, default: false
    field :forum_type, :string, default: "forum"  # "category", "forum", "link"
    field :redirect_url, :string
    field :redirect_count, :integer, default: 0
    field :inherit_permissions, :boolean, default: true

    # Aggregate stats (including sub-forums)
    field :total_thread_count, :integer, default: 0
    field :total_post_count, :integer, default: 0
    field :total_member_count, :integer, default: 0

    # Relationships
    belongs_to :owner, CGraph.Accounts.User
    belongs_to :theme, CGraph.Forums.ForumTheme
    belongs_to :parent_forum, __MODULE__

    # Hierarchy relationships
    has_many :sub_forums, __MODULE__, foreign_key: :parent_forum_id

    # Reddit-style posts (if used for simple reddit-like mode)
    has_many :posts, CGraph.Forums.Post
    has_many :categories, CGraph.Forums.Category
    has_many :moderators, CGraph.Forums.Moderator
    has_many :rules, CGraph.Forums.Rule
    has_many :bans, CGraph.Forums.Ban
    has_many :forum_votes, CGraph.Forums.ForumVote

    # MyBB-style forum hosting
    has_many :boards, CGraph.Forums.Board
    has_many :themes, CGraph.Forums.ForumTheme
    has_many :plugins, CGraph.Forums.ForumPlugin
    has_many :user_groups, CGraph.Forums.ForumUserGroup
    has_many :members, CGraph.Forums.ForumMember
    has_many :announcements, CGraph.Forums.ForumAnnouncement

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

  @doc """
  Changeset for hierarchy operations (moving forums, reordering).
  """
  def hierarchy_changeset(forum, attrs) do
    forum
    |> cast(attrs, [
      :parent_forum_id, :display_order, :show_in_navigation,
      :collapsed_by_default, :forum_type, :redirect_url, :inherit_permissions
    ])
    |> validate_inclusion(:forum_type, ["category", "forum", "link"])
    |> validate_redirect_url()
    |> validate_not_self_parent()
    |> foreign_key_constraint(:parent_forum_id)
  end

  # Validate that forum is not set as its own parent.
  defp validate_not_self_parent(changeset) do
    case {get_field(changeset, :id), get_change(changeset, :parent_forum_id)} do
      {id, parent_id} when id == parent_id and not is_nil(id) ->
        add_error(changeset, :parent_forum_id, "cannot be the forum itself")
      _ ->
        changeset
    end
  end

  # Validate redirect URL is present for link-type forums.
  defp validate_redirect_url(changeset) do
    case get_field(changeset, :forum_type) do
      "link" ->
        validate_required(changeset, [:redirect_url])
      _ ->
        changeset
    end
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

  # =============================================================================
  # HIERARCHY QUERIES
  # =============================================================================

  import Ecto.Query

  @doc """
  Query for root-level forums only (no parent).
  """
  def root_forums_query do
    from f in __MODULE__,
      where: is_nil(f.parent_forum_id) and is_nil(f.deleted_at),
      order_by: [asc: f.display_order, asc: f.name]
  end

  @doc """
  Query for sub-forums of a given parent.
  """
  def sub_forums_query(parent_id) do
    from f in __MODULE__,
      where: f.parent_forum_id == ^parent_id and is_nil(f.deleted_at),
      order_by: [asc: f.display_order, asc: f.name]
  end

  @doc """
  Query for forums at a specific depth level.
  """
  def at_depth_query(depth) do
    from f in __MODULE__,
      where: f.depth == ^depth and is_nil(f.deleted_at),
      order_by: [asc: f.display_order, asc: f.name]
  end

  @doc """
  Query for all forums in a subtree (using materialized path).
  """
  def subtree_query(forum_path) do
    pattern = forum_path <> "%"
    from f in __MODULE__,
      where: like(f.path, ^pattern) and is_nil(f.deleted_at),
      order_by: [asc: f.depth, asc: f.display_order, asc: f.name]
  end

  @doc """
  Query for visible forums in navigation.
  """
  def navigation_query do
    from f in __MODULE__,
      where: f.show_in_navigation == true and is_nil(f.deleted_at),
      order_by: [asc: f.depth, asc: f.display_order, asc: f.name]
  end

  @doc """
  Preload hierarchy relationships.
  """
  def with_hierarchy(query) do
    from q in query,
      preload: [:parent_forum, :sub_forums]
  end

  @doc """
  Build a nested tree structure from flat forum list.
  Returns forums organized by parent_id for efficient tree building.
  """
  def build_tree(forums) do
    forums_by_parent =
      forums
      |> Enum.group_by(& &1.parent_forum_id)

    root_forums = Map.get(forums_by_parent, nil, [])
    build_tree_recursive(root_forums, forums_by_parent)
  end

  defp build_tree_recursive(forums, forums_by_parent) do
    Enum.map(forums, fn forum ->
      children = Map.get(forums_by_parent, forum.id, [])
      Map.put(forum, :children, build_tree_recursive(children, forums_by_parent))
    end)
  end

  @doc """
  Get breadcrumb path for a forum.
  Returns list of {id, name, slug} tuples from root to current forum.
  """
  def get_breadcrumbs(forum, repo) do
    ancestors = get_ancestors(forum, repo)
    Enum.map(ancestors ++ [forum], fn f ->
      %{id: f.id, name: f.name, slug: f.slug}
    end)
  end

  @doc """
  Get all ancestor forums.
  """
  def get_ancestors(%{parent_forum_id: nil}, _repo), do: []
  def get_ancestors(%{parent_forum_id: parent_id}, repo) do
    # Use recursive CTE for efficient ancestor lookup
    query = """
    WITH RECURSIVE ancestors AS (
      SELECT id, name, slug, depth, parent_forum_id
      FROM forums
      WHERE id = $1

      UNION ALL

      SELECT p.id, p.name, p.slug, p.depth, p.parent_forum_id
      FROM forums p
      INNER JOIN ancestors a ON p.id = a.parent_forum_id
    )
    SELECT id, name, slug, depth FROM ancestors
    WHERE id != $1
    ORDER BY depth ASC
    """

    case repo.query(query, [Ecto.UUID.dump!(parent_id)]) do
      {:ok, %{rows: rows}} ->
        Enum.map(rows, fn [id, name, slug, depth] ->
          %{
            id: Ecto.UUID.cast!(id),
            name: name,
            slug: slug,
            depth: depth
          }
        end)
      _ ->
        []
    end
  end

  @doc """
  Check if forum is an ancestor of another forum.
  """
  def ancestor?(potential_ancestor, forum) do
    String.starts_with?(forum.path || "", potential_ancestor.path || "")
  end

  @doc """
  Check if forum is a descendant of another forum.
  """
  def descendant?(potential_descendant, forum) do
    String.starts_with?(potential_descendant.path || "", forum.path || "")
  end
end
