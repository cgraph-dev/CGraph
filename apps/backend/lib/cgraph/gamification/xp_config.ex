defmodule CGraph.Gamification.XpConfig do
  @moduledoc """
  XP reward configuration table.

  Maps action types to base XP/coin amounts, daily caps, and
  diminishing-return thresholds. Each action type has an independent
  daily budget — mirrors Discord and Google Play Games patterns.

  ## Adding a new action type

  1. Add the atom to `@xp_rewards` below.
  2. Add matching source string to `XpTransaction.@sources`.
  3. Wire the caller to `XpEventHandler.handle_action/3`.
  """

  @type reward :: %{
          xp: non_neg_integer(),
          coins: non_neg_integer(),
          daily_cap: pos_integer() | :unlimited,
          diminish_after: pos_integer() | :never
        }

  # Conservative XP values — prevents inflation while keeping engagement.
  # daily_cap is total XP per source per day.
  # diminish_after is number of actions before halving kicks in.
  @xp_rewards %{
    message: %{xp: 10, coins: 0, daily_cap: 500, diminish_after: 50},
    forum_thread_created: %{xp: 25, coins: 2, daily_cap: 250, diminish_after: 10},
    forum_post_created: %{xp: 15, coins: 1, daily_cap: 300, diminish_after: 20},
    forum_upvote_received: %{xp: 5, coins: 0, daily_cap: 100, diminish_after: 50},
    friend_added: %{xp: 20, coins: 1, daily_cap: 100, diminish_after: 5},
    # DEFERRED — no group system exists yet; config kept for future use
    group_joined: %{xp: 15, coins: 1, daily_cap: 75, diminish_after: 3},
    voice_minute: %{xp: 2, coins: 0, daily_cap: 120, diminish_after: 60},
    reaction_sent: %{xp: 2, coins: 0, daily_cap: 100, diminish_after: 50},
    profile_complete: %{xp: 50, coins: 5, daily_cap: 50, diminish_after: 1},
    # System sources — XP managed by their own systems, caps unlimited
    quest: %{xp: 0, coins: 0, daily_cap: :unlimited, diminish_after: :never},
    achievement: %{xp: 0, coins: 0, daily_cap: :unlimited, diminish_after: :never},
    daily_login: %{xp: 25, coins: 0, daily_cap: 25, diminish_after: 1}
  }

  @doc "Get the reward config for a given action type, or nil if unknown."
  @spec get_reward(atom()) :: reward() | nil
  def get_reward(action_type) when is_atom(action_type) do
    Map.get(@xp_rewards, action_type)
  end

  @doc "Return the full reward table."
  @spec all_rewards() :: %{atom() => reward()}
  def all_rewards, do: @xp_rewards

  @doc "Get the daily XP cap for an action type."
  @spec daily_cap(atom()) :: pos_integer() | :unlimited | nil
  def daily_cap(action_type) when is_atom(action_type) do
    case Map.get(@xp_rewards, action_type) do
      %{daily_cap: cap} -> cap
      nil -> nil
    end
  end

  @doc "Get the diminishing-returns threshold for an action type."
  @spec diminish_after(atom()) :: pos_integer() | :never | nil
  def diminish_after(action_type) when is_atom(action_type) do
    case Map.get(@xp_rewards, action_type) do
      %{diminish_after: threshold} -> threshold
      nil -> nil
    end
  end

  @doc "List all action types that are eligible for the XP event pipeline."
  @spec pipeline_sources() :: [atom()]
  def pipeline_sources do
    @xp_rewards
    |> Enum.reject(fn {_k, v} -> v.daily_cap == :unlimited end)
    |> Enum.map(fn {k, _v} -> k end)
  end
end
