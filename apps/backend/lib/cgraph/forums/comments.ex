defmodule CGraph.Forums.Comments do
  @moduledoc """
  Comment operations for forum posts.

  Handles comment CRUD, voting, hiding, and threading.
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete

  alias CGraph.Forums.{Comment, Post, Vote}
  alias CGraph.Forums.CursorPagination
  alias CGraph.Pagination
  alias CGraph.Repo

  @doc """
  Lists comments for a post.
  """
  def list_comments(post, opts \\ []) do
    cursor = Keyword.get(opts, :cursor, nil)
    per_page = Keyword.get(opts, :per_page, 50)
    sort = Keyword.get(opts, :sort, "top")
    user = Keyword.get(opts, :user)
    parent_id = Keyword.get(opts, :parent_id)

    base_query = Comment
      |> exclude_deleted()
      |> where([c], c.post_id == ^post.id)
      |> preload([:author])

    query = base_query
    |> filter_by_parent(parent_id)
    |> apply_sort(sort)
    |> CursorPagination.apply_comment_cursor(cursor, sort)

    {comments, has_next} = Pagination.fetch_page(query, per_page)
    comments = maybe_add_user_votes(comments, user)

    meta = CursorPagination.build_cursor_meta(comments, has_next, per_page, sort, :comment)
    {comments, meta}
  end

  @doc """
  Gets a comment by ID.
  """
  def get_comment(comment_id) do
    query = from(c in Comment,
      where: c.id == ^comment_id,
      preload: [:author, :post]
    )

    case Repo.one(query) do
      nil -> {:error, :not_found}
      comment -> {:ok, comment}
    end
  end

  @doc """
  Creates a comment on a post.
  """
  def create_comment(post, user, attrs) do
    attrs = attrs |> stringify_keys() |> Map.merge(%{
      "post_id" => post.id,
      "author_id" => user.id
    })

    %Comment{}
    |> Comment.changeset(attrs)
    |> Repo.insert()
    |> case do
      {:ok, comment} ->
        # Update post comment count
        update_post_comment_count(post.id, 1)
        {:ok, Repo.preload(comment, [:author])}
      error -> error
    end
  end

  @doc """
  Updates a comment.
  """
  def update_comment(comment, attrs) do
    comment
    |> Comment.edit_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a comment (soft delete).
  """
  def delete_comment(comment) do
    comment
    |> Ecto.Changeset.change(%{
      deleted_at: DateTime.truncate(DateTime.utc_now(), :second),
      content: "[deleted]"
    })
    |> Repo.update()
    |> case do
      {:ok, deleted_comment} ->
        update_post_comment_count(comment.post_id, -1)
        {:ok, deleted_comment}
      error -> error
    end
  end

  @doc """
  Hides a comment (moderation action).
  """
  def hide_comment(comment_id, _reason) do
    from(c in Comment, where: c.id == ^comment_id)
    |> Repo.update_all(set: [
      deleted_at: DateTime.truncate(DateTime.utc_now(), :second)
    ])
    :ok
  end

  @doc """
  Soft deletes a comment.
  """
  def soft_delete_comment(comment_id, opts \\ []) do
    _reason = Keyword.get(opts, :reason, "Removed by moderator")

    from(c in Comment, where: c.id == ^comment_id)
    |> Repo.update_all(set: [
      deleted_at: DateTime.truncate(DateTime.utc_now(), :second)
    ])
    :ok
  end

  @doc """
  Votes on a comment.
  """
  def vote(user, comment, vote_type) when vote_type in [:up, :down, "up", "down"] do
    vote_value = if vote_type in [:up, "up"], do: 1, else: -1

    Repo.transaction(fn ->
      existing = Repo.get_by(Vote, user_id: user.id, comment_id: comment.id)

      case existing do
        nil ->
          # New vote
          %Vote{}
          |> Vote.changeset(%{
            user_id: user.id,
            comment_id: comment.id,
            value: vote_value
          })
          |> Repo.insert!()

          update_comment_score(comment.id, vote_value)

        vote when vote.value == vote_value ->
          # Same vote - remove it
          Repo.delete!(vote)
          update_comment_score(comment.id, -vote_value)

        vote ->
          # Different vote - flip it
          vote
          |> Vote.changeset(%{value: vote_value})
          |> Repo.update!()

          update_comment_score(comment.id, vote_value * 2)
      end

      :ok
    end)
  end

  @doc """
  Removes a vote from a comment.
  """
  def remove_vote(user, comment) do
    case Repo.get_by(Vote, user_id: user.id, comment_id: comment.id) do
      nil -> {:error, :not_found}
      vote ->
        Repo.delete(vote)
        update_comment_score(comment.id, -vote.value)
        :ok
    end
  end

  # Private helpers

  defp filter_by_parent(query, nil) do
    from(c in query, where: is_nil(c.parent_id))
  end
  defp filter_by_parent(query, parent_id) do
    from(c in query, where: c.parent_id == ^parent_id)
  end

  defp apply_sort(query, "new"), do: from(c in query, order_by: [desc: c.inserted_at])
  defp apply_sort(query, "old"), do: from(c in query, order_by: [asc: c.inserted_at])
  defp apply_sort(query, _top), do: from(c in query, order_by: [desc: c.score, desc: c.inserted_at])

  defp maybe_add_user_votes(comments, nil), do: comments
  defp maybe_add_user_votes(comments, user) do
    comment_ids = Enum.map(comments, & &1.id)

    votes = from(v in Vote,
      where: v.comment_id in ^comment_ids and v.user_id == ^user.id,
      select: {v.comment_id, v.value}
    )
    |> Repo.all()
    |> Map.new()

    Enum.map(comments, fn comment ->
      vote = Map.get(votes, comment.id)
      Map.put(comment, :my_vote, vote)
    end)
  end

  defp update_comment_score(comment_id, delta) do
    from(c in Comment, where: c.id == ^comment_id)
    |> Repo.update_all(inc: [score: delta])
  end

  defp update_post_comment_count(post_id, delta) do
    from(p in Post, where: p.id == ^post_id)
    |> Repo.update_all(inc: [comment_count: delta])
  end

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end
end
