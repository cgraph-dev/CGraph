defmodule Cgraph.Application do
  @moduledoc """
  Main application supervisor for CGraph backend.
  
  Starts all required services including:
  - Ecto repository
  - Phoenix endpoint
  - Redis connection pool
  - Oban background job processor
  - Presence tracking
  - Token blacklist for JWT revocation
  """
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Start telemetry reporters
      CgraphWeb.Telemetry,

      # Start the Ecto repository
      Cgraph.Repo,

      # Start the PubSub system
      {Phoenix.PubSub, name: Cgraph.PubSub},

      # Start Redis connection pool
      {Redix, redis_config()},

      # Start Cachex for local caching
      {Cachex, name: :cgraph_cache},

      # Start token blacklist for JWT revocation
      Cgraph.Security.TokenBlacklist,

      # Start account lockout for brute force protection
      Cgraph.Security.AccountLockout,

      # Start Finch for HTTP requests (used by Swoosh, Tesla)
      {Finch, name: Cgraph.Finch},

      # Start Oban for background jobs
      {Oban, oban_config()},

      # Start Presence for online status tracking
      Cgraph.Presence,

      # Start the data export service (GDPR compliance)
      Cgraph.DataExport,

      # Start the Phoenix endpoint (must be last)
      CgraphWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: Cgraph.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    CgraphWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  defp redis_config do
    redis_url = System.get_env("REDIS_URL", "redis://localhost:6379")
    
    [
      name: :redix,
      host: redis_host(redis_url),
      port: redis_port(redis_url)
    ]
  end

  defp redis_host(url) do
    uri = URI.parse(url)
    uri.host || "localhost"
  end

  defp redis_port(url) do
    uri = URI.parse(url)
    uri.port || 6379
  end

  defp oban_config do
    Application.fetch_env!(:cgraph, Oban)
  end
end
