defmodule CGraph.Subscriptions.TierFeatures do
  @moduledoc """
  Subscription tier feature configuration and checks.

  Single source of truth for what each subscription tier provides.
  Used by PremiumController, PremiumGatePlug, XpEventHandler, and
  coin award logic to determine tier-specific capabilities and multipliers.

  ## Tiers

  - `"free"` — Base tier with standard limits
  - `"premium"` — Enhanced experience with 2x XP, custom themes, no daily limits
  - `"enterprise"` — Full access with 3x XP, advanced analytics, team management
  """

  @tiers %{
    "free" => %{
      xp_multiplier: 1.0,
      coin_bonus: 0,
      custom_themes: false,
      exclusive_badges: false,
      exclusive_effects: false,
      priority_support: false,
      daily_limits: true,
      max_file_size_mb: 10,
      max_groups_owned: 5,
      custom_banner: false,
      early_access: false,
      advanced_analytics: false,
      team_management: false
    },
    "premium" => %{
      xp_multiplier: 2.0,
      coin_bonus: 20,
      custom_themes: true,
      exclusive_badges: true,
      exclusive_effects: true,
      priority_support: true,
      daily_limits: false,
      max_file_size_mb: 100,
      max_groups_owned: 25,
      custom_banner: true,
      early_access: true,
      advanced_analytics: false,
      team_management: false
    },
    "enterprise" => %{
      xp_multiplier: 3.0,
      coin_bonus: 50,
      custom_themes: true,
      exclusive_badges: true,
      exclusive_effects: true,
      priority_support: true,
      daily_limits: false,
      max_file_size_mb: 500,
      max_groups_owned: 100,
      custom_banner: true,
      early_access: true,
      advanced_analytics: true,
      team_management: true
    }
  }

  @doc "Returns the feature map for a given tier. Falls back to free tier for unknown tiers."
  @spec features_for_tier(String.t()) :: map()
  def features_for_tier(tier) when is_binary(tier) do
    Map.get(@tiers, tier, @tiers["free"])
  end

  def features_for_tier(_), do: @tiers["free"]

  @doc "Checks if a tier has a specific boolean feature enabled."
  @spec has_feature?(String.t(), atom()) :: boolean()
  def has_feature?(tier, feature) when is_atom(feature) do
    features_for_tier(tier) |> Map.get(feature, false)
  end

  @doc "Returns the XP multiplier for a tier."
  @spec xp_multiplier(String.t()) :: float()
  def xp_multiplier(tier), do: features_for_tier(tier).xp_multiplier

  @doc "Returns the coin bonus percentage for a tier."
  @spec coin_bonus(String.t()) :: integer()
  def coin_bonus(tier), do: features_for_tier(tier).coin_bonus

  @doc "Returns the max file size in MB for a tier."
  @spec max_file_size_mb(String.t()) :: integer()
  def max_file_size_mb(tier), do: features_for_tier(tier).max_file_size_mb

  @doc "Returns the max groups a user can own for a tier."
  @spec max_groups_owned(String.t()) :: integer()
  def max_groups_owned(tier), do: features_for_tier(tier).max_groups_owned

  @doc "Returns the list of available tier names."
  @spec tier_names() :: [String.t()]
  def tier_names, do: Map.keys(@tiers)

  @doc "Returns the full tiers configuration map."
  @spec all_tiers() :: map()
  def all_tiers, do: @tiers
end
