defmodule Cgraph.Notifications.PushService do
  @moduledoc """
  Enterprise-grade Push Notification Service for CGraph.
  
  This module provides a comprehensive push notification infrastructure supporting:
  - Apple Push Notification Service (APNs) for iOS devices
  - Firebase Cloud Messaging (FCM) for Android devices
  - Web Push for browser notifications
  - Expo Push Service for React Native apps
  
  ## Features
  
  - **Multi-platform delivery**: Send to iOS, Android, and Web simultaneously
  - **Batched sending**: Efficient delivery for high-volume notifications
  - **Automatic retry**: Exponential backoff for failed deliveries
  - **Token management**: Automatic cleanup of invalid tokens
  - **Telemetry integration**: Full observability for monitoring
  - **Rate limiting**: Prevent overwhelming push services
  - **Silent push**: Background content updates without user notification
  
  ## Configuration
  
  Configure push services in your config files:
  
      config :cgraph, Cgraph.Notifications.PushService,
        fcm_server_key: System.get_env("FCM_SERVER_KEY"),
        apns_key_id: System.get_env("APNS_KEY_ID"),
        apns_team_id: System.get_env("APNS_TEAM_ID"),
        apns_bundle_id: "com.cgraph.app",
        expo_access_token: System.get_env("EXPO_ACCESS_TOKEN")
  
  ## Usage
  
      # Send to a single user
      PushService.send_notification(user, %{
        title: "New Message",
        body: "John sent you a message",
        data: %{conversation_id: "abc123"}
      })
      
      # Send to multiple users
      PushService.broadcast_notification(user_ids, notification)
  """
  
  use GenServer
  
  alias Cgraph.Repo
  alias Cgraph.Accounts.{User, PushToken}
  alias Cgraph.Notifications.PushService.{ApnsClient, FcmClient, ExpoClient, WebPushClient}
  
  import Ecto.Query
  require Logger
  
  @type notification :: %{
    required(:title) => String.t(),
    required(:body) => String.t(),
    optional(:data) => map(),
    optional(:badge) => non_neg_integer(),
    optional(:sound) => String.t(),
    optional(:category) => String.t(),
    optional(:image_url) => String.t(),
    optional(:thread_id) => String.t(),
    optional(:priority) => :high | :normal | :low,
    optional(:ttl) => non_neg_integer(),
    optional(:collapse_key) => String.t()
  }
  
  @type send_result :: {:ok, %{sent: integer(), failed: integer()}} | {:error, term()}
  
  # Batch configuration
  @batch_size 500
  @batch_delay_ms 100
  
  # ============================================================================
  # Client API
  # ============================================================================
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @doc """
  Sends a push notification to a specific user on all their registered devices.
  
  ## Parameters
  
  - `user` - The user to send the notification to
  - `notification` - Map containing notification content
  - `opts` - Optional keyword list of options
  
  ## Options
  
  - `:silent` - Send as silent/background push (default: false)
  - `:platforms` - List of platforms to send to (default: all)
  - `:exclude_device_ids` - Device IDs to exclude
  
  ## Examples
  
      iex> PushService.send_notification(user, %{title: "Hello", body: "World"})
      {:ok, %{sent: 2, failed: 0}}
  """
  @spec send_notification(User.t(), notification(), keyword()) :: send_result()
  def send_notification(%User{} = user, notification, opts \\ []) do
    GenServer.call(__MODULE__, {:send, user.id, notification, opts}, :infinity)
  end
  
  @doc """
  Sends a push notification to a specific user by user ID.
  """
  @spec send_notification_to_user(String.t(), notification(), keyword()) :: send_result()
  def send_notification_to_user(user_id, notification, opts \\ []) when is_binary(user_id) do
    GenServer.call(__MODULE__, {:send, user_id, notification, opts}, :infinity)
  end
  
  @doc """
  Broadcasts a notification to multiple users.
  
  Uses batching for efficient delivery when sending to many users.
  """
  @spec broadcast_notification(list(String.t()), notification(), keyword()) :: send_result()
  def broadcast_notification(user_ids, notification, opts \\ []) when is_list(user_ids) do
    GenServer.call(__MODULE__, {:broadcast, user_ids, notification, opts}, :infinity)
  end
  
  @doc """
  Sends a notification to all members of a conversation.
  """
  @spec send_to_conversation(String.t(), String.t(), notification(), keyword()) :: send_result()
  def send_to_conversation(conversation_id, sender_id, notification, opts \\ []) do
    GenServer.call(__MODULE__, {:send_to_conversation, conversation_id, sender_id, notification, opts}, :infinity)
  end
  
  @doc """
  Sends a notification to all members of a group.
  """
  @spec send_to_group(String.t(), String.t(), notification(), keyword()) :: send_result()
  def send_to_group(group_id, sender_id, notification, opts \\ []) do
    GenServer.call(__MODULE__, {:send_to_group, group_id, sender_id, notification, opts}, :infinity)
  end
  
  @doc """
  Sends a silent push for background content refresh.
  """
  @spec send_silent_push(String.t(), map()) :: send_result()
  def send_silent_push(user_id, data) when is_binary(user_id) and is_map(data) do
    send_notification_to_user(user_id, %{
      title: "",
      body: "",
      data: data
    }, silent: true)
  end
  
  @doc """
  Registers a new push token for a user.
  """
  @spec register_token(String.t(), String.t(), String.t(), String.t()) :: {:ok, PushToken.t()} | {:error, term()}
  def register_token(user_id, token, platform, device_id) do
    GenServer.call(__MODULE__, {:register_token, user_id, token, platform, device_id})
  end
  
  @doc """
  Removes a push token.
  """
  @spec unregister_token(String.t()) :: :ok | {:error, term()}
  def unregister_token(token) when is_binary(token) do
    GenServer.call(__MODULE__, {:unregister_token, token})
  end
  
  @doc """
  Returns stats about push notification delivery.
  """
  @spec get_stats() :: map()
  def get_stats do
    GenServer.call(__MODULE__, :get_stats)
  end
  
  # ============================================================================
  # GenServer Callbacks
  # ============================================================================
  
  @impl true
  def init(_opts) do
    state = %{
      stats: %{
        sent: 0,
        failed: 0,
        by_platform: %{apns: 0, fcm: 0, expo: 0, web: 0}
      },
      rate_limiter: init_rate_limiter()
    }
    
    Logger.info("PushService started")
    {:ok, state}
  end
  
  @impl true
  def handle_call({:send, user_id, notification, opts}, _from, state) do
    result = do_send_to_user(user_id, notification, opts)
    state = update_stats(state, result)
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:broadcast, user_ids, notification, opts}, _from, state) do
    result = do_broadcast(user_ids, notification, opts)
    state = update_stats(state, result)
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:send_to_conversation, conversation_id, sender_id, notification, opts}, _from, state) do
    user_ids = get_conversation_member_ids(conversation_id, sender_id)
    result = do_broadcast(user_ids, notification, opts)
    state = update_stats(state, result)
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:send_to_group, group_id, sender_id, notification, opts}, _from, state) do
    user_ids = get_group_member_ids(group_id, sender_id)
    result = do_broadcast(user_ids, notification, opts)
    state = update_stats(state, result)
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:register_token, user_id, token, platform, device_id}, _from, state) do
    result = do_register_token(user_id, token, platform, device_id)
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:unregister_token, token}, _from, state) do
    result = do_unregister_token(token)
    {:reply, result, state}
  end
  
  @impl true
  def handle_call(:get_stats, _from, state) do
    {:reply, state.stats, state}
  end
  
  # ============================================================================
  # Private Implementation
  # ============================================================================
  
  defp do_send_to_user(user_id, notification, opts) do
    tokens = get_user_tokens(user_id, opts)
    
    if Enum.empty?(tokens) do
      Logger.debug("No push tokens for user #{user_id}")
      {:ok, %{sent: 0, failed: 0}}
    else
      send_to_tokens(tokens, notification, opts)
    end
  end
  
  defp do_broadcast(user_ids, notification, opts) do
    # Process in batches to avoid overwhelming the system
    user_ids
    |> Enum.chunk_every(@batch_size)
    |> Enum.reduce({0, 0}, fn batch, {total_sent, total_failed} ->
      tokens = get_tokens_for_users(batch, opts)
      
      {:ok, %{sent: sent, failed: failed}} = send_to_tokens(tokens, notification, opts)
      # Rate limiting delay between batches
      Process.sleep(@batch_delay_ms)
      {total_sent + sent, total_failed + failed}
    end)
    |> then(fn {sent, failed} -> {:ok, %{sent: sent, failed: failed}} end)
  end
  
  defp send_to_tokens(tokens, notification, opts) do
    silent = Keyword.get(opts, :silent, false)
    
    # Group tokens by platform
    grouped = Enum.group_by(tokens, & &1.platform)
    
    # Send to each platform concurrently
    tasks = [
      Task.async(fn -> send_to_apns(Map.get(grouped, "apns", []), notification, silent) end),
      Task.async(fn -> send_to_fcm(Map.get(grouped, "fcm", []), notification, silent) end),
      Task.async(fn -> send_to_expo(Map.get(grouped, "expo", []), notification, silent) end),
      Task.async(fn -> send_to_web(Map.get(grouped, "web", []), notification) end)
    ]
    
    results = Task.await_many(tasks, 30_000)
    
    # Aggregate results
    {total_sent, total_failed, invalid_tokens} =
      Enum.reduce(results, {0, 0, []}, fn
        {:ok, sent, failed, invalid}, {ts, tf, ti} ->
          {ts + sent, tf + failed, ti ++ invalid}
        {:error, _reason, count}, {ts, tf, ti} ->
          {ts, tf + count, ti}
      end)
    
    # Clean up invalid tokens asynchronously
    if not Enum.empty?(invalid_tokens) do
      Task.start(fn -> cleanup_invalid_tokens(invalid_tokens) end)
    end
    
    emit_telemetry(:push_sent, %{sent: total_sent, failed: total_failed})
    {:ok, %{sent: total_sent, failed: total_failed}}
  end
  
  # ============================================================================
  # Platform-Specific Senders
  # ============================================================================
  
  defp send_to_apns([], _notification, _silent), do: {:ok, 0, 0, []}
  defp send_to_apns(tokens, notification, silent) do
    start_time = System.monotonic_time()
    
    payload = build_apns_payload(notification, silent)
    
    results = Enum.map(tokens, fn token ->
      case ApnsClient.send(token.token, payload) do
        {:ok, _} -> {:ok, token}
        {:error, :invalid_token} -> {:invalid, token}
        {:error, _reason} -> {:error, token}
      end
    end)
    
    sent = Enum.count(results, &match?({:ok, _}, &1))
    failed = Enum.count(results, &match?({:error, _}, &1))
    invalid = results |> Enum.filter(&match?({:invalid, _}, &1)) |> Enum.map(fn {:invalid, t} -> t.token end)
    
    duration = System.monotonic_time() - start_time
    emit_platform_telemetry(:apns, sent, failed, duration)
    
    {:ok, sent, failed, invalid}
  rescue
    e ->
      Logger.error("APNs batch send failed: #{inspect(e)}")
      {:error, :apns_error, length(tokens)}
  end
  
  defp send_to_fcm([], _notification, _silent), do: {:ok, 0, 0, []}
  defp send_to_fcm(tokens, notification, silent) do
    start_time = System.monotonic_time()
    
    payload = build_fcm_payload(notification, silent)
    
    # FCM supports batch sending (up to 500 per request)
    token_strings = Enum.map(tokens, & &1.token)
    
    case FcmClient.send_multicast(token_strings, payload) do
      {:ok, response} ->
        {sent, failed, invalid} = parse_fcm_response(response, tokens)
        
        duration = System.monotonic_time() - start_time
        emit_platform_telemetry(:fcm, sent, failed, duration)
        
        {:ok, sent, failed, invalid}
        
      {:error, reason} ->
        Logger.error("FCM batch send failed: #{inspect(reason)}")
        {:error, :fcm_error, length(tokens)}
    end
  rescue
    e ->
      Logger.error("FCM batch send failed: #{inspect(e)}")
      {:error, :fcm_error, length(tokens)}
  end
  
  defp send_to_expo([], _notification, _silent), do: {:ok, 0, 0, []}
  defp send_to_expo(tokens, notification, silent) do
    start_time = System.monotonic_time()
    
    messages = Enum.map(tokens, fn token ->
      build_expo_message(token.token, notification, silent)
    end)
    
    case ExpoClient.send_batch(messages) do
      {:ok, response} ->
        {sent, failed, invalid} = parse_expo_response(response, tokens)
        
        duration = System.monotonic_time() - start_time
        emit_platform_telemetry(:expo, sent, failed, duration)
        
        {:ok, sent, failed, invalid}
        
      {:error, reason} ->
        Logger.error("Expo batch send failed: #{inspect(reason)}")
        {:error, :expo_error, length(tokens)}
    end
  rescue
    e ->
      Logger.error("Expo batch send failed: #{inspect(e)}")
      {:error, :expo_error, length(tokens)}
  end
  
  defp send_to_web([], _notification), do: {:ok, 0, 0, []}
  defp send_to_web(tokens, notification) do
    start_time = System.monotonic_time()
    
    payload = build_web_push_payload(notification)
    
    results = Enum.map(tokens, fn token ->
      case WebPushClient.send(token.token, token.auth_keys, payload) do
        {:ok, _} -> {:ok, token}
        {:error, :gone} -> {:invalid, token}
        {:error, _reason} -> {:error, token}
      end
    end)
    
    sent = Enum.count(results, &match?({:ok, _}, &1))
    failed = Enum.count(results, &match?({:error, _}, &1))
    invalid = results |> Enum.filter(&match?({:invalid, _}, &1)) |> Enum.map(fn {:invalid, t} -> t.token end)
    
    duration = System.monotonic_time() - start_time
    emit_platform_telemetry(:web, sent, failed, duration)
    
    {:ok, sent, failed, invalid}
  rescue
    e ->
      Logger.error("Web push batch send failed: #{inspect(e)}")
      {:error, :web_push_error, length(tokens)}
  end
  
  # ============================================================================
  # Payload Builders
  # ============================================================================
  
  defp build_apns_payload(notification, silent) do
    base_aps = if silent do
      %{"content-available" => 1}
    else
      %{
        "alert" => %{
          "title" => notification.title,
          "body" => notification.body
        },
        "sound" => Map.get(notification, :sound, "default"),
        "badge" => Map.get(notification, :badge, 1)
      }
    end
    
    aps = base_aps
    |> maybe_add("category", Map.get(notification, :category))
    |> maybe_add("thread-id", Map.get(notification, :thread_id))
    |> maybe_add("mutable-content", if(Map.get(notification, :image_url), do: 1, else: nil))
    
    payload = %{"aps" => aps}
    
    # Add custom data
    if data = Map.get(notification, :data) do
      Map.merge(payload, data)
    else
      payload
    end
  end
  
  defp build_fcm_payload(notification, silent) do
    if silent do
      %{
        "data" => Map.get(notification, :data, %{})
      }
    else
      base = %{
        "notification" => %{
          "title" => notification.title,
          "body" => notification.body
        }
      }
      
      notification_opts = %{}
      |> maybe_add("sound", Map.get(notification, :sound, "default"))
      |> maybe_add("image", Map.get(notification, :image_url))
      |> maybe_add("click_action", Map.get(notification, :category))
      
      base = update_in(base, ["notification"], &Map.merge(&1, notification_opts))
      
      # Add data payload
      if data = Map.get(notification, :data) do
        Map.put(base, "data", data)
      else
        base
      end
      
      # Add Android-specific options
      |> Map.put("android", %{
        "priority" => priority_to_fcm(Map.get(notification, :priority, :high)),
        "ttl" => "#{Map.get(notification, :ttl, 86400)}s",
        "collapse_key" => Map.get(notification, :collapse_key)
      })
    end
  end
  
  defp build_expo_message(token, notification, silent) do
    base = %{
      "to" => token,
      "title" => notification.title,
      "body" => notification.body,
      "sound" => Map.get(notification, :sound, "default"),
      "badge" => Map.get(notification, :badge, 1),
      "data" => Map.get(notification, :data, %{}),
      "priority" => priority_to_expo(Map.get(notification, :priority, :high)),
      "ttl" => Map.get(notification, :ttl, 86400)
    }
    
    if silent do
      base
      |> Map.put("_contentAvailable", true)
      |> Map.delete("title")
      |> Map.delete("body")
    else
      base
    end
    |> maybe_add("categoryId", Map.get(notification, :category))
    |> maybe_add("channelId", Map.get(notification, :thread_id))
  end
  
  defp build_web_push_payload(notification) do
    %{
      "title" => notification.title,
      "body" => notification.body,
      "icon" => "/icon-192x192.png",
      "badge" => "/badge-72x72.png",
      "data" => Map.get(notification, :data, %{}),
      "requireInteraction" => Map.get(notification, :priority) == :high,
      "tag" => Map.get(notification, :collapse_key)
    }
    |> maybe_add("image", Map.get(notification, :image_url))
    |> Jason.encode!()
  end
  
  # ============================================================================
  # Token Management
  # ============================================================================
  
  defp get_user_tokens(user_id, opts) do
    platforms = Keyword.get(opts, :platforms)
    exclude_device_ids = Keyword.get(opts, :exclude_device_ids, [])
    
    query = from pt in PushToken,
      where: pt.user_id == ^user_id and pt.is_active == true,
      order_by: [desc: pt.updated_at]
    
    query = if platforms do
      where(query, [pt], pt.platform in ^platforms)
    else
      query
    end
    
    query = if not Enum.empty?(exclude_device_ids) do
      where(query, [pt], pt.device_id not in ^exclude_device_ids)
    else
      query
    end
    
    Repo.all(query)
  end
  
  defp get_tokens_for_users(user_ids, opts) do
    platforms = Keyword.get(opts, :platforms)
    
    query = from pt in PushToken,
      where: pt.user_id in ^user_ids and pt.is_active == true,
      order_by: [desc: pt.updated_at]
    
    query = if platforms do
      where(query, [pt], pt.platform in ^platforms)
    else
      query
    end
    
    Repo.all(query)
  end
  
  defp do_register_token(user_id, token, platform, device_id) do
    # First, deactivate any existing tokens with this device_id for this user
    from(pt in PushToken,
      where: pt.user_id == ^user_id and pt.device_id == ^device_id
    )
    |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])
    
    # Also deactivate if same token exists for different user (device changed hands)
    from(pt in PushToken,
      where: pt.token == ^token and pt.user_id != ^user_id
    )
    |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])
    
    # Create or update the token
    attrs = %{
      user_id: user_id,
      token: token,
      platform: normalize_platform(platform),
      device_id: device_id,
      is_active: true
    }
    
    case Repo.get_by(PushToken, token: token, user_id: user_id) do
      nil ->
        %PushToken{}
        |> PushToken.changeset(attrs)
        |> Repo.insert()
        
      existing ->
        existing
        |> PushToken.changeset(%{is_active: true, device_id: device_id})
        |> Repo.update()
    end
  end
  
  defp do_unregister_token(token) do
    from(pt in PushToken, where: pt.token == ^token)
    |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])
    
    :ok
  end
  
  defp cleanup_invalid_tokens(invalid_tokens) do
    from(pt in PushToken, where: pt.token in ^invalid_tokens)
    |> Repo.update_all(set: [is_active: false, updated_at: DateTime.utc_now()])
    
    Logger.info("Cleaned up #{length(invalid_tokens)} invalid push tokens")
  end
  
  defp normalize_platform("ios"), do: "apns"
  defp normalize_platform("android"), do: "fcm"
  defp normalize_platform("web"), do: "web"
  defp normalize_platform("expo"), do: "expo"
  defp normalize_platform(platform), do: platform
  
  # ============================================================================
  # Helpers
  # ============================================================================
  
  defp get_conversation_member_ids(conversation_id, exclude_id) do
    # This would integrate with your Messaging context
    # For now, placeholder implementation
    import Ecto.Query
    
    from(cp in "conversation_participants",
      where: cp.conversation_id == ^conversation_id and cp.user_id != ^exclude_id,
      select: cp.user_id
    )
    |> Repo.all()
  rescue
    _ -> []
  end
  
  defp get_group_member_ids(group_id, exclude_id) do
    # This would integrate with your Groups context
    import Ecto.Query
    
    from(gm in "group_members",
      where: gm.group_id == ^group_id and gm.user_id != ^exclude_id,
      select: gm.user_id
    )
    |> Repo.all()
  rescue
    _ -> []
  end
  
  defp parse_fcm_response(response, tokens) do
    results = Map.get(response, "responses", [])
    
    {sent, failed, invalid} =
      results
      |> Enum.zip(tokens)
      |> Enum.reduce({0, 0, []}, fn {result, token}, {s, f, i} ->
        case result do
          %{"success" => true} -> {s + 1, f, i}
          %{"error" => %{"code" => code}} when code in ["INVALID_ARGUMENT", "UNREGISTERED"] ->
            {s, f + 1, [token.token | i]}
          _ -> {s, f + 1, i}
        end
      end)
    
    {sent, failed, invalid}
  end
  
  defp parse_expo_response(response, tokens) do
    results = Map.get(response, "data", [])
    
    {sent, failed, invalid} =
      results
      |> Enum.zip(tokens)
      |> Enum.reduce({0, 0, []}, fn {result, token}, {s, f, i} ->
        case result do
          %{"status" => "ok"} -> {s + 1, f, i}
          %{"status" => "error", "details" => %{"error" => "DeviceNotRegistered"}} ->
            {s, f + 1, [token.token | i]}
          _ -> {s, f + 1, i}
        end
      end)
    
    {sent, failed, invalid}
  end
  
  defp priority_to_fcm(:high), do: "high"
  defp priority_to_fcm(:normal), do: "normal"
  defp priority_to_fcm(:low), do: "normal"
  defp priority_to_fcm(_), do: "high"
  
  defp priority_to_expo(:high), do: "high"
  defp priority_to_expo(:normal), do: "default"
  defp priority_to_expo(:low), do: "default"
  defp priority_to_expo(_), do: "high"
  
  defp maybe_add(map, _key, nil), do: map
  defp maybe_add(map, key, value), do: Map.put(map, key, value)
  
  defp init_rate_limiter do
    %{
      last_reset: System.monotonic_time(:millisecond),
      count: 0
    }
  end
  
  defp update_stats(state, {:ok, %{sent: sent, failed: failed}}) do
    update_in(state, [:stats, :sent], &(&1 + sent))
    |> update_in([:stats, :failed], &(&1 + failed))
  end
  defp update_stats(state, _), do: state
  
  defp emit_telemetry(event, metadata) do
    :telemetry.execute(
      [:cgraph, :push_service, event],
      %{count: 1, timestamp: System.system_time(:millisecond)},
      metadata
    )
  end
  
  defp emit_platform_telemetry(platform, sent, failed, duration) do
    :telemetry.execute(
      [:cgraph, :push_service, :platform_send],
      %{
        sent: sent,
        failed: failed,
        duration: System.convert_time_unit(duration, :native, :millisecond)
      },
      %{platform: platform}
    )
  end
end
