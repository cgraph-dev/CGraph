defmodule CGraphWeb.Plugs.AuditLogPlug do
  @moduledoc """
  Plug that automatically logs security-sensitive actions to the audit system.

  Attaches a `before_send` callback to the connection that fires after the
  response is rendered, recording the action, actor, IP, and response status
  into `CGraph.Audit`.

  ## Usage

      # In router pipeline:
      plug CGraphWeb.Plugs.AuditLogPlug, category: :auth

      # On specific controller actions:
      plug CGraphWeb.Plugs.AuditLogPlug, category: :admin, only: [:create, :delete]

  ## Options

  - `:category` — Audit category (default: `:general`). One of
    `:auth`, `:user`, `:admin`, `:data`, `:security`, `:compliance`, `:general`.
  - `:only` — List of controller actions to audit (default: all).
  - `:except` — List of controller actions to skip (default: none).
  - `:event_type` — Override event type atom. Defaults to `{method}_{path_segment}`.
  """

  @behaviour Plug

  require Logger

  @impl Plug
  def init(opts) do
    %{
      category: Keyword.get(opts, :category, :general),
      only: Keyword.get(opts, :only),
      except: Keyword.get(opts, :except, []),
      event_type: Keyword.get(opts, :event_type)
    }
  end

  @impl Plug
  def call(conn, opts) do
    conn = Plug.Conn.put_private(conn, :cgraph_request_start, System.monotonic_time(:millisecond))

    Plug.Conn.register_before_send(conn, fn conn ->
      if should_audit?(conn, opts) do
        audit_request(conn, opts)
      end

      conn
    end)
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp should_audit?(conn, opts) do
    action = phoenix_action(conn)

    cond do
      # Skip non-mutating GETs unless explicitly included
      conn.method == "GET" and opts.category not in [:security, :compliance] ->
        false

      opts.only != nil ->
        action in opts.only

      opts.except != [] ->
        action not in opts.except

      true ->
        # Audit all mutating requests by default
        conn.method in ["POST", "PUT", "PATCH", "DELETE"]
    end
  end

  defp audit_request(conn, opts) do
    event_type = opts.event_type || derive_event_type(conn)
    actor_id = get_actor_id(conn)
    actor_type = if actor_id, do: derive_actor_type(conn), else: :system

    metadata = %{
      method: conn.method,
      path: conn.request_path,
      status: conn.status,
      params: sanitize_params(conn.params),
      response_time_ms: response_time(conn)
    }

    try do
      CGraph.Audit.log_with_conn(conn, opts.category, event_type, metadata,
        actor_id: actor_id,
        actor_type: actor_type,
        target_id: extract_target_id(conn),
        target_type: extract_target_type(conn)
      )
    rescue
      error ->
        Logger.error("AuditLogPlug failed: #{inspect(error)}")
    end
  end

  defp derive_event_type(conn) do
    # Build event type from HTTP method + first meaningful path segment
    # POST /api/v1/auth/login → :post_auth_login
    segments =
      conn.request_path
      |> String.split("/")
      |> Enum.reject(&(&1 in ["", "api", "v1", "v2"]))
      |> Enum.take(2)
      |> Enum.join("_")

    method = conn.method |> String.downcase()
    :"#{method}_#{segments}"
  end

  defp phoenix_action(conn) do
    case conn.private do
      %{phoenix_action: action} -> action
      _ -> nil
    end
  end

  defp get_actor_id(conn) do
    case conn.assigns do
      %{current_user: %{id: id}} -> id
      _ -> nil
    end
  end

  defp derive_actor_type(conn) do
    case conn.assigns do
      %{current_user: %{role: "admin"}} -> :admin
      %{current_user: %{role: "moderator"}} -> :admin
      %{current_user: _} -> :user
      _ -> :system
    end
  end

  defp extract_target_id(conn) do
    # Try common param names for target identification
    conn.params["id"] || conn.params["user_id"] || conn.params["conversation_id"]
  end

  defp extract_target_type(conn) do
    segments =
      conn.request_path
      |> String.split("/")
      |> Enum.reject(&(&1 in ["", "api", "v1", "v2"]))

    case segments do
      [resource | _] -> resource
      _ -> nil
    end
  end

  @sensitive_keys ~w(password password_confirmation token secret api_key
                     current_password new_password private_key seed_phrase)

  defp sanitize_params(params) when is_map(params) do
    params
    |> Map.drop(@sensitive_keys)
    |> Map.new(fn
      {k, v} when is_binary(v) and byte_size(v) > 200 ->
        {k, String.slice(v, 0, 200) <> "...[truncated]"}
      {k, v} when is_map(v) -> {k, sanitize_params(v)}
      pair -> pair
    end)
  end
  defp sanitize_params(params), do: params

  defp response_time(conn) do
    case conn.private do
      %{cgraph_request_start: start} ->
        System.monotonic_time(:millisecond) - start
      _ -> nil
    end
  end
end
