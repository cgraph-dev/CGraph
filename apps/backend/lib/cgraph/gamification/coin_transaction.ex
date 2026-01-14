defmodule CGraph.Gamification.CoinTransaction do
  @moduledoc """
  Schema for tracking coin balance changes.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @types ~w(purchase reward daily_bonus achievement quest gift refund streak admin)

  schema "coin_transactions" do
    belongs_to :user, CGraph.Accounts.User

    field :amount, :integer
    field :balance_after, :integer
    field :type, :string
    field :description, :string
    field :reference_type, :string
    field :reference_id, :binary_id
    field :metadata, :map, default: %{}

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(transaction, attrs) do
    transaction
    |> cast(attrs, [
      :user_id, :amount, :balance_after, :type, :description,
      :reference_type, :reference_id, :metadata
    ])
    |> validate_required([:user_id, :amount, :balance_after, :type])
    |> validate_inclusion(:type, @types)
    |> foreign_key_constraint(:user_id)
  end

  def types, do: @types
end
