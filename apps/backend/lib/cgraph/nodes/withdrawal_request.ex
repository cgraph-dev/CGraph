defmodule CGraph.Nodes.WithdrawalRequest do
  @moduledoc """
  Schema for withdrawal_requests table.

  Tracks user requests to convert Nodes to fiat currency (EUR).
  Conversion rate: €0.80 per 100 nodes (nodes × 0.008 = EUR).
  Minimum withdrawal: 1000 nodes.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  schema "withdrawal_requests" do
    belongs_to :user, CGraph.Accounts.User, type: :binary_id

    field :nodes_amount, :integer
    field :currency, :string, default: "EUR"
    field :fiat_amount, :decimal
    field :status, :string, default: "pending"
    field :payout_reference, :string

    field :inserted_at, :utc_datetime, autogenerate: {DateTime, :utc_now, []}
    field :completed_at, :utc_datetime
  end

  @valid_statuses ~w(pending processing completed failed)

  @doc false
  def changeset(request, attrs) do
    request
    |> cast(attrs, [:user_id, :nodes_amount, :currency, :fiat_amount, :status, :payout_reference, :completed_at])
    |> validate_required([:user_id, :nodes_amount, :fiat_amount])
    |> validate_number(:nodes_amount, greater_than_or_equal_to: 1000)
    |> validate_inclusion(:status, @valid_statuses)
  end
end
