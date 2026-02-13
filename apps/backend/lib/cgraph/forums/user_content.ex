defmodule CGraph.Forums.UserContent do
  @moduledoc """
  User content queries for profile integration.

  Provides paginated access to a user's posts, threads,
  and statistics across forums.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{Comment, Post}
  alias CGraph.Repo

  @doc """
  Lists posts by a specific user with pagination.

  ## Options
  - `:page` - Page number (default: 1)
  - `:per_page` - Posts per page (default: 20)
  - `:sort` - Sort order: :newest, :oldest, :popular (default: :newest)
  - `:forum_id` - Filter by specific forum (optional)
  """
  def list_user_posts(user_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    sort = Keyword.get(opts, :sort, :newest)
    forum_id = Keyword.get(opts, :forum_id)

    query =
      from p in Post,
        where: p.author_id == ^user_id and is_nil(p.deleted_at),
        preload: [:author, :forum]

    query =
      if forum_id do
        from p in query, where: p.forum_id == ^forum_id
      else
        query
      end

    query = apply_user_posts_sort(query, sort)

    total_count = Repo.aggregate(query, :count, :id)
    total_pages = max(1, ceil(total_count / per_page))

    posts =
      query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: total_pages,
      has_next: page < total_pages,
      has_prev: page > 1
    }

    {posts, pagination}
  end

  @doc """
  Lists threads started by a specific user with pagination.

  ## Options
  - `:page` - Page number (default: 1)
  - `:per_page` - Threads per page (default: 20)
  - `:sort` - Sort order: :newest, :oldest, :popular, :most_replies (default: :newest)
  - `:forum_id` - Filter by specific forum (optional)
  """
  def list_user_threads(user_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)
    sort = Keyword.get(opts, :sort, :newest)
    forum_id = Keyword.get(opts, :forum_id)

    query =
      from p in Post,
        where: p.author_id == ^user_id and is_nil(p.deleted_at),
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

    count_query =
      from p in Post,
        where: p.author_id == ^user_id and is_nil(p.deleted_at)

    count_query =
      if forum_id do
        from p in count_query, where: p.forum_id == ^forum_id
      else
        count_query
      end

    total_count = Repo.aggregate(count_query, :count, :id)
    total_pages = max(1, ceil(total_count / per_page))

    threads =
      query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    pagination = %{
      page: page,
      per_page: per_page,
      total_count: total_count,
      total_pages: total_pages,
      has_next: page < total_pages,
      has_prev: page > 1
    }

    {threads, pagination}
  end

  @doc """
  Gets post/thread count statistics for a user.
  """
  def get_user_post_stats(user_id) do
    post_count =
      from(p in Post,
        where: p.author_id == ^user_id and is_nil(p.deleted_at),
        select: count(p.id)
      )
      |> Repo.one()

    comment_count =
      from(c in Comment,
        where: c.author_id == ^user_id and is_nil(c.deleted_at),
        select: count(c.id)
      )
      |> Repo.one()

    total_karma =
      from(p in Post,
        where: p.author_id == ^user_id and is_nil(p.deleted_at),
        select: coalesce(sum(p.score), 0)
      )
      |> Repo.one()

    comment_karma =
      from(c in Comment,
        where: c.author_id == ^user_id and is_nil(c.deleted_at),
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
end
