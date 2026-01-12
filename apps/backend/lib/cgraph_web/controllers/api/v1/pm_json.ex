defmodule CgraphWeb.API.V1.PMJson do
  @moduledoc """
  JSON rendering for Private Message endpoints.
  """

  def folders(%{folders: folders}) do
    %{folders: Enum.map(folders, &folder_data/1)}
  end

  def folder(%{folder: folder}) do
    %{folder: folder_data(folder)}
  end

  def messages(%{messages: messages, pagination: pagination}) do
    %{
      messages: Enum.map(messages, &message_data/1),
      pagination: pagination
    }
  end

  def message(%{message: message}) do
    %{message: message_data(message)}
  end

  def drafts(%{drafts: drafts, pagination: pagination}) do
    %{
      drafts: Enum.map(drafts, &draft_data/1),
      pagination: pagination
    }
  end

  def draft(%{draft: draft}) do
    %{draft: draft_data(draft)}
  end

  defp folder_data(folder) do
    %{
      id: folder.id,
      name: folder.name,
      icon: folder.icon,
      color: folder.color,
      is_system: folder.is_system,
      message_count: Map.get(folder, :message_count, 0),
      unread_count: Map.get(folder, :unread_count, 0),
      created_at: folder.inserted_at
    }
  end

  defp message_data(message) do
    %{
      id: message.id,
      subject: message.subject,
      content: message.content,
      icon: message.icon,
      sender: user_data(message.sender),
      recipients: Enum.map(message.recipients || [], &user_data/1),
      parent_id: message.parent_id,
      folder_id: message.folder_id,
      is_read: message.is_read,
      read_at: message.read_at,
      is_starred: Map.get(message, :is_starred, false),
      is_deleted: message.is_deleted,
      created_at: message.inserted_at,
      updated_at: message.updated_at
    }
  end

  defp draft_data(draft) do
    %{
      id: draft.id,
      subject: draft.subject,
      content: draft.content,
      recipient_ids: draft.recipient_ids,
      recipients: Enum.map(draft.recipients || [], &user_data/1),
      created_at: draft.inserted_at,
      updated_at: draft.updated_at
    }
  end

  defp user_data(nil), do: nil
  defp user_data(user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url
    }
  end
end
