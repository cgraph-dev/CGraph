defmodule CGraph.Gamification.ShopItem do
  @moduledoc """
  Schema for items available in the coin shop.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @categories ~w(theme badge effect boost bundle)
  @types ~w(consumable permanent subscription)

  schema "shop_items" do
    field :slug, :string
    field :name, :string
    field :description, :string
    field :category, :string
    field :type, :string
    field :icon, :string
    field :preview_url, :string
    field :coin_cost, :integer, default: 0
    field :premium_only, :boolean, default: false
    field :is_active, :boolean, default: true
    field :limited_quantity, :integer
    field :sold_count, :integer, default: 0
    field :metadata, :map, default: %{}
    field :sort_order, :integer, default: 0

    has_many :purchases, CGraph.Gamification.UserPurchase, foreign_key: :item_id

    timestamps(type: :utc_datetime)
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(shop_item, attrs) do
    shop_item
    |> cast(attrs, [
      :slug, :name, :description, :category, :type, :icon, :preview_url,
      :coin_cost, :premium_only, :is_active, :limited_quantity, :sold_count,
      :metadata, :sort_order
    ])
    |> validate_required([:slug, :name, :category, :type])
    |> validate_inclusion(:category, @categories)
    |> validate_inclusion(:type, @types)
    |> validate_number(:coin_cost, greater_than_or_equal_to: 0)
    |> unique_constraint(:slug)
  end

  @doc """
  Returns true if the item is available for purchase.
  """
  @spec available?(%__MODULE__{}) :: boolean()
  def available?(%__MODULE__{is_active: false}), do: false
  def available?(%__MODULE__{limited_quantity: nil}), do: true
  def available?(%__MODULE__{limited_quantity: qty, sold_count: sold}), do: sold < qty

  @spec categories() :: [String.t()]
  def categories, do: @categories
  @spec types() :: [String.t()]
  def types, do: @types
end
