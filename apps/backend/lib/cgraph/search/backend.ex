defmodule CGraph.Search.Backend do
  @moduledoc """
  Behaviour definition for search backends.

  Implementations must provide search, index, and delete operations.
  """

  @type index_name :: atom()
  @type document :: map()
  @type document_id :: String.t()
  @type search_opts :: keyword()

  @type search_result :: %{
    hits: [map()],
    total: non_neg_integer(),
    processing_time_ms: non_neg_integer(),
    query: String.t()
  }

  @callback search(index_name(), String.t(), search_opts()) ::
    {:ok, search_result()} | {:error, term()}

  @callback index(index_name(), document()) ::
    :ok | {:error, term()}

  @callback bulk_index(index_name(), [document()]) ::
    :ok | {:error, term()}

  @callback delete(index_name(), document_id()) ::
    :ok | {:error, term()}

  @callback bulk_delete(index_name(), [document_id()]) ::
    :ok | {:error, term()}
end
