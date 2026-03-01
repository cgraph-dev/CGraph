defmodule CGraph.Forums.ForumXpBridge do
  @moduledoc """
  Bridge between forum activity and the gamification XP system.

  Awards XP for forum actions (thread, post, upvote, best answer)
  with a configurable daily cap per user per forum.

  XP sources:
  - `forum_thread_created` → +10 XP
  - `forum_post_created`   → +5 XP
  - `forum_upvote_received` → +2 XP
  - `forum_best_answer`    → +20 XP

  Daily cap: 200 XP from forum activity (tracked in `forum_xp_daily_totals`).
  """

  import Ecto.Query, warn: false

  alias CGraph.Repo

  require Logger

  @xp_amounts %{
    forum_thread_created: 10,
    forum_post_created: 5,
    forum_upvote_received: 2,
    forum_best_answer: 20
  }

  @daily_cap 200

  @doc """
  Award XP for a forum action, respecting the daily cap.

  Returns `{:ok, amount_awarded}` or `{:ok, 0}` if cap reached.
  """
  @spec award_forum_xp(String.t(), String.t(), atom(), String.t() | nil) ::
          {:ok, non_neg_integer()} | {:error, term()}
  def award_forum_xp(user_id, forum_id, action, reference_id \\ nil)
      when action in [
             :forum_thread_created,
             :forum_post_created,
             :forum_upvote_received,
             :forum_best_answer
           ] do
    base_amount = Map.fetch!(@xp_amounts, action)
    today = Date.utc_today()

    # Check daily cap
    current_total = get_daily_total(user_id, forum_id, today)
    remaining = max(@daily_cap - current_total, 0)
    amount = min(base_amount, remaining)

    if amount <= 0 do
      Logger.debug(
        "[ForumXpBridge] Daily cap reached for user=#{user_id} forum=#{forum_id}"
      )

      {:ok, 0}
    else
      # Record daily total
      upsert_daily_total(user_id, forum_id, today, amount)

      # Award XP via gamification system (create XP transaction)
      grant_xp(user_id, amount, Atom.to_string(action), reference_id)

      Logger.info(
        "[ForumXpBridge] Awarded #{amount} XP to user=#{user_id} for #{action} in forum=#{forum_id}"
      )

      {:ok, amount}
    end
  end

  @doc "Get the current daily XP total for a user in a forum."
  @spec get_daily_total(String.t(), String.t(), Date.t()) :: non_neg_integer()
  def get_daily_total(user_id, forum_id, date) do
    from(d in "forum_xp_daily_totals",
      where: d.user_id == type(^user_id, :binary_id),
      where: d.forum_id == type(^forum_id, :binary_id),
      where: d.date == ^date,
      select: d.total_xp
    )
    |> Repo.one()
    |> Kernel.||(0)
  end

  @doc "Get how much XP a user can still earn today in a forum."
  @spec remaining_daily_xp(String.t(), String.t()) :: non_neg_integer()
  def remaining_daily_xp(user_id, forum_id) do
    max(@daily_cap - get_daily_total(user_id, forum_id, Date.utc_today()), 0)
  end

  # ── Private ──────────────────────────────────────────────────────────

  defp upsert_daily_total(user_id, forum_id, date, amount) do
    now = DateTime.utc_now() |> DateTime.truncate(:second)

    Repo.insert_all(
      "forum_xp_daily_totals",
      [
        %{
          id: Ecto.UUID.generate(),
          user_id: user_id,
          forum_id: forum_id,
          date: date,
          total_xp: amount,
          inserted_at: now,
          updated_at: now
        }
      ],
      on_conflict: [inc: [total_xp: amount], set: [updated_at: now]],
      conflict_target: [:user_id, :forum_id, :date]
    )
  end

  defp grant_xp(user_id, amount, source, reference_id) do
    # Get user to calculate total_after and level_after
    user = Repo.get!(CGraph.Accounts.User, user_id)

    total_after = (user.xp || 0) + amount
    level_after = calculate_level(total_after)

    attrs = %{
      user_id: user_id,
      amount: amount,
      total_after: total_after,
      level_after: level_after,
      source: source,
      description: "Forum activity: #{source}",
      reference_type: "forum",
      reference_id: reference_id
    }

    %CGraph.Gamification.XpTransaction{}
    |> CGraph.Gamification.XpTransaction.changeset(attrs)
    |> Repo.insert()

    # Update user XP and level
    from(u in CGraph.Accounts.User, where: u.id == ^user_id)
    |> Repo.update_all(set: [xp: total_after, level: level_after])
  end

  defp calculate_level(xp) do
    # Simple level formula: level = floor(sqrt(xp / 100)) + 1
    trunc(:math.sqrt(max(xp, 0) / 100)) + 1
  end
end
