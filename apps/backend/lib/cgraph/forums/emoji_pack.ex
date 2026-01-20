defmodule CGraph.Forums.EmojiPack do
  @moduledoc """
  Schema for emoji packs (collections of related emojis).

  Emoji packs allow users to import/export collections of custom emojis.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Forums.{Forum, CustomEmoji}
  alias CGraph.Accounts.User

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "emoji_packs" do
    field :name, :string
    field :description, :string
    field :author, :string
    field :version, :string, default: "1.0.0"
    field :icon_url, :string
    field :source_url, :string
    field :is_active, :boolean, default: true
    field :is_premium, :boolean, default: false
    field :emoji_count, :integer, default: 0

    belongs_to :forum, Forum
    belongs_to :created_by, User
    has_many :emojis, CustomEmoji, foreign_key: :pack_id

    timestamps()
  end

  @doc """
  Changeset for creating a new pack.
  """
  def create_changeset(pack, attrs) do
    pack
    |> cast(attrs, [
      :name, :description, :author, :version, :icon_url,
      :source_url, :forum_id, :created_by_id, :is_premium
    ])
    |> validate_required([:name])
    |> validate_length(:name, min: 2, max: 100)
    |> validate_length(:description, max: 500)
    |> validate_format(:version, ~r/^\d+\.\d+\.\d+$/,
        message: "must be in semver format (e.g., 1.0.0)")
  end

  @doc """
  Changeset for updating a pack.
  """
  def update_changeset(pack, attrs) do
    pack
    |> cast(attrs, [
      :name, :description, :author, :version, :icon_url,
      :source_url, :is_active, :is_premium
    ])
    |> validate_length(:name, min: 2, max: 100)
    |> validate_length(:description, max: 500)
  end

  @doc """
  Update emoji count.
  """
  def update_emoji_count(pack, count) do
    change(pack, %{emoji_count: count})
  end
end
