defmodule CGraph.Stickers.UserStickerPack do
  @moduledoc """
  Join table tracking which sticker packs a user has added to their collection.

  Users can browse the shared sticker store and add any pack (free or coin-gated).
  This schema records which packs a given user has in their tray.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_sticker_packs" do
    field :sort_order, :integer, default: 0

    belongs_to :user, CGraph.Accounts.User
    belongs_to :sticker_pack, CGraph.Stickers.StickerPack

    timestamps(updated_at: false)
  end

  @doc "Changeset for adding a sticker pack to a user's collection."
  def changeset(user_sticker_pack, attrs) do
    user_sticker_pack
    |> cast(attrs, [:user_id, :sticker_pack_id, :sort_order])
    |> validate_required([:user_id, :sticker_pack_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:sticker_pack_id)
    |> unique_constraint([:user_id, :sticker_pack_id],
      name: :user_sticker_packs_user_id_sticker_pack_id_index,
      message: "pack already added"
    )
  end
end
