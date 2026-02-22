defmodule CGraph.Idempotency.Helpers do
  @moduledoc """
  Validation, fingerprinting, and configuration helpers for the
  idempotency system.

  Provides key validation, SHA-256 request-body fingerprinting,
  Plug header extraction, and merged application config access.
  """

  @default_config %{
    backend: :ets,
    # 7 days TTL for idempotency keys
    default_ttl: :timer.hours(168),
    lock_ttl: :timer.seconds(30),
    header: "idempotency-key",
    fingerprint_body: true,
    max_key_length: 255,
    cleanup_interval: :timer.minutes(5)
  }

  # ---------------------------------------------------------------------------
  # Validation
  # ---------------------------------------------------------------------------

  @doc """
  Validate an idempotency key.

  Returns the key if valid, `nil` otherwise. A valid key is a non-empty
  binary no longer than `max_key_length` (default 255).
  """
  @spec validate_key(term()) :: String.t() | nil
  def validate_key(nil), do: nil

  def validate_key(key) when is_binary(key) do
    max_length = get_config(:max_key_length)

    if byte_size(key) > 0 and byte_size(key) <= max_length do
      key
    else
      nil
    end
  end

  def validate_key(_), do: nil

  # ---------------------------------------------------------------------------
  # Fingerprinting
  # ---------------------------------------------------------------------------

  @doc """
  Compute a SHA-256 fingerprint for a request body.

  Used to detect when the same idempotency key is reused with a
  different request body.
  """
  @spec fingerprint(term()) :: String.t()
  def fingerprint(nil), do: "empty"

  def fingerprint(body) when is_binary(body) do
    :crypto.hash(:sha256, body) |> Base.encode16(case: :lower)
  end

  def fingerprint(body) do
    body
    |> Jason.encode!()
    |> fingerprint()
  end

  # ---------------------------------------------------------------------------
  # Plug Helpers
  # ---------------------------------------------------------------------------

  @doc "Extract the idempotency key from a Plug connection's request headers."
  @spec get_key_from_conn(Plug.Conn.t()) :: String.t() | nil
  def get_key_from_conn(conn) do
    header_name = get_config(:header)

    case Plug.Conn.get_req_header(conn, header_name) do
      [key | _] when is_binary(key) and byte_size(key) > 0 ->
        validate_key(key)

      _ ->
        nil
    end
  end

  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------

  @doc "Get a single configuration value, falling back to defaults."
  @spec get_config(atom()) :: term()
  def get_config(key) do
    app_config = Application.get_env(:cgraph, CGraph.Idempotency, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end

  @doc "Load the full merged configuration map."
  @spec load_config() :: map()
  def load_config do
    app_config = Application.get_env(:cgraph, CGraph.Idempotency, [])
    Map.merge(@default_config, Map.new(app_config))
  end

  @doc "Return the default configuration map."
  @spec default_config() :: map()
  def default_config, do: @default_config
end
