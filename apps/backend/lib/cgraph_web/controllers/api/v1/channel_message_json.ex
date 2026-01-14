defmodule CGraphWeb.API.V1.ChannelMessageJSON do
  @moduledoc """
  JSON rendering for channel message responses.
  Reuses MessageJSON for consistency.
  """

  alias CGraphWeb.API.V1.MessageJSON

  def index(%{messages: messages, meta: meta}) do
    %{
      data: Enum.map(messages, &MessageJSON.message_data/1),
      meta: meta
    }
  end

  def show(%{message: message}) do
    %{data: MessageJSON.message_data(message)}
  end
end
