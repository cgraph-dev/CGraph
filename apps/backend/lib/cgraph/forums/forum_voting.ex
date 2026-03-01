defmodule CGraph.Forums.ForumVoting do
  @moduledoc """
  Forum competition voting with anti-abuse protection.

  Handles voting on forums (not posts) for the competition/leaderboard system.

  Security measures:
  - Account must be at least 1 day old
  - Downvoting requires 10+ karma
  - Vote changes have 60s cooldown
  - Users cannot vote on forums they own/moderate
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{Forum, ForumVote, PluginRuntime}
  alias CGraph.Repo

  # Minimum account age (in days) required to vote
  @vote_min_account_age_days 1
  # Minimum karma required to downvote
  @downvote_min_karma 10
  # Vote cooldown in seconds
  @vote_change_cooldown_seconds 60

  @doc """
  Vote on a forum with anti-abuse protection.

  Returns {:ok, :upvoted | :downvoted | :removed} or {:error, reason}
  """
  @spec vote_forum(map(), Ecto.UUID.t(), 1 | -1) :: {:ok, :upvoted | :downvoted | :removed} | {:error, term()}
  def vote_forum(user, forum_id, value) when value in [1, -1] do
    with :ok <- validate_vote_eligibility(user, value),
         :ok <- validate_not_self_vote(user, forum_id),
         :ok <- validate_vote_cooldown(user.id, forum_id) do
      execute_forum_vote(user, forum_id, value)
    end
  end

  @doc """
  Get user's vote on a forum.
  """
  @spec get_user_forum_vote(Ecto.UUID.t(), Ecto.UUID.t()) :: ForumVote.t() | nil
  def get_user_forum_vote(user_id, forum_id) do
    Repo.one(
      from v in ForumVote,
        where: v.user_id == ^user_id and v.forum_id == ^forum_id
    )
  end

  @doc """
  Get forum with user's vote status.
  """
  @spec get_forum_with_vote(Ecto.UUID.t(), Ecto.UUID.t() | nil) :: {:ok, map()} | {:error, :not_found}
  def get_forum_with_vote(forum_id, user_id) do
    case Repo.get(Forum, forum_id) |> Repo.preload([:categories, :owner]) do
      nil -> {:error, :not_found}
      forum ->
        vote = if user_id, do: get_user_forum_vote(user_id, forum_id), else: nil
        user_vote = if vote, do: vote.value, else: 0
        {:ok, Map.put(forum, :user_vote, user_vote)}
    end
  end

  @doc """
  Get voting eligibility info for a user.
  """
  @spec get_vote_eligibility(map()) :: map()
  def get_vote_eligibility(user) do
    account_age_days = DateTime.diff(DateTime.utc_now(), user.inserted_at, :day)
    karma = user.karma || 0

    %{
      can_upvote: account_age_days >= @vote_min_account_age_days,
      can_downvote: account_age_days >= @vote_min_account_age_days and karma >= @downvote_min_karma,
      account_age_days: account_age_days,
      karma: karma,
      min_account_age_days: @vote_min_account_age_days,
      min_karma_for_downvote: @downvote_min_karma,
      vote_cooldown_seconds: @vote_change_cooldown_seconds
    }
  end

  @doc """
  Calculate hot score.
  """
  @spec update_forum_hot_score(Ecto.UUID.t()) :: {non_neg_integer(), nil | [term()]}
  def update_forum_hot_score(forum_id) do
    forum = Repo.get!(Forum, forum_id)

    score = forum.score
    sign = if score >= 0, do: 1, else: -1
    order = :math.log10(max(abs(score), 1))

    seconds = DateTime.to_unix(forum.inserted_at)
    hot = sign * order + (seconds / 45_000)

    from(f in Forum, where: f.id == ^forum_id)
    |> Repo.update_all(set: [hot_score: hot])
  end

  @doc """
  Reset weekly scores (run via scheduler).
  """
  @spec reset_weekly_scores() :: {non_neg_integer(), nil | [term()]}
  def reset_weekly_scores do
    from(f in Forum)
    |> Repo.update_all(set: [weekly_score: 0])
  end

  @doc """
  Set a forum as featured.
  """
  @spec set_forum_featured(Ecto.UUID.t(), boolean()) :: {non_neg_integer(), nil | [term()]}
  def set_forum_featured(forum_id, featured) when is_boolean(featured) do
    from(f in Forum, where: f.id == ^forum_id)
    |> Repo.update_all(set: [featured: featured])
  end

  # Private functions

  defp validate_vote_eligibility(user, value) do
    account_age_days = DateTime.diff(DateTime.utc_now(), user.inserted_at, :day)

    cond do
      account_age_days < @vote_min_account_age_days ->
        {:error, :account_too_new}

      value == -1 and (user.karma || 0) < @downvote_min_karma ->
        {:error, :insufficient_karma_for_downvote}

      true ->
        :ok
    end
  end

  defp validate_not_self_vote(user, forum_id) do
    case Repo.get(Forum, forum_id) do
      nil -> {:error, :forum_not_found}
      %Forum{owner_id: owner_id} when owner_id == user.id -> {:error, :cannot_vote_own_forum}
      forum ->
        forum = Repo.preload(forum, :moderators)
        if moderator?(forum, user) do
          {:error, :moderators_cannot_vote}
        else
          :ok
        end
    end
  end

  defp moderator?(forum, user) do
    forum.owner_id == user.id or in_moderators?(forum, user)
  end

  defp in_moderators?(forum, user) do
    case forum.moderators do
      nil -> false
      mods -> Enum.any?(mods, &(&1.user_id == user.id))
    end
  end

  defp validate_vote_cooldown(user_id, forum_id) do
    case get_user_forum_vote(user_id, forum_id) do
      nil -> :ok
      %ForumVote{updated_at: updated_at} ->
        seconds_since_vote = DateTime.diff(DateTime.utc_now(), updated_at, :second)
        if seconds_since_vote < @vote_change_cooldown_seconds do
          remaining = @vote_change_cooldown_seconds - seconds_since_vote
          {:error, {:vote_cooldown, remaining}}
        else
          :ok
        end
    end
  end

  defp execute_forum_vote(user, forum_id, value) do
    Repo.transaction(fn ->
      apply_vote_action(user.id, forum_id, value, get_user_forum_vote(user.id, forum_id))
    end)
  end

  defp apply_vote_action(user_id, forum_id, value, nil) do
    create_forum_vote(user_id, forum_id, value)
    update_forum_scores(forum_id, value, 0)
    notify_vote_plugin(forum_id, user_id, value)
    vote_result(value)
  end
  defp apply_vote_action(_user_id, forum_id, value, %ForumVote{value: existing_value} = existing) when value == existing_value do
    Repo.delete!(existing)
    update_forum_scores(forum_id, 0, value)
    :removed
  end
  defp apply_vote_action(_user_id, forum_id, value, existing) do
    old_value = existing.value
    existing |> ForumVote.changeset(%{value: value}) |> Repo.update!()
    update_forum_scores(forum_id, value, old_value)
    vote_result(value)
  end

  defp vote_result(1), do: :upvoted
  defp vote_result(-1), do: :downvoted

  defp notify_vote_plugin(forum_id, user_id, value) do
    PluginRuntime.dispatch(forum_id, :vote_cast, %{forum_id: forum_id, user_id: user_id, value: value})
  end

  defp create_forum_vote(user_id, forum_id, value) do
    %ForumVote{}
    |> ForumVote.changeset(%{user_id: user_id, forum_id: forum_id, value: value})
    |> Repo.insert!()
  end

  defp update_forum_scores(forum_id, new_value, old_value) do
    upvote_delta = (if new_value == 1, do: 1, else: 0) - (if old_value == 1, do: 1, else: 0)
    downvote_delta = (if new_value == -1, do: 1, else: 0) - (if old_value == -1, do: 1, else: 0)
    score_delta = new_value - old_value

    from(f in Forum, where: f.id == ^forum_id)
    |> Repo.update_all(
      inc: [
        upvotes: upvote_delta,
        downvotes: downvote_delta,
        score: score_delta,
        weekly_score: score_delta
      ]
    )

    update_forum_hot_score(forum_id)
  end
end
