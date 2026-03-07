defmodule CGraphWeb.API.V1.LottieController do
  @moduledoc """
  REST controller for the Lottie animation catalog.

  Serves emoji animation metadata with CDN URLs for Lottie JSON,
  WebP, and GIF formats. Endpoints are public (no auth required)
  since animation metadata is not sensitive.

  Responses include `Cache-Control: public, max-age=86400` for
  CDN-friendly caching.
  """
  use CGraphWeb, :controller

  alias CGraph.Animations.{LottieManifest, LottieCache}

  plug :put_cache_header

  @doc """
  GET /api/v1/animations/emojis

  List all animated emojis with Lottie CDN URLs.
  Supports pagination via `page` and `per_page` params.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    page = params |> Map.get("page", "1") |> parse_int(1)
    per_page = params |> Map.get("per_page", "50") |> parse_int(50) |> min(200)

    manifest = LottieManifest.manifest()
    all_entries = manifest_to_sorted_list(manifest)
    total = length(all_entries)

    emojis =
      all_entries
      |> Enum.drop((page - 1) * per_page)
      |> Enum.take(per_page)

    render(conn, :index, emojis: emojis, total: total, page: page, per_page: per_page)
  end

  @doc """
  GET /api/v1/animations/emojis/search?q=smile

  Search animated emojis by name or keyword.
  """
  @spec search(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def search(conn, params) do
    query = Map.get(params, "q", "")
    limit = params |> Map.get("limit", "50") |> parse_int(50) |> min(200)

    if String.length(query) < 1 do
      render(conn, :search, results: [], query: query)
    else
      query_down = String.downcase(query)

      results =
        LottieManifest.manifest()
        |> manifest_to_sorted_list()
        |> Enum.filter(fn entry ->
          String.contains?(String.downcase(entry.name), query_down) or
            Enum.any?(entry.keywords, &String.contains?(String.downcase(&1), query_down))
        end)
        |> Enum.take(limit)

      render(conn, :search, results: results, query: query)
    end
  end

  @doc """
  GET /api/v1/animations/emojis/:codepoint

  Get a specific emoji's animation metadata by codepoint hex.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"codepoint" => codepoint}) do
    animation =
      LottieCache.get_or_fetch(codepoint, fn ->
        build_animation_data(codepoint)
      end)

    case animation do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Animation not found for codepoint: #{codepoint}"})

      data ->
        render(conn, :emoji_animation, animation: data)
    end
  end

  @doc """
  GET /api/v1/animations/categories

  List categories with counts of animated emojis.
  """
  @spec categories(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def categories(conn, _params) do
    categories =
      LottieManifest.manifest()
      |> Enum.group_by(fn {_cp, data} -> data.category end)
      |> Enum.map(fn {cat, entries} -> {cat, length(entries)} end)
      |> Enum.sort_by(fn {cat, _} -> cat end)

    render(conn, :categories, categories: categories)
  end

  @doc """
  GET /api/v1/animations/borders

  Placeholder for future Lottie-based avatar borders.
  """
  @spec borders(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def borders(conn, _params) do
    render(conn, :coming_soon, type: "Border")
  end

  @doc """
  GET /api/v1/animations/effects

  Placeholder for future Lottie-based chat effects.
  """
  @spec effects(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def effects(conn, _params) do
    render(conn, :coming_soon, type: "Effect")
  end

  # ============================================================================
  # Private
  # ============================================================================

  defp put_cache_header(conn, _opts) do
    put_resp_header(conn, "cache-control", "public, max-age=86400")
  end

  defp manifest_to_sorted_list(manifest) do
    manifest
    |> Enum.map(fn {codepoint, data} ->
      Map.merge(data, %{codepoint: codepoint})
    end)
    |> Enum.sort_by(& &1.name)
  end

  defp build_animation_data(codepoint) do
    case Map.get(LottieManifest.manifest(), codepoint) do
      nil ->
        nil

      data ->
        base = LottieManifest.cdn_base_url()

        %{
          codepoint: codepoint,
          emoji: data.emoji,
          name: data.name,
          category: data.category,
          subcategory: data.subcategory,
          keywords: data.keywords,
          animations: %{
            lottie: "#{base}/#{codepoint}/lottie.json",
            webp: "#{base}/#{codepoint}/512.webp",
            gif: "#{base}/#{codepoint}/512.gif"
          },
          has_animation: true
        }
    end
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
