defmodule CGraph.Nodes.ReputationRewards do
  @moduledoc """
  Context for reputation-based node rewards.

  Checks user milestones (helpful votes, post counts, friend counts,
  account age) and grants one-time node rewards when thresholds are met.
  """

  import Ecto.Query

  alias CGraph.Repo
  alias CGraph.Nodes
  alias CGraph.Nodes.ReputationReward
  alias CGraph.Forums.UserContent
  alias CGraph.Accounts.Friends.Queries, as: FriendQueries

  require Logger

  @milestones %{
    "helpful_votes_100" => %{check: :helpful_votes, threshold: 100, reward: 100},
    "helpful_votes_500" => %{check: :helpful_votes, threshold: 500, reward: 300},
    "posts_1000" => %{check: :posts, threshold: 1000, reward: 500},
    "posts_5000" => %{check: :posts, threshold: 5000, reward: 2000},
    "friends_50" => %{check: :friends, threshold: 50, reward: 50},
    "friends_200" => %{check: :friends, threshold: 200, reward: 200},
    "account_1year" => %{check: :account_age, threshold: 365, reward: 100},
    "account_2year" => %{check: :account_age, threshold: 730, reward: 500}
  }

  @doc """
  Check all milestones for a user and grant nodes for any newly qualified ones.
  Returns a list of newly granted milestone keys.
  """
  @spec check_and_grant(String.t()) :: {:ok, [String.t()]}
  def check_and_grant(user_id) do
    user = Repo.get(CGraph.Accounts.User, user_id)

    if is_nil(user) do
      {:ok, []}
    else
      granted =
        @milestones
        |> Enum.reduce([], fn {key, milestone}, acc ->
          if not already_granted?(user_id, key) and qualifies?(user, milestone) do
            case grant_milestone(user_id, key, milestone.reward) do
              {:ok, _} -> [key | acc]
              {:error, reason} ->
                Logger.warning("[ReputationRewards] Failed to grant #{key} to #{user_id}: #{inspect(reason)}")
                acc
            end
          else
            acc
          end
        end)

      {:ok, granted}
    end
  end

  @doc """
  Check if a milestone has already been granted to a user.
  """
  @spec already_granted?(String.t(), String.t()) :: boolean()
  def already_granted?(user_id, milestone_key) do
    Repo.exists?(
      from r in ReputationReward,
        where: r.user_id == ^user_id and r.milestone_key == ^milestone_key
    )
  end

  @doc """
  List all granted milestones for a user.
  """
  @spec list_user_rewards(String.t()) :: [ReputationReward.t()]
  def list_user_rewards(user_id) do
    from(r in ReputationReward,
      where: r.user_id == ^user_id,
      order_by: [desc: r.granted_at]
    )
    |> Repo.all()
  end

  # ── Private ──────────────────────────────────────────────────────

  defp qualifies?(user, %{check: :helpful_votes, threshold: threshold}) do
    # Sum reputation_positive across all forum memberships
    total =
      Repo.one(
        from(m in CGraph.Forums.ForumMember,
          where: m.user_id == ^user.id,
          select: coalesce(sum(m.reputation_positive), 0)
        )
      )

    total >= threshold
  end

  defp qualifies?(user, %{check: :posts, threshold: threshold}) do
    stats = UserContent.get_user_post_stats(user.id)
    stats.total_posts >= threshold
  end

  defp qualifies?(user, %{check: :friends, threshold: threshold}) do
    stats = FriendQueries.get_friend_stats(user.id)
    stats.friends >= threshold
  end

  defp qualifies?(user, %{check: :account_age, threshold: days}) do
    inserted_at = user.inserted_at
    diff = DateTime.diff(DateTime.utc_now(), inserted_at, :day)
    diff >= days
  end

  defp grant_milestone(user_id, milestone_key, reward_amount) do
    Ecto.Multi.new()
    |> Ecto.Multi.insert(:reward, ReputationReward.changeset(%ReputationReward{}, %{
      user_id: user_id,
      milestone_key: milestone_key,
      nodes_granted: reward_amount,
      granted_at: DateTime.utc_now()
    }))
    |> Ecto.Multi.run(:credit, fn _repo, _changes ->
      Nodes.credit_nodes(user_id, reward_amount, :reputation_reward,
        reference_type: "reputation_reward",
        description: "Milestone reward: #{milestone_key}"
      )
    end)
    |> Repo.transaction()
    |> case do
      {:ok, result} -> {:ok, result}
      {:error, _step, changeset, _changes} -> {:error, changeset}
    end
  end
end
