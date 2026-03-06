defmodule CGraph.Workers.SendScheduledMessage do
  @moduledoc """
  Oban worker that delivers scheduled messages at their scheduled time.
  """
  use Oban.Worker, queue: :default, max_attempts: 3

  alias CGraph.Messaging
  alias CGraph.Messaging.ScheduledMessage
  alias CGraph.Repo

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"scheduled_message_id" => id}}) do
    case Repo.get(ScheduledMessage, id) do
      nil ->
        :ok

      %{status: "cancelled"} ->
        :ok

      %{status: "pending"} = scheduled ->
        now = DateTime.truncate(DateTime.utc_now(), :second)

        case Messaging.create_message(%{
          content: scheduled.content,
          sender_id: scheduled.sender_id,
          conversation_id: scheduled.conversation_id,
          content_type: scheduled.content_type,
          is_encrypted: scheduled.is_encrypted
        }) do
          {:ok, message} ->
            # Mark as sent
            scheduled
            |> Ecto.Changeset.change(%{status: "sent", sent_at: now})
            |> Repo.update()

            # Broadcast to conversation channel
            CGraphWeb.Endpoint.broadcast(
              "conversation:#{scheduled.conversation_id}",
              "new_message",
              %{message: CGraphWeb.API.V1.MessageJSON.message_data(
                Repo.preload(message, [[sender: :customization], :reactions, [reply_to: [sender: :customization]]])
              )}
            )

            :ok

          {:error, _reason} ->
            scheduled
            |> Ecto.Changeset.change(%{status: "failed"})
            |> Repo.update()

            {:error, "failed to send scheduled message"}
        end

      _ ->
        :ok
    end
  end
end
