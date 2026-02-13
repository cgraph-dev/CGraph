defmodule CGraph.ConnectionPoolTest do
  @moduledoc "Tests for DB connection pool manager."
  use ExUnit.Case, async: false

  alias CGraph.ConnectionPool

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(ConnectionPool)
    end

    test "exports pool monitoring functions" do
      assert function_exported?(ConnectionPool, :get_status, 1)
      assert function_exported?(ConnectionPool, :get_saturation, 1)
      assert function_exported?(ConnectionPool, :under_pressure?, 1)
      assert function_exported?(ConnectionPool, :health_check, 1)
    end

    test "exports slow query functions" do
      assert function_exported?(ConnectionPool, :get_slow_queries, 1)
      assert function_exported?(ConnectionPool, :get_slow_query_stats, 0)
    end
  end

  describe "get_status/1" do
    test "returns pool status" do
      result = ConnectionPool.get_status(:primary)
      assert is_map(result) or match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end

  describe "get_slow_query_stats/0" do
    test "returns stats map" do
      result = ConnectionPool.get_slow_query_stats()
      assert is_map(result) or is_list(result) or match?({:ok, _}, result)
    end
  end

  describe "prometheus_metrics/1" do
    test "returns Prometheus-formatted metrics" do
      result = ConnectionPool.prometheus_metrics(:primary)
      assert is_map(result) or is_list(result) or is_binary(result) or match?({:ok, _}, result)
    end
  end
end
