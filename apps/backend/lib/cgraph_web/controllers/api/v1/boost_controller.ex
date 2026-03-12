defmodule CGraphWeb.API.V1.BoostController do
  @moduledoc """
  Controller for content boost endpoints.

  Provides create, list active, and cancel operations for boosts.
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Boosts

  action_fallback CGraphWeb.FallbackController

  @doc """
  POST /api/v1/boosts
  Creates a new content boost.
  """
  def create(conn, params) do
    user_id = conn.assigns.current_user.id

    case Boosts.create_boost(user_id, params) do
      {:ok, boost} ->
        conn
        |> put_status(:created)
        |> render_data(%{boost: serialize(boost)})

      {:error, :invalid_boost_type} ->
        render_error(conn, :unprocessable_entity, "Invalid boost type")

      {:error, :invalid_duration} ->
        render_error(conn, :unprocessable_entity, "Invalid duration")

      {:error, :insufficient_balance} ->
        render_error(conn, :payment_required, "Insufficient nodes balance")

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  GET /api/v1/boosts
  Lists active boosts for the current user.
  """
  def active(conn, _params) do
    user_id = conn.assigns.current_user.id
    boosts = Boosts.list_active_boosts(user_id)

    render_data(conn, %{
      boosts: Enum.map(boosts, &serialize/1),
      total: length(boosts)
    })
  end

  @doc """
  DELETE /api/v1/boosts/:id
  Cancels an active boost with prorated refund.
  """
  def cancel(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user.id

    case Boosts.cancel_boost(user_id, id) do
      {:ok, boost} ->
        render_data(conn, %{boost: serialize(boost)})

      {:error, :not_found} ->
        render_error(conn, :not_found, "Boost not found or already cancelled")
    end
  end

  # ---------------------------------------------------------------------------
  # Private
  # ---------------------------------------------------------------------------

  defp serialize(boost) do
    %{
      id: boost.id,
      target_type: boost.target_type,
      target_id: boost.target_id,
      boost_type: boost.boost_type,
      duration_hours: boost.duration_hours,
      nodes_spent: boost.nodes_spent,
      started_at: boost.started_at,
      expires_at: boost.expires_at,
      status: boost.status
    }
  end
end
