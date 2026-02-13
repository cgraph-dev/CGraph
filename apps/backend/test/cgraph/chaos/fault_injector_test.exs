defmodule CGraph.Chaos.FaultInjectorTest do
  @moduledoc """
  Tests for the chaos fault injection framework.
  Validates that faults can be injected and cleared properly.
  """
  use ExUnit.Case, async: true

  alias CGraph.Chaos.FaultInjector

  setup do
    on_exit(fn -> FaultInjector.clear_all() end)
    :ok
  end

  describe "inject_latency/2" do
    test "stores latency for component" do
      FaultInjector.inject_latency(:redis, 1_000)
      assert {:delay, 1_000} = FaultInjector.check_latency(:redis)
    end

    test "returns :none when no latency injected" do
      assert :none = FaultInjector.check_latency(:redis)
    end
  end

  describe "inject_error/2" do
    test "injects permanent error" do
      FaultInjector.inject_error(:redis, :connection_refused)
      assert {:error, :connection_refused} = FaultInjector.check_error(:redis)
      # Should still be there (infinity)
      assert {:error, :connection_refused} = FaultInjector.check_error(:redis)
    end

    test "injects count-limited error" do
      FaultInjector.inject_error(:redis, :timeout, count: 2)

      assert {:error, :timeout} = FaultInjector.check_error(:redis)
      assert {:error, :timeout} = FaultInjector.check_error(:redis)
      assert :none = FaultInjector.check_error(:redis)
    end

    test "returns :none when no error injected" do
      assert :none = FaultInjector.check_error(:database)
    end
  end

  describe "inject_partition/1" do
    test "simulates network partition" do
      refute FaultInjector.partitioned?(:redis)

      FaultInjector.inject_partition(:redis)
      assert FaultInjector.partitioned?(:redis)

      FaultInjector.heal_partition(:redis)
      refute FaultInjector.partitioned?(:redis)
    end
  end

  describe "inject_resource_exhaustion/1" do
    test "simulates resource exhaustion" do
      refute FaultInjector.exhausted?(:database)

      FaultInjector.inject_resource_exhaustion(:database)
      assert FaultInjector.exhausted?(:database)
    end
  end

  describe "clear/1" do
    test "clears all faults for a single component" do
      FaultInjector.inject_latency(:redis, 1_000)
      FaultInjector.inject_error(:redis, :timeout)
      FaultInjector.inject_partition(:redis)
      FaultInjector.inject_resource_exhaustion(:redis)

      FaultInjector.clear(:redis)

      assert :none = FaultInjector.check_latency(:redis)
      assert :none = FaultInjector.check_error(:redis)
      refute FaultInjector.partitioned?(:redis)
      refute FaultInjector.exhausted?(:redis)
    end
  end

  describe "clear_all/0" do
    test "clears all faults for all components" do
      FaultInjector.inject_latency(:redis, 1_000)
      FaultInjector.inject_error(:database, :timeout)
      FaultInjector.inject_partition(:apns)

      FaultInjector.clear_all()

      assert :none = FaultInjector.check_latency(:redis)
      assert :none = FaultInjector.check_error(:database)
      refute FaultInjector.partitioned?(:apns)
    end
  end

  describe "maybe_apply_latency/1" do
    test "sleeps when latency is injected" do
      FaultInjector.inject_latency(:redis, 50)

      start = System.monotonic_time(:millisecond)
      FaultInjector.maybe_apply_latency(:redis)
      elapsed = System.monotonic_time(:millisecond) - start

      assert elapsed >= 40  # Allow some tolerance
    end

    test "returns immediately when no latency" do
      start = System.monotonic_time(:millisecond)
      FaultInjector.maybe_apply_latency(:redis)
      elapsed = System.monotonic_time(:millisecond) - start

      assert elapsed < 10
    end
  end
end
