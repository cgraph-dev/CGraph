defmodule CGraph.Forums.Search do
  @moduledoc """
  Search functionality for forums.

  Supports searching posts by title and content with
  filtering by forum and sorting options.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.CursorPagination
  alias CGraph.Forums.Post
  alias CGraph.Pagination
  # alias CGraph.Repo  # unused — queries use ReadRepo

  @doc """
  Search posts by title or content.

  Supports filtering by forum and sorting by relevance, date, or score.

  ## Options
  - `:page` - Page number (default: 1)
  - `:per_page` - Results per page (default: 20)
  - `:forum_id` - Filter by specific forum (optional)
  - `:sort` - Sort order: "relevance", "new", "top" (default: "relevance")
  """
  @spec search_posts(String.t(), keyword()) :: {[Post.t()], map()}
  def search_posts(query_string, opts \\ []) do
    cursor = Keyword.get(opts, :cursor, nil)
    per_page = Keyword.get(opts, :per_page, 20)
    forum_id = Keyword.get(opts, :forum_id)
    sort = Keyword.get(opts, :sort, "relevance")
    search_term = "%#{query_string}%"

    query = from p in Post,
      where: ilike(p.title, ^search_term) or ilike(p.content, ^search_term),
      preload: [:author, :forum]

    query = if forum_id do
      from p in query, where: p.forum_id == ^forum_id
    else
      query
    end

    query = apply_sort(query, sort)

    # For relevance (unordered), add stable ordering for cursor pagination
    {query, cursor_sort} = if sort in ["new", "top"] do
      {query, sort}
    else
      {from(p in query, order_by: [desc: p.inserted_at]), "new"}
    end

    query = CursorPagination.apply_post_cursor(query, cursor, cursor_sort)

    {posts, has_next} = Pagination.fetch_page(query, per_page)

    meta = CursorPagination.build_cursor_meta(posts, has_next, per_page, cursor_sort, :post)
    {posts, meta}
  end

  defp apply_sort(query, "new"), do: from(p in query, order_by: [desc: p.inserted_at])
  defp apply_sort(query, "top"), do: from(p in query, order_by: [desc: p.score])
  defp apply_sort(query, _relevance), do: query
end
