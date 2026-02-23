defmodule CGraph.Notifications.PushService.FcmClient do
  @moduledoc """
  Firebase Cloud Messaging (FCM) HTTP v1 API Client.

  Handles push notification delivery to Android devices via FCM.
  Uses service account authentication with OAuth 2.0.

  ## Configuration

      config :cgraph, CGraph.Notifications.PushService,
        fcm_project_id: "your-project-id",
        fcm_service_account_path: "/path/to/service-account.json",
        # or
        fcm_service_account: %{...}

  ## Features

  - HTTP v1 API (recommended by Google)
  - OAuth 2.0 authentication with token refresh
  - Multicast support (up to 500 tokens per request)
  - Topic messaging
  - Condition-based targeting
  - Data-only messages for background processing
  - Android-specific notification options

  Implementation is split across submodules:

  - `FcmClient.Auth` — OAuth 2.0 token management
  - `FcmClient.Http` — HTTP transport and response handling
  - `FcmClient.MessageBuilder` — FCM message payload construction
  """

  use GenServer

  require Logger

  alias CGraph.Notifications.PushService.FcmClient.{Auth, Http, MessageBuilder}

  @default_timeout 30_000
  @max_retries 3
  @batch_size 500

  # ============================================================================
  # Client API
  # ============================================================================

  @doc "Starts the process and links it to the current process."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Sends a push notification to a single FCM token.

  ## Parameters

  - `token` - The FCM registration token
  - `payload` - The notification payload
  - `opts` - Optional keyword list

  ## Options

  - `:dry_run` - If true, validates but doesn't send (default: false)

  ## Returns

  - `{:ok, message_id}` - Notification was accepted
  - `{:error, reason}` - Notification failed
  """
  @doc "Sends a push notification via Firebase Cloud Messaging."
  @spec send(String.t(), map(), keyword()) :: {:ok, String.t()} | {:error, atom()}
  def send(token, payload, opts \\ []) do
    GenServer.call(__MODULE__, {:send, token, payload, opts}, @default_timeout)
  end

  @doc """
  Sends a notification to multiple tokens in a single API call.
  FCM supports up to 500 tokens per multicast request.

  ## Parameters

  - `tokens` - List of FCM registration tokens (max 500)
  - `payload` - The notification payload

  ## Returns

  - `{:ok, response}` - Contains success/failure counts and details
  - `{:error, reason}` - Request failed entirely
  """
  @spec send_multicast(list(String.t()), map()) :: {:ok, map()} | {:error, term()}
  def send_multicast(tokens, payload) when length(tokens) <= @batch_size do
    GenServer.call(__MODULE__, {:send_multicast, tokens, payload}, @default_timeout * 2)
  end

  def send_multicast(tokens, payload) when length(tokens) > @batch_size do
    # Split into batches
    tokens
    |> Enum.chunk_every(@batch_size)
    |> Enum.reduce({:ok, %{"responses" => [], "successCount" => 0, "failureCount" => 0}}, fn
      batch, {:ok, acc} ->
        case send_multicast(batch, payload) do
          {:ok, result} ->
            {:ok, merge_multicast_results(acc, result)}
          {:error, _} = err ->
            err
        end
      _batch, error ->
        error
    end)
  end

  @doc """
  Sends a notification to a topic.
  All devices subscribed to the topic will receive the notification.
  """
  @spec send_to_topic(String.t(), map()) :: {:ok, String.t()} | {:error, term()}
  def send_to_topic(topic, payload) do
    GenServer.call(__MODULE__, {:send_to_topic, topic, payload}, @default_timeout)
  end

  @doc """
  Sends a notification based on a condition.
  Conditions allow combining topics with logical operators.

  ## Examples

      send_to_condition("'topic_a' in topics && 'topic_b' in topics", payload)
  """
  @spec send_to_condition(String.t(), map()) :: {:ok, String.t()} | {:error, term()}
  def send_to_condition(condition, payload) do
    GenServer.call(__MODULE__, {:send_to_condition, condition, payload}, @default_timeout)
  end

  @doc """
  Returns current connection status and stats.
  """
  @spec status() :: map()
  def status do
    GenServer.call(__MODULE__, :status)
  end

  # ============================================================================
  # GenServer Callbacks
  # ============================================================================

  @impl true
  @spec init(keyword()) :: {:ok, map()}
  def init(_opts) do
    config = load_config()

    state = %{
      config: config,
      access_token: nil,
      token_expires_at: nil,
      stats: %{sent: 0, failed: 0, last_error: nil}
    }

    # Get initial access token
    state = Auth.refresh_access_token(state)

    Logger.info("fcm_client_started", project_id: config[:project_id])
    {:ok, state}
  end

  @impl true
  @doc "Handles synchronous call messages."
  @spec handle_call({:send, String.t(), map(), keyword()}, GenServer.from(), map()) :: {:reply, {:ok, String.t()} | {:error, atom()}, map()}
  def handle_call({:send, token, payload, opts}, _from, state) do
    state = Auth.ensure_valid_token(state)

    message = MessageBuilder.build_message(%{"token" => token}, payload)
    {result, state} = do_send_message(message, opts, state, 0)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:send_multicast, tokens, payload}, _from, state) do
    state = Auth.ensure_valid_token(state)

    # FCM v1 doesn't have native multicast - we send individually but in parallel
    tasks = Enum.map(tokens, fn token ->
      Task.Supervisor.async(CGraph.TaskSupervisor, fn ->
        message = MessageBuilder.build_message(%{"token" => token}, payload)
        Http.send_request(message, state, false)
      end)
    end)

    results = Task.await_many(tasks, @default_timeout)

    responses = Enum.map(results, fn
      {:ok, message_id} -> %{"success" => true, "messageId" => message_id}
      {:error, reason} -> %{"success" => false, "error" => %{"code" => to_string(reason)}}
    end)

    success_count = Enum.count(responses, &(&1["success"]))
    failure_count = length(responses) - success_count

    state = update_stats(state, success_count, failure_count)

    response = %{
      "responses" => responses,
      "successCount" => success_count,
      "failureCount" => failure_count
    }

    {:reply, {:ok, response}, state}
  end

  @impl true
  def handle_call({:send_to_topic, topic, payload}, _from, state) do
    state = Auth.ensure_valid_token(state)

    message = MessageBuilder.build_message(%{"topic" => topic}, payload)
    {result, state} = do_send_message(message, [], state, 0)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:send_to_condition, condition, payload}, _from, state) do
    state = Auth.ensure_valid_token(state)

    message = MessageBuilder.build_message(%{"condition" => condition}, payload)
    {result, state} = do_send_message(message, [], state, 0)
    {:reply, result, state}
  end

  @impl true
  def handle_call(:status, _from, state) do
    status = %{
      project_id: state.config[:project_id],
      token_valid: Auth.token_valid?(state),
      token_expires_in: Auth.token_expires_in(state),
      stats: state.stats
    }
    {:reply, status, state}
  end

  # ============================================================================
  # Private Implementation
  # ============================================================================

  defp do_send_message(message, opts, state, retry_count) when retry_count < @max_retries do
    dry_run = Keyword.get(opts, :dry_run, false)

    case Http.send_request(message, state, dry_run) do
      {:ok, message_id} ->
        state = update_stats(state, 1, 0)
        {{:ok, message_id}, state}

      {:error, :unauthorized} ->
        state = Auth.refresh_access_token(state)
        do_send_message(message, opts, state, retry_count + 1)

      {:error, :quota_exceeded} ->
        Logger.warning("FCM quota exceeded - backing off")
        Process.sleep(1000 * (retry_count + 1))
        do_send_message(message, opts, state, retry_count + 1)

      {:error, :unavailable} ->
        Logger.warning("FCM service unavailable - retrying")
        Process.sleep(500 * (retry_count + 1))
        do_send_message(message, opts, state, retry_count + 1)

      {:error, reason} = err ->
        state = update_stats(state, 0, 1, reason)
        {err, state}
    end
  end

  defp do_send_message(_message, _opts, state, _retry_count) do
    state = update_stats(state, 0, 1, :max_retries)
    {{:error, :max_retries}, state}
  end

  defp load_config do
    config = Application.get_env(:cgraph, CGraph.Notifications.PushService, [])

    %{
      project_id: Keyword.get(config, :fcm_project_id),
      service_account_path: Keyword.get(config, :fcm_service_account_path),
      service_account: Keyword.get(config, :fcm_service_account)
    }
  end

  defp merge_multicast_results(acc, result) do
    %{
      "responses" => acc["responses"] ++ result["responses"],
      "successCount" => acc["successCount"] + (result["successCount"] || 0),
      "failureCount" => acc["failureCount"] + (result["failureCount"] || 0)
    }
  end

  defp update_stats(state, sent, failed, error \\ nil) do
    state
    |> update_in([:stats, :sent], &(&1 + sent))
    |> update_in([:stats, :failed], &(&1 + failed))
    |> put_in([:stats, :last_error], error)
  end
end
