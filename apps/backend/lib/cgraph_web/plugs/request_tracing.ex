defmodule CGraphWeb.Plugs.RequestTracing do
  @moduledoc """
  End-to-end request tracing plug.

  Assigns a correlation ID to every request that propagates through:
  - HTTP request → response header
  - WebSocket channel events
  - Oban background jobs
  - Push notification pipeline
  - Log entries

  ## How It Works

  ```
  ┌─────────────────────────────────────────────────────────────┐
  │              Request Trace ID Propagation                    │
  ├─────────────────────────────────────────────────────────────┤
  │                                                              │
  │  Client Request                                              │
  │  X-Request-Id: abc-123                                      │
  │       │                                                      │
  │       ▼                                                      │
  │  [Plug] → Logger metadata[:request_id] = "abc-123"          │
  │       │                                                      │
  │       ├──► Controller → Oban.insert(meta: %{trace_id: …})  │
  │       │                      │                               │
  │       │                      ▼                               │
  │       │              Oban Worker logs with trace_id          │
  │       │                      │                               │
  │       │                      ▼                               │
  │       │              PushService → includes trace_id         │
  │       │                                                      │
  │       ├──► Response Header: X-Request-Id: abc-123           │
  │       └──► Sentry: tags.request_id = abc-123                │
  │                                                              │
  └─────────────────────────────────────────────────────────────┘
  ```

  ## Usage

  Already included in the :api pipeline. To access the trace ID:

      # In a controller
      trace_id = conn.assigns[:trace_id]

      # In a channel
      trace_id = socket.assigns[:trace_id]

      # In an Oban worker
      trace_id = job.args["_trace_id"]

      # To propagate to Oban jobs
      RequestTracing.with_trace(fn ->
        %{user_id: user.id}
        |> MyWorker.new()
        |> Oban.insert()
      end)
  """

  @behaviour Plug

  require Logger

  @impl true
  @spec init(keyword()) :: keyword()
  def init(opts), do: opts

  @impl true
  @spec call(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def call(conn, _opts) do
    trace_id = get_or_generate_trace_id(conn)

    # Set Logger metadata for all downstream logs
    Logger.metadata(
      request_id: trace_id,
      trace_id: trace_id
    )

    # Store in process dictionary for Oban job propagation
    Process.put(:cgraph_trace_id, trace_id)

    conn
    |> Plug.Conn.assign(:trace_id, trace_id)
    |> Plug.Conn.put_resp_header("x-request-id", trace_id)
    |> Plug.Conn.put_resp_header("x-trace-id", trace_id)
  end

  @doc """
  Get the current trace ID from the process dictionary.
  Falls back to generating a new one if not set.
  """
  @spec current_trace_id() :: String.t()
  def current_trace_id do
    Process.get(:cgraph_trace_id) || generate_trace_id()
  end

  @doc """
  Build Oban job args with trace ID included.
  Use this when inserting Oban jobs to maintain the trace chain.

      args = RequestTracing.traced_args(%{user_id: user.id, action: "send_email"})
      args |> MyWorker.new() |> Oban.insert()
  """
  @spec traced_args(map()) :: map()
  def traced_args(args) when is_map(args) do
    Map.put(args, "_trace_id", current_trace_id())
  end

  @doc """
  Extract and set trace ID from Oban job args.
  Call this at the start of any Oban worker perform/1.

      def perform(%Oban.Job{args: args}) do
        RequestTracing.restore_trace(args)
        # ... rest of worker logic
      end
  """
  @spec restore_trace(map()) :: :ok
  def restore_trace(args) when is_map(args) do
    trace_id = Map.get(args, "_trace_id", generate_trace_id())
    Process.put(:cgraph_trace_id, trace_id)
    Logger.metadata(trace_id: trace_id)
    :ok
  end

  @doc """
  Set trace ID on a Phoenix socket (for WebSocket channels).
  """
  @spec assign_trace(Phoenix.Socket.t()) :: Phoenix.Socket.t()
  def assign_trace(socket) do
    trace_id = current_trace_id()
    Process.put(:cgraph_trace_id, trace_id)
    Logger.metadata(trace_id: trace_id)
    Phoenix.Socket.assign(socket, :trace_id, trace_id)
  end

  # ── Internal ──

  defp get_or_generate_trace_id(conn) do
    case Plug.Conn.get_req_header(conn, "x-request-id") do
      [trace_id | _] when byte_size(trace_id) > 0 -> trace_id
      _ -> generate_trace_id()
    end
  end

  defp generate_trace_id do
    # Format: "cgr-<timestamp_hex>-<random>"
    # Sortable by time, unique, readable in logs
    ts = System.system_time(:millisecond) |> Integer.to_string(16) |> String.downcase()
    rand = :crypto.strong_rand_bytes(8) |> Base.url_encode64(padding: false)
    "cgr-#{ts}-#{rand}"
  end
end
