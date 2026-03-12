defmodule CGraph.Forums.Reputation do
  @moduledoc """
  Consolidated reputation context for forums.

  Delegates DB writes to `CGraph.Forums.Members.update_reputation/3` which
  already handles incrementing reputation, reputation_positive, and
  reputation_negative on `ForumMember`.

  This module adds:
  - `calculate_score/1` — weighted reputation formula
  - `add_reputation/3` / `deduct_reputation/3` — convenience wrappers
  - `recalculate_all/0` — full recalc across all forum members

  Existing infrastructure (DO NOT duplicate):
  - `Members.update_reputation/3` — atomic DB increment
  - `Voting.propagate_post_reputation/3` — called on vote events
  - `RankingEngine` — forum-level ranking scores
  """

  import Ecto.Query, warn: false

  alias CGraph.Forums.{ForumMember, Members}
  alias CGraph.Repo

  @doc """
  Calculate a weighted reputation score from activity stats.

  Formula:
    posts × 1 + replies × 0.5 + upvotes × 2 + best_answers × 5 - reports × 3

  Accepts a map with any of the following keys:
  - `:posts` — number of threads created
  - `:replies` — number of replies/posts made
  - `:upvotes` — total upvotes received
  - `:best_answers` — number of best answer awards
  - `:reports` — number of reports received against user
  """
  @spec calculate_score(map()) :: float()
  def calculate_score(stats) when is_map(stats) do
    posts = Map.get(stats, :posts, 0)
    replies = Map.get(stats, :replies, 0)
    upvotes = Map.get(stats, :upvotes, 0)
    best_answers = Map.get(stats, :best_answers, 0)
    reports = Map.get(stats, :reports, 0)

    posts * 1.0 + replies * 0.5 + upvotes * 2.0 + best_answers * 5.0 - reports * 3.0
  end

  @doc """
  Add reputation to a forum member.

  Delegates to `Members.update_reputation/3` with a positive delta.
  The `amount` parameter controls how many times +1 is applied.
  """
  @spec add_reputation(String.t(), String.t(), pos_integer()) :: :ok
  def add_reputation(forum_id, user_id, amount \\ 1) when amount > 0 do
    Enum.each(1..amount, fn _ ->
      Members.update_reputation(forum_id, user_id, 1)
    end)

    :ok
  end

  @doc """
  Deduct reputation from a forum member.

  Delegates to `Members.update_reputation/3` with a negative delta.
  The `amount` parameter controls how many times -1 is applied.
  """
  @spec deduct_reputation(String.t(), String.t(), pos_integer()) :: :ok
  def deduct_reputation(forum_id, user_id, amount \\ 1) when amount > 0 do
    Enum.each(1..amount, fn _ ->
      Members.update_reputation(forum_id, user_id, -1)
    end)

    :ok
  end

  @doc """
  Recalculate reputation for all forum members.

  Resets each member's reputation to a calculated value based on their
  actual post counts and vote tallies. Used for periodic consistency checks.
  """
  @spec recalculate_all() :: {:ok, non_neg_integer()}
  def recalculate_all do
    members = Repo.all(from(m in ForumMember, select: [:id, :forum_id, :user_id]))

    count =
      Enum.reduce(members, 0, fn member, acc ->
        case recalculate_member(member) do
          {:ok, _} -> acc + 1
          _ -> acc
        end
      end)

    {:ok, count}
  end

  @doc """
  Recalculate reputation for a single forum member based on activity.
  """
  @spec recalculate_member(ForumMember.t()) :: {:ok, ForumMember.t()} | {:error, term()}
  def recalculate_member(member) do
    positive = member.reputation_positive || 0
    negative = member.reputation_negative || 0
    computed = positive - negative

    from(m in ForumMember, where: m.id == ^member.id)
    |> Repo.update_all(set: [reputation: computed])

    {:ok, member}
  end
end
