defmodule CGraphWeb.Admin.EventsHelpers do
  @moduledoc """
  Shared helper functions for the admin events controller.

  Provides validation, pagination, and utility functions used by
  `CGraphWeb.Admin.EventsController` to keep the controller under
  the 500-line file size limit.
  """

  import Plug.Conn

  @doc """
  Require admin authentication plug.
  Returns 401 if no admin, 403 if insufficient role.
  """
  @spec require_admin(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def require_admin(conn, _opts) do
    case conn.assigns[:current_admin] do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> Phoenix.Controller.json(%{error: "Admin authentication required"})
        |> halt()

      admin ->
        if admin.role in [:admin, :super_admin] do
          conn
        else
          conn
          |> put_status(:forbidden)
          |> Phoenix.Controller.json(%{error: "Insufficient permissions"})
          |> halt()
        end
    end
  end

  @doc """
  Rate limit plug for admin API endpoints.
  """
  @spec rate_limit(Plug.Conn.t(), keyword()) :: Plug.Conn.t()
  def rate_limit(conn, opts) do
    max_requests = Keyword.get(opts, :max_requests, 100)
    window_ms = Keyword.get(opts, :window_ms, 60_000)
    key = "admin_events:#{conn.assigns.current_admin.id}"

    case CGraph.RateLimiter.check(key, :admin_api, limit: max_requests, window_ms: window_ms) do
      :ok ->
        conn

      {:error, :rate_limited, info} ->
        conn
        |> put_resp_header("x-ratelimit-limit", to_string(max_requests))
        |> put_resp_header("x-ratelimit-remaining", "0")
        |> put_resp_header("retry-after", to_string(info.retry_after))
        |> put_status(:too_many_requests)
        |> Phoenix.Controller.json(%{error: "Rate limit exceeded", retry_after: info.retry_after})
        |> halt()
    end
  end

  @doc "Parse page number from params, defaulting to 1."
  @spec get_page(map()) :: pos_integer()
  def get_page(params), do: max(1, String.to_integer(params["page"] || "1"))

  @doc "Parse per_page from params, clamped between 1 and 100."
  @spec get_per_page(map()) :: pos_integer()
  def get_per_page(params), do: min(100, max(1, String.to_integer(params["per_page"] || "20")))

  @doc "Validate event start/end date constraints."
  @spec validate_event_dates(map()) :: :ok | {:error, atom(), String.t()}
  def validate_event_dates(%{"starts_at" => starts_at, "ends_at" => ends_at}) do
    with {:ok, start_dt, _} <- DateTime.from_iso8601(starts_at),
         {:ok, end_dt, _} <- DateTime.from_iso8601(ends_at) do
      cond do
        DateTime.compare(end_dt, start_dt) != :gt ->
          {:error, :invalid_dates, "End date must be after start date"}

        DateTime.diff(end_dt, start_dt, :day) > 365 ->
          {:error, :invalid_dates, "Event duration cannot exceed 365 days"}

        true ->
          :ok
      end
    else
      _ -> {:error, :invalid_dates, "Invalid date format"}
    end
  end
  def validate_event_dates(_), do: :ok

  @doc "Validate immutable fields on active events."
  @spec validate_event_update(map(), map()) :: :ok | {:error, atom(), String.t()}
  def validate_event_update(%{status: :active}, %{"starts_at" => _}) do
    {:error, :immutable_field, "Cannot modify start date of active event"}
  end
  def validate_event_update(_, _), do: :ok

  @doc "Validate that only draft events can be deleted."
  @spec validate_can_delete(map()) :: :ok | {:error, atom(), String.t()}
  def validate_can_delete(%{status: :draft}), do: :ok
  def validate_can_delete(_), do: {:error, :cannot_delete, "Only draft events can be deleted"}

  @doc "Validate that battle pass can only be modified in draft/scheduled events."
  @spec validate_can_modify_battle_pass(map()) :: :ok | {:error, atom(), String.t()}
  def validate_can_modify_battle_pass(%{status: status}) when status in [:draft, :scheduled] do
    :ok
  end
  def validate_can_modify_battle_pass(_) do
    {:error, :immutable, "Cannot modify battle pass of active/ended event"}
  end

  @doc "Compute changed fields between old and new event maps."
  @spec get_changes(map(), map()) :: map()
  def get_changes(old, new) do
    [:name, :description, :starts_at, :ends_at, :config, :status]
    |> Enum.reduce(%{}, fn field, acc ->
      old_val = Map.get(old, field)
      new_val = Map.get(new, field)

      if old_val != new_val do
        Map.put(acc, field, %{from: old_val, to: new_val})
      else
        acc
      end
    end)
  end
end
