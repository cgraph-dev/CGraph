defmodule CGraphWeb.Plugs.IdempotencyPlug do
  @moduledoc """
  Enforces basic idempotency for write requests using the Idempotency-Key header.

  - Applies to POST/PUT/PATCH/DELETE only.
  - If Idempotency-Key is missing, request proceeds normally.
  - If the key exists in cache, returns 409 Conflict to prevent duplicate work.
  - Only caches the key AFTER a successful response (2xx status) to allow retries on failures.
  - Stores the key with a configurable TTL (default 10s) in Cachex :cgraph_cache.
  """

  import Plug.Conn

  @behaviour Plug
  @methods ~w(POST PUT PATCH DELETE)
  @header "idempotency-key"

  @spec init(keyword()) :: keyword()
  def init(opts) do
    %{
      ttl_ms: Keyword.get(opts, :ttl_ms, 10_000)
    }
  end

  @spec call(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def call(%Plug.Conn{method: method} = conn, %{ttl_ms: ttl_ms}) when method in @methods do
    case get_req_header(conn, @header) do
      [] -> conn
      [<<>>] -> conn
      [key | _] -> handle_key(conn, key, ttl_ms)
    end
  end

  def call(conn, _opts), do: conn

  defp handle_key(conn, key, ttl_ms) do
    case Cachex.exists?(:cgraph_cache, cache_key(key)) do
      {:ok, true} ->
        conn
        |> put_status(:conflict)
        |> put_resp_header("content-type", "application/json")
        |> send_resp(409, Jason.encode!(%{
          error: %{
            code: "idempotency_conflict",
            message: "Idempotency-Key has already been used for a similar request"
          }
        }))
        |> halt()

      _ ->
        # Only cache the key after a successful response (2xx status)
        # This allows retries if the original request failed
        register_before_send(conn, fn response_conn ->
          status = response_conn.status
          if status >= 200 and status < 300 do
            Cachex.put(:cgraph_cache, cache_key(key), true, ttl: ttl_ms)
          end
          response_conn
        end)
    end
  end

  defp cache_key(key), do: {:idempotency, key}
end
