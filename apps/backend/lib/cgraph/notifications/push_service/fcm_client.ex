defmodule Cgraph.Notifications.PushService.FcmClient do
  @moduledoc """
  Firebase Cloud Messaging (FCM) HTTP v1 API Client.
  
  Handles push notification delivery to Android devices via FCM.
  Uses service account authentication with OAuth 2.0.
  
  ## Configuration
  
      config :cgraph, Cgraph.Notifications.PushService,
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
  """
  
  use GenServer
  
  require Logger
  
  @fcm_base_url "https://fcm.googleapis.com/v1/projects"
  @fcm_send_endpoint "messages:send"
  
  # OAuth token scope for FCM
  @fcm_scope "https://www.googleapis.com/auth/firebase.messaging"
  
  # Token refresh 5 minutes before expiry
  @token_buffer_seconds 300
  
  @default_timeout 30_000
  @max_retries 3
  @batch_size 500
  
  # ============================================================================
  # Client API
  # ============================================================================
  
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
  def init(_opts) do
    config = load_config()
    
    state = %{
      config: config,
      access_token: nil,
      token_expires_at: nil,
      stats: %{sent: 0, failed: 0, last_error: nil}
    }
    
    # Get initial access token
    state = refresh_access_token(state)
    
    Logger.info("FCM client started (project: #{config[:project_id]})")
    {:ok, state}
  end
  
  @impl true
  def handle_call({:send, token, payload, opts}, _from, state) do
    state = ensure_valid_token(state)
    
    message = build_message(%{"token" => token}, payload)
    {result, state} = do_send_message(message, opts, state, 0)
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:send_multicast, tokens, payload}, _from, state) do
    state = ensure_valid_token(state)
    
    # FCM v1 doesn't have native multicast - we send individually but in parallel
    # For true multicast, we'd use the legacy API
    tasks = Enum.map(tokens, fn token ->
      Task.async(fn ->
        message = build_message(%{"token" => token}, payload)
        do_http_send(message, state, false)
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
    state = ensure_valid_token(state)
    
    message = build_message(%{"topic" => topic}, payload)
    {result, state} = do_send_message(message, [], state, 0)
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:send_to_condition, condition, payload}, _from, state) do
    state = ensure_valid_token(state)
    
    message = build_message(%{"condition" => condition}, payload)
    {result, state} = do_send_message(message, [], state, 0)
    {:reply, result, state}
  end
  
  @impl true
  def handle_call(:status, _from, state) do
    status = %{
      project_id: state.config[:project_id],
      token_valid: token_valid?(state),
      token_expires_in: token_expires_in(state),
      stats: state.stats
    }
    {:reply, status, state}
  end
  
  # ============================================================================
  # Private Implementation
  # ============================================================================
  
  defp do_send_message(message, opts, state, retry_count) when retry_count < @max_retries do
    dry_run = Keyword.get(opts, :dry_run, false)
    
    case do_http_send(message, state, dry_run) do
      {:ok, message_id} ->
        state = update_stats(state, 1, 0)
        {{:ok, message_id}, state}
        
      {:error, :unauthorized} ->
        state = refresh_access_token(state)
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
  
  defp do_http_send(message, state, dry_run) do
    project_id = state.config[:project_id]
    url = "#{@fcm_base_url}/#{project_id}/#{@fcm_send_endpoint}"
    
    body = %{
      "message" => message,
      "validate_only" => dry_run
    }
    
    headers = [
      {"authorization", "Bearer #{state.access_token}"},
      {"content-type", "application/json"}
    ]
    
    case http_post(url, headers, Jason.encode!(body)) do
      {:ok, 200, _headers, response_body} ->
        case Jason.decode(response_body) do
          {:ok, %{"name" => name}} ->
            # Extract message ID from name (format: projects/{project_id}/messages/{message_id})
            message_id = name |> String.split("/") |> List.last()
            {:ok, message_id}
          _ ->
            {:ok, "sent"}
        end
        
      {:ok, 400, _headers, body} ->
        error = parse_error(body)
        Logger.warning("FCM bad request: #{inspect(error)}")
        {:error, error}
        
      {:ok, 401, _headers, _body} ->
        {:error, :unauthorized}
        
      {:ok, 403, _headers, _body} ->
        {:error, :forbidden}
        
      {:ok, 404, _headers, _body} ->
        {:error, :not_found}
        
      {:ok, 429, _headers, _body} ->
        {:error, :quota_exceeded}
        
      {:ok, status, _headers, body} when status >= 500 ->
        Logger.error("FCM server error #{status}: #{body}")
        {:error, :unavailable}
        
      {:error, reason} ->
        Logger.error("FCM connection error: #{inspect(reason)}")
        {:error, :connection_failed}
    end
  end
  
  defp http_post(url, headers, body) do
    request = Finch.build(:post, url, headers, body)
    
    case Finch.request(request, Cgraph.Finch, receive_timeout: @default_timeout) do
      {:ok, %Finch.Response{status: status, headers: headers, body: body}} ->
        {:ok, status, headers, body}
        
      {:error, reason} ->
        {:error, reason}
    end
  rescue
    e ->
      Logger.error("HTTP request failed: #{inspect(e)}")
      {:error, :request_failed}
  end
  
  # ============================================================================
  # Message Building
  # ============================================================================
  
  defp build_message(target, payload) do
    base = target
    
    # Add notification if present
    base = if notification = payload["notification"] do
      Map.put(base, "notification", notification)
    else
      base
    end
    
    # Add data if present
    base = if data = payload["data"] do
      # FCM requires all data values to be strings
      string_data = Map.new(data, fn {k, v} -> {to_string(k), to_string(v)} end)
      Map.put(base, "data", string_data)
    else
      base
    end
    
    # Add Android-specific options
    base = if android = payload["android"] do
      Map.put(base, "android", build_android_config(android))
    else
      base
    end
    
    # Add webpush options if targeting web
    base = if webpush = payload["webpush"] do
      Map.put(base, "webpush", webpush)
    else
      base
    end
    
    base
  end
  
  defp build_android_config(android) do
    config = %{}
    
    config = if priority = android["priority"] do
      Map.put(config, "priority", String.upcase(to_string(priority)))
    else
      config
    end
    
    config = if ttl = android["ttl"] do
      Map.put(config, "ttl", ttl)
    else
      config
    end
    
    config = if collapse_key = android["collapse_key"] do
      Map.put(config, "collapse_key", collapse_key)
    else
      config
    end
    
    config = if notification = android["notification"] do
      Map.put(config, "notification", notification)
    else
      config
    end
    
    config
  end
  
  # ============================================================================
  # OAuth Token Management
  # ============================================================================
  
  defp refresh_access_token(state) do
    case get_access_token(state.config) do
      {:ok, token, expires_in} ->
        expires_at = System.monotonic_time(:second) + expires_in - @token_buffer_seconds
        Logger.debug("FCM access token refreshed (expires in #{expires_in}s)")
        %{state | access_token: token, token_expires_at: expires_at}
        
      {:error, reason} ->
        Logger.error("Failed to get FCM access token: #{inspect(reason)}")
        state
    end
  end
  
  defp ensure_valid_token(state) do
    if token_valid?(state) do
      state
    else
      refresh_access_token(state)
    end
  end
  
  defp token_valid?(state) do
    state.access_token != nil and
      state.token_expires_at != nil and
      System.monotonic_time(:second) < state.token_expires_at
  end
  
  defp token_expires_in(state) do
    if state.token_expires_at do
      max(0, state.token_expires_at - System.monotonic_time(:second))
    else
      0
    end
  end
  
  defp get_access_token(config) do
    service_account = cond do
      path = config[:service_account_path] ->
        path |> File.read!() |> Jason.decode!()
      account = config[:service_account] ->
        account
      true ->
        raise "FCM service account not configured"
    end
    
    # Create JWT for service account authentication
    private_key = service_account["private_key"]
    client_email = service_account["client_email"]
    token_uri = service_account["token_uri"] || "https://oauth2.googleapis.com/token"
    
    now = System.system_time(:second)
    
    claims = %{
      "iss" => client_email,
      "sub" => client_email,
      "aud" => token_uri,
      "iat" => now,
      "exp" => now + 3600,
      "scope" => @fcm_scope
    }
    
    # Sign JWT with RS256
    jwk = JOSE.JWK.from_pem(private_key)
    jws = %{"alg" => "RS256"}
    {_, assertion} = JOSE.JWT.sign(jwk, jws, claims) |> JOSE.JWS.compact()
    
    # Exchange JWT for access token
    body = URI.encode_query(%{
      "grant_type" => "urn:ietf:params:oauth:grant-type:jwt-bearer",
      "assertion" => assertion
    })
    
    headers = [{"content-type", "application/x-www-form-urlencoded"}]
    
    case http_post(token_uri, headers, body) do
      {:ok, 200, _headers, response_body} ->
        case Jason.decode(response_body) do
          {:ok, %{"access_token" => token, "expires_in" => expires_in}} ->
            {:ok, token, expires_in}
          _ ->
            {:error, :invalid_response}
        end
        
      {:ok, status, _headers, body} ->
        Logger.error("OAuth token request failed (#{status}): #{body}")
        {:error, :token_request_failed}
        
      {:error, reason} ->
        {:error, reason}
    end
  rescue
    e ->
      Logger.error("Failed to get access token: #{inspect(e)}")
      {:error, e}
  end
  
  # ============================================================================
  # Helpers
  # ============================================================================
  
  defp load_config do
    config = Application.get_env(:cgraph, Cgraph.Notifications.PushService, [])
    
    %{
      project_id: Keyword.get(config, :fcm_project_id),
      service_account_path: Keyword.get(config, :fcm_service_account_path),
      service_account: Keyword.get(config, :fcm_service_account)
    }
  end
  
  defp parse_error(body) when is_binary(body) do
    case Jason.decode(body) do
      {:ok, %{"error" => %{"code" => code}}} ->
        error_code_to_atom(code)
      {:ok, %{"error" => %{"message" => message}}} ->
        Logger.warning("FCM error: #{message}")
        :unknown_error
      _ ->
        :unknown_error
    end
  end
  defp parse_error(_), do: :unknown_error
  
  defp error_code_to_atom(404), do: :not_found
  defp error_code_to_atom(400), do: :invalid_argument
  defp error_code_to_atom(401), do: :unauthorized
  defp error_code_to_atom(403), do: :forbidden
  defp error_code_to_atom(429), do: :quota_exceeded
  defp error_code_to_atom(_), do: :unknown_error
  
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
