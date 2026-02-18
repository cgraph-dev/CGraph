defmodule CGraph.Performance.SLOTest do
  use ExUnit.Case, async: true

  alias CGraph.Performance.SLO

  @definitions [
    %{name: :test_fast_endpoint, latency_p99_ms: 100, error_rate_pct: 2.0},
    %{name: :test_slow_endpoint, latency_p99_ms: 500, error_rate_pct: 5.0}
  ]

  setup do
    name = :"slo_test_#{System.unique_integer([:positive])}"
    {:ok, pid} = SLO.start_link(name: name, definitions: @definitions)
    %{server: name, pid: pid}
  end

  describe "start_link/1" do
    test "starts the GenServer", %{pid: pid} do
      assert Process.alive?(pid)
    end
  end

  describe "record/4" do
    test "records a successful request", %{server: server} do
      assert :ok = SLO.record(:test_fast_endpoint, 50, :ok, server)
    end

    test "records an error request", %{server: server} do
      assert :ok = SLO.record(:test_fast_endpoint, 200, {:error, :timeout}, server)
    end

    test "records for unknown SLO names (creates ad-hoc entry)", %{server: server} do
      :ok = SLO.record(:unknown_endpoint, 100, :ok, server)
      status = SLO.status(server)
      assert Map.has_key?(status, :unknown_endpoint)
    end
  end

  describe "status/1" do
    test "returns status for all defined SLOs", %{server: server} do
      status = SLO.status(server)

      assert is_map(status)
      assert Map.has_key?(status, :test_fast_endpoint)
      assert Map.has_key?(status, :test_slow_endpoint)
    end

    test "returns healthy status for SLOs with no data", %{server: server} do
      status = SLO.status(server)
      fast = status[:test_fast_endpoint]

      assert fast.healthy == true
      assert fast.requests_in_window == 0
      assert fast.error_rate == 0.0
    end

    test "reports healthy when within budget", %{server: server} do
      # Record fast responses
      for _ <- 1..20 do
        SLO.record(:test_fast_endpoint, 50, :ok, server)
      end

      # Give time for casts to process
      :timer.sleep(10)

      status = SLO.status(:test_fast_endpoint, server)
      assert status.healthy == true
      assert status.latency_ok == true
      assert status.error_ok == true
    end

    test "reports unhealthy when latency exceeds p99 target", %{server: server} do
      # Record many slow responses — p99 means 99th percentile
      for _ <- 1..100 do
        SLO.record(:test_fast_endpoint, 200, :ok, server)
      end

      :timer.sleep(10)

      status = SLO.status(:test_fast_endpoint, server)
      # p99 of all 200ms values = 200ms > target of 100ms
      assert status.latency_p99 > 100
      assert status.latency_ok == false
      assert status.healthy == false
    end

    test "reports unhealthy when error rate exceeds target", %{server: server} do
      # 10% error rate (way above 2% target)
      for _ <- 1..90 do
        SLO.record(:test_fast_endpoint, 10, :ok, server)
      end

      for _ <- 1..10 do
        SLO.record(:test_fast_endpoint, 10, {:error, :server_error}, server)
      end

      :timer.sleep(10)

      status = SLO.status(:test_fast_endpoint, server)
      assert status.error_rate == 10.0
      assert status.error_ok == false
      assert status.healthy == false
    end

    test "includes target values in status", %{server: server} do
      SLO.record(:test_fast_endpoint, 50, :ok, server)
      :timer.sleep(10)

      status = SLO.status(:test_fast_endpoint, server)
      assert status.latency_target == 100
      assert status.error_target == 2.0
    end

    test "tracks total requests and errors", %{server: server} do
      SLO.record(:test_fast_endpoint, 50, :ok, server)
      SLO.record(:test_fast_endpoint, 50, :ok, server)
      SLO.record(:test_fast_endpoint, 50, {:error, :bad}, server)

      :timer.sleep(10)

      status = SLO.status(:test_fast_endpoint, server)
      assert status.total_requests == 3
      assert status.total_errors == 1
    end
  end

  describe "status/2 (single SLO)" do
    test "returns nil for unknown SLO", %{server: server} do
      assert SLO.status(:nonexistent, server) == nil
    end

    test "returns status map for known SLO", %{server: server} do
      status = SLO.status(:test_fast_endpoint, server)
      assert is_map(status)
      assert Map.has_key?(status, :healthy)
    end
  end

  describe "healthy?/1" do
    test "returns true when all SLOs are healthy", %{server: server} do
      assert SLO.healthy?(server) == true
    end

    test "returns false when any SLO is unhealthy", %{server: server} do
      # Blow through the fast endpoint latency budget
      for _ <- 1..100 do
        SLO.record(:test_fast_endpoint, 999, :ok, server)
      end

      :timer.sleep(10)

      refute SLO.healthy?(server)
    end
  end

  describe "violations/1" do
    test "returns empty list when all healthy", %{server: server} do
      assert SLO.violations(server) == []
    end

    test "returns violation details", %{server: server} do
      for _ <- 1..100 do
        SLO.record(:test_fast_endpoint, 999, :ok, server)
      end

      :timer.sleep(10)

      violations = SLO.violations(server)
      assert length(violations) >= 1

      violation = hd(violations)
      assert violation.name == :test_fast_endpoint
      assert violation.healthy == false
    end
  end

  describe "concurrent recording" do
    test "handles many concurrent records without crash", %{server: server} do
      tasks =
        for i <- 1..100 do
          Task.async(fn ->
            SLO.record(:test_fast_endpoint, rem(i, 200), :ok, server)
          end)
        end

      Task.await_many(tasks, 5_000)

      :timer.sleep(20)

      status = SLO.status(:test_fast_endpoint, server)
      assert status.requests_in_window == 100
    end
  end
end
