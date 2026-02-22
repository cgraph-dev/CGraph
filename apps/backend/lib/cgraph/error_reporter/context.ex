defmodule CGraph.ErrorReporter.Context do
  @moduledoc """
  Extracts and manages contextual data for error reports.

  Handles `Plug.Conn` context extraction, header sanitisation,
  and process-dictionary context helpers (user, tags, extra).
  """

  # ============================================================================
  # Conn context extraction
  # ============================================================================

  @doc """
  Extract request context from a `Plug.Conn`.

  Builds a map with request method, URL, path, sanitised headers,
  remote IP, user-agent, and request ID.
  """
  @spec extract_conn_context(Plug.Conn.t()) :: map()
  def extract_conn_context(conn) do
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

  # ============================================================================
  # Process-dictionary context helpers
  # ============================================================================

  @doc """
  Set user context for subsequent reports.
  Stored in the process dictionary.
  """
  @spec set_user_context(map()) :: term()
  def set_user_context(user_context) do
    Process.put(:error_reporter_user, user_context)
  end

  @doc """
  Add tags for subsequent reports.
  Merges with any existing tags.
  """
  @spec set_tags(map()) :: term()
  def set_tags(tags) do
    existing = Process.get(:error_reporter_tags, %{})
    Process.put(:error_reporter_tags, Map.merge(existing, tags))
  end

  @doc """
  Add extra context for subsequent reports.
  Merges with any existing extra data.
  """
  @spec set_extra(map()) :: term()
  def set_extra(extra) do
    existing = Process.get(:error_reporter_extra, %{})
    Process.put(:error_reporter_extra, Map.merge(existing, extra))
  end

  @doc """
  Clear all context from the process dictionary.
  """
  @spec clear_context() :: term()
  def clear_context do
    Process.delete(:error_reporter_user)
    Process.delete(:error_reporter_tags)
    Process.delete(:error_reporter_extra)
  end

  # ============================================================================
  # Private helpers
  # ============================================================================

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
end
