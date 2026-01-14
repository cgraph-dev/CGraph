defmodule CGraphWeb.API.V1.ReactionController do
  @moduledoc """
  Handles message reactions.
  Users can add emoji reactions to messages in conversations and channels.
  """
  use CGraphWeb, :controller

  import CGraphWeb.Helpers.ParamParser

  alias CGraph.Groups
  alias CGraph.Messaging

  action_fallback CGraphWeb.FallbackController

  @max_limit 100

  @doc """
  List reactions on a message.
  GET /api/v1/conversations/:conversation_id/messages/:message_id/reactions
  """
  def index(conn, %{"conversation_id" => conversation_id, "message_id" => message_id} = params) do
    user = conn.assigns.current_user
    emoji = Map.get(params, "emoji") # Optional filter by specific emoji

    with {:ok, conversation} <- Messaging.get_conversation(conversation_id),
         :ok <- Messaging.authorize_access(user, conversation),
         {:ok, message} <- Messaging.get_message(conversation, message_id) do
      reactions = Messaging.list_reactions(message, emoji: emoji)
      render(conn, :index, reactions: reactions)
    end
  end

  @doc """
  Add a reaction to a message.
  POST /api/v1/conversations/:conversation_id/messages/:message_id/reactions
  POST /api/v1/messages/:id/reactions
  """
  def create(conn, %{"conversation_id" => conversation_id, "message_id" => message_id, "emoji" => emoji}) do
    user = conn.assigns.current_user

    with {:ok, conversation} <- Messaging.get_conversation(conversation_id),
         :ok <- Messaging.authorize_access(user, conversation),
         {:ok, message} <- Messaging.get_message(conversation, message_id),
         :ok <- validate_emoji(emoji),
         {:ok, reaction, replaced_emoji} <- Messaging.add_reaction(user, message, emoji) do
      # If we replaced an old reaction, broadcast its removal first
      if replaced_emoji do
        Messaging.broadcast_reaction_removed(conversation, message, user, replaced_emoji)
      end

      # Broadcast reaction to other participants (pass user for complete data)
      Messaging.broadcast_reaction_added(conversation, message, reaction, user)

      conn
      |> put_status(:created)
      |> render(:show, reaction: reaction)
    end
  end

  # Simplified route: POST /api/v1/messages/:id/reactions
  def create(conn, %{"id" => message_id, "emoji" => emoji}) do
    user = conn.assigns.current_user

    with {:ok, message} <- Messaging.get_message(message_id),
         {:ok, conversation} <- Messaging.get_conversation(message.conversation_id),
         :ok <- Messaging.authorize_access(user, conversation),
         :ok <- validate_emoji(emoji),
         {:ok, reaction, replaced_emoji} <- Messaging.add_reaction(user, message, emoji) do
      # If we replaced an old reaction, broadcast its removal first
      if replaced_emoji do
        Messaging.broadcast_reaction_removed(conversation, message, user, replaced_emoji)
      end

      # Broadcast reaction to other participants (pass user for complete data)
      Messaging.broadcast_reaction_added(conversation, message, reaction, user)

      conn
      |> put_status(:created)
      |> render(:show, reaction: reaction)
    end
  end

  @doc """
  Remove a reaction from a message.
  DELETE /api/v1/conversations/:conversation_id/messages/:message_id/reactions/:emoji
  DELETE /api/v1/messages/:id/reactions/:emoji
  """
  def delete(conn, %{"conversation_id" => conversation_id, "message_id" => message_id, "emoji" => emoji}) do
    user = conn.assigns.current_user

    with {:ok, conversation} <- Messaging.get_conversation(conversation_id),
         :ok <- Messaging.authorize_access(user, conversation),
         {:ok, message} <- Messaging.get_message(conversation, message_id),
         {:ok, _} <- Messaging.remove_reaction(user, message, emoji) do
      # Broadcast reaction removal
      Messaging.broadcast_reaction_removed(conversation, message, user, emoji)

      send_resp(conn, :no_content, "")
    end
  end

  # Simplified route: DELETE /api/v1/messages/:id/reactions/:emoji
  def delete(conn, %{"id" => message_id, "emoji" => emoji}) do
    user = conn.assigns.current_user

    with {:ok, message} <- Messaging.get_message(message_id),
         {:ok, conversation} <- Messaging.get_conversation(message.conversation_id),
         :ok <- Messaging.authorize_access(user, conversation),
         {:ok, _} <- Messaging.remove_reaction(user, message, emoji) do
      Messaging.broadcast_reaction_removed(conversation, message, user, emoji)

      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  List reactions on a channel message.
  GET /api/v1/groups/:group_id/channels/:channel_id/messages/:message_id/reactions
  """
  def channel_index(conn, %{"group_id" => group_id, "channel_id" => channel_id, "message_id" => message_id} = params) do
    user = conn.assigns.current_user
    emoji = Map.get(params, "emoji")

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :view),
         {:ok, channel} <- Groups.get_channel(group, channel_id),
         {:ok, message} <- Groups.get_channel_message(channel, message_id) do
      reactions = Groups.list_message_reactions(message, emoji: emoji)
      render(conn, :index, reactions: reactions)
    end
  end

  @doc """
  Add a reaction to a channel message.
  POST /api/v1/groups/:group_id/channels/:channel_id/messages/:message_id/reactions
  """
  def channel_create(conn, %{
    "group_id" => group_id,
    "channel_id" => channel_id,
    "message_id" => message_id,
    "emoji" => emoji
  }) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :add_reactions),
         {:ok, channel} <- Groups.get_channel(group, channel_id),
         {:ok, message} <- Groups.get_channel_message(channel, message_id),
         :ok <- validate_emoji(emoji),
         {:ok, reaction, replaced_emoji} <- Groups.add_message_reaction(user, message, emoji) do
      # If we replaced an old reaction, broadcast its removal first
      if replaced_emoji do
        Groups.broadcast_reaction_removed(channel, message, user, replaced_emoji)
      end

      # Broadcast reaction
      Groups.broadcast_reaction_added(channel, message, reaction, user)

      conn
      |> put_status(:created)
      |> render(:show, reaction: reaction)
    end
  end

  @doc """
  Remove a reaction from a channel message.
  DELETE /api/v1/groups/:group_id/channels/:channel_id/messages/:message_id/reactions/:emoji
  """
  def channel_delete(conn, %{
    "group_id" => group_id,
    "channel_id" => channel_id,
    "message_id" => message_id,
    "emoji" => emoji
  }) do
    user = conn.assigns.current_user

    with {:ok, group} <- Groups.get_group(group_id),
         :ok <- Groups.authorize_action(user, group, :view),
         {:ok, channel} <- Groups.get_channel(group, channel_id),
         {:ok, message} <- Groups.get_channel_message(channel, message_id),
         {:ok, _} <- Groups.remove_message_reaction(user, message, emoji) do
      # Broadcast removal
      Groups.broadcast_reaction_removed(channel, message, user, emoji)

      send_resp(conn, :no_content, "")
    end
  end

  @doc """
  Get users who reacted with a specific emoji.
  GET /api/v1/conversations/:conversation_id/messages/:message_id/reactions/:emoji/users
  """
  def users(conn, %{"conversation_id" => conversation_id, "message_id" => message_id, "emoji" => emoji} = params) do
    user = conn.assigns.current_user
    limit = parse_int(params["limit"], 50, min: 1, max: @max_limit)

    with {:ok, conversation} <- Messaging.get_conversation(conversation_id),
         :ok <- Messaging.authorize_access(user, conversation),
         {:ok, message} <- Messaging.get_message(conversation, message_id) do
      users = Messaging.get_reaction_users(message, emoji, limit: limit)
      render(conn, :users, users: users, emoji: emoji)
    end
  end

  # Private helpers

  defp validate_emoji(emoji) do
    # Validate emoji is a valid Unicode emoji or custom emoji ID
    # This is a simplified check - in production you'd want more thorough validation
    cond do
      String.length(emoji) == 0 ->
        {:error, :invalid_emoji}

      String.length(emoji) > 32 ->
        {:error, :emoji_too_long}

      true ->
        :ok
    end
  end
end
