defmodule CGraphWeb.ThreadChannel do
  @moduledoc """
  Channel for thread-level real-time updates.

  Handles:
  - New comments in real-time
  - Comment votes updates
  - Typing indicators
  - Thread vote updates
  - Presence tracking (who's viewing the thread)
  - Poll vote updates
  """
  use CGraphWeb, :channel

  alias CGraph.Forums
  alias CGraph.Presence

  # Rate limiting: max 5 messages per 10 seconds per user
  @rate_limit_window_ms 10_000
  @rate_limit_max_messages 5

  @impl true
  def join("thread:" <> thread_id, _params, socket) do
    user = socket.assigns.current_user

    case Forums.get_thread(thread_id) do
      {:ok, thread} ->
        case Forums.get_forum(thread.forum_id) do
          {:ok, forum} ->
            case Forums.authorize_action(user, forum, :view) do
              :ok ->
                socket = socket
                  |> assign(:thread_id, thread_id)
                  |> assign(:thread, thread)
                  |> assign(:forum, forum)
                  |> assign(:is_member, Forums.member?(forum.id, user.id))
                  |> assign(:rate_limit_messages, [])

                send(self(), :after_join)
                {:ok, socket}

              {:error, _reason} ->
                {:error, %{reason: "unauthorized"}}
            end

          {:error, :not_found} ->
            {:error, %{reason: "forum_not_found"}}
        end

      {:error, :not_found} ->
        {:error, %{reason: "not_found"}}
    end
  end

  @impl true
  def handle_info(:after_join, socket) do
    user = socket.assigns.current_user
    thread = socket.assigns.thread

    # Track presence in thread
    {:ok, _} = Presence.track(socket, user.id, %{
      user_id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      online_at: DateTime.utc_now(),
      typing: false
    })

    # Push current presence state
    push(socket, "presence_state", Presence.list(socket))

    # Push thread stats
    push(socket, "thread_stats", %{
      view_count: thread.view_count || 0,
      comment_count: thread.reply_count || 0,
      upvotes: thread.upvotes || 0,
      downvotes: thread.downvotes || 0,
      score: thread.score || 0,
      online_count: map_size(Presence.list(socket))
    })

    {:noreply, socket}
  end

  # ============================================================================
  # handle_in/3 Callbacks
  # ============================================================================

  @impl true
  def handle_in("typing", params, socket) do
    user = socket.assigns.current_user

    is_typing = case params do
      %{"typing" => val} -> val
      %{"is_typing" => val} -> val
      _ -> false
    end

    typing_started_at = if is_typing, do: DateTime.utc_now(), else: nil

    # Update presence with typing status
    Presence.update(socket, user.id, fn meta ->
      meta
      |> Map.put(:typing, is_typing)
      |> Map.put(:typing_started_at, typing_started_at)
    end)

    # Broadcast typing indicator
    broadcast_from!(socket, "typing", %{
      user_id: user.id,
      username: user.username,
      display_name: user.display_name,
      is_typing: is_typing,
      started_at: typing_started_at && DateTime.to_iso8601(typing_started_at)
    })

    {:noreply, socket}
  end

  @impl true
  def handle_in("vote", %{"value" => value}, socket) when value in [1, -1, 0] do
    user = socket.assigns.current_user
    thread = socket.assigns.thread
    forum = socket.assigns.forum

    # Check if user can vote
    case Forums.authorize_action(user, forum, :vote) do
      :ok ->
        case Forums.vote_thread(user.id, thread.id, value) do
          {:ok, _} ->
            # Get updated thread to broadcast
            {:ok, updated_thread} = Forums.get_thread(thread.id)
            
            # Broadcast vote update to all viewers
            broadcast!(socket, "vote_changed", %{
              thread_id: thread.id,
              upvotes: updated_thread.upvotes,
              downvotes: updated_thread.downvotes,
              score: updated_thread.score
            })

            {:reply, {:ok, %{
              upvotes: updated_thread.upvotes,
              downvotes: updated_thread.downvotes,
              score: updated_thread.score
            }}, socket}

          {:error, reason} ->
            {:reply, {:error, %{reason: inspect(reason)}}, socket}
        end

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("new_comment", %{"content" => content} = params, socket) do
    user = socket.assigns.current_user
    thread = socket.assigns.thread
    forum = socket.assigns.forum

    with {:ok, socket} <- check_rate_limit(socket),
         :ok <- Forums.authorize_action(user, forum, :comment) do
      attrs = %{
        content: content,
        thread_id: thread.id,
        author_id: user.id,
        parent_id: Map.get(params, "parent_id")
      }

      case Forums.create_thread_post(attrs) do
        {:ok, post} ->
          # Broadcast new comment to all viewers
          broadcast!(socket, "new_comment", %{
            comment: serialize_comment(post)
          })

          {:reply, {:ok, %{comment_id: post.id}}, socket}

        {:error, changeset} ->
          {:reply, {:error, %{errors: format_errors(changeset)}}, socket}
      end
    else
      {:error, :rate_limited, socket} ->
        {:reply, {:error, %{reason: "rate_limited", message: "Too many comments. Please slow down."}}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("vote_comment", %{"comment_id" => comment_id, "value" => value}, socket)
      when value in [1, -1, 0] do
    user = socket.assigns.current_user
    forum = socket.assigns.forum

    case Forums.authorize_action(user, forum, :vote) do
      :ok ->
        case Forums.vote_post_by_id(user.id, comment_id, value) do
          {:ok, _} ->
            # Get updated post to broadcast
            {:ok, updated_post} = Forums.get_thread_post(comment_id)
            
            # Broadcast comment vote update
            broadcast!(socket, "comment_vote_changed", %{
              comment_id: comment_id,
              upvotes: updated_post.upvotes || 0,
              downvotes: updated_post.downvotes || 0,
              score: updated_post.score || 0
            })

            {:reply, {:ok, %{
              upvotes: updated_post.upvotes || 0,
              downvotes: updated_post.downvotes || 0,
              score: updated_post.score || 0
            }}, socket}

          {:error, reason} ->
            {:reply, {:error, %{reason: inspect(reason)}}, socket}
        end

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("vote_poll", %{"option_id" => option_id}, socket) do
    user = socket.assigns.current_user
    thread = socket.assigns.thread

    case Forums.get_thread_poll(thread.id) do
      nil ->
        {:reply, {:error, %{reason: "no_poll"}}, socket}

      poll ->
        option_ids = if is_list(option_id), do: option_id, else: [option_id]
        
        case Forums.vote_poll(poll.id, user.id, option_ids) do
          {:ok, _vote} ->
            # Get updated poll to broadcast
            updated_poll = Forums.get_thread_poll(thread.id)
            
            # Broadcast poll update to all viewers
            broadcast!(socket, "poll_updated", %{
              thread_id: thread.id,
              poll: serialize_poll(updated_poll)
            })

            {:reply, {:ok, %{poll: serialize_poll(updated_poll)}}, socket}

          {:error, reason} ->
            {:reply, {:error, %{reason: inspect(reason)}}, socket}
        end
    end
  end

  @impl true
  def handle_in("get_viewers", _params, socket) do
    presence_list = Presence.list(socket)
    viewers = Enum.map(presence_list, fn {user_id, %{metas: [meta | _]}} ->
      %{
        user_id: user_id,
        username: meta.username,
        display_name: meta.display_name,
        avatar_url: meta.avatar_url,
        typing: meta[:typing] || false
      }
    end)

    {:reply, {:ok, %{viewers: viewers}}, socket}
  end

  # ============================================================================
  # Broadcasting Functions (called from Forums context)
  # ============================================================================

  @doc """
  Broadcast when a new comment is added to the thread.
  """
  def broadcast_new_comment(thread_id, comment) do
    CGraphWeb.Endpoint.broadcast("thread:#{thread_id}", "new_comment", %{
      comment: serialize_comment(comment)
    })
  end

  @doc """
  Broadcast when a comment is edited.
  """
  def broadcast_comment_edited(thread_id, comment) do
    CGraphWeb.Endpoint.broadcast("thread:#{thread_id}", "comment_edited", %{
      comment: serialize_comment(comment)
    })
  end

  @doc """
  Broadcast when a comment is deleted.
  """
  def broadcast_comment_deleted(thread_id, comment_id) do
    CGraphWeb.Endpoint.broadcast("thread:#{thread_id}", "comment_deleted", %{
      comment_id: comment_id
    })
  end

  @doc """
  Broadcast vote changes on the thread.
  """
  def broadcast_vote_changed(thread_id, upvotes, downvotes, score) do
    CGraphWeb.Endpoint.broadcast("thread:#{thread_id}", "vote_changed", %{
      thread_id: thread_id,
      upvotes: upvotes,
      downvotes: downvotes,
      score: score
    })
  end

  @doc """
  Broadcast when the thread is locked/unlocked.
  """
  def broadcast_thread_status_changed(thread_id, is_locked, is_pinned) do
    CGraphWeb.Endpoint.broadcast("thread:#{thread_id}", "thread_status_changed", %{
      thread_id: thread_id,
      is_locked: is_locked,
      is_pinned: is_pinned
    })
  end

  # ============================================================================
  # Private Helper Functions
  # ============================================================================

  defp serialize_comment(comment) do
    %{
      id: comment.id,
      content: comment.content,
      author_id: comment.author_id,
      author_username: comment.author && comment.author.username,
      author_display_name: comment.author && comment.author.display_name,
      author_avatar: comment.author && comment.author.avatar_url,
      parent_id: comment.parent_id,
      upvotes: comment.upvotes || 0,
      downvotes: comment.downvotes || 0,
      score: comment.score || 0,
      created_at: comment.inserted_at,
      updated_at: comment.updated_at
    }
  end

  defp serialize_poll(poll) do
    %{
      id: poll.id,
      question: poll.question,
      options: Enum.map(poll.options || [], fn opt ->
        %{
          id: opt.id,
          text: opt.text,
          vote_count: opt.vote_count || 0
        }
      end),
      total_votes: poll.total_votes || 0,
      ends_at: poll.ends_at
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end

  defp check_rate_limit(socket) do
    now = System.monotonic_time(:millisecond)
    window_start = now - @rate_limit_window_ms

    recent_messages = socket.assigns[:rate_limit_messages] || []
    recent_messages = Enum.filter(recent_messages, fn ts -> ts > window_start end)

    if length(recent_messages) >= @rate_limit_max_messages do
      {:error, :rate_limited, assign(socket, :rate_limit_messages, recent_messages)}
    else
      updated_messages = [now | recent_messages]
      {:ok, assign(socket, :rate_limit_messages, updated_messages)}
    end
  end
end
