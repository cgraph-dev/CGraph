defmodule CGraph.Forums.Core.Membership do
  @moduledoc """
  Forum CRUD, subscription management (join/leave), and vote eligibility.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{Forum, ForumMember, Subscription}
  alias CGraph.Repo

  @vote_min_account_age_days 3
  @downvote_min_karma 10
  @vote_change_cooldown_seconds 300

  # ============================================================================
  # CRUD
  # ============================================================================

  @doc "Create a forum."
  @spec create_forum(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def create_forum(user, attrs) do
    attrs = attrs |> stringify_keys() |> Map.put("owner_id", user.id)
    %Forum{} |> Forum.changeset(attrs) |> Repo.insert()
  end

  @doc "Update a forum."
  @spec update_forum(struct(), map()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def update_forum(forum, attrs), do: forum |> Forum.changeset(attrs) |> Repo.update()

  @doc "Delete a forum."
  @spec delete_forum(struct()) :: {:ok, struct()} | {:error, Ecto.Changeset.t()}
  def delete_forum(forum), do: Repo.delete(forum)

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  # ============================================================================
  # Subscription (Join/Leave)
  # ============================================================================

  @doc "Subscribe to forum (also creates membership)."
  @spec subscribe_to_forum(struct(), struct()) :: {:ok, struct()} | {:error, term()}
  def subscribe_to_forum(user, forum) do
    Repo.transaction(fn ->
      subscription_result = create_subscription(user.id, forum.id)
      member_created = ensure_forum_membership(user.id, forum.id)
      increment_member_count_if_new(forum.id, member_created)
      finalize_subscription(subscription_result)
    end)
  end

  @doc "Unsubscribe from forum (also removes membership)."
  @spec unsubscribe_from_forum(struct(), struct()) :: {:ok, :unsubscribed} | {:error, :cannot_leave_own_forum}
  def unsubscribe_from_forum(user, forum) do
    if forum.owner_id == user.id do
      {:error, :cannot_leave_own_forum}
    else
      Repo.transaction(fn -> perform_unsubscribe(user.id, forum.id) end)
    end
  end

  @doc "Check if user is subscribed to forum."
  @spec subscribed?(struct(), struct()) :: boolean()
  def subscribed?(forum, user) do
    query = from s in Subscription, where: s.forum_id == ^forum.id, where: s.user_id == ^user.id
    Repo.exists?(query)
  end

  defp create_subscription(user_id, forum_id) do
    %Subscription{}
    |> Subscription.changeset(%{forum_id: forum_id, user_id: user_id})
    |> Repo.insert(on_conflict: :nothing, conflict_target: [:forum_id, :user_id])
  end

  defp ensure_forum_membership(user_id, forum_id) do
    case Repo.get_by(ForumMember, forum_id: forum_id, user_id: user_id) do
      nil -> create_forum_member(user_id, forum_id)
      _member -> false
    end
  end

  defp create_forum_member(user_id, forum_id) do
    result = %ForumMember{}
    |> ForumMember.changeset(%{forum_id: forum_id, user_id: user_id, joined_at: DateTime.truncate(DateTime.utc_now(), :second)})
    |> Repo.insert()
    match?({:ok, _}, result)
  end

  defp increment_member_count_if_new(_forum_id, false), do: :ok
  defp increment_member_count_if_new(forum_id, true) do
    from(f in Forum, where: f.id == ^forum_id) |> Repo.update_all(inc: [member_count: 1])
  end

  defp finalize_subscription({:ok, subscription}), do: subscription
  defp finalize_subscription({:error, changeset}), do: Repo.rollback(changeset)

  defp perform_unsubscribe(user_id, forum_id) do
    subscription_deleted = delete_subscription(user_id, forum_id)
    delete_membership(user_id, forum_id)
    decrement_member_count_if_deleted(forum_id, subscription_deleted)
    :unsubscribed
  end

  defp delete_subscription(user_id, forum_id) do
    query = from s in Subscription, where: s.forum_id == ^forum_id, where: s.user_id == ^user_id
    {count, _} = Repo.delete_all(query)
    count > 0
  end

  defp delete_membership(user_id, forum_id) do
    query = from m in ForumMember, where: m.forum_id == ^forum_id, where: m.user_id == ^user_id
    Repo.delete_all(query)
  end

  defp decrement_member_count_if_deleted(_forum_id, false), do: :ok
  defp decrement_member_count_if_deleted(forum_id, true) do
    from(f in Forum, where: f.id == ^forum_id) |> Repo.update_all(inc: [member_count: -1])
  end

  # ============================================================================
  # Vote Eligibility
  # ============================================================================

  @doc "Get voting eligibility info for a user."
  @spec get_vote_eligibility(struct()) :: map()
  def get_vote_eligibility(user) do
    account_age_days = DateTime.diff(DateTime.truncate(DateTime.utc_now(), :second), user.inserted_at, :day)
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
end
