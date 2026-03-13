defmodule CGraphWeb.API.V1.VoiceMessageController do
  @moduledoc """
  API controller for voice message operations.

  ## Endpoints

  - `POST /api/v1/voice-messages` - Upload a voice message
  - `GET /api/v1/voice-messages/:id` - Get voice message details
  - `DELETE /api/v1/voice-messages/:id` - Delete a voice message
  - `GET /api/v1/voice-messages/:id/waveform` - Get waveform data
  """

  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2]

  alias CGraph.Messaging.VoiceMessage
  alias CGraph.Repo
  alias CGraphWeb.ErrorHelpers

  action_fallback CGraphWeb.FallbackController

  plug :ensure_authenticated

  @doc """
  Upload a voice message.

  ## Request

  Content-Type: multipart/form-data

  - `audio` - Audio file (webm, m4a, mp3, ogg, wav)
  - `conversation_id` - (optional) Conversation to attach to
  - `channel_id` - (optional) Channel to attach to

  ## Response

      {
        "data": {
          "id": "uuid",
          "url": "/uploads/voice/uuid.opus",
          "duration": 15.5,
          "waveform": [0.1, 0.3, 0.8, ...],
          "content_type": "audio/opus"
        }
      }
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"audio" => upload} = params) do
    user = conn.assigns.current_user

    # Log upload struct for debugging
    require Logger
    Logger.debug("voice_message_upload_received", upload: inspect(upload))
    Logger.debug("upload_params", params: inspect(params))

    opts = [
      transcode: true,
      extract_waveform: true
    ]

    case VoiceMessage.process(user, upload, opts) do
      {:ok, voice_message} ->
        # If E2EE metadata provided, store encryption fields (E2EE-06)
        voice_message = maybe_store_encryption_metadata(voice_message, params)

        # If conversation or channel specified, create message with voice attachment
        voice_message = maybe_attach_to_message(voice_message, user, params)

        conn
        |> put_status(:created)
        |> render(:show, voice_message: voice_message)

      {:error, :unsupported_format} ->
        {:error, :unprocessable_entity, "Unsupported audio format"}

      {:error, :file_too_large} ->
        {:error, :payload_too_large, "Voice message too long (max 5 minutes)"}

      {:error, :invalid_upload} ->
        Logger.warning("invalid_upload_structure", upload: inspect(upload))
        {:error, :bad_request, "Invalid upload structure. Expected multipart file upload."}

      {:error, reason} ->
        Logger.error("voice_message_processing_failed", reason: inspect(reason))
        {:error, :internal_server_error, ErrorHelpers.safe_error_message(reason, context: "voice_message")}
    end
  end

  def create(_conn, _params) do
    {:error, :bad_request, "Missing required 'audio' parameter"}
  end

  @doc """
  Get voice message details.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Repo.get(VoiceMessage, id) do
      nil ->
        {:error, :not_found}

      voice_message ->
        if can_access?(user, voice_message) do
          render(conn, :show, voice_message: voice_message)
        else
          {:error, :forbidden}
        end
    end
  end

  @doc """
  Delete a voice message.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Repo.get(VoiceMessage, id) do
      nil ->
        {:error, :not_found}

      voice_message ->
        if voice_message.user_id == user.id do
          :ok = VoiceMessage.delete(voice_message)
          send_resp(conn, :no_content, "")
        else
          {:error, :forbidden}
        end
    end
  end

  @doc """
  Get waveform data for audio visualization.

  If the voice message has encrypted metadata (E2EE-06), returns the encrypted
  waveform data + IV + key so the client can decrypt locally.
  """
  @spec waveform(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def waveform(conn, %{"id" => id}) do
    user = conn.assigns.current_user

    case Repo.get(VoiceMessage, id) do
      nil ->
        {:error, :not_found}

      voice_message ->
        if can_access?(user, voice_message) do
          if voice_message.is_metadata_encrypted do
            render_data(conn, %{
              encrypted: true,
              encrypted_waveform: voice_message.encrypted_waveform,
              waveform_iv: voice_message.waveform_iv,
              encrypted_duration: voice_message.encrypted_duration,
              duration_iv: voice_message.duration_iv,
              metadata_encrypted_key: voice_message.metadata_encrypted_key
            })
          else
            render_data(conn, %{waveform: VoiceMessage.waveform(voice_message)})
          end
        else
          {:error, :forbidden}
        end
    end
  end

  # ============================================================================
  # Private Functions
  # ============================================================================

  defp ensure_authenticated(conn, _opts) do
    case conn.assigns[:current_user] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Authentication required"})
        |> halt()

      _user ->
        conn
    end
  end

  defp maybe_store_encryption_metadata(voice_message, params) do
    encryption_params = %{
      "encrypted_waveform" => params["encrypted_waveform"],
      "encrypted_duration" => params["encrypted_duration"],
      "waveform_iv" => params["waveform_iv"],
      "duration_iv" => params["duration_iv"],
      "metadata_encrypted_key" => params["metadata_encrypted_key"],
      "is_metadata_encrypted" => params["is_metadata_encrypted"]
    }

    if encryption_params["is_metadata_encrypted"] == true or encryption_params["is_metadata_encrypted"] == "true" do
      case voice_message
           |> VoiceMessage.changeset(encryption_params)
           |> Repo.update() do
        {:ok, updated} -> updated
        {:error, _} -> voice_message
      end
    else
      voice_message
    end
  end

  defp maybe_attach_to_message(voice_message, user, params) do
    conversation_id = params["conversation_id"]
    channel_id = params["channel_id"]

    cond do
      conversation_id ->
        create_voice_message_in_conversation(voice_message, user, conversation_id)

      channel_id ->
        create_voice_message_in_channel(voice_message, user, channel_id)

      true ->
        voice_message
    end
  end

  defp create_voice_message_in_conversation(voice_message, user, conversation_id) do
    alias CGraph.Messaging
    alias CGraph.Messaging.Conversation
    alias CGraphWeb.API.V1.MessageJSON

    case Repo.get(Conversation, conversation_id) do
      nil ->
        voice_message

      conversation ->
        message_attrs = %{
          "content" => "[Voice Message]",
          "content_type" => "voice",
          "file_url" => voice_message.url,
          "file_name" => voice_message.original_filename || "voice_message.opus",
          "file_size" => voice_message.size,
          "file_mime_type" => voice_message.content_type
        }

        case Messaging.send_message(conversation, user, message_attrs) do
          {:ok, message} ->
            # Update voice message with message reference
            updated_voice_message = voice_message
            |> Ecto.Changeset.change(message_id: message.id)
            |> Repo.update!()

            # Broadcast the new message to all channel subscribers (for real-time updates)
            serialized = MessageJSON.message_data(message)
            CGraphWeb.Endpoint.broadcast(
              "conversation:#{conversation_id}",
              "new_message",
              %{message: serialized}
            )

            updated_voice_message

          {:error, _} ->
            voice_message
        end
    end
  end

  defp create_voice_message_in_channel(voice_message, user, channel_id) do
    alias CGraph.Groups

    message_attrs = %{
      content: "[Voice Message]",
      content_type: "voice",
      sender_id: user.id,
      channel_id: channel_id,
      file_url: voice_message.url,
      file_name: voice_message.original_filename || "voice_message.opus",
      file_size: voice_message.size,
      file_mime_type: voice_message.content_type
    }

    case Groups.send_channel_message(channel_id, user.id, message_attrs) do
      {:ok, message} ->
        voice_message
        |> Ecto.Changeset.change(message_id: message.id)
        |> Repo.update!()

      {:error, _} ->
        voice_message
    end
  end

  defp can_access?(user, voice_message) do
    # Owner can always access
    if voice_message.user_id == user.id do
      true
    else
      # Check if user is participant in the conversation/channel
      case voice_message.message_id do
        nil -> false
        message_id -> can_access_message?(user, message_id)
      end
    end
  end

  defp can_access_message?(user, message_id) do
    alias CGraph.Messaging.Message
    import Ecto.Query

    case Repo.get(Message, message_id) do
      nil -> false
      message ->
        cond do
          message.conversation_id ->
            # Check conversation membership
            Repo.exists?(
              from cp in "conversation_participants",
              where: cp.conversation_id == ^message.conversation_id,
              where: cp.user_id == ^user.id
            )

          message.channel_id ->
            # Check channel/group membership
            Repo.exists?(
              from m in "group_members",
              join: c in "channels", on: c.group_id == m.group_id,
              where: c.id == ^message.channel_id,
              where: m.user_id == ^user.id
            )

          true ->
            false
        end
    end
  end
end
