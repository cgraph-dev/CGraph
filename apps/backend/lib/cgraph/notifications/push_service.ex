defmodule CGraph.Notifications.PushService do
  @moduledoc """
  Enterprise-grade Push Notification Service for CGraph.

  Supports APNs (iOS), FCM (Android), Web Push, and Expo Push.
  Features multi-platform delivery, batching, retry, token management,
  telemetry, and rate limiting.

  ## Configuration

      config :cgraph, CGraph.Notifications.PushService,
        fcm_server_key: System.get_env("FCM_SERVER_KEY"),
        apns_key_id: System.get_env("APNS_KEY_ID"),
        apns_team_id: System.get_env("APNS_TEAM_ID"),
        apns_bundle_id: "com.cgraph.app",
        expo_access_token: System.get_env("EXPO_ACCESS_TOKEN")

  ## Usage

      PushService.send_notification(user, %{
        title: "New Message",
        body: "John sent you a message",
        data: %{conversation_id: "abc123"}
      })
  """

  use GenServer

  require Logger

  alias CGraph.Accounts.User
  alias CGraph.Notifications.PushService.{CircuitBreakers, PlatformSenders, TokenManagement}

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

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Sends a push notification to a specific user on all their registered devices.
  """
  @spec send_notification(User.t(), notification(), keyword()) :: send_result()
  def send_notification(%User{} = user, notification, opts \\ []) do
    GenServer.call(__MODULE__, {:send, user.id, notification, opts}, :infinity)
  end

  @doc """
  Sends a push notification to a single device token on a specific platform.
  Used by the retry worker to re-attempt individual delivery.
  """
  @spec send_single(atom(), binary(), notification()) :: send_result()
  def send_single(platform, token, notification) when is_atom(platform) and is_binary(token) do
    GenServer.call(__MODULE__, {:send_single, platform, token, notification}, :infinity)
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
  @spec register_token(String.t(), String.t(), String.t(), String.t()) :: {:ok, any()} | {:error, term()}
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
  @spec init(keyword()) :: {:ok, map()}
  def init(_opts) do
    CircuitBreakers.install_all()

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
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
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
    user_ids = TokenManagement.get_conversation_member_ids(conversation_id, sender_id)
    result = do_broadcast(user_ids, notification, opts)
    state = update_stats(state, result)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:send_to_group, group_id, sender_id, notification, opts}, _from, state) do
    user_ids = TokenManagement.get_group_member_ids(group_id, sender_id)
    result = do_broadcast(user_ids, notification, opts)
    state = update_stats(state, result)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:register_token, user_id, token, platform, device_id}, _from, state) do
    result = TokenManagement.do_register_token(user_id, token, platform, device_id)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:unregister_token, token}, _from, state) do
    result = TokenManagement.do_unregister_token(token)
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
    tokens = TokenManagement.get_user_tokens(user_id, opts)

    if Enum.empty?(tokens) do
      Logger.debug("no_push_tokens", user_id: user_id)
      {:ok, %{sent: 0, failed: 0}}
    else
      send_to_tokens(tokens, notification, opts)
    end
  end

  defp do_broadcast(user_ids, notification, opts) do
    user_ids
    |> Enum.chunk_every(@batch_size)
    |> Enum.reduce({0, 0}, fn batch, {total_sent, total_failed} ->
      tokens = TokenManagement.get_tokens_for_users(batch, opts)

      {:ok, %{sent: sent, failed: failed}} = send_to_tokens(tokens, notification, opts)
      Process.sleep(@batch_delay_ms)
      {total_sent + sent, total_failed + failed}
    end)
    |> then(fn {sent, failed} -> {:ok, %{sent: sent, failed: failed}} end)
  end

  defp send_to_tokens(tokens, notification, opts) do
    silent = Keyword.get(opts, :silent, false)

    grouped = Enum.group_by(tokens, & &1.platform)

    tasks = [
      Task.Supervisor.async(CGraph.TaskSupervisor, fn -> PlatformSenders.send_to_apns(Map.get(grouped, "apns", []), notification, silent) end),
      Task.Supervisor.async(CGraph.TaskSupervisor, fn -> PlatformSenders.send_to_fcm(Map.get(grouped, "fcm", []), notification, silent) end),
      Task.Supervisor.async(CGraph.TaskSupervisor, fn -> PlatformSenders.send_to_expo(Map.get(grouped, "expo", []), notification, silent) end),
      Task.Supervisor.async(CGraph.TaskSupervisor, fn -> PlatformSenders.send_to_web(Map.get(grouped, "web", []), notification) end)
    ]

    results = Task.await_many(tasks, 30_000)

    {total_sent, total_failed, invalid_tokens} =
      Enum.reduce(results, {0, 0, []}, fn
        {:ok, sent, failed, invalid}, {ts, tf, ti} ->
          {ts + sent, tf + failed, ti ++ invalid}
        {:error, _reason, count}, {ts, tf, ti} ->
          {ts, tf + count, ti}
      end)

    if not Enum.empty?(invalid_tokens) do
      Task.start(fn -> TokenManagement.cleanup_invalid_tokens(invalid_tokens) end)
    end

    emit_telemetry(:push_sent, %{sent: total_sent, failed: total_failed})
    {:ok, %{sent: total_sent, failed: total_failed}}
  end

  # ============================================================================
  # Helpers
  # ============================================================================

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
end
