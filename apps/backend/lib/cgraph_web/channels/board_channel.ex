defmodule CGraphWeb.BoardChannel do
  @moduledoc """
  Channel for board-level real-time updates.

  Handles:
  - New thread broadcasts
  - Thread updated/pinned/locked/deleted events
  - Presence tracking (who's viewing the board)
  """
  use CGraphWeb, :channel

  alias CGraph.Forums
  alias CGraph.Presence

  @impl true
  @spec join(String.t(), map(), Phoenix.Socket.t()) :: {:ok, Phoenix.Socket.t()} | {:error, map()}
  def join("board:" <> board_id, _params, socket) do
    _user = socket.assigns.current_user
    socket = assign(socket, :board_id, board_id)
    send(self(), :after_join)
    {:ok, socket}
  end

  @impl true
  @spec handle_info(term(), Phoenix.Socket.t()) :: {:noreply, Phoenix.Socket.t()}
  def handle_info(:after_join, socket) do
    user = socket.assigns.current_user

    {:ok, _} = Presence.track(socket, user.id, %{
      user_id: user.id,
      username: user.username,
      online_at: DateTime.utc_now()
    })

    push(socket, "presence_state", Presence.list(socket))
    {:noreply, socket}
  end

  # ============================================================================
  # handle_in/3 Callbacks
  # ============================================================================

  @impl true
  @spec handle_in(String.t(), map(), Phoenix.Socket.t()) :: {:reply, term(), Phoenix.Socket.t()}
  def handle_in("get_threads", params, socket) do
    board_id = socket.assigns.board_id
    opts = [sort: Map.get(params, "sort", "latest"), per_page: Map.get(params, "limit", 20)]
    result = Forums.Threads.list_threads(board_id, opts)
    {:reply, {:ok, result}, socket}
  end

  # ============================================================================
  # Broadcasting Functions (called from Forums context)
  # ============================================================================

  @doc """
  Broadcast when a new thread is created in the board.
  """
  @spec broadcast_new_thread(String.t(), map()) :: :ok | {:error, term()}
  def broadcast_new_thread(board_id, thread) do
    CGraphWeb.Endpoint.broadcast("board:#{board_id}", "new_thread", %{
      thread: thread_json(thread)
    })
  end

  @doc """
  Broadcast when a thread is updated in the board.
  """
  @spec broadcast_thread_updated(String.t(), map()) :: :ok | {:error, term()}
  def broadcast_thread_updated(board_id, thread) do
    CGraphWeb.Endpoint.broadcast("board:#{board_id}", "thread_updated", %{
      thread: thread_json(thread)
    })
  end

  @doc """
  Broadcast when a thread is deleted from the board.
  """
  @spec broadcast_thread_deleted(String.t(), String.t()) :: :ok | {:error, term()}
  def broadcast_thread_deleted(board_id, thread_id) do
    CGraphWeb.Endpoint.broadcast("board:#{board_id}", "thread_deleted", %{
      thread_id: thread_id
    })
  end

  @spec thread_json(map()) :: map()
  defp thread_json(thread) do
    %{
      id: thread.id,
      title: thread.title,
      slug: thread.slug,
      author_id: thread.author_id,
      inserted_at: thread.inserted_at,
      is_pinned: thread.is_pinned || false,
      is_locked: thread.is_locked || false
    }
  end
end
