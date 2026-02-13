defmodule CGraph.Workers.NotificationWorker do
  @moduledoc """
  Oban worker for sending async notifications.

  Queues notification delivery (push, email, in-app) for background processing.
  """

  use Oban.Worker,
    queue: :notifications,
    max_attempts: 3,
    priority: 2

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    user_id = args["user_id"]
    type = args["type"]
    title = args["title"]
    body = args["body"]

    Logger.info("processing_notification",
      user_id: user_id,
      type: type,
      title: title
    )

    # Dispatch to appropriate notification channel
    case type do
      "event_ended" ->
        # Send push notification for event rewards
        send_push_notification(user_id, title, body, args["data"] || %{})

      _ ->
        send_push_notification(user_id, title, body, args["data"] || %{})
    end

    :ok
  end

  defp send_push_notification(user_id, title, body, data) do
    notification = %{title: title, body: body, data: data}

    case CGraph.Notifications.PushService.send_notification_to_user(
           user_id,
           notification
         ) do
      {:ok, result} ->
        Logger.debug("notification_sent", user_id: user_id, result: inspect(result))

      {:error, reason} ->
        Logger.warning("notification_failed", user_id: user_id, reason: inspect(reason))
    end
  end
end
