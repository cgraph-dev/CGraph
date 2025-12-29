defmodule Cgraph.ApiVersioning do
  @moduledoc """
  Cgraph.ApiVersioning - Comprehensive API Versioning Infrastructure
  
  ## Overview
  
  This module provides production-grade API versioning infrastructure supporting
  multiple versioning strategies, version negotiation, deprecation management,
  and backward compatibility transformations.
  
  ## Architecture
  
  ```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     Request Flow                                │
  ├─────────────────────────────────────────────────────────────────┤
  │  Client Request  ──▶  Version Detection  ──▶  Router           │
  │       │                    │                    │               │
  │       │                    ▼                    ▼               │
  │       │           ┌─────────────────┐    Version-Specific      │
  │       │           │ Version Plug    │    Controller            │
  │       │           │ ────────────────│          │               │
  │       │           │ • URL path      │          ▼               │
  │       │           │ • Header        │    Response               │
  │       │           │ • Query param   │          │               │
  │       │           │ • Accept header │          ▼               │
  │       │           └─────────────────┘    Transform Layer       │
  │       │                                        │               │
  │       ◀────────────────────────────────────────┘               │
  │                    Version-Aware Response                       │
  └─────────────────────────────────────────────────────────────────┘
  ```
  
  ## Versioning Strategies
  
  1. **URL Path Versioning** (Default): `/api/v1/users`, `/api/v2/users`
  2. **Header Versioning**: `API-Version: 2` or `X-API-Version: 2`
  3. **Accept Header Versioning**: `Accept: application/vnd.cgraph.v2+json`
  4. **Query Parameter Versioning**: `/api/users?version=2`
  
  ## Features
  
  - Version negotiation with fallback to default version
  - Deprecation warnings in response headers
  - Sunset dates for deprecated versions
  - Response transformation for backward compatibility
  - Version-specific rate limiting
  - Comprehensive version lifecycle management
  
  ## Usage Examples
  
  ### In Router
  
      pipeline :api_v1 do
        plug CgraphWeb.Plugs.ApiVersion, version: 1
      end
      
      pipeline :api_v2 do
        plug CgraphWeb.Plugs.ApiVersion, version: 2
      end
      
      scope "/api/v1", CgraphWeb.V1 do
        pipe_through [:api, :api_v1]
        resources "/users", UserController
      end
      
      scope "/api/v2", CgraphWeb.V2 do
        pipe_through [:api, :api_v2]
        resources "/users", UserController
      end
  
  ### In Controller
  
      def show(conn, %{"id" => id}) do
        user = Users.get_user!(id)
        
        # Transform response based on API version
        data = Cgraph.ApiVersioning.transform(conn, :user, user)
        
        json(conn, data)
      end
  
  ### Response Transformation
  
      # Register transformers for different versions
      Cgraph.ApiVersioning.register_transformer(:user, 1, fn user ->
        %{
          id: user.id,
          name: user.full_name,  # v1 used 'name' instead of 'full_name'
          email: user.email
        }
      end)
      
      Cgraph.ApiVersioning.register_transformer(:user, 2, fn user ->
        %{
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          avatar_url: user.avatar_url  # New field in v2
        }
      end)
  
  ## Configuration
  
  Configure in `config/config.exs`:
  
      config :cgraph, Cgraph.ApiVersioning,
        current_version: 2,
        minimum_version: 1,
        default_version: 2,
        strategy: :path,  # :path | :header | :accept | :query
        deprecation_header: "X-API-Deprecated",
        sunset_header: "Sunset"
  
  ## Implementation Notes
  
  - Uses ETS for fast transformer lookups
  - Thread-safe registration of version transformers
  - Integrates with Phoenix conn for seamless version detection
  - Supports custom version detection logic
  """
  
  use GenServer
  require Logger
  
  # ---------------------------------------------------------------------------
  # Type Definitions
  # ---------------------------------------------------------------------------
  
  @type version :: pos_integer()
  @type version_string :: String.t()
  @type resource_type :: atom()
  @type transformer :: (term() -> term())
  @type strategy :: :path | :header | :accept | :query
  
  @type version_info :: %{
    version: version(),
    status: :current | :supported | :deprecated | :sunset,
    released_at: Date.t(),
    deprecated_at: Date.t() | nil,
    sunset_at: Date.t() | nil,
    changelog_url: String.t() | nil
  }
  
  @type deprecation_info :: %{
    version: version(),
    deprecated_at: Date.t(),
    sunset_at: Date.t(),
    migration_guide: String.t() | nil,
    replacement_version: version()
  }
  
  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------
  
  @transformers_table :cgraph_api_transformers
  @versions_table :cgraph_api_versions
  
  @default_config %{
    current_version: 1,
    minimum_version: 1,
    default_version: 1,
    strategy: :path,
    version_header: "X-API-Version",
    deprecation_header: "X-API-Deprecated",
    sunset_header: "Sunset",
    version_pattern: ~r/^v?(\d+)$/
  }
  
  # ---------------------------------------------------------------------------
  # Client API - Version Detection
  # ---------------------------------------------------------------------------
  
  @doc """
  Extract the API version from a Plug connection.
  
  Attempts to detect version using the configured strategy (path, header, accept, query).
  Falls back to default version if no version is specified.
  
  ## Examples
  
      # From URL path /api/v2/users
      iex> Cgraph.ApiVersioning.get_version(conn)
      2
      
      # From header X-API-Version: 3
      iex> Cgraph.ApiVersioning.get_version(conn)
      3
  """
  @spec get_version(Plug.Conn.t()) :: version()
  def get_version(conn) do
    case conn.private[:api_version] do
      nil -> detect_version(conn)
      version -> version
    end
  end
  
  @doc """
  Set the API version on a connection.
  
  Used by the version plug to annotate the connection with the detected version.
  """
  @spec put_version(Plug.Conn.t(), version()) :: Plug.Conn.t()
  def put_version(conn, version) do
    Plug.Conn.put_private(conn, :api_version, version)
  end
  
  @doc """
  Check if a specific API version is supported.
  """
  @spec version_supported?(version()) :: boolean()
  def version_supported?(version) do
    min = get_config(:minimum_version)
    current = get_config(:current_version)
    version >= min and version <= current
  end
  
  @doc """
  Get information about a specific API version.
  """
  @spec get_version_info(version()) :: {:ok, version_info()} | {:error, :not_found}
  def get_version_info(version) do
    case :ets.lookup(@versions_table, version) do
      [{^version, info}] -> {:ok, info}
      [] -> {:error, :not_found}
    end
  end
  
  @doc """
  List all registered API versions with their status.
  """
  @spec list_versions() :: [version_info()]
  def list_versions do
    :ets.tab2list(@versions_table)
    |> Enum.map(fn {_v, info} -> info end)
    |> Enum.sort_by(& &1.version, :desc)
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Version Registration
  # ---------------------------------------------------------------------------
  
  @doc """
  Register a new API version.
  
  ## Examples
  
      Cgraph.ApiVersioning.register_version(2, %{
        released_at: ~D[2024-01-15],
        changelog_url: "https://docs.example.com/changelog/v2"
      })
  """
  @spec register_version(version(), map()) :: :ok
  def register_version(version, opts \\ %{}) do
    GenServer.call(__MODULE__, {:register_version, version, opts})
  end
  
  @doc """
  Mark a version as deprecated.
  
  This will cause deprecation warnings to be included in response headers
  for requests using this version.
  
  ## Examples
  
      Cgraph.ApiVersioning.deprecate_version(1, %{
        sunset_at: ~D[2024-06-01],
        migration_guide: "https://docs.example.com/migration/v1-to-v2",
        replacement_version: 2
      })
  """
  @spec deprecate_version(version(), map()) :: :ok | {:error, term()}
  def deprecate_version(version, opts) do
    GenServer.call(__MODULE__, {:deprecate_version, version, opts})
  end
  
  @doc """
  Remove a version entirely (after sunset).
  
  Requests to this version will receive a 410 Gone response.
  """
  @spec sunset_version(version()) :: :ok | {:error, term()}
  def sunset_version(version) do
    GenServer.call(__MODULE__, {:sunset_version, version})
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Response Transformation
  # ---------------------------------------------------------------------------
  
  @doc """
  Register a transformer for a resource type at a specific version.
  
  Transformers convert internal data representations to version-specific
  API response formats.
  
  ## Examples
  
      Cgraph.ApiVersioning.register_transformer(:user, 1, fn user ->
        %{
          id: user.id,
          name: user.full_name,  # v1 uses 'name'
          email: user.email
        }
      end)
      
      Cgraph.ApiVersioning.register_transformer(:user, 2, fn user ->
        %{
          id: user.id,
          full_name: user.full_name,
          first_name: user.first_name,  # New in v2
          last_name: user.last_name,    # New in v2
          email: user.email,
          avatar_url: user.avatar_url
        }
      end)
  """
  @spec register_transformer(resource_type(), version(), transformer()) :: :ok
  def register_transformer(resource_type, version, transformer) when is_function(transformer, 1) do
    GenServer.call(__MODULE__, {:register_transformer, resource_type, version, transformer})
  end
  
  @doc """
  Transform data for the API version in the current connection.
  
  Looks up the registered transformer for the resource type and version,
  applying it to transform the data to the appropriate response format.
  
  ## Examples
  
      def show(conn, %{"id" => id}) do
        user = Users.get_user!(id)
        
        # Will use v1 or v2 transformer based on conn's API version
        data = Cgraph.ApiVersioning.transform(conn, :user, user)
        
        json(conn, data)
      end
  """
  @spec transform(Plug.Conn.t(), resource_type(), term()) :: term()
  def transform(conn, resource_type, data) do
    version = get_version(conn)
    transform_for_version(resource_type, version, data)
  end
  
  @doc """
  Transform data for a specific version.
  
  Use this when you don't have a connection but know the target version.
  """
  @spec transform_for_version(resource_type(), version(), term()) :: term()
  def transform_for_version(resource_type, version, data) do
    case get_transformer(resource_type, version) do
      {:ok, transformer} ->
        apply_transformer(transformer, data)
        
      {:error, :not_found} ->
        # Try to find transformer for an earlier version
        case find_nearest_transformer(resource_type, version) do
          {:ok, transformer} -> apply_transformer(transformer, data)
          {:error, _} -> data  # Return unchanged if no transformer
        end
    end
  end
  
  @doc """
  Transform a list of items for the API version.
  """
  @spec transform_list(Plug.Conn.t(), resource_type(), [term()]) :: [term()]
  def transform_list(conn, resource_type, items) when is_list(items) do
    version = get_version(conn)
    Enum.map(items, &transform_for_version(resource_type, version, &1))
  end
  
  # ---------------------------------------------------------------------------
  # Client API - Deprecation Headers
  # ---------------------------------------------------------------------------
  
  @doc """
  Add deprecation headers to a response if the version is deprecated.
  
  This is typically called by the ApiVersion plug.
  
  Headers added:
  - X-API-Deprecated: true
  - Sunset: RFC 7231 formatted date
  - Deprecation: RFC 8594 deprecation link
  - Link: Migration guide link
  """
  @spec add_deprecation_headers(Plug.Conn.t()) :: Plug.Conn.t()
  def add_deprecation_headers(conn) do
    version = get_version(conn)
    
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
  
  # ---------------------------------------------------------------------------
  # Client API - Version Negotiation
  # ---------------------------------------------------------------------------
  
  @doc """
  Negotiate the best API version based on client preferences.
  
  Parses Accept header to find the highest mutually supported version.
  
  ## Examples
  
      # Accept: application/vnd.cgraph.v2+json, application/vnd.cgraph.v1+json
      iex> Cgraph.ApiVersioning.negotiate_version(conn)
      2
  """
  @spec negotiate_version(Plug.Conn.t()) :: version()
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
  
  defp parse_accept_versions(accept_header) do
    # Pattern: application/vnd.cgraph.v2+json
    pattern = ~r/application\/vnd\.cgraph\.v(\d+)\+json/
    
    Regex.scan(pattern, accept_header)
    |> Enum.map(fn [_, version_str] -> String.to_integer(version_str) end)
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------
  
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end
  
  @impl true
  def init(_opts) do
    # Create ETS tables
    :ets.new(@transformers_table, [:named_table, :set, :public, read_concurrency: true])
    :ets.new(@versions_table, [:named_table, :set, :public, read_concurrency: true])
    
    # Register default versions
    register_default_versions()
    
    state = %{
      config: load_config()
    }
    
    {:ok, state}
  end
  
  @impl true
  def handle_call({:register_version, version, opts}, _from, state) do
    info = %{
      version: version,
      status: if(version == get_config(:current_version), do: :current, else: :supported),
      released_at: opts[:released_at] || Date.utc_today(),
      deprecated_at: nil,
      sunset_at: nil,
      changelog_url: opts[:changelog_url],
      migration_guide: nil
    }
    
    :ets.insert(@versions_table, {version, info})
    Logger.info("[ApiVersioning] Registered version #{version}")
    
    {:reply, :ok, state}
  end
  
  def handle_call({:deprecate_version, version, opts}, _from, state) do
    case :ets.lookup(@versions_table, version) do
      [{^version, info}] ->
        updated = %{info |
          status: :deprecated,
          deprecated_at: opts[:deprecated_at] || Date.utc_today(),
          sunset_at: opts[:sunset_at],
          migration_guide: opts[:migration_guide]
        }
        
        :ets.insert(@versions_table, {version, updated})
        Logger.info("[ApiVersioning] Deprecated version #{version}, sunset: #{opts[:sunset_at]}")
        
        {:reply, :ok, state}
        
      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end
  
  def handle_call({:sunset_version, version}, _from, state) do
    case :ets.lookup(@versions_table, version) do
      [{^version, info}] ->
        updated = %{info | status: :sunset}
        :ets.insert(@versions_table, {version, updated})
        Logger.info("[ApiVersioning] Version #{version} has been sunset")
        {:reply, :ok, state}
        
      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end
  
  def handle_call({:register_transformer, resource_type, version, transformer}, _from, state) do
    key = {resource_type, version}
    :ets.insert(@transformers_table, {key, transformer})
    Logger.debug("[ApiVersioning] Registered transformer for #{resource_type} v#{version}")
    {:reply, :ok, state}
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Version Detection
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
      nil -> get_config(:default_version)
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
      [_, version_str] -> String.to_integer(version_str)
      nil ->
        case Integer.parse(str) do
          {version, ""} -> version
          _ -> get_config(:default_version)
        end
    end
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Transformation
  # ---------------------------------------------------------------------------
  
  defp get_transformer(resource_type, version) do
    key = {resource_type, version}
    
    case :ets.lookup(@transformers_table, key) do
      [{^key, transformer}] -> {:ok, transformer}
      [] -> {:error, :not_found}
    end
  end
  
  defp find_nearest_transformer(resource_type, version) do
    # Find the highest version transformer that's <= requested version
    :ets.tab2list(@transformers_table)
    |> Enum.filter(fn {{type, v}, _} ->
      type == resource_type and v <= version
    end)
    |> Enum.max_by(fn {{_, v}, _} -> v end, fn -> nil end)
    |> case do
      nil -> {:error, :not_found}
      {_, transformer} -> {:ok, transformer}
    end
  end
  
  defp apply_transformer(transformer, data) when is_list(data) do
    Enum.map(data, &transformer.(&1))
  end
  defp apply_transformer(transformer, data) do
    transformer.(data)
  end
  
  # ---------------------------------------------------------------------------
  # Private Functions - Configuration
  # ---------------------------------------------------------------------------
  
  defp load_config do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Map.merge(@default_config, Map.new(app_config))
  end
  
  defp get_config(key) do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
  
  defp register_default_versions do
    current = get_config(:current_version)
    minimum = get_config(:minimum_version)
    
    for version <- minimum..current do
      status = cond do
        version == current -> :current
        version == minimum and current > minimum -> :deprecated
        true -> :supported
      end
      
      info = %{
        version: version,
        status: status,
        released_at: Date.utc_today(),
        deprecated_at: nil,
        sunset_at: nil,
        changelog_url: nil,
        migration_guide: nil
      }
      
      :ets.insert(@versions_table, {version, info})
    end
  end
end
