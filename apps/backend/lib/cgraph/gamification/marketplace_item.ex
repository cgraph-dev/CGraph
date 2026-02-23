defmodule CGraph.Gamification.MarketplaceItem do
  @moduledoc """
  Schema for marketplace items that users can buy, sell, or trade.

  Features:
  - User-listed cosmetics
  - Dynamic pricing
  - Trading support
  - Rarity-based fees
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @item_types ~w(avatar_border profile_theme chat_effect title badge)
  @listing_statuses ~w(active sold cancelled expired)
  @currency_types ~w(coins gems)

  schema "marketplace_items" do
    field :item_type, :string
    field :item_id, :binary_id  # References the actual cosmetic
    field :listing_status, :string, default: "active"

    # Pricing
    field :price, :integer
    field :currency_type, :string, default: "coins"
    field :original_price, :integer  # For tracking price changes
    field :min_price, :integer
    field :max_price, :integer

    # Fees
    field :listing_fee, :integer, default: 0
    field :transaction_fee_percent, :float, default: 0.05  # 5% fee

    # Listing metadata
    field :listed_at, :utc_datetime
    field :expires_at, :utc_datetime
    field :sold_at, :utc_datetime

    # Item details (cached for display)
    field :item_name, :string
    field :item_rarity, :string
    field :item_preview_url, :string
    field :item_metadata, :map, default: %{}

    # Trade support
    field :accepts_trades, :boolean, default: false
    field :trade_preferences, {:array, :string}, default: []

    belongs_to :seller, CGraph.Accounts.User
    belongs_to :buyer, CGraph.Accounts.User

    timestamps(type: :utc_datetime)
  end

  @type t :: %__MODULE__{}

  @doc false
  @spec changeset(t() | Ecto.Changeset.t(), map()) :: Ecto.Changeset.t()
  def changeset(item, attrs) do
    item
    |> cast(attrs, [
      :item_type, :item_id, :listing_status,
      :price, :currency_type, :original_price, :min_price, :max_price,
      :listing_fee, :transaction_fee_percent,
      :listed_at, :expires_at, :sold_at,
      :item_name, :item_rarity, :item_preview_url, :item_metadata,
      :accepts_trades, :trade_preferences,
      :seller_id, :buyer_id
    ])
    |> validate_required([:item_type, :item_id, :price, :currency_type, :seller_id])
    |> validate_inclusion(:item_type, @item_types)
    |> validate_inclusion(:listing_status, @listing_statuses)
    |> validate_inclusion(:currency_type, @currency_types)
    |> validate_number(:price, greater_than: 0)
    |> validate_price_bounds()
    |> validate_number(:transaction_fee_percent, greater_than_or_equal_to: 0, less_than_or_equal_to: 0.5)
    |> foreign_key_constraint(:seller_id)
    |> foreign_key_constraint(:buyer_id)
  end

  defp validate_price_bounds(changeset) do
    price = get_field(changeset, :price)
    min_price = get_field(changeset, :min_price)
    max_price = get_field(changeset, :max_price)

    changeset
    |> validate_min_price(price, min_price)
    |> validate_max_price(price, max_price)
  end

  defp validate_min_price(changeset, _, nil), do: changeset
  defp validate_min_price(changeset, price, min_price) when price >= min_price, do: changeset
  defp validate_min_price(changeset, _, _), do: add_error(changeset, :price, "must be at least minimum price")

  defp validate_max_price(changeset, _, nil), do: changeset
  defp validate_max_price(changeset, price, max_price) when price <= max_price, do: changeset
  defp validate_max_price(changeset, _, _), do: add_error(changeset, :price, "must not exceed maximum price")

  @doc "Builds a changeset for processing a purchase."
  @spec purchase_changeset(t(), String.t()) :: Ecto.Changeset.t()
  def purchase_changeset(item, buyer_id) do
    item
    |> cast(%{
      listing_status: "sold",
      buyer_id: buyer_id,
      sold_at: DateTime.truncate(DateTime.utc_now(), :second)
    }, [:listing_status, :buyer_id, :sold_at])
  end

  @doc "Builds a changeset for cancelling a record."
  @spec cancel_changeset(t()) :: Ecto.Changeset.t()
  def cancel_changeset(item) do
    item
    |> cast(%{listing_status: "cancelled"}, [:listing_status])
  end

  @doc "Builds a changeset for updating the price."
  @spec update_price_changeset(t(), integer()) :: Ecto.Changeset.t()
  def update_price_changeset(item, new_price) do
    item
    |> cast(%{price: new_price}, [:price])
    |> validate_number(:price, greater_than: 0)
    |> validate_price_bounds()
  end

  @doc "Returns the list of available item types."
  @spec item_types() :: [String.t()]
  def item_types, do: @item_types
  @doc "Returns the list of available listing statuses."
  @spec listing_statuses() :: [String.t()]
  def listing_statuses, do: @listing_statuses
  @doc "Returns the list of available currency types."
  @spec currency_types() :: [String.t()]
  def currency_types, do: @currency_types

  @doc """
  Calculate transaction fee for a sale.
  """
  @spec calculate_fee(t()) :: non_neg_integer()
  def calculate_fee(%__MODULE__{price: price, transaction_fee_percent: fee_percent}) do
    round(price * fee_percent)
  end

  @doc """
  Calculate seller proceeds after fees.
  """
  @spec calculate_proceeds(t()) :: integer()
  def calculate_proceeds(%__MODULE__{} = item) do
    item.price - calculate_fee(item)
  end

  @doc """
  Get recommended price based on rarity.
  """
  @spec recommended_price_for_rarity(String.t()) :: %{min: integer(), max: integer(), suggested: integer()}
  def recommended_price_for_rarity(rarity) do
    case rarity do
      "common" -> %{min: 100, max: 500, suggested: 250}
      "uncommon" -> %{min: 300, max: 1500, suggested: 750}
      "rare" -> %{min: 1000, max: 5000, suggested: 2500}
      "epic" -> %{min: 3000, max: 15_000, suggested: 7500}
      "legendary" -> %{min: 10_000, max: 50_000, suggested: 25_000}
      "mythic" -> %{min: 25_000, max: 150_000, suggested: 75_000}
      "unique" -> %{min: 50_000, max: 500_000, suggested: 150_000}
      _ -> %{min: 100, max: 10_000, suggested: 1000}
    end
  end
end
