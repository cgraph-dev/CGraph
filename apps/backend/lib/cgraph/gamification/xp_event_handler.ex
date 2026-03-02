defmodule CGraph.Gamification.XpEventHandler do
  @moduledoc """
  Centralized action → reward pipeline.

  All user-initiated XP-eligible actions flow through `handle_action/3`.
  The handler:

  1. Validates the action type against `XpConfig`.
  2. Checks daily caps via `DailyCap`.
  3. Awards XP through `Gamification.award_xp/4`.
  4. Auto-awards companion coins (1 per 50 XP + config base).
  5. Broadcasts a real-time XP event on the user's PubSub topic.
  6. Updates quest progress for the action type.

  **Deduplication:** The handler does NOT process `:achievement`, `:quest`,
  or `:daily_login` sources — those are already wired directly to
  `award_xp` by AchievementSystem, QuestSystem, and `claim_daily_streak`.
  """

  alias CGraph.Gamification
  alias CGraph.Gamification.{DailyCap, XpConfig}

  require Logger

  @skip_sources [:achievement, :quest, :daily_login]

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Process an XP-eligible user action.

  ## Options

  - `:reference_type` — e.g. `"message"`, `"thread"`
  - `:reference_id`   — the entity ID
  - `:board_id`       — for forum actions that update per-board leaderboards

  Returns `{:ok, result_map}` or `{:error, reason}`.
  """
  @spec handle_action(struct(), atom(), keyword()) ::
          {:ok, map()} | {:error, atom()}
  def handle_action(user, action_type, opts \\ [])

  # Skip system-managed sources to avoid double-awarding
  def handle_action(_user, action_type, _opts) when action_type in @skip_sources do
    {:error, :system_managed_source}
  end

  def handle_action(user, action_type, opts) do
    case XpConfig.get_reward(action_type) do
      nil ->
        Logger.warning("XpEventHandler: unknown action type",
          action_type: action_type,
          user_id: user.id
        )

        {:error, :unknown_action}

      config ->
        process_action(user, action_type, config, opts)
    end
  end

  # ---------------------------------------------------------------------------
  # Internal pipeline
  # ---------------------------------------------------------------------------

  defp process_action(user, action_type, config, opts) do
    base_xp = config.xp

    # If the config says 0 XP, there's nothing to award through the pipeline
    if base_xp == 0 do
      {:ok, %{user: user, xp_awarded: 0, level_up: false, cap_reached: false}}
    else
      case DailyCap.check_and_increment(user.id, action_type, base_xp) do
        {:ok, effective_xp} ->
          award_and_broadcast(user, action_type, effective_xp, config, opts)

        {:error, :daily_cap_reached} ->
          # Still count for quest progress even when capped
          async_quest_progress(user.id, action_type)
          async_broadcast_cap_reached(user.id, action_type)
          {:ok, %{user: user, xp_awarded: 0, level_up: false, cap_reached: true}}

        {:error, reason} ->
          {:error, reason}
      end
    end
  end

  defp award_and_broadcast(user, action_type, effective_xp, config, opts) do
    source_string = Atom.to_string(action_type)

    award_opts = [
      description: "XP from #{source_string}",
      reference_type: Keyword.get(opts, :reference_type),
      reference_id: Keyword.get(opts, :reference_id)
    ]

    case Gamification.award_xp(user, effective_xp, source_string, award_opts) do
      {:ok, {updated_user, level_up}} ->
        # Companion coins: config base + 1 coin per 50 XP earned
        coin_amount = config.coins + div(effective_xp, 50)

        if coin_amount > 0 do
          Task.start(fn ->
            Gamification.award_coins(
              updated_user,
              coin_amount,
              "xp_companion",
              description: "Coins from #{source_string}",
              reference_type: Keyword.get(opts, :reference_type),
              reference_id: Keyword.get(opts, :reference_id)
            )
          end)
        end

        # Fire-and-forget: broadcast + quest progress + scoped leaderboard
        Task.start(fn ->
          broadcast_xp_event(updated_user, effective_xp, action_type, level_up)
        end)

        async_quest_progress(user.id, action_type)

        # Scoped (per-board) leaderboard update for forum actions
        board_id = Keyword.get(opts, :board_id)

        if board_id && forum_source?(action_type) do
          Task.start(fn ->
            Gamification.Leaderboard.sync_scoped_scores(
              updated_user,
              :board,
              board_id,
              [:xp]
            )
          end)
        end

        {:ok, %{user: updated_user, xp_awarded: effective_xp, level_up: level_up, cap_reached: false}}

      {:error, reason} ->
        Logger.error("XpEventHandler: award_xp failed",
          user_id: user.id,
          action: action_type,
          reason: inspect(reason)
        )

        {:error, reason}
    end
  end

  # ---------------------------------------------------------------------------
  # PubSub broadcast
  # ---------------------------------------------------------------------------

  defp broadcast_xp_event(user, xp_amount, action_type, level_up) do
    cap_status = DailyCap.get_cap_status(user.id, action_type)

    payload = %{
      amount: xp_amount,
      source: Atom.to_string(action_type),
      total_xp: user.xp,
      level: user.level,
      level_up: level_up,
      level_progress: Gamification.level_progress(user.xp),
      daily_cap_status: %{
        source: Atom.to_string(action_type),
        used: cap_status.used,
        limit: cap_status.limit,
        remaining: cap_status.remaining,
        diminishing_active: cap_status.diminishing_active
      }
    }

    Phoenix.PubSub.broadcast(
      CGraph.PubSub,
      "gamification:#{user.id}",
      {:xp_awarded, payload}
    )

    if level_up do
      Phoenix.PubSub.broadcast(
        CGraph.PubSub,
        "gamification:#{user.id}",
        {:level_up, %{
          old_level: user.level - 1,
          new_level: user.level,
          rewards: []
        }}
      )
    end
  rescue
    error ->
      Logger.warning("XpEventHandler: broadcast failed",
        error: inspect(error),
        user_id: user.id
      )
  end

  defp async_broadcast_cap_reached(user_id, action_type) do
    Task.start(fn ->
      cap_status = DailyCap.get_cap_status(user_id, action_type)

      Phoenix.PubSub.broadcast(
        CGraph.PubSub,
        "gamification:#{user_id}",
        {:cap_reached, %{
          source: Atom.to_string(action_type),
          daily_used: cap_status.used,
          daily_limit: cap_status.limit
        }}
      )
    end)
  end

  # ---------------------------------------------------------------------------
  # Quest progress (fire-and-forget)
  # ---------------------------------------------------------------------------

  defp async_quest_progress(user_id, action_type) do
    Task.start(fn ->
      Gamification.update_quest_progress(user_id, action_type, 1)
    end)
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp forum_source?(action_type) do
    action_type in [
      :forum_thread_created,
      :forum_post_created,
      :forum_upvote_received
    ]
  end
end
