defmodule CGraphWeb.API.V1.GroupEmojiController do
  @moduledoc """
  Controller for custom group emojis.
  """
  use CGraphWeb, :controller

  alias CGraph.Groups

  action_fallback CGraphWeb.FallbackController

  @doc """
  List custom emojis for a group.
  """
  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, %{"group_id" => group_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id) do
      emojis = Groups.list_group_emojis(group)
      render(conn, :index, emojis: emojis)
    end
  end

  @doc """
  Upload a custom emoji.
  """
  @spec create(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def create(conn, %{"group_id" => group_id} = params) do
    user = conn.assigns.current_user

    emoji_params = %{
      name: Map.get(params, "name"),
      image_url: Map.get(params, "image_url"),
      animated: Map.get(params, "animated", false)
    }

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_emojis),
         {:ok, emoji} <- Groups.create_group_emoji(group, user, emoji_params) do
      conn
      |> put_status(:created)
      |> render(:show, emoji: emoji)
    end
  end

  @doc """
  Update a custom emoji (rename).
  """
  @spec update(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def update(conn, %{"group_id" => group_id, "id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_emojis),
         {:ok, emoji} <- Groups.get_group_emoji(group, id),
         {:ok, updated} <- Groups.update_group_emoji(emoji, params) do
      render(conn, :show, emoji: updated)
    end
  end

  @doc """
  Delete a custom emoji.
  """
  @spec delete(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete(conn, %{"group_id" => group_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_emojis),
         {:ok, emoji} <- Groups.get_group_emoji(group, id),
         {:ok, _} <- Groups.delete_group_emoji(emoji) do
      send_resp(conn, :no_content, "")
    end
  end
end
