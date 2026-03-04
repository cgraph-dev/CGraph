defmodule CGraphWeb.API.SubscriptionController do
  @moduledoc """
  API controller for forum subscription management.
  """

  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Forums.SubscriptionService
  alias CGraphWeb.Validation.SubscriptionParams
  alias CGraphWeb.ErrorHelpers

  action_fallback CGraphWeb.FallbackController

  @doc """
  List all subscriptions for the current user.
  GET /api/forum/subscriptions
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    user = conn.assigns.current_user
    subscriptions = SubscriptionService.list_subscriptions(user.id)

    render_data(conn, Enum.map(subscriptions, &format_subscription/1))
  end

  @doc """
  Create a new subscription.
  POST /api/forum/subscriptions
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, params) do
    user = conn.assigns.current_user
    normalized = normalize_create_params(params)

    with {:ok, validated} <- SubscriptionParams.validate_create(normalized),
         {:ok, subscription} <- do_create_subscription(user.id, validated) do
      conn
      |> put_status(:created)
      |> render_data(format_subscription(subscription))
    else
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Update subscription settings.
  PATCH /api/forum/subscriptions/:id
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user

    # Verify ownership
    case verify_ownership(id, user.id) do
      {:ok, _} ->
        normalized = normalize_update_params(params)

        with {:ok, attrs_struct} <- SubscriptionParams.validate_update(normalized),
             attrs <- to_update_attrs(attrs_struct),
             {:ok, subscription} <- SubscriptionService.update_subscription(id, attrs) do
          render_data(conn, format_subscription(subscription))
        else
          {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
          {:error, reason} -> {:error, reason}
        end

      {:error, :unauthorized} ->
        render_error(conn, :forbidden, "Not authorized to update this subscription")

      {:error, :not_found} ->
        render_error(conn, :not_found, "Subscription not found")
    end
  end

  @doc """
  Delete a subscription.
  DELETE /api/forum/subscriptions/:id
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case verify_ownership(id, user.id) do
      {:ok, _} ->
        case SubscriptionService.unsubscribe(id) do
          {:ok, _} ->
            conn
            |> put_status(:no_content)
            |> send_resp(204, "")

          {:error, :not_found} ->
            render_error(conn, :not_found, "Subscription not found")
        end

      {:error, :unauthorized} ->
        render_error(conn, :forbidden, "Not authorized to delete this subscription")

      {:error, :not_found} ->
        render_error(conn, :not_found, "Subscription not found")
    end
  end

  @doc """
  Bulk update all subscriptions.
  POST /api/forum/subscriptions/bulk-update
  """
  @spec bulk_update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def bulk_update(conn, params) do
    user = conn.assigns.current_user
    subscriptions = SubscriptionService.list_subscriptions(user.id)

    with {:ok, attrs_struct} <- SubscriptionParams.validate_bulk_update(normalize_update_params(params)),
         attrs <- to_update_attrs(attrs_struct) do
      results =
        Enum.map(subscriptions, fn sub ->
          SubscriptionService.update_subscription(sub.id, attrs)
        end)

      success_count = Enum.count(results, fn {status, _} -> status == :ok end)

      render_data(conn, %{
        success: true,
        updated_count: success_count,
        total_count: length(subscriptions)
      })
    else
      {:error, %Ecto.Changeset{} = changeset} -> {:error, changeset}
    end
  end

  @doc """
  Toggle subscription for a thread.
  POST /api/forum/subscriptions/toggle-thread
  """
  @spec toggle_thread(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def toggle_thread(conn, %{"threadId" => thread_id}) do
    user = conn.assigns.current_user

    case SubscriptionService.toggle_thread_subscription(user.id, thread_id) do
      {:ok, :deleted} ->
        render_data(conn, %{subscribed: false})

      {:ok, subscription} ->
        render_data(conn, %{
          subscribed: true,
          subscription: format_subscription(subscription)
        })

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to toggle subscription", reason: ErrorHelpers.safe_error_message(reason, context: "toggle_subscription")})
    end
  end

  # Private helpers

  defp format_subscription(subscription) do
    %{
      id: subscription.id,
      type: get_subscription_type(subscription),
      targetId: subscription.forum_id || subscription.board_id || subscription.thread_id,
      targetName: get_target_name(subscription),
      targetPath: get_target_path(subscription),
      notificationMode: Map.get(subscription, :notification_mode) || Map.get(subscription, :notification_level, "all"),
      emailNotifications: Map.get(subscription, :email_notifications, false),
      pushNotifications: Map.get(subscription, :push_notifications, false),
      unreadCount: Map.get(subscription, :unread_count, 0),
      createdAt: subscription.inserted_at
    }
  end

  defp get_subscription_type(sub) do
    cond do
      sub.thread_id -> "thread"
      sub.board_id -> "board"
      sub.forum_id -> "forum"
      true -> "unknown"
    end
  end

  defp get_target_name(sub) do
    cond do
      loaded?(sub, :thread) && sub.thread && sub.thread.title -> sub.thread.title
      loaded?(sub, :board) && sub.board && sub.board.name -> sub.board.name
      loaded?(sub, :forum) && sub.forum && sub.forum.name -> sub.forum.name
      true -> "Unknown"
    end
  end

  defp loaded?(struct, field) do
    case Map.get(struct, field) do
      %Ecto.Association.NotLoaded{} -> false
      _ -> true
    end
  end

  defp get_target_path(sub) do
    cond do
      loaded?(sub, :thread) && loaded?(sub, :board) && loaded?(sub, :forum) &&
        sub.thread && sub.board && sub.forum ->
        "#{sub.forum.name} / #{sub.board.name}"
      loaded?(sub, :board) && loaded?(sub, :forum) &&
        sub.board && sub.forum ->
        sub.forum.name
      true ->
        nil
    end
  end

  defp build_opts(params) do
    [
      mode: params.notification_mode || "instant",
      email: params.email_notifications != false,
      push: params.push_notifications != false,
      include_replies: params.include_replies != false
    ]
  end

  defp normalize_create_params(params) do
    %{
      "type" => params["type"],
      "target_id" => params["targetId"],
      "notification_mode" => params["notificationMode"],
      "email_notifications" => params["emailNotifications"],
      "push_notifications" => params["pushNotifications"],
      "include_replies" => params["includeReplies"]
    }
  end

  defp normalize_update_params(params) do
    %{
      "notification_mode" => params["notificationMode"],
      "email_notifications" => params["emailNotifications"],
      "push_notifications" => params["pushNotifications"],
      "include_replies" => params["includeReplies"]
    }
  end

  defp to_update_attrs(%SubscriptionParams{} = params) do
    params
    |> Map.from_struct()
    |> Map.drop([:__struct__, :type, :target_id])
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end

  defp do_create_subscription(user_id, %{type: "forum", target_id: id} = params) do
    SubscriptionService.subscribe_to_forum(user_id, id, build_opts(params))
  end

  defp do_create_subscription(user_id, %{type: "board", target_id: id} = params) do
    SubscriptionService.subscribe_to_board(user_id, id, build_opts(params))
  end

  defp do_create_subscription(user_id, %{type: "thread", target_id: id} = params) do
    SubscriptionService.subscribe_to_thread(user_id, id, build_opts(params))
  end

  defp verify_ownership(subscription_id, user_id) do
    alias CGraph.Forums.Subscription
    alias CGraph.Repo

    case Repo.get(Subscription, subscription_id) do
      nil -> {:error, :not_found}
      sub when sub.user_id == user_id -> {:ok, sub}
      _ -> {:error, :unauthorized}
    end
  end

  @doc false
  # Kept for future use when validation errors need formatting
  @spec format_changeset_errors(Ecto.Changeset.t() | term()) :: map()
  def format_changeset_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end

  def format_changeset_errors(_), do: %{}
end
