defmodule CGraph.Forums.Posts do
  @moduledoc """
  Post operations for forums (Reddit-style posts within forums).

  Handles post CRUD, voting, hiding, pinning, locking.
  """

  import Ecto.Query, warn: false

  alias CGraph.Forums.{Post, PostVote}
  alias CGraph.Repo

  @doc """
  Lists posts for a forum with pagination and sorting.
  """
  def list_posts(forum, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    sort = Keyword.get(opts, :sort, "hot")
    category_id = Keyword.get(opts, :category_id)
    user = Keyword.get(opts, :user)

    base_query = from(p in Post,
      where: p.forum_id == ^forum.id,
      where: is_nil(p.deleted_at),
      preload: [:author, :category]
    )

    query = base_query
    |> maybe_filter_by_category(category_id)
    |> apply_sort(sort)

    total = Repo.aggregate(query, :count, :id)

    posts = query
    |> limit(^per_page)
    |> offset(^((page - 1) * per_page))
    |> Repo.all()
    |> maybe_add_user_votes(user)

    meta = %{page: page, per_page: per_page, total: total}
    {posts, meta}
  end

  @doc """
  Gets a post by ID.
  """
  def get_post(post_id) do
    case Repo.get(Post, post_id) do
      nil -> {:error, :not_found}
      post -> {:ok, Repo.preload(post, [:author, :category, :forum])}
    end
  end

  @doc """
  Gets a post with user's vote info.
  """
  def get_post_with_vote(forum, post_id, user) do
    case get_post(post_id) do
      {:ok, post} ->
        if post.forum_id != forum.id do
          {:error, :not_found}
        else
          post = add_user_vote(post, user)
          {:ok, post}
        end
      error -> error
    end
  end

  @doc """
  Creates a post in a forum.
  """
  def create_post(forum, user, attrs) do
    attrs = Map.merge(attrs, %{
      "forum_id" => forum.id,
      "author_id" => user.id
    })

    %Post{}
    |> Post.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, post} ->
        # Update forum post count
        update_forum_post_count(forum.id, 1)
        {:ok, Repo.preload(post, [:author, :category])}
      error -> error
    end
  end

  @doc """
  Updates a post.
  """
  def update_post(post, attrs) do
    post
    |> Post.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a post (soft delete).
  """
  def delete_post(post) do
    post
    |> Ecto.Changeset.change(%{deleted_at: DateTime.utc_now()})
    |> Repo.update()
    |> case do
      {:ok, _post} ->
        update_forum_post_count(post.forum_id, -1)
        {:ok, :deleted}
      error -> error
    end
  end

  @doc """
  Hides a post (moderation action).
  """
  def hide_post(post_id, reason) do
    from(p in Post, where: p.id == ^post_id)
    |> Repo.update_all(set: [
      is_hidden: true,
      hidden_reason: reason,
      hidden_at: DateTime.utc_now()
    ])
    :ok
  end

  @doc """
  Soft deletes a post.
  """
  def soft_delete_post(post_id, opts \\ []) do
    reason = Keyword.get(opts, :reason, "Removed by moderator")

    from(p in Post, where: p.id == ^post_id)
    |> Repo.update_all(set: [
      is_deleted: true,
      deleted_reason: reason,
      deleted_at: DateTime.utc_now()
    ])
    :ok
  end

  @doc """
  Increments post view count.
  """
  def increment_views(post) do
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(inc: [views: 1])
    :ok
  end

  @doc """
  Pins a post.
  """
  def pin_post(post) do
    post
    |> Ecto.Changeset.change(%{is_pinned: true})
    |> Repo.update()
  end

  @doc """
  Unpins a post.
  """
  def unpin_post(post) do
    post
    |> Ecto.Changeset.change(%{is_pinned: false})
    |> Repo.update()
  end

  @doc """
  Locks a post (prevents new comments).
  """
  def lock_post(post) do
    post
    |> Ecto.Changeset.change(%{is_locked: true})
    |> Repo.update()
  end

  @doc """
  Unlocks a post.
  """
  def unlock_post(post) do
    post
    |> Ecto.Changeset.change(%{is_locked: false})
    |> Repo.update()
  end

  @doc """
  Toggles pin status.
  """
  def toggle_pin(post) do
    if post.is_pinned, do: unpin_post(post), else: pin_post(post)
  end

  @doc """
  Toggles lock status.
  """
  def toggle_lock(post) do
    if post.is_locked, do: unlock_post(post), else: lock_post(post)
  end

  # Private helpers

  defp maybe_filter_by_category(query, nil), do: query
  defp maybe_filter_by_category(query, category_id) do
    from(p in query, where: p.category_id == ^category_id)
  end

  defp apply_sort(query, "new"), do: from(p in query, order_by: [desc: p.inserted_at])
  defp apply_sort(query, "top"), do: from(p in query, order_by: [desc: p.score])
  defp apply_sort(query, "controversial") do
    from(p in query, order_by: [desc: fragment("? + ?", p.upvotes, p.downvotes)])
  end
  defp apply_sort(query, _hot) do
    from(p in query, order_by: [
      desc: fragment("? / POWER(EXTRACT(EPOCH FROM (NOW() - ?))/3600 + 2, 1.8)", p.score, p.inserted_at)
    ])
  end

  defp maybe_add_user_votes(posts, nil), do: posts
  defp maybe_add_user_votes(posts, user) do
    post_ids = Enum.map(posts, & &1.id)

    votes = from(v in PostVote,
      where: v.post_id in ^post_ids and v.user_id == ^user.id,
      select: {v.post_id, v.value}
    )
    |> Repo.all()
    |> Map.new()

    Enum.map(posts, fn post ->
      vote = Map.get(votes, post.id)
      Map.put(post, :my_vote, vote)
    end)
  end

  defp add_user_vote(post, nil), do: Map.put(post, :my_vote, nil)
  defp add_user_vote(post, user) do
    vote = Repo.get_by(PostVote, post_id: post.id, user_id: user.id)
    Map.put(post, :my_vote, vote && vote.value)
  end

  defp update_forum_post_count(forum_id, delta) do
    from(f in CGraph.Forums.Forum, where: f.id == ^forum_id)
    |> Repo.update_all(inc: [post_count: delta])
  end
end
