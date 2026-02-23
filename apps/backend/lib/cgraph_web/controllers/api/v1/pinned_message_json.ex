defmodule CGraphWeb.API.V1.PinnedMessageJSON do
  @moduledoc """
  JSON rendering for pinned message responses.
  """
  alias CGraph.Groups.PinnedMessage

  @doc "Renders a list of resources as JSON."
  @spec index(map()) :: map()
  def index(%{pinned_messages: pinned_messages}) do
    %{data: Enum.map(pinned_messages, &pinned_message_data/1)}
  end

  @doc "Renders a single resource as JSON."
  @spec show(map()) :: map()
  def show(%{pinned_message: pinned_message}) do
    %{data: pinned_message_data(pinned_message)}
  end

  defp pinned_message_data(%PinnedMessage{} = pinned) do
    %{
      id: pinned.id,
      channel_id: pinned.channel_id,
      message_id: pinned.message_id,
      pinned_by_id: pinned.pinned_by_id,
      position: pinned.position,
      pinned_at: pinned.inserted_at
    }
  end
end
