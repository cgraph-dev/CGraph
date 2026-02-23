defmodule CGraphWeb.Plugs.RawBodyPlug do
  @moduledoc """
  Plug to cache the raw request body for endpoints that need it (like Stripe webhooks).

  Stripe requires the raw, unmodified request body to verify webhook signatures.
  This plug reads the body once and stores it in the connection's private assigns.

  ## Usage

  Add to your endpoint before Plug.Parsers for specific paths:

      plug CGraphWeb.Plugs.RawBodyPlug
      plug Plug.Parsers, ...

  Then access in controllers:

      raw_body = conn.private[:raw_body]
  """

  @behaviour Plug

  @impl true
  @doc "Initializes plug options."
  @spec init(keyword()) :: keyword()
  def init(opts), do: opts

  @impl true
  @doc "Processes the connection through this plug."
  @spec call(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def call(conn, _opts) do
    # Only cache body for webhook paths that need signature verification
    if should_cache_body?(conn.request_path) do
      cache_raw_body(conn)
    else
      conn
    end
  end

  defp should_cache_body?(path) do
    # Paths that require raw body for signature verification
    webhook_paths = [
      "/api/webhooks/stripe"
    ]

    Enum.any?(webhook_paths, &String.starts_with?(path, &1))
  end

  defp cache_raw_body(conn) do
    case Plug.Conn.read_body(conn) do
      {:ok, body, conn} ->
        conn
        |> Plug.Conn.put_private(:raw_body, body)
        |> Plug.Conn.put_private(:raw_body_read, true)

      {:more, partial_body, conn} ->
        # Handle large bodies by reading in chunks
        cache_raw_body_chunked(conn, [partial_body])

      {:error, _reason} ->
        conn
    end
  end

  defp cache_raw_body_chunked(conn, acc) do
    case Plug.Conn.read_body(conn) do
      {:ok, body, conn} ->
        full_body = IO.iodata_to_binary(Enum.reverse([body | acc]))

        conn
        |> Plug.Conn.put_private(:raw_body, full_body)
        |> Plug.Conn.put_private(:raw_body_read, true)

      {:more, partial_body, conn} ->
        cache_raw_body_chunked(conn, [partial_body | acc])

      {:error, _reason} ->
        conn
    end
  end
end
