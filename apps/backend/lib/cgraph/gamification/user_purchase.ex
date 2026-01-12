defmodule Cgraph.Gamification.UserPurchase do
  @moduledoc """
  Schema for tracking user purchases from the shop.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_purchases" do
    belongs_to :user, Cgraph.Accounts.User
    belongs_to :item, Cgraph.Gamification.ShopItem

    field :quantity, :integer, default: 1
    field :coin_spent, :integer
    field :purchased_at, :utc_datetime

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(purchase, attrs) do
    purchase
    |> cast(attrs, [:user_id, :item_id, :quantity, :coin_spent, :purchased_at])
    |> validate_required([:user_id, :item_id, :quantity, :coin_spent, :purchased_at])
    |> validate_number(:quantity, greater_than: 0)
    |> validate_number(:coin_spent, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:item_id)
  end
end
