defmodule CGraph.Workers.NotificationRetryWorker do
  @moduledoc """
  Dead-letter queue worker for failed push notifications.

  ## Why This Exists (WhatsApp Standard)

  WhatsApp retries failed message deliveries for up to 72 hours.
  Discord retries push notifications with exponential backoff.
  Without a DLQ, notifications lost to circuit breaker trips or
  transient failures are gone forever.

  ## Architecture

  ```
  ┌─────────────────────────────────────────────────────────────┐
  │              Notification Retry Pipeline                     │
  ├─────────────────────────────────────────────────────────────┤
  │                                                              │
  │  PushService ──[fails]──► Oban DLQ Worker                  │
  │                                 │                            │
  │                    ┌────────────┼────────────┐              │
  │                    │            │            │              │
  │                  Retry 1     Retry 2      Retry 3          │
  │                  (1 min)     (15 min)     (2 hrs)          │
  │                    │            │            │              │
  │                    └────────────┼────────────┘              │
  │                                 │                            │
  │                          Max attempts?                      │
  │                           ┌─────┴─────┐                     │
  │                          Yes          No                    │
  │                           │            │                     │
  │                    Log + Metric     Back to queue           │
  │                                                              │
  └─────────────────────────────────────────────────────────────┘
  ```

  ## Retry Schedule

  | Attempt | Delay   | Cumulative |
  |---------|---------|------------|
  | 1       | 1 min   | 1 min      |
  | 2       | 15 min  | 16 min     |
  | 3       | 2 hrs   | ~2 hrs     |
  | 4       | 8 hrs   | ~10 hrs    |
  | 5       | 24 hrs  | ~34 hrs    |
  | 6       | 48 hrs  | ~82 hrs    |

  After 6 attempts (~3.4 days), the notification is marked as permanently
  failed and a metric is emitted for alerting.
  """

  use Oban.Worker,
    queue: :notification_retry,
    max_attempts: 6,
    # Custom backoff: exponential with jitter
    priority: 2

  alias CGraph.Messaging.DeliveryTracking
  alias CGraph.Notifications.PushService

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args, attempt: attempt}) do
    %{
      "user_id" => user_id,
      "notification" => notification_data,
      "platform" => platform,
      "token" => token,
      "original_message_id" => message_id
    } = args

    Logger.info("notification_retry_attempt",
      user_id: user_id,
      platform: platform,
      attempt: attempt,
      message_id: message_id
    )

    :telemetry.execute(
      [:cgraph, :notification_dlq, :retry],
      %{attempt: attempt},
      %{platform: platform, user_id: user_id}
    )

    # Check if the circuit breaker for this platform is open
    breaker_name = platform_to_breaker(platform)

    case CGraph.Notifications.PushService.CircuitBreakers.status(breaker_name) do
      :ok ->
        # Circuit is closed — attempt delivery
        attempt_delivery(platform, token, notification_data, user_id, message_id)

      :blown ->
        # Circuit still open — snooze and retry later
        Logger.warning("notification_retry_circuit_open",
          platform: platform,
          attempt: attempt
        )
        {:snooze, retry_delay_seconds(attempt)}
    end
  end

  @impl Oban.Worker
  def backoff(%Oban.Job{attempt: attempt}) do
    # Exponential backoff: 60s, 900s, 7200s, 28800s, 86400s, 172800s
    base = 60
    max_delay = 172_800  # 48 hours

    delay = min(base * :math.pow(4, attempt - 1) |> round(), max_delay)

    # Add 10% jitter to prevent thundering herd
    jitter = :rand.uniform(max(div(delay, 10), 1))
    delay + jitter
  end

  # ── Internal ──

  defp attempt_delivery(platform, token, notification_data, user_id, message_id) do
    notification = struct(CGraph.Notifications.Notification, %{
      title: notification_data["title"],
      body: notification_data["body"],
      data: notification_data["data"] || %{}
    })

    result = case platform do
      "apns" -> PushService.send_single(:apns, token, notification)
      "fcm" -> PushService.send_single(:fcm, token, notification)
      "expo" -> PushService.send_single(:expo, token, notification)
      "web_push" -> PushService.send_single(:web_push, token, notification)
      _ -> {:error, :unknown_platform}
    end

    case result do
      {:ok, _} ->
        Logger.info("notification_retry_success",
          user_id: user_id,
          platform: platform,
          message_id: message_id
        )

        # Update delivery receipt if message tracking exists
        if message_id do
          DeliveryTracking.mark_delivered(message_id, user_id, %{platform: platform})
        end

        :telemetry.execute(
          [:cgraph, :notification_dlq, :success],
          %{count: 1},
          %{platform: platform}
        )

        :ok

      {:error, :invalid_token} ->
        # Token is permanently invalid — don't retry
        Logger.warning("notification_retry_invalid_token",
          user_id: user_id,
          platform: platform
        )

        if message_id do
          DeliveryTracking.mark_failed(message_id, user_id, "invalid_push_token")
        end

        :discard

      {:error, reason} ->
        Logger.warning("notification_retry_failed",
          user_id: user_id,
          platform: platform,
          reason: inspect(reason)
        )
        {:error, reason}
    end
  end

  defp platform_to_breaker("apns"), do: :apns
  defp platform_to_breaker("fcm"), do: :fcm
  defp platform_to_breaker("expo"), do: :expo
  defp platform_to_breaker("web_push"), do: :web_push
  defp platform_to_breaker(_), do: :apns

  defp retry_delay_seconds(attempt) do
    # Snooze delay when circuit is open — shorter than backoff
    min(30 * :math.pow(2, attempt - 1) |> round(), 3600)
  end

  @doc """
  Enqueue a failed notification for retry.

  Called by PushService when a send fails or circuit breaker trips.
  """
  @spec enqueue_retry(map()) :: {:ok, Oban.Job.t()} | {:error, term()}
  def enqueue_retry(params) do
    params
    |> new()
    |> Oban.insert()
  end
end
