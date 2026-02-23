defmodule CGraphWeb.ErrorTracker do
  @moduledoc """
  Centralized error tracking and monitoring system.

  Categorizes, enriches, deduplicates, and routes errors. Integrates with
  external services (Sentry, etc.).

  Delegates to:
  - `CGraphWeb.ErrorTracker.Extractor` — error extraction, categorization, fingerprinting
  - `CGraphWeb.ErrorTracker.Context` — context enrichment, sanitization, logging/telemetry

  ## Usage

      # In controllers/plugs
      ErrorTracker.track(conn, error)

      # In background jobs
      ErrorTracker.track(error, context: %{job: "SendEmail", args: %{}})

      # Manual tracking
      ErrorTracker.track(error, user_id: user_id, category: :payment)
  """

  require Logger

  alias CGraphWeb.ErrorTracker.{Context, Extractor}

  @type error_category :: :security | :validation | :database | :external |
                          :internal | :not_found | :rate_limit | :unknown

  @type severity :: :debug | :info | :warning | :error | :critical

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Track an error with full context enrichment.

  ## Parameters

  - `error` - The error (exception, changeset, or error tuple)
  - `opts` - Additional options and context:
    - `:conn` - Plug connection for request context
    - `:user` - User struct or map
    - `:category` - Override error category
    - `:severity` - Override severity level
    - `:context` - Additional context map
    - `:tags` - Tags for filtering/grouping

  ## Examples

      # Track from controller
      ErrorTracker.track(error, conn: conn)

      # Track from background job
      ErrorTracker.track(error,
        user_id: user_id,
        context: %{job: "ProcessPayment", amount: 100}
      )
  """
  @doc "Tracks and records an error occurrence."
  @spec track(term(), keyword()) :: :ok

  # Handle Plug.Conn as first argument - convenience function
  def track(%Plug.Conn{} = conn, error) do
    do_track(error, conn: conn)
  end

  # Main track function with options
  def track(error, opts) do
    do_track(error, opts)
  end

  defp do_track(error, opts) do
    error_info = Extractor.extract_error_info(error)
    category = Keyword.get(opts, :category) || Extractor.categorize_error(error)
    severity = Keyword.get(opts, :severity) || Extractor.severity_for_category(category)

    enriched = %{
      error: error_info,
      category: category,
      severity: severity,
      fingerprint: Extractor.compute_fingerprint(error_info, opts),
      timestamp: DateTime.utc_now(),
      request: Context.extract_request_context(Keyword.get(opts, :conn)),
      user: Context.extract_user_context(Keyword.get(opts, :user) || Context.get_user_from_conn(opts)),
      system: Context.system_context(),
      metadata: %{
        request_id: Context.get_request_id(opts),
        correlation_id: Context.get_correlation_id(opts),
        tags: Keyword.get(opts, :tags, [])
      },
      context: Keyword.get(opts, :context, %{})
    }

    # Log based on severity
    Context.log_error(enriched)

    # Emit telemetry
    Context.emit_telemetry(enriched)

    # Send to external service (async)
    Context.maybe_send_to_external_service(enriched)

    :ok
  end

  @doc """
  Wrap a function and track any errors.

  ## Examples

      ErrorTracker.rescue_and_track(fn ->
        risky_operation()
      end, context: %{operation: "import"})
  """
  @spec rescue_and_track((() -> term()), keyword()) :: term()
  def rescue_and_track(func, opts \\ []) when is_function(func, 0) do
    func.()
  rescue
    e ->
      track(e, Keyword.put(opts, :stacktrace, __STACKTRACE__))
      reraise e, __STACKTRACE__
  end
end
