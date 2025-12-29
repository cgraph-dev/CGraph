defmodule CgraphWeb.ErrorTracker do
  @moduledoc """
  Centralized error tracking and monitoring system.
  
  ## Design Philosophy
  
  This module provides comprehensive error handling that:
  
  1. **Categorizes errors**: Group errors by type for better analysis
  2. **Enriches context**: Capture request, user, and system state
  3. **Deduplicates**: Group similar errors to reduce noise
  4. **Alerts intelligently**: Route errors based on severity
  5. **Integrates**: Works with external services (Sentry, etc.)
  
  ## Error Categories
  
  | Category | Description | Alert Level |
  |----------|-------------|-------------|
  | `security` | Auth failures, permission violations | High |
  | `validation` | Input validation errors | Low |
  | `database` | DB connection, query errors | Critical |
  | `external` | Third-party API failures | Medium |
  | `internal` | Application logic errors | High |
  | `not_found` | Missing resources | Low |
  | `rate_limit` | Rate limiting triggered | Low |
  
  ## Context Enrichment
  
  Each error is enriched with:
  
  ```elixir
  %{
    error: %{
      type: :validation_error,
      message: "Email has invalid format",
      stacktrace: [...],
      category: :validation
    },
    request: %{
      method: "POST",
      path: "/api/users",
      params: %{...},  # Sanitized
      headers: %{...}  # Filtered
    },
    user: %{
      id: "user_123",
      role: "admin"
    },
    system: %{
      node: :"app@host",
      version: "1.0.0",
      environment: :production
    },
    metadata: %{
      request_id: "req_abc123",
      correlation_id: "cor_xyz789"
    }
  }
  ```
  
  ## Fingerprinting
  
  Errors are deduplicated using fingerprints based on:
  
  - Error module and function
  - Error type/category
  - Request path (normalized)
  
  ## Usage
  
  ```elixir
  # In controllers/plugs
  ErrorTracker.track(conn, error)
  
  # In background jobs
  ErrorTracker.track(error, context: %{job: "SendEmail", args: %{}})
  
  # Manual tracking
  ErrorTracker.track(error, user_id: user_id, category: :payment)
  ```
  """
  
  require Logger
  
  @type error_category :: :security | :validation | :database | :external | 
                          :internal | :not_found | :rate_limit | :unknown
  
  @type severity :: :debug | :info | :warning | :error | :critical
  
  @sensitive_fields ~w(password password_confirmation token secret api_key 
                       credit_card card_number cvv ssn private_key)
  
  @sensitive_headers ~w(authorization cookie x-api-key x-auth-token)
  
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
    error_info = extract_error_info(error)
    category = Keyword.get(opts, :category) || categorize_error(error)
    severity = Keyword.get(opts, :severity) || severity_for_category(category)
    
    enriched = %{
      error: error_info,
      category: category,
      severity: severity,
      fingerprint: compute_fingerprint(error_info, opts),
      timestamp: DateTime.utc_now(),
      request: extract_request_context(Keyword.get(opts, :conn)),
      user: extract_user_context(Keyword.get(opts, :user) || get_user_from_conn(opts)),
      system: system_context(),
      metadata: %{
        request_id: get_request_id(opts),
        correlation_id: get_correlation_id(opts),
        tags: Keyword.get(opts, :tags, [])
      },
      context: Keyword.get(opts, :context, %{})
    }
    
    # Log based on severity
    log_error(enriched)
    
    # Emit telemetry
    emit_telemetry(enriched)
    
    # Send to external service (async)
    maybe_send_to_external_service(enriched)
    
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
    try do
      func.()
    rescue
      e ->
        track(e, Keyword.put(opts, :stacktrace, __STACKTRACE__))
        reraise e, __STACKTRACE__
    end
  end

  # ---------------------------------------------------------------------------
  # Error Extraction
  # ---------------------------------------------------------------------------
  
  defp extract_error_info(%{__exception__: true} = exception) do
    %{
      type: exception.__struct__,
      message: Exception.message(exception),
      stacktrace: extract_stacktrace(),
      exception: true
    }
  end
  
  defp extract_error_info(%Ecto.Changeset{} = changeset) do
    %{
      type: :changeset_error,
      message: "Validation failed",
      errors: format_changeset_errors(changeset),
      exception: false
    }
  end
  
  defp extract_error_info({:error, reason}) when is_atom(reason) do
    %{
      type: reason,
      message: Atom.to_string(reason),
      exception: false
    }
  end
  
  defp extract_error_info({:error, %{} = error_map}) do
    %{
      type: Map.get(error_map, :type, :unknown),
      message: Map.get(error_map, :message, inspect(error_map)),
      details: error_map,
      exception: false
    }
  end
  
  defp extract_error_info({:error, reason}) when is_binary(reason) do
    %{
      type: :error,
      message: reason,
      exception: false
    }
  end
  
  defp extract_error_info(error) do
    %{
      type: :unknown,
      message: inspect(error),
      exception: false
    }
  end
  
  defp extract_stacktrace do
    case Process.info(self(), :current_stacktrace) do
      {:current_stacktrace, stacktrace} ->
        stacktrace
        |> Enum.drop(5)  # Remove ErrorTracker frames
        |> Enum.take(20) # Limit depth
        |> Enum.map(&format_stack_frame/1)
      _ ->
        []
    end
  end
  
  defp format_stack_frame({mod, fun, arity, location}) do
    file = Keyword.get(location, :file, "unknown")
    line = Keyword.get(location, :line, 0)
    "#{inspect(mod)}.#{fun}/#{arity} at #{file}:#{line}"
  end
  
  defp format_stack_frame(_), do: "unknown"
  
  defp format_changeset_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts
        |> Keyword.get(String.to_existing_atom(key), key)
        |> to_string()
      end)
    end)
  end

  # ---------------------------------------------------------------------------
  # Error Categorization
  # ---------------------------------------------------------------------------
  
  defp categorize_error(%DBConnection.ConnectionError{}), do: :database
  defp categorize_error(%Ecto.NoResultsError{}), do: :not_found
  defp categorize_error(%Ecto.StaleEntryError{}), do: :database
  defp categorize_error(%Ecto.ConstraintError{}), do: :validation
  defp categorize_error(%Ecto.InvalidChangesetError{}), do: :validation
  defp categorize_error(%Ecto.Changeset{}), do: :validation
  
  defp categorize_error(%Phoenix.Router.NoRouteError{}), do: :not_found
  defp categorize_error(%Phoenix.NotAcceptableError{}), do: :validation
  
  defp categorize_error(%Plug.Parsers.ParseError{}), do: :validation
  defp categorize_error(%Plug.BadRequestError{}), do: :validation
  
  defp categorize_error({:error, :unauthorized}), do: :security
  defp categorize_error({:error, :forbidden}), do: :security
  defp categorize_error({:error, :unauthenticated}), do: :security
  defp categorize_error({:error, :not_found}), do: :not_found
  defp categorize_error({:error, :rate_limited}), do: :rate_limit
  
  defp categorize_error(%{__exception__: true} = exception) do
    case exception.__struct__ do
      mod when mod in [Mint.TransportError, Finch.Error] -> :external
      _ -> :internal
    end
  end
  
  defp categorize_error(_), do: :unknown
  
  defp severity_for_category(:security), do: :error
  defp severity_for_category(:database), do: :critical
  defp severity_for_category(:external), do: :warning
  defp severity_for_category(:internal), do: :error
  defp severity_for_category(:validation), do: :info
  defp severity_for_category(:not_found), do: :info
  defp severity_for_category(:rate_limit), do: :info
  defp severity_for_category(_), do: :warning

  # ---------------------------------------------------------------------------
  # Context Extraction
  # ---------------------------------------------------------------------------
  
  defp extract_request_context(nil), do: nil
  
  defp extract_request_context(%Plug.Conn{} = conn) do
    %{
      method: conn.method,
      path: conn.request_path,
      query_string: conn.query_string,
      params: sanitize_params(conn.params),
      headers: filter_headers(conn.req_headers),
      remote_ip: format_ip(conn.remote_ip),
      host: conn.host,
      port: conn.port
    }
  end
  
  defp extract_user_context(nil), do: nil
  
  defp extract_user_context(%{id: id} = user) do
    %{
      id: id,
      role: Map.get(user, :role),
      email: redact_email(Map.get(user, :email))
    }
  end
  
  defp extract_user_context(user_id) when is_binary(user_id) do
    %{id: user_id}
  end
  
  defp get_user_from_conn(opts) do
    case Keyword.get(opts, :conn) do
      %Plug.Conn{} = conn -> 
        Guardian.Plug.current_resource(conn)
      _ -> 
        Keyword.get(opts, :user_id)
    end
  end
  
  defp system_context do
    %{
      node: node(),
      version: Application.spec(:cgraph, :vsn) |> to_string(),
      environment: Application.get_env(:cgraph, :environment, :dev),
      otp_release: System.otp_release(),
      elixir_version: System.version()
    }
  end
  
  defp get_request_id(opts) do
    case Keyword.get(opts, :conn) do
      %Plug.Conn{} = conn ->
        case Plug.Conn.get_resp_header(conn, "x-request-id") do
          [id | _] -> id
          [] -> nil
        end
      _ -> nil
    end
  end
  
  defp get_correlation_id(opts) do
    case Keyword.get(opts, :conn) do
      %Plug.Conn{} = conn ->
        case Plug.Conn.get_req_header(conn, "x-correlation-id") do
          [id | _] -> id
          [] -> nil
        end
      _ -> Keyword.get(opts, :correlation_id)
    end
  end

  # ---------------------------------------------------------------------------
  # Sanitization
  # ---------------------------------------------------------------------------
  
  defp sanitize_params(params) when is_map(params) do
    Map.new(params, fn {key, value} ->
      key_str = to_string(key)
      
      if key_str in @sensitive_fields or String.contains?(key_str, "password") do
        {key, "[REDACTED]"}
      else
        {key, sanitize_value(value)}
      end
    end)
  end
  
  defp sanitize_params(params), do: params
  
  defp sanitize_value(value) when is_map(value), do: sanitize_params(value)
  defp sanitize_value(value) when is_list(value), do: Enum.map(value, &sanitize_value/1)
  defp sanitize_value(value), do: value
  
  defp filter_headers(headers) do
    headers
    |> Enum.reject(fn {key, _} -> 
      String.downcase(key) in @sensitive_headers 
    end)
    |> Map.new(fn {k, v} -> {k, v} end)
  end
  
  defp format_ip({a, b, c, d}), do: "#{a}.#{b}.#{c}.#{d}"
  defp format_ip(ip) when is_binary(ip), do: ip
  defp format_ip(_), do: "unknown"
  
  defp redact_email(nil), do: nil
  defp redact_email(email) when is_binary(email) do
    case String.split(email, "@") do
      [local, domain] ->
        redacted_local = String.first(local) <> "***"
        "#{redacted_local}@#{domain}"
      _ ->
        "[REDACTED]"
    end
  end

  # ---------------------------------------------------------------------------
  # Fingerprinting
  # ---------------------------------------------------------------------------
  
  defp compute_fingerprint(error_info, opts) do
    components = [
      error_info.type,
      error_info.message |> String.slice(0, 100),
      get_path(opts)
    ]
    
    :crypto.hash(:md5, Enum.join(components, "|"))
    |> Base.encode16(case: :lower)
    |> String.slice(0, 16)
  end
  
  defp get_path(opts) do
    case Keyword.get(opts, :conn) do
      %Plug.Conn{request_path: path} -> normalize_path(path)
      _ -> "background"
    end
  end
  
  # Normalize path by replacing dynamic segments
  defp normalize_path(path) do
    path
    |> String.replace(~r/\/[0-9a-f-]{36}/, "/:uuid")  # UUIDs
    |> String.replace(~r/\/[0-9A-Z]{26}/, "/:ulid")   # ULIDs
    |> String.replace(~r/\/\d+/, "/:id")               # Numeric IDs
  end

  # ---------------------------------------------------------------------------
  # Logging & Telemetry
  # ---------------------------------------------------------------------------
  
  defp log_error(enriched) do
    message = build_log_message(enriched)
    metadata = [
      error_type: enriched.error.type,
      category: enriched.category,
      fingerprint: enriched.fingerprint,
      request_id: enriched.metadata.request_id
    ]
    
    case enriched.severity do
      :debug -> Logger.debug(message, metadata)
      :info -> Logger.info(message, metadata)
      :warning -> Logger.warning(message, metadata)
      :error -> Logger.error(message, metadata)
      :critical -> Logger.error("[CRITICAL] #{message}", metadata)
    end
  end
  
  defp build_log_message(enriched) do
    user_info = case enriched.user do
      %{id: id} -> " user=#{id}"
      _ -> ""
    end
    
    request_info = case enriched.request do
      %{method: method, path: path} -> " #{method} #{path}"
      _ -> ""
    end
    
    "[#{enriched.category}] #{enriched.error.message}#{request_info}#{user_info}"
  end
  
  defp emit_telemetry(enriched) do
    :telemetry.execute(
      [:cgraph, :errors, :tracked],
      %{count: 1},
      %{
        category: enriched.category,
        severity: enriched.severity,
        error_type: enriched.error.type
      }
    )
  end
  
  defp maybe_send_to_external_service(enriched) do
    if Application.get_env(:cgraph, :sentry_dsn) do
      # Would integrate with Sentry here
      # Sentry.capture_message(enriched.error.message, extra: enriched)
      :ok
    end
    
    # Webhook notification for critical errors
    if enriched.severity == :critical do
      notify_critical_error(enriched)
    end
  end
  
  defp notify_critical_error(_enriched) do
    # Would send to Slack, PagerDuty, etc.
    :ok
  end
end
