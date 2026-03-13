defmodule CGraph.Nodes.NodeWallet do
  @moduledoc """
  Schema for node_wallets table.

  Each user has one wallet with available and pending balances.
  Purchased nodes go directly to available_balance.
  Earned nodes (tips, subscriptions) go to pending_balance with a 21-day hold.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key false
  schema "node_wallets" do
    belongs_to :user, CGraph.Accounts.User, type: :binary_id, primary_key: true

    field :available_balance, :integer, default: 0
    field :pending_balance, :integer, default: 0
    field :lifetime_earned, :integer, default: 0
    field :lifetime_spent, :integer, default: 0

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(wallet, attrs) do
    wallet
    |> cast(attrs, [:user_id, :available_balance, :pending_balance, :lifetime_earned, :lifetime_spent])
    |> validate_required([:user_id])
    |> validate_number(:available_balance, greater_than_or_equal_to: 0)
    |> validate_number(:pending_balance, greater_than_or_equal_to: 0)
  end
end
