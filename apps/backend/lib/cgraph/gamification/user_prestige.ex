defmodule CGraph.Gamification.UserPrestige do
  @moduledoc """
  Schema for tracking user prestige levels and bonuses.

  Prestige System:
  - Prestige levels 1-∞
  - Permanent percentage bonuses
  - Exclusive rewards at each tier
  - Cross-season persistence
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "user_prestiges" do
    field :prestige_level, :integer, default: 0
    field :prestige_xp, :integer, default: 0
    field :xp_to_next_prestige, :integer, default: 100_000

    # Bonuses (percentages as decimals, e.g., 0.05 = 5%)
    field :xp_bonus, :float, default: 0.0
    field :coin_bonus, :float, default: 0.0
    field :karma_bonus, :float, default: 0.0
    field :drop_rate_bonus, :float, default: 0.0

    # Prestige history
    field :prestige_history, {:array, :map}, default: []
    field :total_resets, :integer, default: 0
    field :last_prestige_at, :utc_datetime

    # Exclusive unlocks
    field :exclusive_titles, {:array, :binary_id}, default: []
    field :exclusive_borders, {:array, :binary_id}, default: []
    field :exclusive_effects, {:array, :binary_id}, default: []

    # Multiplier
    field :xp_multiplier, :float, default: 1.0

    # Stats preserved across prestiges
    field :lifetime_xp, :integer, default: 0
    field :lifetime_karma, :integer, default: 0
    field :lifetime_coins_earned, :integer, default: 0
    field :lifetime_messages, :integer, default: 0

    belongs_to :user, CGraph.Accounts.User

    timestamps(type: :utc_datetime)
  end

  @doc false
  @spec changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def changeset(prestige, attrs) do
    prestige
    |> cast(attrs, [
      :user_id, :prestige_level, :prestige_xp, :xp_to_next_prestige,
      :xp_bonus, :coin_bonus, :karma_bonus, :drop_rate_bonus, :xp_multiplier,
      :prestige_history, :total_resets, :last_prestige_at,
      :exclusive_titles, :exclusive_borders, :exclusive_effects,
      :lifetime_xp, :lifetime_karma, :lifetime_coins_earned, :lifetime_messages
    ])
    |> validate_required([:user_id])
    |> validate_number(:prestige_level, greater_than_or_equal_to: 0)
    |> validate_number(:prestige_xp, greater_than_or_equal_to: 0)
    |> validate_number(:xp_bonus, greater_than_or_equal_to: 0)
    |> validate_number(:coin_bonus, greater_than_or_equal_to: 0)
    |> validate_number(:karma_bonus, greater_than_or_equal_to: 0)
    |> validate_number(:drop_rate_bonus, greater_than_or_equal_to: 0)
    |> foreign_key_constraint(:user_id)
    |> unique_constraint(:user_id)
  end

  @spec prestige_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def prestige_changeset(prestige, attrs) do
    prestige
    |> cast(attrs, [
      :prestige_level, :prestige_xp, :xp_to_next_prestige,
      :xp_bonus, :coin_bonus, :karma_bonus, :drop_rate_bonus,
      :prestige_history, :total_resets, :last_prestige_at
    ])
  end

  @spec add_exclusive_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def add_exclusive_changeset(prestige, attrs) do
    prestige
    |> cast(attrs, [:exclusive_titles, :exclusive_borders, :exclusive_effects])
  end

  @spec update_lifetime_stats_changeset(%__MODULE__{}, map()) :: Ecto.Changeset.t()
  def update_lifetime_stats_changeset(prestige, attrs) do
    prestige
    |> cast(attrs, [:lifetime_xp, :lifetime_karma, :lifetime_coins_earned, :lifetime_messages])
  end

  @doc """
  Calculate XP required for next prestige level.
  Uses exponential scaling.
  """
  @spec xp_required_for_prestige(integer()) :: non_neg_integer()
  def xp_required_for_prestige(level) when level < 0, do: 0
  def xp_required_for_prestige(0), do: 100_000
  def xp_required_for_prestige(level) do
    base = 100_000
    multiplier = 1.5
    round(base * :math.pow(multiplier, level))
  end

  @doc """
  Calculate bonus percentage for a prestige level.
  """
  @spec bonus_for_prestige_level(integer(), atom()) :: float()
  def bonus_for_prestige_level(level, _bonus_type) when level < 0, do: 0.0
  def bonus_for_prestige_level(level, bonus_type) do
    base_bonus = case bonus_type do
      :xp -> 0.05        # 5% per prestige
      :coin -> 0.03      # 3% per prestige
      :karma -> 0.02     # 2% per prestige
      :drop_rate -> 0.01 # 1% per prestige
      _ -> 0.0
    end
    level * base_bonus
  end
end
