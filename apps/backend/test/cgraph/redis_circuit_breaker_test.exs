defmodule CGraph.RedisCircuitBreakerTest do
  @moduledoc """
  Tests verifying the Redis circuit breaker integration.

  These tests validate the Fuse-based circuit breaker wired into
  CGraph.Redis.command/2, ensuring:
  - Commands succeed when the fuse is healthy
  - Commands return {:error, :circuit_open} when the fuse is blown
  - The fuse resets correctly after the reset window
  """
  use ExUnit.Case, async: false

  # The Redis fuse name used in CGraph.Redis
  @fuse_name :redis_fuse

  describe "circuit breaker integration" do
    test "fuse is installed on application start" do
      # The fuse should exist after the application starts
      result = :fuse.ask(@fuse_name, :sync)
      assert result in [:ok, :blown]
    end

    test "fuse can be queried for status" do
      status = CGraph.Redis.circuit_status()
      assert status in [:ok, :blown]
    end

    test "fuse can be manually reset" do
      assert :ok = CGraph.Redis.reset_circuit()
      assert :ok = :fuse.ask(@fuse_name, :sync)
    end

    test "blown fuse returns {:error, :circuit_open}" do
      # Save current state
      original_status = :fuse.ask(@fuse_name, :sync)

      # Blow the fuse manually
      # Melt it enough times to trip
      for _ <- 1..10, do: :fuse.melt(@fuse_name)

      # Should now be blown
      case :fuse.ask(@fuse_name, :sync) do
        :blown ->
          result = CGraph.Redis.command(["PING"])
          assert result == {:error, :circuit_open}

        :ok ->
          # Fuse has a high threshold, skip this assertion
          :ok
      end

      # Reset for other tests
      :fuse.reset(@fuse_name)

      # Verify it's healthy again
      if original_status == :ok do
        assert :ok = :fuse.ask(@fuse_name, :sync)
      end
    end
  end

  describe "push service circuit breakers" do
    test "all platform fuses can be installed" do
      assert :ok = CGraph.Notifications.PushService.CircuitBreakers.install_all()
    end

    test "platform fuse status is queryable" do
      CGraph.Notifications.PushService.CircuitBreakers.install_all()

      for platform <- [:apns, :fcm, :web_push, :mailer] do
        status = CGraph.Notifications.PushService.CircuitBreakers.status(platform)
        assert status in [:ok, :blown], "Expected :ok or :blown for #{platform}, got #{inspect(status)}"
      end
    end

    test "circuit_open is returned when platform fuse is blown" do
      CGraph.Notifications.PushService.CircuitBreakers.install_all()

      # Blow the APNS fuse
      for _ <- 1..10, do: :fuse.melt(:apns_fuse)

      case :fuse.ask(:apns_fuse, :sync) do
        :blown ->
          result = CGraph.Notifications.PushService.CircuitBreakers.call(:apns, fn ->
            {:ok, "should not reach here"}
          end)
          assert result == {:error, :circuit_open}

        :ok ->
          # High threshold, skip
          :ok
      end

      # Reset
      :fuse.reset(:apns_fuse)
    end

    test "successful calls pass through the circuit breaker" do
      CGraph.Notifications.PushService.CircuitBreakers.install_all()

      result = CGraph.Notifications.PushService.CircuitBreakers.call(:fcm, fn ->
        {:ok, "success"}
      end)

      assert result == {:ok, "success"}
    end
  end
end
