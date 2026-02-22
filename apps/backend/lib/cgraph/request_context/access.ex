defmodule CGraph.RequestContext.Access do
  @moduledoc false

  @context_key :cgraph_request_context

  # ---------------------------------------------------------------------------
  # Context Access
  # ---------------------------------------------------------------------------

  @doc """
  Get the full request context.
  """
  @spec get() :: map() | nil
  def get do
    Process.get(@context_key)
  end

  @doc """
  Get the current request ID.
  """
  @spec get_request_id() :: binary() | nil
  def get_request_id do
    case get() do
      %{request_id: id} -> id
      _ -> nil
    end
  end

  @doc """
  Get the current trace ID.
  """
  @spec get_trace_id() :: binary() | nil
  def get_trace_id do
    case get() do
      %{trace_id: id} -> id
      _ -> nil
    end
  end

  @doc """
  Get the current span ID.
  """
  @spec get_span_id() :: binary() | nil
  def get_span_id do
    case get() do
      %{span_id: id} -> id
      _ -> nil
    end
  end

  @doc """
  Get the current user ID.
  """
  @spec get_user_id() :: binary() | nil
  def get_user_id do
    case get() do
      %{user_id: id} -> id
      _ -> nil
    end
  end

  @doc """
  Get the current user (full user struct if set).
  """
  @spec get_current_user() :: map() | nil
  def get_current_user do
    case get() do
      %{metadata: %{current_user: user}} -> user
      _ -> nil
    end
  end

  @doc """
  Get the current tenant ID.
  """
  @spec get_tenant_id() :: binary() | nil
  def get_tenant_id do
    case get() do
      %{tenant_id: id} -> id
      _ -> nil
    end
  end

  @doc """
  Get the correlation ID.
  """
  @spec get_correlation_id() :: binary() | nil
  def get_correlation_id do
    case get() do
      %{correlation_id: id} -> id
      _ -> nil
    end
  end

  @doc """
  Get custom metadata value.
  """
  @spec get_metadata(atom() | binary()) :: term()
  def get_metadata(key) do
    case get() do
      %{metadata: metadata} -> Map.get(metadata, key)
      _ -> nil
    end
  end

  @doc """
  Get request duration in milliseconds.
  """
  @spec get_duration_ms() :: float() | nil
  def get_duration_ms do
    case get() do
      %{started_at: started} ->
        DateTime.diff(DateTime.utc_now(), started, :microsecond) / 1000

      _ ->
        nil
    end
  end

  # ---------------------------------------------------------------------------
  # Context Modification
  # ---------------------------------------------------------------------------

  @doc """
  Set the current user.
  """
  @spec set_user(map()) :: :ok
  def set_user(user) when is_map(user) do
    update(fn context ->
      %{
        context
        | user_id: user[:id] || user["id"],
          metadata: Map.put(context.metadata, :current_user, user)
      }
    end)
  end

  @doc """
  Set the tenant ID.
  """
  @spec set_tenant(binary()) :: :ok
  def set_tenant(tenant_id) do
    update(fn context ->
      %{context | tenant_id: tenant_id}
    end)
  end

  @doc """
  Add custom metadata to the context.
  """
  @spec put_metadata(atom() | binary(), term()) :: :ok
  def put_metadata(key, value) do
    update(fn context ->
      %{context | metadata: Map.put(context.metadata, key, value)}
    end)
  end

  @doc """
  Merge multiple metadata values.
  """
  @spec merge_metadata(map()) :: :ok
  def merge_metadata(metadata) when is_map(metadata) do
    update(fn context ->
      %{context | metadata: Map.merge(context.metadata, metadata)}
    end)
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp update(fun) do
    case get() do
      nil ->
        :ok

      context ->
        new_context = fun.(context)
        Process.put(@context_key, new_context)
        update_logger_metadata(new_context)
        :ok
    end
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
end
