defmodule CGraph.Forums.Threads do
  @moduledoc """
  Thread operations for forums (MyBB-style boards).
  
  Handles thread creation, updates, pinning, locking, etc.
  """
  
  import Ecto.Query, warn: false
  alias CGraph.Repo
  alias CGraph.Forums.{Thread, ThreadPost}
  
  @doc """
  Lists threads for a forum or board.
  """
  def list_threads(forum_or_board, opts \\ []) do
    base_query = case forum_or_board do
      %{__struct__: CGraph.Forums.Forum} = forum ->
        from(t in Thread, where: t.forum_id == ^forum.id)
      %{__struct__: CGraph.Forums.Board} = board ->
        from(t in Thread, where: t.board_id == ^board.id)
      _ ->
        from(t in Thread)
    end
    
    base_query = base_query
    |> order_by([t], [desc: t.is_pinned])
    |> preload([:author, :last_poster])

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
  def get_thread(id) do
    case Repo.get(Thread, id) do
      nil -> {:error, :not_found}
      thread -> {:ok, Repo.preload(thread, [:author, :forum, :board])}
    end
  end
  
  @doc """
  Creates a new thread with initial post.
  """
  def create_thread(forum, user, attrs) do
    Repo.transaction(fn ->
      # Create thread
      thread_result =
        %Thread{}
        |> Thread.changeset(%{
          forum_id: forum.id,
          author_id: user.id,
          title: attrs["title"] || attrs[:title],
          board_id: attrs["board_id"] || attrs[:board_id]
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
              Repo.preload(thread, [:author, :posts])
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
  def update_thread(thread, attrs) do
    thread
    |> Thread.changeset(attrs)
    |> Repo.update()
  end
  
  @doc """
  Pins a thread.
  """
  def pin_thread(thread) do
    update_thread(thread, %{is_pinned: true})
  end
  
  @doc """
  Unpins a thread.
  """
  def unpin_thread(thread) do
    update_thread(thread, %{is_pinned: false})
  end
  
  @doc """
  Locks a thread.
  """
  def lock_thread(thread) do
    update_thread(thread, %{is_locked: true})
  end
  
  @doc """
  Unlocks a thread.
  """
  def unlock_thread(thread) do
    update_thread(thread, %{is_locked: false})
  end
  
  @doc """
  Increments view count.
  """
  def increment_views(thread) do
    from(t in Thread, where: t.id == ^thread.id)
    |> Repo.update_all(inc: [view_count: 1])
    :ok
  end
  
  # Thread posts
  
  @doc """
  Lists posts in a thread.
  """
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
        {:ok, Repo.preload(post, [:author])}
      error ->
        error
    end
  end
  
  defp update_thread_stats(thread) do
    from(t in Thread, where: t.id == ^thread.id)
    |> Repo.update_all(
      inc: [reply_count: 1],
      set: [last_post_at: DateTime.utc_now()]
    )
  end
end
