defmodule CGraph.Gamification.BattlePassTier do
  @moduledoc "Schema for battle pass tier rewards."
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "battle_pass_tiers" do
    field :tier_number, :integer
    field :xp_required, :integer, default: 0
    field :free_reward_type, :string
    field :free_reward_id, :binary_id
    field :free_reward_amount, :integer, default: 0
    field :premium_reward_type, :string
    field :premium_reward_id, :binary_id
    field :premium_reward_amount, :integer, default: 0

    belongs_to :seasonal_event, CGraph.Gamification.SeasonalEvent

    timestamps(type: :utc_datetime)
  end

  @doc "Builds a changeset for validating and casting attributes."
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(tier, attrs) do
    tier
    |> cast(attrs, [
      :tier_number, :xp_required,
      :free_reward_type, :free_reward_id, :free_reward_amount,
      :premium_reward_type, :premium_reward_id, :premium_reward_amount,
      :seasonal_event_id
    ])
    |> validate_required([:tier_number, :seasonal_event_id])
  end
end
