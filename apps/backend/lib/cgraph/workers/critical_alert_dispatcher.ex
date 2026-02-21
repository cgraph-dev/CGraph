defmodule CGraph.Workers.CriticalAlertDispatcher do
  @moduledoc """
  Background worker for dispatching critical moderation alerts.

  Handles multi-channel notification delivery for urgent moderation events
  such as CSAM reports, threats, and other critical safety issues.

  ## Alert Channels

  1. **Email** - Immediate email to on-call moderators
  2. **SMS** (if configured) - Text message for critical priority
  3. **Push Notifications** - Mobile app notifications to admin users
  4. **Webhook** (if configured) - External integrations (Slack, PagerDuty, etc.)

  ## Usage

      CGraph.Workers.CriticalAlertDispatcher.enqueue(%{
        type: :critical_moderation_alert,
        priority: :critical,
        report_id: "uuid",
        category: :csam,
        requires_immediate_action: true
      })

  ## Configuration

      config :cgraph, CGraph.Workers.CriticalAlertDispatcher,
        email_recipients: ["oncall@example.com"],
        sms_enabled: false,
        webhook_url: nil
  """

  use Oban.Worker,
    queue: :critical,
    priority: 0,
    max_attempts: 5,
    unique: [period: 60, fields: [:args]]

  require Logger

  alias CGraph.{Accounts, Notifications}
  alias CGraph.Workers.SendEmailNotification

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    Logger.warning("criticalalertdispatch", args: inspect(args))

    with :ok <- send_admin_emails(args),
         :ok <- send_push_notifications(args),
         :ok <- send_webhook_if_configured(args) do
      :ok
    else
      {:error, reason} ->
        Logger.error("critical_alert_dispatch_failed", reason: inspect(reason))
        {:error, reason}
    end
  end

  @doc """
  Enqueue a critical alert for dispatch.
  """
  def enqueue(alert_data) when is_map(alert_data) do
    %{alert: alert_data}
    |> __MODULE__.new()
    |> Oban.insert()
  end

  # Send email notifications to configured admin recipients
  defp send_admin_emails(args) do
    alert = Map.get(args, "alert", args)
    recipients = get_admin_email_recipients()

    if Enum.empty?(recipients) do
      Logger.info("No admin email recipients configured for critical alerts")
      :ok
    else
      subject = "[CRITICAL] Moderation Alert - #{alert["category"] || alert[:category]}"
      body = format_alert_email(alert)

      Enum.each(recipients, fn email ->
        # Queue email using Oban directly since we need custom subject/body
        %{
          to: email,
          subject: subject,
          body: body,
          template: "critical_alert",
          priority: :high
        }
        |> SendEmailNotification.new(priority: 0)
        |> Oban.insert()
      end)

      :ok
    end
  end

  # Send push notifications to all admin users
  defp send_push_notifications(args) do
    alert = Map.get(args, "alert", args)
    admin_users = Accounts.list_admin_users()

    Enum.each(admin_users, fn admin ->
      Notifications.notify(admin, :critical_moderation_alert,
        title: "🚨 Critical Moderation Alert",
        body: "A #{alert["category"] || alert[:category]} report requires immediate attention.",
        data: %{
          report_id: alert["report_id"] || alert[:report_id],
          priority: :critical
        }
      )
    end)

    :ok
  rescue
    e ->
      Logger.warning("failed_to_send_push_notifications", e: inspect(e))
      :ok  # Non-critical failure, continue with other channels
  end

  # Send webhook notification if configured (Slack, PagerDuty, etc.)
  defp send_webhook_if_configured(args) do
    case Application.get_env(:cgraph, __MODULE__, [])[:webhook_url] do
      nil -> :ok
      url when is_binary(url) ->
        alert = Map.get(args, "alert", args)
        payload = Jason.encode!(%{
          event: "critical_moderation_alert",
          alert: alert,
          timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
        })

        case :httpc.request(:post, {to_charlist(url), [], ~c"application/json", payload}, [], []) do
          {:ok, _} -> :ok
          {:error, reason} ->
            Logger.warning("webhook_delivery_failed", reason: inspect(reason))
            :ok  # Non-critical, don't fail the job
        end
    end
  end

  defp get_admin_email_recipients do
    Application.get_env(:cgraph, __MODULE__, [])
    |> Keyword.get(:email_recipients, [])
  end

  defp format_alert_email(alert) do
    """
    CRITICAL MODERATION ALERT
    =========================

    Report ID: #{alert["report_id"] || alert[:report_id]}
    Category: #{alert["category"] || alert[:category]}
    Priority: #{alert["priority"] || alert[:priority]}

    This report requires immediate attention and may involve illegal content.
    Please review in the admin dashboard immediately.

    Escalation Deadline: #{alert["escalation_deadline"] || "1 hour from now"}

    ---
    This is an automated alert from CGraph Moderation System.
    Do not reply to this email.
    """
  end
end
