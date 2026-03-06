defmodule CGraph.Repo.Migrations.CreateStickerSystem do
  @moduledoc """
  Creates sticker system tables: sticker_packs, stickers, user_sticker_packs.

  All sticker packs are official/shared — users browse and add pre-made packs
  to their collection, but cannot upload custom stickers.
  """
  use Ecto.Migration

  def change do
    create table(:sticker_packs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :title, :string, null: false
      add :description, :text
      add :author, :string
      add :thumbnail_url, :string, null: false
      add :category, :string, null: false
      add :sticker_type, :string, null: false, default: "static"
      add :is_premium, :boolean, null: false, default: false
      add :is_animated, :boolean, null: false, default: false
      add :coin_price, :integer, null: false, default: 0
      add :download_count, :integer, null: false, default: 0
      add :sticker_count, :integer, null: false, default: 0
      add :sort_order, :integer, null: false, default: 0
      add :published, :boolean, null: false, default: true

      timestamps()
    end

    create unique_index(:sticker_packs, [:name])
    create index(:sticker_packs, [:category])
    create index(:sticker_packs, [:is_premium])
    create index(:sticker_packs, [:published])
    create index(:sticker_packs, [:sort_order])

    create table(:stickers, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :sticker_pack_id, references(:sticker_packs, type: :binary_id, on_delete: :delete_all),
        null: false
      add :emoji_shortcode, :string
      add :file_url, :string, null: false
      add :thumbnail_url, :string
      add :file_type, :string, null: false, default: "webp"
      add :file_size, :integer
      add :width, :integer
      add :height, :integer
      add :sort_order, :integer, null: false, default: 0

      timestamps(updated_at: false)
    end

    create index(:stickers, [:sticker_pack_id, :sort_order])
    create index(:stickers, [:emoji_shortcode])

    create table(:user_sticker_packs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :sticker_pack_id, references(:sticker_packs, type: :binary_id, on_delete: :delete_all),
        null: false
      add :sort_order, :integer, null: false, default: 0

      timestamps(updated_at: false)
    end

    create unique_index(:user_sticker_packs, [:user_id, :sticker_pack_id])
    create index(:user_sticker_packs, [:user_id])
  end
end
