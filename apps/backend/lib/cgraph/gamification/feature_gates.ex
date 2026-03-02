defmodule CGraph.Gamification.FeatureGates do
  @moduledoc """
  Progressive disclosure system — level-gated features.

  Defines which gamification features unlock at which user level.
  Core features (XP, streaks, achievements) are always available (level 1).
  Advanced features unlock progressively to avoid overwhelming new users
  while creating aspiration for what's coming.

  ## Design Principle

  Never hide features permanently. Show locked features with a
  "Reach Level X to unlock" message so users know what's coming.

  ## Feature Tiers

  - **Always Available (1)**: XP, streaks, achievements
  - **Early Unlock (3-5)**: Quests, daily rewards, leaderboard
  - **Mid Game (8-12)**: Shop, cosmetics, titles
  - **Advanced (15-18)**: Marketplace, animated borders, battle pass
  - **Endgame (20-25)**: Events, trading, prestige
  """

  @type feature_key ::
          :xp_system
          | :streaks
          | :achievements
          | :quests
          | :daily_rewards
          | :leaderboard
          | :shop
          | :cosmetics
          | :titles
          | :animated_borders
          | :marketplace
          | :battle_pass
          | :events
          | :trading
          | :prestige

  @feature_requirements %{
    # Always available (level 1)
    xp_system: 1,
    streaks: 1,
    achievements: 1,
    # Early unlock
    quests: 3,
    daily_rewards: 3,
    leaderboard: 5,
    # Mid game
    shop: 8,
    cosmetics: 10,
    titles: 12,
    # Advanced
    animated_borders: 15,
    marketplace: 15,
    battle_pass: 18,
    # Endgame
    events: 20,
    trading: 20,
    prestige: 25
  }

  @doc "Returns the full feature→level requirement map."
  @spec feature_requirements() :: %{feature_key() => pos_integer()}
  def feature_requirements, do: @feature_requirements

  @doc "Returns the required level for a specific feature, or nil if unknown."
  @spec required_level(feature_key()) :: pos_integer() | nil
  def required_level(feature) do
    Map.get(@feature_requirements, feature)
  end

  @doc """
  Check if a feature is unlocked for a given user level.

  Unknown features default to unlocked (permissive by default).
  """
  @spec unlocked?(non_neg_integer(), feature_key()) :: boolean()
  def unlocked?(user_level, feature) do
    case required_level(feature) do
      nil -> true
      req -> user_level >= req
    end
  end

  @doc """
  Get the full gate status map for a user at a given level.

  Returns a map of feature → %{unlocked, required_level, current_level}
  for every defined feature gate.
  """
  @spec get_user_gates(non_neg_integer()) :: %{
          feature_key() => %{
            unlocked: boolean(),
            required_level: pos_integer(),
            current_level: non_neg_integer()
          }
        }
  def get_user_gates(user_level) do
    Map.new(@feature_requirements, fn {feature, req_level} ->
      {feature,
       %{
         unlocked: user_level >= req_level,
         required_level: req_level,
         current_level: user_level
       }}
    end)
  end

  @doc """
  Determine which features were newly unlocked between two levels.

  Useful for triggering unlock celebrations on level-up events.
  Returns a list of feature keys that became unlocked.
  """
  @spec newly_unlocked_features(non_neg_integer(), non_neg_integer()) :: [feature_key()]
  def newly_unlocked_features(old_level, new_level) when new_level > old_level do
    @feature_requirements
    |> Enum.filter(fn {_feature, req} ->
      old_level < req and new_level >= req
    end)
    |> Enum.map(fn {feature, _} -> feature end)
    |> Enum.sort()
  end

  def newly_unlocked_features(_old_level, _new_level), do: []

  @doc "Returns a sorted list of all defined feature keys."
  @spec all_features() :: [feature_key()]
  def all_features do
    @feature_requirements
    |> Map.keys()
    |> Enum.sort()
  end

  @doc "Returns a human-readable display name for a feature key."
  @spec feature_display_name(feature_key()) :: String.t()
  def feature_display_name(feature) do
    feature
    |> Atom.to_string()
    |> String.replace("_", " ")
    |> String.split(" ")
    |> Enum.map_join(" ", &String.capitalize/1)
  end
end
