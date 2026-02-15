defmodule CGraph.Forums.CursorPagination do
  @moduledoc """
  Cursor-based pagination helpers for forum content.

  Extracted from the main Forums module to reduce complexity.
  Provides cursor filters and metadata builders for posts, comments,
  forums (leaderboard), and threads.
  """

  import Ecto.Query, warn: false
  alias CGraph.Pagination

  # ============================================================================
  # Post Cursors
  # ============================================================================

  def apply_post_cursor(query, cursor, sort) do
    case sort do
      "new" -> apply_simple_cursor_desc(query, cursor, :inserted_at)
      "top" -> apply_simple_cursor_desc(query, cursor, :score)
      "controversial" -> apply_controversy_cursor(query, cursor)
      _ -> apply_hot_formula_cursor(query, cursor)
    end
  end

  # ============================================================================
  # Comment Cursors
  # ============================================================================

  def apply_comment_cursor(query, cursor, sort) do
    case sort do
      "new" -> apply_simple_cursor_desc(query, cursor, :inserted_at)
      "old" -> apply_simple_cursor_asc(query, cursor, :inserted_at)
      "controversial" -> apply_controversy_cursor(query, cursor)
      _ -> apply_simple_cursor_desc(query, cursor, :score)
    end
  end

  # ============================================================================
  # Forum (Leaderboard) Cursors
  # ============================================================================

  def apply_forum_cursor(query, cursor, sort) do
    field = case sort do
      "hot" -> :hot_score
      "top" -> :score
      "new" -> :inserted_at
      s when s in ["rising", "weekly"] -> :weekly_score
      "members" -> :member_count
      _ -> :hot_score
    end
    apply_simple_cursor_desc(query, cursor, field)
  end

  # ============================================================================
  # Thread Cursors (compound: is_pinned + sort field)
  # ============================================================================

  def apply_thread_cursor_filter(query, cursor, sort) do
    sort_field = case sort do
      "latest" -> :last_post_at
      "hot" -> :hot_score
      "top" -> :score
      "views" -> :view_count
      _ -> :last_post_at
    end

    case Pagination.decode_cursor(cursor) do
      %{p: pinned, v: v, id: id} ->
        val = Pagination.deserialize_cursor_value(v)
        from t in query,
          where: fragment(
            "(?, ?, ?) < (?::boolean, ?, ?::uuid)",
            t.is_pinned, field(t, ^sort_field), t.id,
            ^pinned, ^val, ^id
          )
      _ -> query
    end
  end

  # ============================================================================
  # Generic Cursor Filters
  # ============================================================================

  def apply_simple_cursor_desc(query, cursor, field) do
    case Pagination.decode_cursor(cursor) do
      %{v: v, id: id} ->
        val = Pagination.deserialize_cursor_value(v)
        from q in query,
          where: fragment("(?, ?) < (?, ?::uuid)", field(q, ^field), q.id, ^val, ^id)
      _ -> query
    end
  end

  def apply_simple_cursor_asc(query, cursor, field) do
    case Pagination.decode_cursor(cursor) do
      %{v: v, id: id} ->
        val = Pagination.deserialize_cursor_value(v)
        from q in query,
          where: fragment("(?, ?) > (?, ?::uuid)", field(q, ^field), q.id, ^val, ^id)
      _ -> query
    end
  end

  def apply_controversy_cursor(query, cursor) do
    case Pagination.decode_cursor(cursor) do
      %{v: v, id: id} ->
        from q in query,
          where: fragment(
            "(? + ?, ?) < (?::integer, ?::uuid)",
            q.upvotes, q.downvotes, q.id, ^v, ^id
          )
      _ -> query
    end
  end

  def apply_hot_formula_cursor(query, cursor) do
    case Pagination.decode_cursor(cursor) do
      %{v: v, id: id} ->
        from q in query,
          where: fragment(
            "(? / POWER(EXTRACT(EPOCH FROM (NOW() - ?))/3600 + 2, 1.8), ?) < (?::float8, ?::uuid)",
            q.score, q.inserted_at, q.id, ^v, ^id
          )
      _ -> query
    end
  end

  # ============================================================================
  # Cursor Metadata Builders
  # ============================================================================

  def build_cursor_meta([], _has_next, per_page, _sort, _type) do
    %{per_page: per_page, has_next_page: false, next_cursor: nil}
  end

  def build_cursor_meta(items, has_next, per_page, sort, type) do
    next_cursor = if has_next do
      last = List.last(items)
      build_item_cursor(last, sort, type)
    end

    %{per_page: per_page, has_next_page: has_next, next_cursor: next_cursor}
  end

  def build_item_cursor(item, sort, :post) do
    val = case sort do
      "new" -> item.inserted_at
      "top" -> item.score
      "controversial" -> (item.upvotes || 0) + (item.downvotes || 0)
      _ -> compute_hot_value(item)
    end
    Pagination.encode_cursor_data(%{v: val, id: item.id})
  end

  def build_item_cursor(item, sort, :comment) do
    val = case sort do
      "new" -> item.inserted_at
      "old" -> item.inserted_at
      "controversial" -> (item.upvotes || 0) + (item.downvotes || 0)
      _ -> item.score
    end
    Pagination.encode_cursor_data(%{v: val, id: item.id})
  end

  def build_item_cursor(item, sort, :forum) do
    val = case sort do
      "hot" -> item.hot_score
      "top" -> item.score
      "new" -> item.inserted_at
      s when s in ["rising", "weekly"] -> item.weekly_score
      "members" -> item.member_count
      _ -> item.hot_score
    end
    Pagination.encode_cursor_data(%{v: val, id: item.id})
  end

  def build_item_cursor(item, sort, :thread) do
    val = case sort do
      "latest" -> item.last_post_at
      "hot" -> item.hot_score
      "top" -> item.score
      "views" -> item.view_count
      _ -> item.last_post_at
    end
    Pagination.encode_cursor_data(%{p: item.is_pinned, v: val, id: item.id})
  end

  def compute_hot_value(post) do
    age_seconds = DateTime.diff(DateTime.truncate(DateTime.utc_now(), :second), post.inserted_at, :second)
    age_hours = age_seconds / 3600.0
    (post.score || 0) / :math.pow(age_hours + 2, 1.8)
  end
end
