defmodule Cgraph.Workers.SendEmailNotification do
  @moduledoc """
  Oban worker for sending email notifications.
  
  Handles batched email delivery with configurable delays
  to prevent notification spam.
  
  Supports different email types:
  - notification: Regular notification emails (requires notification_id)
  - verification: Email verification emails (requires verification_token)
  - password_reset: Password reset emails (requires reset_token)
  """
  use Oban.Worker,
    queue: :email_notifications,
    max_attempts: 5,
    priority: 2,
    unique: [period: 300, keys: [:user_id, :email_type]]  # Dedupe emails within 5 minutes

  alias Cgraph.Repo
  alias Cgraph.Accounts.User
  alias Cgraph.Notifications.Notification

  require Logger

  @impl Oban.Worker
  # Handle verification emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "email_type" => "verification"} = args}) do
    with {:ok, user} <- get_user(user_id),
         :ok <- check_email_exists(user) do
      token = Map.get(args, "verification_token", "")
      send_verification_email(user, token)
    else
      {:error, :user_not_found} ->
        Logger.warning("Email notification failed: user #{user_id} not found")
        :ok
        
      {:error, :no_email} ->
        Logger.debug("User #{user_id} has no email address")
        :ok
        
      error ->
        Logger.error("Verification email failed: #{inspect(error)}")
        error
    end
  end

  # Handle password reset emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "email_type" => "password_reset"} = args}) do
    with {:ok, user} <- get_user(user_id),
         :ok <- check_email_exists(user) do
      token = Map.get(args, "reset_token", "")
      send_password_reset_email(user, token)
    else
      {:error, :user_not_found} ->
        Logger.warning("Password reset email failed: user #{user_id} not found")
        :ok
        
      {:error, :no_email} ->
        Logger.debug("User #{user_id} has no email address")
        :ok
        
      error ->
        Logger.error("Password reset email failed: #{inspect(error)}")
        error
    end
  end

  # Handle regular notification emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "notification_id" => notification_id}}) when not is_nil(notification_id) do
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

  # Fallback for unknown email types
  def perform(%Oban.Job{args: args}) do
    Logger.warning("Unknown email notification type: #{inspect(args)}")
    :ok
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

  defp check_email_exists(user) do
    if is_nil(user.email), do: {:error, :no_email}, else: :ok
  end

  defp validate_email(user) do
    cond do
      is_nil(user.email) -> {:error, :no_email}
      is_nil(user.email_verified_at) -> {:error, :email_not_verified}
      true -> :ok
    end
  end

  defp send_verification_email(user, token) do
    Logger.info("Sending verification email to #{user.email} with token #{String.slice(token, 0, 8)}...")
    # TODO: Integrate with actual email provider (SendGrid, Mailgun, etc.)
    # For now, log the email details
    :ok
  end

  defp send_password_reset_email(user, token) do
    Logger.info("Sending password reset email to #{user.email} with token #{String.slice(token, 0, 8)}...")
    # TODO: Integrate with actual email provider
    :ok
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
