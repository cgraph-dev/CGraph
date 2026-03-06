defmodule CGraphWeb.API.V1.EmojiController do
  @moduledoc """
  Controller for browsing the Unicode emoji catalog.

  Provides category listing, search, trending emojis (based on
  recent reaction usage), and per-category listing.
  """
  use CGraphWeb, :controller

  import Ecto.Query, warn: false

  alias CGraph.Messaging.Emoji
  alias CGraph.Messaging.Reaction
  alias CGraph.Repo

  @trending_cache_ttl :timer.hours(1)

  @doc """
  GET /api/v1/emojis
  Returns emoji categories with their emojis.
  """
  def categories(conn, _params) do
    data =
      Emoji.all()
      |> Enum.map(fn {category, emojis} ->
        %{
          category: category,
          emojis: Enum.map(emojis, &emoji_to_json/1)
        }
      end)

    json(conn, %{categories: data, total: Emoji.count()})
  end

  @doc """
  GET /api/v1/emojis/search?q=heart&category=Smileys&limit=20
  Search emojis by name or keyword with optional category filter.
  """
  def search(conn, params) do
    query = Map.get(params, "q", "")
    category = Map.get(params, "category")
    limit = params |> Map.get("limit", "50") |> parse_int(50) |> min(100)

    if String.length(query) < 1 do
      json(conn, %{results: [], query: query})
    else
      opts = [limit: limit]
      opts = if category, do: Keyword.put(opts, :category, category), else: opts

      results =
        query
        |> Emoji.search(opts)
        |> Enum.map(&emoji_to_json/1)

      json(conn, %{results: results, query: query, count: length(results)})
    end
  end

  @doc """
  GET /api/v1/emojis/trending
  Returns the most frequently used emojis as reactions in the last 7 days.
  Cached for 1 hour via Cachex.
  """
  def trending(conn, params) do
    limit = params |> Map.get("limit", "20") |> parse_int(20) |> min(50)

    trending =
      case Cachex.get(:cgraph_cache, "emoji:trending") do
        {:ok, nil} ->
          result = fetch_trending(limit)
          Cachex.put(:cgraph_cache, "emoji:trending", result, ttl: @trending_cache_ttl)
          result

        {:ok, cached} ->
          cached

        _ ->
          fetch_trending(limit)
      end

    json(conn, %{trending: trending})
  end

  @doc """
  GET /api/v1/emojis/category/:name
  Returns all emojis in a specific category.
  """
  def category(conn, %{"name" => name}) do
    # Categories use spaces in names - URL decoding handles %20
    decoded_name = URI.decode(name)

    emojis = Emoji.list_by_category(decoded_name)

    if emojis == [] do
      conn
      |> put_status(:not_found)
      |> json(%{error: "Category not found", available: Emoji.categories()})
    else
      json(conn, %{
        category: decoded_name,
        emojis: Enum.map(emojis, &emoji_to_json/1),
        count: length(emojis)
      })
    end
  end

  # -- Private --

  defp emoji_to_json(emoji) do
    %{
      emoji: emoji.emoji,
      name: emoji.name,
      category: emoji.category,
      subcategory: emoji.subcategory,
      keywords: emoji.keywords,
      unicode_version: emoji.unicode_version,
      skin_tone_support: emoji.skin_tone_support
    }
  end

  defp fetch_trending(limit) do
    seven_days_ago = DateTime.utc_now() |> DateTime.add(-7, :day)

    from(r in Reaction,
      where: r.inserted_at >= ^seven_days_ago,
      group_by: r.emoji,
      select: %{emoji: r.emoji, count: count(r.id)},
      order_by: [desc: count(r.id)],
      limit: ^limit
    )
    |> Repo.all()
    |> Enum.map(fn %{emoji: emoji_str, count: count} ->
      %{emoji: emoji_str, count: count}
    end)
  end

  defp parse_int(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {n, _} when n > 0 -> n
      _ -> default
    end
  end

  defp parse_int(val, _default) when is_integer(val) and val > 0, do: val
  defp parse_int(_, default), do: default
end
