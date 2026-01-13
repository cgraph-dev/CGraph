defmodule CGraphWeb.API.SubscriptionController do
  @moduledoc """
  API controller for forum subscription management.
  """
  
  use CGraphWeb, :controller
  
  alias CGraph.Forums.SubscriptionService
  
  action_fallback CGraphWeb.FallbackController
  
  @doc """
  List all subscriptions for the current user.
  GET /api/forum/subscriptions
  """
  def index(conn, _params) do
    user = conn.assigns.current_user
    subscriptions = SubscriptionService.list_subscriptions(user.id)
    
    json(conn, %{
      subscriptions: Enum.map(subscriptions, &format_subscription/1)
    })
  end
  
  @doc """
  Create a new subscription.
  POST /api/forum/subscriptions
  """
  def create(conn, params) do
    user = conn.assigns.current_user
    
    result = 
      case params do
        %{"type" => "forum", "targetId" => id} ->
          SubscriptionService.subscribe_to_forum(user.id, id, build_opts(params))
          
        %{"type" => "board", "targetId" => id} ->
          SubscriptionService.subscribe_to_board(user.id, id, build_opts(params))
          
        %{"type" => "thread", "targetId" => id} ->
          SubscriptionService.subscribe_to_thread(user.id, id, build_opts(params))
          
        _ ->
          {:error, :invalid_type}
      end
    
    case result do
      {:ok, subscription} ->
        conn
        |> put_status(:created)
        |> json(%{subscription: format_subscription(subscription)})
        
      {:error, :invalid_type} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid subscription type"})
        
      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to create subscription", details: format_errors(changeset)})
    end
  end
  
  @doc """
  Update subscription settings.
  PATCH /api/forum/subscriptions/:id
  """
  def update(conn, %{"id" => id} = params) do
    user = conn.assigns.current_user
    
    # Verify ownership
    case verify_ownership(id, user.id) do
      {:ok, _} ->
        attrs = %{}
        |> maybe_put(:notification_mode, params["notificationMode"])
        |> maybe_put(:email_notifications, params["emailNotifications"])
        |> maybe_put(:push_notifications, params["pushNotifications"])
        |> maybe_put(:include_replies, params["includeReplies"])
        
        case SubscriptionService.update_subscription(id, attrs) do
          {:ok, subscription} ->
            json(conn, %{subscription: format_subscription(subscription)})
            
          {:error, :not_found} ->
            conn
            |> put_status(:not_found)
            |> json(%{error: "Subscription not found"})
            
          {:error, changeset} ->
            conn
            |> put_status(:unprocessable_entity)
            |> json(%{error: "Failed to update subscription", details: format_errors(changeset)})
        end
        
      {:error, :unauthorized} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Not authorized to update this subscription"})
    end
  end
  
  @doc """
  Delete a subscription.
  DELETE /api/forum/subscriptions/:id
  """
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
            conn
            |> put_status(:not_found)
            |> json(%{error: "Subscription not found"})
        end
        
      {:error, :unauthorized} ->
        conn
        |> put_status(:forbidden)
        |> json(%{error: "Not authorized to delete this subscription"})
    end
  end
  
  @doc """
  Bulk update all subscriptions.
  POST /api/forum/subscriptions/bulk-update
  """
  def bulk_update(conn, params) do
    user = conn.assigns.current_user
    subscriptions = SubscriptionService.list_subscriptions(user.id)
    
    attrs = %{}
    |> maybe_put(:notification_mode, params["notificationMode"])
    |> maybe_put(:email_notifications, params["emailNotifications"])
    |> maybe_put(:push_notifications, params["pushNotifications"])
    
    results = 
      Enum.map(subscriptions, fn sub ->
        SubscriptionService.update_subscription(sub.id, attrs)
      end)
    
    success_count = Enum.count(results, fn {status, _} -> status == :ok end)
    
    json(conn, %{
      success: true,
      updated_count: success_count,
      total_count: length(subscriptions)
    })
  end
  
  @doc """
  Toggle subscription for a thread.
  POST /api/forum/subscriptions/toggle-thread
  """
  def toggle_thread(conn, %{"threadId" => thread_id}) do
    user = conn.assigns.current_user
    
    case SubscriptionService.toggle_thread_subscription(user.id, thread_id) do
      {:ok, subscription} ->
        json(conn, %{
          subscribed: true,
          subscription: format_subscription(subscription)
        })
        
      {:ok, :deleted} ->
        json(conn, %{subscribed: false})
        
      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Failed to toggle subscription", reason: inspect(reason)})
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
      notificationMode: subscription.notification_mode,
      emailNotifications: subscription.email_notifications,
      pushNotifications: subscription.push_notifications,
      unreadCount: subscription.unread_count || 0,
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
      sub.thread && sub.thread.title -> sub.thread.title
      sub.board && sub.board.name -> sub.board.name
      sub.forum && sub.forum.name -> sub.forum.name
      true -> "Unknown"
    end
  end
  
  defp get_target_path(sub) do
    cond do
      sub.thread && sub.board && sub.forum ->
        "#{sub.forum.name} / #{sub.board.name}"
      sub.board && sub.forum ->
        sub.forum.name
      true ->
        nil
    end
  end
  
  defp build_opts(params) do
    [
      mode: params["notificationMode"] || "instant",
      email: params["emailNotifications"] != false,
      push: params["pushNotifications"] != false,
      include_replies: params["includeReplies"] != false
    ]
  end
  
  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
  
  defp verify_ownership(subscription_id, user_id) do
    alias CGraph.Repo
    alias CGraph.Forums.Subscription
    
    case Repo.get(Subscription, subscription_id) do
      nil -> {:error, :not_found}
      sub when sub.user_id == user_id -> {:ok, sub}
      _ -> {:error, :unauthorized}
    end
  end
  
  defp format_errors(%Ecto.Changeset{} = changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
  
  defp format_errors(_), do: %{}
end
