defmodule CGraph.Animations.NotoScraper do
  @moduledoc """
  Noto Emoji Animation CDN scraper.

  Verifies which Unicode emojis have Lottie animations on the Google Fonts CDN
  at `https://fonts.gstatic.com/s/e/notoemoji/latest/{codepoint}/lottie.json`.

  Used to discover animated emojis and build the manifest at
  `priv/data/noto_emoji_manifest.json`.

  ## CDN URL Patterns

    * Lottie JSON: `{base}/{codepoint}/lottie.json` (~37KB)
    * WebP static: `{base}/{codepoint}/512.webp`
    * Animated GIF: `{base}/{codepoint}/512.gif`

  ## Codepoint Format

    * Lowercase hex, no `U+` prefix (e.g., `1f600` for 😀)
    * Multi-codepoint emojis use `_` separator (e.g., `1f3f4_200d_2620_fe0f`)
    * Variation Selector-16 (`FE0F`) is stripped before lookup

  ## Usage

      iex> NotoScraper.verify_codepoint("1f600")
      {:ok, %{codepoint: "1f600", lottie_url: "https://...", file_size: 37328}}

      iex> NotoScraper.verify_codepoint("0000")
      {:error, :not_found}

      iex> NotoScraper.scrape_all(["1f600", "1f601"], concurrency: 5)
      [%{codepoint: "1f600", ...}, %{codepoint: "1f601", ...}]
  """

  require Logger

  @cdn_base "https://fonts.gstatic.com/s/e/notoemoji/latest"

  @doc """
  Returns the CDN base URL for Noto Emoji animations.
  """
  @spec cdn_base() :: String.t()
  def cdn_base, do: @cdn_base

  @doc """
  Verify whether a single codepoint has a Lottie animation on the CDN.

  Performs an HTTP HEAD request to check availability. Returns file size
  from the `content-length` header when available.

  ## Examples

      iex> NotoScraper.verify_codepoint("1f600")
      {:ok, %{codepoint: "1f600", lottie_url: "https://...", file_size: 37328}}

      iex> NotoScraper.verify_codepoint("0000")
      {:error, :not_found}
  """
  @spec verify_codepoint(String.t(), keyword()) ::
          {:ok, map()} | {:error, :not_found | :rate_limited | term()}
  def verify_codepoint(codepoint, opts \\ []) do
    url = lottie_url(codepoint)
    timeout = Keyword.get(opts, :receive_timeout, 5_000)
    max_retries = Keyword.get(opts, :max_retries, 3)

    do_verify(codepoint, url, timeout, max_retries, _attempt = 0)
  end

  defp do_verify(codepoint, url, timeout, max_retries, attempt) do
    case Req.head(url, receive_timeout: timeout) do
      {:ok, %Req.Response{status: 200} = resp} ->
        size = get_content_length(resp)

        {:ok,
         %{
           codepoint: codepoint,
           lottie_url: url,
           webp_url: webp_url(codepoint),
           gif_url: gif_url(codepoint),
           file_size: size
         }}

      {:ok, %Req.Response{status: 404}} ->
        {:error, :not_found}

      {:ok, %Req.Response{status: 429}} when attempt < max_retries ->
        backoff = exponential_backoff(attempt)
        Logger.warning("Rate limited for #{codepoint}, retrying in #{backoff}ms")
        Process.sleep(backoff)
        do_verify(codepoint, url, timeout, max_retries, attempt + 1)

      {:ok, %Req.Response{status: 429}} ->
        {:error, :rate_limited}

      {:ok, %Req.Response{status: status}} ->
        {:error, {:unexpected_status, status}}

      {:error, reason} when attempt < max_retries ->
        backoff = exponential_backoff(attempt)
        Logger.warning("Request failed for #{codepoint}: #{inspect(reason)}, retrying in #{backoff}ms")
        Process.sleep(backoff)
        do_verify(codepoint, url, timeout, max_retries, attempt + 1)

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Scrape multiple codepoints concurrently with rate limiting.

  ## Options

    * `:concurrency` — max concurrent requests (default: 10)
    * `:timeout` — per-task timeout in ms (default: 30_000)
    * `:receive_timeout` — HTTP timeout per request (default: 5_000)

  Returns a list of successfully verified codepoint maps.
  """
  @spec scrape_all([String.t()], keyword()) :: [map()]
  def scrape_all(codepoints, opts \\ []) do
    concurrency = Keyword.get(opts, :concurrency, 10)
    timeout = Keyword.get(opts, :timeout, 30_000)

    codepoints
    |> Task.async_stream(
      fn cp -> verify_codepoint(cp, opts) end,
      max_concurrency: concurrency,
      timeout: timeout,
      on_timeout: :kill_task
    )
    |> Enum.reduce([], fn
      {:ok, {:ok, result}}, acc -> [result | acc]
      {:ok, {:error, _}}, acc -> acc
      {:exit, _}, acc -> acc
    end)
    |> Enum.reverse()
  end

  @doc """
  Build a complete manifest by scraping all emojis from the Unicode dataset.

  Loads `priv/data/emoji_unicode16.json`, converts each emoji to its hex
  codepoint, and verifies CDN availability. Returns a manifest map ready
  for JSON serialization.

  ## Options

  Accepts the same options as `scrape_all/2`.
  """
  @spec build_manifest(keyword()) :: map()
  def build_manifest(opts \\ []) do
    emojis = load_emoji_dataset()

    codepoint_entries =
      emojis
      |> Enum.map(fn e -> {emoji_to_hex(e["emoji"]), e} end)
      |> Enum.uniq_by(fn {cp, _} -> cp end)

    codepoints = Enum.map(codepoint_entries, fn {cp, _} -> cp end)
    entry_map = Map.new(codepoint_entries)

    animated = scrape_all(codepoints, opts)

    manifest_emojis =
      Enum.map(animated, fn result ->
        entry = Map.get(entry_map, result.codepoint, %{})

        %{
          "codepoint" => result.codepoint,
          "emoji" => entry["emoji"] || codepoint_to_emoji(result.codepoint),
          "name" => entry["name"] || "unknown",
          "category" => entry["category"] || "Unknown",
          "subcategory" => entry["subcategory"] || "unknown",
          "keywords" => entry["keywords"] || [],
          "formats" => %{
            "lottie" => "#{result.codepoint}/lottie.json",
            "webp" => "#{result.codepoint}/512.webp",
            "gif" => "#{result.codepoint}/512.gif"
          },
          "file_size_bytes" => result.file_size
        }
      end)

    %{
      "version" => "1.0.0",
      "generated_at" => DateTime.utc_now() |> DateTime.to_iso8601(),
      "cdn_base" => @cdn_base,
      "total_animated" => length(manifest_emojis),
      "emojis" => manifest_emojis
    }
  end

  @doc """
  Convert an emoji string to its hex codepoint representation.

  Strips Variation Selector-16 (U+FE0F) before conversion.
  Multi-codepoint emojis are joined with `_`.

  ## Examples

      iex> NotoScraper.emoji_to_hex("😀")
      "1f600"

      iex> NotoScraper.emoji_to_hex("👍🏽")
      "1f44d_1f3fd"

      iex> NotoScraper.emoji_to_hex("❤️")
      "2764"

      iex> NotoScraper.emoji_to_hex("🏴\u200D☠️")
      "1f3f4_200d_2620"
  """
  @spec emoji_to_hex(String.t()) :: String.t()
  def emoji_to_hex(emoji) when is_binary(emoji) do
    emoji
    |> String.codepoints()
    |> Enum.reject(&(&1 == "\uFE0F"))
    |> Enum.map(fn cp ->
      <<code::utf8>> = cp
      code |> Integer.to_string(16) |> String.downcase()
    end)
    |> Enum.join("_")
  end

  @doc """
  Convert a hex codepoint string back to an emoji character.

  ## Examples

      iex> NotoScraper.codepoint_to_emoji("1f600")
      "😀"
  """
  @spec codepoint_to_emoji(String.t()) :: String.t()
  def codepoint_to_emoji(codepoint) when is_binary(codepoint) do
    codepoint
    |> String.split("_")
    |> Enum.map(fn hex ->
      {code, ""} = Integer.parse(hex, 16)
      <<code::utf8>>
    end)
    |> Enum.join()
  end

  # ============================================================================
  # URL Builders
  # ============================================================================

  @doc "Build the Lottie JSON URL for a codepoint."
  @spec lottie_url(String.t()) :: String.t()
  def lottie_url(codepoint), do: "#{@cdn_base}/#{codepoint}/lottie.json"

  @doc "Build the WebP URL for a codepoint."
  @spec webp_url(String.t()) :: String.t()
  def webp_url(codepoint), do: "#{@cdn_base}/#{codepoint}/512.webp"

  @doc "Build the GIF URL for a codepoint."
  @spec gif_url(String.t()) :: String.t()
  def gif_url(codepoint), do: "#{@cdn_base}/#{codepoint}/512.gif"

  # ============================================================================
  # Private Helpers
  # ============================================================================

  defp get_content_length(%Req.Response{} = response) do
    case Req.Response.get_header(response, "content-length") do
      [size | _] -> String.to_integer(size)
      _ -> nil
    end
  rescue
    _ -> nil
  end

  defp exponential_backoff(attempt) do
    base = 1_000
    max_backoff = 30_000
    jitter = :rand.uniform(500)
    min(base * :math.pow(2, attempt) |> round(), max_backoff) + jitter
  end

  defp load_emoji_dataset do
    path = Path.join(:code.priv_dir(:cgraph), "data/emoji_unicode16.json")

    path
    |> File.read!()
    |> Jason.decode!()
  end
end
