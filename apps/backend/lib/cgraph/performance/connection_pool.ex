defmodule Cgraph.Performance.ConnectionPool do
  @moduledoc """
  Connection pool configuration and management utilities.
  
  ## Overview
  
  Provides optimal connection pool settings and utilities for:
  
  - Database connections (Ecto/DBConnection)
  - HTTP client connections (Finch/Mint)
  - Redis connections
  - External API connections
  
  ## Pool Sizing Guidelines
  
  ### Database Pool
  
  Base formula: `(cores * 2) + spindles`
  
  For cloud/SSD: `cores * 4` as a starting point
  
  Adjust based on:
  - Query complexity
  - Lock contention
  - Connection overhead
  
  ### HTTP Pools
  
  Per-host pools prevent one slow service from affecting others.
  
  ## Configuration Example
  
      # In config.exs
      config :cgraph, Cgraph.Performance.ConnectionPool,
        database: %{
          pool_size: 20,
          queue_target: 50,
          queue_interval: 1000
        },
        http: %{
          default: %{size: 10, count: 1},
          external_api: %{size: 25, count: 2}
        }
  """
  
  require Logger
  
  @doc """
  Calculate optimal database pool size based on available resources.
  
  ## Options
  
  - `:cpu_cores` - Number of CPU cores (auto-detected if not provided)
  - `:expected_qps` - Expected queries per second
  - `:avg_query_time_ms` - Average query time in milliseconds
  - `:max_connections` - Maximum allowed by database
  
  ## Returns
  
  Map with recommended settings.
  """
  @spec calculate_db_pool_size(keyword()) :: map()
  def calculate_db_pool_size(opts \\ []) do
    cores = Keyword.get(opts, :cpu_cores, System.schedulers_online())
    expected_qps = Keyword.get(opts, :expected_qps, 100)
    avg_query_time_ms = Keyword.get(opts, :avg_query_time_ms, 5)
    max_connections = Keyword.get(opts, :max_connections, 100)
    
    # Base calculation
    base_size = cores * 4
    
    # Adjust for expected load
    # connections_needed = (qps * avg_query_time_ms) / 1000
    connections_for_load = ceil((expected_qps * avg_query_time_ms) / 1000)
    
    # Take the higher of base or load-based, but don't exceed max
    recommended = min(max(base_size, connections_for_load), max_connections)
    
    # Queue settings
    queue_target = 50  # Target wait time in ms
    queue_interval = 1000  # Check interval in ms
    
    %{
      pool_size: recommended,
      queue_target: queue_target,
      queue_interval: queue_interval,
      overflow: 0,  # Overflow connections (use sparingly)
      explanation: %{
        cores: cores,
        base_calculation: base_size,
        load_calculation: connections_for_load,
        max_allowed: max_connections
      }
    }
  end
  
  @doc """
  Get Finch HTTP pool configuration for multiple services.
  
  Creates separate pools per host to isolate failures.
  """
  @spec http_pool_config(keyword()) :: keyword()
  def http_pool_config(opts \\ []) do
    base_config = [
      name: Cgraph.Finch,
      pools: %{
        :default => build_pool_spec(:default, opts),
        
        # Separate pools for different external services
        "https://api.stripe.com" => build_pool_spec(:payment, opts),
        "https://api.sendgrid.com" => build_pool_spec(:email, opts),
        "https://api.twilio.com" => build_pool_spec(:sms, opts),
        "https://s3.amazonaws.com" => build_pool_spec(:storage, opts),
        "https://api.cloudflare.com" => build_pool_spec(:cdn, opts)
      }
    ]
    
    # Merge with custom pool overrides
    custom_pools = Keyword.get(opts, :custom_pools, %{})
    
    update_in(base_config, [:pools], &Map.merge(&1, custom_pools))
  end
  
  defp build_pool_spec(pool_type, opts) do
    defaults = %{
      default: [size: 10, count: 1],
      payment: [size: 5, count: 1, protocol: :http2],
      email: [size: 10, count: 2],
      sms: [size: 5, count: 1],
      storage: [size: 25, count: 4, protocol: :http1],
      cdn: [size: 10, count: 2]
    }
    
    base = Map.get(defaults, pool_type, [size: 10, count: 1])
    overrides = Keyword.get(opts, pool_type, [])
    
    Keyword.merge(base, overrides)
  end
  
  @doc """
  Get Redis connection pool configuration.
  """
  @spec redis_pool_config(keyword()) :: keyword()
  def redis_pool_config(opts \\ []) do
    cores = System.schedulers_online()
    
    [
      pool_size: Keyword.get(opts, :pool_size, cores * 2),
      pool_max_overflow: Keyword.get(opts, :overflow, 5),
      connection_timeout: Keyword.get(opts, :timeout, 5_000),
      socket_opts: [
        nodelay: true,
        keepalive: true
      ]
    ]
  end
  
  @doc """
  Monitor pool health and return metrics.
  """
  @spec pool_health() :: map()
  def pool_health do
    db_stats = get_db_pool_stats()
    
    %{
      database: db_stats,
      timestamp: DateTime.utc_now(),
      healthy: db_stats.idle > 0 || db_stats.queue_length < 10
    }
  end
  
  defp get_db_pool_stats do
    # Return placeholder stats - actual implementation depends on pool type
    %{
      size: 0,
      idle: 0,
      busy: 0,
      queue_length: 0,
      note: "Pool stats not available - use Ecto telemetry for metrics"
    }
  end
  
  @doc """
  Dynamically adjust pool size based on load.
  
  Should be called periodically (e.g., every minute).
  """
  @spec auto_tune_pools() :: map()
  def auto_tune_pools do
    stats = pool_health()
    
    recommendations = %{}
    
    # Check if we're consistently queuing
    recommendations = if stats.database.queue_length > 5 do
      Map.put(recommendations, :database, %{
        action: :increase_pool,
        reason: "Queue length #{stats.database.queue_length} > threshold",
        suggested_increase: min(5, stats.database.queue_length)
      })
    else
      recommendations
    end
    
    # Check if we have too many idle connections
    idle_ratio = if stats.database.size > 0 do
      stats.database.idle / stats.database.size
    else
      0
    end
    
    recommendations = if idle_ratio > 0.8 and stats.database.size > 10 do
      Map.put(recommendations, :database_shrink, %{
        action: :consider_shrinking,
        reason: "#{round(idle_ratio * 100)}% connections idle",
        idle_count: stats.database.idle
      })
    else
      recommendations
    end
    
    %{
      current_stats: stats,
      recommendations: recommendations,
      analyzed_at: DateTime.utc_now()
    }
  end
  
  @doc """
  Generate Ecto Repo configuration for production.
  """
  @spec ecto_repo_config(keyword()) :: keyword()
  def ecto_repo_config(opts \\ []) do
    pool_config = calculate_db_pool_size(opts)
    
    [
      pool_size: pool_config.pool_size,
      queue_target: pool_config.queue_target,
      queue_interval: pool_config.queue_interval,
      
      # Connection settings
      timeout: Keyword.get(opts, :timeout, 15_000),
      connect_timeout: Keyword.get(opts, :connect_timeout, 15_000),
      handshake_timeout: Keyword.get(opts, :handshake_timeout, 15_000),
      
      # SSL for production
      ssl: Keyword.get(opts, :ssl, false),
      ssl_opts: [
        verify: :verify_peer,
        cacertfile: CAStore.file_path(),
        depth: 2
      ],
      
      # Prepared statements
      prepare: :named,
      
      # Socket options for reliability
      socket_options: [
        keepalive: true,
        nodelay: true
      ]
    ]
  end
end
