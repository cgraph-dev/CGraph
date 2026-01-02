defmodule Cgraph.Workers.SendEmailNotification do
  @moduledoc """
  Oban worker for sending email notifications.
  
  Handles batched email delivery with configurable delays
  to prevent notification spam.
  
  This worker integrates with `Cgraph.Mailer` for actual email delivery
  and supports multiple email types with proper template rendering.
  
  ## Supported Email Types
  
  - `notification` - Regular notification emails (requires notification_id)
  - `verification` - Email verification emails (requires verification_token)
  - `password_reset` - Password reset emails (requires reset_token)
  - `welcome` - Welcome emails for new users
  - `security_alert` - Security-related notifications
  - `two_factor` - 2FA verification codes
  - `account_locked` - Account lockout notifications
  - `export_ready` - Data export download notifications
  
  ## Usage
  
      # Send verification email
      %{
        user_id: user.id,
        email_type: "verification",
        verification_token: token
      }
      |> Cgraph.Workers.SendEmailNotification.new()
      |> Oban.insert()
      
      # Send notification email
      %{
        user_id: user.id,
        notification_id: notification.id
      }
      |> Cgraph.Workers.SendEmailNotification.new()
      |> Oban.insert()
  
  ## Deduplication
  
  Emails are deduplicated within a 5-minute window to prevent spam.
  """
  use Oban.Worker,
    queue: :email_notifications,
    max_attempts: 5,
    priority: 2,
    unique: [period: 300, keys: [:user_id, :email_type]]  # Dedupe emails within 5 minutes

  alias Cgraph.Repo
  alias Cgraph.Accounts.User
  alias Cgraph.Notifications.Notification
  alias Cgraph.Mailer

  import Ecto.Query
  require Logger

  @impl Oban.Worker
  # Handle verification emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "email_type" => "verification"} = args}) do
    with {:ok, user} <- get_user(user_id) do
      token = Map.get(args, "verification_token", "")
      
      case Mailer.deliver_verification_email(user, token) do
        {:ok, _email} ->
          Logger.info("Verification email sent to user #{user_id}")
          :ok
          
        {:error, :no_email} ->
          Logger.debug("User #{user_id} has no email address")
          :ok  # Don't retry
          
        {:error, reason} ->
          Logger.error("Verification email failed: #{inspect(reason)}")
          {:error, reason}
      end
    else
      {:error, :user_not_found} ->
        Logger.warning("Email notification failed: user #{user_id} not found")
        :ok
    end
  end

  # Handle password reset emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "email_type" => "password_reset"} = args}) do
    with {:ok, user} <- get_user(user_id) do
      token = Map.get(args, "reset_token", "")
      
      case Mailer.deliver_password_reset_email(user, token) do
        {:ok, _email} ->
          Logger.info("Password reset email sent to user #{user_id}")
          :ok
          
        {:error, :no_email} ->
          Logger.debug("User #{user_id} has no email address")
          :ok
          
        {:error, reason} ->
          Logger.error("Password reset email failed: #{inspect(reason)}")
          {:error, reason}
      end
    else
      {:error, :user_not_found} ->
        Logger.warning("Password reset email failed: user #{user_id} not found")
        :ok
    end
  end
  
  # Handle welcome emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "email_type" => "welcome"}}) do
    with {:ok, user} <- get_user(user_id) do
      case Mailer.deliver_welcome_email(user) do
        {:ok, _email} ->
          Logger.info("Welcome email sent to user #{user_id}")
          :ok
          
        {:error, :no_email} ->
          Logger.debug("User #{user_id} has no email address")
          :ok
          
        {:error, reason} ->
          Logger.error("Welcome email failed: #{inspect(reason)}")
          {:error, reason}
      end
    else
      {:error, :user_not_found} ->
        Logger.warning("Welcome email failed: user #{user_id} not found")
        :ok
    end
  end
  
  # Handle security alert emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "email_type" => "security_alert"} = args}) do
    with {:ok, user} <- get_user(user_id) do
      alert_type = args["alert_type"] |> String.to_existing_atom()
      details = Map.get(args, "details", %{})
      
      case Mailer.deliver_security_alert(user, alert_type, details) do
        {:ok, _email} ->
          Logger.info("Security alert email sent to user #{user_id}")
          :ok
          
        {:error, :no_email} ->
          Logger.debug("User #{user_id} has no email address")
          :ok
          
        {:error, reason} ->
          Logger.error("Security alert email failed: #{inspect(reason)}")
          {:error, reason}
      end
    else
      {:error, :user_not_found} ->
        Logger.warning("Security alert email failed: user #{user_id} not found")
        :ok
    end
  rescue
    ArgumentError ->
      Logger.warning("Invalid alert_type: #{args["alert_type"]}")
      :ok
  end
  
  # Handle two-factor code emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "email_type" => "two_factor"} = args}) do
    with {:ok, user} <- get_user(user_id) do
      code = Map.get(args, "code", "")
      
      case Mailer.deliver_two_factor_email(user, code) do
        {:ok, _email} ->
          Logger.info("2FA code email sent to user #{user_id}")
          :ok
          
        {:error, :no_email} ->
          Logger.debug("User #{user_id} has no email address")
          :ok
          
        {:error, reason} ->
          Logger.error("2FA code email failed: #{inspect(reason)}")
          {:error, reason}
      end
    else
      {:error, :user_not_found} ->
        Logger.warning("2FA code email failed: user #{user_id} not found")
        :ok
    end
  end
  
  # Handle account locked emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "email_type" => "account_locked"} = args}) do
    with {:ok, user} <- get_user(user_id) do
      details = %{
        reason: Map.get(args, "reason", "Too many failed login attempts"),
        unlock_time: Map.get(args, "unlock_time")
      }
      
      case Mailer.deliver_account_locked_email(user, details) do
        {:ok, _email} ->
          Logger.info("Account locked email sent to user #{user_id}")
          :ok
          
        {:error, :no_email} ->
          Logger.debug("User #{user_id} has no email address")
          :ok
          
        {:error, reason} ->
          Logger.error("Account locked email failed: #{inspect(reason)}")
          {:error, reason}
      end
    else
      {:error, :user_not_found} ->
        Logger.warning("Account locked email failed: user #{user_id} not found")
        :ok
    end
  end
  
  # Handle export ready emails
  def perform(%Oban.Job{args: %{"user_id" => user_id, "email_type" => "export_ready"} = args}) do
    with {:ok, user} <- get_user(user_id) do
      download_url = Map.get(args, "download_url", "")
      
      case Mailer.deliver_export_ready_email(user, download_url) do
        {:ok, _email} ->
          Logger.info("Export ready email sent to user #{user_id}")
          :ok
          
        {:error, :no_email} ->
          Logger.debug("User #{user_id} has no email address")
          :ok
          
        {:error, reason} ->
          Logger.error("Export ready email failed: #{inspect(reason)}")
          {:error, reason}
      end
    else
      {:error, :user_not_found} ->
        Logger.warning("Export ready email failed: user #{user_id} not found")
        :ok
    end
  end

  # Handle regular notification emails (with notification_id)
  def perform(%Oban.Job{args: %{"user_id" => user_id, "notification_id" => notification_id}}) when not is_nil(notification_id) do
    with {:ok, user} <- get_user(user_id),
         {:ok, notification} <- get_notification(notification_id),
         :ok <- validate_email(user) do
      
      notification_data = %{
        title: notification.title,
        body: notification.body,
        action_url: build_action_url(notification),
        action_text: "View in CGraph"
      }
      
      case Mailer.deliver_notification_email(user, notification_data) do
        {:ok, _email} ->
          update_notification_email_status(notification_id, :sent)
          Logger.info("Notification email sent to user #{user_id}")
          :ok
          
        {:error, reason} ->
          update_notification_email_status(notification_id, :failed)
          Logger.error("Notification email failed: #{inspect(reason)}")
          {:error, reason}
      end
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
  
  # ============================================================================
  # Convenience Functions
  # ============================================================================
  
  @doc """
  Enqueues a verification email for a user.
  """
  @spec enqueue_verification(String.t(), String.t()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_verification(user_id, token) do
    %{user_id: user_id, email_type: "verification", verification_token: token}
    |> new()
    |> Oban.insert()
  end
  
  @doc """
  Enqueues a password reset email for a user.
  """
  @spec enqueue_password_reset(String.t(), String.t()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_password_reset(user_id, token) do
    %{user_id: user_id, email_type: "password_reset", reset_token: token}
    |> new(priority: 0)  # High priority
    |> Oban.insert()
  end
  
  @doc """
  Enqueues a welcome email for a new user.
  """
  @spec enqueue_welcome(String.t()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_welcome(user_id) do
    %{user_id: user_id, email_type: "welcome"}
    |> new()
    |> Oban.insert()
  end
  
  @doc """
  Enqueues a security alert email.
  """
  @spec enqueue_security_alert(String.t(), atom(), map()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_security_alert(user_id, alert_type, details \\ %{}) do
    %{
      user_id: user_id,
      email_type: "security_alert",
      alert_type: to_string(alert_type),
      details: details
    }
    |> new(priority: 0)  # High priority for security emails
    |> Oban.insert()
  end
  
  @doc """
  Enqueues a 2FA code email.
  """
  @spec enqueue_two_factor(String.t(), String.t()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_two_factor(user_id, code) do
    %{user_id: user_id, email_type: "two_factor", code: code}
    |> new(priority: 0)  # High priority
    |> Oban.insert()
  end
  
  @doc """
  Enqueues an account locked notification.
  """
  @spec enqueue_account_locked(String.t(), String.t(), DateTime.t() | nil) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_account_locked(user_id, reason, unlock_time \\ nil) do
    args = %{user_id: user_id, email_type: "account_locked", reason: reason}
    args = if unlock_time, do: Map.put(args, :unlock_time, DateTime.to_iso8601(unlock_time)), else: args
    
    args
    |> new(priority: 0)
    |> Oban.insert()
  end
  
  @doc """
  Enqueues a data export ready notification.
  """
  @spec enqueue_export_ready(String.t(), String.t()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_export_ready(user_id, download_url) do
    %{user_id: user_id, email_type: "export_ready", download_url: download_url}
    |> new()
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

  defp get_notification(notification_id) do
    case Repo.get(Notification, notification_id) do
      nil -> {:error, :notification_not_found}
      notification -> {:ok, notification}
    end
  end

  defp validate_email(user) do
    cond do
      is_nil(user.email) -> {:error, :no_email}
      user.email == "" -> {:error, :no_email}
      is_nil(user.email_verified_at) -> {:error, :email_not_verified}
      true -> :ok
    end
  end
  
  defp build_action_url(notification) do
    base_url = Application.get_env(:cgraph, :base_url, "https://cgraph.app")
    
    case notification.type do
      "message" -> "#{base_url}/messages/#{notification.reference_id}"
      "mention" -> "#{base_url}/posts/#{notification.reference_id}"
      "reply" -> "#{base_url}/posts/#{notification.reference_id}"
      "follow" -> "#{base_url}/profile/#{notification.actor_id}"
      "group_invite" -> "#{base_url}/groups/#{notification.reference_id}"
      _ -> base_url
    end
  end
  
  defp update_notification_email_status(notification_id, status) do
    now = DateTime.utc_now()
    
    status_field = case status do
      :sent -> [email_sent_at: now, email_status: "sent"]
      :failed -> [email_status: "failed"]
    end
    
    from(n in Notification, where: n.id == ^notification_id)
    |> Repo.update_all(set: status_field)
  rescue
    e ->
      Logger.warning("Failed to update notification email status: #{inspect(e)}")
  end
end
