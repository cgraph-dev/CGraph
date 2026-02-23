defmodule CGraph.ApiVersioning do
  @moduledoc """
  CGraph.ApiVersioning — thin delegation facade.

  Delegates to specialized sub-modules:

  - `Detection`      — Version extraction from connections (path, header, accept, query)
  - `Transformation` — Response data transformation per API version
  - `Deprecation`    — Deprecation headers, version info, and lifecycle management
  """

  use GenServer
  require Logger

  alias CGraph.ApiVersioning.{Deprecation, Detection, Transformation}

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
  # Version Detection (delegated)
  # ---------------------------------------------------------------------------

  defdelegate get_version(conn), to: Detection
  defdelegate put_version(conn, version), to: Detection
  defdelegate version_supported?(version), to: Detection
  defdelegate negotiate_version(conn), to: Detection

  # ---------------------------------------------------------------------------
  # Version Info & Deprecation (delegated)
  # ---------------------------------------------------------------------------

  defdelegate get_version_info(version), to: Deprecation
  defdelegate list_versions(), to: Deprecation
  defdelegate add_deprecation_headers(conn), to: Deprecation

  # ---------------------------------------------------------------------------
  # Response Transformation (delegated)
  # ---------------------------------------------------------------------------

  defdelegate transform(conn, resource_type, data), to: Transformation
  defdelegate transform_for_version(resource_type, version, data), to: Transformation
  defdelegate transform_list(conn, resource_type, items), to: Transformation

  # ---------------------------------------------------------------------------
  # Version Registration (GenServer calls)
  # ---------------------------------------------------------------------------

  @doc """
  Register a new API version.
  """
  @spec register_version(version(), map()) :: :ok
  def register_version(version, opts \\ %{}) do
    GenServer.call(__MODULE__, {:register_version, version, opts})
  end

  @doc """
  Mark a version as deprecated.
  """
  @spec deprecate_version(version(), keyword() | map()) :: :ok | {:error, :not_found}
  def deprecate_version(version, opts) do
    GenServer.call(__MODULE__, {:deprecate_version, version, opts})
  end

  @doc """
  Remove a version entirely (after sunset).
  """
  @spec sunset_version(version()) :: :ok | {:error, :not_found}
  def sunset_version(version) do
    GenServer.call(__MODULE__, {:sunset_version, version})
  end

  @doc """
  Register a transformer for a resource type at a specific version.
  """
  @spec register_transformer(resource_type(), version(), transformer()) :: :ok
  def register_transformer(resource_type, version, transformer) when is_function(transformer, 1) do
    GenServer.call(__MODULE__, {:register_transformer, resource_type, version, transformer})
  end

  # ---------------------------------------------------------------------------
  # GenServer Callbacks
  # ---------------------------------------------------------------------------

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "Initializes the API versioning server state."
  @spec init(keyword()) :: {:ok, map()}
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

  @doc "Handles synchronous call messages."
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
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
    Logger.info("apiversioning_registered_version", version: version)

    {:reply, :ok, state}
  end

  def handle_call({:deprecate_version, version, opts}, _from, state) do
    case :ets.lookup(@versions_table, version) do
      [{^version, info}] ->
        updated = %{
          info
          | status: :deprecated,
            deprecated_at: opts[:deprecated_at] || Date.utc_today(),
            sunset_at: opts[:sunset_at],
            migration_guide: opts[:migration_guide]
        }

        :ets.insert(@versions_table, {version, updated})

        Logger.info("apiversioning_deprecated_version_sunset",
          version: version,
          opts_sunset_at: inspect(opts[:sunset_at])
        )

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
        Logger.info("apiversioning_version_has_been_sunset", version: version)
        {:reply, :ok, state}

      [] ->
        {:reply, {:error, :not_found}, state}
    end
  end

  def handle_call({:register_transformer, resource_type, version, transformer}, _from, state) do
    Transformation.do_register_transformer(resource_type, version, transformer)
    {:reply, :ok, state}
  end

  # ---------------------------------------------------------------------------
  # Private Functions
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
      status =
        cond do
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
