defmodule CgraphWeb.API.V1.MessageJSON do
  @moduledoc """
  JSON rendering for message responses.
  """
  alias Cgraph.Messaging.Message
  alias Cgraph.Accounts.User

  def index(%{messages: messages, meta: meta}) do
    %{
      data: Enum.map(messages, &message_data/1),
      meta: meta
    }
  end

  def show(%{message: message}) do
    %{data: message_data(message)}
  end

  def message_data(%Message{} = msg) do
    %{
      id: msg.id,
      content: msg.content,
      content_type: msg.content_type,
      sender: sender_data(msg.sender),
      attachment: build_attachment(msg),
      reactions: reaction_summary(msg.reactions),
      reply_to: reply_data(msg.reply_to),
      is_edited: msg.is_edited || false,
      created_at: msg.inserted_at
    }
  end

  # Build attachment data from message file fields
  defp build_attachment(%Message{file_url: nil}), do: nil
  defp build_attachment(%Message{} = msg) do
    %{
      url: msg.file_url,
      filename: msg.file_name,
      size: msg.file_size,
      mime_type: msg.file_mime_type,
      thumbnail_url: msg.thumbnail_url
    }
  end

  # Handle sender associations that may not be loaded
  defp sender_data(nil), do: nil
  defp sender_data(%Ecto.Association.NotLoaded{}), do: nil
  defp sender_data(%User{} = user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url
    }
  end

  # Handle reactions that may not be loaded
  defp reaction_summary(%Ecto.Association.NotLoaded{}), do: []
  defp reaction_summary(nil), do: []
  defp reaction_summary(reactions) do
    reactions
    |> Enum.group_by(& &1.emoji)
    |> Enum.map(fn {emoji, list} ->
      %{
        emoji: emoji,
        count: length(list),
        users: Enum.take(list, 3) |> Enum.map(& &1.user_id)
      }
    end)
  end

  # Handle reply_to associations that may not be loaded
  defp reply_data(nil), do: nil
  defp reply_data(%Ecto.Association.NotLoaded{}), do: nil
  defp reply_data(%Message{} = msg) do
    %{
      id: msg.id,
      content: truncate(msg.content, 100),
      sender: sender_data(msg.sender)
    }
  end

  defp truncate(nil, _), do: nil
  defp truncate(str, max) when byte_size(str) <= max, do: str
  defp truncate(str, max), do: String.slice(str, 0, max) <> "..."
end
