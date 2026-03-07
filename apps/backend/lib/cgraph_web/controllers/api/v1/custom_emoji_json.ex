defmodule CGraphWeb.API.V1.CustomEmojiJSON do
  @moduledoc "JSON rendering for Custom Emoji endpoints."

  @doc "Renders a list of resources as JSON."
  @spec index(map()) :: map()
  def index(%{emojis: emojis}) do
    %{data: Enum.map(emojis, &emoji_data/1), meta: %{total: length(emojis)}}
  end

  @doc "Renders a single resource as JSON."
  @spec show(map()) :: map()
  def show(%{emoji: emoji}) do
    %{data: emoji_data(emoji), meta: %{}}
  end

  @doc "Renders emoji categories as JSON."
  @spec categories(map()) :: map()
  def categories(%{categories: categories}) do
    %{data: categories, meta: %{}}
  end

  defp emoji_data(emoji) when is_map(emoji) do
    %{
      id: Map.get(emoji, :id),
      name: Map.get(emoji, :name),
      shortcode: Map.get(emoji, :shortcode),
      image_url: Map.get(emoji, :image_url),
      category: Map.get(emoji, :category),
      group_id: Map.get(emoji, :group_id),
      creator_id: Map.get(emoji, :creator_id),
      is_animated: Map.get(emoji, :is_animated, false),
      usage_count: Map.get(emoji, :usage_count, 0),
      lottie_url: Map.get(emoji, :lottie_url),
      animation_format: Map.get(emoji, :animation_format)
    }
  end
end
