defmodule CGraph.HTTP do
  @moduledoc """
  Unified HTTP client for CGraph with built-in resilience patterns.

  ## Overview

  Provides a centralized HTTP client using Tesla with:

  - **Circuit breaker**: Fail fast after repeated failures (via Fuse)
  - **Retry with backoff**: Automatic retry for transient failures
  - **Timeout handling**: Configurable request timeouts
  - **Telemetry integration**: Automatic metrics emission
  - **Response caching**: Optional cache layer
  - **Request logging**: Structured logging in dev/debug

  ## Architecture

  Uses Tesla middleware stack:

  ```
  Request → Logger → Telemetry → Retry → CircuitBreaker → Timeout → Finch → Response
  ```

  ## Usage

  ### Basic Request

      CGraph.HTTP.get("https://api.example.com/users")
      CGraph.HTTP.post("https://api.example.com/users", %{name: "John"})

  ### With Options

      CGraph.HTTP.get("https://api.example.com/users",
        headers: [{"Authorization", "Bearer token"}],
        timeout: 5_000,
        retry: 3
      )

  ### Named Services (pre-configured)

      CGraph.HTTP.service(:stripe).get("/v1/customers")
      CGraph.HTTP.service(:twilio).post("/Messages", body)

  ## Configuration

  Configure in `config.exs`:

      config :cgraph, CGraph.HTTP,
        timeout: 30_000,
        retry_attempts: 3,
        retry_delay: 1_000,
        circuit_breaker_threshold: 5,
        circuit_breaker_reset: 30_000

  ## Telemetry Events

  - `[:cgraph, :http, :request, :start]` - Request started
  - `[:cgraph, :http, :request, :stop]` - Request completed
  - `[:cgraph, :http, :request, :exception]` - Request failed
  - `[:cgraph, :http, :circuit_breaker, :open]` - Circuit opened
  - `[:cgraph, :http, :circuit_breaker, :close]` - Circuit closed
  """

  use Tesla, only: [], docs: false
  require Logger

  alias Tesla.Middleware

  @default_timeout 30_000
  @default_retry_attempts 3
  @default_retry_delay 1_000
  @default_fuse_threshold 5
  @default_fuse_reset 30_000

  @type http_method :: :get | :post | :put | :patch | :delete | :head | :options
  @type response :: {:ok, Tesla.Env.t()} | {:error, term()}
  @type options :: [
    headers: [{String.t(), String.t()}],
    timeout: pos_integer(),
    retry: non_neg_integer() | false,
    cache: boolean() | pos_integer(),
    fuse: atom() | false,
    telemetry: boolean(),
    body: term()
  ]

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Make a GET request.

  ## Options

  - `:headers` - Additional headers
  - `:timeout` - Request timeout in ms (default: 30_000)
  - `:retry` - Number of retry attempts (default: 3, false to disable)
  - `:cache` - Cache TTL in ms (false to disable)
  - `:fuse` - Circuit breaker name (false to disable)

  ## Examples

      CGraph.HTTP.get("https://api.example.com/users")
      CGraph.HTTP.get("https://api.example.com/users", timeout: 5_000)
  """
  @spec get(String.t(), options()) :: response()
  def get(url, opts \\ []) do
    request(:get, url, nil, opts)
  end

  @doc """
  Make a POST request.

  ## Examples

      CGraph.HTTP.post("https://api.example.com/users", %{name: "John"})
  """
  @spec post(String.t(), term(), options()) :: response()
  def post(url, body, opts \\ []) do
    request(:post, url, body, opts)
  end

  @doc """
  Make a PUT request.
  """
  @spec put(String.t(), term(), options()) :: response()
  def put(url, body, opts \\ []) do
    request(:put, url, body, opts)
  end

  @doc """
  Make a PATCH request.
  """
  @spec patch(String.t(), term(), options()) :: response()
  def patch(url, body, opts \\ []) do
    request(:patch, url, body, opts)
  end

  @doc """
  Make a DELETE request.
  """
  @spec delete(String.t(), options()) :: response()
  def delete(url, opts \\ []) do
    request(:delete, url, nil, opts)
  end

  @doc """
  Make a HEAD request.
  """
  @spec head(String.t(), options()) :: response()
  def head(url, opts \\ []) do
    request(:head, url, nil, opts)
  end

  @doc """
  Get a pre-configured service client.

  ## Available Services

  - `:stripe` - Stripe API
  - `:twilio` - Twilio API
  - `:expo` - Expo Push Notifications
  - `:meilisearch` - Meilisearch
  - `:r2` - Cloudflare R2

  ## Examples

      CGraph.HTTP.service(:stripe).get("/v1/customers")
  """
  @spec service(atom()) :: module()
  def service(name) when is_atom(name) do
    case name do
      :stripe -> CGraph.HTTP.Services.Stripe
      :twilio -> CGraph.HTTP.Services.Twilio
      :expo -> CGraph.HTTP.Services.Expo
      :meilisearch -> CGraph.HTTP.Services.Meilisearch
      :r2 -> CGraph.HTTP.Services.R2
      _ -> raise ArgumentError, "Unknown service: #{name}"
    end
  end

  @doc """
  Build a custom Tesla client with the standard middleware stack.

  ## Options

  - `:base_url` - Base URL for all requests
  - `:headers` - Default headers
  - `:timeout` - Request timeout
  - `:retry` - Retry configuration
  - `:fuse` - Circuit breaker name

  ## Examples

      client = CGraph.HTTP.build_client(
        base_url: "https://api.example.com",
        headers: [{"Authorization", "Bearer token"}]
      )
      Tesla.get(client, "/users")
  """
  @spec build_client(keyword()) :: Tesla.Client.t()
  def build_client(opts \\ []) do
    base_url = Keyword.get(opts, :base_url)
    headers = Keyword.get(opts, :headers, [])
    timeout = Keyword.get(opts, :timeout, config(:timeout))
    retry = Keyword.get(opts, :retry, config(:retry_attempts))
    fuse_name = Keyword.get(opts, :fuse, :default_http_fuse)

    middleware = build_middleware(base_url, headers, timeout, retry, fuse_name)
    Tesla.client(middleware, {Tesla.Adapter.Finch, name: CGraph.Finch})
  end

  # ---------------------------------------------------------------------------
  # Private Implementation
  # ---------------------------------------------------------------------------

  defp request(method, url, body, opts) do
    start_time = System.monotonic_time()
    metadata = %{method: method, url: url}

    emit_telemetry(:start, %{}, metadata)

    result =
      try do
        client = build_request_client(opts)

        case method do
          :get -> Tesla.get(client, url)
          :post -> Tesla.post(client, url, body)
          :put -> Tesla.put(client, url, body)
          :patch -> Tesla.patch(client, url, body)
          :delete -> Tesla.delete(client, url)
          :head -> Tesla.head(client, url)
          :options -> Tesla.options(client, url)
        end
      rescue
        e ->
          emit_telemetry(:exception, %{kind: :error, reason: e}, metadata)
          {:error, e}
      end

    duration = System.monotonic_time() - start_time

    case result do
      {:ok, env} ->
        emit_telemetry(:stop, %{duration: duration, status: env.status}, metadata)
        {:ok, env}

      {:error, reason} = error ->
        emit_telemetry(:stop, %{duration: duration, error: reason}, metadata)
        error
    end
  end

  defp build_request_client(opts) do
    base_url = Keyword.get(opts, :base_url)
    headers = Keyword.get(opts, :headers, [])
    timeout = Keyword.get(opts, :timeout, config(:timeout))
    retry = Keyword.get(opts, :retry, config(:retry_attempts))
    fuse_name = Keyword.get(opts, :fuse, :default_http_fuse)

    middleware = build_middleware(base_url, headers, timeout, retry, fuse_name)
    Tesla.client(middleware, {Tesla.Adapter.Finch, name: CGraph.Finch})
  end

  defp build_middleware(base_url, headers, timeout, retry, fuse_name) do
    middleware = []

    # Base URL (if provided)
    middleware = if base_url do
      [{Middleware.BaseUrl, base_url} | middleware]
    else
      middleware
    end

    # Default headers
    middleware = [
      {Middleware.Headers, [
        {"user-agent", "CGraph/#{Application.spec(:cgraph, :vsn)}"},
        {"accept", "application/json"}
      ] ++ headers}
      | middleware
    ]

    # JSON encoding/decoding
    middleware = [
      {Middleware.JSON, engine: Jason}
      | middleware
    ]

    # Timeout
    middleware = [
      {Middleware.Timeout, timeout: timeout}
      | middleware
    ]

    # Retry (if enabled)
    middleware = if retry && retry > 0 do
      [
        {Middleware.Retry,
          delay: config(:retry_delay),
          max_retries: retry,
          max_delay: 30_000,
          should_retry: &should_retry?/1
        }
        | middleware
      ]
    else
      middleware
    end

    # Circuit breaker (if enabled)
    middleware = if fuse_name do
      [
        {CGraph.HTTP.Middleware.CircuitBreaker, name: fuse_name}
        | middleware
      ]
    else
      middleware
    end

    # Logger (only in dev)
    middleware = if Application.get_env(:cgraph, :env) == :dev do
      [{Middleware.Logger, log_level: :debug} | middleware]
    else
      middleware
    end

    Enum.reverse(middleware)
  end

  defp should_retry?({:ok, %{status: status}}) when status >= 500, do: true
  defp should_retry?({:ok, %{status: 429}}), do: true
  defp should_retry?({:error, :timeout}), do: true
  defp should_retry?({:error, :econnrefused}), do: true
  defp should_retry?({:error, :closed}), do: true
  defp should_retry?(_), do: false

  defp emit_telemetry(event, measurements, metadata) do
    :telemetry.execute(
      [:cgraph, :http, :request, event],
      measurements,
      metadata
    )
  end

  defp config(key) do
    config = Application.get_env(:cgraph, __MODULE__, [])

    case key do
      :timeout -> Keyword.get(config, :timeout, @default_timeout)
      :retry_attempts -> Keyword.get(config, :retry_attempts, @default_retry_attempts)
      :retry_delay -> Keyword.get(config, :retry_delay, @default_retry_delay)
      :fuse_threshold -> Keyword.get(config, :circuit_breaker_threshold, @default_fuse_threshold)
      :fuse_reset -> Keyword.get(config, :circuit_breaker_reset, @default_fuse_reset)
    end
  end
end
