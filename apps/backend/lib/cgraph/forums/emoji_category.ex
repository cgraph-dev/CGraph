defmodule CGraph.Forums.EmojiCategory do
  @moduledoc """
  Schema for emoji categories.

  Categories help organize custom emojis into logical groups.
  Can be global (site-wide) or forum-specific.
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias CGraph.Forums.{CustomEmoji, Forum}

  @derive {Jason.Encoder, only: [:id, :name, :description, :display_order, :icon, :is_active, :is_system, :emojis]}
  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "emoji_categories" do
    field :name, :string
    field :description, :string
    field :display_order, :integer, default: 0
    field :icon, :string
    field :is_active, :boolean, default: true
    field :is_system, :boolean, default: false

    belongs_to :forum, Forum
    has_many :emojis, CustomEmoji, foreign_key: :category_id

    timestamps()
  end

  @doc """
  Changeset for creating a new category.
  """
  def create_changeset(category, attrs) do
    category
    |> cast(attrs, [:name, :description, :display_order, :icon, :forum_id])
    |> validate_required([:name])
    |> validate_length(:name, min: 1, max: 50)
    |> validate_length(:description, max: 200)
    |> unique_constraint([:name, :forum_id],
        name: :emoji_categories_name_forum_unique)
    |> unique_constraint([:name],
        name: :emoji_categories_name_global_unique)
  end

  @doc """
  Changeset for updating a category.
  """
  def update_changeset(category, attrs) do
    if category.is_system do
      category
      |> change()
      |> add_error(:is_system, "system categories cannot be modified")
    else
      category
      |> cast(attrs, [:name, :description, :display_order, :icon, :is_active])
      |> validate_length(:name, min: 1, max: 50)
      |> validate_length(:description, max: 200)
    end
  end

  @doc """
  Get all global categories.
  """
  def global_query do
    from c in __MODULE__,
      where: is_nil(c.forum_id) and c.is_active == true,
      order_by: [asc: c.display_order, asc: c.name]
  end

  @doc """
  Get categories available for a forum (global + forum-specific).
  """
  def available_for_forum_query(forum_id) do
    from c in __MODULE__,
      where: (is_nil(c.forum_id) or c.forum_id == ^forum_id) and c.is_active == true,
      order_by: [asc: c.display_order, asc: c.name]
  end
end
