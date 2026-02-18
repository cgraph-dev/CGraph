defmodule CGraph.Performance.ConnectionPoolTest do
  use ExUnit.Case, async: true

  alias CGraph.Performance.ConnectionPool

  describe "calculate_db_pool_size/1" do
    test "returns map with required keys" do
      result = ConnectionPool.calculate_db_pool_size()

      assert is_map(result)
      assert Map.has_key?(result, :pool_size)
      assert Map.has_key?(result, :queue_target)
      assert Map.has_key?(result, :queue_interval)
      assert Map.has_key?(result, :overflow)
      assert Map.has_key?(result, :explanation)
    end

    test "pool_size based on cpu cores" do
      result = ConnectionPool.calculate_db_pool_size(cpu_cores: 4)
      # base = 4 * 4 = 16, load = ceil(100 * 5 / 1000) = 1
      # max(16, 1) = 16, min(16, 100) = 16
      assert result.pool_size == 16
    end

    test "pool_size scales with high QPS" do
      result = ConnectionPool.calculate_db_pool_size(
        cpu_cores: 2,
        expected_qps: 5000,
        avg_query_time_ms: 10
      )
      # base = 2 * 4 = 8, load = ceil(5000 * 10 / 1000) = 50
      # max(8, 50) = 50, min(50, 100) = 50
      assert result.pool_size == 50
    end

    test "respects max_connections limit" do
      result = ConnectionPool.calculate_db_pool_size(
        cpu_cores: 32,
        max_connections: 20
      )
      # base = 32 * 4 = 128, min(128, 20) = 20
      assert result.pool_size == 20
    end

    test "explanation includes core details" do
      result = ConnectionPool.calculate_db_pool_size(cpu_cores: 4)
      assert result.explanation.cores == 4
      assert result.explanation.base_calculation == 16
    end

    test "queue settings are reasonable" do
      result = ConnectionPool.calculate_db_pool_size()
      assert result.queue_target == 50
      assert result.queue_interval == 1000
      assert result.overflow == 0
    end
  end

  describe "http_pool_config/1" do
    test "returns keyword list with name and pools" do
      config = ConnectionPool.http_pool_config()
      assert Keyword.has_key?(config, :name)
      assert Keyword.has_key?(config, :pools)
    end

    test "includes default pool" do
      config = ConnectionPool.http_pool_config()
      pools = Keyword.get(config, :pools)
      assert Map.has_key?(pools, :default)
    end

    test "includes per-service pools" do
      config = ConnectionPool.http_pool_config()
      pools = Keyword.get(config, :pools)

      assert Map.has_key?(pools, "https://api.stripe.com")
      assert Map.has_key?(pools, "https://api.sendgrid.com")
      assert Map.has_key?(pools, "https://api.twilio.com")
      assert Map.has_key?(pools, "https://s3.amazonaws.com")
      assert Map.has_key?(pools, "https://api.cloudflare.com")
    end

    test "payment pool uses http2" do
      config = ConnectionPool.http_pool_config()
      pools = Keyword.get(config, :pools)
      stripe_pool = pools["https://api.stripe.com"]

      assert Keyword.get(stripe_pool, :protocol) == :http2
    end

    test "storage pool has large size" do
      config = ConnectionPool.http_pool_config()
      pools = Keyword.get(config, :pools)
      s3_pool = pools["https://s3.amazonaws.com"]

      assert Keyword.get(s3_pool, :size) == 25
      assert Keyword.get(s3_pool, :count) == 4
    end

    test "accepts custom pool overrides" do
      config = ConnectionPool.http_pool_config(
        custom_pools: %{"https://custom.api.com" => [size: 50, count: 2]}
      )
      pools = Keyword.get(config, :pools)

      assert Map.has_key?(pools, "https://custom.api.com")
      assert Keyword.get(pools["https://custom.api.com"], :size) == 50
    end
  end

  describe "redis_pool_config/1" do
    test "returns keyword list with pool settings" do
      config = ConnectionPool.redis_pool_config()

      assert Keyword.has_key?(config, :pool_size)
      assert Keyword.has_key?(config, :pool_max_overflow)
      assert Keyword.has_key?(config, :connection_timeout)
      assert Keyword.has_key?(config, :socket_opts)
    end

    test "pool_size scales with schedulers" do
      config = ConnectionPool.redis_pool_config()
      # Should be schedulers * 2
      expected = System.schedulers_online() * 2
      assert Keyword.get(config, :pool_size) == expected
    end

    test "accepts custom pool_size" do
      config = ConnectionPool.redis_pool_config(pool_size: 42)
      assert Keyword.get(config, :pool_size) == 42
    end

    test "socket options enable keepalive" do
      config = ConnectionPool.redis_pool_config()
      socket_opts = Keyword.get(config, :socket_opts)

      assert Keyword.get(socket_opts, :keepalive) == true
      assert Keyword.get(socket_opts, :nodelay) == true
    end
  end

  describe "pool_health/0" do
    test "returns health status map" do
      health = ConnectionPool.pool_health()

      assert is_map(health)
      assert Map.has_key?(health, :database)
      assert Map.has_key?(health, :timestamp)
      assert Map.has_key?(health, :healthy)
    end

    test "database stats include expected fields" do
      health = ConnectionPool.pool_health()
      db = health.database

      assert Map.has_key?(db, :size)
      assert Map.has_key?(db, :idle)
      assert Map.has_key?(db, :busy)
      assert Map.has_key?(db, :queue_length)
    end
  end

  describe "auto_tune_pools/0" do
    test "returns tuning recommendations" do
      result = ConnectionPool.auto_tune_pools()

      assert is_map(result)
      assert Map.has_key?(result, :current_stats)
      assert Map.has_key?(result, :recommendations)
      assert Map.has_key?(result, :analyzed_at)
    end
  end

  describe "ecto_repo_config/1" do
    test "returns keyword list with pool and connection settings" do
      config = ConnectionPool.ecto_repo_config(cpu_cores: 4)

      assert Keyword.has_key?(config, :pool_size)
      assert Keyword.has_key?(config, :timeout)
      assert Keyword.has_key?(config, :connect_timeout)
      assert Keyword.has_key?(config, :prepare)
      assert Keyword.has_key?(config, :socket_options)
    end

    test "uses calculated pool size" do
      config = ConnectionPool.ecto_repo_config(cpu_cores: 4)
      assert Keyword.get(config, :pool_size) == 16
    end

    test "default SSL is false" do
      config = ConnectionPool.ecto_repo_config()
      assert Keyword.get(config, :ssl) == false
    end

    test "can enable SSL" do
      config = ConnectionPool.ecto_repo_config(ssl: true)
      assert Keyword.get(config, :ssl) == true
    end

    test "uses named prepared statements" do
      config = ConnectionPool.ecto_repo_config()
      assert Keyword.get(config, :prepare) == :named
    end

    test "socket options enable keepalive" do
      config = ConnectionPool.ecto_repo_config()
      socket_opts = Keyword.get(config, :socket_options)

      assert Keyword.get(socket_opts, :keepalive) == true
      assert Keyword.get(socket_opts, :nodelay) == true
    end
  end
end
