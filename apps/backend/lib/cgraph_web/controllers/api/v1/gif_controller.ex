defmodule CGraphWeb.API.V1.GifController do
  @moduledoc """
  Controller for GIF search and trending GIFs using Tenor API.

  Provides a proxy to Tenor API to keep API keys secure on the backend
  and enable caching/rate limiting.

  ## Tenor API Integration

  - Requires `TENOR_API_KEY` environment variable
  - Falls back to sample data if API key not configured
  - Caches results for 5 minutes to reduce API calls
  - Rate limited via standard API pipeline

  ## Client Usage

  ```javascript
  // Search GIFs
  GET /api/v1/gifs/search?q=happy&limit=30

  // Trending GIFs
  GET /api/v1/gifs/trending?limit=30
  ```
  """

  use CGraphWeb, :controller
  require Logger

  alias CGraph.Cache

  @tenor_api_url "https://tenor.googleapis.com/v2"
  @default_limit 30
  @cache_ttl :timer.minutes(5)

  @doc """
  Search for GIFs using Tenor API.

  ## Parameters
  - `q` - Search query (required)
  - `limit` - Number of results (default: 30, max: 50)
  - `pos` - Pagination position (optional)

  ## Response
  ```json
  {
    "gifs": [
      {
        "id": "123456",
        "title": "Happy Dance",
        "url": "https://tenor.com/view/...",
        "media": {
          "gif": { "url": "...", "size": 1234 },
          "tinygif": { "url": "...", "size": 567 }
        }
      }
    ],
    "next": "CAgQAhog..."
  }
  ```
  """
  def search(conn, %{"q" => query} = params) do
    limit = min(String.to_integer(params["limit"] || "#{@default_limit}"), 50)
    pos = params["pos"]

    cache_key = "gifs:search:#{query}:#{limit}:#{pos || "0"}"

    result = Cache.fetch(cache_key, fn ->
      case fetch_from_tenor("search", %{q: query, limit: limit, pos: pos}) do
        {:ok, data} ->
          gifs = parse_tenor_response(data)
          {:ok, %{gifs: gifs, next: data["next"]}}

        {:error, _reason} ->
          # Fallback to sample data if Tenor API fails
          {:ok, %{gifs: generate_sample_gifs(query), next: nil}}
      end
    end, @cache_ttl)

    case result do
      {:ok, response} ->
        json(conn, response)

      {:error, reason} ->
        Logger.error("Failed to fetch GIFs: #{inspect(reason)}")
        json(conn, %{gifs: generate_sample_gifs(query), next: nil})
    end
  end

  @doc """
  Get trending GIFs.

  ## Parameters
  - `limit` - Number of results (default: 30, max: 50)
  - `pos` - Pagination position (optional)
  """
  def trending(conn, params) do
    limit = min(String.to_integer(params["limit"] || "#{@default_limit}"), 50)
    pos = params["pos"]

    cache_key = "gifs:trending:#{limit}:#{pos || "0"}"

    result = Cache.fetch(cache_key, fn ->
      case fetch_from_tenor("trending", %{limit: limit, pos: pos}) do
        {:ok, data} ->
          gifs = parse_tenor_response(data)
          {:ok, %{gifs: gifs, next: data["next"]}}

        {:error, _reason} ->
          {:ok, %{gifs: generate_sample_gifs("trending"), next: nil}}
      end
    end, @cache_ttl)

    case result do
      {:ok, response} ->
        json(conn, response)

      {:error, reason} ->
        Logger.error("Failed to fetch trending GIFs: #{inspect(reason)}")
        json(conn, %{gifs: generate_sample_gifs("trending"), next: nil})
    end
  end

  # Private functions

  defp fetch_from_tenor(endpoint, params) do
    api_key = System.get_env("TENOR_API_KEY") || Application.get_env(:cgraph, :tenor_api_key)

    if api_key do
      query_params =
        params
        |> Map.put(:key, api_key)
        |> Map.put(:client_key, "cgraph")
        |> Enum.reject(fn {_k, v} -> is_nil(v) end)
        |> URI.encode_query()

      url = "#{@tenor_api_url}/#{endpoint}?#{query_params}"

      case HTTPoison.get(url, [], timeout: 5000, recv_timeout: 5000) do
        {:ok, %{status_code: 200, body: body}} ->
          Jason.decode(body)

        {:ok, %{status_code: status}} ->
          Logger.warning("Tenor API returned status #{status}")
          {:error, :api_error}

        {:error, reason} ->
          Logger.error("Failed to fetch from Tenor: #{inspect(reason)}")
          {:error, reason}
      end
    else
      Logger.info("No Tenor API key configured, using sample data")
      {:error, :no_api_key}
    end
  end

  defp parse_tenor_response(data) do
    results = data["results"] || []

    Enum.map(results, fn result ->
      %{
        id: result["id"],
        title: result["title"] || result["content_description"] || "",
        url: result["itemurl"] || result["url"],
        media: %{
          gif: %{
            url: get_in(result, ["media_formats", "gif", "url"]),
            size: get_in(result, ["media_formats", "gif", "size"]) || 0,
            dims: get_in(result, ["media_formats", "gif", "dims"])
          },
          tinygif: %{
            url: get_in(result, ["media_formats", "tinygif", "url"]),
            size: get_in(result, ["media_formats", "tinygif", "size"]) || 0,
            dims: get_in(result, ["media_formats", "tinygif", "dims"])
          },
          preview: %{
            url: get_in(result, ["media_formats", "nanogif", "url"]) ||
                 get_in(result, ["media_formats", "tinygif", "url"]),
            size: get_in(result, ["media_formats", "nanogif", "size"]) || 0
          }
        }
      }
    end)
  end

  defp generate_sample_gifs(query) do
    # Fallback sample GIFs when Tenor API is unavailable
    base_gifs = [
      %{
        id: "sample-1",
        title: "Happy #{query}",
        url: "https://media.tenor.com/sample/1",
        media: %{
          gif: %{url: "https://media.tenor.com/sample/1.gif", size: 500_000},
          tinygif: %{url: "https://media.tenor.com/sample/1-tiny.gif", size: 50_000},
          preview: %{url: "https://media.tenor.com/sample/1-nano.gif", size: 5000}
        }
      },
      %{
        id: "sample-2",
        title: "Excited #{query}",
        url: "https://media.tenor.com/sample/2",
        media: %{
          gif: %{url: "https://media.tenor.com/sample/2.gif", size: 600_000},
          tinygif: %{url: "https://media.tenor.com/sample/2-tiny.gif", size: 60_000},
          preview: %{url: "https://media.tenor.com/sample/2-nano.gif", size: 6000}
        }
      },
      %{
        id: "sample-3",
        title: "Dancing #{query}",
        url: "https://media.tenor.com/sample/3",
        media: %{
          gif: %{url: "https://media.tenor.com/sample/3.gif", size: 700_000},
          tinygif: %{url: "https://media.tenor.com/sample/3-tiny.gif", size: 70_000},
          preview: %{url: "https://media.tenor.com/sample/3-nano.gif", size: 7000}
        }
      }
    ]

    # Return 10 sample GIFs by cycling through the base set
    Enum.map(1..10, fn i ->
      base_gif = Enum.at(base_gifs, rem(i - 1, length(base_gifs)))
      %{base_gif | id: "sample-#{i}"}
    end)
  end
end
