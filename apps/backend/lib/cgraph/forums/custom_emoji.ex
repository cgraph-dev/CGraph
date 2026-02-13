defmodule CGraph.Forums.CustomEmoji do
  @moduledoc """
  Schema for custom emojis.

  Custom emojis can be:
  - Global (available everywhere)
  - Forum-scoped (only available in a specific forum)

  Features:
  - Shortcode-based usage (:shortcode:)
  - Category organization
  - Usage tracking
  - Moderation workflow (pending → approved/rejected)
  - Animated emoji support (GIF, APNG)
  - Aliases for multiple shortcodes
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Accounts.User
  alias CGraph.Forums.{EmojiCategory, EmojiPack, Forum}
  alias CGraph.Repo

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @allowed_image_types ~w(png gif webp apng jpg jpeg)
  @max_file_size 512_000  # 512KB
  @max_dimension 256  # 256x256 max

  schema "custom_emojis" do
    field :shortcode, :string
    field :name, :string
    field :description, :string

    # Image
    field :image_url, :string
    field :image_type, :string, default: "png"
    field :file_size, :integer
    field :width, :integer
    field :height, :integer
    field :is_animated, :boolean, default: false

    # Status
    field :is_active, :boolean, default: true
    field :is_system, :boolean, default: false
    field :is_nsfw, :boolean, default: false

    # Moderation
    field :approved_at, :utc_datetime
    field :rejected_at, :utc_datetime
    field :rejection_reason, :string

    # Usage
    field :usage_count, :integer, default: 0
    field :last_used_at, :utc_datetime

    # Aliases
    field :aliases, {:array, :string}, default: []

    # Ordering
    field :display_order, :integer, default: 0

    # Associations
    belongs_to :category, EmojiCategory
    belongs_to :forum, Forum
    belongs_to :pack, EmojiPack
    belongs_to :created_by, User
    belongs_to :approved_by, User

    timestamps()
  end

  @doc """
  Changeset for creating a new custom emoji.
  """
  def create_changeset(emoji, attrs) do
    emoji
    |> cast(attrs, [
      :shortcode, :name, :description, :image_url, :image_type,
      :file_size, :width, :height, :is_animated, :category_id,
      :forum_id, :created_by_id, :pack_id, :aliases, :display_order,
      :is_nsfw
    ])
    |> validate_required([:shortcode, :name, :image_url])
    |> validate_shortcode()
    |> validate_image()
    |> validate_aliases()
    |> unique_constraint([:shortcode, :forum_id],
        name: :custom_emojis_shortcode_forum_unique)
    |> unique_constraint([:shortcode],
        name: :custom_emojis_shortcode_global_unique)
  end

  @doc """
  Changeset for updating an existing emoji.
  """
  def update_changeset(emoji, attrs) do
    emoji
    |> cast(attrs, [
      :name, :description, :image_url, :image_type,
      :category_id, :aliases, :display_order, :is_nsfw, :is_active
    ])
    |> validate_shortcode()
    |> validate_image()
    |> validate_aliases()
  end

  @doc """
  Changeset for approving an emoji.
  """
  def approve_changeset(emoji, approver_id) do
    emoji
    |> change(%{
      approved_at: DateTime.utc_now(),
      approved_by_id: approver_id,
      is_active: true,
      rejected_at: nil,
      rejection_reason: nil
    })
  end

  @doc """
  Changeset for rejecting an emoji.
  """
  def reject_changeset(emoji, reason) do
    emoji
    |> change(%{
      rejected_at: DateTime.utc_now(),
      rejection_reason: reason,
      is_active: false,
      approved_at: nil,
      approved_by_id: nil
    })
  end

  @doc """
  Increment usage count and update last_used_at.
  """
  def increment_usage(emoji_id) do
    from(e in __MODULE__, where: e.id == ^emoji_id)
    |> Repo.update_all(
      set: [last_used_at: DateTime.utc_now()],
      inc: [usage_count: 1]
    )
  end

  # Validations

  defp validate_shortcode(changeset) do
    changeset
    |> validate_length(:shortcode, min: 2, max: 32)
    |> validate_format(:shortcode, ~r/^[a-z0-9_]+$/,
        message: "must be lowercase alphanumeric with underscores")
    |> update_change(:shortcode, &String.downcase/1)
  end

  defp validate_image(changeset) do
    changeset
    |> validate_inclusion(:image_type, @allowed_image_types,
        message: "must be one of: #{Enum.join(@allowed_image_types, ", ")}")
    |> validate_number(:file_size, less_than_or_equal_to: @max_file_size,
        message: "must be less than 512KB")
    |> validate_number(:width, less_than_or_equal_to: @max_dimension,
        message: "must be 256px or smaller")
    |> validate_number(:height, less_than_or_equal_to: @max_dimension,
        message: "must be 256px or smaller")
  end

  defp validate_aliases(changeset) do
    case get_change(changeset, :aliases) do
      nil -> changeset
      aliases ->
        validated = Enum.map(aliases, &String.downcase/1)
        |> Enum.filter(&valid_shortcode?/1)
        |> Enum.take(5)  # Max 5 aliases
        put_change(changeset, :aliases, validated)
    end
  end

  defp valid_shortcode?(shortcode) do
    String.length(shortcode) >= 2 &&
    String.length(shortcode) <= 32 &&
    Regex.match?(~r/^[a-z0-9_]+$/, shortcode)
  end

  # Query helpers

  @doc """
  Get all active global emojis.
  """
  def global_query do
    from e in __MODULE__,
      where: is_nil(e.forum_id) and e.is_active == true,
      order_by: [asc: e.display_order, asc: e.name]
  end

  @doc """
  Get emojis available for a specific forum (global + forum-specific).
  """
  def available_for_forum_query(forum_id) do
    from e in __MODULE__,
      where: (is_nil(e.forum_id) or e.forum_id == ^forum_id) and e.is_active == true,
      order_by: [asc: e.display_order, asc: e.name]
  end

  @doc """
  Get emojis by category.
  """
  def by_category_query(category_id) do
    from e in __MODULE__,
      where: e.category_id == ^category_id and e.is_active == true,
      order_by: [asc: e.display_order, asc: e.name]
  end

  @doc """
  Search emojis by shortcode or name.
  """
  def search_query(search_term) do
    search_pattern = "%#{search_term}%"

    from e in __MODULE__,
      where: e.is_active == true and
             (ilike(e.shortcode, ^search_pattern) or
              ilike(e.name, ^search_pattern) or
              ^search_term in e.aliases),
      order_by: [desc: e.usage_count, asc: e.name],
      limit: 50
  end

  @doc """
  Get most used emojis.
  """
  def popular_query(limit \\ 20) do
    from e in __MODULE__,
      where: e.is_active == true,
      order_by: [desc: e.usage_count],
      limit: ^limit
  end

  @doc """
  Get pending emojis awaiting moderation.
  """
  def pending_query do
    from e in __MODULE__,
      where: is_nil(e.approved_at) and is_nil(e.rejected_at),
      order_by: [asc: e.inserted_at]
  end
end
