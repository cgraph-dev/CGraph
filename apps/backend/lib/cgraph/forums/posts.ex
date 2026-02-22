defmodule CGraph.Forums.Posts do
  @moduledoc """
  Post operations for forums.

  Handles post CRUD, voting, hiding, pinning, locking.
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete

  alias CGraph.Forums.{Post, PostVote}
  alias CGraph.Forums.CursorPagination
  alias CGraph.Pagination
  alias CGraph.Repo

  @doc """
  Lists posts for a forum with pagination and sorting.
  """
  @spec list_posts(struct(), keyword()) :: {[Post.t()], map()}
  def list_posts(forum, opts \\ []) do
    cursor = Keyword.get(opts, :cursor, nil)
    per_page = Keyword.get(opts, :per_page, 20)
    sort = Keyword.get(opts, :sort, "hot")
    category_id = Keyword.get(opts, :category_id)
    user = Keyword.get(opts, :user)

    base_query = Post
      |> exclude_deleted()
      |> where([p], p.forum_id == ^forum.id)
      |> preload([:author, :category])

    query = base_query
    |> maybe_filter_by_category(category_id)
    |> apply_sort(sort)
    |> CursorPagination.apply_post_cursor(cursor, sort)

    {posts, has_next} = Pagination.fetch_page(query, per_page)
    posts = maybe_add_user_votes(posts, user)

    meta = CursorPagination.build_cursor_meta(posts, has_next, per_page, sort, :post)
    {posts, meta}
  end

  @doc """
  Gets a post by ID.
  """
  @spec get_post(binary()) :: {:ok, Post.t()} | {:error, :not_found}
  def get_post(post_id) do
    query = Post
      |> exclude_deleted()
      |> where([p], p.id == ^post_id)
      |> preload([:author, :category, :forum])

    case Repo.one(query) do
      nil -> {:error, :not_found}
      post -> {:ok, post}
    end
  end

  @doc """
  Gets a post with user's vote info.
  """
  @spec get_post_with_vote(struct(), binary(), struct() | nil) :: {:ok, Post.t()} | {:error, :not_found}
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
  @spec create_post(struct(), struct(), map()) :: {:ok, Post.t()} | {:error, Ecto.Changeset.t()}
  def create_post(forum, user, attrs) do
    attrs = attrs |> stringify_keys() |> Map.merge(%{
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
  @spec update_post(Post.t(), map()) :: {:ok, Post.t()} | {:error, Ecto.Changeset.t()}
  def update_post(post, attrs) do
    post
    |> Post.edit_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a post (soft delete).
  """
  @spec delete_post(Post.t()) :: {:ok, Post.t()} | {:error, Ecto.Changeset.t()}
  def delete_post(post) do
    post
    |> Ecto.Changeset.change(%{deleted_at: DateTime.truncate(DateTime.utc_now(), :second)})
    |> Repo.update()
    |> case do
      {:ok, deleted_post} ->
        update_forum_post_count(post.forum_id, -1)
        {:ok, deleted_post}
      error -> error
    end
  end

  @doc """
  Hides a post (moderation action).
  """
  @spec hide_post(binary(), term()) :: :ok
  def hide_post(post_id, _reason) do
    from(p in Post, where: p.id == ^post_id)
    |> Repo.update_all(set: [
      deleted_at: DateTime.truncate(DateTime.utc_now(), :second)
    ])
    :ok
  end

  @doc """
  Soft deletes a post.
  """
  @spec soft_delete_post(binary(), keyword()) :: :ok
  def soft_delete_post(post_id, opts \\ []) do
    _reason = Keyword.get(opts, :reason, "Removed by moderator")

    from(p in Post, where: p.id == ^post_id)
    |> Repo.update_all(set: [
      deleted_at: DateTime.truncate(DateTime.utc_now(), :second)
    ])
    :ok
  end

  @doc """
  Increments post view count.
  """
  @spec increment_views(Post.t()) :: :ok
  def increment_views(post) do
    from(p in Post, where: p.id == ^post.id)
    |> Repo.update_all(inc: [view_count: 1])
    :ok
  end

  @doc """
  Pins a post.
  """
  @spec pin_post(Post.t()) :: {:ok, Post.t()} | {:error, Ecto.Changeset.t()}
  def pin_post(post) do
    post
    |> Ecto.Changeset.change(%{is_pinned: true})
    |> Repo.update()
  end

  @doc """
  Unpins a post.
  """
  @spec unpin_post(Post.t()) :: {:ok, Post.t()} | {:error, Ecto.Changeset.t()}
  def unpin_post(post) do
    post
    |> Ecto.Changeset.change(%{is_pinned: false})
    |> Repo.update()
  end

  @doc """
  Locks a post (prevents new comments).
  """
  @spec lock_post(Post.t()) :: {:ok, Post.t()} | {:error, Ecto.Changeset.t()}
  def lock_post(post) do
    post
    |> Ecto.Changeset.change(%{is_locked: true})
    |> Repo.update()
  end

  @doc """
  Unlocks a post.
  """
  @spec unlock_post(Post.t()) :: {:ok, Post.t()} | {:error, Ecto.Changeset.t()}
  def unlock_post(post) do
    post
    |> Ecto.Changeset.change(%{is_locked: false})
    |> Repo.update()
  end

  @doc """
  Toggles pin status.
  """
  @spec toggle_pin(Post.t()) :: {:ok, Post.t()} | {:error, Ecto.Changeset.t()}
  def toggle_pin(post) do
    if post.is_pinned, do: unpin_post(post), else: pin_post(post)
  end

  @doc """
  Toggles lock status.
  """
  @spec toggle_lock(Post.t()) :: {:ok, Post.t()} | {:error, Ecto.Changeset.t()}
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

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end
end
