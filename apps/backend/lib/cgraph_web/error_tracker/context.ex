defmodule CGraphWeb.ErrorTracker.Context do
  @moduledoc """
  Context extraction, sanitization, logging, and telemetry for error tracking.

  Responsible for enriching errors with request, user, and system context,
  sanitizing sensitive data, and reporting errors to logs, telemetry, and
  external services.
  """

  require Logger

  @sensitive_fields ~w(password password_confirmation token secret api_key
                       credit_card card_number cvv ssn private_key)

  @sensitive_headers ~w(authorization cookie x-api-key x-auth-token)

  # ---------------------------------------------------------------------------
  # Context Extraction
  # ---------------------------------------------------------------------------

  @doc """
  Extract request context from a `Plug.Conn`, sanitizing sensitive data.
  """
  @spec extract_request_context(Plug.Conn.t() | nil) :: map() | nil
  def extract_request_context(nil), do: nil

  def extract_request_context(%Plug.Conn{} = conn) do
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

  @doc """
  Extract user context from a user struct, map, or ID string.
  """
  @spec extract_user_context(term()) :: map() | nil
  def extract_user_context(nil), do: nil

  def extract_user_context(%{id: id} = user) do
    %{
      id: id,
      role: Map.get(user, :role),
      email: redact_email(Map.get(user, :email))
    }
  end

  def extract_user_context(user_id) when is_binary(user_id) do
    %{id: user_id}
  end

  @doc """
  Attempt to extract the current user from a connection in the options.
  """
  @spec get_user_from_conn(keyword()) :: term()
  def get_user_from_conn(opts) do
    case Keyword.get(opts, :conn) do
      %Plug.Conn{} = conn ->
        Guardian.Plug.current_resource(conn)
      _ ->
        Keyword.get(opts, :user_id)
    end
  end

  @doc """
  Build system context including node, version, and runtime info.
  """
  @spec system_context() :: map()
  def system_context do
    %{
      node: node(),
      version: Application.spec(:cgraph, :vsn) |> to_string(),
      environment: Application.get_env(:cgraph, :environment, :dev),
      otp_release: System.otp_release(),
      elixir_version: System.version()
    }
  end

  @doc """
  Extract the request ID from options (via conn response headers).
  """
  @spec get_request_id(keyword()) :: String.t() | nil
  def get_request_id(opts) do
    case Keyword.get(opts, :conn) do
      %Plug.Conn{} = conn ->
        case Plug.Conn.get_resp_header(conn, "x-request-id") do
          [id | _] -> id
          [] -> nil
        end
      _ -> nil
    end
  end

  @doc """
  Extract the correlation ID from options (via conn request headers or direct option).
  """
  @spec get_correlation_id(keyword()) :: String.t() | nil
  def get_correlation_id(opts) do
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
  # Logging & Telemetry
  # ---------------------------------------------------------------------------

  @doc """
  Log an enriched error at the appropriate severity level.
  """
  @spec log_error(map()) :: :ok
  def log_error(enriched) do
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
      :critical -> Logger.error("critical_error", [{:message, message} | metadata])
    end
  end

  @doc """
  Emit a telemetry event for the tracked error.
  """
  @spec emit_telemetry(map()) :: :ok
  def emit_telemetry(enriched) do
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

  @doc """
  Send error to external services (Sentry) if configured. Notifies on critical errors.
  """
  @spec maybe_send_to_external_service(map()) :: :ok
  def maybe_send_to_external_service(enriched) do
    if Application.get_env(:cgraph, :sentry_dsn) do
      Sentry.capture_message(enriched.error.message,
        level: severity_to_sentry_level(enriched.severity),
        extra: %{
          category: enriched.category,
          severity: enriched.severity,
          error_type: enriched.error.type,
          context: Map.get(enriched, :context, %{})
        },
        tags: %{
          category: to_string(enriched.category),
          severity: to_string(enriched.severity)
        }
      )
    end

    # Webhook notification for critical errors
    if enriched.severity == :critical do
      notify_critical_error(enriched)
    end

    :ok
  end

  # ---------------------------------------------------------------------------
  # Private: Sanitization
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
  # Private: Logging helpers
  # ---------------------------------------------------------------------------

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

  defp notify_critical_error(_enriched) do
    # Would send to Slack, PagerDuty, etc.
    :ok
  end

  defp severity_to_sentry_level(:critical), do: :fatal
  defp severity_to_sentry_level(:high), do: :error
  defp severity_to_sentry_level(:medium), do: :warning
  defp severity_to_sentry_level(:low), do: :info
  defp severity_to_sentry_level(_), do: :error
end
