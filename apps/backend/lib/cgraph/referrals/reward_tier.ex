defmodule CGraph.Referrals.RewardTier do
  @moduledoc """
  Schema for referral reward tiers.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "referral_reward_tiers" do
    field :name, :string
    field :description, :string
    field :required_referrals, :integer
    field :reward_type, :string
    field :reward_value, :map
    field :icon, :string
    field :order, :integer, default: 0

    timestamps(type: :utc_datetime)
  end

  @required_fields ~w(name required_referrals reward_type)a
  @optional_fields ~w(description reward_value icon order)a

  @valid_reward_types ~w(badge points title custom)

  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(tier, attrs) do
    tier
    |> cast(attrs, @required_fields ++ @optional_fields)
    |> validate_required(@required_fields)
    |> validate_length(:name, min: 1, max: 100)
    |> validate_number(:required_referrals, greater_than: 0)
    |> validate_inclusion(:reward_type, @valid_reward_types)
    |> unique_constraint(:name)
  end
end
