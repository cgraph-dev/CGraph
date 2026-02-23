defmodule CGraph.ApiVersioning.Deprecation do
  @moduledoc false

  alias CGraph.ApiVersioning.Detection

  @versions_table :cgraph_api_versions

  @default_config %{
    deprecation_header: "X-API-Deprecated",
    sunset_header: "Sunset"
  }

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Get information about a specific API version.
  """
  @spec get_version_info(String.t()) :: {:ok, map()} | {:error, :not_found}
  def get_version_info(version) do
    case :ets.lookup(@versions_table, version) do
      [{^version, info}] -> {:ok, info}
      [] -> {:error, :not_found}
    end
  end

  @doc """
  List all registered API versions with their status.
  """
  @spec list_versions() :: [map()]
  def list_versions do
    :ets.tab2list(@versions_table)
    |> Enum.map(fn {_v, info} -> info end)
    |> Enum.sort_by(& &1.version, :desc)
  end

  @doc """
  Add deprecation headers to a response if the version is deprecated.

  Headers added:
  - X-API-Deprecated: true
  - Sunset: RFC 7231 formatted date
  - Deprecation: RFC 8594 deprecation link
  - Link: Migration guide link
  """
  @spec add_deprecation_headers(Plug.Conn.t()) :: Plug.Conn.t()
  def add_deprecation_headers(conn) do
    version = Detection.get_version(conn)

    case get_version_info(version) do
      {:ok, %{status: :deprecated} = info} ->
        conn
        |> Plug.Conn.put_resp_header(get_config(:deprecation_header), "true")
        |> maybe_add_sunset_header(info)
        |> maybe_add_migration_link(info)

      _ ->
        conn
    end
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp maybe_add_sunset_header(conn, %{sunset_at: nil}), do: conn

  defp maybe_add_sunset_header(conn, %{sunset_at: sunset_at}) do
    # Format as RFC 7231 HTTP-date
    formatted = format_http_date(sunset_at)
    Plug.Conn.put_resp_header(conn, get_config(:sunset_header), formatted)
  end

  defp maybe_add_migration_link(conn, %{migration_guide: nil}), do: conn

  defp maybe_add_migration_link(conn, %{migration_guide: url}) do
    link_value = "<#{url}>; rel=\"deprecation\""
    Plug.Conn.put_resp_header(conn, "link", link_value)
  end

  defp format_http_date(date) do
    # Convert Date to RFC 7231 format: "Sun, 06 Nov 1994 08:49:37 GMT"
    {:ok, datetime} = DateTime.new(date, ~T[00:00:00], "Etc/UTC")
    Calendar.strftime(datetime, "%a, %d %b %Y %H:%M:%S GMT")
  end

  defp get_config(key) do
    app_config = Application.get_env(:cgraph, CGraph.ApiVersioning, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
end
