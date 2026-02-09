defmodule CGraphWeb.API.V1.GroupEmojiJSON do
  @moduledoc """
  JSON rendering for group emoji responses.
  """
  alias CGraph.Groups.GroupEmoji

  def index(%{emojis: emojis}) do
    %{data: Enum.map(emojis, &emoji_data/1)}
  end

  def show(%{emoji: emoji}) do
    %{data: emoji_data(emoji)}
  end

  defp emoji_data(%GroupEmoji{} = emoji) do
    %{
      id: emoji.id,
      name: emoji.name,
      image_url: emoji.image_url,
      animated: emoji.animated,
      group_id: emoji.group_id,
      uploaded_by_id: emoji.uploaded_by_id,
      created_at: emoji.inserted_at
    }
  end
end
