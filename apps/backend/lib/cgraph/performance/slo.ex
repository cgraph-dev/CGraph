defmodule CGraph.Performance.SLO do
  @moduledoc """
  Runtime SLO (Service Level Objective) enforcement and tracking.

  Defines latency and error-rate budgets per endpoint or operation,
  tracks them via telemetry, and exposes a health endpoint for
  alerting and dashboards.

  ## Configuration

  SLOs are defined as a list in application config or passed at start:

      config :cgraph, CGraph.Performance.SLO,
        definitions: [
          %{name: :api_message_send, latency_p99_ms: 200, error_rate_pct: 1.0},
          %{name: :api_auth_login, latency_p99_ms: 300, error_rate_pct: 0.5},
          %{name: :ws_message_delivery, latency_p99_ms: 100, error_rate_pct: 0.1}
        ]

  ## Integration with Phoenix Telemetry

      # In your application.ex or telemetry module:
      CGraph.Performance.SLO.attach_phoenix_telemetry()

  ## Checking SLO status

      CGraph.Performance.SLO.status()
      # => %{api_message_send: %{healthy: true, latency_p99: 142, error_rate: 0.3, ...}, ...}
  """

  use GenServer
  require Logger

  @default_window_seconds 300
  @default_bucket_seconds 10
  @cleanup_interval :timer.seconds(30)

  @type slo_name :: atom()
  @type slo_definition :: %{
    name: slo_name(),
    latency_p99_ms: number(),
    error_rate_pct: number()
  }

  # ── Client API ──────────────────────────────────────────────

  @doc "Starts the process and links it to the current process."
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, opts, name: name)
  end

  @doc """
  Record a request for an SLO-tracked operation.

  Called automatically if Phoenix telemetry is attached, or manually:

      SLO.record(:api_message_send, 142, :ok)
      SLO.record(:api_message_send, 5200, {:error, :timeout})
  """
  @spec record(slo_name(), non_neg_integer(), :ok | {:error, term()}) :: :ok
  def record(name, latency_ms, result, server \\ __MODULE__) do
    GenServer.cast(server, {:record, name, latency_ms, result})
  end

  @doc "Get current SLO status for all tracked operations."
  @spec status(GenServer.server()) :: map()
  def status(server \\ __MODULE__) do
    GenServer.call(server, :status)
  end

  @doc "Get SLO status for a single operation."
  @spec status(slo_name(), GenServer.server()) :: map() | nil
  def status(name, server) do
    GenServer.call(server, {:status, name})
  end

  @doc "Check if all SLOs are currently met."
  @spec healthy?(GenServer.server()) :: boolean()
  def healthy?(server \\ __MODULE__) do
    server
    |> status()
    |> Enum.all?(fn {_name, s} -> s.healthy end)
  end

  @doc "List all SLO violations in the current window."
  @spec violations(GenServer.server()) :: [map()]
  def violations(server \\ __MODULE__) do
    server
    |> status()
    |> Enum.reject(fn {_name, s} -> s.healthy end)
    |> Enum.map(fn {name, s} -> Map.put(s, :name, name) end)
  end

  @doc """
  Attach to Phoenix.Endpoint telemetry events to auto-record SLOs.

  Maps route paths to SLO names via a naming convention:
  `POST /api/v1/messages` → `:api_v1_messages_post`
  """
  @spec attach_phoenix_telemetry() :: :ok
  def attach_phoenix_telemetry do
    :telemetry.attach(
      "slo-phoenix-stop",
      [:phoenix, :endpoint, :stop],
      &__MODULE__.handle_phoenix_event/4,
      %{}
    )

    :ok
  end

  @doc false
  @spec handle_phoenix_event(list(), map(), map(), term()) :: :ok | nil
  def handle_phoenix_event(_event, measurements, metadata, _config) do
    duration_ms = System.convert_time_unit(measurements.duration, :native, :millisecond)

    slo_name =
      metadata
      |> Map.get(:conn)
      |> slo_name_from_conn()

    result =
      case metadata do
        %{conn: %{status: status}} when status >= 500 -> {:error, :server_error}
        %{conn: %{status: status}} when status >= 400 -> {:error, :client_error}
        _ -> :ok
      end

    if slo_name, do: record(slo_name, duration_ms, result)
  end

  # ── Server Implementation ──────────────────────────────────

  @impl true
  @spec init(keyword()) :: {:ok, map()}
  def init(opts) do
    definitions =
      Keyword.get_lazy(opts, :definitions, fn ->
        Application.get_env(:cgraph, __MODULE__, [])
        |> Keyword.get(:definitions, default_definitions())
      end)

    slos =
      Map.new(definitions, fn %{name: name} = def ->
        {name, %{
          definition: def,
          buckets: [],
          total_requests: 0,
          total_errors: 0
        }}
      end)

    schedule_cleanup()
    {:ok, %{slos: slos, window_seconds: @default_window_seconds, bucket_seconds: @default_bucket_seconds}}
  end

  @impl true
  @spec handle_cast(term(), map()) :: {:noreply, map()}
  def handle_cast({:record, name, latency_ms, result}, state) do
    now = bucket_key(state.bucket_seconds)
    is_error = match?({:error, _}, result)

    slos =
      Map.update(state.slos, name, new_slo_entry(name, now, latency_ms, is_error), fn entry ->
        buckets = update_buckets(entry.buckets, now, latency_ms, is_error)

        %{entry |
          buckets: buckets,
          total_requests: entry.total_requests + 1,
          total_errors: if(is_error, do: entry.total_errors + 1, else: entry.total_errors)
        }
      end)

    # Emit telemetry for SLO recording
    :telemetry.execute(
      [:cgraph, :slo, :record],
      %{latency_ms: latency_ms, is_error: is_error},
      %{name: name}
    )

    {:noreply, %{state | slos: slos}}
  end

  @impl true
  @spec handle_call(term(), GenServer.from(), map()) :: {:reply, term(), map()}
  def handle_call(:status, _from, state) do
    cutoff = bucket_key(state.bucket_seconds) - state.window_seconds
    result = Map.new(state.slos, fn {name, entry} -> {name, compute_status(entry, cutoff)} end)
    {:reply, result, state}
  end

  @impl true
  def handle_call({:status, name}, _from, state) do
    cutoff = bucket_key(state.bucket_seconds) - state.window_seconds

    result =
      case state.slos[name] do
        nil -> nil
        entry -> compute_status(entry, cutoff)
      end

    {:reply, result, state}
  end

  @impl true
  @spec handle_info(:cleanup, map()) :: {:noreply, map()}
  def handle_info(:cleanup, state) do
    cutoff = bucket_key(state.bucket_seconds) - state.window_seconds

    slos =
      Map.new(state.slos, fn {name, entry} ->
        {name, %{entry | buckets: Enum.filter(entry.buckets, fn b -> b.time > cutoff end)}}
      end)

    # Check for violations and emit alerts
    for {name, entry} <- slos do
      status = compute_status(entry, cutoff)

      unless status.healthy do
        :telemetry.execute(
          [:cgraph, :slo, :violation],
          %{latency_p99: status.latency_p99, error_rate: status.error_rate},
          %{name: name, definition: entry.definition}
        )

        Logger.warning("slo_violation_p99_ms_errorrate", name: name, status_latency_p99: status.latency_p99, status_error_rate: status.error_rate)
      end
    end

    schedule_cleanup()
    {:noreply, %{state | slos: slos}}
  end

  # ── Private ────────────────────────────────────────────────

  defp compute_status(entry, cutoff) do
    active_buckets = Enum.filter(entry.buckets, fn b -> b.time > cutoff end)
    all_latencies = Enum.flat_map(active_buckets, & &1.latencies)
    total = Enum.sum(Enum.map(active_buckets, & &1.count))
    errors = Enum.sum(Enum.map(active_buckets, & &1.errors))

    p99 = percentile(all_latencies, 99)
    error_rate = if total > 0, do: Float.round(errors / total * 100, 2), else: 0.0

    latency_ok = p99 <= entry.definition.latency_p99_ms
    error_ok = error_rate <= entry.definition.error_rate_pct

    %{
      healthy: latency_ok and error_ok,
      latency_p99: p99,
      latency_target: entry.definition.latency_p99_ms,
      latency_ok: latency_ok,
      error_rate: error_rate,
      error_target: entry.definition.error_rate_pct,
      error_ok: error_ok,
      requests_in_window: total,
      total_requests: entry.total_requests,
      total_errors: entry.total_errors
    }
  end

  defp update_buckets(buckets, now, latency_ms, is_error) do
    case buckets do
      [%{time: ^now} = current | rest] ->
        [%{current |
          latencies: [latency_ms | current.latencies],
          count: current.count + 1,
          errors: if(is_error, do: current.errors + 1, else: current.errors)
        } | rest]

      other ->
        [%{time: now, latencies: [latency_ms], count: 1, errors: if(is_error, do: 1, else: 0)} | other]
    end
  end

  defp new_slo_entry(name, now, latency_ms, is_error) do
    %{
      definition: %{name: name, latency_p99_ms: 500, error_rate_pct: 5.0},
      buckets: [%{time: now, latencies: [latency_ms], count: 1, errors: if(is_error, do: 1, else: 0)}],
      total_requests: 1,
      total_errors: if(is_error, do: 1, else: 0)
    }
  end

  defp percentile([], _p), do: 0
  defp percentile(values, p) do
    sorted = Enum.sort(values)
    k = max(0, Float.ceil(length(sorted) * p / 100) |> trunc() |> Kernel.-(1))
    Enum.at(sorted, k, 0)
  end

  defp bucket_key(bucket_seconds) do
    div(System.os_time(:second), bucket_seconds) * bucket_seconds
  end

  defp schedule_cleanup do
    Process.send_after(self(), :cleanup, @cleanup_interval)
  end

  defp slo_name_from_conn(nil), do: nil
  defp slo_name_from_conn(%{method: method, request_path: path}) do
    slug =
      path
      |> String.trim_leading("/")
      |> String.replace(~r/[^a-zA-Z0-9\/]/, "")
      |> String.replace("/", "_")
      |> String.downcase()

    String.to_existing_atom("#{slug}_#{String.downcase(method)}")
  rescue
    ArgumentError -> nil
    _ -> nil
  end
  defp slo_name_from_conn(_), do: nil

  defp default_definitions do
    [
      %{name: :api_v1_messages_post, latency_p99_ms: 200, error_rate_pct: 1.0},
      %{name: :api_v1_auth_login_post, latency_p99_ms: 300, error_rate_pct: 0.5},
      %{name: :api_v1_conversations_get, latency_p99_ms: 150, error_rate_pct: 1.0},
      %{name: :api_v1_forums_get, latency_p99_ms: 250, error_rate_pct: 1.0},
      %{name: :ws_message_delivery, latency_p99_ms: 100, error_rate_pct: 0.1}
    ]
  end
end
