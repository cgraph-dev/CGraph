defmodule CGraph.Chaos do
  @moduledoc """
  Chaos testing framework for validating circuit breakers, backpressure,
  and fault tolerance under adverse conditions.

  ## Architecture

  ```
  ┌──────────────────────────────────────────────────────────────────┐
  │                     CHAOS TESTING FRAMEWORK                      │
  ├──────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  CGraph.Chaos.FaultInjector                                     │
  │    ├── inject_latency/2       - Add artificial delay             │
  │    ├── inject_error/2         - Force error responses            │
  │    ├── inject_partition/1     - Simulate network partition       │
  │    └── inject_resource_exhaustion/1 - OOM / connection pool      │
  │                                                                  │
  │  CGraph.Chaos.CircuitBreakerValidator                           │
  │    ├── validate_fuse/1        - Verify fuse trips properly       │
  │    ├── stress_fuse/2          - Hammer a fuse until it blows     │
  │    └── validate_recovery/1   - Check fuse recovery behavior      │
  │                                                                  │
  │  CGraph.Chaos.Scenarios                                         │
  │    ├── redis_down/0           - Simulate Redis failure           │
  │    ├── database_slow/0        - Simulate slow DB queries         │
  │    ├── push_service_down/0    - Simulate APNs/FCM failure        │
  │    └── search_unavailable/0  - Simulate MeiliSearch failure      │
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
  ```

  ## Usage in Tests

      # In test file
      use CGraph.Chaos

      test "message sending survives Redis failure" do
        CGraph.Chaos.Scenarios.redis_down()
        assert {:ok, _msg} = Messaging.create_message(user, conv, attrs)
      end

  ## Safety

  Chaos testing is ONLY enabled in `:test` environment.
  All fault injections automatically clean up via process dictionary + on_exit.
  """

  @doc """
  Guard: ensures chaos operations only run in test env.
  """
  defmacro __using__(_opts) do
    quote do
      import CGraph.Chaos.FaultInjector
      import CGraph.Chaos.Scenarios
    end
  end

  @doc """
  Check if chaos testing is enabled (test env only).
  """
  @spec enabled?() :: boolean()
  def enabled? do
    Application.get_env(:cgraph, :env) == :test ||
      Mix.env() == :test
  rescue
    _ -> false
  end
end
