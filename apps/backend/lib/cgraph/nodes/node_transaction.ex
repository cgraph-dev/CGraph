defmodule CGraph.Nodes.NodeTransaction do
  @moduledoc """
  Schema for node_transactions table.

  Records all node movements (credits and debits).
  Positive amount = credit, negative amount = debit.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  schema "node_transactions" do
    belongs_to :user, CGraph.Accounts.User, type: :binary_id

    field :amount, :integer
    field :type, :string
    field :reference_id, :binary_id
    field :reference_type, :string
    field :platform_cut, :integer
    field :net_amount, :integer
    field :hold_until, :utc_datetime
    field :metadata, :map

    field :inserted_at, :utc_datetime, autogenerate: {DateTime, :utc_now, []}
  end

  @valid_types ~w(purchase tip_received tip_sent content_unlock subscription_received subscription_sent withdrawal cosmetic_purchase reputation_reward)

  @doc false
  def changeset(transaction, attrs) do
    transaction
    |> cast(attrs, [:user_id, :amount, :type, :reference_id, :reference_type, :platform_cut, :net_amount, :hold_until, :metadata, :inserted_at])
    |> validate_required([:user_id, :amount, :type])
    |> validate_inclusion(:type, @valid_types)
  end
end
