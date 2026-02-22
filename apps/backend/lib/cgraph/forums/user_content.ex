defmodule CGraph.Forums.UserContent do
  @moduledoc """
  User content queries for profile integration.

  Provides paginated access to a user's posts, threads,
  and statistics across forums.
  """

  import Ecto.Query, warn: false
  import CGraph.Query.SoftDelete
  alias CGraph.Forums.{Comment, Post}
  alias CGraph.Forums.CursorPagination
  alias CGraph.Pagination
  alias CGraph.Repo

  @doc """
  Lists posts by a specific user with pagination.

  ## Options
  - `:page` - Page number (default: 1)
  - `:per_page` - Posts per page (default: 20)
  - `:sort` - Sort order: :newest, :oldest, :popular (default: :newest)
  - `:forum_id` - Filter by specific forum (optional)
  """
  @spec list_user_posts(String.t(), keyword()) :: {[Post.t()], map()}
  def list_user_posts(user_id, opts \\ []) do
    cursor = Keyword.get(opts, :cursor, nil)
    per_page = Keyword.get(opts, :per_page, 20)
    sort = Keyword.get(opts, :sort, :newest)
    forum_id = Keyword.get(opts, :forum_id)

    query =
      from p in Post,
        where: p.author_id == ^user_id and not_deleted(p),
        preload: [:author, :forum]

    query =
      if forum_id do
        from p in query, where: p.forum_id == ^forum_id
      else
        query
      end

    query = apply_user_posts_sort(query, sort)
    query = apply_user_content_cursor(query, cursor, sort)

    {posts, has_next} = Pagination.fetch_page(query, per_page)

    cursor_sort = map_user_sort_to_cursor_sort(sort)
    meta = CursorPagination.build_cursor_meta(posts, has_next, per_page, cursor_sort, :post)
    {posts, meta}
  end

  @doc """
  Lists threads started by a specific user with pagination.

  ## Options
  - `:page` - Page number (default: 1)
  - `:per_page` - Threads per page (default: 20)
  - `:sort` - Sort order: :newest, :oldest, :popular, :most_replies (default: :newest)
  - `:forum_id` - Filter by specific forum (optional)
  """
  @spec list_user_threads(String.t(), keyword()) :: {[Post.t()], map()}
  def list_user_threads(user_id, opts \\ []) do
    cursor = Keyword.get(opts, :cursor, nil)
    per_page = Keyword.get(opts, :per_page, 20)
    sort = Keyword.get(opts, :sort, :newest)
    forum_id = Keyword.get(opts, :forum_id)

    query =
      from p in Post,
        where: p.author_id == ^user_id and not_deleted(p),
        preload: [:author, :forum],
        select_merge: %{
          reply_count: fragment("COALESCE((SELECT COUNT(*) FROM forum_comments WHERE post_id = ?), 0)", p.id)
        }

    query =
      if forum_id do
        from p in query, where: p.forum_id == ^forum_id
      else
        query
      end

    query = apply_user_threads_sort(query, sort)
    query = apply_user_content_cursor(query, cursor, sort)

    {threads, has_next} = Pagination.fetch_page(query, per_page)

    cursor_sort = map_user_sort_to_cursor_sort(sort)
    meta = CursorPagination.build_cursor_meta(threads, has_next, per_page, cursor_sort, :post)
    {threads, meta}
  end

  @doc """
  Gets post/thread count statistics for a user.
  """
  @spec get_user_post_stats(String.t()) :: map()
  def get_user_post_stats(user_id) do
    post_count =
      from(p in Post,
        where: p.author_id == ^user_id and not_deleted(p),
        select: count(p.id)
      )
      |> Repo.one()

    comment_count =
      from(c in Comment,
        where: c.author_id == ^user_id and not_deleted(c),
        select: count(c.id)
      )
      |> Repo.one()

    total_karma =
      from(p in Post,
        where: p.author_id == ^user_id and not_deleted(p),
        select: coalesce(sum(p.score), 0)
      )
      |> Repo.one()

    comment_karma =
      from(c in Comment,
        where: c.author_id == ^user_id and not_deleted(c),
        select: coalesce(sum(c.score), 0)
      )
      |> Repo.one()

    %{
      post_count: post_count || 0,
      comment_count: comment_count || 0,
      thread_count: post_count || 0,
      total_posts: (post_count || 0) + (comment_count || 0),
      post_karma: total_karma || 0,
      comment_karma: comment_karma || 0,
      total_karma: (total_karma || 0) + (comment_karma || 0)
    }
  end

  defp apply_user_posts_sort(query, :newest) do
    from p in query, order_by: [desc: p.inserted_at]
  end
  defp apply_user_posts_sort(query, :oldest) do
    from p in query, order_by: [asc: p.inserted_at]
  end
  defp apply_user_posts_sort(query, :popular) do
    from p in query, order_by: [desc: p.score, desc: p.inserted_at]
  end
  defp apply_user_posts_sort(query, _), do: apply_user_posts_sort(query, :newest)

  defp apply_user_threads_sort(query, :newest) do
    from p in query, order_by: [desc: p.inserted_at]
  end
  defp apply_user_threads_sort(query, :oldest) do
    from p in query, order_by: [asc: p.inserted_at]
  end
  defp apply_user_threads_sort(query, :popular) do
    from p in query, order_by: [desc: p.score, desc: p.inserted_at]
  end
  defp apply_user_threads_sort(query, :most_replies) do
    from p in query, order_by: [desc: fragment("COALESCE((SELECT COUNT(*) FROM forum_comments WHERE post_id = ?), 0)", p.id), desc: p.inserted_at]
  end
  defp apply_user_threads_sort(query, _), do: apply_user_threads_sort(query, :newest)

  defp apply_user_content_cursor(query, cursor, :newest),
    do: CursorPagination.apply_simple_cursor_desc(query, cursor, :inserted_at)
  defp apply_user_content_cursor(query, cursor, :oldest),
    do: CursorPagination.apply_simple_cursor_asc(query, cursor, :inserted_at)
  defp apply_user_content_cursor(query, cursor, :popular),
    do: CursorPagination.apply_simple_cursor_desc(query, cursor, :score)
  defp apply_user_content_cursor(query, cursor, _),
    do: CursorPagination.apply_simple_cursor_desc(query, cursor, :inserted_at)

  defp map_user_sort_to_cursor_sort(:newest), do: "new"
  defp map_user_sort_to_cursor_sort(:oldest), do: "new"
  defp map_user_sort_to_cursor_sort(:popular), do: "top"
  defp map_user_sort_to_cursor_sort(_), do: "new"
end
