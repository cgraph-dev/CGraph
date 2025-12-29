defmodule Cgraph.RequestContext do
  @moduledoc """
  Cgraph.RequestContext - Request Context Propagation System
  
  ## Overview
  
  This module provides comprehensive request context management for distributed
  tracing, multi-tenancy, user context propagation, and cross-service request
  correlation. It ensures context flows seamlessly through async operations,
  background jobs, and external service calls.
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     Request Lifecycle                           │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Incoming Request ──▶ Context Extraction ──▶ Context Storage   │
  │                              │                     │            │
  │                              ▼                     ▼            │
  │                      ┌─────────────────────────────────┐       │
  │                      │      Process Dictionary         │       │
  │                      │  ┌─────────────────────────┐    │       │
  │                      │  │ • request_id            │    │       │
  │                      │  │ • trace_id              │    │       │
  │                      │  │ • span_id               │    │       │
  │                      │  │ • user_id               │    │       │
  │                      │  │ • tenant_id             │    │       │
  │                      │  │ • correlation_id        │    │       │
  │                      │  │ • metadata              │    │       │
  │                      │  └─────────────────────────┘    │       │
  │                      └─────────────────────────────────┘       │
  │                              │                                  │
  │     ┌────────────────────────┼────────────────────────┐        │
  │     ▼                        ▼                        ▼        │
  │  Controller         Background Job              HTTP Client    │
  │  Processing         (with context)              (headers)      │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Features
  
  1. **Request ID Tracking**: Unique identifier for each request, propagated
     through all operations for end-to-end tracing.
  
  2. **Distributed Tracing**: W3C Trace Context compatible trace and span IDs
     for integration with distributed tracing systems.
  
  3. **Multi-Tenancy**: Tenant context isolation with automatic scoping for
     database queries and external service calls.
  
  4. **User Context**: Current user information available throughout the
     request lifecycle without explicit parameter passing.
  
  5. **Async Propagation**: Context automatically flows to spawned processes,
     tasks, and background jobs.
  
  ## Usage Examples
  
  ### In Plug Pipeline
  
      plug CgraphWeb.Plugs.RequestContext
  
  ### Accessing Context
  
      # Get current request ID
      request_id = Cgraph.RequestContext.get_request_id()
      
      # Get current user
      user = Cgraph.RequestContext.get_current_user()
      
      # Get tenant
      tenant_id = Cgraph.RequestContext.get_tenant_id()
  
  ### Spawning with Context
  
      # Context automatically propagates to spawned tasks
      Cgraph.RequestContext.spawn_with_context(fn ->
        # Context available here
        Logger.info("Request: \#{Cgraph.RequestContext.get_request_id()}")
      end)
  
  ### HTTP Client Headers
  
      # Get headers to propagate to external services
      headers = Cgraph.RequestContext.propagation_headers()
      HTTPClient.get(url, headers)
  
  ## Configuration
  
  Configure in `config/config.exs`:
  
      config :cgraph, Cgraph.RequestContext,
        enabled: true,
        generate_request_id: true,
        trace_header: "traceparent",
        request_id_header: "x-request-id",
        tenant_header: "x-tenant-id"
  
  ## Implementation Notes
  
  - Uses process dictionary for zero-overhead context access
  - Compatible with W3C Trace Context specification
  - Integrates with Logger metadata for automatic log correlation
  - Thread-safe for concurrent request processing
  """
  
  require Logger
  
  # ---------------------------------------------------------------------------
  # Type Definitions
  # ---------------------------------------------------------------------------
  
  @type request_id :: String.t()
  @type trace_id :: String.t()
  @type span_id :: String.t()
  @type user_id :: String.t()
  @type tenant_id :: String.t()
  
  @type context :: %{
    request_id: request_id(),
    trace_id: trace_id() | nil,
    span_id: span_id() | nil,
    parent_span_id: span_id() | nil,
    user_id: user_id() | nil,
    tenant_id: tenant_id() | nil,
    correlation_id: String.t() | nil,
    started_at: DateTime.t(),
    metadata: map()
  }
  
  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------
  
  @context_key :cgraph_request_context
  
  @default_config %{
    enabled: true,
    generate_request_id: true,
    trace_header: "traceparent",
    request_id_header: "x-request-id",
    correlation_id_header: "x-correlation-id",
    tenant_header: "x-tenant-id",
    user_header: "x-user-id"
  }
  
  # ---------------------------------------------------------------------------
  # Context Initialization
  # ---------------------------------------------------------------------------
  
  @doc """
  Initialize a new request context.
  
  This is typically called by the RequestContext plug at the start of
  each request. It extracts context from headers and initializes the
  process dictionary.
  
  ## Examples
  
      Cgraph.RequestContext.init()
      Cgraph.RequestContext.init(%{
        request_id: "req_abc123",
        user_id: "user_456",
        tenant_id: "tenant_789"
      })
  """
  @spec init(map()) :: context()
  def init(opts \\ %{}) do
    context = %{
      request_id: opts[:request_id] || generate_request_id(),
      trace_id: opts[:trace_id],
      span_id: opts[:span_id] || generate_span_id(),
      parent_span_id: opts[:parent_span_id],
      user_id: opts[:user_id],
      tenant_id: opts[:tenant_id],
      correlation_id: opts[:correlation_id],
      started_at: DateTime.utc_now(),
      metadata: opts[:metadata] || %{}
    }
    
    put_context(context)
    update_logger_metadata(context)
    
    context
  end
  
  @doc """
  Initialize context from a Plug connection.
  
  Extracts trace context, request ID, and other context from request headers.
  """
  @spec init_from_conn(Plug.Conn.t()) :: {context(), Plug.Conn.t()}
  def init_from_conn(conn) do
    # Extract headers
    request_id = get_header(conn, get_config(:request_id_header)) || generate_request_id()
    correlation_id = get_header(conn, get_config(:correlation_id_header))
    tenant_id = get_header(conn, get_config(:tenant_header))
    user_id = get_header(conn, get_config(:user_header))
    
    # Parse W3C Trace Context
    {trace_id, parent_span_id} = parse_traceparent(conn)
    
    context = init(%{
      request_id: request_id,
      trace_id: trace_id,
      parent_span_id: parent_span_id,
      correlation_id: correlation_id,
      tenant_id: tenant_id,
      user_id: user_id
    })
    
    # Add context to conn for access in controllers
    conn = Plug.Conn.put_private(conn, @context_key, context)
    
    # Add response headers
    conn = conn
    |> Plug.Conn.put_resp_header("x-request-id", context.request_id)
    |> maybe_add_trace_header(context)
    
    {context, conn}
  end
  
  @doc """
  Clean up context at the end of a request.
  """
  @spec cleanup() :: :ok
  def cleanup do
    Process.delete(@context_key)
    Logger.metadata([])
    :ok
  end
  
  # ---------------------------------------------------------------------------
  # Context Access
  # ---------------------------------------------------------------------------
  
  @doc """
  Get the full request context.
  """
  @spec get() :: context() | nil
  def get do
    Process.get(@context_key)
  end
  
  @doc """
  Get the current request ID.
  """
  @spec get_request_id() :: request_id() | nil
  def get_request_id do
    case get() do
      %{request_id: id} -> id
      _ -> nil
    end
  end
  
  @doc """
  Get the current trace ID.
  """
  @spec get_trace_id() :: trace_id() | nil
  def get_trace_id do
    case get() do
      %{trace_id: id} -> id
      _ -> nil
    end
  end
  
  @doc """
  Get the current span ID.
  """
  @spec get_span_id() :: span_id() | nil
  def get_span_id do
    case get() do
      %{span_id: id} -> id
      _ -> nil
    end
  end
  
  @doc """
  Get the current user ID.
  """
  @spec get_user_id() :: user_id() | nil
  def get_user_id do
    case get() do
      %{user_id: id} -> id
      _ -> nil
    end
  end
  
  @doc """
  Get the current user (full user struct if set).
  """
  @spec get_current_user() :: map() | nil
  def get_current_user do
    case get() do
      %{metadata: %{current_user: user}} -> user
      _ -> nil
    end
  end
  
  @doc """
  Get the current tenant ID.
  """
  @spec get_tenant_id() :: tenant_id() | nil
  def get_tenant_id do
    case get() do
      %{tenant_id: id} -> id
      _ -> nil
    end
  end
  
  @doc """
  Get the correlation ID.
  """
  @spec get_correlation_id() :: String.t() | nil
  def get_correlation_id do
    case get() do
      %{correlation_id: id} -> id
      _ -> nil
    end
  end
  
  @doc """
  Get custom metadata value.
  """
  @spec get_metadata(atom()) :: term()
  def get_metadata(key) do
    case get() do
      %{metadata: metadata} -> Map.get(metadata, key)
      _ -> nil
    end
  end
  
  @doc """
  Get request duration in milliseconds.
  """
  @spec get_duration_ms() :: float() | nil
  def get_duration_ms do
    case get() do
      %{started_at: started} ->
        DateTime.diff(DateTime.utc_now(), started, :microsecond) / 1000
      _ ->
        nil
    end
  end
  
  # ---------------------------------------------------------------------------
  # Context Modification
  # ---------------------------------------------------------------------------
  
  @doc """
  Set the current user.
  
  Called after authentication to associate a user with the request context.
  """
  @spec set_user(map()) :: :ok
  def set_user(user) when is_map(user) do
    update(fn context ->
      %{context |
        user_id: user[:id] || user["id"],
        metadata: Map.put(context.metadata, :current_user, user)
      }
    end)
  end
  
  @doc """
  Set the tenant ID.
  """
  @spec set_tenant(tenant_id()) :: :ok
  def set_tenant(tenant_id) do
    update(fn context ->
      %{context | tenant_id: tenant_id}
    end)
  end
  
  @doc """
  Add custom metadata to the context.
  """
  @spec put_metadata(atom(), term()) :: :ok
  def put_metadata(key, value) do
    update(fn context ->
      %{context | metadata: Map.put(context.metadata, key, value)}
    end)
  end
  
  @doc """
  Merge multiple metadata values.
  """
  @spec merge_metadata(map()) :: :ok
  def merge_metadata(metadata) when is_map(metadata) do
    update(fn context ->
      %{context | metadata: Map.merge(context.metadata, metadata)}
    end)
  end
  
  defp update(fun) do
    case get() do
      nil ->
        :ok
        
      context ->
        new_context = fun.(context)
        put_context(new_context)
        update_logger_metadata(new_context)
        :ok
    end
  end
  
  # ---------------------------------------------------------------------------
  # Context Propagation
  # ---------------------------------------------------------------------------
  
  @doc """
  Create a new child span within the current trace.
  
  Used when you want to track a sub-operation within the same request.
  """
  @spec create_child_span() :: context() | nil
  def create_child_span do
    case get() do
      nil ->
        nil
        
      context ->
        %{context |
          parent_span_id: context.span_id,
          span_id: generate_span_id()
        }
    end
  end
  
  @doc """
  Get headers for propagating context to external HTTP services.
  
  Returns headers compatible with W3C Trace Context and common correlation headers.
  
  ## Examples
  
      headers = Cgraph.RequestContext.propagation_headers()
      Finch.build(:get, url, headers, nil)
      |> Finch.request(Cgraph.Finch)
  """
  @spec propagation_headers() :: [{String.t(), String.t()}]
  def propagation_headers do
    context = get()
    
    headers = [
      {"x-request-id", context && context.request_id},
      {"x-correlation-id", context && (context.correlation_id || context.request_id)},
      {"x-tenant-id", context && context.tenant_id},
      {"x-user-id", context && context.user_id}
    ]
    
    headers = if context && context.trace_id do
      traceparent = format_traceparent(context)
      [{"traceparent", traceparent} | headers]
    else
      headers
    end
    
    headers
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
  end
  
  @doc """
  Execute a function with the current context.
  
  Captures the current context and ensures it's available in the function,
  even if executed in a different process.
  """
  @spec with_context((-> result)) :: result when result: term()
  def with_context(fun) do
    context = get()
    
    try do
      if context, do: put_context(context)
      if context, do: update_logger_metadata(context)
      fun.()
    after
      cleanup()
    end
  end
  
  @doc """
  Spawn a new process with the current context.
  
  The spawned process will have access to the same request context.
  """
  @spec spawn_with_context((-> any())) :: pid()
  def spawn_with_context(fun) do
    context = get()
    
    spawn(fn ->
      if context, do: put_context(context)
      if context, do: update_logger_metadata(context)
      fun.()
    end)
  end
  
  @doc """
  Spawn a linked process with the current context.
  """
  @spec spawn_link_with_context((-> any())) :: pid()
  def spawn_link_with_context(fun) do
    context = get()
    
    spawn_link(fn ->
      if context, do: put_context(context)
      if context, do: update_logger_metadata(context)
      fun.()
    end)
  end
  
  @doc """
  Start a Task with the current context.
  """
  @spec async_with_context((-> result)) :: Task.t() when result: term()
  def async_with_context(fun) do
    context = get()
    
    Task.async(fn ->
      if context, do: put_context(context)
      if context, do: update_logger_metadata(context)
      fun.()
    end)
  end
  
  @doc """
  Get context suitable for passing to a background job.
  
  Returns a map that can be serialized and passed as job arguments.
  """
  @spec job_context() :: map()
  def job_context do
    case get() do
      nil ->
        %{}
        
      context ->
        %{
          request_id: context.request_id,
          trace_id: context.trace_id,
          span_id: context.span_id,
          user_id: context.user_id,
          tenant_id: context.tenant_id,
          correlation_id: context.correlation_id
        }
        |> Enum.reject(fn {_k, v} -> is_nil(v) end)
        |> Map.new()
    end
  end
  
  @doc """
  Restore context from job arguments.
  
  Used in background job workers to restore the request context.
  """
  @spec restore_from_job(map()) :: context()
  def restore_from_job(args) do
    init(%{
      request_id: args["request_id"] || args[:request_id] || generate_request_id(),
      trace_id: args["trace_id"] || args[:trace_id],
      span_id: generate_span_id(),
      parent_span_id: args["span_id"] || args[:span_id],
      user_id: args["user_id"] || args[:user_id],
      tenant_id: args["tenant_id"] || args[:tenant_id],
      correlation_id: args["correlation_id"] || args[:correlation_id]
    })
  end
  
  # ---------------------------------------------------------------------------
  # W3C Trace Context
  # ---------------------------------------------------------------------------
  
  @doc """
  Parse W3C Trace Context traceparent header.
  
  Format: version-trace_id-span_id-trace_flags
  Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
  """
  @spec parse_traceparent(Plug.Conn.t() | String.t()) :: {trace_id() | nil, span_id() | nil}
  def parse_traceparent(%Plug.Conn{} = conn) do
    header = get_header(conn, get_config(:trace_header))
    parse_traceparent(header)
  end
  
  def parse_traceparent(nil), do: {nil, nil}
  def parse_traceparent(traceparent) when is_binary(traceparent) do
    case String.split(traceparent, "-") do
      [_version, trace_id, parent_id, _flags] when byte_size(trace_id) == 32 and byte_size(parent_id) == 16 ->
        {trace_id, parent_id}
        
      _ ->
        {nil, nil}
    end
  end
  
  @doc """
  Format context as W3C traceparent header value.
  """
  @spec format_traceparent(context()) :: String.t()
  def format_traceparent(%{trace_id: trace_id, span_id: span_id}) when is_binary(trace_id) and is_binary(span_id) do
    "00-#{trace_id}-#{span_id}-01"
  end
  def format_traceparent(_), do: nil
  
  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------
  
  defp put_context(context) do
    Process.put(@context_key, context)
  end
  
  defp update_logger_metadata(context) do
    Logger.metadata(
      request_id: context.request_id,
      trace_id: context.trace_id,
      span_id: context.span_id,
      user_id: context.user_id,
      tenant_id: context.tenant_id
    )
  end
  
  defp get_header(conn, header_name) do
    case Plug.Conn.get_req_header(conn, String.downcase(header_name)) do
      [value | _] -> value
      [] -> nil
    end
  end
  
  defp maybe_add_trace_header(conn, %{trace_id: nil}), do: conn
  defp maybe_add_trace_header(conn, context) do
    case format_traceparent(context) do
      nil -> conn
      traceparent -> Plug.Conn.put_resp_header(conn, "traceparent", traceparent)
    end
  end
  
  defp generate_request_id do
    "req_" <> Base.encode16(:crypto.strong_rand_bytes(12), case: :lower)
  end
  
  defp generate_span_id do
    Base.encode16(:crypto.strong_rand_bytes(8), case: :lower)
  end
  
  defp get_config(key) do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
end
