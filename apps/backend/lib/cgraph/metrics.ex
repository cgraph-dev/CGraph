defmodule Cgraph.Metrics do
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
  
  @type metric_type :: :counter | :gauge | :histogram | :summary
  @type labels :: map()
  @type metric_name :: atom()
  
  @histogram_buckets [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
  
  # ---------------------------------------------------------------------------
  # Public API
  # ---------------------------------------------------------------------------
  
  @doc """
  Start the metrics collector.
  """
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
  def define(name, type, opts \\ []) do
    GenServer.call(__MODULE__, {:define, name, type, opts})
  end
  
  @doc """
  Increment a counter metric.
  """
  def increment(name, labels \\ %{}, amount \\ 1) do
    GenServer.cast(__MODULE__, {:increment, name, labels, amount})
  end
  
  @doc """
  Set a gauge metric value.
  """
  def set(name, value, labels \\ %{}) do
    GenServer.cast(__MODULE__, {:set, name, value, labels})
  end
  
  @doc """
  Add to a gauge (can be negative).
  """
  def add(name, value, labels \\ %{}) do
    GenServer.cast(__MODULE__, {:add, name, value, labels})
  end
  
  @doc """
  Observe a value in a histogram.
  """
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
  def get(name, labels \\ %{}) do
    GenServer.call(__MODULE__, {:get, name, labels})
  end
  
  @doc """
  Export metrics in specified format.
  
  ## Formats
  
  - `:prometheus` - Prometheus text exposition format
  - `:json` - JSON format
  """
  def export(format \\ :prometheus) do
    GenServer.call(__MODULE__, {:export, format})
  end
  
  @doc """
  Get all defined metrics.
  """
  def all do
    GenServer.call(__MODULE__, :all)
  end
  
  @doc """
  Reset all metrics.
  """
  def reset do
    GenServer.call(__MODULE__, :reset)
  end
  
  @doc """
  Attach to telemetry events.
  """
  def attach_telemetry(events) do
    Enum.each(events, fn event ->
      :telemetry.attach(
        "metrics-#{Enum.join(event, "-")}",
        event,
        &handle_telemetry_event/4,
        %{}
      )
    end)
  end
  
  # ---------------------------------------------------------------------------
  # GenServer Implementation
  # ---------------------------------------------------------------------------
  
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
  
  @impl true
  def handle_continue(:define_defaults, state) do
    defaults = [
      # HTTP metrics
      {:http_requests_total, :counter, [help: "Total HTTP requests", labels: [:method, :path, :status]]},
      {:http_request_duration_ms, :histogram, [help: "HTTP request duration in ms", labels: [:method, :path]]},
      {:http_request_size_bytes, :histogram, [help: "HTTP request size", labels: [:method]]},
      {:http_response_size_bytes, :histogram, [help: "HTTP response size", labels: [:method, :status]]},
      
      # WebSocket metrics
      {:ws_connections_active, :gauge, [help: "Active WebSocket connections"]},
      {:ws_messages_total, :counter, [help: "Total WebSocket messages", labels: [:direction, :type]]},
      
      # Database metrics
      {:db_query_total, :counter, [help: "Total database queries", labels: [:source]]},
      {:db_query_duration_ms, :histogram, [help: "Database query duration", labels: [:source]]},
      {:db_pool_size, :gauge, [help: "Database connection pool size"]},
      {:db_pool_available, :gauge, [help: "Available database connections"]},
      
      # Cache metrics
      {:cache_hits_total, :counter, [help: "Cache hits", labels: [:level]]},
      {:cache_misses_total, :counter, [help: "Cache misses", labels: [:level]]},
      {:cache_size, :gauge, [help: "Cache size", labels: [:level]]},
      
      # Job metrics
      {:job_executed_total, :counter, [help: "Jobs executed", labels: [:worker, :state]]},
      {:job_duration_ms, :histogram, [help: "Job execution duration", labels: [:worker]]},
      {:job_queue_size, :gauge, [help: "Job queue size", labels: [:queue]]},
      
      # Business metrics
      {:users_total, :gauge, [help: "Total registered users"]},
      {:users_active, :gauge, [help: "Users active in last 24h"]},
      {:messages_total, :counter, [help: "Total messages sent", labels: [:type]]},
      {:groups_total, :gauge, [help: "Total groups"]},
      
      # System metrics
      {:erlang_memory_bytes, :gauge, [help: "Erlang memory usage", labels: [:type]]},
      {:erlang_processes, :gauge, [help: "Number of Erlang processes"]},
      {:erlang_schedulers, :gauge, [help: "Number of schedulers"]}
    ]
    
    state = Enum.reduce(defaults, state, fn {name, type, opts}, acc ->
      do_define(acc, name, type, opts)
    end)
    
    # Start periodic system metrics collection
    schedule_system_metrics()
    
    {:noreply, state}
  end
  
  @impl true
  def handle_call({:define, name, type, opts}, _from, state) do
    state = do_define(state, name, type, opts)
    {:reply, :ok, state}
  end
  
  @impl true
  def handle_call({:get, name, labels}, _from, state) do
    result = case Map.get(state.definitions, name) do
      nil -> {:error, :not_defined}
      %{type: :counter} -> {:ok, get_counter(state, name, labels)}
      %{type: :gauge} -> {:ok, get_gauge(state, name, labels)}
      %{type: :histogram} -> {:ok, get_histogram(state, name, labels)}
      _ -> {:error, :unknown_type}
    end
    {:reply, result, state}
  end
  
  @impl true
  def handle_call({:export, format}, _from, state) do
    output = case format do
      :prometheus -> export_prometheus(state)
      :json -> export_json(state)
      _ -> {:error, :unknown_format}
    end
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
  
  @impl true
  def handle_cast({:increment, name, labels, amount}, state) do
    key = metric_key(name, labels)
    counters = Map.update(state.counters, key, amount, &(&1 + amount))
    {:noreply, %{state | counters: counters}}
  end
  
  @impl true
  def handle_cast({:set, name, value, labels}, state) do
    key = metric_key(name, labels)
    gauges = Map.put(state.gauges, key, value)
    {:noreply, %{state | gauges: gauges}}
  end
  
  @impl true
  def handle_cast({:add, name, value, labels}, state) do
    key = metric_key(name, labels)
    gauges = Map.update(state.gauges, key, value, &(&1 + value))
    {:noreply, %{state | gauges: gauges}}
  end
  
  @impl true
  def handle_cast({:observe, name, value, labels}, state) do
    key = metric_key(name, labels)
    
    histogram = Map.get(state.histograms, key, new_histogram())
    histogram = update_histogram(histogram, value)
    
    histograms = Map.put(state.histograms, key, histogram)
    {:noreply, %{state | histograms: histograms}}
  end
  
  @impl true
  def handle_info(:collect_system_metrics, state) do
    collect_system_metrics()
    schedule_system_metrics()
    {:noreply, state}
  end
  
  # ---------------------------------------------------------------------------
  # Internal Functions
  # ---------------------------------------------------------------------------
  
  defp do_define(state, name, type, opts) do
    definition = %{
      name: name,
      type: type,
      help: Keyword.get(opts, :help, ""),
      labels: Keyword.get(opts, :labels, []),
      buckets: Keyword.get(opts, :buckets, @histogram_buckets)
    }
    
    definitions = Map.put(state.definitions, name, definition)
    %{state | definitions: definitions}
  end
  
  defp metric_key(name, labels) when labels == %{}, do: {name, []}
  defp metric_key(name, labels) do
    sorted_labels = labels |> Enum.sort() |> Enum.to_list()
    {name, sorted_labels}
  end
  
  defp get_counter(state, name, labels) do
    key = metric_key(name, labels)
    Map.get(state.counters, key, 0)
  end
  
  defp get_gauge(state, name, labels) do
    key = metric_key(name, labels)
    Map.get(state.gauges, key, 0)
  end
  
  defp get_histogram(state, name, labels) do
    key = metric_key(name, labels)
    Map.get(state.histograms, key, new_histogram())
  end
  
  defp new_histogram do
    %{
      buckets: Enum.map(@histogram_buckets, fn b -> {b, 0} end) ++ [{:inf, 0}],
      sum: 0,
      count: 0
    }
  end
  
  defp update_histogram(histogram, value) do
    buckets = Enum.map(histogram.buckets, fn {bound, count} ->
      if value <= bound or bound == :inf do
        {bound, count + 1}
      else
        {bound, count}
      end
    end)
    
    %{histogram | 
      buckets: buckets,
      sum: histogram.sum + value,
      count: histogram.count + 1
    }
  end
  
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
  
  # ---------------------------------------------------------------------------
  # Prometheus Export
  # ---------------------------------------------------------------------------
  
  defp export_prometheus(state) do
    lines = []
    
    # Export counters
    lines = lines ++ export_counters_prometheus(state)
    
    # Export gauges
    lines = lines ++ export_gauges_prometheus(state)
    
    # Export histograms
    lines = lines ++ export_histograms_prometheus(state)
    
    Enum.join(lines, "\n")
  end
  
  defp export_counters_prometheus(state) do
    state.counters
    |> Enum.group_by(fn {{name, _labels}, _value} -> name end)
    |> Enum.flat_map(fn {name, entries} ->
      definition = Map.get(state.definitions, name, %{help: ""})
      
      [
        "# HELP #{name} #{definition.help}",
        "# TYPE #{name} counter"
      ] ++ Enum.map(entries, fn {{_name, labels}, value} ->
        label_str = format_labels(labels)
        "#{name}#{label_str} #{value}"
      end)
    end)
  end
  
  defp export_gauges_prometheus(state) do
    state.gauges
    |> Enum.group_by(fn {{name, _labels}, _value} -> name end)
    |> Enum.flat_map(fn {name, entries} ->
      definition = Map.get(state.definitions, name, %{help: ""})
      
      [
        "# HELP #{name} #{definition.help}",
        "# TYPE #{name} gauge"
      ] ++ Enum.map(entries, fn {{_name, labels}, value} ->
        label_str = format_labels(labels)
        "#{name}#{label_str} #{value}"
      end)
    end)
  end
  
  defp export_histograms_prometheus(state) do
    state.histograms
    |> Enum.group_by(fn {{name, _labels}, _histogram} -> name end)
    |> Enum.flat_map(fn {name, entries} ->
      definition = Map.get(state.definitions, name, %{help: ""})
      
      header = [
        "# HELP #{name} #{definition.help}",
        "# TYPE #{name} histogram"
      ]
      
      bucket_lines = Enum.flat_map(entries, fn {{_name, labels}, histogram} ->
        base_labels = format_labels_map(labels)
        
        bucket_entries = Enum.map(histogram.buckets, fn {bound, count} ->
          le = if bound == :inf, do: "+Inf", else: to_string(bound)
          bucket_labels = Map.put(base_labels, "le", le)
          "#{name}_bucket#{format_labels_from_map(bucket_labels)} #{count}"
        end)
        
        label_str = format_labels(labels)
        
        bucket_entries ++ [
          "#{name}_sum#{label_str} #{histogram.sum}",
          "#{name}_count#{label_str} #{histogram.count}"
        ]
      end)
      
      header ++ bucket_lines
    end)
  end
  
  defp format_labels([]), do: ""
  defp format_labels(labels) do
    inner = labels
    |> Enum.map(fn {k, v} -> "#{k}=\"#{escape_label_value(v)}\"" end)
    |> Enum.join(",")
    
    "{#{inner}}"
  end
  
  defp format_labels_map(labels) do
    labels |> Enum.into(%{}, fn {k, v} -> {to_string(k), to_string(v)} end)
  end
  
  defp format_labels_from_map(map) when map == %{}, do: ""
  defp format_labels_from_map(map) do
    inner = map
    |> Enum.map(fn {k, v} -> "#{k}=\"#{escape_label_value(v)}\"" end)
    |> Enum.join(",")
    
    "{#{inner}}"
  end
  
  defp escape_label_value(value) do
    value
    |> to_string()
    |> String.replace("\\", "\\\\")
    |> String.replace("\"", "\\\"")
    |> String.replace("\n", "\\n")
  end
  
  # ---------------------------------------------------------------------------
  # JSON Export
  # ---------------------------------------------------------------------------
  
  defp export_json(state) do
    data = %{
      counters: Enum.map(state.counters, fn {{name, labels}, value} ->
        %{name: name, labels: Map.new(labels), value: value}
      end),
      gauges: Enum.map(state.gauges, fn {{name, labels}, value} ->
        %{name: name, labels: Map.new(labels), value: value}
      end),
      histograms: Enum.map(state.histograms, fn {{name, labels}, histogram} ->
        %{
          name: name,
          labels: Map.new(labels),
          buckets: Enum.map(histogram.buckets, fn {b, c} -> %{le: b, count: c} end),
          sum: histogram.sum,
          count: histogram.count
        }
      end),
      collected_at: DateTime.utc_now() |> DateTime.to_iso8601()
    }
    
    Jason.encode!(data)
  end
  
  # ---------------------------------------------------------------------------
  # Telemetry Handler
  # ---------------------------------------------------------------------------
  
  defp handle_telemetry_event([:phoenix, :endpoint, :stop], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)
    status = metadata[:conn].status || 0
    method = metadata[:conn].method
    path = normalize_path(metadata[:conn].request_path)
    
    increment(:http_requests_total, %{method: method, path: path, status: status})
    observe(:http_request_duration_ms, duration_ms, %{method: method, path: path})
  end
  
  defp handle_telemetry_event([:ecto, :repo, :query], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.total_time || 0, :native, :millisecond)
    source = metadata[:source] || "unknown"
    
    increment(:db_query_total, %{source: source})
    observe(:db_query_duration_ms, duration_ms, %{source: source})
  end
  
  defp handle_telemetry_event([:oban, :job, :stop], measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)
    worker = metadata[:job].worker
    state = metadata[:state] || :success
    
    increment(:job_executed_total, %{worker: worker, state: state})
    observe(:job_duration_ms, duration_ms, %{worker: worker})
  end
  
  defp handle_telemetry_event(_event, _measurements, _metadata, _config) do
    :ok
  end
  
  defp normalize_path(path) do
    path
    |> String.replace(~r/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, ":id")
    |> String.replace(~r/\/\d+/, "/:id")
  end
end
