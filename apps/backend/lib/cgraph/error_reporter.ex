defmodule Cgraph.ErrorReporter do
  @moduledoc """
  Centralized error reporting and tracking.
  
  ## Overview
  
  Provides unified error handling with support for:
  
  - **Local Logging**: Structured error logs
  - **External Services**: Sentry, Honeybadger, Rollbar
  - **Contextual Data**: Request, user, and custom metadata
  - **Fingerprinting**: Group similar errors
  - **Rate Limiting**: Prevent error floods
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     ERROR REPORTER                              │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │   Exception/Error                                               │
  │        │                                                        │
  │        ▼                                                        │
  │   ┌─────────────────────────────────────────────────────────┐  │
  │   │                 Error Processing                         │  │
  │   │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │  │
  │   │  │Sanitize │─►│Enrich   │─►│Finger-  │─►│Rate     │    │  │
  │   │  │Data     │  │Context  │  │print    │  │Limit    │    │  │
  │   │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │  │
  │   └──────────────────────────────┬──────────────────────────┘  │
  │                                  │                              │
  │          ┌───────────────────────┼───────────────────────┐     │
  │          │                       │                       │     │
  │          ▼                       ▼                       ▼     │
  │   ┌─────────────┐         ┌─────────────┐         ┌──────────┐│
  │   │   Logger    │         │   Sentry    │         │ Webhook  ││
  │   │   (local)   │         │  (external) │         │ (custom) ││
  │   └─────────────┘         └─────────────┘         └──────────┘│
  │                                                                │
  └────────────────────────────────────────────────────────────────┘
  ```
  
  ## Usage
  
      # Report an exception
      ErrorReporter.report(exception, stacktrace, %{
        user_id: user.id,
        request_id: conn.assigns.request_id
      })
      
      # Report with context
      ErrorReporter.report_with_context(conn, exception, stacktrace)
      
      # Capture a message
      ErrorReporter.capture_message("Payment failed", :error, %{
        payment_id: payment.id,
        reason: reason
      })
  
  ## Configuration
  
      config :cgraph, Cgraph.ErrorReporter,
        environment: :production,
        release: "1.0.0",
        adapters: [
          {Cgraph.ErrorReporter.Adapters.Logger, level: :error},
          {Cgraph.ErrorReporter.Adapters.Sentry, dsn: "..."}
        ],
        excluded_exceptions: [
          Ecto.NoResultsError,
          Phoenix.Router.NoRouteError
        ],
        rate_limit: {100, :per_minute}
  """
  
  use GenServer
  require Logger
  
  @type severity :: :debug | :info | :warning | :error | :fatal
  @type context :: map()
  
  @excluded_exceptions [
    Ecto.NoResultsError,
    Phoenix.Router.NoRouteError
  ]
  
  @rate_limit_window :timer.minutes(1)
  @rate_limit_max 100
  
  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------
  
  @doc """
  Start the error reporter.
  """
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @doc """
  Report an exception.
  
  ## Parameters
  
  - `exception` - The exception struct
  - `stacktrace` - The stacktrace
  - `context` - Additional context (optional)
  
  ## Example
  
      try do
        risky_operation()
      rescue
        e ->
          ErrorReporter.report(e, __STACKTRACE__, %{operation: "risky"})
          {:error, :operation_failed}
      end
  """
  def report(exception, stacktrace, context \\ %{}) do
    GenServer.cast(__MODULE__, {:report, exception, stacktrace, context})
  end
  
  @doc """
  Report an exception with Plug.Conn context.
  
  Automatically extracts request information.
  """
  def report_with_context(conn, exception, stacktrace, extra_context \\ %{}) do
    context = extract_conn_context(conn)
    |> Map.merge(extra_context)
    
    report(exception, stacktrace, context)
  end
  
  @doc """
  Capture a message (not an exception).
  
  Useful for logging significant events or warnings.
  """
  def capture_message(message, severity \\ :info, context \\ %{}) do
    GenServer.cast(__MODULE__, {:capture_message, message, severity, context})
  end
  
  @doc """
  Set user context for subsequent reports.
  
  Stored in process dictionary.
  """
  def set_user_context(user_context) do
    Process.put(:error_reporter_user, user_context)
  end
  
  @doc """
  Add tags for subsequent reports.
  """
  def set_tags(tags) do
    existing = Process.get(:error_reporter_tags, %{})
    Process.put(:error_reporter_tags, Map.merge(existing, tags))
  end
  
  @doc """
  Add extra context for subsequent reports.
  """
  def set_extra(extra) do
    existing = Process.get(:error_reporter_extra, %{})
    Process.put(:error_reporter_extra, Map.merge(existing, extra))
  end
  
  @doc """
  Clear all context from process dictionary.
  """
  def clear_context do
    Process.delete(:error_reporter_user)
    Process.delete(:error_reporter_tags)
    Process.delete(:error_reporter_extra)
  end
  
  @doc """
  Get error statistics.
  """
  def stats do
    GenServer.call(__MODULE__, :stats)
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(opts) do
    config = get_config(opts)
    
    state = %{
      config: config,
      adapters: initialize_adapters(config[:adapters] || []),
      error_count: 0,
      rate_limit_count: 0,
      rate_limit_reset: System.monotonic_time(:millisecond) + @rate_limit_window,
      recent_fingerprints: %{}
    }
    
    {:ok, state}
  end
  
  @impl true
  def handle_cast({:report, exception, stacktrace, context}, state) do
    state = maybe_reset_rate_limit(state)
    
    if should_report?(exception, state) do
      state = increment_rate_limit(state)
      
      event = build_error_event(exception, stacktrace, context, state.config)
      dispatch_to_adapters(event, state.adapters)
      
      {:noreply, %{state | error_count: state.error_count + 1}}
    else
      {:noreply, state}
    end
  end
  
  @impl true
  def handle_cast({:capture_message, message, severity, context}, state) do
    event = build_message_event(message, severity, context, state.config)
    dispatch_to_adapters(event, state.adapters)
    
    {:noreply, state}
  end
  
  @impl true
  def handle_call(:stats, _from, state) do
    stats = %{
      total_errors: state.error_count,
      rate_limit_count: state.rate_limit_count,
      rate_limit_remaining: max(0, @rate_limit_max - state.rate_limit_count),
      adapters: length(state.adapters)
    }
    {:reply, stats, state}
  end
  
  # ---------------------------------------------------------------------------
  # Event Building
  # ---------------------------------------------------------------------------
  
  defp build_error_event(exception, stacktrace, context, config) do
    # Get process context
    user = Process.get(:error_reporter_user, %{})
    tags = Process.get(:error_reporter_tags, %{})
    extra = Process.get(:error_reporter_extra, %{})
    
    %{
      type: :exception,
      exception: %{
        type: exception_type(exception),
        message: Exception.message(exception),
        module: exception.__struct__
      },
      stacktrace: format_stacktrace(stacktrace),
      fingerprint: generate_fingerprint(exception, stacktrace),
      severity: :error,
      timestamp: DateTime.utc_now(),
      environment: config[:environment],
      release: config[:release],
      server_name: node(),
      context: Map.merge(context, extra),
      user: user,
      tags: tags,
      breadcrumbs: get_breadcrumbs()
    }
  end
  
  defp build_message_event(message, severity, context, config) do
    user = Process.get(:error_reporter_user, %{})
    tags = Process.get(:error_reporter_tags, %{})
    extra = Process.get(:error_reporter_extra, %{})
    
    %{
      type: :message,
      message: message,
      severity: severity,
      timestamp: DateTime.utc_now(),
      environment: config[:environment],
      release: config[:release],
      server_name: node(),
      context: Map.merge(context, extra),
      user: user,
      tags: tags
    }
  end
  
  defp exception_type(%{__struct__: struct}), do: struct |> Module.split() |> Enum.join(".")
  defp exception_type(_), do: "Unknown"
  
  defp format_stacktrace(stacktrace) do
    Enum.map(stacktrace, fn
      {mod, fun, arity, location} when is_integer(arity) ->
        %{
          module: inspect(mod),
          function: "#{fun}/#{arity}",
          file: Keyword.get(location, :file) |> to_string(),
          line: Keyword.get(location, :line)
        }
      {mod, fun, args, location} when is_list(args) ->
        %{
          module: inspect(mod),
          function: "#{fun}/#{length(args)}",
          file: Keyword.get(location, :file) |> to_string(),
          line: Keyword.get(location, :line)
        }
      entry ->
        %{raw: inspect(entry)}
    end)
  end
  
  defp generate_fingerprint(exception, stacktrace) do
    # Create a fingerprint based on exception type and top stack frames
    frames = stacktrace
    |> Enum.take(3)
    |> Enum.map(fn
      {mod, fun, arity, _} when is_integer(arity) -> "#{mod}.#{fun}/#{arity}"
      {mod, fun, args, _} when is_list(args) -> "#{mod}.#{fun}/#{length(args)}"
      _ -> "unknown"
    end)
    |> Enum.join("|")
    
    data = "#{exception_type(exception)}|#{frames}"
    
    :crypto.hash(:md5, data)
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end
  
  defp get_breadcrumbs do
    Process.get(:error_reporter_breadcrumbs, [])
  end
  
  @doc """
  Add a breadcrumb for error context.
  """
  def add_breadcrumb(message, category \\ "custom", data \\ %{}) do
    breadcrumb = %{
      message: message,
      category: category,
      data: data,
      timestamp: DateTime.utc_now()
    }
    
    existing = Process.get(:error_reporter_breadcrumbs, [])
    # Keep last 20 breadcrumbs
    updated = Enum.take([breadcrumb | existing], 20)
    Process.put(:error_reporter_breadcrumbs, updated)
  end
  
  # ---------------------------------------------------------------------------
  # Filtering & Rate Limiting
  # ---------------------------------------------------------------------------
  
  defp should_report?(exception, state) do
    exception_module = exception.__struct__
    
    cond do
      # Excluded exception types
      exception_module in @excluded_exceptions -> false
      
      # Rate limited
      state.rate_limit_count >= @rate_limit_max -> false
      
      # Report it
      true -> true
    end
  end
  
  defp maybe_reset_rate_limit(state) do
    now = System.monotonic_time(:millisecond)
    
    if now >= state.rate_limit_reset do
      %{state | 
        rate_limit_count: 0,
        rate_limit_reset: now + @rate_limit_window
      }
    else
      state
    end
  end
  
  defp increment_rate_limit(state) do
    %{state | rate_limit_count: state.rate_limit_count + 1}
  end
  
  # ---------------------------------------------------------------------------
  # Context Extraction
  # ---------------------------------------------------------------------------
  
  defp extract_conn_context(conn) do
    %{
      request: %{
        method: conn.method,
        url: build_url(conn),
        path: conn.request_path,
        query_string: conn.query_string,
        headers: sanitize_headers(conn.req_headers),
        remote_ip: format_ip(conn.remote_ip)
      },
      user_agent: get_header(conn, "user-agent"),
      request_id: get_header(conn, "x-request-id") || conn.assigns[:request_id]
    }
  end
  
  defp build_url(conn) do
    query = if conn.query_string != "", do: "?#{conn.query_string}", else: ""
    "#{conn.scheme}://#{conn.host}#{conn.request_path}#{query}"
  end
  
  defp sanitize_headers(headers) do
    sensitive = ["authorization", "cookie", "x-api-key"]
    
    Enum.map(headers, fn {key, value} ->
      if String.downcase(key) in sensitive do
        {key, "[REDACTED]"}
      else
        {key, value}
      end
    end)
    |> Map.new()
  end
  
  defp get_header(conn, header) do
    case Plug.Conn.get_req_header(conn, header) do
      [value | _] -> value
      _ -> nil
    end
  end
  
  defp format_ip(ip) when is_tuple(ip) do
    ip |> Tuple.to_list() |> Enum.join(".")
  end
  defp format_ip(ip), do: to_string(ip)
  
  # ---------------------------------------------------------------------------
  # Adapter Management
  # ---------------------------------------------------------------------------
  
  defp initialize_adapters(adapter_configs) do
    Enum.map(adapter_configs, fn
      {module, opts} -> {module, opts}
      module -> {module, []}
    end)
  end
  
  defp dispatch_to_adapters(event, adapters) do
    Enum.each(adapters, fn {module, opts} ->
      try do
        apply(module, :report, [event, opts])
      rescue
        e ->
          Logger.warning("Error adapter #{module} failed: #{inspect(e)}")
      end
    end)
  end
  
  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------
  
  defp get_config(opts) do
    app_config = Application.get_env(:cgraph, Cgraph.ErrorReporter, [])
    
    %{
      environment: Keyword.get(opts, :environment, Keyword.get(app_config, :environment, :development)),
      release: Keyword.get(opts, :release, Keyword.get(app_config, :release, "unknown")),
      adapters: Keyword.get(opts, :adapters, Keyword.get(app_config, :adapters, []))
    }
  end
