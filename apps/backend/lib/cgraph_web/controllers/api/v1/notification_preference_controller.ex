defmodule CGraphWeb.API.V1.NotificationPreferenceController do
  @moduledoc """
  Handles per-conversation, per-channel, and per-group notification preferences.

  Supports listing, showing, upserting, and deleting notification preferences
  that override a user's global notification settings.
  """
  use CGraphWeb, :controller
  import CGraphWeb.ControllerHelpers, only: [render_data: 2, render_error: 3]

  alias CGraph.Notifications.Preferences

  action_fallback CGraphWeb.FallbackController

  @doc """
  List all notification preferences for the current user.
  GET /api/v1/notification-preferences
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    user = conn.assigns.current_user
    preferences = Preferences.list_all(user.id)

    render_data(conn, %{
      preferences: Enum.map(preferences, &serialize/1)
    })
  end

  @doc """
  Get a specific notification preference by target.
  GET /api/v1/notification-preferences/:target_type/:target_id
  """
  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"target_type" => target_type, "target_id" => target_id}) do
    user = conn.assigns.current_user

    case Preferences.get_preference(user.id, target_type, target_id) do
      nil ->
        render_data(conn, %{
          preference: %{
            target_type: target_type,
            target_id: target_id,
            mode: "all",
            muted_until: nil
          }
        })

      pref ->
        render_data(conn, %{preference: serialize(pref)})
    end
  end

  @doc """
  Create or update a notification preference.
  PUT /api/v1/notification-preferences/:target_type/:target_id
  """
  @spec upsert(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def upsert(conn, %{"target_type" => target_type, "target_id" => target_id} = params) do
    user = conn.assigns.current_user

    attrs = %{
      "mode" => Map.get(params, "mode", "all"),
      "muted_until" => Map.get(params, "muted_until")
    }

    case Preferences.set_preference(user.id, target_type, target_id, attrs) do
      {:ok, pref} ->
        conn
        |> put_status(:ok)
        |> render_data(%{preference: serialize(pref)})

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  @doc """
  Delete a notification preference (unmute / reset to default).
  DELETE /api/v1/notification-preferences/:target_type/:target_id
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"target_type" => target_type, "target_id" => target_id}) do
    user = conn.assigns.current_user
    :ok = Preferences.unmute(user.id, target_type, target_id)

    render_data(conn, %{message: "Preference reset to default"})
  end

  # ---------------------------------------------------------------------------
  # Serialization
  # ---------------------------------------------------------------------------

  defp serialize(%{} = pref) do
    %{
      id: pref.id,
      target_type: pref.target_type,
      target_id: pref.target_id,
      mode: pref.mode,
      muted_until: pref.muted_until && DateTime.to_iso8601(pref.muted_until),
      inserted_at: pref.inserted_at && NaiveDateTime.to_iso8601(pref.inserted_at),
      updated_at: pref.updated_at && NaiveDateTime.to_iso8601(pref.updated_at)
    }
  end
end
