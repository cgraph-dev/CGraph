defmodule CGraph.ApiVersioning.Detection do
  @moduledoc false

  @default_config %{
    current_version: 1,
    minimum_version: 1,
    default_version: 1,
    strategy: :path,
    version_header: "X-API-Version",
    version_pattern: ~r/^v?(\d+)$/
  }

  # ---------------------------------------------------------------------------
  # Version Detection
  # ---------------------------------------------------------------------------

  @doc """
  Extract the API version from a Plug connection.
  """
  def get_version(conn) do
    case conn.private[:api_version] do
      nil -> detect_version(conn)
      version -> version
    end
  end

  @doc """
  Set the API version on a connection.
  """
  def put_version(conn, version) do
    Plug.Conn.put_private(conn, :api_version, version)
  end

  @doc """
  Check if a specific API version is supported.
  """
  def version_supported?(version) do
    min = get_config(:minimum_version)
    current = get_config(:current_version)
    version >= min and version <= current
  end

  @doc """
  Negotiate the best API version based on client preferences.

  Parses Accept header to find the highest mutually supported version.
  """
  def negotiate_version(conn) do
    accept_header = Plug.Conn.get_req_header(conn, "accept") |> List.first() || ""

    # Parse version preferences from Accept header
    versions = parse_accept_versions(accept_header)

    if versions == [] do
      get_config(:default_version)
    else
      # Find highest supported version from preferences
      versions
      |> Enum.filter(&version_supported?/1)
      |> Enum.max(fn -> get_config(:default_version) end)
    end
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp detect_version(conn) do
    strategy = get_config(:strategy)

    case strategy do
      :path -> detect_from_path(conn)
      :header -> detect_from_header(conn)
      :accept -> detect_from_accept(conn)
      :query -> detect_from_query(conn)
      _ -> get_config(:default_version)
    end
  end

  defp detect_from_path(conn) do
    pattern = get_config(:version_pattern)

    # Look for version in path like /api/v1/... or /v2/...
    conn.path_info
    |> Enum.find(fn segment ->
      Regex.match?(pattern, segment)
    end)
    |> case do
      nil ->
        get_config(:default_version)

      segment ->
        case Regex.run(pattern, segment) do
          [_, version_str] -> String.to_integer(version_str)
          _ -> get_config(:default_version)
        end
    end
  end

  defp detect_from_header(conn) do
    header_name = get_config(:version_header) |> String.downcase()

    case Plug.Conn.get_req_header(conn, header_name) do
      [version_str | _] -> parse_version_string(version_str)
      [] -> get_config(:default_version)
    end
  end

  defp detect_from_accept(conn) do
    negotiate_version(conn)
  end

  defp detect_from_query(conn) do
    case conn.query_params["version"] do
      nil -> get_config(:default_version)
      version_str -> parse_version_string(version_str)
    end
  end

  defp parse_version_string(str) do
    pattern = get_config(:version_pattern)

    case Regex.run(pattern, str) do
      [_, version_str] ->
        String.to_integer(version_str)

      nil ->
        case Integer.parse(str) do
          {version, ""} -> version
          _ -> get_config(:default_version)
        end
    end
  end

  defp parse_accept_versions(accept_header) do
    # Pattern: application/vnd.cgraph.v2+json
    pattern = ~r/application\/vnd\.cgraph\.v(\d+)\+json/

    Regex.scan(pattern, accept_header)
    |> Enum.map(fn [_, version_str] -> String.to_integer(version_str) end)
  end

  defp get_config(key) do
    app_config = Application.get_env(:cgraph, CGraph.ApiVersioning, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
end
