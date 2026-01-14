defmodule CGraphWeb.API.V1.AnnouncementJson do
  @moduledoc """
  JSON rendering for Announcement endpoints.
  """

  def index(%{announcements: announcements}) do
    %{announcements: Enum.map(announcements, &announcement_data/1)}
  end

  def show(%{announcement: announcement}) do
    %{announcement: announcement_data(announcement)}
  end

  defp announcement_data(announcement) do
    %{
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      is_global: announcement.is_global,
      forum_id: announcement.forum_id,
      forum_name: Map.get(announcement, :forum_name),
      icon: announcement.icon,
      color: announcement.color,
      is_dismissible: announcement.is_dismissible,
      is_read: Map.get(announcement, :is_read, false),
      is_dismissed: Map.get(announcement, :is_dismissed, false),
      start_date: announcement.start_date,
      end_date: announcement.end_date,
      author: author_data(announcement.author),
      created_at: announcement.inserted_at,
      updated_at: announcement.updated_at
    }
  end

  defp author_data(nil), do: nil
  defp author_data(author) do
    %{
      id: author.id,
      username: author.username,
      display_name: author.display_name,
      avatar_url: author.avatar_url
    }
  end
end
