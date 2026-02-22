defmodule CGraphWeb.Channels.SocketSecurity.RateLimiting do
  @moduledoc """
  Message rate limiting, action cooldowns, and abuse detection for WebSocket connections.
  """

  # Rate limit configurations by tier
  @rate_limits %{
    standard: %{
      messages_per_second: 5,
      messages_per_minute: 60,
      burst_allowance: 10
    },
    premium: %{
      messages_per_second: 20,
      messages_per_minute: 200,
      burst_allowance: 30
    },
    bot: %{
      messages_per_second: 50,
      messages_per_minute: 500,
      burst_allowance: 100
    }
  }

  # Abuse detection thresholds
  @spam_threshold 100  # Messages in 10 seconds
  @flood_threshold 10  # Identical messages in 30 seconds

  @doc """
  Check if a message can be sent based on rate limits.

  Returns `:ok` if allowed, `{:error, :rate_limited}` if denied.
  """
  @spec rate_limit_message(Phoenix.Socket.t(), atom()) :: :ok | {:error, :rate_limited}
  def rate_limit_message(socket, event_type) do
    user_id = get_user_id(socket)
    tier = get_user_tier(socket)
    limits = Map.get(@rate_limits, tier, @rate_limits.standard)

    key_second = "socket:rate:#{user_id}:second"
    key_minute = "socket:rate:#{user_id}:minute"

    # Check per-second rate limit
    with {:ok, count_second} <- increment_rate_counter(key_second, 1),
         true <- count_second <= limits.messages_per_second + limits.burst_allowance,
         {:ok, count_minute} <- increment_rate_counter(key_minute, 60),
         true <- count_minute <= limits.messages_per_minute do

      # Track for abuse detection
      maybe_track_abuse(user_id, event_type)

      :ok
    else
      _ ->
        emit_rate_limit_telemetry(user_id, tier)
        {:error, :rate_limited}
    end
  end

  @doc """
  Apply a cooldown after certain actions (e.g., group creation).

  Prevents rapid repeated actions that could be abusive.
  """
  @spec apply_action_cooldown(Phoenix.Socket.t(), atom(), non_neg_integer()) :: :ok | {:error, :cooldown_active}
  def apply_action_cooldown(socket, action, cooldown_seconds) do
    user_id = get_user_id(socket)
    key = "socket:cooldown:#{user_id}:#{action}"

    case Cachex.get(:cgraph_cache, key) do
      {:ok, nil} ->
        Cachex.put(:cgraph_cache, key, true, ttl: :timer.seconds(cooldown_seconds))
        :ok

      {:ok, _} ->
        {:error, :cooldown_active}
    end
  end

  # ---------------------------------------------------------------------------
  # Abuse Detection
  # ---------------------------------------------------------------------------

  @doc """
  Check if a user is being abusive and should be throttled or banned.

  Returns:
  - `:ok` - User is fine
  - `{:warn, reason}` - User should be warned
  - `{:throttle, seconds}` - User should be throttled
  - `{:ban, reason}` - User should be banned
  """
  @spec check_abuse(Phoenix.Socket.t()) :: :ok | {:warn, atom()} | {:throttle, non_neg_integer()} | {:ban, atom()}
  def check_abuse(socket) do
    user_id = get_user_id(socket)

    spam_key = "socket:abuse:spam:#{user_id}"
    flood_key = "socket:abuse:flood:#{user_id}"

    spam_count = get_counter(spam_key)
    flood_count = get_counter(flood_key)

    cond do
      spam_count > @spam_threshold * 2 ->
        {:ban, :excessive_spam}

      flood_count > @flood_threshold * 2 ->
        {:throttle, 60}

      spam_count > @spam_threshold ->
        {:warn, :approaching_spam_limit}

      flood_count > @flood_threshold ->
        {:warn, :repetitive_messages}

      true ->
        :ok
    end
  end

  @doc "Track repeated content for flood detection."
  @spec track_content(Phoenix.Socket.t(), String.t()) :: {:ok, integer()}
  def track_content(socket, content) do
    user_id = get_user_id(socket)
    content_hash = :crypto.hash(:sha256, content) |> Base.encode16(case: :lower)
    flood_key = "socket:abuse:flood:#{user_id}:#{content_hash}"

    increment_rate_counter(flood_key, 30)
  end

  # ---------------------------------------------------------------------------
  # Private Helpers
  # ---------------------------------------------------------------------------

  defp get_user_id(socket) do
    case socket.assigns[:current_user] do
      %{id: id} -> id
      _ -> socket.assigns[:current_user_id] || "anonymous"
    end
  end

  defp get_user_tier(socket) do
    user = socket.assigns[:current_user]

    cond do
      is_nil(user) -> :standard
      Map.get(user, :is_bot, false) -> :bot
      Map.get(user, :is_premium, false) -> :premium
      true -> :standard
    end
  end

  defp maybe_track_abuse(user_id, _event_type) do
    # Track overall message rate for spam detection
    spam_key = "socket:abuse:spam:#{user_id}"
    increment_rate_counter(spam_key, 10)
    :ok
  end

  defp increment_rate_counter(key, ttl_seconds) do
    case Cachex.incr(:cgraph_cache, key) do
      {:ok, 1} ->
        Cachex.expire(:cgraph_cache, key, :timer.seconds(ttl_seconds))
        {:ok, 1}
      {:ok, count} ->
        {:ok, count}
      error ->
        error
    end
  end

  defp get_counter(key) do
    case Cachex.get(:cgraph_cache, key) do
      {:ok, nil} -> 0
      {:ok, count} when is_integer(count) -> count
      _ -> 0
    end
  end

  defp emit_rate_limit_telemetry(user_id, tier) do
    :telemetry.execute(
      [:cgraph, :socket, :rate_limited],
      %{count: 1},
      %{user_id: user_id, tier: tier}
    )
  end
end
