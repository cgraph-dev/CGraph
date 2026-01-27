defmodule CGraphWeb.API.V1.MessageController do
  @moduledoc """
  Controller for messages within conversations.
  """
  use CGraphWeb, :controller

  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Messaging
  alias CGraphWeb.API.V1.MessageJSON

  action_fallback CGraphWeb.FallbackController

  @max_per_page 100

  @doc """
  List messages in a conversation.
  """
  def index(conn, %{"conversation_id" => conversation_id} = params) do
    user = conn.assigns.current_user

    opts = [
      page: parse_int(params["page"], 1, min: 1),
      per_page: parse_int(params["per_page"], 50, min: 1, max: @max_per_page),
      before: Map.get(params, "before"),
      after: Map.get(params, "after")
    ]

    with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {messages, total} <- Messaging.list_messages(conversation, opts) do
      render(conn, :index,
        messages: messages,
        meta: %{page: opts[:page], per_page: opts[:per_page], total: total}
      )
    end
  end

  @doc """
  Send a message to a conversation.
  """
  def create(conn, %{"conversation_id" => conversation_id} = params) do
    user = conn.assigns.current_user

    # Extract E2EE metadata if present
    e2ee_metadata =
      if Map.get(params, "is_encrypted", false) do
        %{
          ephemeral_public_key: Map.get(params, "ephemeral_public_key"),
          nonce: Map.get(params, "nonce"),
          recipient_identity_key_id: Map.get(params, "recipient_identity_key_id"),
          one_time_prekey_id: Map.get(params, "one_time_prekey_id"),
          # Include sender's identity key for recipient to decrypt
          sender_identity_key: get_sender_identity_key(user.id)
        }
        |> Enum.reject(fn {_k, v} -> is_nil(v) end)
        |> Map.new()
      else
        %{}
      end

    # Merge E2EE metadata with any existing link_preview/metadata
    base_metadata = Map.get(params, "link_preview") || Map.get(params, "metadata") || %{}
    combined_metadata = if map_size(e2ee_metadata) > 0 do
      Map.merge(base_metadata, e2ee_metadata)
    else
      base_metadata
    end

    # Build message params, including file attachment fields and scheduling
    message_params = %{
      content: Map.get(params, "content"),
      content_type: Map.get(params, "content_type", "text"),
      attachments: Map.get(params, "attachments", []),
      reply_to_id: Map.get(params, "reply_to_id"),
      # File attachment fields
      file_url: Map.get(params, "file_url"),
      file_name: Map.get(params, "file_name"),
      file_size: Map.get(params, "file_size"),
      file_mime_type: Map.get(params, "file_mime_type"),
      thumbnail_url: Map.get(params, "thumbnail_url"),
      is_encrypted: Map.get(params, "is_encrypted", false),
      client_message_id: Map.get(params, "client_message_id"),
      # Combined metadata (E2EE + link previews, etc.)
      link_preview: combined_metadata,
      # Scheduling fields
      scheduled_at: parse_scheduled_at(params["scheduled_at"]),
      schedule_status: if(params["scheduled_at"], do: "scheduled", else: "immediate")
    }
    # Remove nil values to avoid overwriting with nils
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()

    with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, message} <- Messaging.send_message(conversation, user, message_params) do
      # Only broadcast immediate messages, not scheduled ones
      # Scheduled messages are broadcast by the ScheduledMessageWorker at send time
      if message.schedule_status == "immediate" do
        CGraphWeb.Endpoint.broadcast!(
          "conversation:#{conversation_id}",
          "new_message",
          %{message: MessageJSON.message_data(message)}
        )
      end

      conn
      |> put_status(:created)
      |> render(:show, message: message)
    end
  end

  # Get sender's identity key for E2EE messages
  defp get_sender_identity_key(user_id) do
    case CGraph.Crypto.E2EE.get_user_identity_key(user_id) do
      {:ok, key} -> key.public_key |> Base.encode64()
      _ -> nil
    end
  end

  @doc """
  Update (edit) a message.
  Only the sender can edit their own messages.
  """
  def update(conn, %{"conversation_id" => conversation_id, "id" => message_id} = params) do
    user = conn.assigns.current_user

    with {:ok, _conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, message} <- Messaging.edit_message(message_id, user.id, params["content"]) do
      # Broadcast the update via Phoenix Channels
      CGraphWeb.Endpoint.broadcast!(
        "conversation:#{conversation_id}",
        "message_updated",
        %{message: MessageJSON.message_data(message)}
      )

      render(conn, :show, message: message)
    end
  end

  @doc """
  Delete a message.
  Only the sender can delete their own messages.
  """
  def delete(conn, %{"conversation_id" => conversation_id, "id" => message_id}) do
    user = conn.assigns.current_user

    with {:ok, _conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, message} <- Messaging.delete_message(message_id, user.id) do
      # Broadcast the deletion via Phoenix Channels
      CGraphWeb.Endpoint.broadcast!(
        "conversation:#{conversation_id}",
        "message_deleted",
        %{message_id: message_id, deleted_by: user.id}
      )

      render(conn, :show, message: message)
    end
  end

  @doc """
  Pin a message in the conversation.
  """
  def pin(conn, %{"conversation_id" => conversation_id, "message_id" => message_id}) do
    user = conn.assigns.current_user

    with {:ok, _conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, message} <- Messaging.pin_message(message_id, user.id) do
      # Broadcast the pin via Phoenix Channels
      CGraphWeb.Endpoint.broadcast!(
        "conversation:#{conversation_id}",
        "message_pinned",
        %{message: MessageJSON.message_data(message)}
      )

      render(conn, :show, message: message)
    end
  end

  @doc """
  Unpin a message in the conversation.
  """
  def unpin(conn, %{"conversation_id" => conversation_id, "message_id" => message_id}) do
    user = conn.assigns.current_user

    with {:ok, _conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, message} <- Messaging.unpin_message(message_id, user.id) do
      # Broadcast the unpin via Phoenix Channels
      CGraphWeb.Endpoint.broadcast!(
        "conversation:#{conversation_id}",
        "message_unpinned",
        %{message_id: message_id}
      )

      render(conn, :show, message: message)
    end
  end

  @doc """
  Mark a message as read.
  """
  def mark_read(conn, %{"conversation_id" => conversation_id, "id" => message_id}) do
    user = conn.assigns.current_user

    with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {:ok, _receipt} <- Messaging.mark_message_read(conversation, user, message_id) do
      json(conn, %{status: "ok"})
    end
  end

  @doc """
  Send typing indicator.
  Verifies user is a participant in the conversation before broadcasting.
  """
  def typing(conn, %{"conversation_id" => conversation_id}) do
    user = conn.assigns.current_user

    # Verify user is a participant in this conversation
    with {:ok, _conversation} <- Messaging.get_user_conversation(user, conversation_id) do
      # Broadcast typing indicator only after authorization
      CGraphWeb.Endpoint.broadcast!(
        "conversation:#{conversation_id}",
        "typing",
        %{
          user_id: user.id,
          username: user.username
        }
      )

      json(conn, %{status: "ok"})
    end
  end

  @doc """
  List scheduled messages for a conversation.
  Returns all messages with schedule_status = 'scheduled'.
  """
  def list_scheduled(conn, %{"conversation_id" => conversation_id} = params) do
    user = conn.assigns.current_user

    opts = [
      page: parse_int(params["page"], 1, min: 1),
      per_page: parse_int(params["per_page"], 50, min: 1, max: @max_per_page)
    ]

    with {:ok, conversation} <- Messaging.get_user_conversation(user, conversation_id),
         {messages, total} <- Messaging.list_scheduled_messages(conversation, opts) do
      render(conn, :index,
        messages: messages,
        meta: %{page: opts[:page], per_page: opts[:per_page], total: total}
      )
    end
  end

  @doc """
  Reschedule a scheduled message.
  Only the sender can reschedule their own messages.
  """
  def reschedule(conn, %{"id" => message_id} = params) do
    user = conn.assigns.current_user

    with {:ok, message} <- Messaging.get_message(message_id),
         :ok <- authorize_message_owner(message, user),
         {:ok, scheduled_at} <- validate_scheduled_at(params["scheduled_at"]),
         {:ok, updated_message} <- Messaging.reschedule_message(message, scheduled_at) do
      render(conn, :show, message: updated_message)
    end
  end

  @doc """
  Cancel a scheduled message.
  Only the sender can cancel their own messages.
  """
  def cancel_schedule(conn, %{"id" => message_id}) do
    user = conn.assigns.current_user

    with {:ok, message} <- Messaging.get_message(message_id),
         :ok <- authorize_message_owner(message, user),
         {:ok, cancelled_message} <- Messaging.cancel_scheduled_message(message) do
      render(conn, :show, message: cancelled_message)
    end
  end

  # Private helper functions

  # Parse scheduled_at parameter and validate it's in the future
  defp parse_scheduled_at(nil), do: nil

  defp parse_scheduled_at(scheduled_at) when is_binary(scheduled_at) do
    case DateTime.from_iso8601(scheduled_at) do
      {:ok, datetime, _offset} ->
        if DateTime.compare(datetime, DateTime.utc_now()) == :gt do
          datetime
        else
          nil
        end

      _ ->
        nil
    end
  end

  defp parse_scheduled_at(_), do: nil

  # Validate scheduled_at for rescheduling
  defp validate_scheduled_at(nil), do: {:error, :missing_scheduled_at}

  defp validate_scheduled_at(scheduled_at) when is_binary(scheduled_at) do
    case DateTime.from_iso8601(scheduled_at) do
      {:ok, datetime, _offset} ->
        if DateTime.compare(datetime, DateTime.utc_now()) == :gt do
          {:ok, datetime}
        else
          {:error, :scheduled_at_must_be_future}
        end

      _ ->
        {:error, :invalid_datetime}
    end
  end

  defp validate_scheduled_at(_), do: {:error, :invalid_datetime}

  # Authorize that user is the message owner
  defp authorize_message_owner(message, user) do
    if message.sender_id == user.id do
      :ok
    else
      {:error, :unauthorized}
    end
  end
end
