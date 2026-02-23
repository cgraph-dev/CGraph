defmodule CGraph.ErrorReporter do
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

  Implementation is split across submodules:

  - `CGraph.ErrorReporter.EventBuilder` — event construction, fingerprinting, breadcrumbs
  - `CGraph.ErrorReporter.Context` — conn context extraction, process-dict helpers
  - `CGraph.ErrorReporter.Adapters.Logger` — Logger adapter
  - `CGraph.ErrorReporter.Adapters.Webhook` — Webhook adapter

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

      config :cgraph, CGraph.ErrorReporter,
        environment: :production,
        release: "1.0.0",
        adapters: [
          {CGraph.ErrorReporter.Adapters.Logger, level: :error},
          {CGraph.ErrorReporter.Adapters.Sentry, dsn: "..."}
        ],
        excluded_exceptions: [
          Ecto.NoResultsError,
          Phoenix.Router.NoRouteError
        ],
        rate_limit: {100, :per_minute}
  """

  use GenServer
  require Logger

  alias CGraph.ErrorReporter.{Context, EventBuilder}

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

  @doc "Start the error reporter."
  @spec start_link(keyword()) :: GenServer.on_start()
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
  @doc "Reports an error to the error tracking system."
  @spec report(Exception.t(), Exception.stacktrace(), context()) :: :ok
  def report(exception, stacktrace, context \\ %{}) do
    GenServer.cast(__MODULE__, {:report, exception, stacktrace, context})
  end

  @doc """
  Report an exception with Plug.Conn context.
  Automatically extracts request information.
  """
  @spec report_with_context(Plug.Conn.t(), Exception.t(), Exception.stacktrace(), context()) :: :ok
  def report_with_context(conn, exception, stacktrace, extra_context \\ %{}) do
    context =
      Context.extract_conn_context(conn)
      |> Map.merge(extra_context)

    report(exception, stacktrace, context)
  end

  @doc """
  Capture a message (not an exception).
  Useful for logging significant events or warnings.
  """
  @spec capture_message(String.t(), severity(), context()) :: :ok
  def capture_message(message, severity \\ :info, context \\ %{}) do
    GenServer.cast(__MODULE__, {:capture_message, message, severity, context})
  end

  # --- Delegates to Context ---

  defdelegate set_user_context(user_context), to: Context
  defdelegate set_tags(tags), to: Context
  defdelegate set_extra(extra), to: Context
  defdelegate clear_context(), to: Context

  # --- Wrapper for add_breadcrumb (has default args) ---

  @doc "Add a breadcrumb for error context."
  @spec add_breadcrumb(String.t(), String.t(), map()) :: :ok
  def add_breadcrumb(message, category \\ "custom", data \\ %{}) do
    EventBuilder.add_breadcrumb(message, category, data)
  end

  @doc "Get error statistics."
  @spec stats() :: map()
  def stats do
    GenServer.call(__MODULE__, :stats)
  end

  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------

  @spec init(keyword()) :: {:ok, map()}
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

  @doc "Handles asynchronous cast messages."
  @spec handle_cast(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_cast({:report, exception, stacktrace, context}, state) do
    try do
      state = maybe_reset_rate_limit(state)

      if should_report?(exception, state) do
        state = increment_rate_limit(state)

        event = EventBuilder.build_error_event(exception, stacktrace, context, state.config)
        dispatch_to_adapters(event, state.adapters)

        {:noreply, %{state | error_count: state.error_count + 1}}
      else
        {:noreply, state}
      end
    rescue
      _ -> {:noreply, state}
    end
  end

  @impl true
  def handle_cast({:capture_message, message, severity, context}, state) do
    event = EventBuilder.build_message_event(message, severity, context, state.config)
    dispatch_to_adapters(event, state.adapters)

    {:noreply, state}
  end

  @doc "Handles synchronous call messages."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
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
  # Filtering & Rate Limiting
  # ---------------------------------------------------------------------------

  defp should_report?(exception, state) do
    exception_module = if is_struct(exception), do: exception.__struct__, else: nil

    cond do
      is_nil(exception_module) -> true
      exception_module in @excluded_exceptions -> false
      state.rate_limit_count >= @rate_limit_max -> false
      true -> true
    end
  end

  defp maybe_reset_rate_limit(state) do
    now = System.monotonic_time(:millisecond)

    if now >= state.rate_limit_reset do
      %{state | rate_limit_count: 0, rate_limit_reset: now + @rate_limit_window}
    else
      state
    end
  end

  defp increment_rate_limit(state) do
    %{state | rate_limit_count: state.rate_limit_count + 1}
  end

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
        module.report(event, opts)
      rescue
        e ->
          Logger.warning("error_adapter_failed", module: module, e: inspect(e))
      end
    end)
  end

  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------

  defp get_config(opts) do
    app_config = Application.get_env(:cgraph, CGraph.ErrorReporter, [])

    %{
      environment:
        Keyword.get(opts, :environment, Keyword.get(app_config, :environment, :development)),
      release: Keyword.get(opts, :release, Keyword.get(app_config, :release, "unknown")),
      adapters: Keyword.get(opts, :adapters, Keyword.get(app_config, :adapters, []))
    }
  end
end
