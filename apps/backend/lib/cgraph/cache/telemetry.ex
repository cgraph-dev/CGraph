defmodule CGraph.Cache.Telemetry do
  @moduledoc """
  Telemetry event emission for the cache subsystem.

  Emits events under the `[:cgraph, :cache, *]` namespace so that
  metrics dashboards and alerting can track hit rates, latencies,
  and invalidation counts.

  ## Events

  | Event                        | Measurements       | Metadata          |
  |------------------------------|---------------------|-------------------|
  | `[:cgraph, :cache, :get]`    | `%{duration: µs}`  | `%{key, status}`  |
  | `[:cgraph, :cache, :set]`    | `%{duration: µs}`  | `%{key}`          |
  | `[:cgraph, :cache, :delete]` | `%{count: 1}`      | `%{key}`          |
  | `[:cgraph, :cache, :hit]`    | `%{count: 1}`      | `%{tier}`         |
  | `[:cgraph, :cache, :miss]`   | `%{count: 1}`      | `%{}`             |
  """

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc false
  @spec emit_get(term(), term(), integer()) :: :ok
  def emit_get(key, result, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time
    status = if match?({:ok, _}, result), do: :hit, else: :miss

    :telemetry.execute(
      [:cgraph, :cache, :get],
      %{duration: duration},
      %{key: key, status: status}
    )
  end

  @doc false
  @spec emit_set(term(), integer()) :: :ok
  def emit_set(key, start_time) do
    duration = System.monotonic_time(:microsecond) - start_time

    :telemetry.execute(
      [:cgraph, :cache, :set],
      %{duration: duration},
      %{key: key}
    )
  end

  @doc false
  @spec emit_delete(term()) :: :ok
  def emit_delete(key) do
    :telemetry.execute(
      [:cgraph, :cache, :delete],
      %{count: 1},
      %{key: key}
    )
  end

  @doc false
  @spec emit_hit(atom()) :: :ok
  def emit_hit(tier) do
    :telemetry.execute(
      [:cgraph, :cache, :hit],
      %{count: 1},
      %{tier: tier}
    )
  end

  @doc false
  @spec emit_miss() :: :ok
  def emit_miss do
    :telemetry.execute(
      [:cgraph, :cache, :miss],
      %{count: 1},
      %{}
    )
  end
end
