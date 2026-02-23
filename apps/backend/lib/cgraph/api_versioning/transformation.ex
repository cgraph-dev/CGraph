defmodule CGraph.ApiVersioning.Transformation do
  @moduledoc false

  require Logger

  alias CGraph.ApiVersioning.Detection

  @transformers_table :cgraph_api_transformers

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Transform data for the API version in the current connection.
  """
  @spec transform(Plug.Conn.t(), atom(), term()) :: term()
  def transform(conn, resource_type, data) do
    version = Detection.get_version(conn)
    transform_for_version(resource_type, version, data)
  end

  @doc """
  Transform data for a specific version.
  """
  @spec transform_for_version(atom(), integer(), term()) :: term()
  def transform_for_version(resource_type, version, data) do
    case get_transformer(resource_type, version) do
      {:ok, transformer} ->
        apply_transformer(transformer, data)

      {:error, :not_found} ->
        # Try to find transformer for an earlier version
        case find_nearest_transformer(resource_type, version) do
          {:ok, transformer} -> apply_transformer(transformer, data)
          {:error, _} -> data
        end
    end
  end

  @doc """
  Transform a list of items for the API version.
  """
  @spec transform_list(Plug.Conn.t(), atom(), list()) :: list()
  def transform_list(conn, resource_type, items) when is_list(items) do
    version = Detection.get_version(conn)
    Enum.map(items, &transform_for_version(resource_type, version, &1))
  end

  # ---------------------------------------------------------------------------
  # Internal API (called by GenServer handle_call)
  # ---------------------------------------------------------------------------

  @doc false
  @spec do_register_transformer(atom(), integer(), (term() -> term())) :: true
  def do_register_transformer(resource_type, version, transformer) do
    key = {resource_type, version}
    :ets.insert(@transformers_table, {key, transformer})
    Logger.debug("apiversioning_registered_transformer_for_v",
      resource_type: resource_type,
      version: version
    )
  end

  # ---------------------------------------------------------------------------
  # Private Functions
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
end
