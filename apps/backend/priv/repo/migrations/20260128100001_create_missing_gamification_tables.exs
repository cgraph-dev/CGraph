defmodule CGraph.Repo.Migrations.CreateMissingGamificationTables do
  @moduledoc """
  Creates avatar_borders catalog table and marketplace_items table.
  These schemas were defined but their migrations were missing.
  """
  use Ecto.Migration

  def change do
    # Avatar Borders catalog - stores all available border designs
    create_if_not_exists table(:avatar_borders, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :slug, :string, null: false
      add :name, :string, null: false
      add :description, :text
      add :theme, :string, null: false
      add :rarity, :string, null: false

      # Visual configuration
      add :border_style, :map, default: %{}
      add :animation_type, :string, default: "none"
      add :animation_speed, :float, default: 1.0
      add :animation_intensity, :float, default: 1.0
      add :colors, {:array, :string}, default: []
      add :particle_config, :map, default: %{}
      add :glow_config, :map, default: %{}

      # Unlock configuration
      add :unlock_type, :string
      add :unlock_requirement, :string
      add :is_purchasable, :boolean, default: false
      add :coin_cost, :integer, default: 0
      add :gem_cost, :integer, default: 0

      # Seasonal/event
      add :season_id, :binary_id
      add :event_id, :binary_id
      add :available_from, :utc_datetime
      add :available_until, :utc_datetime

      # Meta
      add :sort_order, :integer, default: 0
      add :is_active, :boolean, default: true
      add :preview_url, :string

      timestamps(type: :utc_datetime)
    end

    create_if_not_exists unique_index(:avatar_borders, [:slug])

    # Marketplace Items - user-listed items for sale/trade
    create_if_not_exists table(:marketplace_items, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :item_type, :string
      add :item_id, :binary_id
      add :listing_status, :string, default: "active"

      # Pricing
      add :price, :integer
      add :currency_type, :string, default: "coins"
      add :original_price, :integer
      add :min_price, :integer
      add :max_price, :integer

      # Fees
      add :listing_fee, :integer, default: 0
      add :transaction_fee_percent, :float, default: 0.05

      # Listing metadata
      add :listed_at, :utc_datetime
      add :expires_at, :utc_datetime
      add :sold_at, :utc_datetime

      # Item details (cached for display)
      add :item_name, :string
      add :item_rarity, :string
      add :item_preview_url, :string
      add :item_metadata, :map, default: %{}

      # Trade support
      add :accepts_trades, :boolean, default: false
      add :trade_preferences, {:array, :string}, default: []

      add :seller_id, references(:users, type: :binary_id, on_delete: :nilify_all)
      add :buyer_id, references(:users, type: :binary_id, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create_if_not_exists index(:marketplace_items, [:seller_id])
    create_if_not_exists index(:marketplace_items, [:listing_status])
    create_if_not_exists index(:marketplace_items, [:item_type])

    # Blocks table - for user blocking functionality
    create_if_not_exists table(:blocks, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :blocker_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :blocked_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create_if_not_exists unique_index(:blocks, [:blocker_id, :blocked_id])
    create_if_not_exists index(:blocks, [:blocked_id])
  end
end
