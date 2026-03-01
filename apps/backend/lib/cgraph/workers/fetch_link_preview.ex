defmodule CGraph.Workers.FetchLinkPreview do
  @moduledoc """
  Oban worker that fetches link preview metadata for a message.

  Triggered after message creation when URLs are detected in content.
  Fetches OG metadata for the first URL, updates the message's
  `link_preview` field, and broadcasts the update to connected clients.
  """
  use Oban.Worker,
    queue: :link_previews,
    max_attempts: 2,
    tags: ["link_preview"]

  alias CGraph.Messaging.{LinkPreviewService, Message}
  alias CGraph.Repo
  alias CGraphWeb.API.V1.MessageJSON

  require Logger

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"message_id" => message_id}}) do
    case Repo.get(Message, message_id) do
      nil ->
        Logger.warning("fetch_link_preview_message_not_found", message_id: message_id)
        :ok

      message ->
        process_message(message)
    end
  end

  defp process_message(message) do
    urls = LinkPreviewService.extract_urls(message.content)

    case urls do
      [] ->
        :ok

      [first_url | _] ->
        case LinkPreviewService.get_or_fetch(first_url) do
          {:ok, preview} ->
            update_and_broadcast(message, preview)

          {:error, reason} ->
            Logger.info("link_preview_skipped",
              message_id: message.id,
              url: first_url,
              reason: inspect(reason)
            )
            :ok
        end
    end
  end

  defp update_and_broadcast(message, preview) do
    changeset = Ecto.Changeset.change(message, link_preview: preview)

    case Repo.update(changeset) do
      {:ok, updated_message} ->
        broadcast_preview(updated_message, preview)
        :ok

      {:error, changeset} ->
        Logger.warning("link_preview_update_failed",
          message_id: message.id,
          error: inspect(changeset.errors)
        )
        {:error, :update_failed}
    end
  end

  defp broadcast_preview(message, preview) do
    topic = cond do
      message.conversation_id -> "conversation:#{message.conversation_id}"
      message.channel_id -> "channel:#{message.channel_id}"
      true -> nil
    end

    if topic do
      # Broadcast the full updated message so the client can replace it
      updated_message = Repo.preload(message, [[sender: :customization], :reactions, [reply_to: [sender: :customization]]])
      serialized = MessageJSON.message_data(updated_message)

      CGraphWeb.Endpoint.broadcast(topic, "link_preview_updated", %{
        message_id: message.id,
        link_preview: preview,
        message: serialized
      })
    end
  end
end
