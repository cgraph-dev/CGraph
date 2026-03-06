defmodule CGraph.Stickers.StickerPack do
  @moduledoc """
  Schema for sticker packs.

  All sticker packs are official/shared — pre-made collections that users
  can browse and add to their personal collection. Users cannot upload
  custom stickers; all packs are curated.

  ## Categories

  - animals, emotions, memes, gaming, holidays, food, love, greeting,
    celebration, seasonal

  ## Types

  - static (webp/png), animated (apng/lottie), video (gif/webm)
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  @categories ~w(animals emotions memes gaming holidays food love greeting celebration seasonal)
  @sticker_types ~w(static animated video)

  schema "sticker_packs" do
    field :name, :string
    field :title, :string
    field :description, :string
    field :author, :string
    field :thumbnail_url, :string
    field :category, :string
    field :sticker_type, :string, default: "static"
    field :is_premium, :boolean, default: false
    field :is_animated, :boolean, default: false
    field :coin_price, :integer, default: 0
    field :download_count, :integer, default: 0
    field :sticker_count, :integer, default: 0
    field :sort_order, :integer, default: 0
    field :published, :boolean, default: true

    has_many :stickers, CGraph.Stickers.Sticker

    timestamps()
  end

  @required_fields ~w(name title thumbnail_url category)a
  @optional_fields ~w(description author sticker_type is_premium is_animated coin_price sort_order published)a

  @doc "Changeset for creating/updating a sticker pack."
  def changeset(pack, attrs) do
    pack
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:category, @categories)
    |> validate_inclusion(:sticker_type, @sticker_types)
    |> validate_length(:name, min: 1, max: 100)
    |> validate_length(:title, min: 1, max: 200)
    |> validate_length(:description, max: 1000)
    |> validate_number(:coin_price, greater_than_or_equal_to: 0)
    |> unique_constraint(:name)
  end

  @doc "Returns the list of valid categories."
  def categories, do: @categories

  @doc "Returns the list of valid sticker types."
  def sticker_types, do: @sticker_types
end
