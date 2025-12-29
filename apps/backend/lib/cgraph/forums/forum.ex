defmodule Cgraph.Forums.Forum do
  @moduledoc """
  Forum schema for Reddit-style communities.
  
  Forums support:
  - Custom theming with CSS
  - Categories/flair
  - Moderation queue
  - Public/private visibility
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @derive {Jason.Encoder, only: [
    :id, :name, :slug, :description, :icon_url, :banner_url,
    :is_public, :member_count, :post_count, :inserted_at
  ]}

  schema "forums" do
    field :name, :string
    field :slug, :string
    field :title, :string  # Display title
    field :description, :string
    field :icon_url, :string
    field :banner_url, :string

    # Customization
    field :custom_css, :string  # User-provided CSS (sanitized)
    field :primary_color, :string, default: "#1a73e8"
    field :sidebar_html, :string  # Sidebar content (sanitized HTML)

    # Settings
    field :is_public, :boolean, default: true
    field :is_nsfw, :boolean, default: false
    field :allow_posts, :boolean, default: true
    field :allow_comments, :boolean, default: true
    field :require_post_approval, :boolean, default: false
    field :restricted_posting, :boolean, default: false  # Only approved users

    # Post settings
    field :allowed_post_types, {:array, :string}, default: ["text", "link", "image", "poll"]
    field :default_sort, :string, default: "hot"

    # Stats (denormalized)
    field :member_count, :integer, default: 1
    field :post_count, :integer, default: 0

    # Soft delete
    field :deleted_at, :utc_datetime

    belongs_to :owner, Cgraph.Accounts.User
    has_many :posts, Cgraph.Forums.Post
    has_many :categories, Cgraph.Forums.Category
    has_many :moderators, Cgraph.Forums.Moderator
    has_many :rules, Cgraph.Forums.Rule
    has_many :bans, Cgraph.Forums.Ban

    timestamps()
  end

  @doc """
  Create a new forum.
  """
  def changeset(forum, attrs) do
    forum
    |> cast(attrs, [
      :name, :slug, :title, :description, :icon_url, :banner_url, :owner_id,
      :is_public, :is_nsfw, :allow_posts, :allow_comments,
      :require_post_approval, :restricted_posting,
      :allowed_post_types, :default_sort, :primary_color
    ])
    |> validate_required([:name, :owner_id])
    |> validate_length(:name, min: 3, max: 21)
    |> validate_format(:name, ~r/^[a-zA-Z0-9_]+$/,
      message: "can only contain letters, numbers, and underscores"
    )
    |> validate_length(:title, max: 100)
    |> validate_length(:description, max: 500)
    |> validate_inclusion(:default_sort, ["hot", "new", "top", "controversial", "rising"])
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
      :is_public, :is_nsfw, :allow_posts, :allow_comments,
      :require_post_approval, :restricted_posting,
      :allowed_post_types, :default_sort, :primary_color
    ])
    |> validate_length(:description, max: 500)
    |> validate_inclusion(:default_sort, ["hot", "new", "top", "controversial", "rising"])
  end

  @doc """
  Update custom styling (CSS and sidebar).
  """
  def styling_changeset(forum, attrs) do
    forum
    |> cast(attrs, [:custom_css, :sidebar_html, :primary_color])
    |> validate_length(:custom_css, max: 100_000)
    |> validate_length(:sidebar_html, max: 10_000)
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

  defp generate_slug(changeset) do
    case get_change(changeset, :name) do
      nil -> changeset
      name -> put_change(changeset, :slug, String.downcase(name))
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
