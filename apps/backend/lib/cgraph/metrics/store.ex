defmodule CGraph.Metrics.Store do
  @moduledoc """
  Internal metric storage operations.

  Handles metric definitions, key construction, value retrieval,
  histogram management, and default metric definitions.
  """

  @histogram_buckets [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000]

  @doc "Returns the default histogram bucket boundaries."
  @spec histogram_buckets() :: [number()]
  def histogram_buckets, do: @histogram_buckets

  # ---------------------------------------------------------------------------
  # Metric Definitions
  # ---------------------------------------------------------------------------

  @doc "Define a new metric in the state."
  @spec do_define(map(), atom(), atom(), keyword()) :: map()
  def do_define(state, name, type, opts) do
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

  @doc "Returns the list of default metric definitions."
  @spec default_definitions() :: [{atom(), atom(), keyword()}]
  def default_definitions do
    [
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
  end

  # ---------------------------------------------------------------------------
  # Key & Value Operations
  # ---------------------------------------------------------------------------

  @doc "Construct a metric key from name and labels."
  @spec metric_key(atom(), map()) :: {atom(), list()}
  def metric_key(name, labels) when labels == %{}, do: {name, []}
  def metric_key(name, labels) when is_map(labels) do
    sorted_labels = labels |> Enum.sort() |> Enum.to_list()
    {name, sorted_labels}
  end
  def metric_key(name, _labels), do: {name, []}

  @doc "Get current counter value."
  @spec get_counter(map(), atom(), map()) :: number()
  def get_counter(state, name, labels) do
    key = metric_key(name, labels)
    Map.get(state.counters, key, 0)
  end

  @doc "Get current gauge value."
  @spec get_gauge(map(), atom(), map()) :: number()
  def get_gauge(state, name, labels) do
    key = metric_key(name, labels)
    Map.get(state.gauges, key, 0)
  end

  @doc "Get current histogram data."
  @spec get_histogram(map(), atom(), map()) :: map()
  def get_histogram(state, name, labels) do
    key = metric_key(name, labels)
    Map.get(state.histograms, key, new_histogram())
  end

  # ---------------------------------------------------------------------------
  # Histogram Operations
  # ---------------------------------------------------------------------------

  @doc "Create a new empty histogram."
  @spec new_histogram() :: map()
  def new_histogram do
    %{
      buckets: Enum.map(@histogram_buckets, fn b -> {b, 0} end) ++ [{:inf, 0}],
      sum: 0,
      count: 0
    }
  end

  @doc "Update a histogram with a new observed value."
  @spec update_histogram(map(), number()) :: map()
  def update_histogram(histogram, value) do
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
end
