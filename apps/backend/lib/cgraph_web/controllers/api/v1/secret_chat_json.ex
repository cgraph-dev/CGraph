defmodule CGraphWeb.API.V1.SecretChatJSON do
  @moduledoc """
  JSON rendering for secret chat resources.

  IMPORTANT: Never include `ciphertext` in REST responses.
  Encrypted message content is only exchanged through the real-time channel.
  """

  alias CGraph.Messaging.SecretConversation

  @doc "Renders a list of secret conversations."
  def index(%{conversations: conversations}) do
    %{secret_chats: Enum.map(conversations, &render_conversation/1)}
  end

  @doc "Renders a single secret conversation."
  def show(%{conversation: conversation}) do
    %{secret_chat: render_conversation(conversation)}
  end

  # ============================================================================
  # Private Renderers
  # ============================================================================

  defp render_conversation(%SecretConversation{} = convo) do
    %{
      id: convo.id,
      status: convo.status,
      self_destruct_seconds: convo.self_destruct_seconds,
      initiator: render_participant(convo.initiator),
      recipient: render_participant(convo.recipient),
      initiator_device_id: convo.initiator_device_id,
      recipient_device_id: convo.recipient_device_id,
      initiator_fingerprint: convo.initiator_fingerprint,
      recipient_fingerprint: convo.recipient_fingerprint,
      terminated_at: convo.terminated_at,
      created_at: convo.inserted_at,
      updated_at: convo.updated_at
    }
  end

  defp render_participant(%Ecto.Association.NotLoaded{}), do: nil
  defp render_participant(nil), do: nil

  defp render_participant(user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url
    }
  end
end
