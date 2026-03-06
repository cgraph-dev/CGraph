defmodule CGraph.Stickers.Sticker do
  @moduledoc """
  Schema for individual stickers within a pack.

  Each sticker has a file URL (hosted on S3/R2 CDN), an optional emoji
  shortcode for search, and dimensions for rendering.

  ## Supported file types

  - webp — static sticker (recommended)
  - apng — animated PNG
  - lottie — Lottie JSON animation
  - gif — animated GIF (legacy)
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @file_types ~w(webp apng lottie gif)

  schema "stickers" do
    field :emoji_shortcode, :string
    field :file_url, :string
    field :thumbnail_url, :string
    field :file_type, :string, default: "webp"
    field :file_size, :integer
    field :width, :integer
    field :height, :integer
    field :sort_order, :integer, default: 0

    belongs_to :sticker_pack, CGraph.Stickers.StickerPack

    timestamps(updated_at: false)
  end

  @required_fields ~w(file_url sticker_pack_id)a
  @optional_fields ~w(emoji_shortcode thumbnail_url file_type file_size width height sort_order)a

  @doc "Changeset for creating a sticker."
  def changeset(sticker, attrs) do
    sticker
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:file_type, @file_types)
    |> validate_length(:emoji_shortcode, max: 64)
    |> validate_number(:file_size, greater_than: 0)
    |> validate_number(:width, greater_than: 0)
    |> validate_number(:height, greater_than: 0)
    |> foreign_key_constraint(:sticker_pack_id)
  end

  @doc "Returns the list of valid file types."
  def file_types, do: @file_types
end
