defmodule CGraphWeb.ForumChannel do
  @moduledoc """
  Channel for forum-level real-time updates.

  Handles:
  - New thread notifications
  - Thread pinned/unpinned
  - Member join/leave events
  - Presence tracking (who's viewing the forum)
  - Forum stats updates
  """
  use CGraphWeb, :channel

  alias CGraph.Forums
  alias CGraph.Presence

  @impl true
  def join("forum:" <> forum_id, _params, socket) do
    user = socket.assigns.current_user

    case Forums.get_forum(forum_id) do
      {:ok, forum} ->
        # Check if user can view this forum
        case Forums.authorize_action(user, forum, :view) do
          :ok ->
            socket = socket
              |> assign(:forum_id, forum_id)
              |> assign(:forum, forum)
              |> assign(:is_member, Forums.member?(forum_id, user.id))

            send(self(), :after_join)
            {:ok, socket}

          {:error, _reason} ->
            {:error, %{reason: "unauthorized"}}
        end

      {:error, :not_found} ->
        {:error, %{reason: "not_found"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    user = socket.assigns.current_user
    forum_id = socket.assigns.forum_id

    # Track presence in forum
    {:ok, _} = Presence.track(socket, user.id, %{
      user_id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      online_at: DateTime.utc_now(),
      is_member: socket.assigns.is_member
    })

    # Push current presence state
    push(socket, "presence_state", Presence.list(socket))

    # Push forum stats
    push(socket, "forum_stats", %{
      member_count: socket.assigns.forum.member_count,
      post_count: socket.assigns.forum.post_count,
      thread_count: socket.assigns.forum.thread_count,
      online_count: map_size(Presence.list(socket))
    })

    {:noreply, socket}
  end

  # ============================================================================
  # handle_in/3 Callbacks
  # ============================================================================

  @impl true
  def handle_in("get_online_members", _params, socket) do
    presence_list = Presence.list(socket)
    online_members = Enum.map(presence_list, fn {user_id, %{metas: [meta | _]}} ->
      %{
        user_id: user_id,
        username: meta.username,
        display_name: meta.display_name,
        avatar_url: meta.avatar_url,
        online_at: meta.online_at
      }
    end)

    {:reply, {:ok, %{members: online_members}}, socket}
  end

  @impl true
  def handle_in("subscribe", _params, socket) do
    user = socket.assigns.current_user
    forum_id = socket.assigns.forum_id

    case Forums.subscribe_to_forum(user, %{id: forum_id}) do
      {:ok, _subscription} ->
        {:reply, {:ok, %{subscribed: true}}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("unsubscribe", _params, socket) do
    user = socket.assigns.current_user
    forum_id = socket.assigns.forum_id

    case Forums.unsubscribe_from_forum(user, %{id: forum_id}) do
      {:ok, _} ->
        {:reply, {:ok, %{subscribed: false}}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  # ============================================================================
  # Broadcasting Functions (called from Forums context)
  # ============================================================================

  @doc """
  Broadcast when a new thread is created in the forum.
  """
  def broadcast_new_thread(forum_id, thread) do
    CGraphWeb.Endpoint.broadcast("forum:#{forum_id}", "new_thread", %{
      thread: %{
        id: thread.id,
        title: thread.title,
        slug: thread.slug,
        author_id: thread.author_id,
        author_username: thread.author.username,
        author_avatar: thread.author.avatar_url,
        preview: String.slice(thread.body || "", 0, 200),
        created_at: thread.inserted_at,
        is_pinned: thread.is_pinned || false,
        is_locked: thread.is_locked || false
      }
    })
  end

  @doc """
  Broadcast when a thread is pinned or unpinned.
  """
  def broadcast_thread_pinned(forum_id, thread_id, is_pinned) do
    CGraphWeb.Endpoint.broadcast("forum:#{forum_id}", "thread_pinned", %{
      thread_id: thread_id,
      is_pinned: is_pinned
    })
  end

  @doc """
  Broadcast when a thread is locked or unlocked.
  """
  def broadcast_thread_locked(forum_id, thread_id, is_locked) do
    CGraphWeb.Endpoint.broadcast("forum:#{forum_id}", "thread_locked", %{
      thread_id: thread_id,
      is_locked: is_locked
    })
  end

  @doc """
  Broadcast when a thread is deleted.
  """
  def broadcast_thread_deleted(forum_id, thread_id) do
    CGraphWeb.Endpoint.broadcast("forum:#{forum_id}", "thread_deleted", %{
      thread_id: thread_id
    })
  end

  @doc """
  Broadcast when a new member joins the forum.
  """
  def broadcast_member_joined(forum_id, user) do
    CGraphWeb.Endpoint.broadcast("forum:#{forum_id}", "member_joined", %{
      user: %{
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url
      }
    })
  end

  @doc """
  Broadcast when a member leaves the forum.
  """
  def broadcast_member_left(forum_id, user_id) do
    CGraphWeb.Endpoint.broadcast("forum:#{forum_id}", "member_left", %{
      user_id: user_id
    })
  end

  @doc """
  Broadcast updated forum stats.
  """
  def broadcast_stats_update(forum_id, stats) do
    CGraphWeb.Endpoint.broadcast("forum:#{forum_id}", "stats_update", %{
      member_count: stats.member_count,
      post_count: stats.post_count,
      thread_count: stats.thread_count
    })
  end
end
