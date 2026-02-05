defmodule CGraph.Forums.RSS do
  @moduledoc """
  RSS feed generation support for forums.
  
  Provides queries optimized for generating RSS/Atom feeds
  for threads, posts, and activity across forums.
  """

  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Forums.{Board, Forum, Thread, ThreadPost}

  @doc """
  List recent threads across an entire forum (all boards) with pagination.
  """
  def list_forum_threads_for_rss(forum_id, opts \\ []) do
    page = Keyword.get(opts, :page, 1)
    per_page = Keyword.get(opts, :per_page, 20)

    query = from t in Thread,
      join: b in Board, on: t.board_id == b.id,
      where: b.forum_id == ^forum_id and is_nil(t.deleted_at),
      order_by: [desc: t.inserted_at],
      preload: [:author, board: :forum]

    total = Repo.aggregate(query, :count, :id)

    threads = query
      |> limit(^per_page)
      |> offset(^((page - 1) * per_page))
      |> Repo.all()

    meta = %{page: page, per_page: per_page, total: total}
    {threads, meta}
  end

  @doc """
  List recent posts across an entire forum (all threads).
  """
  def list_recent_forum_posts(forum_id, opts \\ []) do
    limit_count = Keyword.get(opts, :limit, 20)

    from(tp in ThreadPost,
      join: t in Thread, on: tp.thread_id == t.id,
      join: b in Board, on: t.board_id == b.id,
      where: b.forum_id == ^forum_id and is_nil(tp.deleted_at),
      order_by: [desc: tp.created_at],
      limit: ^limit_count,
      preload: [:author, thread: [:author, board: :forum]]
    )
    |> Repo.all()
  end

  @doc """
  List global public activity across all forums.
  Combines threads and posts from public forums.
  """
  def list_global_public_activity(opts \\ []) do
    limit_count = Keyword.get(opts, :limit, 20)

    threads = from(t in Thread,
      join: b in Board, on: t.board_id == b.id,
      join: f in Forum, on: b.forum_id == f.id,
      where: f.is_public == true and is_nil(t.deleted_at),
      order_by: [desc: t.inserted_at],
      limit: ^limit_count,
      preload: [:author, board: [:forum]]
    )
    |> Repo.all()

    posts = from(tp in ThreadPost,
      join: t in Thread, on: tp.thread_id == t.id,
      join: b in Board, on: t.board_id == b.id,
      join: f in Forum, on: b.forum_id == f.id,
      where: f.is_public == true and is_nil(tp.deleted_at),
      order_by: [desc: tp.created_at],
      limit: ^limit_count,
      preload: [:author, thread: [:author, board: :forum]]
    )
    |> Repo.all()

    thread_items = Enum.map(threads, fn t ->
      %{
        type: :thread,
        title: t.title,
        link: "/threads/#{t.id}",
        description: truncate_for_feed(t.content || t.body || ""),
        author: get_author_name(t),
        pub_date: t.inserted_at,
        guid: "thread-#{t.id}",
        categories: [get_in(t, [Access.key(:board), Access.key(:name)]) || "Forum"],
        date: t.inserted_at
      }
    end)

    post_items = Enum.map(posts, fn p ->
      thread_title = get_in(p, [Access.key(:thread), Access.key(:title)]) || "Post"
      %{
        type: :post,
        title: "Re: #{thread_title}",
        link: "/threads/#{p.thread_id}#post-#{p.id}",
        description: truncate_for_feed(p.content || p.body || ""),
        author: get_author_name(p),
        pub_date: p.created_at || p.inserted_at,
        guid: "post-#{p.id}",
        categories: [],
        date: p.created_at || p.inserted_at
      }
    end)

    (thread_items ++ post_items)
    |> Enum.sort_by(& &1.date, {:desc, DateTime})
    |> Enum.take(limit_count)
  end

  @doc """
  List a user's public threads (from public forums).
  """
  def list_user_public_threads(user_id, opts \\ []) do
    limit_count = Keyword.get(opts, :limit, 20)

    from(t in Thread,
      join: b in Board, on: t.board_id == b.id,
      join: f in Forum, on: b.forum_id == f.id,
      where: t.author_id == ^user_id and f.is_public == true and is_nil(t.deleted_at),
      order_by: [desc: t.inserted_at],
      limit: ^limit_count,
      preload: [:author, board: [:forum]]
    )
    |> Repo.all()
  end

  @doc """
  List a user's public posts (from public forums).
  """
  def list_user_public_posts(user_id, opts \\ []) do
    limit_count = Keyword.get(opts, :limit, 20)

    from(tp in ThreadPost,
      join: t in Thread, on: tp.thread_id == t.id,
      join: b in Board, on: t.board_id == b.id,
      join: f in Forum, on: b.forum_id == f.id,
      where: tp.author_id == ^user_id and f.is_public == true and is_nil(tp.deleted_at),
      order_by: [desc: tp.created_at],
      limit: ^limit_count,
      preload: [:author, thread: [:author, board: :forum]]
    )
    |> Repo.all()
  end

  defp truncate_for_feed(content) when is_binary(content) do
    content
    |> String.slice(0, 500)
    |> then(fn text ->
      if String.length(content) > 500, do: text <> "...", else: text
    end)
  end
  defp truncate_for_feed(_), do: ""

  defp get_author_name(%{author: %{username: username}}) when not is_nil(username), do: username
  defp get_author_name(%{author: %{display_name: name}}) when not is_nil(name), do: name
  defp get_author_name(%{user: %{username: username}}) when not is_nil(username), do: username
  defp get_author_name(_), do: "Anonymous"
end
