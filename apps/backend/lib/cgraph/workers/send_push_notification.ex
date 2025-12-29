defmodule Cgraph.Workers.SendPushNotification do
  @moduledoc """
  Oban worker for sending push notifications.
  
  Handles delivery of push notifications to mobile devices
  via Firebase Cloud Messaging or APNs.
  """
  use Oban.Worker,
    queue: :push_notifications,
    max_attempts: 3,
    priority: 1

  alias Cgraph.Repo
  alias Cgraph.Accounts.{User, PushToken}
  alias Cgraph.Notifications.Notification

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "notification_id" => notification_id}}) do
    with {:ok, user} <- get_user(user_id),
         {:ok, notification} <- get_notification(notification_id),
         {:ok, tokens} <- get_push_tokens(user) do
      
      Enum.each(tokens, fn token ->
        send_push(token, notification)
      end)
      
      :ok
    else
      {:error, :user_not_found} ->
        Logger.warning("Push notification failed: user #{user_id} not found")
        :ok  # Don't retry
        
      {:error, :notification_not_found} ->
        Logger.warning("Push notification failed: notification #{notification_id} not found")
        :ok  # Don't retry
        
      {:error, :no_tokens} ->
        Logger.debug("No push tokens for user #{user_id}")
        :ok  # Don't retry
        
      error ->
        Logger.error("Push notification failed: #{inspect(error)}")
        error
    end
  end

  defp get_user(user_id) do
    case Repo.get(User, user_id) do
      nil -> {:error, :user_not_found}
      user -> {:ok, user}
    end
  end

  defp get_notification(notification_id) do
    case Repo.get(Notification, notification_id) do
      nil -> {:error, :notification_not_found}
      notification -> {:ok, notification}
    end
  end

  defp get_push_tokens(user) do
    import Ecto.Query
    
    tokens = Repo.all(
      from pt in PushToken,
      where: pt.user_id == ^user.id and pt.is_active == true,
      select: pt
    )
    
    case tokens do
      [] -> {:error, :no_tokens}
      tokens -> {:ok, tokens}
    end
  end

  defp send_push(token, notification) do
    # TODO: Implement actual push notification sending
    # This would integrate with FCM/APNs
    Logger.info("Sending push notification to #{token.device_type}: #{notification.title}")
    
    # Placeholder for actual implementation
    case token.device_type do
      "ios" -> send_apns(token, notification)
      "android" -> send_fcm(token, notification)
      _ -> Logger.warning("Unknown device type: #{token.device_type}")
    end
  end

  defp send_apns(_token, _notification) do
    # TODO: Implement APNs push
    :ok
  end

  defp send_fcm(_token, _notification) do
    # TODO: Implement FCM push
    :ok
  end
end
