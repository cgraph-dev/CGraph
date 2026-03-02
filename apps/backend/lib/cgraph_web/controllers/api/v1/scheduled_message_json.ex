defmodule CGraphWeb.API.V1.ScheduledMessageJSON do
  @moduledoc """
  JSON rendering for scheduled message responses.
  """

  @doc "Renders a list of scheduled messages."
  @spec index(map()) :: map()
  def index(%{messages: messages}) do
    %{data: Enum.map(messages, &message_data/1)}
  end

  @doc "Renders a single scheduled message."
  @spec show(map()) :: map()
  def show(%{message: message}) do
    %{data: message_data(message)}
  end

  @doc """
  Serialize a scheduled message to JSON.
  """
  @spec message_data(struct()) :: map()
  def message_data(message) do
    %{
      id: message.id,
      content: message.content,
      content_type: message.content_type,
      conversation_id: message.conversation_id,
      channel_id: message.channel_id,
      sender_id: message.sender_id,
      scheduled_at: message.scheduled_at,
      schedule_status: message.schedule_status,
      is_encrypted: message.is_encrypted,
      metadata: %{
        file_url: message.file_url,
        file_name: message.file_name,
        file_size: message.file_size,
        reply_to_id: message.reply_to_id
      },
      created_at: message.inserted_at,
      updated_at: message.updated_at
    }
  end
end
