defmodule CGraph.CDN.CDNManager do
  @moduledoc """
  CDN management with configurable backend (Cloudflare R2 / AWS S3).

  Provides a unified interface for uploading files to CDN storage,
  generating signed URLs for private content, and purging cached content.

  ## Configuration

      config :cgraph, CGraph.CDN.CDNManager,
        backend: :r2,                          # :r2 | :s3
        bucket: "cgraph-assets",
        region: "auto",                        # "auto" for R2, region for S3
        account_id: "...",                     # R2 only
        access_key_id: "...",
        secret_access_key: "...",
        public_url: "https://cdn.cgraph.app",
        purge_api_token: "..."                 # Cloudflare API token for purge

  ## Usage

      # Upload a file to CDN
      {:ok, url} = CDNManager.upload_to_cdn("/path/to/file.webp", key: "images/avatar.webp")

      # Generate a signed URL with TTL
      {:ok, signed} = CDNManager.signed_url("private/report.pdf", 3600)

      # Purge cached content
      :ok = CDNManager.purge("https://cdn.cgraph.app/images/avatar.webp")
  """

  require Logger

  @type backend :: :r2 | :s3
  @type upload_opts :: [key: String.t(), content_type: String.t(), acl: String.t()]

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Upload a file to the CDN storage backend.

  ## Options

    * `:key` — the object key (path) in the bucket. Required.
    * `:content_type` — MIME type. Auto-detected if omitted.
    * `:acl` — access control. Defaults to `"public-read"`.
    * `:cache_control` — Cache-Control header. Defaults to `"public, max-age=31536000, immutable"`.

  Returns `{:ok, public_url}` on success, `{:error, reason}` on failure.
  """
  @spec upload_to_cdn(String.t(), upload_opts()) :: {:ok, String.t()} | {:error, term()}
  def upload_to_cdn(local_path, opts) do
    key = Keyword.fetch!(opts, :key)
    content_type = Keyword.get(opts, :content_type, detect_content_type(local_path))
    acl = Keyword.get(opts, :acl, "public-read")
    cache_control = Keyword.get(opts, :cache_control, "public, max-age=31536000, immutable")

    config = cdn_config()

    with {:ok, body} <- File.read(local_path),
         {:ok, _resp} <- put_object(config, key, body, content_type, acl, cache_control) do
      public_url = "#{config.public_url}/#{key}"

      Logger.info("cdn_upload_success",
        key: key,
        size: byte_size(body),
        backend: config.backend
      )

      {:ok, public_url}
    else
      {:error, reason} = err ->
        Logger.error("cdn_upload_failed", key: key, reason: inspect(reason))
        err
    end
  end

  @doc """
  Purge a URL (or list of URLs) from the CDN cache.

  For Cloudflare R2, uses the Cloudflare API to purge by URL.
  For S3/CloudFront, issues an invalidation request.

  Returns `:ok` on success.
  """
  @spec purge(String.t() | [String.t()]) :: :ok | {:error, term()}
  def purge(urls) when is_binary(urls), do: purge([urls])

  def purge(urls) when is_list(urls) do
    config = cdn_config()

    case config.backend do
      :r2 -> purge_cloudflare(config, urls)
      :s3 -> purge_cloudfront(config, urls)
    end
  end

  @doc """
  Generate a pre-signed URL for temporary access to a private object.

  ## Parameters

    * `key` — the object key in the bucket
    * `ttl` — time-to-live in seconds (default: 3600)

  Returns `{:ok, signed_url}`.
  """
  @spec signed_url(String.t(), pos_integer()) :: {:ok, String.t()} | {:error, term()}
  def signed_url(key, ttl \\ 3600) do
    config = cdn_config()
    now = DateTime.utc_now()
    expires_at = DateTime.add(now, ttl, :second)

    # Build the canonical request for signing
    host = endpoint_host(config)
    path = "/#{config.bucket}/#{key}"

    date_stamp = Calendar.strftime(now, "%Y%m%d")
    amz_date = Calendar.strftime(now, "%Y%m%dT%H%M%SZ")
    credential_scope = "#{date_stamp}/#{config.region}/s3/aws4_request"

    query_params = %{
      "X-Amz-Algorithm" => "AWS4-HMAC-SHA256",
      "X-Amz-Credential" => "#{config.access_key_id}/#{credential_scope}",
      "X-Amz-Date" => amz_date,
      "X-Amz-Expires" => to_string(ttl),
      "X-Amz-SignedHeaders" => "host"
    }

    canonical_querystring =
      query_params
      |> Enum.sort_by(&elem(&1, 0))
      |> Enum.map(fn {k, v} -> "#{URI.encode(k)}=#{URI.encode(v)}" end)
      |> Enum.join("&")

    canonical_request =
      Enum.join(
        [
          "GET",
          path,
          canonical_querystring,
          "host:#{host}\n",
          "host",
          "UNSIGNED-PAYLOAD"
        ],
        "\n"
      )

    string_to_sign =
      Enum.join(
        [
          "AWS4-HMAC-SHA256",
          amz_date,
          credential_scope,
          sha256_hex(canonical_request)
        ],
        "\n"
      )

    signing_key =
      ("AWS4" <> config.secret_access_key)
      |> hmac_sha256(date_stamp)
      |> hmac_sha256(config.region)
      |> hmac_sha256("s3")
      |> hmac_sha256("aws4_request")

    signature = hmac_sha256_hex(signing_key, string_to_sign)

    signed =
      "https://#{host}#{path}?#{canonical_querystring}&X-Amz-Signature=#{signature}"

    Logger.debug("cdn_signed_url_generated", key: key, expires_at: expires_at)
    {:ok, signed}
  end

  @doc """
  Check if the CDN backend is reachable by performing a HEAD request on the bucket.
  """
  @spec health_check() :: :ok | {:error, term()}
  def health_check do
    config = cdn_config()
    host = endpoint_host(config)
    url = "https://#{host}/#{config.bucket}"

    case :httpc.request(:head, {String.to_charlist(url), []}, [{:timeout, 5_000}], []) do
      {:ok, {{_, status, _}, _, _}} when status in 200..299 ->
        :ok

      {:ok, {{_, status, _}, _, _}} ->
        {:error, {:http_status, status}}

      {:error, reason} ->
        {:error, reason}
    end
  rescue
    e -> {:error, Exception.message(e)}
  end

  # ---------------------------------------------------------------------------
  # Private — S3-compatible object operations
  # ---------------------------------------------------------------------------

  defp put_object(config, key, body, content_type, acl, cache_control) do
    host = endpoint_host(config)
    path = "/#{config.bucket}/#{key}"
    url = "https://#{host}#{path}"

    now = DateTime.utc_now()
    date_stamp = Calendar.strftime(now, "%Y%m%d")
    amz_date = Calendar.strftime(now, "%Y%m%dT%H%M%SZ")
    content_hash = sha256_hex(body)

    headers = [
      {"Host", host},
      {"x-amz-date", amz_date},
      {"x-amz-content-sha256", content_hash},
      {"Content-Type", content_type},
      {"x-amz-acl", acl},
      {"Cache-Control", cache_control}
    ]

    signed_headers = headers |> Enum.map(&elem(&1, 0)) |> Enum.map(&String.downcase/1) |> Enum.sort() |> Enum.join(";")

    canonical_headers =
      headers
      |> Enum.map(fn {k, v} -> "#{String.downcase(k)}:#{String.trim(v)}" end)
      |> Enum.sort()
      |> Enum.join("\n")

    canonical_request =
      Enum.join(["PUT", path, "", canonical_headers <> "\n", signed_headers, content_hash], "\n")

    credential_scope = "#{date_stamp}/#{config.region}/s3/aws4_request"

    string_to_sign =
      Enum.join(["AWS4-HMAC-SHA256", amz_date, credential_scope, sha256_hex(canonical_request)], "\n")

    signing_key =
      ("AWS4" <> config.secret_access_key)
      |> hmac_sha256(date_stamp)
      |> hmac_sha256(config.region)
      |> hmac_sha256("s3")
      |> hmac_sha256("aws4_request")

    signature = hmac_sha256_hex(signing_key, string_to_sign)

    auth_header =
      "AWS4-HMAC-SHA256 Credential=#{config.access_key_id}/#{credential_scope}, " <>
        "SignedHeaders=#{signed_headers}, Signature=#{signature}"

    all_headers =
      [{"Authorization", auth_header} | headers]
      |> Enum.map(fn {k, v} -> {String.to_charlist(k), String.to_charlist(v)} end)

    case :httpc.request(
           :put,
           {String.to_charlist(url), all_headers, String.to_charlist(content_type), body},
           [{:timeout, 30_000}],
           []
         ) do
      {:ok, {{_, status, _}, _, _}} when status in 200..299 ->
        {:ok, :uploaded}

      {:ok, {{_, status, _}, _, resp_body}} ->
        {:error, {:http_error, status, to_string(resp_body)}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  # ---------------------------------------------------------------------------
  # Private — Purge implementations
  # ---------------------------------------------------------------------------

  defp purge_cloudflare(config, urls) do
    zone_id = config[:zone_id] || ""
    api_url = "https://api.cloudflare.com/client/v4/zones/#{zone_id}/purge_cache"

    body = Jason.encode!(%{files: urls})

    headers = [
      {~c"Authorization", ~c"Bearer #{config.purge_api_token}"},
      {~c"Content-Type", ~c"application/json"}
    ]

    case :httpc.request(:post, {String.to_charlist(api_url), headers, ~c"application/json", body}, [{:timeout, 10_000}], []) do
      {:ok, {{_, status, _}, _, _}} when status in 200..299 ->
        Logger.info("cdn_purge_success", urls: urls, backend: :r2)
        :ok

      {:ok, {{_, status, _}, _, resp_body}} ->
        Logger.error("cdn_purge_failed", status: status, body: to_string(resp_body))
        {:error, {:purge_failed, status}}

      {:error, reason} ->
        Logger.error("cdn_purge_error", reason: inspect(reason))
        {:error, reason}
    end
  end

  defp purge_cloudfront(config, urls) do
    # CloudFront invalidation via AWS CLI (fallback for S3 backend)
    distribution_id = config[:cloudfront_distribution_id] || ""

    paths =
      urls
      |> Enum.map(fn url ->
        uri = URI.parse(url)
        uri.path || "/"
      end)
      |> Enum.join(" ")

    case System.cmd("aws", [
           "cloudfront",
           "create-invalidation",
           "--distribution-id",
           distribution_id,
           "--paths" | String.split(paths, " ")
         ],
         stderr_to_stdout: true
       ) do
      {_, 0} ->
        Logger.info("cdn_purge_success", urls: urls, backend: :s3)
        :ok

      {output, _} ->
        Logger.error("cdn_purge_failed", output: output)
        {:error, {:cloudfront_invalidation_failed, output}}
    end
  rescue
    e ->
      Logger.error("cdn_purge_error", reason: Exception.message(e))
      {:error, Exception.message(e)}
  end

  # ---------------------------------------------------------------------------
  # Private — Configuration & Helpers
  # ---------------------------------------------------------------------------

  defp cdn_config do
    config = Application.get_env(:cgraph, __MODULE__, [])

    %{
      backend: Keyword.get(config, :backend, :r2),
      bucket: Keyword.get(config, :bucket, "cgraph-assets"),
      region: Keyword.get(config, :region, "auto"),
      account_id: Keyword.get(config, :account_id, ""),
      access_key_id: Keyword.get(config, :access_key_id, ""),
      secret_access_key: Keyword.get(config, :secret_access_key, ""),
      public_url: Keyword.get(config, :public_url, "https://cdn.cgraph.app"),
      purge_api_token: Keyword.get(config, :purge_api_token, ""),
      zone_id: Keyword.get(config, :zone_id, ""),
      cloudfront_distribution_id: Keyword.get(config, :cloudfront_distribution_id, "")
    }
  end

  defp endpoint_host(config) do
    case config.backend do
      :r2 -> "#{config.account_id}.r2.cloudflarestorage.com"
      :s3 -> "s3.#{config.region}.amazonaws.com"
    end
  end

  defp detect_content_type(path) do
    case Path.extname(path) do
      ".webp" -> "image/webp"
      ".jpg" -> "image/jpeg"
      ".jpeg" -> "image/jpeg"
      ".png" -> "image/png"
      ".gif" -> "image/gif"
      ".svg" -> "image/svg+xml"
      ".pdf" -> "application/pdf"
      ".json" -> "application/json"
      ".js" -> "application/javascript"
      ".css" -> "text/css"
      ".html" -> "text/html"
      ".woff2" -> "font/woff2"
      ".woff" -> "font/woff"
      _ -> "application/octet-stream"
    end
  end

  defp sha256_hex(data) do
    :crypto.hash(:sha256, data) |> Base.encode16(case: :lower)
  end

  defp hmac_sha256(key, data) do
    :crypto.mac(:hmac, :sha256, key, data)
  end

  defp hmac_sha256_hex(key, data) do
    :crypto.mac(:hmac, :sha256, key, data) |> Base.encode16(case: :lower)
  end
end
