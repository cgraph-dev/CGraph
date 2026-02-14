defmodule CGraph.Forums.Repositories.ThreadRepository do
  @moduledoc """
  Repository for Thread entity data access.
  """

  import Ecto.Query, warn: false, except: [update: 2]

  alias CGraph.Cache
  alias CGraph.Forums.Thread
  alias CGraph.Repo

  @cache_ttl :timer.minutes(5)

  @doc """
  Get a thread by ID.
  """
  @spec get(String.t(), list()) :: Thread.t() | nil
  def get(id, preloads \\ []) do
    cache_key = "thread:#{id}"

    Cache.fetch(cache_key, fn ->
      Thread |> Repo.get(id)
    end, ttl: @cache_ttl)
    |> maybe_preload(preloads)
  end

  @doc """
  Get a thread by ID, raising if not found.
  """
  @spec get!(String.t(), list()) :: Thread.t()
  def get!(id, preloads \\ []) do
    case get(id, preloads) do
      nil -> raise Ecto.NoResultsError, queryable: Thread
      thread -> thread
    end
  end

  @doc """
  List threads for a board with pagination and sorting.
  """
  @spec list_for_board(String.t(), keyword()) :: {list(Thread.t()), map()}
  def list_for_board(board_id, opts \\ []) do
    sort = Keyword.get(opts, :sort, :latest)
    include_sticky = Keyword.get(opts, :include_sticky, true)

    base_query =
      from t in Thread,
        where: t.board_id == ^board_id,
        where: is_nil(t.deleted_at),
        preload: [:author, :last_post_author]

    # Sticky threads always come first
    query =
      if include_sticky do
        sort_threads(base_query, sort, true)
      else
        base_query
        |> where([t], t.is_sticky == false)
        |> sort_threads(sort, false)
      end

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :desc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  List latest threads across all boards.
  """
  @spec list_latest(keyword()) :: list(Thread.t())
  def list_latest(opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    forum_id = Keyword.get(opts, :forum_id)

    base_query =
      from t in Thread,
        where: is_nil(t.deleted_at),
        order_by: [desc: t.last_post_at],
        limit: ^limit,
        preload: [:author, :board, :last_post_author]

    query =
      if forum_id do
        from t in base_query,
          join: b in assoc(t, :board),
          where: b.forum_id == ^forum_id
      else
        base_query
      end

    Repo.all(query)
  end

  @doc """
  Get hot/trending threads using hotness algorithm.
  """
  @spec list_hot(keyword()) :: list(Thread.t())
  def list_hot(opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    forum_id = Keyword.get(opts, :forum_id)
    time_window = Keyword.get(opts, :time_window, :week)

    since =
      case time_window do
        :day -> DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), -1, :day)
        :week -> DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), -7, :day)
        :month -> DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), -30, :day)
        _ -> DateTime.add(DateTime.truncate(DateTime.utc_now(), :second), -7, :day)
      end

    base_query =
      from t in Thread,
        where: is_nil(t.deleted_at),
        where: t.inserted_at > ^since,
        # Hotness score: views + (replies * 10) + (upvotes * 5)
        order_by: [desc: fragment("? + (? * 10) + (? * 5)", t.view_count, t.reply_count, t.upvote_count)],
        limit: ^limit,
        preload: [:author, :board]

    query =
      if forum_id do
        from t in base_query,
          join: b in assoc(t, :board),
          where: b.forum_id == ^forum_id
      else
        base_query
      end

    Repo.all(query)
  end

  @doc """
  Create a new thread.
  """
  @spec create(map()) :: {:ok, Thread.t()} | {:error, Ecto.Changeset.t()}
  def create(attrs) do
    result =
      %Thread{}
      |> Thread.changeset(attrs)
      |> Repo.insert()

    case result do
      {:ok, thread} ->
        {:ok, Repo.preload(thread, [:author, :board])}
      error ->
        error
    end
  end

  @doc """
  Update a thread.
  """
  @spec update(Thread.t(), map()) :: {:ok, Thread.t()} | {:error, Ecto.Changeset.t()}
  def update(%Thread{} = thread, attrs) do
    result =
      thread
      |> Thread.changeset(attrs)
      |> Repo.update()

    case result do
      {:ok, updated} ->
        Cache.delete("thread:#{updated.id}")
        {:ok, updated}
      error ->
        error
    end
  end

  @doc """
  Soft delete a thread.
  """
  @spec soft_delete(Thread.t()) :: {:ok, Thread.t()} | {:error, Ecto.Changeset.t()}
  def soft_delete(%Thread{} = thread) do
    update(thread, %{deleted_at: DateTime.truncate(DateTime.utc_now(), :second)})
  end

  @doc """
  Increment view count.
  """
  @spec increment_views(String.t()) :: :ok
  def increment_views(thread_id) do
    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(inc: [view_count: 1])

    Cache.delete("thread:#{thread_id}")
    :ok
  end

  @doc """
  Increment reply count.
  """
  @spec increment_replies(String.t()) :: :ok
  def increment_replies(thread_id) do
    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(inc: [reply_count: 1])

    Cache.delete("thread:#{thread_id}")
    :ok
  end

  @doc """
  Update last post info.
  """
  @spec update_last_post(String.t(), String.t(), DateTime.t()) :: :ok
  def update_last_post(thread_id, user_id, posted_at) do
    from(t in Thread, where: t.id == ^thread_id)
    |> Repo.update_all(set: [
      last_post_at: posted_at,
      last_post_author_id: user_id
    ])

    Cache.delete("thread:#{thread_id}")
    :ok
  end

  @doc """
  Search threads.
  """
  @spec search(String.t(), keyword()) :: list(Thread.t())
  def search(query, opts \\ []) do
    limit = Keyword.get(opts, :limit, 20)
    board_id = Keyword.get(opts, :board_id)
    search_query = "%#{query}%"

    base_query =
      from t in Thread,
        where: is_nil(t.deleted_at),
        where: ilike(t.title, ^search_query) or ilike(t.content, ^search_query),
        order_by: [desc: t.inserted_at],
        limit: ^limit,
        preload: [:author, :board]

    query =
      if board_id do
        from t in base_query, where: t.board_id == ^board_id
      else
        base_query
      end

    Repo.all(query)
  end

  # Private helpers

  defp sort_threads(query, sort, include_sticky) do
    base_order =
      case sort do
        :latest -> [desc: :last_post_at]
        :newest -> [desc: :inserted_at]
        :popular -> [desc: :reply_count]
        :views -> [desc: :view_count]
        _ -> [desc: :last_post_at]
      end

    order =
      if include_sticky do
        [{:desc, :is_sticky} | base_order]
      else
        base_order
      end

    from t in query, order_by: ^order
  end

  defp maybe_preload(nil, _), do: nil
  defp maybe_preload(record, []), do: record
  defp maybe_preload(record, preloads), do: Repo.preload(record, preloads)
end
