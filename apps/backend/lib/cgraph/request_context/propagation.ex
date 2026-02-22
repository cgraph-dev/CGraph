defmodule CGraph.RequestContext.Propagation do
  @moduledoc false

  alias CGraph.RequestContext.Access

  @context_key :cgraph_request_context

  @default_config %{
    trace_header: "traceparent"
  }

  # ---------------------------------------------------------------------------
  # Context Propagation
  # ---------------------------------------------------------------------------

  @doc """
  Create a new child span within the current trace.
  """
  @spec create_child_span() :: map() | nil
  def create_child_span do
    case Access.get() do
      nil ->
        nil

      context ->
        %{
          context
          | parent_span_id: context.span_id,
            span_id: generate_span_id()
        }
    end
  end

  @doc """
  Get headers for propagating context to external HTTP services.

  Returns headers compatible with W3C Trace Context and common correlation headers.
  """
  @spec propagation_headers() :: [{String.t(), String.t()}]
  def propagation_headers do
    context = Access.get()

    headers = [
      {"x-request-id", context && context.request_id},
      {"x-correlation-id", context && (context.correlation_id || context.request_id)},
      {"x-tenant-id", context && context.tenant_id},
      {"x-user-id", context && context.user_id}
    ]

    headers =
      if context && context.trace_id do
        traceparent = format_traceparent(context)
        [{"traceparent", traceparent} | headers]
      else
        headers
      end

    headers
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
  end

  @doc """
  Execute a function with the current context.
  """
  @spec with_context((-> term())) :: term()
  def with_context(fun) do
    context = Access.get()

    try do
      if context, do: put_context(context)
      if context, do: update_logger_metadata(context)
      fun.()
    after
      CGraph.RequestContext.cleanup()
    end
  end

  @doc """
  Spawn a new process with the current context.
  """
  @spec spawn_with_context((-> term())) :: pid()
  def spawn_with_context(fun) do
    context = Access.get()

    {:ok, pid} =
      Task.Supervisor.start_child(CGraph.TaskSupervisor, fn ->
        if context, do: put_context(context)
        if context, do: update_logger_metadata(context)
        fun.()
      end)

    pid
  end

  @doc """
  Spawn a linked process with the current context.
  """
  @spec spawn_link_with_context((-> term())) :: pid()
  def spawn_link_with_context(fun) do
    context = Access.get()

    spawn_link(fn ->
      if context, do: put_context(context)
      if context, do: update_logger_metadata(context)
      fun.()
    end)
  end

  @doc """
  Start a Task with the current context.
  """
  @spec async_with_context((-> term())) :: Task.t()
  def async_with_context(fun) do
    context = Access.get()

    Task.async(fn ->
      if context, do: put_context(context)
      if context, do: update_logger_metadata(context)
      fun.()
    end)
  end

  @doc """
  Get context suitable for passing to a background job.
  """
  @spec job_context() :: map()
  def job_context do
    case Access.get() do
      nil ->
        %{}

      context ->
        %{
          request_id: context.request_id,
          trace_id: context.trace_id,
          span_id: context.span_id,
          user_id: context.user_id,
          tenant_id: context.tenant_id,
          correlation_id: context.correlation_id
        }
        |> Enum.reject(fn {_k, v} -> is_nil(v) end)
        |> Map.new()
    end
  end

  @doc """
  Restore context from job arguments.
  """
  @spec restore_from_job(map()) :: term()
  def restore_from_job(args) do
    CGraph.RequestContext.init(%{
      request_id: args["request_id"] || args[:request_id] || generate_request_id(),
      trace_id: args["trace_id"] || args[:trace_id],
      span_id: generate_span_id(),
      parent_span_id: args["span_id"] || args[:span_id],
      user_id: args["user_id"] || args[:user_id],
      tenant_id: args["tenant_id"] || args[:tenant_id],
      correlation_id: args["correlation_id"] || args[:correlation_id]
    })
  end

  # ---------------------------------------------------------------------------
  # W3C Trace Context
  # ---------------------------------------------------------------------------

  @doc """
  Parse W3C Trace Context traceparent header.

  Format: version-trace_id-span_id-trace_flags
  Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
  """
  @spec parse_traceparent(Plug.Conn.t() | String.t() | nil) :: {String.t() | nil, String.t() | nil}
  def parse_traceparent(%Plug.Conn{} = conn) do
    header = get_header(conn, get_config(:trace_header))
    parse_traceparent(header)
  end

  def parse_traceparent(nil), do: {nil, nil}

  def parse_traceparent(traceparent) when is_binary(traceparent) do
    case String.split(traceparent, "-") do
      [_version, trace_id, parent_id, _flags]
      when byte_size(trace_id) == 32 and byte_size(parent_id) == 16 ->
        {trace_id, parent_id}

      _ ->
        {nil, nil}
    end
  end

  @doc """
  Format context as W3C traceparent header value.
  """
  @spec format_traceparent(map()) :: String.t() | nil
  def format_traceparent(%{trace_id: trace_id, span_id: span_id})
      when is_binary(trace_id) and is_binary(span_id) do
    "00-#{trace_id}-#{span_id}-01"
  end

  def format_traceparent(_), do: nil

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp put_context(context) do
    Process.put(@context_key, context)
  end

  defp update_logger_metadata(context) do
    require Logger

    Logger.metadata(
      request_id: context.request_id,
      trace_id: context.trace_id,
      span_id: context.span_id,
      user_id: context.user_id,
      tenant_id: context.tenant_id
    )
  end

  defp get_header(conn, header_name) do
    case Plug.Conn.get_req_header(conn, String.downcase(header_name)) do
      [value | _] -> value
      [] -> nil
    end
  end

  @doc false
  @spec generate_request_id() :: String.t()
  def generate_request_id do
    "req_" <> Base.encode16(:crypto.strong_rand_bytes(12), case: :lower)
  end

  @doc false
  @spec generate_span_id() :: String.t()
  def generate_span_id do
    Base.encode16(:crypto.strong_rand_bytes(8), case: :lower)
  end

  defp get_config(key) do
    app_config = Application.get_env(:cgraph, CGraph.RequestContext, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
end
