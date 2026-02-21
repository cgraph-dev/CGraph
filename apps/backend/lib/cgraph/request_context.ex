defmodule CGraph.RequestContext do
  @moduledoc """
  CGraph.RequestContext — thin delegation facade.

  Delegates to specialized sub-modules:

  - `Access`      — Context getters (request_id, trace_id, user, tenant, …) and setters
  - `Propagation` — Cross-process/service context propagation and W3C Trace Context
  """

  require Logger

  alias CGraph.RequestContext.{Access, Propagation}

  # ---------------------------------------------------------------------------
  # Type Definitions
  # ---------------------------------------------------------------------------

  @type request_id :: String.t()
  @type trace_id :: String.t()
  @type span_id :: String.t()
  @type user_id :: String.t()
  @type tenant_id :: String.t()

  @type context :: %{
          request_id: request_id(),
          trace_id: trace_id() | nil,
          span_id: span_id() | nil,
          parent_span_id: span_id() | nil,
          user_id: user_id() | nil,
          tenant_id: tenant_id() | nil,
          correlation_id: String.t() | nil,
          started_at: DateTime.t(),
          metadata: map()
        }

  # ---------------------------------------------------------------------------
  # Configuration
  # ---------------------------------------------------------------------------

  @context_key :cgraph_request_context

  @default_config %{
    enabled: true,
    generate_request_id: true,
    trace_header: "traceparent",
    request_id_header: "x-request-id",
    correlation_id_header: "x-correlation-id",
    tenant_header: "x-tenant-id",
    user_header: "x-user-id"
  }

  # ---------------------------------------------------------------------------
  # Context Access (delegated)
  # ---------------------------------------------------------------------------

  defdelegate get(), to: Access
  defdelegate get_request_id(), to: Access
  defdelegate get_trace_id(), to: Access
  defdelegate get_span_id(), to: Access
  defdelegate get_user_id(), to: Access
  defdelegate get_current_user(), to: Access
  defdelegate get_tenant_id(), to: Access
  defdelegate get_correlation_id(), to: Access
  defdelegate get_metadata(key), to: Access
  defdelegate get_duration_ms(), to: Access

  # ---------------------------------------------------------------------------
  # Context Modification (delegated)
  # ---------------------------------------------------------------------------

  defdelegate set_user(user), to: Access
  defdelegate set_tenant(tenant_id), to: Access
  defdelegate put_metadata(key, value), to: Access
  defdelegate merge_metadata(metadata), to: Access

  # ---------------------------------------------------------------------------
  # Context Propagation (delegated)
  # ---------------------------------------------------------------------------

  defdelegate create_child_span(), to: Propagation
  defdelegate propagation_headers(), to: Propagation
  defdelegate with_context(fun), to: Propagation
  defdelegate spawn_with_context(fun), to: Propagation
  defdelegate spawn_link_with_context(fun), to: Propagation
  defdelegate async_with_context(fun), to: Propagation
  defdelegate job_context(), to: Propagation
  defdelegate restore_from_job(args), to: Propagation

  # ---------------------------------------------------------------------------
  # W3C Trace Context (delegated)
  # ---------------------------------------------------------------------------

  defdelegate parse_traceparent(conn_or_string), to: Propagation
  defdelegate format_traceparent(context), to: Propagation

  # ---------------------------------------------------------------------------
  # Context Initialization (kept in main module)
  # ---------------------------------------------------------------------------

  @doc """
  Initialize a new request context.
  """
  @spec init(map()) :: context()
  def init(opts \\ %{}) do
    context = %{
      request_id: opts[:request_id] || generate_request_id(),
      trace_id: opts[:trace_id],
      span_id: opts[:span_id] || generate_span_id(),
      parent_span_id: opts[:parent_span_id],
      user_id: opts[:user_id],
      tenant_id: opts[:tenant_id],
      correlation_id: opts[:correlation_id],
      started_at: DateTime.utc_now(),
      metadata: opts[:metadata] || %{}
    }

    put_context(context)
    update_logger_metadata(context)

    context
  end

  @doc """
  Initialize context from a Plug connection.
  """
  @spec init_from_conn(Plug.Conn.t()) :: {context(), Plug.Conn.t()}
  def init_from_conn(conn) do
    # Extract headers
    request_id = get_header(conn, get_config(:request_id_header)) || generate_request_id()
    correlation_id = get_header(conn, get_config(:correlation_id_header))
    tenant_id = get_header(conn, get_config(:tenant_header))
    user_id = get_header(conn, get_config(:user_header))

    # Parse W3C Trace Context
    {trace_id, parent_span_id} = Propagation.parse_traceparent(conn)

    context =
      init(%{
        request_id: request_id,
        trace_id: trace_id,
        parent_span_id: parent_span_id,
        correlation_id: correlation_id,
        tenant_id: tenant_id,
        user_id: user_id
      })

    # Add context to conn for access in controllers
    conn = Plug.Conn.put_private(conn, @context_key, context)

    # Add response headers
    conn =
      conn
      |> Plug.Conn.put_resp_header("x-request-id", context.request_id)
      |> maybe_add_trace_header(context)

    {context, conn}
  end

  @doc """
  Clean up context at the end of a request.
  """
  @spec cleanup() :: :ok
  def cleanup do
    Process.delete(@context_key)
    Logger.metadata([])
    :ok
  end

  # ---------------------------------------------------------------------------
  # Private Functions
  # ---------------------------------------------------------------------------

  defp put_context(context) do
    Process.put(@context_key, context)
  end

  defp update_logger_metadata(context) do
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

  defp maybe_add_trace_header(conn, %{trace_id: nil}), do: conn

  defp maybe_add_trace_header(conn, context) do
    case Propagation.format_traceparent(context) do
      nil -> conn
      traceparent -> Plug.Conn.put_resp_header(conn, "traceparent", traceparent)
    end
  end

  defp generate_request_id do
    "req_" <> Base.encode16(:crypto.strong_rand_bytes(12), case: :lower)
  end

  defp generate_span_id do
    Base.encode16(:crypto.strong_rand_bytes(8), case: :lower)
  end

  defp get_config(key) do
    app_config = Application.get_env(:cgraph, __MODULE__, [])
    Keyword.get(app_config, key, Map.get(@default_config, key))
  end
end
