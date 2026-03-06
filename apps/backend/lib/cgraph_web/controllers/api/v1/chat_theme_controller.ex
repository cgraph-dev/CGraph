defmodule CGraphWeb.API.V1.ChatThemeController do
  @moduledoc """
  REST API for per-conversation chat themes.
  """
  use CGraphWeb, :controller

  alias CGraph.Messaging.ChatTheme

  action_fallback CGraphWeb.FallbackController

  @doc "PUT /api/v1/conversations/:conversation_id/theme"
  def update(conn, %{"conversation_id" => conv_id} = params) do
    user = conn.assigns.current_user
    theme_map = params["theme"] || %{}

    case ChatTheme.set_theme(user.id, conv_id, theme_map) do
      {:ok, ct} ->
        json(conn, %{data: theme_data(ct)})

      {:error, %Ecto.Changeset{} = cs} ->
        conn |> put_status(:unprocessable_entity) |> json(%{error: format_errors(cs)})
    end
  end

  @doc "GET /api/v1/conversations/:conversation_id/theme"
  def show(conn, %{"conversation_id" => conv_id}) do
    user = conn.assigns.current_user

    case ChatTheme.get_theme(user.id, conv_id) do
      nil ->
        json(conn, %{data: nil})

      ct ->
        json(conn, %{data: theme_data(ct)})
    end
  end

  @doc "DELETE /api/v1/conversations/:conversation_id/theme"
  def delete(conn, %{"conversation_id" => conv_id}) do
    user = conn.assigns.current_user
    ChatTheme.delete_theme(user.id, conv_id)
    send_resp(conn, :no_content, "")
  end

  @doc "GET /api/v1/themes/presets"
  def presets(conn, _params) do
    json(conn, %{data: ChatTheme.list_preset_themes()})
  end

  defp theme_data(ct) do
    %{
      id: ct.id,
      theme: ct.theme,
      user_id: ct.user_id,
      conversation_id: ct.conversation_id
    }
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
