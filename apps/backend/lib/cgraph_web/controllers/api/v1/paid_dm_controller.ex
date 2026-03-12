defmodule CGraphWeb.API.V1.PaidDmController do
  @moduledoc """
  Controller for paid DM file endpoints.

  Handles sending, unlocking, and listing paid file attachments,
  as well as managing per-user paid DM settings.
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.PaidDm

  action_fallback CGraphWeb.FallbackController

  @doc "POST /api/v1/paid-dm/send"
  def send(conn, params) do
    user_id = conn.assigns.current_user.id

    file_attrs = %{
      file_url: params["file_url"],
      file_type: params["file_type"]
    }

    case PaidDm.send_paid_file(user_id, params["receiver_id"], file_attrs, params["nodes_required"]) do
      {:ok, file} ->
        conn
        |> put_status(:created)
        |> render_data(serialize_file(file))

      {:error, changeset} ->
        render_error(conn, :unprocessable_entity, changeset)
    end
  end

  @doc "PUT /api/v1/paid-dm/:id/unlock"
  def unlock(conn, %{"id" => id}) do
    user_id = conn.assigns.current_user.id

    case PaidDm.unlock_paid_file(id, user_id) do
      {:ok, file} ->
        render_data(conn, serialize_file(file))

      {:error, :not_found} ->
        render_error(conn, :not_found, "File not found or already unlocked")

      {:error, :expired} ->
        render_error(conn, :gone, "File has expired")

      {:error, :insufficient_balance} ->
        render_error(conn, :payment_required, "Insufficient nodes balance")

      {:error, changeset} ->
        render_error(conn, :unprocessable_entity, changeset)
    end
  end

  @doc "GET /api/v1/paid-dm/pending"
  def pending(conn, _params) do
    user_id = conn.assigns.current_user.id
    files = PaidDm.list_pending_files(user_id)
    render_data(conn, %{files: Enum.map(files, &serialize_file/1)})
  end

  @doc "GET /api/v1/paid-dm/settings"
  def get_settings(conn, _params) do
    user_id = conn.assigns.current_user.id

    case PaidDm.get_settings(user_id) do
      nil -> render_data(conn, %{settings: nil})
      settings -> render_data(conn, %{settings: serialize_settings(settings)})
    end
  end

  @doc "PUT /api/v1/paid-dm/settings"
  def update_settings(conn, params) do
    user_id = conn.assigns.current_user.id

    attrs = %{
      enabled: params["enabled"],
      price_per_file: params["price_per_file"],
      accepted_types: params["accepted_types"],
      auto_accept_friends: params["auto_accept_friends"]
    }

    case PaidDm.configure_settings(user_id, attrs) do
      {:ok, settings} ->
        render_data(conn, %{settings: serialize_settings(settings)})

      {:error, changeset} ->
        render_error(conn, :unprocessable_entity, changeset)
    end
  end

  # ============================================================================
  # Serializers
  # ============================================================================

  defp serialize_file(file) do
    %{
      id: file.id,
      sender_id: file.sender_id,
      receiver_id: file.receiver_id,
      file_url: file.file_url,
      file_type: file.file_type,
      nodes_required: file.nodes_required,
      status: file.status,
      expires_at: file.expires_at,
      inserted_at: file.inserted_at
    }
  end

  defp serialize_settings(settings) do
    %{
      id: settings.id,
      user_id: settings.user_id,
      enabled: settings.enabled,
      price_per_file: settings.price_per_file,
      accepted_types: settings.accepted_types,
      auto_accept_friends: settings.auto_accept_friends
    }
  end
end
