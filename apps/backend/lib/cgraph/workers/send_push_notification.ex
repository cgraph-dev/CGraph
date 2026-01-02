defmodule Cgraph.Workers.SendPushNotification do
  @moduledoc """
  Oban worker for sending push notifications.
  
  Handles delivery of push notifications to mobile devices
  via Firebase Cloud Messaging, APNs, Expo, or Web Push.
  
  This worker is responsible for:
  - Fetching notification details from the database
  - Determining target devices for a user
  - Routing to appropriate push service based on platform
  - Handling delivery failures and retries
  - Updating notification delivery status
  
  ## Usage
  
  Enqueue a push notification job:
  
      %{
        user_id: user.id,
        notification_id: notification.id,
        # Optional overrides:
        title: "Custom Title",
        body: "Custom Body",
        data: %{action: "open_chat", conversation_id: "abc123"}
      }
      |> Cgraph.Workers.SendPushNotification.new()
      |> Oban.insert()
  
  ## Job Arguments
  
  - `user_id` (required) - The user to send notification to
  - `notification_id` (optional) - Notification record to use for content
  - `title` (optional) - Override notification title
  - `body` (optional) - Override notification body
  - `data` (optional) - Custom data payload
  - `priority` (optional) - "high" or "normal" (default: "high")
  - `collapse_key` (optional) - Key for notification collapsing
  - `badge` (optional) - Badge count for iOS
  - `sound` (optional) - Sound to play (default: "default")
  - `exclude_device_ids` (optional) - List of device IDs to skip
  """
  use Oban.Worker,
    queue: :push_notifications,
    max_attempts: 5,
    priority: 1,
    tags: ["push", "notification"]

  alias Cgraph.Repo
  alias Cgraph.Accounts.User
  alias Cgraph.Notifications.{Notification, PushService}

  import Ecto.Query
  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args, attempt: attempt}) do
    user_id = args["user_id"]
    notification_id = args["notification_id"]
    
    with {:ok, user} <- get_user(user_id),
         {:ok, notification_content} <- get_notification_content(notification_id, args) do
      
      # Build push notification payload
      push_notification = build_push_notification(notification_content, args)
      
      # Build options
      opts = build_opts(args)
      
      # Send via PushService (with fallback for test environment)
      result = send_via_push_service(user, push_notification, opts)
      
      case result do
        {:ok, %{sent: sent, failed: failed}} ->
          Logger.info(
            "Push notification sent",
            user_id: user_id,
            notification_id: notification_id,
            sent: sent,
            failed: failed
          )
          
          # Update notification delivery status if we have a notification record
          if notification_id do
            update_delivery_status(notification_id, sent, failed)
          end
          
          :ok
        
        :ok ->
          # Test environment or service not running
          Logger.debug("Push notification skipped (service not running)")
          :ok
          
        {:error, reason} when attempt < 5 ->
          Logger.warning(
            "Push notification failed, will retry",
            user_id: user_id,
            reason: inspect(reason),
            attempt: attempt
          )
          {:error, reason}
          
        {:error, reason} ->
          Logger.error(
            "Push notification failed permanently",
            user_id: user_id,
            reason: inspect(reason)
          )
          :ok  # Don't retry after max attempts
      end
    else
      {:error, :user_not_found} ->
        Logger.warning("Push notification skipped: user #{user_id} not found")
        :ok  # Don't retry
        
      {:error, :notification_not_found} ->
        Logger.warning("Push notification skipped: notification #{notification_id} not found")
        :ok  # Don't retry
        
      {:error, reason} ->
        Logger.error("Push notification preparation failed: #{inspect(reason)}")
        {:error, reason}
    end
  end
  
  # Send via PushService with graceful fallback for test environment
  defp send_via_push_service(user, push_notification, opts) do
    if push_service_running?() do
      PushService.send_notification(user, push_notification, opts)
    else
      # In test environment or when service is not running, skip silently
      :ok
    end
  end
  
  # Check if PushService GenServer is running
  defp push_service_running? do
    case Process.whereis(PushService) do
      nil -> false
      pid -> Process.alive?(pid)
    end
  end
  
  @doc """
  Creates a job for sending push notification to a user.
  
  This is a convenience function for common use cases.
  """
  @spec enqueue(String.t(), String.t(), String.t(), map()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue(user_id, title, body, data \\ %{}) do
    %{
      user_id: user_id,
      title: title,
      body: body,
      data: data
    }
    |> new()
    |> Oban.insert()
  end
  
  @doc """
  Creates a job for sending push notification from a notification record.
  """
  @spec enqueue_from_notification(String.t(), String.t()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_from_notification(user_id, notification_id) do
    %{
      user_id: user_id,
      notification_id: notification_id
    }
    |> new()
    |> Oban.insert()
  end
  
  @doc """
  Creates high-priority job for time-sensitive notifications (calls, urgent messages).
  """
  @spec enqueue_urgent(String.t(), String.t(), String.t(), map()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_urgent(user_id, title, body, data \\ %{}) do
    %{
      user_id: user_id,
      title: title,
      body: body,
      data: data,
      priority: "high"
    }
    |> new(priority: 0)  # Highest Oban priority
    |> Oban.insert()
  end
  
  # ============================================================================
  # Private Functions
  # ============================================================================

  defp get_user(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> {:ok, user}
    end
  end

  defp get_notification_content(nil, args) do
    # No notification_id provided, use args directly
    title = args["title"]
    body = args["body"]
    
    if title && body do
      {:ok, %{title: title, body: body}}
    else
      {:error, :missing_content}
    end
  end
  
  defp get_notification_content(notification_id, _args) do
    case Repo.get(Notification, notification_id) do
      nil -> {:error, :notification_not_found}
      notification -> {:ok, %{
        title: notification.title,
        body: notification.body,
        notification_type: notification.type
      }}
    end
  end
  
  defp build_push_notification(content, args) do
    %{
      title: args["title"] || content.title,
      body: args["body"] || content.body,
      data: build_data_payload(content, args),
      badge: args["badge"] || 1,
      sound: args["sound"] || "default",
      priority: priority_atom(args["priority"]),
      collapse_key: args["collapse_key"],
      thread_id: args["thread_id"],
      category: args["category"]
    }
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end
  
  defp build_data_payload(content, args) do
    base_data = %{
      "notification_type" => Map.get(content, :notification_type, "general"),
      "timestamp" => DateTime.utc_now() |> DateTime.to_iso8601()
    }
    
    custom_data = args["data"] || %{}
    
    Map.merge(base_data, stringify_keys(custom_data))
  end
  
  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn {k, v} -> {to_string(k), v} end)
  end
  defp stringify_keys(other), do: other
  
  defp build_opts(args) do
    opts = []
    
    opts = if exclude = args["exclude_device_ids"] do
      [{:exclude_device_ids, exclude} | opts]
    else
      opts
    end
    
    opts = if platforms = args["platforms"] do
      [{:platforms, platforms} | opts]
    else
      opts
    end
    
    opts
  end
  
  defp priority_atom("high"), do: :high
  defp priority_atom("normal"), do: :normal
  defp priority_atom("low"), do: :low
  defp priority_atom(_), do: :high
  
  defp update_delivery_status(notification_id, sent, failed) do
    now = DateTime.utc_now()
    
    status = cond do
      sent > 0 && failed == 0 -> "delivered"
      sent > 0 && failed > 0 -> "partial"
      true -> "failed"
    end
    
    from(n in Notification, where: n.id == ^notification_id)
    |> Repo.update_all(set: [
      push_delivered_at: now,
      push_delivery_status: status,
      push_sent_count: sent,
      push_failed_count: failed
    ])
  rescue
    # Don't fail the job if status update fails
    e ->
      Logger.warning("Failed to update delivery status: #{inspect(e)}")
  end
end
