defmodule CgraphWeb.API.V1.TelemetryController do
  @moduledoc """
  Telemetry and error reporting endpoint.

  Receives client-side error reports and performance metrics for
  monitoring, debugging, and alerting.

  ## Features

  - Error ingestion with PII stripping
  - Rate limiting per client
  - Severity-based alerting
  - Structured logging for analysis
  - Integration with observability tools

  ## Security

  - Rate limited to prevent abuse
  - PII stripping on all ingested data
  - No sensitive data stored in logs
  - Client fingerprinting for abuse detection
  """

  use CgraphWeb, :controller

  import CgraphWeb.Helpers.ParamParser

  alias Cgraph.Telemetry.ErrorReporter

  require Logger

  @doc """
  Ingest a client-side error report.

  ## Parameters

  - `error_id` - Unique error identifier from client
  - `message` - Error message (already sanitized by client)
  - `level` - Severity: fatal, error, warning, info
  - `component` - Component/module where error occurred
  - `action` - User action that triggered error
  - `metadata` - Additional context
  - `breadcrumbs` - Event trail leading to error
  - `url` - Page URL (path only, no query params)
  - `user_agent` - Browser user agent
  - `timestamp` - ISO 8601 timestamp

  ## Response

  Returns 204 No Content on success.
  """
  def create_error(conn, params) do
    user = conn.assigns[:current_user]

    # Parse and validate parameters
    error_report = %{
      error_id: params["error_id"],
      message: sanitize_message(params["message"]),
      level: parse_atom(params["level"], [:fatal, :error, :warning, :info], :error),
      component: params["component"],
      action: params["action"],
      metadata: sanitize_metadata(params["metadata"]),
      breadcrumbs: sanitize_breadcrumbs(params["breadcrumbs"]),
      url: sanitize_url(params["url"]),
      user_agent: truncate(params["user_agent"], 500),
      timestamp: parse_timestamp(params["timestamp"]),
      user_id: user && user.id,
      client_ip: get_client_ip(conn)
    }

    # Log structured error for analysis
    log_error(error_report)

    # Store for analysis (if enabled)
    ErrorReporter.record(error_report)

    # Alert on fatal errors
    if error_report.level == :fatal do
      ErrorReporter.alert_on_call(error_report)
    end

    send_resp(conn, 204, "")
  end

  @doc """
  Ingest performance metrics.

  Used for tracking slow operations and performance regressions.
  """
  def create_metric(conn, params) do
    user = conn.assigns[:current_user]

    metric = %{
      name: params["name"],
      value: parse_float(params["value"]),
      unit: params["unit"] || "ms",
      tags: sanitize_tags(params["tags"]),
      timestamp: parse_timestamp(params["timestamp"]),
      user_id: user && user.id
    }

    ErrorReporter.record_metric(metric)

    send_resp(conn, 204, "")
  end

  # ===========================================================================
  # Private Helpers
  # ===========================================================================

  defp sanitize_message(nil), do: nil
  defp sanitize_message(msg) when is_binary(msg) do
    msg
    |> String.slice(0, 2000)  # Limit length
    |> strip_potential_secrets()
  end
  defp sanitize_message(_), do: nil

  defp sanitize_metadata(nil), do: %{}
  defp sanitize_metadata(meta) when is_map(meta) do
    meta
    |> Enum.take(50)  # Limit keys
    |> Enum.map(fn {k, v} -> {sanitize_key(k), sanitize_value(v)} end)
    |> Enum.into(%{})
  end
  defp sanitize_metadata(_), do: %{}

  defp sanitize_breadcrumbs(nil), do: []
  defp sanitize_breadcrumbs(crumbs) when is_list(crumbs) do
    crumbs
    |> Enum.take(50)  # Limit breadcrumbs
    |> Enum.map(&sanitize_breadcrumb/1)
  end
  defp sanitize_breadcrumbs(_), do: []

  defp sanitize_breadcrumb(crumb) when is_map(crumb) do
    %{
      timestamp: crumb["timestamp"],
      category: crumb["category"],
      message: truncate(crumb["message"], 500),
      level: crumb["level"],
      data: sanitize_metadata(crumb["data"])
    }
  end
  defp sanitize_breadcrumb(_), do: nil

  defp sanitize_url(nil), do: nil
  defp sanitize_url(url) when is_binary(url) do
    # Strip query parameters which may contain sensitive data
    uri = URI.parse(url)
    %URI{uri | query: nil, fragment: nil}
    |> URI.to_string()
    |> truncate(500)
  end
  defp sanitize_url(_), do: nil

  defp sanitize_tags(nil), do: %{}
  defp sanitize_tags(tags) when is_map(tags) do
    tags
    |> Enum.take(20)
    |> Enum.filter(fn {k, v} -> is_binary(k) and is_binary(v) end)
    |> Enum.map(fn {k, v} -> {truncate(k, 50), truncate(v, 100)} end)
    |> Enum.into(%{})
  end
  defp sanitize_tags(_), do: %{}

  defp sanitize_key(key) when is_binary(key), do: truncate(key, 100)
  defp sanitize_key(key) when is_atom(key), do: Atom.to_string(key)
  defp sanitize_key(_), do: "unknown"

  defp sanitize_value(v) when is_binary(v), do: truncate(strip_potential_secrets(v), 500)
  defp sanitize_value(v) when is_number(v), do: v
  defp sanitize_value(v) when is_boolean(v), do: v
  defp sanitize_value(v) when is_nil(v), do: nil
  defp sanitize_value(v) when is_list(v), do: Enum.take(v, 10) |> Enum.map(&sanitize_value/1)
  defp sanitize_value(v) when is_map(v), do: sanitize_metadata(v)
  defp sanitize_value(_), do: "[redacted]"

  @secret_patterns [
    ~r/password/i,
    ~r/secret/i,
    ~r/token/i,
    ~r/apikey/i,
    ~r/api_key/i,
    ~r/authorization/i,
    ~r/bearer/i,
    ~r/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/,  # JWT
    ~r/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/  # Email
  ]

  defp strip_potential_secrets(str) when is_binary(str) do
    Enum.reduce(@secret_patterns, str, fn pattern, acc ->
      String.replace(acc, pattern, "[REDACTED]")
    end)
  end

  defp truncate(nil, _), do: nil
  defp truncate(str, max) when is_binary(str) and byte_size(str) > max do
    String.slice(str, 0, max) <> "..."
  end
  defp truncate(str, _), do: str

  defp parse_timestamp(nil), do: DateTime.utc_now()
  defp parse_timestamp(ts) when is_binary(ts) do
    case DateTime.from_iso8601(ts) do
      {:ok, dt, _} -> dt
      _ -> DateTime.utc_now()
    end
  end
  defp parse_timestamp(_), do: DateTime.utc_now()

  defp parse_float(nil), do: 0.0
  defp parse_float(v) when is_float(v), do: v
  defp parse_float(v) when is_integer(v), do: v * 1.0
  defp parse_float(v) when is_binary(v) do
    case Float.parse(v) do
      {f, _} -> f
      :error -> 0.0
    end
  end
  defp parse_float(_), do: 0.0

  defp get_client_ip(conn) do
    # Check for proxy headers first
    forwarded_for =
      get_req_header(conn, "x-forwarded-for")
      |> List.first()

    real_ip =
      get_req_header(conn, "x-real-ip")
      |> List.first()

    cond do
      forwarded_for -> String.split(forwarded_for, ",") |> List.first() |> String.trim()
      real_ip -> real_ip
      true -> conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end

  defp log_error(report) do
    # Structured logging for analysis tools
    Logger.warning("CLIENT_ERROR",
      error_id: report.error_id,
      level: report.level,
      component: report.component,
      action: report.action,
      message: report.message,
      user_id: report.user_id,
      url: report.url
    )
  end
end
