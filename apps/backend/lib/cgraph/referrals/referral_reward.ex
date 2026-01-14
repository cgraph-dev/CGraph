defmodule CGraph.Referrals.ReferralReward do
  @moduledoc """
  Schema for claimed referral rewards.
  """
  use Ecto.Schema
  import Ecto.Changeset

  alias CGraph.Accounts.User
  alias CGraph.Referrals.RewardTier

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "referral_rewards" do
    field :status, :string, default: "claimed"

    belongs_to :user, User
    belongs_to :tier, RewardTier

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(user_id tier_id)a
  @optional_fields ~w(status)a

  @valid_statuses ~w(claimed pending expired)

  def changeset(reward, attrs) do
    reward
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_inclusion(:status, @valid_statuses)
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:tier_id)
    |> unique_constraint([:user_id, :tier_id])
  end
end
