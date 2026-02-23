defmodule CGraphWeb.API.V1.ChannelJSON do
  @moduledoc """
  JSON rendering for channel responses.
  """
  alias CGraph.Groups.Channel

  @spec index(map()) :: map()
  def index(%{channels: channels}) do
    %{data: Enum.map(channels, &channel_data/1)}
  end

  @spec show(map()) :: map()
  def show(%{channel: channel}) do
    %{data: channel_data(channel)}
  end

  defp channel_data(%Channel{} = channel) do
    %{
      id: channel.id,
      name: channel.name,
      type: channel.channel_type,
      topic: channel.topic,
      position: channel.position,
      category_id: channel.category_id,
      nsfw: channel.is_nsfw || false,
      slowmode_seconds: channel.slow_mode_seconds,
      created_at: channel.inserted_at
    }
  end
end
