defmodule CGraph.Chaos.FaultInjector do
  @moduledoc """
  Injects faults into system components for chaos testing.

  All injections are scoped to the calling process and automatically
  cleaned up when the process exits. This makes them safe for use
  in async ExUnit tests.
  """

  require Logger

  @doc """
  Inject artificial latency into a module's function calls.
  Uses process dictionary to signal delay without modifying actual code.

  ## Examples

      inject_latency(:redis, 5_000)   # 5 second delay on Redis calls
      inject_latency(:database, 2_000) # 2 second delay on DB queries
  """
  def inject_latency(component, delay_ms) when is_atom(component) and is_integer(delay_ms) do
    Process.put({:chaos_latency, component}, delay_ms)
    Logger.warning("chaos_injecting_ms_latency_into", delay_ms: delay_ms, component: component)
    :ok
  end

  @doc """
  Check if latency injection is active for a component.
  Returns `{:delay, ms}` or `:none`.
  """
  def check_latency(component) do
    case Process.get({:chaos_latency, component}) do
      nil -> :none
      ms -> {:delay, ms}
    end
  end

  @doc """
  Apply any injected latency for a component. No-op if none injected.
  """
  def maybe_apply_latency(component) do
    case check_latency(component) do
      {:delay, ms} ->
        Logger.debug("chaos_applying_ms_delay_for", ms: ms, component: component)
        Process.sleep(ms)
      :none ->
        :ok
    end
  end

  @doc """
  Inject forced errors for a component.
  The next N calls to the component will return `{:error, reason}`.

  ## Examples

      inject_error(:redis, :connection_refused)
      inject_error(:apns, :timeout, count: 5)
  """
  def inject_error(component, reason, opts \\ []) do
    count = Keyword.get(opts, :count, :infinity)
    Process.put({:chaos_error, component}, {reason, count})
    Logger.warning("chaos_injecting_error_into_count", reason: inspect(reason), component: component, count: inspect(count))
    :ok
  end

  @doc """
  Check if error injection is active. Returns `{:error, reason}` or `:none`.
  Decrements counter if count-limited.
  """
  def check_error(component) do
    case Process.get({:chaos_error, component}) do
      nil -> :none
      {reason, :infinity} -> {:error, reason}
      {reason, count} when count > 1 ->
        Process.put({:chaos_error, component}, {reason, count - 1})
        {:error, reason}
      {reason, 1} ->
        Process.delete({:chaos_error, component})
        {:error, reason}
      {_reason, 0} ->
        Process.delete({:chaos_error, component})
        :none
    end
  end

  @doc """
  Simulate a network partition for a component.
  All calls will timeout until the partition is healed.
  """
  def inject_partition(component) do
    Process.put({:chaos_partition, component}, true)
    Logger.warning("chaos_simulating_network_partition_for", component: component)
    :ok
  end

  @doc """
  Heal a simulated network partition.
  """
  def heal_partition(component) do
    Process.delete({:chaos_partition, component})
    Logger.info("chaos_healed_network_partition_for", component: component)
    :ok
  end

  @doc """
  Check if a partition is active.
  """
  def partitioned?(component) do
    Process.get({:chaos_partition, component}) == true
  end

  @doc """
  Simulate resource exhaustion (e.g., connection pool depleted).
  """
  def inject_resource_exhaustion(component) do
    Process.put({:chaos_exhaustion, component}, true)
    Logger.warning("chaos_simulating_resource_exhaustion_for", component: component)
    :ok
  end

  @doc """
  Check if resource exhaustion is simulated.
  """
  def exhausted?(component) do
    Process.get({:chaos_exhaustion, component}) == true
  end

  @doc """
  Clear all chaos injections for a component.
  """
  def clear(component) do
    Process.delete({:chaos_latency, component})
    Process.delete({:chaos_error, component})
    Process.delete({:chaos_partition, component})
    Process.delete({:chaos_exhaustion, component})
    :ok
  end

  @doc """
  Clear ALL chaos injections.
  """
  def clear_all do
    Process.get_keys()
    |> Enum.filter(fn
      {:chaos_latency, _} -> true
      {:chaos_error, _} -> true
      {:chaos_partition, _} -> true
      {:chaos_exhaustion, _} -> true
      _ -> false
    end)
    |> Enum.each(&Process.delete/1)
    :ok
  end
end
