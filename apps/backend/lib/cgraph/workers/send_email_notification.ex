defmodule Cgraph.Workers.SendEmailNotification do
  @moduledoc """
  Oban worker for sending email notifications.
  
  Handles batched email delivery with configurable delays
  to prevent notification spam.
  """
  use Oban.Worker,
    queue: :email_notifications,
    max_attempts: 5,
    priority: 2,
    unique: [period: 300, keys: [:user_id]]  # Dedupe emails within 5 minutes

  alias Cgraph.Repo
  alias Cgraph.Accounts.User
  alias Cgraph.Notifications.Notification

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"user_id" => user_id, "notification_id" => notification_id}}) do
    with {:ok, user} <- get_user(user_id),
         {:ok, notification} <- get_notification(notification_id),
         :ok <- validate_email(user) do
      
      send_email(user, notification)
    else
      {:error, :user_not_found} ->
        Logger.warning("Email notification failed: user #{user_id} not found")
        :ok
        
      {:error, :notification_not_found} ->
        Logger.warning("Email notification failed: notification #{notification_id} not found")
        :ok
        
      {:error, :no_email} ->
        Logger.debug("User #{user_id} has no email address")
        :ok
        
      {:error, :email_not_verified} ->
        Logger.debug("User #{user_id} email not verified")
        :ok
        
      error ->
        Logger.error("Email notification failed: #{inspect(error)}")
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

  defp validate_email(user) do
    cond do
      is_nil(user.email) -> {:error, :no_email}
      is_nil(user.email_verified_at) -> {:error, :email_not_verified}
      true -> :ok
    end
  end

  defp send_email(user, notification) do
    # TODO: Implement actual email sending
    # This would integrate with an email service like SendGrid, SES, etc.
    Logger.info("Sending email notification to #{user.email}: #{notification.title}")
    
    # Placeholder for actual implementation
    # Cgraph.Mailer.deliver_notification_email(user, notification)
    
    :ok
  end
end
