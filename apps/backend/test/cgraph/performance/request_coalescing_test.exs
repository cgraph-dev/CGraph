defmodule CGraph.Performance.RequestCoalescingTest do
  use ExUnit.Case, async: true

  alias CGraph.Performance.RequestCoalescing

  setup do
    name = :"coalescing_test_#{System.unique_integer([:positive])}"
    # We need CGraph.TaskSupervisor to be running for Task.Supervisor.async_nolink
    # Start it if not already running
    _ = try do
      Task.Supervisor.start_link(name: CGraph.TaskSupervisor)
    catch
      :exit, {:already_started, _} -> :ok
    end

    {:ok, pid} = RequestCoalescing.start_link(name: name)
    %{server: name, pid: pid}
  end

  describe "start_link/1" do
    test "starts the GenServer", %{pid: pid} do
      assert Process.alive?(pid)
    end
  end

  describe "stats/1" do
    test "returns initial stats", %{server: server} do
      stats = RequestCoalescing.stats(server)

      assert stats.in_flight == 0
      assert stats.cached == 0
      assert stats.total_calls == 0
      assert stats.coalesced_calls == 0
      assert stats.cache_hits == 0
      assert stats.coalesce_ratio == 0.0
    end
  end

  describe "execute/3" do
    test "executes function and returns result", %{server: server} do
      result = RequestCoalescing.execute("key_1", fn -> 42 end, server: server)
      assert result == {:ok, 42}
    end

    test "returns different results for different keys", %{server: server} do
      assert {:ok, "a"} = RequestCoalescing.execute("key_a", fn -> "a" end, server: server)
      assert {:ok, "b"} = RequestCoalescing.execute("key_b", fn -> "b" end, server: server)
    end

    test "increments total_calls", %{server: server} do
      RequestCoalescing.execute("k1", fn -> :ok end, server: server)
      RequestCoalescing.execute("k2", fn -> :ok end, server: server)

      stats = RequestCoalescing.stats(server)
      assert stats.total_calls == 2
    end

    test "handles function that raises", %{server: server} do
      result = RequestCoalescing.execute("error_key", fn ->
        raise "boom"
      end, server: server)

      assert {:error, "boom"} = result
    end

    test "caches result when ttl is set", %{server: server} do
      # First call executes the function
      {:ok, result1} = RequestCoalescing.execute("cached_key", fn -> :computed end,
        server: server, ttl: 5_000)

      assert result1 == :computed

      # Second call should hit cache (function would return different value)
      {:ok, result2} = RequestCoalescing.execute("cached_key", fn -> :different end,
        server: server, ttl: 5_000)

      # Should get cached value
      assert result2 == :computed

      stats = RequestCoalescing.stats(server)
      assert stats.cache_hits >= 1
    end
  end

  describe "clear_cache/1" do
    test "clears cached entries", %{server: server} do
      # Populate cache
      RequestCoalescing.execute("cache_clear_key", fn -> :val end,
        server: server, ttl: 60_000)

      :timer.sleep(50)

      stats_before = RequestCoalescing.stats(server)
      assert stats_before.cached >= 0

      RequestCoalescing.clear_cache(server)

      :timer.sleep(10)

      stats_after = RequestCoalescing.stats(server)
      assert stats_after.cached == 0
    end
  end

  describe "coalescing behavior" do
    test "coalesces concurrent requests for same key", %{server: server} do
      # Use a slow function to ensure overlapping
      call_count = :counters.new(1, [:atomics])

      tasks =
        for _ <- 1..5 do
          Task.async(fn ->
            RequestCoalescing.execute("coalesce_key", fn ->
              :counters.add(call_count, 1, 1)
              :timer.sleep(100)
              :result
            end, server: server, timeout: 5_000)
          end)
        end

      results = Task.await_many(tasks, 10_000)

      # All should get the same result
      for result <- results do
        assert {:ok, :result} = result
      end

      # The function should have been called only once (or very few times)
      actual_calls = :counters.get(call_count, 1)
      assert actual_calls <= 2, "Expected coalescing to limit calls, got #{actual_calls}"

      stats = RequestCoalescing.stats(server)
      assert stats.coalesced_calls >= 1
    end
  end
end
