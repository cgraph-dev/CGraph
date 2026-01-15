defmodule CGraph.HTTP.Services.Expo do
  @moduledoc """
  Pre-configured HTTP client for Expo Push Notification API.

  ## Usage

      CGraph.HTTP.service(:expo).post("/v2/push/send", %{
        to: "ExponentPushToken[...]",
        title: "Hello",
        body: "World"
      })

  ## Configuration

      config :cgraph, CGraph.HTTP.Services.Expo,
        access_token: "your_access_token"
  """

  use Tesla

  @base_url "https://exp.host"

  plug Tesla.Middleware.BaseUrl, @base_url
  plug Tesla.Middleware.Headers, fn ->
    token = config()[:access_token]
    headers = [{"accept", "application/json"}, {"accept-encoding", "gzip, deflate"}]
    
    if token do
      [{"authorization", "Bearer #{token}"} | headers]
    else
      headers
    end
  end
  plug Tesla.Middleware.JSON, engine: Jason
  plug Tesla.Middleware.Timeout, timeout: 30_000
  plug Tesla.Middleware.Retry,
    delay: 1_000,
    max_retries: 3,
    should_retry: fn
      {:ok, %{status: status}} when status >= 500 -> true
      {:ok, %{status: 429}} -> true
      {:error, _} -> true
      _ -> false
    end
  plug CGraph.HTTP.Middleware.CircuitBreaker, name: :expo_fuse

  adapter {Tesla.Adapter.Finch, name: CGraph.Finch}

  defp config do
    Application.get_env(:cgraph, __MODULE__, [])
  end
end
