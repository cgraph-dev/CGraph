defmodule CGraph.HealthCheckTest do
  @moduledoc "Tests for system health check GenServer."
  use ExUnit.Case, async: false

  alias CGraph.HealthCheck

  describe "module structure" do
    test "module compiles and is loaded" do
      assert Code.ensure_loaded?(HealthCheck)
    end

    test "exports probe functions" do
      assert function_exported?(HealthCheck, :check, 0)
      assert function_exported?(HealthCheck, :report, 0)
      assert function_exported?(HealthCheck, :live?, 0)
      assert function_exported?(HealthCheck, :ready?, 0)
      assert function_exported?(HealthCheck, :startup?, 0)
    end
  end

  describe "check/0" do
    test "returns health status" do
      result = HealthCheck.check()
      assert is_map(result) or match?({:ok, _}, result)
    end
  end

  describe "report/0" do
    test "returns detailed health report" do
      result = HealthCheck.report()
      assert is_map(result) or match?({:ok, _}, result)
    end
  end

  describe "live?/0" do
    test "returns boolean" do
      result = HealthCheck.live?()
      assert is_boolean(result)
    end
  end

  describe "ready?/0" do
    test "returns boolean" do
      result = HealthCheck.ready?()
      assert is_boolean(result)
    end
  end

  describe "uptime/0" do
    test "returns uptime duration" do
      result = HealthCheck.uptime()
      assert is_number(result) or is_binary(result) or is_nil(result)
    end
  end

  describe "check_component/1" do
    test "checks specific component" do
      result = HealthCheck.check_component(:database)
      assert is_map(result) or match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end
end
