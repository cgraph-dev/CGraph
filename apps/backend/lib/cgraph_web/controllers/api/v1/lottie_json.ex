defmodule CGraphWeb.API.V1.LottieJSON do
  @moduledoc "JSON rendering for Lottie animation endpoints."

  alias CGraph.Animations.LottieManifest

  @doc "Renders a paginated list of animated emojis."
  @spec index(map()) :: map()
  def index(%{emojis: emojis, total: total, page: page, per_page: per_page}) do
    %{
      data: Enum.map(emojis, &emoji_animation_data/1),
      meta: %{
        total: total,
        page: page,
        per_page: per_page,
        total_pages: ceil(total / max(per_page, 1))
      }
    }
  end

  @doc "Renders a single emoji animation."
  @spec show(map()) :: map()
  def show(%{emoji: emoji}) do
    %{data: emoji_animation_data(emoji)}
  end

  @doc "Renders search results."
  @spec search(map()) :: map()
  def search(%{results: results, query: query}) do
    %{
      data: Enum.map(results, &emoji_animation_data/1),
      meta: %{query: query, count: length(results)}
    }
  end

  @doc "Renders categories with animated emoji counts."
  @spec categories(map()) :: map()
  def categories(%{categories: categories}) do
    %{
      data: Enum.map(categories, fn {name, count} ->
        %{name: name, animated_count: count}
      end)
    }
  end

  @doc "Renders a single emoji animation by codepoint."
  @spec emoji_animation(map()) :: map()
  def emoji_animation(%{animation: animation}) do
    %{data: animation}
  end

  @doc "Renders a placeholder for future border/effect endpoints."
  @spec coming_soon(map()) :: map()
  def coming_soon(%{type: type}) do
    %{data: [], meta: %{message: "#{type} animations coming soon"}}
  end

  # ============================================================================
  # Private
  # ============================================================================

  defp emoji_animation_data(%{emoji: emoji, codepoint: codepoint} = data) do
    base = LottieManifest.cdn_base_url()

    %{
      codepoint: codepoint,
      emoji: emoji,
      name: Map.get(data, :name),
      category: Map.get(data, :category),
      subcategory: Map.get(data, :subcategory),
      keywords: Map.get(data, :keywords, []),
      animations: %{
        lottie: "#{base}/#{codepoint}/lottie.json",
        webp: "#{base}/#{codepoint}/512.webp",
        gif: "#{base}/#{codepoint}/512.gif"
      },
      has_animation: true
    }
  end

  defp emoji_animation_data(data) when is_map(data) do
    %{
      codepoint: Map.get(data, :codepoint),
      emoji: Map.get(data, :emoji),
      name: Map.get(data, :name),
      category: Map.get(data, :category),
      subcategory: Map.get(data, :subcategory),
      keywords: Map.get(data, :keywords, []),
      animations: nil,
      has_animation: false
    }
  end
end
