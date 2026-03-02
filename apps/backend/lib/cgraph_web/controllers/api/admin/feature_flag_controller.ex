defmodule CGraphWeb.API.Admin.FeatureFlagController do
  @moduledoc """
  Admin CRUD controller for feature flags.

  Provides admin-only endpoints for managing runtime feature flags:
  - List all flags with current state
  - Create new flags (boolean, percentage, variant, targeted)
  - Update flag configuration
  - Delete flags
  - View change history (audit trail)

  ## Endpoints

  - `GET /api/admin/feature-flags` — List all flags
  - `GET /api/admin/feature-flags/:id` — Get flag details
  - `POST /api/admin/feature-flags` — Create a new flag
  - `PATCH /api/admin/feature-flags/:id` — Update a flag
  - `DELETE /api/admin/feature-flags/:id` — Delete a flag
  - `GET /api/admin/feature-flags/:id/history` — View change history
  """

  use CGraphWeb, :controller

  alias CGraph.FeatureFlags

  action_fallback CGraphWeb.FallbackController

  # ---------------------------------------------------------------------------
  # Actions
  # ---------------------------------------------------------------------------

  @doc """
  List all feature flags with their current state.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    flags = FeatureFlags.all_flags()

    flag_list =
      flags
      |> Enum.map(fn {name, config} ->
        Map.merge(config, %{name: name})
      end)
      |> Enum.sort_by(& &1.name)

    conn
    |> put_status(:ok)
    |> json(%{data: flag_list})
  end

  @doc """
  Get a single feature flag's details.
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"id" => name}) do
    flag_name = normalize_name(name)

    case FeatureFlags.get_flag(flag_name) do
      nil ->
        conn
        |> put_status(:not_found)
        |> json(%{error: %{code: "not_found", message: "Flag '#{name}' not found"}})

      flag ->
        conn
        |> put_status(:ok)
        |> json(%{data: Map.merge(flag, %{name: flag_name})})
    end
  end

  @doc """
  Create a new feature flag.

  ## Body Parameters

  - `name` (required) — Flag name (atom-safe string)
  - `type` — Flag type: "boolean" | "percentage" | "variant" | "targeted" (default: "boolean")
  - `enabled` — Initial enabled state (default: false)
  - `percentage` — Rollout percentage for percentage flags (0-100)
  - `variants` — List of variant names for A/B test flags
  - `weights` — List of weights for variants
  - `rules` — Targeting rules map for targeted flags
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"flag" => params}) do
    flag_name = normalize_name(params["name"] || "")
    admin = conn.assigns[:current_user]

    config = build_flag_config(params)

    case FeatureFlags.create_flag(flag_name, config) do
      {:ok, flag} ->
        log_audit(admin, :create, flag_name, %{}, config)

        conn
        |> put_status(:created)
        |> json(%{data: Map.merge(flag, %{name: flag_name})})

      {:error, :already_exists} ->
        conn
        |> put_status(:conflict)
        |> json(%{error: %{code: "already_exists", message: "Flag '#{flag_name}' already exists"}})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: %{code: "invalid", message: inspect(reason)}})
    end
  end

  def create(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: %{code: "bad_request", message: "Missing 'flag' parameter"}})
  end

  @doc """
  Update an existing feature flag.
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"id" => name, "flag" => params}) do
    flag_name = normalize_name(name)
    admin = conn.assigns[:current_user]

    old_config = FeatureFlags.get_flag(flag_name)

    if is_nil(old_config) do
      conn
      |> put_status(:not_found)
      |> json(%{error: %{code: "not_found", message: "Flag '#{name}' not found"}})
    else
      changes = build_flag_changes(params)

      case FeatureFlags.update_flag(flag_name, changes) do
        {:ok, updated} ->
          log_audit(admin, :update, flag_name, old_config, updated)

          conn
          |> put_status(:ok)
          |> json(%{data: Map.merge(updated, %{name: flag_name})})

        {:error, reason} ->
          conn
          |> put_status(:unprocessable_entity)
          |> json(%{error: %{code: "invalid", message: inspect(reason)}})
      end
    end
  end

  def update(conn, %{"id" => _name}) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: %{code: "bad_request", message: "Missing 'flag' parameter"}})
  end

  @doc """
  Delete a feature flag.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"id" => name}) do
    flag_name = normalize_name(name)
    admin = conn.assigns[:current_user]

    old_config = FeatureFlags.get_flag(flag_name)
    :ok = FeatureFlags.delete_flag(flag_name)

    log_audit(admin, :delete, flag_name, old_config || %{}, %{})

    send_resp(conn, :no_content, "")
  end

  @doc """
  View change history (audit trail) for a feature flag.
  """
  @spec history(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def history(conn, %{"id" => name}) do
    flag_name = normalize_name(name)
    history = FeatureFlags.get_history(flag_name)

    conn
    |> put_status(:ok)
    |> json(%{data: history})
  end

  # ---------------------------------------------------------------------------
  # User-facing flag endpoint (read-only, for frontend SDK polling)
  # ---------------------------------------------------------------------------

  @doc """
  Return evaluated feature flags for the current user.

  This is the endpoint the frontend SDK polls. Returns only flag names
  and their evaluated state for the authenticated user — no admin details.
  """
  @spec user_flags(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def user_flags(conn, _params) do
    user = conn.assigns[:current_user]
    all = FeatureFlags.all_flags()

    evaluated =
      all
      |> Enum.map(fn {name, _config} ->
        enabled = FeatureFlags.enabled?(name, user_id: user && user.id)
        variant = FeatureFlags.variant(name, user_id: user && user.id)
        {name, %{enabled: enabled, variant: variant}}
      end)
      |> Map.new()

    conn
    |> put_status(:ok)
    |> json(%{data: %{flags: evaluated}})
  end

  # ---------------------------------------------------------------------------
  # Helpers
  # ---------------------------------------------------------------------------

  defp normalize_name(name) when is_binary(name) do
    name
    |> String.downcase()
    |> String.replace(~r/[^a-z0-9_]/, "_")
    |> String.to_atom()
  end

  defp normalize_name(name) when is_atom(name), do: name

  defp build_flag_config(params) do
    type = parse_type(params["type"] || "boolean")

    base = %{
      type: type,
      enabled: params["enabled"] == true || params["enabled"] == "true"
    }

    case type do
      :percentage ->
        Map.put(base, :percentage, to_integer(params["percentage"], 0))

      :variant ->
        base
        |> Map.put(:variants, params["variants"] || [])
        |> Map.put(:weights, params["weights"] || [])

      :targeted ->
        Map.put(base, :rules, params["rules"] || %{})

      _ ->
        base
    end
  end

  defp build_flag_changes(params) do
    params
    |> Enum.reduce(%{}, fn
      {"enabled", val}, acc -> Map.put(acc, :enabled, val == true || val == "true")
      {"percentage", val}, acc -> Map.put(acc, :percentage, to_integer(val, 0))
      {"type", val}, acc -> Map.put(acc, :type, parse_type(val))
      {"variants", val}, acc -> Map.put(acc, :variants, val)
      {"weights", val}, acc -> Map.put(acc, :weights, val)
      {"rules", val}, acc -> Map.put(acc, :rules, val)
      _, acc -> acc
    end)
  end

  defp parse_type("boolean"), do: :boolean
  defp parse_type("percentage"), do: :percentage
  defp parse_type("variant"), do: :variant
  defp parse_type("targeted"), do: :targeted
  defp parse_type(_), do: :boolean

  defp to_integer(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {n, _} -> n
      :error -> default
    end
  end

  defp to_integer(val, _default) when is_integer(val), do: val
  defp to_integer(_, default), do: default

  defp log_audit(admin, action, flag_name, old_config, new_config) do
    require Logger

    Logger.info("Feature flag #{action}",
      flag: flag_name,
      admin_id: admin && admin.id,
      old: inspect(old_config),
      new: inspect(new_config)
    )

    # Store in history via FeatureFlags
    FeatureFlags.record_history(flag_name, %{
      action: action,
      changed_by: admin && admin.id,
      old_config: old_config,
      new_config: new_config,
      timestamp: DateTime.utc_now()
    })
  end
end
