defmodule CGraph.Messaging.LinkPreviewService do
  @moduledoc """
  Server-side link preview service.

  Detects URLs in message content, fetches Open Graph metadata,
  caches results, and builds preview maps for the frontend.

  Uses Req for HTTP fetching with timeouts, size limits, and redirect following.
  Parses OG meta tags via regex (no Floki dependency required at runtime).
  """

  import Ecto.Query, warn: false

  alias CGraph.Messaging.LinkPreviewCache
  alias CGraph.Repo

  require Logger

  @url_regex ~r{https?://[^\s<>"')\]]+}i
  @max_body_bytes 1_048_576
  @request_timeout 5_000
  @max_redirects 3
  @user_agent "CGraphBot/1.0 (+https://cgraph.app)"

  # ── Public API ──────────────────────────────────────────────────────────

  @doc """
  Extract HTTP/HTTPS URLs from text content.

  Returns a list of URL strings found in the text.
  """
  @spec extract_urls(String.t() | nil) :: [String.t()]
  def extract_urls(nil), do: []
  def extract_urls(text) when is_binary(text) do
    @url_regex
    |> Regex.scan(text)
    |> List.flatten()
    |> Enum.map(&clean_url/1)
    |> Enum.uniq()
  end

  @doc """
  Get cached preview or fetch fresh metadata for a URL.

  Returns `{:ok, preview_map}` or `{:error, reason}`.
  """
  @spec get_or_fetch(String.t()) :: {:ok, map()} | {:error, atom() | String.t()}
  def get_or_fetch(url) when is_binary(url) do
    url_hash = hash_url(url)

    case get_cached(url_hash) do
      {:ok, cached} ->
        if LinkPreviewCache.expired?(cached) do
          fetch_and_cache(url, url_hash)
        else
          {:ok, build_preview_map(cached)}
        end

      :miss ->
        fetch_and_cache(url, url_hash)
    end
  end

  @doc """
  Build a frontend-compatible preview map from cache entry or raw metadata.
  """
  @spec build_preview_map(%LinkPreviewCache{} | map()) :: map()
  def build_preview_map(%LinkPreviewCache{} = entry) do
    %{
      url: entry.url,
      title: entry.title,
      description: entry.description,
      image: entry.image_url,
      siteName: entry.site_name,
      type: entry.og_type || "website",
      favicon: entry.favicon_url
    }
  end

  def build_preview_map(metadata) when is_map(metadata) do
    %{
      url: metadata[:url] || metadata["url"],
      title: metadata[:title] || metadata["title"],
      description: metadata[:description] || metadata["description"],
      image: metadata[:image_url] || metadata["image_url"],
      siteName: metadata[:site_name] || metadata["site_name"],
      type: metadata[:og_type] || metadata["og_type"] || "website",
      favicon: metadata[:favicon_url] || metadata["favicon_url"]
    }
  end

  # ── Private: Cache ──────────────────────────────────────────────────────

  defp get_cached(url_hash) do
    case Repo.get_by(LinkPreviewCache, url_hash: url_hash) do
      nil -> :miss
      entry -> {:ok, entry}
    end
  end

  defp fetch_and_cache(url, url_hash) do
    case fetch_metadata(url) do
      {:ok, metadata} ->
        attrs = Map.merge(metadata, %{url: url, url_hash: url_hash})

        result =
          %LinkPreviewCache{}
          |> LinkPreviewCache.changeset(attrs)
          |> Repo.insert(
            on_conflict: {:replace, [:title, :description, :image_url, :favicon_url, :site_name, :og_type, :fetched_at, :expires_at, :updated_at]},
            conflict_target: :url_hash
          )

        case result do
          {:ok, entry} -> {:ok, build_preview_map(entry)}
          {:error, changeset} ->
            Logger.warning("link_preview_cache_insert_failed", error: inspect(changeset.errors))
            {:ok, build_preview_map(metadata)}
        end

      {:error, reason} = error ->
        Logger.info("link_preview_fetch_failed", url: url, reason: inspect(reason))
        error
    end
  end

  # ── Private: HTTP Fetch ─────────────────────────────────────────────────

  @doc false
  @spec fetch_metadata(String.t()) :: {:ok, map()} | {:error, atom() | String.t()}
  def fetch_metadata(url) do
    case Req.get(url,
           headers: [{"user-agent", @user_agent}, {"accept", "text/html"}],
           max_redirects: @max_redirects,
           receive_timeout: @request_timeout,
           connect_options: [timeout: @request_timeout],
           max_retries: 0,
           into: nil
         ) do
      {:ok, %Req.Response{status: status, body: body}} when status in 200..299 ->
        body = if is_binary(body), do: truncate_body(body), else: ""
        parse_html_metadata(body, url)

      {:ok, %Req.Response{status: status}} ->
        {:error, {:http_status, status}}

      {:error, %Req.TransportError{reason: reason}} ->
        {:error, reason}

      {:error, reason} ->
        {:error, reason}
    end
  rescue
    e ->
      Logger.warning("link_preview_fetch_exception", url: url, error: Exception.message(e))
      {:error, :fetch_exception}
  end

  defp truncate_body(body) when byte_size(body) > @max_body_bytes do
    binary_part(body, 0, @max_body_bytes)
  end
  defp truncate_body(body), do: body

  # ── Private: HTML Parsing (Regex-based) ─────────────────────────────────

  defp parse_html_metadata(html, url) do
    title = extract_og_tag(html, "og:title")
             || extract_meta_name(html, "twitter:title")
             || extract_title_tag(html)
    description = extract_og_tag(html, "og:description")
                   || extract_meta_name(html, "twitter:description")
                   || extract_meta_name(html, "description")
    image = extract_og_tag(html, "og:image")
             || extract_meta_name(html, "twitter:image")
    site_name = extract_og_tag(html, "og:site_name")
    og_type = extract_og_tag(html, "og:type")
    favicon = extract_favicon(html, url)

    if title || description || image do
      {:ok, %{
        title: truncate_string(title, 500),
        description: truncate_string(description, 1000),
        image_url: maybe_absolute_url(image, url),
        site_name: truncate_string(site_name, 200),
        og_type: og_type || "website",
        favicon_url: maybe_absolute_url(favicon, url)
      }}
    else
      {:error, :no_metadata}
    end
  end

  defp extract_og_tag(html, property) do
    # Match <meta property="og:title" content="...">
    regex = ~r/<meta[^>]*property=["']#{Regex.escape(property)}["'][^>]*content=["']([^"']*)["'][^>]*>/is
    case Regex.run(regex, html) do
      [_, content] -> decode_html_entities(String.trim(content))
      _ ->
        # Also try reversed attribute order: content before property
        regex2 = ~r/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']#{Regex.escape(property)}["'][^>]*>/is
        case Regex.run(regex2, html) do
          [_, content] -> decode_html_entities(String.trim(content))
          _ -> nil
        end
    end
  end

  defp extract_meta_name(html, name) do
    regex = ~r/<meta[^>]*name=["']#{Regex.escape(name)}["'][^>]*content=["']([^"']*)["'][^>]*>/is
    case Regex.run(regex, html) do
      [_, content] -> decode_html_entities(String.trim(content))
      _ ->
        regex2 = ~r/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']#{Regex.escape(name)}["'][^>]*>/is
        case Regex.run(regex2, html) do
          [_, content] -> decode_html_entities(String.trim(content))
          _ -> nil
        end
    end
  end

  defp extract_title_tag(html) do
    case Regex.run(~r/<title[^>]*>([^<]*)<\/title>/is, html) do
      [_, title] -> decode_html_entities(String.trim(title))
      _ -> nil
    end
  end

  defp extract_favicon(html, base_url) do
    # Try <link rel="icon" href="..."> or <link rel="shortcut icon" href="...">
    regex = ~r/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["'][^>]*>/is
    case Regex.run(regex, html) do
      [_, href] -> maybe_absolute_url(String.trim(href), base_url)
      _ ->
        # Try reversed order
        regex2 = ~r/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["'][^>]*>/is
        case Regex.run(regex2, html) do
          [_, href] -> maybe_absolute_url(String.trim(href), base_url)
          _ ->
            # Default fallback: /favicon.ico
            uri = URI.parse(base_url)
            "#{uri.scheme}://#{uri.host}/favicon.ico"
        end
    end
  end

  # ── Private: Utilities ──────────────────────────────────────────────────

  defp hash_url(url) do
    normalized = url |> String.trim() |> String.downcase()
    :crypto.hash(:sha256, normalized) |> Base.encode16(case: :lower)
  end

  defp clean_url(url) do
    # Strip trailing punctuation that's likely not part of the URL
    url
    |> String.replace(~r/[.,;:!?)}\]]+$/, "")
    |> String.trim()
  end

  defp maybe_absolute_url(nil, _base), do: nil
  defp maybe_absolute_url("", _base), do: nil
  defp maybe_absolute_url(url, base_url) do
    case URI.parse(url) do
      %URI{scheme: nil} ->
        base = URI.parse(base_url)
        URI.merge(base, url) |> to_string()
      _ ->
        url
    end
  end

  defp truncate_string(nil, _max), do: nil
  defp truncate_string(str, max) when byte_size(str) > max do
    String.slice(str, 0, max)
  end
  defp truncate_string(str, _max), do: str

  defp decode_html_entities(text) do
    text
    |> String.replace("&amp;", "&")
    |> String.replace("&lt;", "<")
    |> String.replace("&gt;", ">")
    |> String.replace("&quot;", "\"")
    |> String.replace("&#39;", "'")
    |> String.replace("&apos;", "'")
  end
end
