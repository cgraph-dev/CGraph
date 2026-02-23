defmodule CGraphWeb.Plugs.SentryContext do
  @moduledoc """
  Enriches Sentry scope with request/user metadata for better tracing.

  No-ops if Sentry is not configured.
  """

  import Plug.Conn

  @doc "Initializes plug options."
  @spec init(keyword()) :: keyword()
  def init(opts), do: opts

  @doc "Processes the connection through this plug."
  @spec call(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def call(conn, _opts) do
    if sentry_available?() do
      set_user(conn)
      set_extras(conn)
    end

    conn
  end

  defp sentry_available? do
    Code.ensure_loaded?(Sentry)
  end

  defp set_user(conn) do
    case conn.assigns[:current_user] do
      nil -> :ok
      %{id: id} -> Sentry.Context.set_user_context(%{id: id})
      _ -> :ok
    end
  end

  defp set_extras(conn) do
    req_id = header_or_nil(conn, "x-request-id")
    corr_id = conn.assigns[:correlation_id] || header_or_nil(conn, "x-correlation-id")

    Sentry.Context.set_extra_context(%{
      request_id: req_id,
      correlation_id: corr_id,
      path: conn.request_path,
      method: conn.method,
      remote_ip: format_ip(conn.remote_ip)
    })
  end

  defp header_or_nil(conn, header) do
    case get_resp_header(conn, header) do
      [val | _] -> val
      _ -> nil
    end
  end

  defp format_ip({a, b, c, d}), do: Enum.join([a, b, c, d], ".")
  defp format_ip(tuple) when is_tuple(tuple), do: tuple |> Tuple.to_list() |> Enum.join(":")
  defp format_ip(_), do: nil
end
