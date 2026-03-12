defmodule CGraph.Forums.Search do
  @moduledoc """
  Full-text search for forum content.

  Uses PostgreSQL tsvector/tsquery for ranked full-text search across
  threads, thread_posts, posts, and comments. Falls back to ILIKE
  when the query is too short for tsvector.

  ## Supported filters
  - `:forum_id`   — scope to a specific forum
  - `:board_id`   — scope to a specific board (MyBB threads/posts)
  - `:author_id`  — filter by content author
  - `:date_from`  — only results after this datetime
  - `:date_to`    — only results before this datetime
  - `:sort`       — "relevance" (default), "new", "top"
  - `:cursor`     — cursor-based pagination token
  - `:per_page`   — results per page (default 20)
  """

  import Ecto.Query, warn: false

  alias CGraph.Forums.{Comment, CursorPagination, Post, Thread, ThreadPost, ThreadTag}
  alias CGraph.Pagination

  # ── Public API ───────────────────────────────────────────────────────

  @doc """
  Search reddit-style posts (backward-compatible).
  """
  @spec search_posts(String.t(), keyword()) :: {[Post.t()], map()}
  def search_posts(query_string, opts \\ []) do
    tsquery = to_tsquery(query_string)
    cursor = Keyword.get(opts, :cursor, nil)
    per_page = Keyword.get(opts, :per_page, 20)
    forum_id = Keyword.get(opts, :forum_id)
    author_id = Keyword.get(opts, :author_id)
    date_from = Keyword.get(opts, :date_from)
    date_to = Keyword.get(opts, :date_to)
    sort = Keyword.get(opts, :sort, "relevance")

    query =
      from(p in Post,
        where: fragment("? @@ to_tsquery('english', ?)", p.search_vector, ^tsquery),
        preload: [:author, :forum]
      )
      |> maybe_filter(:forum_id, forum_id)
      |> maybe_filter(:author_id, author_id)
      |> maybe_filter_date(:date_from, date_from)
      |> maybe_filter_date(:date_to, date_to)
      |> apply_sort(sort, tsquery)

    {query, cursor_sort} =
      if sort in ["new", "top"],
        do: {query, sort},
        else: {from(p in query, order_by: [desc: p.inserted_at]), "new"}

    query = CursorPagination.apply_post_cursor(query, cursor, cursor_sort)
    {posts, has_next} = Pagination.fetch_page(query, per_page)
    meta = CursorPagination.build_cursor_meta(posts, has_next, per_page, cursor_sort, :post)
    {posts, meta}
  end

  @doc """
  Search MyBB-style threads.
  """
  @spec search_threads(String.t(), keyword()) :: {[Thread.t()], map()}
  def search_threads(query_string, opts \\ []) do
    tsquery = to_tsquery(query_string)
    per_page = Keyword.get(opts, :per_page, 20)
    board_id = Keyword.get(opts, :board_id)
    author_id = Keyword.get(opts, :author_id)
    date_from = Keyword.get(opts, :date_from)
    date_to = Keyword.get(opts, :date_to)
    sort = Keyword.get(opts, :sort, "relevance")
    cursor = Keyword.get(opts, :cursor)
    tag_ids = Keyword.get(opts, :tag_ids)

    query =
      from(t in Thread,
        where: fragment("? @@ to_tsquery('english', ?)", t.search_vector, ^tsquery),
        preload: [:author, :board]
      )
      |> maybe_filter(:board_id, board_id)
      |> maybe_filter(:author_id, author_id)
      |> maybe_filter_date(:date_from, date_from)
      |> maybe_filter_date(:date_to, date_to)
      |> maybe_filter_tags(tag_ids)
      |> apply_sort(sort, tsquery)

    {query, cursor_sort} =
      if sort in ["new", "top"],
        do: {query, sort},
        else: {from(t in query, order_by: [desc: t.inserted_at]), "new"}

    query = CursorPagination.apply_simple_cursor_desc(query, cursor, :inserted_at)
    {threads, has_next} = Pagination.fetch_page(query, per_page)
    meta = CursorPagination.build_cursor_meta(threads, has_next, per_page, cursor_sort, :post)
    {threads, meta}
  end

  @doc """
  Search MyBB-style thread posts (replies).
  """
  @spec search_thread_posts(String.t(), keyword()) :: {[ThreadPost.t()], map()}
  def search_thread_posts(query_string, opts \\ []) do
    tsquery = to_tsquery(query_string)
    per_page = Keyword.get(opts, :per_page, 20)
    board_id = Keyword.get(opts, :board_id)
    author_id = Keyword.get(opts, :author_id)
    date_from = Keyword.get(opts, :date_from)
    date_to = Keyword.get(opts, :date_to)
    sort = Keyword.get(opts, :sort, "relevance")
    cursor = Keyword.get(opts, :cursor)

    base =
      from(tp in ThreadPost,
        where: fragment("? @@ to_tsquery('english', ?)", tp.search_vector, ^tsquery),
        preload: [:author, :thread]
      )

    query =
      if board_id do
        from(tp in base,
          join: t in Thread, on: t.id == tp.thread_id,
          where: t.board_id == ^board_id
        )
      else
        base
      end
      |> maybe_filter(:author_id, author_id)
      |> maybe_filter_date(:date_from, date_from)
      |> maybe_filter_date(:date_to, date_to)
      |> apply_sort(sort, tsquery)

    {query, cursor_sort} =
      if sort in ["new", "top"],
        do: {query, sort},
        else: {from(tp in query, order_by: [desc: tp.inserted_at]), "new"}

    query = CursorPagination.apply_simple_cursor_desc(query, cursor, :inserted_at)
    {posts, has_next} = Pagination.fetch_page(query, per_page)
    meta = CursorPagination.build_cursor_meta(posts, has_next, per_page, cursor_sort, :post)
    {posts, meta}
  end

  @doc """
  Search reddit-style comments.
  """
  @spec search_comments(String.t(), keyword()) :: {[Comment.t()], map()}
  def search_comments(query_string, opts \\ []) do
    tsquery = to_tsquery(query_string)
    per_page = Keyword.get(opts, :per_page, 20)
    forum_id = Keyword.get(opts, :forum_id)
    author_id = Keyword.get(opts, :author_id)
    date_from = Keyword.get(opts, :date_from)
    date_to = Keyword.get(opts, :date_to)
    sort = Keyword.get(opts, :sort, "relevance")
    cursor = Keyword.get(opts, :cursor)

    base =
      from(c in Comment,
        where: fragment("? @@ to_tsquery('english', ?)", c.search_vector, ^tsquery),
        preload: [:author, :post]
      )

    query =
      if forum_id do
        from(c in base,
          join: p in Post, on: p.id == c.post_id,
          where: p.forum_id == ^forum_id
        )
      else
        base
      end
      |> maybe_filter(:author_id, author_id)
      |> maybe_filter_date(:date_from, date_from)
      |> maybe_filter_date(:date_to, date_to)
      |> apply_sort(sort, tsquery)

    {query, cursor_sort} =
      if sort in ["new", "top"],
        do: {query, sort},
        else: {from(c in query, order_by: [desc: c.inserted_at]), "new"}

    query = CursorPagination.apply_simple_cursor_desc(query, cursor, :inserted_at)
    {comments, has_next} = Pagination.fetch_page(query, per_page)
    meta = CursorPagination.build_cursor_meta(comments, has_next, per_page, cursor_sort, :post)
    {comments, meta}
  end

  @doc """
  Unified multi-entity search returning mixed results with type indicators.
  """
  @spec search_all(String.t(), keyword()) :: {list(), map()}
  def search_all(query_string, opts \\ []) do
    per_page = Keyword.get(opts, :per_page, 20)
    limit_each = div(per_page, 4) |> max(5)
    sub_opts = Keyword.put(opts, :per_page, limit_each)

    {threads, _} = search_threads(query_string, sub_opts)
    {thread_posts, _} = search_thread_posts(query_string, sub_opts)
    {posts, _} = search_posts(query_string, sub_opts)
    {comments, _} = search_comments(query_string, sub_opts)

    results =
      tag_results(threads, "thread") ++
      tag_results(thread_posts, "thread_post") ++
      tag_results(posts, "post") ++
      tag_results(comments, "comment")

    sorted =
      Enum.sort_by(results, & &1.inserted_at, {:desc, DateTime})
      |> Enum.take(per_page)

    meta = %{
      per_page: per_page,
      has_next_page: length(results) > per_page,
      result_count: length(sorted)
    }

    {sorted, meta}
  end

  # ── Private helpers ──────────────────────────────────────────────────

  @doc false
  def to_tsquery(query_string) when is_binary(query_string) do
    query_string
    |> String.trim()
    |> String.replace(~r/[^\w\s]/, "")
    |> String.split(~r/\s+/, trim: true)
    |> Enum.map(&(&1 <> ":*"))
    |> Enum.join(" & ")
    |> case do
      "" -> "a"
      tsq -> tsq
    end
  end

  defp tag_results(records, type) do
    Enum.map(records, fn record ->
      %{
        id: record.id,
        type: type,
        title: Map.get(record, :title, nil),
        content: Map.get(record, :content, nil) |> maybe_truncate(200),
        author_id: Map.get(record, :author_id),
        score: Map.get(record, :score, 0),
        inserted_at: record.inserted_at
      }
    end)
  end

  defp maybe_truncate(nil, _len), do: nil
  defp maybe_truncate(text, len) when byte_size(text) <= len, do: text
  defp maybe_truncate(text, len), do: String.slice(text, 0, len) <> "…"

  defp maybe_filter(query, :forum_id, nil), do: query
  defp maybe_filter(query, :forum_id, id), do: from(q in query, where: q.forum_id == ^id)
  defp maybe_filter(query, :board_id, nil), do: query
  defp maybe_filter(query, :board_id, id), do: from(q in query, where: q.board_id == ^id)
  defp maybe_filter(query, :author_id, nil), do: query
  defp maybe_filter(query, :author_id, id), do: from(q in query, where: q.author_id == ^id)

  defp maybe_filter_date(query, :date_from, nil), do: query
  defp maybe_filter_date(query, :date_from, dt), do: from(q in query, where: q.inserted_at >= ^dt)
  defp maybe_filter_date(query, :date_to, nil), do: query
  defp maybe_filter_date(query, :date_to, dt), do: from(q in query, where: q.inserted_at <= ^dt)

  defp maybe_filter_tags(query, nil), do: query
  defp maybe_filter_tags(query, []), do: query

  defp maybe_filter_tags(query, tag_ids) when is_list(tag_ids) do
    from(q in query,
      join: tt in ThreadTag,
      on: tt.thread_id == q.id,
      where: tt.tag_category_id in ^tag_ids,
      distinct: true
    )
  end

  defp apply_sort(query, "new", _tsquery), do: from(q in query, order_by: [desc: q.inserted_at])
  defp apply_sort(query, "top", _tsquery), do: from(q in query, order_by: [desc: q.score])

  defp apply_sort(query, _relevance, tsquery) do
    from(q in query,
      order_by: [desc: fragment("ts_rank_cd(?, to_tsquery('english', ?))", q.search_vector, ^tsquery)]
    )
  end
end
