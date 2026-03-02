defmodule CGraph.Forums.Threads do
  @moduledoc """
  Thread operations for forums (MyBB-style boards).

  Handles thread creation, updates, pinning, locking, etc.
  """

  import Ecto.Query, warn: false
  alias CGraph.Forums.{Thread, ThreadPost, PostIcon}
  alias CGraph.Forums.{Polls, PluginRuntime, ForumAutomod}
  alias CGraph.Repo

  @doc """
  Lists threads for a forum or board.
  """
  @spec list_threads(struct() | binary(), keyword()) :: CGraph.Pagination.paginated_result()
  def list_threads(forum_or_board, opts \\ []) do
    base_query = case forum_or_board do
      %{__struct__: CGraph.Forums.Forum} = forum ->
        from(t in Thread,
          join: b in CGraph.Forums.Board, on: b.id == t.board_id,
          where: b.forum_id == ^forum.id)
      %{__struct__: CGraph.Forums.Board} = board ->
        from(t in Thread, where: t.board_id == ^board.id)
      board_id when is_binary(board_id) ->
        from(t in Thread, where: t.board_id == ^board_id)
      _ ->
        from(t in Thread)
    end

    base_query = base_query
    |> order_by([t], [desc: t.is_pinned])
    |> preload([:author, :last_poster])

    # Normalize sort field names
    sort = case Keyword.get(opts, :sort) do
      "latest" -> "last_post_at"
      "newest" -> "inserted_at"
      "top" -> "score"
      "hot" -> "hot_score"
      "views" -> "view_count"
      other -> other
    end

    opts = Keyword.put(opts, :sort, sort)

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :last_post_at,
      sort_direction: :desc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(base_query, pagination_opts)
  end

  @doc """
  Gets a single thread.
  """
  @spec get_thread(binary()) :: {:ok, Thread.t()} | {:error, :not_found}
  def get_thread(id) do
    query = from(t in Thread, where: t.id == ^id, preload: [:author, :board])

    case Repo.one(query) do
      nil -> {:error, :not_found}
      thread -> {:ok, thread}
    end
  end

  @doc """
  Creates a new thread with initial post.
  """
  @spec create_thread(struct(), struct(), map()) :: {:ok, Thread.t()} | {:error, term()}
  def create_thread(_forum, user, attrs) do
    Repo.transaction(fn ->
      # Get or determine the board_id
      board_id = attrs["board_id"] || attrs[:board_id]
      content = attrs["content"] || attrs[:content] || ""
      title = attrs["title"] || attrs[:title] || ""

      # Automod pre-check (look up forum_id from board)
      board = if board_id, do: Repo.get(CGraph.Forums.Board, board_id)
      forum_id = if board, do: board.forum_id

      if forum_id do
        case ForumAutomod.check_content(forum_id, "#{title} #{content}") do
          {:block, reason} -> Repo.rollback({:automod_blocked, reason})
          _ -> :ok
        end
      end

      # Create thread
      thread_result =
        %Thread{}
        |> Thread.changeset(%{
          board_id: board_id,
          author_id: user.id,
          title: attrs["title"] || attrs[:title],
          content: attrs["content"] || attrs[:content],
          icon_id: attrs["post_icon_id"] || attrs[:post_icon_id] || attrs["icon_id"] || attrs[:icon_id]
        })
        |> Repo.insert()

      case thread_result do
        {:ok, thread} ->
          # Create first post
          post_attrs = %{
            thread_id: thread.id,
            author_id: user.id,
            content: attrs["content"] || attrs[:content],
            is_first_post: true
          }

          case create_post(thread, user, post_attrs) do
            {:ok, _post} ->
              # Create poll if poll data present
              maybe_create_poll(thread, attrs)
              loaded = Repo.preload(thread, [:author, :posts])

              # Broadcast to board channel
              if loaded.board_id do
                CGraphWeb.Endpoint.broadcast("board:#{loaded.board_id}", "new_thread", %{
                  thread: %{
                    id: loaded.id,
                    title: loaded.title,
                    slug: loaded.slug,
                    author_id: loaded.author_id,
                    inserted_at: loaded.inserted_at,
                    is_pinned: loaded.is_pinned || false,
                    is_locked: loaded.is_locked || false
                  }
                })
              end

              # Dispatch plugin hook (fire-and-forget)
              if loaded.board_id do
                board = CGraph.Repo.get(CGraph.Forums.Board, loaded.board_id)
                if board, do: PluginRuntime.dispatch(board.forum_id, :thread_created, %{thread_id: loaded.id, author_id: user.id, title: loaded.title})
              end

              loaded
            {:error, reason} ->
              Repo.rollback(reason)
          end

        {:error, changeset} ->
          Repo.rollback(changeset)
      end
    end)
  end

  @doc """
  Updates a thread.
  """
  @spec update_thread(Thread.t(), map()) :: {:ok, Thread.t()} | {:error, Ecto.Changeset.t()}
  def update_thread(thread, attrs) do
    thread
    |> Thread.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Pins a thread.
  """
  @spec pin_thread(Thread.t()) :: {:ok, Thread.t()} | {:error, Ecto.Changeset.t()}
  def pin_thread(thread) do
    update_thread(thread, %{is_pinned: true})
  end

  @doc """
  Unpins a thread.
  """
  @spec unpin_thread(Thread.t()) :: {:ok, Thread.t()} | {:error, Ecto.Changeset.t()}
  def unpin_thread(thread) do
    update_thread(thread, %{is_pinned: false})
  end

  @doc """
  Locks a thread.
  """
  @spec lock_thread(Thread.t()) :: {:ok, Thread.t()} | {:error, Ecto.Changeset.t()}
  def lock_thread(thread) do
    update_thread(thread, %{is_locked: true})
  end

  @doc """
  Unlocks a thread.
  """
  @spec unlock_thread(Thread.t()) :: {:ok, Thread.t()} | {:error, Ecto.Changeset.t()}
  def unlock_thread(thread) do
    update_thread(thread, %{is_locked: false})
  end

  @doc """
  Increments view count.
  """
  @spec increment_views(Thread.t()) :: :ok
  def increment_views(thread) do
    from(t in Thread, where: t.id == ^thread.id)
    |> Repo.update_all(inc: [view_count: 1])
    :ok
  end

  # Thread posts

  @doc """
  Lists posts in a thread.
  """
  @spec list_posts(Thread.t(), keyword()) :: CGraph.Pagination.paginated_result()
  def list_posts(thread, opts \\ []) do
    query = from(p in ThreadPost,
      where: p.thread_id == ^thread.id,
      preload: [:author]
    )

    pagination_opts = CGraph.Pagination.parse_params(
      Enum.into(opts, %{}),
      sort_field: :inserted_at,
      sort_direction: :asc,
      default_limit: 20
    )

    CGraph.Pagination.paginate(query, pagination_opts)
  end

  @doc """
  Creates a post in a thread.
  """
  @spec create_post(Thread.t(), struct(), map()) :: {:ok, ThreadPost.t()} | {:error, Ecto.Changeset.t()}
  def create_post(thread, user, attrs) do
    %ThreadPost{}
    |> ThreadPost.changeset(%{
      thread_id: thread.id,
      author_id: user.id,
      content: attrs[:content] || attrs["content"],
      is_first_post: attrs[:is_first_post] || false
    })
    |> Repo.insert()
    |> case do
      {:ok, post} ->
        update_thread_stats(thread)
        # Dispatch plugin hook for post creation (fire-and-forget)
        if thread.board_id do
          board = CGraph.Repo.get(CGraph.Forums.Board, thread.board_id)
          if board, do: PluginRuntime.dispatch(board.forum_id, :post_created, %{post_id: post.id, thread_id: thread.id, author_id: post.author_id})
        end
        {:ok, Repo.preload(post, [:author])}
      error ->
        error
    end
  end

  defp maybe_create_poll(thread, attrs) do
    poll_attrs = attrs["poll"] || attrs[:poll]

    case poll_attrs do
      nil -> :ok
      poll_data when is_map(poll_data) ->
        case Polls.create_thread_poll(thread.id, poll_data) do
          {:ok, _poll} -> :ok
          {:error, reason} -> Repo.rollback(reason)
        end
      _ -> :ok
    end
  end

  defp update_thread_stats(thread) do
    from(t in Thread, where: t.id == ^thread.id)
    |> Repo.update_all(
      inc: [reply_count: 1],
      set: [last_post_at: DateTime.truncate(DateTime.utc_now(), :second)]
    )
  end

  @doc """
  List post icons available for a specific board.
  """
  @spec list_post_icons(binary()) :: [PostIcon.t()]
  def list_post_icons(board_id) do
    board = Repo.get(CGraph.Forums.Board, board_id)
    if board, do: PostIcon.available_for_board(board.forum_id, board_id), else: []
  end
end
