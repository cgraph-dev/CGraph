defmodule CGraph.Messaging.Emoji do
  @moduledoc """
  Unicode emoji catalog with compile-time loaded dataset.

  Provides validation, search, categorization, and skin tone support
  for the full Unicode 16.0 emoji set (~228 base emojis).

  Emojis are loaded from `priv/data/emoji_unicode16.json` at compile time
  and stored in module attributes for O(1) validation lookups via MapSet.

  ## Usage

      iex> Emoji.valid_emoji?("😀")
      true

      iex> Emoji.search("heart", limit: 5)
      [%{emoji: "❤️", name: "red heart", ...}, ...]

      iex> Emoji.categories()
      ["Activities", "Animals & Nature", ...]
  """

  @external_resource Path.join(:code.priv_dir(:cgraph), "data/emoji_unicode16.json")

  @emoji_data Path.join(:code.priv_dir(:cgraph), "data/emoji_unicode16.json")
              |> File.read!()
              |> Jason.decode!()
              |> Enum.map(fn e ->
                %{
                  emoji: e["emoji"],
                  name: e["name"],
                  category: e["category"],
                  subcategory: e["subcategory"],
                  keywords: e["keywords"],
                  unicode_version: e["unicode_version"],
                  skin_tone_support: e["skin_tone_support"]
                }
              end)

  @emoji_set @emoji_data |> Enum.map(& &1.emoji) |> MapSet.new()

  @categories @emoji_data
              |> Enum.group_by(& &1.category)
              |> Enum.sort_by(fn {cat, _} -> cat end)
              |> Enum.map(fn {cat, emojis} -> {cat, emojis} end)

  @category_names @emoji_data
                  |> Enum.map(& &1.category)
                  |> Enum.uniq()
                  |> Enum.sort()

  # Fitzpatrick skin tone modifiers (U+1F3FB through U+1F3FF)
  @skin_tone_modifiers [
    "\u{1F3FB}",
    "\u{1F3FC}",
    "\u{1F3FD}",
    "\u{1F3FE}",
    "\u{1F3FF}"
  ]

  @skin_tone_set MapSet.new(@skin_tone_modifiers)

  @doc """
  Returns true if the given string is a valid Unicode emoji.

  Handles skin tone variants by stripping Fitzpatrick modifiers
  before checking against the known emoji set.

  ## Examples

      iex> Emoji.valid_emoji?("👍")
      true

      iex> Emoji.valid_emoji?("👍🏽")
      true

      iex> Emoji.valid_emoji?("notanemoji")
      false
  """
  @spec valid_emoji?(String.t()) :: boolean()
  def valid_emoji?(emoji) when is_binary(emoji) do
    base = strip_skin_tone(emoji)
    MapSet.member?(@emoji_set, base) or MapSet.member?(@emoji_set, emoji)
  end

  def valid_emoji?(_), do: false

  @doc """
  Search emojis by name or keyword.

  ## Options

    * `:category` - Filter by category name
    * `:limit` - Max results (default 50)

  ## Examples

      iex> Emoji.search("heart", limit: 3)
      [%{emoji: "❤️", name: "red heart", ...}, ...]

      iex> Emoji.search("dog", category: "Animals & Nature")
      [%{emoji: "🐶", name: "dog face", ...}]
  """
  @spec search(String.t(), keyword()) :: [map()]
  def search(query, opts \\ []) do
    category = Keyword.get(opts, :category)
    limit = Keyword.get(opts, :limit, 50)
    query_down = String.downcase(query)

    @emoji_data
    |> maybe_filter_category(category)
    |> Enum.filter(fn e ->
      String.contains?(String.downcase(e.name), query_down) or
        Enum.any?(e.keywords, &String.contains?(String.downcase(&1), query_down))
    end)
    |> Enum.take(limit)
  end

  @doc """
  List all emojis in a specific category.

  Returns an empty list if the category doesn't exist.

  ## Examples

      iex> Emoji.list_by_category("Flags")
      [%{emoji: "🏳️‍🌈", ...}, ...]
  """
  @spec list_by_category(String.t()) :: [map()]
  def list_by_category(category_name) do
    case Enum.find(@categories, fn {cat, _} -> cat == category_name end) do
      {_, emojis} -> emojis
      nil -> []
    end
  end

  @doc """
  Returns the list of emoji category names, sorted alphabetically.

  ## Examples

      iex> Emoji.categories()
      ["Activities", "Animals & Nature", "Flags", ...]
  """
  @spec categories() :: [String.t()]
  def categories, do: @category_names

  @doc """
  Returns all emojis grouped by category.

  ## Examples

      iex> Emoji.all()
      [{"Activities", [%{emoji: "⚽", ...}, ...]}, ...]
  """
  @spec all() :: [{String.t(), [map()]}]
  def all, do: @categories

  @doc """
  Returns Fitzpatrick skin tone variants for a given base emoji.

  Only returns variants if the emoji supports skin tones.
  Returns an empty list for emojis that don't support skin tones.

  ## Examples

      iex> Emoji.skin_tone_variants("👍")
      ["👍🏻", "👍🏼", "👍🏽", "👍🏾", "👍🏿"]

      iex> Emoji.skin_tone_variants("❤️")
      []
  """
  @spec skin_tone_variants(String.t()) :: [String.t()]
  def skin_tone_variants(emoji) do
    case Enum.find(@emoji_data, &(&1.emoji == emoji)) do
      %{skin_tone_support: true} ->
        Enum.map(@skin_tone_modifiers, &(emoji <> &1))

      _ ->
        []
    end
  end

  @doc """
  Returns the total count of emojis in the dataset.
  """
  @spec count() :: non_neg_integer()
  def count, do: MapSet.size(@emoji_set)

  @doc """
  Returns the list of skin tone modifier codepoints.
  """
  @spec skin_tone_modifiers() :: [String.t()]
  def skin_tone_modifiers, do: @skin_tone_modifiers

  # -- Private --

  defp strip_skin_tone(emoji) do
    emoji
    |> String.codepoints()
    |> Enum.reject(&MapSet.member?(@skin_tone_set, &1))
    |> Enum.join()
  end

  defp maybe_filter_category(emojis, nil), do: emojis

  defp maybe_filter_category(emojis, category) do
    Enum.filter(emojis, &(&1.category == category))
  end
end
