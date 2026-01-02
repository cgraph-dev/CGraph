defmodule CgraphWeb.API.V1.VoiceMessageController do
  @moduledoc """
  API controller for voice message operations.
  
  ## Endpoints
  
  - `POST /api/v1/voice-messages` - Upload a voice message
  - `GET /api/v1/voice-messages/:id` - Get voice message details
  - `DELETE /api/v1/voice-messages/:id` - Delete a voice message
  - `GET /api/v1/voice-messages/:id/waveform` - Get waveform data
  """
  
  use CgraphWeb, :controller
  
  alias Cgraph.Messaging.VoiceMessage
  alias Cgraph.Repo
  
  action_fallback CgraphWeb.FallbackController
  
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
  def create(conn, %{"audio" => upload} = params) do
    user = conn.assigns.current_user
    
    opts = [
      transcode: true,
      extract_waveform: true
    ]
    
    case VoiceMessage.process(user, upload, opts) do
      {:ok, voice_message} ->
        # If conversation or channel specified, create message with voice attachment
        voice_message = maybe_attach_to_message(voice_message, user, params)
        
        conn
        |> put_status(:created)
        |> render(:show, voice_message: voice_message)
      
      {:error, :unsupported_format} ->
        {:error, :unprocessable_entity, "Unsupported audio format"}
      
      {:error, :file_too_large} ->
        {:error, :payload_too_large, "Voice message too long (max 5 minutes)"}
      
      {:error, reason} ->
        {:error, :internal_server_error, "Failed to process voice message: #{inspect(reason)}"}
    end
  end
  
  @doc """
  Get voice message details.
  """
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
  """
  def waveform(conn, %{"id" => id}) do
    user = conn.assigns.current_user
    
    case Repo.get(VoiceMessage, id) do
      nil ->
        {:error, :not_found}
      
      voice_message ->
        if can_access?(user, voice_message) do
          json(conn, %{data: %{waveform: VoiceMessage.waveform(voice_message)}})
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
    alias Cgraph.Messaging
    alias Cgraph.Messaging.Conversation
    
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
            voice_message
            |> Ecto.Changeset.change(message_id: message.id)
            |> Repo.update!()
          
          {:error, _} ->
            voice_message
        end
    end
  end
  
  defp create_voice_message_in_channel(voice_message, user, channel_id) do
    alias Cgraph.Groups
    
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
    alias Cgraph.Messaging.Message
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
