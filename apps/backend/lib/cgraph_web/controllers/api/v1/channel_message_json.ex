defmodule CgraphWeb.API.V1.ChannelMessageJSON do
  @moduledoc """
  JSON rendering for channel message responses.
  Reuses MessageJSON for consistency.
  """

  def index(%{messages: messages, meta: meta}) do
    %{
      data: Enum.map(messages, &CgraphWeb.API.V1.MessageJSON.message_data/1),
      meta: meta
    }
  end

  def show(%{message: message}) do
    %{data: CgraphWeb.API.V1.MessageJSON.message_data(message)}
  end
end