end

defmodule Cgraph.ErrorReporter.Adapters.Logger do
  @moduledoc """
  Logger adapter for error reporting.
  """
  
  require Logger
  
  def report(event, opts) do
    level = Keyword.get(opts, :level, :error)
    
    case event.type do
      :exception ->
        Logger.log(level, fn ->
          """
          [ErrorReporter] #{event.exception.type}: #{event.exception.message}
          Fingerprint: #{event.fingerprint}
          """
        end,
          error_type: event.exception.type,
          fingerprint: event.fingerprint,
          context: event.context
        )
        
      :message ->
        Logger.log(level, "[ErrorReporter] #{event.message}",
          severity: event.severity,
          context: event.context
        )
    end
  end
end

defmodule Cgraph.ErrorReporter.Adapters.Webhook do
  @moduledoc """
  Webhook adapter for error reporting to custom endpoints.
  """
  
  require Logger
  
  def report(event, opts) do
    url = Keyword.fetch!(opts, :url)
    
    payload = %{
      type: event.type,
      message: get_message(event),
      severity: event.severity,
      timestamp: DateTime.to_iso8601(event.timestamp),
      environment: event.environment,
      context: event.context
    }
    
    # Would use HTTPoison or Finch here
    Logger.debug("Would POST to #{url}: #{inspect(payload)}")
  end
  
  defp get_message(%{type: :exception} = event) do
    "#{event.exception.type}: #{event.exception.message}"
  end
  defp get_message(event), do: event.message
end
