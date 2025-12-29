defmodule CgraphWeb.API.V1.ChannelController do
  @moduledoc """
  Controller for group channels.
  """
  use CgraphWeb, :controller

  alias Cgraph.Groups

  action_fallback CgraphWeb.FallbackController

  @doc """
  List channels in a group.
  """
  def index(conn, %{"group_id" => group_id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id) do
      channels = Groups.list_channels(group)
      render(conn, :index, channels: channels)
    end
  end

  @doc """
  Get a specific channel.
  """
  def show(conn, %{"group_id" => group_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         {:ok, channel} <- Groups.get_channel(group, id) do
      render(conn, :show, channel: channel)
    end
  end

  @doc """
  Create a new channel.
  """
  def create(conn, %{"group_id" => group_id} = params) do
    user = conn.assigns.current_user

    channel_params = %{
      name: Map.get(params, "name"),
      type: Map.get(params, "type", "text"),
      topic: Map.get(params, "topic"),
      position: Map.get(params, "position", 0),
      category_id: Map.get(params, "category_id"),
      nsfw: Map.get(params, "nsfw", false),
      slowmode_seconds: Map.get(params, "slowmode_seconds", 0)
    }

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_channels),
         {:ok, channel} <- Groups.create_channel(group, channel_params) do
      conn
      |> put_status(:created)
      |> render(:show, channel: channel)
    end
  end

  @doc """
  Update a channel.
  """
  def update(conn, %{"group_id" => group_id, "id" => id} = params) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_channels),
         {:ok, channel} <- Groups.get_channel(group, id),
         {:ok, updated} <- Groups.update_channel(channel, params) do
      render(conn, :show, channel: updated)
    end
  end

  @doc """
  Delete a channel.
  """
  def delete(conn, %{"group_id" => group_id, "id" => id}) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_user_group(user, group_id),
         :ok <- Groups.authorize(user, group, :manage_channels),
         {:ok, channel} <- Groups.get_channel(group, id),
         {:ok, _} <- Groups.delete_channel(channel) do
      send_resp(conn, :no_content, "")
    end
  end
end
