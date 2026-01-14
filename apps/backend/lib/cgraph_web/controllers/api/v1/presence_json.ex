defmodule CGraphWeb.API.V1.PresenceJSON do
  @moduledoc """
  JSON rendering for Presence endpoints.
  """

  # ========================================
  # ONLINE USERS
  # ========================================

  def online(%{users: users, pagination: pagination, guests: guests, total_online: total_online}) do
    %{
      data: %{
        users: for(user <- users, do: online_user_data(user)),
        guests: guests,
        total_online: total_online
      },
      pagination: pagination_data(pagination)
    }
  end

  defp online_user_data(user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar,
      role: user.role,
      title: Map.get(user, :title),
      group: group_data(Map.get(user, :primary_group)),
      location: location_data(Map.get(user, :current_location)),
      last_activity: Map.get(user, :last_activity_at),
      is_invisible: Map.get(user, :is_invisible, false)
    }
  end

  defp group_data(nil), do: nil
  defp group_data(%Ecto.Association.NotLoaded{}), do: nil
  defp group_data(group) do
    %{
      id: group.id,
      name: group.name,
      color: group.color
    }
  end

  defp location_data(nil), do: nil
  defp location_data(location) when is_map(location) do
    %{
      page: location[:page] || location["page"],
      forum_id: location[:forum_id] || location["forum_id"],
      forum_name: location[:forum_name] || location["forum_name"],
      thread_id: location[:thread_id] || location["thread_id"],
      thread_title: location[:thread_title] || location["thread_title"],
      action: location[:action] || location["action"],
      description: location[:description] || location["description"]
    }
  end

  # ========================================
  # STATS
  # ========================================

  def stats(%{stats: stats}) do
    %{
      data: %{
        users_online: stats[:users_online] || stats["users_online"] || 0,
        guests_online: stats[:guests_online] || stats["guests_online"] || 0,
        invisible_users: stats[:invisible_users] || stats["invisible_users"] || 0,
        total_online: stats[:total_online] || stats["total_online"] || 0,
        most_online: stats[:most_online] || stats["most_online"] || 0,
        most_online_date: stats[:most_online_date] || stats["most_online_date"],
        users_today: stats[:users_today] || stats["users_today"] || 0,
        bots_online: stats[:bots_online] || stats["bots_online"] || 0,
        breakdown: breakdown_data(stats[:breakdown] || stats["breakdown"])
      }
    }
  end

  defp breakdown_data(nil), do: nil
  defp breakdown_data(breakdown) when is_map(breakdown) do
    %{
      forums: breakdown[:forums] || breakdown["forums"] || 0,
      threads: breakdown[:threads] || breakdown["threads"] || 0,
      members: breakdown[:members] || breakdown["members"] || 0,
      other: breakdown[:other] || breakdown["other"] || 0
    }
  end

  # ========================================
  # WHO'S HERE
  # ========================================

  def whos_here(%{users: users, location: location}) do
    %{
      data: %{
        users: for(user <- users, do: whos_here_user(user)),
        location: location,
        count: length(users)
      }
    }
  end

  defp whos_here_user(user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar,
      role: user.role,
      joined_at: Map.get(user, :joined_location_at)
    }
  end

  # ========================================
  # USER STATUS
  # ========================================

  def user_status(%{status: status}) do
    %{
      data: %{
        user_id: status[:user_id] || status["user_id"],
        is_online: status[:is_online] || status["is_online"] || false,
        is_invisible: status[:is_invisible] || status["is_invisible"] || false,
        last_online_at: status[:last_online_at] || status["last_online_at"],
        current_location: location_data(status[:current_location] || status["current_location"]),
        status_text: status[:status_text] || status["status_text"]
      }
    }
  end

  # ========================================
  # HELPERS
  # ========================================

  defp pagination_data(nil), do: nil
  defp pagination_data(pagination) do
    %{
      page: pagination[:page] || pagination["page"],
      per_page: pagination[:per_page] || pagination["per_page"],
      total_count: pagination[:total_count] || pagination["total_count"],
      total_pages: pagination[:total_pages] || pagination["total_pages"]
    }
  end
end
