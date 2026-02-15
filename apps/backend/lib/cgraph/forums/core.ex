defmodule CGraph.Forums.Core do
  @moduledoc """
  Core forum operations — CRUD, authorization, membership checks, subscription, stats.

  Extracted from the main Forums module to reduce complexity.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{Comment, Forum, ForumMember, Moderator, Post, Subscription, Thread, ThreadPost}
  alias CGraph.Repo

  @vote_min_account_age_days 3
  @downvote_min_karma 10
  @vote_change_cooldown_seconds 300

  # ============================================================================
  # Forum Listing & Retrieval
  # ============================================================================

  @doc "List all public forums."
  def list_forums(opts \\ []) do
    list_forums_for_user(nil, opts)
  end

  @doc "List forums accessible to a user."
  def list_forums_for_user(user, opts \\ []) do
    base_query = from f in Forum,
      where: is_nil(f.deleted_at),
      preload: [:categories, :owner]

    query = case user do
      nil ->
        from f in base_query, where: f.is_public == true
      %{id: user_id} ->
        from f in base_query,
          left_join: m in assoc(f, :memberships),
          where: f.is_public == true or (f.is_public == false and m.user_id == ^user_id),
          distinct: true
    end

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :member_count,
      sort_direction: :desc,
      default_limit: 20
    )

    {forums, page_info} = CGraph.Pagination.paginate(query, pagination_opts)
    forums = Enum.map(forums, &add_membership_status(&1, user))
    {forums, page_info}
  end

  @doc "Add membership and subscription status to a forum struct."
  def add_membership_status(forum, nil) do
    forum |> Map.put(:is_member, false) |> Map.put(:is_subscribed, false)
  end
  def add_membership_status(forum, user) do
    forum
    |> Map.put(:is_member, forum_member?(user, forum))
    |> Map.put(:is_subscribed, forum_subscribed?(user, forum))
  end

  @doc "Check if a user is subscribed to a forum."
  def forum_subscribed?(nil, _forum), do: false
  def forum_subscribed?(user, forum) do
    from(s in Subscription, where: s.user_id == ^user.id and s.forum_id == ^forum.id, select: count(s.id))
    |> Repo.one() |> Kernel.>(0)
  end

  @doc "Check if a user is a member of a forum."
  def forum_member?(nil, _forum), do: false
  def forum_member?(user, forum) do
    if forum.owner_id == user.id do
      true
    else
      from(m in ForumMember, where: m.user_id == ^user.id and m.forum_id == ^forum.id, select: count(m.id))
      |> Repo.one() |> Kernel.>(0)
    end
  end

  @doc "Get a single forum by ID."
  def get_forum(id) do
    query = from f in Forum, where: f.id == ^id, preload: [:categories, :owner]
    case Repo.one(query) do
      nil -> {:error, :not_found}
      forum -> {:ok, forum}
    end
  end

  @doc "Get a forum by slug."
  def get_forum_by_slug(slug) do
    query = from f in Forum, where: f.slug == ^slug, preload: [:categories, :owner]
    case Repo.one(query) do
      nil -> {:error, :not_found}
      forum -> {:ok, forum}
    end
  end

  # ============================================================================
  # Authorization
  # ============================================================================

  @owner_only_actions [:manage, :delete]
  @member_required_actions [:vote, :comment, :create_post]
  @moderator_actions [:moderate]

  @doc "Authorize an action on a forum."
  def authorize_action(nil, forum, action) do
    if action == :view && forum.is_public, do: :ok, else: {:error, :unauthorized}
  end
  def authorize_action(user, forum, action) do
    cond do
      forum.owner_id == user.id -> :ok
      action in @owner_only_actions -> {:error, :owner_only}
      true -> authorize_non_owner_action(user, forum, action)
    end
  end

  defp authorize_non_owner_action(user, forum, action) do
    is_mod = moderator?(forum, user)
    cond do
      is_mod && action in [:view, :vote, :comment, :create_post, :moderate] -> :ok
      action == :view -> authorize_view(user, forum)
      action in @member_required_actions -> authorize_member_action(user, forum)
      action in @moderator_actions -> {:error, :insufficient_permissions}
      true -> {:error, :insufficient_permissions}
    end
  end

  defp authorize_view(_user, %{is_public: true}), do: :ok
  defp authorize_view(user, forum) do
    if member?(forum.id, user.id), do: :ok, else: {:error, :not_a_member}
  end

  defp authorize_member_action(user, forum) do
    if member?(forum.id, user.id), do: :ok, else: {:error, :must_join_first}
  end

  @doc "Check if a user is a member of a forum by IDs."
  def member?(forum_id, user_id) do
    query = from fm in ForumMember, where: fm.forum_id == ^forum_id, where: fm.user_id == ^user_id, limit: 1
    Repo.exists?(query)
  end

  @doc "Check if user is a moderator of a forum."
  def moderator?(forum, user) do
    forum.owner_id == user.id || in_moderators?(forum, user)
  end

  defp in_moderators?(forum, user) do
    case forum.moderators do
      %Ecto.Association.NotLoaded{} ->
        query = from m in Moderator, where: m.forum_id == ^forum.id, where: m.user_id == ^user.id, limit: 1
        Repo.exists?(query)
      moderators when is_list(moderators) ->
        Enum.any?(moderators, fn mod -> mod.user_id == user.id end)
    end
  end

  # ============================================================================
  # CRUD
  # ============================================================================

  @doc "Create a forum."
  def create_forum(user, attrs) do
    attrs = attrs |> stringify_keys() |> Map.put("owner_id", user.id)
    %Forum{} |> Forum.changeset(attrs) |> Repo.insert()
  end

  @doc "Update a forum."
  def update_forum(forum, attrs), do: forum |> Forum.changeset(attrs) |> Repo.update()

  @doc "Delete a forum."
  def delete_forum(forum), do: Repo.delete(forum)

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  # ============================================================================
  # Moderator Management
  # ============================================================================

  @doc "Add a moderator to a forum."
  def add_moderator(forum, user, opts \\ []) do
    %Moderator{}
    |> Moderator.changeset(%{
      forum_id: forum.id,
      user_id: user.id,
      permissions: Keyword.get(opts, :permissions, []),
      added_by_id: Keyword.get(opts, :added_by_id),
      notes: Keyword.get(opts, :notes)
    })
    |> Repo.insert()
  end

  @doc "Remove a moderator from a forum."
  def remove_moderator(forum, user) do
    query = from m in Moderator, where: m.forum_id == ^forum.id, where: m.user_id == ^user.id
    case Repo.one(query) do
      nil -> {:error, :not_found}
      moderator -> Repo.delete(moderator)
    end
  end

  # ============================================================================
  # Counts & Stats
  # ============================================================================

  @doc "Count forums owned by a user."
  def count_user_forums(user_id) do
    Repo.aggregate(from(f in Forum, where: f.owner_id == ^user_id and is_nil(f.deleted_at)), :count, :id)
  end

  @doc "Count forums a user has joined."
  def count_user_joined_forums(user_id) do
    Repo.aggregate(
      from(m in ForumMember, where: m.user_id == ^user_id, join: f in Forum, on: f.id == m.forum_id, where: is_nil(f.deleted_at)),
      :count, :id
    )
  end

  @doc "Count threads created by user today."
  def count_user_threads_today(user_id) do
    today_start = Date.utc_today() |> DateTime.new!(~T[00:00:00], "Etc/UTC")
    Repo.aggregate(from(t in Thread, where: t.user_id == ^user_id and t.inserted_at >= ^today_start), :count, :id)
  end

  @doc "Count posts created by user today."
  def count_user_posts_today(user_id) do
    today_start = Date.utc_today() |> DateTime.new!(~T[00:00:00], "Etc/UTC")
    Repo.aggregate(from(p in ThreadPost, where: p.user_id == ^user_id and p.inserted_at >= ^today_start), :count, :id)
  end

  @doc "Get forum statistics."
  def get_forum_stats(forum) do
    post_count = Repo.aggregate(from(p in Post, where: p.forum_id == ^forum.id), :count, :id)
    comment_count = Repo.aggregate(
      from(c in Comment, join: p in Post, on: c.post_id == p.id, where: p.forum_id == ^forum.id),
      :count, :id
    )
    %{post_count: post_count, comment_count: comment_count, member_count: forum.member_count || 0}
  end

  @doc "Get moderation queue."
  def get_mod_queue(_forum, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    {[], %{page: page, per_page: per_page, total: 0}}
  end

  # ============================================================================
  # Subscription (Join/Leave)
  # ============================================================================

  @doc "Subscribe to forum (also creates membership)."
  def subscribe_to_forum(user, forum) do
    Repo.transaction(fn ->
      subscription_result = create_subscription(user.id, forum.id)
      member_created = ensure_forum_membership(user.id, forum.id)
      increment_member_count_if_new(forum.id, member_created)
      finalize_subscription(subscription_result)
    end)
  end

  @doc "Unsubscribe from forum (also removes membership)."
  def unsubscribe_from_forum(user, forum) do
    if forum.owner_id == user.id do
      {:error, :cannot_leave_own_forum}
    else
      Repo.transaction(fn -> perform_unsubscribe(user.id, forum.id) end)
    end
  end

  @doc "Check if user is subscribed to forum."
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

  # ============================================================================
  # Misc Helpers
  # ============================================================================

  @doc "Increment post views."
  def increment_post_views(post) do
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(inc: [views: 1])
    {:ok, %{post | views: (post.views || 0) + 1}}
  end

  @doc "Increment thread views."
  def increment_thread_views(thread_id) do
    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(inc: [view_count: 1])
  end

  @doc "Check post rate limit for a user."
  def check_post_rate_limit(user) do
    # Allow 10 posts per 5 minutes
    five_min_ago = DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), -300, :second)
    count = Repo.aggregate(
      from(p in Post, where: p.author_id == ^user.id and p.inserted_at >= ^five_min_ago),
      :count, :id
    )
    if count >= 10, do: {:error, :rate_limited}, else: :ok
  end

  @doc "Check comment rate limit for a user."
  def check_comment_rate_limit(user, _post \\ nil) do
    five_min_ago = DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), -300, :second)
    count = Repo.aggregate(
      from(c in Comment, where: c.author_id == ^user.id and c.inserted_at >= ^five_min_ago),
      :count, :id
    )
    if count >= 20, do: {:error, :rate_limited}, else: :ok
  end

  @doc "Notify comment (placeholder for notification system integration)."
  def notify_comment(_comment), do: :ok
end
