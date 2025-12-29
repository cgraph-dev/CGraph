defmodule CgraphWeb.Plugs.RateLimiter do
  @moduledoc """
  Rate limiting plug using Redis or ETS.
  
  Limits requests per IP or user within a time window.
  """
  import Plug.Conn

  @behaviour Plug

  @default_limit 100
  @default_window_ms 60_000

  def init(opts) do
    %{
      limit: Keyword.get(opts, :limit, @default_limit),
      window_ms: Keyword.get(opts, :window_ms, @default_window_ms)
    }
  end

  def call(conn, opts) do
    key = rate_limit_key(conn)

    case check_rate_limit(key, opts.limit, opts.window_ms) do
      {:ok, remaining} ->
        conn
        |> put_resp_header("x-ratelimit-limit", to_string(opts.limit))
        |> put_resp_header("x-ratelimit-remaining", to_string(remaining))
        |> put_resp_header("x-ratelimit-reset", to_string(reset_timestamp(opts.window_ms)))

      {:error, :rate_limited, retry_after} ->
        conn
        |> put_resp_header("x-ratelimit-limit", to_string(opts.limit))
        |> put_resp_header("x-ratelimit-remaining", "0")
        |> put_resp_header("retry-after", to_string(div(retry_after, 1000)))
        |> put_resp_content_type("application/json")
        |> send_resp(429, Jason.encode!(%{
          error: "Too Many Requests",
          message: "Rate limit exceeded. Try again in #{div(retry_after, 1000)} seconds.",
          retry_after: div(retry_after, 1000)
        }))
        |> halt()
    end
  end

  defp rate_limit_key(conn) do
    # Use user ID if authenticated, otherwise IP
    user_id = conn.assigns[:current_user] && conn.assigns[:current_user].id
    ip = conn.remote_ip |> :inet.ntoa() |> to_string()

    if user_id do
      "rate_limit:user:#{user_id}"
    else
      "rate_limit:ip:#{ip}"
    end
  end

  defp check_rate_limit(key, limit, window_ms) do
    # Use Cachex for rate limiting (or Redis in production)
    case Cachex.get(:cgraph_cache, key) do
      {:ok, nil} ->
        Cachex.put(:cgraph_cache, key, 1, ttl: window_ms)
        {:ok, limit - 1}

      {:ok, count} when count < limit ->
        Cachex.incr(:cgraph_cache, key)
        {:ok, limit - count - 1}

      {:ok, _count} ->
        {:ok, ttl} = Cachex.ttl(:cgraph_cache, key)
        retry_after = ttl || window_ms
        {:error, :rate_limited, retry_after}

      {:error, _} ->
        # If cache fails, allow request
        {:ok, limit}
    end
  end

  defp reset_timestamp(window_ms) do
    DateTime.utc_now()
    |> DateTime.add(window_ms, :millisecond)
    |> DateTime.to_unix()
  end
end
