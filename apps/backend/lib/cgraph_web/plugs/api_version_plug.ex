defmodule CgraphWeb.Plugs.ApiVersion do
  @moduledoc """
  CgraphWeb.Plugs.ApiVersion - API Version Detection and Validation Plug
  
  ## Overview
  
  This plug handles API version detection, validation, and response header
  management for versioned API endpoints. It integrates with `Cgraph.ApiVersioning`
  to provide a complete versioning solution.
  
  ## Features
  
  - Automatic version detection from URL path, headers, or query params
  - Version validation against supported version range
  - Deprecation warning headers for deprecated versions
  - 410 Gone responses for sunset versions
  - Version information in response headers
  
  ## Usage
  
  ### In Router Pipeline
  
      pipeline :api_v1 do
        plug CgraphWeb.Plugs.ApiVersion, version: 1
      end
      
      # Or with automatic detection
      pipeline :api_versioned do
        plug CgraphWeb.Plugs.ApiVersion
      end
  
  ### Options
  
  - `:version` - Explicit version to use (bypasses detection)
  - `:require` - Require version to be specified (no default fallback)
  - `:min_version` - Minimum acceptable version for this route
  - `:max_version` - Maximum acceptable version for this route
  
  ## Response Headers
  
  The plug adds these headers to all responses:
  
  - `X-API-Version`: The version used for the request
  - `X-API-Deprecated`: Present if version is deprecated
  - `Sunset`: RFC 7231 date when deprecated version will be removed
  - `Link`: Migration guide link for deprecated versions
  
  ## Error Responses
  
  - **400 Bad Request**: Invalid version format
  - **406 Not Acceptable**: Version not in acceptable range
  - **410 Gone**: Version has been sunset
  
  ## Examples
  
  ### Explicit Version
  
      plug CgraphWeb.Plugs.ApiVersion, version: 2
  
  ### Version Range
  
      plug CgraphWeb.Plugs.ApiVersion, min_version: 2, max_version: 3
  
  ### Required Version
  
      plug CgraphWeb.Plugs.ApiVersion, require: true
  """
  
  @behaviour Plug
  
  import Plug.Conn
  require Logger
  
  alias Cgraph.ApiVersioning
  
  # ---------------------------------------------------------------------------
  # Plug Callbacks
  # ---------------------------------------------------------------------------
  
  @impl true
  def init(opts) do
    %{
      version: Keyword.get(opts, :version),
      require: Keyword.get(opts, :require, false),
      min_version: Keyword.get(opts, :min_version),
      max_version: Keyword.get(opts, :max_version)
    }
  end
  
  @impl true
  def call(conn, opts) do
    case resolve_version(conn, opts) do
      {:ok, version} ->
        conn
        |> ApiVersioning.put_version(version)
        |> add_version_headers(version)
        |> check_deprecation(version)
        
      {:error, :missing} ->
        conn
        |> send_error(400, "API version is required but not specified")
        |> halt()
        
      {:error, :invalid} ->
        conn
        |> send_error(400, "Invalid API version format")
        |> halt()
        
      {:error, :not_supported} ->
        conn
        |> send_error(406, "API version not supported")
        |> halt()
        
      {:error, :sunset} ->
        conn
        |> send_error(410, "API version has been sunset and is no longer available")
        |> halt()
        
      {:error, :out_of_range, min, max} ->
        conn
        |> send_error(406, "API version must be between #{min} and #{max}")
        |> halt()
    end
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Version Resolution
  # ---------------------------------------------------------------------------
  
  defp resolve_version(conn, %{version: explicit_version}) when not is_nil(explicit_version) do
    validate_version(explicit_version, conn, %{version: explicit_version})
  end
  
  defp resolve_version(conn, opts) do
    case detect_version(conn) do
      nil when opts.require ->
        {:error, :missing}
        
      nil ->
        version = get_default_version()
        validate_version(version, conn, opts)
        
      version ->
        validate_version(version, conn, opts)
    end
  end
  
  defp detect_version(conn) do
    # Try multiple detection strategies in order
    detect_from_path(conn) ||
      detect_from_header(conn) ||
      detect_from_query(conn) ||
      detect_from_accept(conn)
  end
  
  defp detect_from_path(conn) do
    pattern = ~r/^v(\d+)$/
    
    conn.path_info
    |> Enum.find_value(fn segment ->
      case Regex.run(pattern, segment) do
        [_, version_str] -> String.to_integer(version_str)
        _ -> nil
      end
    end)
  end
  
  defp detect_from_header(conn) do
    header_names = ["x-api-version", "api-version"]
    
    Enum.find_value(header_names, fn header ->
      case get_req_header(conn, header) do
        [version_str | _] -> parse_version(version_str)
        [] -> nil
      end
    end)
  end
  
  defp detect_from_query(conn) do
    case conn.query_params["version"] || conn.query_params["api_version"] do
      nil -> nil
      version_str -> parse_version(version_str)
    end
  end
  
  defp detect_from_accept(conn) do
    case get_req_header(conn, "accept") do
      [accept | _] ->
        pattern = ~r/application\/vnd\.cgraph\.v(\d+)\+json/
        
        case Regex.run(pattern, accept) do
          [_, version_str] -> String.to_integer(version_str)
          _ -> nil
        end
        
      [] ->
        nil
    end
  end
  
  defp parse_version(str) do
    # Handle both "2" and "v2" formats
    str = String.trim(str)
    
    cond do
      String.starts_with?(str, "v") ->
        case Integer.parse(String.slice(str, 1..-1//1)) do
          {version, ""} -> version
          _ -> nil
        end
        
      true ->
        case Integer.parse(str) do
          {version, ""} -> version
          _ -> nil
        end
    end
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Version Validation
  # ---------------------------------------------------------------------------
  
  defp validate_version(version, _conn, opts) when is_integer(version) do
    cond do
      # Check version range constraints
      opts[:min_version] && version < opts[:min_version] ->
        {:error, :out_of_range, opts[:min_version], opts[:max_version] || get_current_version()}
        
      opts[:max_version] && version > opts[:max_version] ->
        {:error, :out_of_range, opts[:min_version] || get_min_version(), opts[:max_version]}
        
      # Check if version is sunset
      version_sunset?(version) ->
        {:error, :sunset}
        
      # Check if version is supported
      not ApiVersioning.version_supported?(version) ->
        {:error, :not_supported}
        
      true ->
        {:ok, version}
    end
  end
  
  defp validate_version(_version, _conn, _opts) do
    {:error, :invalid}
  end
  
  defp version_sunset?(version) do
    case ApiVersioning.get_version_info(version) do
      {:ok, %{status: :sunset}} -> true
      _ -> false
    end
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Response Headers
  # ---------------------------------------------------------------------------
  
  defp add_version_headers(conn, version) do
    conn
    |> put_resp_header("x-api-version", Integer.to_string(version))
    |> put_resp_header("x-api-current-version", Integer.to_string(get_current_version()))
  end
  
  defp check_deprecation(conn, version) do
    case ApiVersioning.get_version_info(version) do
      {:ok, %{status: :deprecated} = info} ->
        conn
        |> put_resp_header("x-api-deprecated", "true")
        |> maybe_add_sunset(info)
        |> maybe_add_migration_link(info)
        |> log_deprecated_usage(version)
        
      _ ->
        conn
    end
  end
  
  defp maybe_add_sunset(conn, %{sunset_at: nil}), do: conn
  defp maybe_add_sunset(conn, %{sunset_at: sunset_at}) do
    # Format as RFC 7231 HTTP-date
    formatted = format_sunset_date(sunset_at)
    put_resp_header(conn, "sunset", formatted)
  end
  
  defp format_sunset_date(date) do
    {:ok, datetime} = DateTime.new(date, ~T[00:00:00], "Etc/UTC")
    Calendar.strftime(datetime, "%a, %d %b %Y %H:%M:%S GMT")
  end
  
  defp maybe_add_migration_link(conn, %{migration_guide: nil}), do: conn
  defp maybe_add_migration_link(conn, %{migration_guide: url}) do
    # RFC 8594 deprecation link
    existing_links = get_resp_header(conn, "link")
    deprecation_link = "<#{url}>; rel=\"deprecation\""
    
    link_value = case existing_links do
      [] -> deprecation_link
      [existing] -> "#{existing}, #{deprecation_link}"
    end
    
    put_resp_header(conn, "link", link_value)
  end
  
  defp log_deprecated_usage(conn, version) do
    Logger.warning(
      "[ApiVersion] Deprecated version #{version} used: " <>
      "#{conn.method} #{conn.request_path}"
    )
    conn
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Error Responses
  # ---------------------------------------------------------------------------
  
  defp send_error(conn, status, message) do
    body = Jason.encode!(%{
      error: %{
        code: error_code(status),
        message: message,
        supported_versions: get_supported_versions(),
        current_version: get_current_version()
      }
    })
    
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, body)
  end
  
  defp error_code(400), do: "INVALID_VERSION"
  defp error_code(406), do: "VERSION_NOT_ACCEPTABLE"
  defp error_code(410), do: "VERSION_SUNSET"
  defp error_code(_), do: "VERSION_ERROR"
  
  # ---------------------------------------------------------------------------
  # Private Functions - Configuration Helpers
  # ---------------------------------------------------------------------------
  
  defp get_default_version do
    Application.get_env(:cgraph, Cgraph.ApiVersioning, [])
    |> Keyword.get(:default_version, 1)
  end
  
  defp get_current_version do
    Application.get_env(:cgraph, Cgraph.ApiVersioning, [])
    |> Keyword.get(:current_version, 1)
  end
  
  defp get_min_version do
    Application.get_env(:cgraph, Cgraph.ApiVersioning, [])
    |> Keyword.get(:minimum_version, 1)
  end
  
  defp get_supported_versions do
    min = get_min_version()
    current = get_current_version()
    Enum.to_list(min..current)
  end
end
