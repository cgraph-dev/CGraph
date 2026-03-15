defmodule CGraph.Animations.LottieManifest do
  @moduledoc """
  Maps Unicode codepoints to Noto Emoji Animation CDN URLs.

  The Google Fonts CDN serves Lottie animations at:

      https://fonts.gstatic.com/s/e/notoemoji/latest/{codepoint}/lottie.json
      https://fonts.gstatic.com/s/e/notoemoji/latest/{codepoint}/512.webp
      https://fonts.gstatic.com/s/e/notoemoji/latest/{codepoint}/512.gif

  This module loads `priv/data/emoji_unicode16.json` at compile time and
  builds a map of all known emoji codepoints. Not every codepoint has a
  Lottie animation on the CDN — this module optimistically maps all known
  emojis. A future discovery script will refine which codepoints are
  actually animated.

  ## Usage

      iex> LottieManifest.get_url("1f600", :lottie)
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/lottie.json"

      iex> LottieManifest.emoji_to_codepoint("😀")
      "1f600"
  """

  @external_resource Path.join(:code.priv_dir(:cgraph), "data/emoji_unicode16.json")

  @emoji_data Path.join(:code.priv_dir(:cgraph), "data/emoji_unicode16.json")
              |> File.read!()
              |> Jason.decode!()

  # Build compile-time map: codepoint_hex => %{emoji, name, category, subcategory, keywords}
  @codepoint_map @emoji_data
                 |> Enum.map(fn e ->
                   emoji = e["emoji"]

                   codepoint =
                     emoji
                     |> String.codepoints()
                     |> Enum.reject(&(&1 == "\uFE0F"))
                     |> Enum.map_join("_", fn cp ->
                       <<code::utf8>> = cp
                       Integer.to_string(code, 16) |> String.downcase()
                     end)

                   {codepoint,
                    %{
                      emoji: emoji,
                      name: e["name"],
                      category: e["category"],
                      subcategory: e["subcategory"],
                      keywords: e["keywords"] || []
                    }}
                 end)
                 |> Map.new()

  # Reverse map: emoji string => codepoint hex
  @emoji_to_cp @codepoint_map
               |> Enum.map(fn {cp, %{emoji: emoji}} -> {emoji, cp} end)
               |> Map.new()

  @all_codepoints Map.keys(@codepoint_map)

  # ============================================================================
  # Public API
  # ============================================================================

  @doc """
  Returns the CDN URL for a given codepoint and format.

  ## Formats

    * `:lottie` — Lottie JSON animation (~37KB avg)
    * `:webp` — Static WebP fallback (512px)
    * `:gif` — Animated GIF fallback (512px)

  Returns `nil` if the codepoint is not in the manifest.
  """
  @spec get_url(String.t(), atom()) :: String.t() | nil
  def get_url(codepoint, format \\ :lottie) do
    if Map.has_key?(@codepoint_map, codepoint) do
      base = cdn_base_url()
      suffix = format_suffix(format)
      "#{base}/#{codepoint}/#{suffix}"
    end
  end

  @doc "Returns `true` if the codepoint has an entry in the animation manifest."
  @spec has_animation?(String.t()) :: boolean()
  def has_animation?(codepoint) do
    Map.has_key?(@codepoint_map, codepoint)
  end

  @doc "Returns all known animated codepoint hex strings."
  @spec all_animated_codepoints() :: [String.t()]
  def all_animated_codepoints, do: @all_codepoints

  @doc """
  Returns the configurable CDN base URL for Noto Emoji animations.

  Defaults to `https://fonts.gstatic.com/s/e/notoemoji/latest`.
  Override via `config :cgraph, :lottie_cdn_base_url`.
  """
  @spec cdn_base_url() :: String.t()
  def cdn_base_url do
    Application.get_env(
      :cgraph,
      :lottie_cdn_base_url,
      "https://fonts.gstatic.com/s/e/notoemoji/latest"
    )
  end

  @doc """
  Converts an emoji string to its hex codepoint representation.

  ## Examples

      iex> LottieManifest.emoji_to_codepoint("😀")
      "1f600"

      iex> LottieManifest.emoji_to_codepoint("unknown")
      nil
  """
  @spec emoji_to_codepoint(String.t()) :: String.t() | nil
  def emoji_to_codepoint(emoji) when is_binary(emoji) do
    Map.get(@emoji_to_cp, emoji) || compute_codepoint(emoji)
  end

  def emoji_to_codepoint(_), do: nil

  @doc """
  Converts a hex codepoint string to its emoji character.

  ## Examples

      iex> LottieManifest.codepoint_to_emoji("1f600")
      "😀"

      iex> LottieManifest.codepoint_to_emoji("zzz")
      nil
  """
  @spec codepoint_to_emoji(String.t()) :: String.t() | nil
  def codepoint_to_emoji(hex) when is_binary(hex) do
    case Map.get(@codepoint_map, hex) do
      %{emoji: emoji} -> emoji
      nil -> nil
    end
  end

  def codepoint_to_emoji(_), do: nil

  @doc """
  Enriches an emoji map with Lottie animation URLs.

  Adds `lottie_url`, `webp_url`, `gif_url`, and `has_animation` fields.
  If the emoji has no animation entry, URLs are set to `nil`.
  """
  @spec enrich_emoji(map()) :: map()
  def enrich_emoji(%{emoji: emoji} = emoji_map) when is_binary(emoji) do
    case emoji_to_codepoint(emoji) do
      nil ->
        Map.merge(emoji_map, %{
          lottie_url: nil,
          webp_url: nil,
          gif_url: nil,
          has_animation: false
        })

      codepoint ->
        Map.merge(emoji_map, %{
          codepoint: codepoint,
          lottie_url: get_url(codepoint, :lottie),
          webp_url: get_url(codepoint, :webp),
          gif_url: get_url(codepoint, :gif),
          has_animation: true
        })
    end
  end

  def enrich_emoji(emoji_map), do: Map.merge(emoji_map, %{lottie_url: nil, webp_url: nil, gif_url: nil, has_animation: false})

  @doc "Returns the full manifest map (codepoint => emoji metadata)."
  @spec manifest() :: map()
  def manifest, do: @codepoint_map

  # ============================================================================
  # Private
  # ============================================================================

  defp format_suffix(:lottie), do: "lottie.json"
  defp format_suffix(:webp), do: "512.webp"
  defp format_suffix(:gif), do: "512.gif"
  defp format_suffix(_), do: "lottie.json"

  # Compute codepoint for emoji strings not in the pre-built map
  # (e.g., skin tone variants)
  defp compute_codepoint(emoji) do
    parts =
      emoji
      |> String.codepoints()
      |> Enum.reject(&(&1 == "\uFE0F"))
      |> Enum.map(fn cp ->
        <<code::utf8>> = cp
        Integer.to_string(code, 16) |> String.downcase()
      end)

    case parts do
      [] -> nil
      _ ->
        cp = Enum.join(parts, "_")
        if Map.has_key?(@codepoint_map, cp), do: cp, else: nil
    end
  end
end
