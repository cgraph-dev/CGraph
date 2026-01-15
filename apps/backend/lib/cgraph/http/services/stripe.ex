defmodule CGraph.HTTP.Services.Stripe do
  @moduledoc """
  Pre-configured HTTP client for Stripe API.

  ## Usage

      CGraph.HTTP.service(:stripe).get("/v1/customers")
      CGraph.HTTP.service(:stripe).post("/v1/charges", %{amount: 1000, currency: "usd"})

  ## Configuration

      config :cgraph, CGraph.HTTP.Services.Stripe,
        api_key: "sk_test_...",
        api_version: "2024-04-10"
  """

  use Tesla

  @base_url "https://api.stripe.com"

  plug Tesla.Middleware.BaseUrl, @base_url
  plug Tesla.Middleware.Headers, [
    {"authorization", "Bearer #{config()[:api_key]}"},
    {"stripe-version", config()[:api_version] || "2024-04-10"}
  ]
  plug Tesla.Middleware.FormUrlencoded
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
  plug CGraph.HTTP.Middleware.CircuitBreaker, name: :stripe_fuse

  adapter {Tesla.Adapter.Finch, name: CGraph.Finch}

  defp config do
    Application.get_env(:cgraph, __MODULE__, [])
  end
end
