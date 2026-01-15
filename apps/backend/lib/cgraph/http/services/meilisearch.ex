defmodule CGraph.HTTP.Services.Meilisearch do
  @moduledoc """
  Pre-configured HTTP client for Meilisearch API.

  ## Usage

      CGraph.HTTP.service(:meilisearch).get("/indexes")
      CGraph.HTTP.service(:meilisearch).post("/indexes/users/search", %{q: "john"})

  ## Configuration

      config :cgraph, CGraph.HTTP.Services.Meilisearch,
        url: "http://localhost:7700",
        api_key: "your_master_key"
  """

  use Tesla

  plug Tesla.Middleware.BaseUrl, fn -> config()[:url] || "http://localhost:7700" end
  plug Tesla.Middleware.Headers, fn ->
    api_key = config()[:api_key]
    
    if api_key do
      [{"authorization", "Bearer #{api_key}"}]
    else
      []
    end
  end
  plug Tesla.Middleware.JSON, engine: Jason
  plug Tesla.Middleware.Timeout, timeout: 10_000
  plug Tesla.Middleware.Retry,
    delay: 500,
    max_retries: 2,
    should_retry: fn
      {:ok, %{status: status}} when status >= 500 -> true
      {:error, _} -> true
      _ -> false
    end
  plug CGraph.HTTP.Middleware.CircuitBreaker, name: :meilisearch_fuse

  adapter {Tesla.Adapter.Finch, name: CGraph.Finch}

  defp config do
    Application.get_env(:cgraph, CGraph.Search.SearchEngine, [])
  end
end
