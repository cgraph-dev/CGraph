defmodule CGraph.Creators.CreatorPayout do
  @moduledoc """
  Schema for creator payout requests.

  Tracks withdrawal requests from creators, including the Stripe Transfer
  that moves funds to their connected account.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime]

  schema "creator_payouts" do
    belongs_to :creator, CGraph.Accounts.User

    field :amount_cents, :integer
    field :currency, :string, default: "usd"
    field :stripe_transfer_id, :string
    field :status, :string, default: "pending"
    field :requested_at, :utc_datetime
    field :completed_at, :utc_datetime
    field :failure_reason, :string

    timestamps()
  end

  @required_fields ~w(creator_id amount_cents)a
  @optional_fields ~w(currency stripe_transfer_id status requested_at completed_at failure_reason)a

  @doc "Builds a changeset for a creator payout."
  def changeset(payout, attrs) do
    payout
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_number(:amount_cents, greater_than: 0)
    |> validate_inclusion(:status, ~w(pending processing completed failed))
    |> foreign_key_constraint(:creator_id)
  end
end
