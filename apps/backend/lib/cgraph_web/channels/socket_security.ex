defmodule CgraphWeb.Channels.SocketSecurity do
  @moduledoc """
  WebSocket security and rate limiting module.
  
  ## Overview
  
  Provides comprehensive security for real-time WebSocket connections including:
  
  - **Message rate limiting**: Prevent spam/DoS via excessive messages
  - **Connection limiting**: Limit concurrent connections per user/IP
  - **Event validation**: Validate incoming event payloads
  - **Abuse detection**: Track suspicious patterns and auto-ban
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                    WebSocket Security Flow                       │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  ┌─────────────┐    ┌───────────────┐    ┌─────────────────┐   │
  │  │ WS Connect  │───▶│ Auth Verify   │───▶│ Connection      │   │
  │  │             │    │               │    │ Rate Limit      │   │
  │  └─────────────┘    └───────────────┘    └────────┬────────┘   │
  │                                                    │            │
  │                                           ┌────────▼────────┐   │
  │  ┌─────────────┐    ┌───────────────┐    │ Message Rate    │   │
  │  │ WS Message  │───▶│ Event         │───▶│ Limiter         │   │
  │  │             │    │ Validation    │    │                 │   │
  │  └─────────────┘    └───────────────┘    └────────┬────────┘   │
  │                                                    │            │
  │                                           ┌────────▼────────┐   │
  │                                           │ Abuse Detection │   │
  │                                           │                 │   │
  │                                           └─────────────────┘   │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Rate Limit Tiers
  
  | Tier      | Messages/sec | Use Case              |
  |-----------|-------------|------------------------|
  | Standard  | 5           | Regular users          |
  | Premium   | 20          | Premium subscribers    |
  | Bot       | 50          | Verified bots          |
  
  ## Usage
  
  In your socket module:
  
      defmodule CgraphWeb.UserSocket do
        use Phoenix.Socket
        use CgraphWeb.Channels.SocketSecurity
        
        # ...
      end
  
  In channels:
  
      def handle_in("new_message", payload, socket) do
        case SocketSecurity.rate_limit_message(socket) do
          :ok -> 
            # Process message
          {:error, :rate_limited} ->
            {:reply, {:error, %{reason: "slow_down"}}, socket}
        end
      end
  """
  
  require Logger
  
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
  
  # Connection limits
  @max_connections_per_user 5
  @max_connections_per_ip 20
  
  # Abuse detection thresholds
  @spam_threshold 100  # Messages in 10 seconds
  @flood_threshold 10  # Identical messages in 30 seconds
  
  @type tier :: :standard | :premium | :bot
  @type socket :: Phoenix.Socket.t()
  
  # ---------------------------------------------------------------------------
  # Macro for Socket Integration
  # ---------------------------------------------------------------------------
  
  @doc """
  Use this macro to add security features to your socket module.
  
  Adds:
  - `c:security_connect/2` callback for connection validation
  - `c:security_rate_limit/2` callback for message rate limiting
  """
  defmacro __using__(_opts) do
    quote do
      import CgraphWeb.Channels.SocketSecurity
    end
  end
  
  # ---------------------------------------------------------------------------
  # Connection Security
  # ---------------------------------------------------------------------------
  
  @doc """
  Validate connection and track concurrent connections.
  
  Call this in your socket's `connect/3` callback:
  
      def connect(params, socket, connect_info) do
        case SocketSecurity.validate_connection(params, connect_info) do
          :ok ->
            # Continue with auth
          {:error, reason} ->
            :error
        end
      end
  """
  def validate_connection(params, connect_info) do
    user_id = Map.get(params, "user_id")
    ip = get_ip_from_connect_info(connect_info)
    
    with :ok <- check_ip_not_banned(ip),
         :ok <- check_ip_connection_limit(ip),
         :ok <- check_user_connection_limit(user_id) do
      track_connection(user_id, ip)
      :ok
    end
  end
  
  @doc """
  Clean up connection tracking on disconnect.
  
  Call this in your socket's `terminate/2` callback.
  """
  def cleanup_connection(socket) do
    user_id = socket.assigns[:current_user_id]
    if user_id do
      key = "socket:connections:user:#{user_id}"
      Cachex.decr(:cgraph_cache, key)
    end
    :ok
  end
  
  # ---------------------------------------------------------------------------
  # Message Rate Limiting
  # ---------------------------------------------------------------------------
  
  @doc """
  Check if a message can be sent based on rate limits.
  
  Returns `:ok` if allowed, `{:error, :rate_limited}` if denied.
  
  ## Examples
  
      case SocketSecurity.rate_limit_message(socket) do
        :ok -> broadcast!(socket, "new_message", payload)
        {:error, :rate_limited} -> {:reply, {:error, %{reason: "slow_down"}}, socket}
      end
  """
  def rate_limit_message(socket, event_type \\ :message) do
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
  def apply_action_cooldown(socket, action, cooldown_seconds \\ 30) do
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
  # Event Validation
  # ---------------------------------------------------------------------------
  
  @doc """
  Validate an incoming event payload against expected schema.
  
  ## Event Schemas
  
  Schemas are defined as maps with field specs:
  
      schema = %{
        content: {:string, required: true, max_length: 2000},
        reply_to_id: {:string, required: false},
        attachments: {:list, required: false, max_items: 10}
      }
  
  ## Examples
  
      case SocketSecurity.validate_event(payload, %{content: {:string, required: true}}) do
        :ok -> process_message(payload)
        {:error, errors} -> {:reply, {:error, errors}, socket}
      end
  """
  def validate_event(payload, schema) when is_map(payload) and is_map(schema) do
    errors = Enum.reduce(schema, [], fn {field, spec}, acc ->
      value = Map.get(payload, to_string(field))
      
      case validate_field(value, spec) do
        :ok -> acc
        {:error, reason} -> [{field, reason} | acc]
      end
    end)
    
    if errors == [] do
      :ok
    else
      {:error, %{validation_errors: Enum.into(errors, %{})}}
    end
  end
  
  defp validate_field(value, {type, opts}) do
    required = Keyword.get(opts, :required, false)
    
    cond do
      is_nil(value) and required -> {:error, "is required"}
      is_nil(value) -> :ok
      true -> validate_type(value, type, opts)
    end
  end
  
  defp validate_type(value, :string, opts) do
    max_length = Keyword.get(opts, :max_length)
    min_length = Keyword.get(opts, :min_length, 0)
    
    cond do
      not is_binary(value) -> {:error, "must be a string"}
      max_length && String.length(value) > max_length -> {:error, "is too long"}
      String.length(value) < min_length -> {:error, "is too short"}
      true -> :ok
    end
  end
  
  defp validate_type(value, :integer, opts) do
    min = Keyword.get(opts, :min)
    max = Keyword.get(opts, :max)
    
    cond do
      not is_integer(value) -> {:error, "must be an integer"}
      min && value < min -> {:error, "is too small"}
      max && value > max -> {:error, "is too large"}
      true -> :ok
    end
  end
  
  defp validate_type(value, :boolean, _opts) do
    if is_boolean(value), do: :ok, else: {:error, "must be a boolean"}
  end
  
  defp validate_type(value, :list, opts) do
    max_items = Keyword.get(opts, :max_items)
    
    cond do
      not is_list(value) -> {:error, "must be a list"}
      max_items && length(value) > max_items -> {:error, "has too many items"}
      true -> :ok
    end
  end
  
  defp validate_type(value, :uuid, _opts) do
    case Ecto.UUID.cast(value) do
      {:ok, _} -> :ok
      :error -> {:error, "must be a valid UUID"}
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
  
  defp maybe_track_abuse(user_id, _event_type) do
    # Track overall message rate for spam detection
    spam_key = "socket:abuse:spam:#{user_id}"
    increment_rate_counter(spam_key, 10)
    :ok
  end
  
  @doc """
  Track repeated content for flood detection.
  """
  def track_content(socket, content) do
    user_id = get_user_id(socket)
    content_hash = :crypto.hash(:sha256, content) |> Base.encode16(case: :lower)
    flood_key = "socket:abuse:flood:#{user_id}:#{content_hash}"
    
    increment_rate_counter(flood_key, 30)
  end
  
  # ---------------------------------------------------------------------------
  # IP Banning
  # ---------------------------------------------------------------------------
  
  @doc """
  Ban an IP address for a specified duration.
  """
  def ban_ip(ip, duration_seconds \\ 3600, reason \\ "abuse") do
    key = "socket:banned:ip:#{sanitize_ip(ip)}"
    Cachex.put(:cgraph_cache, key, %{reason: reason, banned_at: DateTime.utc_now()}, 
      ttl: :timer.seconds(duration_seconds))
    
    Logger.warning("IP banned", ip: ip, reason: reason, duration_seconds: duration_seconds)
    :ok
  end
  
  @doc """
  Unban an IP address.
  """
  def unban_ip(ip) do
    key = "socket:banned:ip:#{sanitize_ip(ip)}"
    Cachex.del(:cgraph_cache, key)
    :ok
  end
  
  @doc """
  Check if an IP is banned.
  """
  def ip_banned?(ip) do
    key = "socket:banned:ip:#{sanitize_ip(ip)}"
    case Cachex.get(:cgraph_cache, key) do
      {:ok, nil} -> false
      {:ok, _} -> true
      _ -> false
    end
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
  
  defp get_ip_from_connect_info(connect_info) do
    connect_info
    |> Map.get(:peer_data, %{})
    |> Map.get(:address)
    |> format_ip()
  end
  
  defp format_ip(nil), do: "unknown"
  defp format_ip(ip) when is_tuple(ip), do: :inet.ntoa(ip) |> to_string()
  defp format_ip(ip) when is_binary(ip), do: ip
  
  defp sanitize_ip(ip) do
    ip
    |> to_string()
    |> String.replace(~r/[^0-9a-fA-F.:]/, "")
    |> String.slice(0, 45)
  end
  
  defp check_ip_not_banned(ip) do
    if ip_banned?(ip) do
      {:error, :ip_banned}
    else
      :ok
    end
  end
  
  defp check_ip_connection_limit(ip) do
    key = "socket:connections:ip:#{sanitize_ip(ip)}"
    
    case get_counter(key) do
      count when count < @max_connections_per_ip -> :ok
      _ -> {:error, :too_many_connections}
    end
  end
  
  defp check_user_connection_limit(nil), do: :ok
  defp check_user_connection_limit(user_id) do
    key = "socket:connections:user:#{user_id}"
    
    case get_counter(key) do
      count when count < @max_connections_per_user -> :ok
      _ -> {:error, :too_many_connections}
    end
  end
  
  defp track_connection(user_id, ip) do
    if user_id do
      Cachex.incr(:cgraph_cache, "socket:connections:user:#{user_id}")
    end
    
    Cachex.incr(:cgraph_cache, "socket:connections:ip:#{sanitize_ip(ip)}")
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
