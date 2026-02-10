defmodule CGraph.Workers.ScheduledMessageWorker do
  @moduledoc """
  Oban worker for processing and sending scheduled messages.

  This worker runs periodically to check for messages that should be sent
  and broadcasts them via Phoenix channels to deliver them to users.

  ## Scheduling
  - Runs every minute (configurable via Oban cron)
  - Processes all messages where scheduled_at <= now()
  - Updates status from 'scheduled' to 'sent'

  ## Performance
  - Uses partial index for efficient queries
  - Batches messages to prevent timeouts
  - Broadcasts via PubSub for real-time delivery
  """
  use Oban.Worker,
    queue: :default,
    max_attempts: 3

  require Logger

  alias CGraph.{Repo, Messaging}
  alias CGraph.Messaging.Message
  alias CGraphWeb.Endpoint

  import Ecto.Query

  @doc """
  Process scheduled messages that are ready to be sent.

  Returns {:ok, count} where count is the number of messages sent.
  """
  @impl Oban.Worker
  def perform(%Oban.Job{}) do
    now = DateTime.utc_now()

    # Query messages that should be sent
    messages =
      Message
      |> where([m], m.schedule_status == "scheduled")
      |> where([m], not is_nil(m.scheduled_at))
      |> where([m], m.scheduled_at <= ^now)
      |> where([m], is_nil(m.deleted_at))
      |> preload([:sender, conversation: :participants])
      |> limit(100)
      |> Repo.all()

    count = length(messages)

    if count > 0 do
      Logger.info("processing_scheduled_messages", count: count)
    end

    # Send each message
    Enum.each(messages, fn message ->
      case send_scheduled_message(message) do
        {:ok, _} ->
          Logger.debug("sent_scheduled_message", message_id: message.id)

        {:error, reason} ->
          Logger.error("failed_to_send_scheduled_message", message_id: message.id, reason: inspect(reason))
      end
    end)

    {:ok, count}
  end

  @doc """
  Send a scheduled message by broadcasting it via Phoenix channels.
  """
  defp send_scheduled_message(message) do
    # Update message status to 'sent'
    case Repo.update(
           Message.changeset(message, %{schedule_status: "sent", inserted_at: DateTime.utc_now()})
         ) do
      {:ok, updated_message} ->
        # Broadcast the message via Phoenix channels
        broadcast_message(updated_message)
        {:ok, updated_message}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  Broadcast a scheduled message to the conversation channel.
  """
  defp broadcast_message(message) do
    # Prepare message payload
    payload = %{
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      content: message.content,
      message_type: message.content_type || "text",
      reply_to_id: message.reply_to_id,
      is_encrypted: message.is_encrypted || false,
      metadata: message.metadata || %{},
      created_at: message.inserted_at,
      sender: %{
        id: message.sender.id,
        username: message.sender.username,
        display_name: message.sender.display_name,
        avatar_url: message.sender.avatar_url
      }
    }

    # Broadcast to conversation channel
    Endpoint.broadcast(
      "conversation:#{message.conversation_id}",
      "new_message",
      payload
    )

    # Also broadcast to each participant's user channel
    if message.conversation do
      Enum.each(message.conversation.participants, fn participant ->
        Endpoint.broadcast("user:#{participant.user_id}", "new_message", payload)
      end)
    end

    :ok
  end
end
