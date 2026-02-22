defmodule CGraph.Metrics do
  @moduledoc """
  Prometheus-compatible metrics collection and export.

  ## Overview

  Provides comprehensive application metrics for:

  - **Request Metrics**: Latency, throughput, error rates
  - **Business Metrics**: Users, messages, groups
  - **System Metrics**: Memory, processes, schedulers
  - **Custom Metrics**: Application-specific counters/gauges

  ## Metric Types

  | Type | Description | Example |
  |------|-------------|---------|
  | `counter` | Monotonically increasing | `http_requests_total` |
  | `gauge` | Can go up and down | `active_connections` |
  | `histogram` | Distribution of values | `request_latency_ms` |
  | `summary` | Similar to histogram | `request_duration` |

  ## Labels

  All metrics support labels for dimensional analysis:

  ```
  http_requests_total{method="GET", path="/api/users", status="200"}
  ```

  ## Export Formats

  - Prometheus text format (default)
  - JSON format
  - StatsD format

  ## Usage

      # Increment counter
      Metrics.increment(:http_requests_total, %{method: "GET", status: "200"})

      # Set gauge
      Metrics.set(:active_connections, 150)

      # Observe histogram
      Metrics.observe(:request_latency_ms, 45.2, %{path: "/api/users"})

      # Export to Prometheus format
      Metrics.export(:prometheus)

  ## Telemetry Integration

  Automatically attaches to telemetry events:

  ```elixir
  Metrics.attach_telemetry([
    [:phoenix, :endpoint, :stop],
    [:ecto, :repo, :query],
    [:oban, :job, :stop]
  ])
  ```
  """

  use GenServer
  require Logger

  alias CGraph.Metrics.{Store, Export, Telemetry}

  @type metric_type :: :counter | :gauge | :histogram | :summary
  @type labels :: map()
  @type metric_name :: atom()

  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------

  @doc """
  Start the metrics collector.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Define a new metric.

  ## Example

      Metrics.define(:http_requests_total, :counter,
        help: "Total HTTP requests",
        labels: [:method, :path, :status]
      )
  """
  @spec define(metric_name(), metric_type(), keyword()) :: :ok
  def define(name, type, opts \\ []) do
    GenServer.call(__MODULE__, {:define, name, type, opts})
  end

  @doc """
  Increment a counter metric.
  """
  @spec increment(metric_name(), labels(), number()) :: :ok
  def increment(name, labels \\ %{}, amount \\ 1) do
    GenServer.cast(__MODULE__, {:increment, name, labels, amount})
  end

  @doc """
  Set a gauge metric value.
  """
  @spec set(metric_name(), number(), labels()) :: :ok
  def set(name, value, labels \\ %{}) do
    GenServer.cast(__MODULE__, {:set, name, value, labels})
  end

  @doc """
  Add to a gauge (can be negative).
  """
  @spec add(metric_name(), number(), labels()) :: :ok
  def add(name, value, labels \\ %{}) do
    GenServer.cast(__MODULE__, {:add, name, value, labels})
  end

  @doc """
  Observe a value in a histogram.
  """
  @spec observe(metric_name(), number(), labels()) :: :ok
  def observe(name, value, labels \\ %{}) do
    GenServer.cast(__MODULE__, {:observe, name, value, labels})
  end

  @doc """
  Measure execution time of a function.

  ## Example

      Metrics.measure(:db_query_duration_ms, %{query: "select"}, fn ->
        Repo.all(User)
      end)
  """
  @spec measure(metric_name(), labels(), (-> term())) :: term()
  def measure(name, labels \\ %{}, fun) when is_function(fun, 0) do
    start = System.monotonic_time(:millisecond)

    try do
      result = fun.()
      duration = System.monotonic_time(:millisecond) - start
      observe(name, duration, labels)
      result
    rescue
      e ->
        duration = System.monotonic_time(:millisecond) - start
        observe(name, duration, Map.put(labels, :error, true))
        reraise e, __STACKTRACE__
    end
  end

  @doc """
  Get current value of a metric.
  """
  @spec get(metric_name(), labels()) :: {:ok, term()} | {:error, :not_defined | :unknown_type}
  def get(name, labels \\ %{}) do
    GenServer.call(__MODULE__, {:get, name, labels})
  end

  @doc """
  Export metrics in specified format.

  ## Formats

  - `:prometheus` - Prometheus text exposition format
  - `:json` - JSON format
  """
  @spec export(atom()) :: String.t()
  def export(format \\ :prometheus) do
    GenServer.call(__MODULE__, {:export, format})
  end

  @doc """
  Get all defined metrics.
  """
  @spec all() :: map()
  def all do
    GenServer.call(__MODULE__, :all)
  end

  @doc """
  Reset all metrics.
  """
  @spec reset() :: :ok
  def reset do
    GenServer.call(__MODULE__, :reset)
  end

  @doc """
  Attach to telemetry events.
  """
  @spec attach_telemetry([[atom()]]) :: :ok
  def attach_telemetry(events) do
    Enum.each(events, fn event ->
      :telemetry.attach(
        "metrics-#{Enum.join(event, "-")}",
        event,
        &Telemetry.handle_event/4,
        %{}
      )
    end)
  end

  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------

  @spec init(keyword()) :: {:ok, map(), {:continue, :define_defaults}}
  @impl true
  def init(_opts) do
    state = %{
      definitions: %{},
      counters: %{},
      gauges: %{},
      histograms: %{}
    }

    # Define default metrics
    {:ok, state, {:continue, :define_defaults}}
  end

  @spec handle_continue(atom(), map()) :: {:noreply, map()}
  @impl true
  def handle_continue(:define_defaults, state) do
    state = Enum.reduce(Store.default_definitions(), state, fn {name, type, opts}, acc ->
      Store.do_define(acc, name, type, opts)
    end)

    # Start periodic system metrics collection
    schedule_system_metrics()

    {:noreply, state}
  end

  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  @impl true
  def handle_call({:define, name, type, opts}, _from, state) do
    state = Store.do_define(state, name, type, opts)
    {:reply, :ok, state}
  end

  @impl true
  def handle_call({:get, name, labels}, _from, state) do
    result = case Map.get(state.definitions, name) do
      nil -> {:error, :not_defined}
      %{type: :counter} -> {:ok, Store.get_counter(state, name, labels)}
      %{type: :gauge} -> {:ok, Store.get_gauge(state, name, labels)}
      %{type: :histogram} -> {:ok, Store.get_histogram(state, name, labels)}
      _ -> {:error, :unknown_type}
    end
    {:reply, result, state}
  end

  @impl true
  def handle_call({:export, format}, _from, state) do
    output = Export.export(state, format)
    {:reply, output, state}
  end

  @impl true
  def handle_call(:all, _from, state) do
    {:reply, state.definitions, state}
  end

  @impl true
  def handle_call(:reset, _from, state) do
    new_state = %{state | counters: %{}, gauges: %{}, histograms: %{}}
    {:reply, :ok, new_state}
  end

  @spec handle_cast(term(), map()) :: {:noreply, map()}
  @impl true
  def handle_cast({:increment, name, labels, amount}, state) do
    key = Store.metric_key(name, labels)
    counters = Map.update(state.counters, key, amount, &(&1 + amount))
    {:noreply, %{state | counters: counters}}
  end

  @impl true
  def handle_cast({:set, name, value, labels}, state) do
    key = Store.metric_key(name, labels)
    gauges = Map.put(state.gauges, key, value)
    {:noreply, %{state | gauges: gauges}}
  end

  @impl true
  def handle_cast({:add, name, value, labels}, state) do
    key = Store.metric_key(name, labels)
    gauges = Map.update(state.gauges, key, value, &(&1 + value))
    {:noreply, %{state | gauges: gauges}}
  end

  @impl true
  def handle_cast({:observe, name, value, labels}, state) do
    key = Store.metric_key(name, labels)

    histogram = Map.get(state.histograms, key, Store.new_histogram())
    histogram = Store.update_histogram(histogram, value)

    histograms = Map.put(state.histograms, key, histogram)
    {:noreply, %{state | histograms: histograms}}
  end

  @spec handle_info(atom(), map()) :: {:noreply, map()}
  @impl true
  def handle_info(:collect_system_metrics, state) do
    collect_system_metrics()
    schedule_system_metrics()
    {:noreply, state}
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp schedule_system_metrics do
    Process.send_after(self(), :collect_system_metrics, :timer.seconds(15))
  end

  defp collect_system_metrics do
    memory = :erlang.memory()

    set(:erlang_memory_bytes, memory[:total], %{type: "total"})
    set(:erlang_memory_bytes, memory[:processes], %{type: "processes"})
    set(:erlang_memory_bytes, memory[:ets], %{type: "ets"})
    set(:erlang_memory_bytes, memory[:binary], %{type: "binary"})
    set(:erlang_memory_bytes, memory[:atom], %{type: "atom"})

    set(:erlang_processes, :erlang.system_info(:process_count))
    set(:erlang_schedulers, :erlang.system_info(:schedulers_online))
  end
end
