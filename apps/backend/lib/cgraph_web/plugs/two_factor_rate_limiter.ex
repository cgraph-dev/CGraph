defmodule CGraphWeb.Plugs.TwoFactorRateLimiter do
  @moduledoc """
  Specialized rate limiter for Two-Factor Authentication endpoints.

  ## Security Features

  - Per-user rate limiting (not just IP) to prevent distributed brute force
  - Progressive lockout: 5 attempts per 5 minutes, then lockout for 15 minutes
  - Tracks failed attempts separately from successful ones
  - Automatic unlock after lockout period

  ## Rate Limits

  - 5 verification attempts per 5 minutes per user
  - After 5 failed attempts: 15-minute lockout
  - After 3 lockouts in 24 hours: 24-hour lockout

  ## Usage

      # In controller:
      plug CGraphWeb.Plugs.TwoFactorRateLimiter when action in [:verify, :disable]

  ## Why Separate from Standard Rate Limiter?

  Standard rate limiting (100 req/min) would allow ~10,000 attempts in under 2 hours,
  which is enough to brute-force a 6-digit TOTP code (1 million combinations).
  This plug implements proper 2FA protection.
  """

  import Plug.Conn
  require Logger

  @redis_prefix "cgraph:2fa_rate_limit:"
  @max_attempts 5
  @window_seconds 300  # 5 minutes
  @lockout_seconds 900  # 15 minutes
  @extended_lockout_seconds 86_400  # 24 hours
  @lockout_threshold 3  # Lockouts before extended lockout

  # Wraps Redix calls to handle process not available (e.g., test env)
  defp safe_redis_command(args) do
    try do
      Redix.command(:redix, args)
    catch
      :exit, _ -> {:error, :redis_unavailable}
    end
  end

  @doc "Initializes plug options."
  @spec init(keyword()) :: keyword()
  def init(opts), do: opts

  @doc "Processes the connection through this plug."
  @spec call(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def call(conn, _opts) do
    user = conn.assigns[:current_user]

    if is_nil(user) do
      # No user = authentication failed earlier, let it pass through
      conn
    else
      check_rate_limit(conn, user)
    end
  end

  defp check_rate_limit(conn, user) do
    key = "#{@redis_prefix}#{user.id}"
    lockout_key = "#{@redis_prefix}lockout:#{user.id}"
    lockout_count_key = "#{@redis_prefix}lockout_count:#{user.id}"

    with {:ok, conn} <- check_lockout(conn, lockout_key),
         {:ok, conn} <- check_extended_lockout(conn, lockout_count_key),
         {:ok, attempts} <- get_attempts(key),
         {:ok, conn} <- validate_attempts(conn, attempts) do
      # Store the keys in conn assigns for increment after response
      conn
      |> assign(:_2fa_rate_key, key)
      |> assign(:_2fa_lockout_key, lockout_key)
      |> assign(:_2fa_lockout_count_key, lockout_count_key)
      |> register_before_send(&track_result/1)
    end
  end

  defp check_lockout(conn, lockout_key) do
    case safe_redis_command(["GET", lockout_key]) do
      {:ok, nil} ->
        {:ok, conn}
      {:ok, _locked_at} ->
        ttl = get_ttl(lockout_key)
        Logger.warning("2fa_user_is_locked_out_for_2fa", conn_assigns_current_user_id: conn.assigns.current_user.id)
        {:error, rate_limit_response(conn, ttl, "Too many failed attempts. Try again later.")}
      {:error, _} ->
        # Redis error - fail open but log
        Logger.error("[2FA] Redis error checking lockout")
        {:ok, conn}
    end
  end

  defp check_extended_lockout(conn, lockout_count_key) do
    case safe_redis_command(["GET", lockout_count_key]) do
      {:ok, nil} ->
        {:ok, conn}
      {:ok, count_str} when is_binary(count_str) ->
        count = String.to_integer(count_str)
        if count >= @lockout_threshold do
          ttl = get_ttl(lockout_count_key)
          Logger.warning("2fa_user_in_extended_lockout", conn_assigns_current_user_id: conn.assigns.current_user.id)
          {:error, rate_limit_response(conn, ttl, "Account temporarily locked due to repeated failed attempts.")}
        else
          {:ok, conn}
        end
      {:error, _} ->
        {:ok, conn}
    end
  end

  defp get_attempts(key) do
    case safe_redis_command(["GET", key]) do
      {:ok, nil} -> {:ok, 0}
      {:ok, count} when is_binary(count) -> {:ok, String.to_integer(count)}
      {:error, _} -> {:ok, 0}  # Fail open on Redis error
    end
  end

  defp validate_attempts(conn, attempts) when attempts >= @max_attempts do
    user_id = conn.assigns.current_user.id
    Logger.warning("2fa_user_hit_2fa_rate_limit_attempts", user_id: user_id, attempts: attempts)
    {:error, rate_limit_response(conn, @lockout_seconds, "Too many verification attempts.")}
  end
  defp validate_attempts(conn, _attempts), do: {:ok, conn}

  defp get_ttl(key) do
    case safe_redis_command(["TTL", key]) do
      {:ok, ttl} when is_integer(ttl) and ttl > 0 -> ttl
      _ -> @lockout_seconds
    end
  end

  defp rate_limit_response(conn, retry_after, message) do
    conn
    |> put_resp_header("retry-after", to_string(retry_after))
    |> put_status(:too_many_requests)
    |> Phoenix.Controller.put_view(json: CGraphWeb.ErrorJSON)
    |> Phoenix.Controller.json(%{
      error: "rate_limited",
      message: message,
      retry_after: retry_after
    })
    |> halt()
  end

  # Called after the response is sent to track success/failure
  defp track_result(conn) do
    key = conn.assigns[:_2fa_rate_key]
    lockout_key = conn.assigns[:_2fa_lockout_key]
    lockout_count_key = conn.assigns[:_2fa_lockout_count_key]

    if key do
      status = conn.status

      cond do
        # Success (200 OK) - reset the counter
        status == 200 ->
          safe_redis_command(["DEL", key])

        # Failure (422, 401, etc.) - increment counter
        status in [401, 422, 423] ->
          increment_failure(key, lockout_key, lockout_count_key, conn.assigns.current_user.id)

        # Other statuses - don't count
        true ->
          :ok
      end
    end

    conn
  end

  defp increment_failure(key, lockout_key, lockout_count_key, user_id) do
    # Increment attempt counter with TTL
    case safe_redis_command(["INCR", key]) do
      {:ok, count} ->
        # Set TTL if this is first increment
        if count == 1 do
          safe_redis_command(["EXPIRE", key, @window_seconds])
        end

        # Check if we should trigger lockout
        if count >= @max_attempts do
          Logger.warning("2fa_triggering_lockout_for_user_after_attempts", user_id: user_id, count: count)

          # Set lockout
          safe_redis_command(["SETEX", lockout_key, @lockout_seconds, DateTime.to_iso8601(DateTime.utc_now())])

          # Increment lockout count
          case safe_redis_command(["INCR", lockout_count_key]) do
            {:ok, lockout_count} ->
              if lockout_count == 1 do
                safe_redis_command(["EXPIRE", lockout_count_key, @extended_lockout_seconds])
              end

              if lockout_count >= @lockout_threshold do
                Logger.warning("2fa_triggering_extended_lockout_for_user", user_id: user_id)
                # Extend the lockout to 24 hours
                lockout_timestamp = DateTime.to_iso8601(DateTime.utc_now())
                safe_redis_command(["SETEX", lockout_key, @extended_lockout_seconds, lockout_timestamp])
              end
            _ -> :ok
          end

          # Reset attempt counter
          safe_redis_command(["DEL", key])
        end

      _ -> :ok
    end
  end
end
