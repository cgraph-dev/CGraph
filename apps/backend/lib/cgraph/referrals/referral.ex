defmodule CGraph.Referrals.Referral do
  @moduledoc """
  Schema for referrals.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Accounts.User

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "referrals" do
    field :code_used, :string
    field :status, :string, default: "pending"
    field :reward_earned, :integer, default: 0
    field :confirmed_at, :utc_datetime

    belongs_to :referrer, User, foreign_key: :referrer_id
    belongs_to :referred_user, User, foreign_key: :referred_id

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(referrer_id referred_id)a
  @optional_fields ~w(code_used status reward_earned confirmed_at)a

  @valid_statuses ~w(pending confirmed rejected expired)

  @doc "Builds a changeset for validating and casting attributes."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(referral, attrs) do
    referral
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, @valid_statuses)
    |> foreign_key_constraint(:referrer_id)
    |> foreign_key_constraint(:referred_id)
    |> unique_constraint(:referred_id, message: "user has already been referred")
  end
end
