defmodule CGraphWeb.API.V1.PresenceJSON do
  @moduledoc """
  JSON rendering for Presence endpoints.
  """

  # ========================================
  # ONLINE USERS
  # ========================================

  @spec online(map()) :: map()
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
      page: get_val(location, :page),
      forum_id: get_val(location, :forum_id),
      forum_name: get_val(location, :forum_name),
      thread_id: get_val(location, :thread_id),
      thread_title: get_val(location, :thread_title),
      action: get_val(location, :action),
      description: get_val(location, :description)
    }
  end

  # ========================================
  # STATS
  # ========================================

  @spec stats(map()) :: map()
  def stats(%{stats: stats}) do
    %{
      data: %{
        users_online: get_val(stats, :users_online, 0),
        guests_online: get_val(stats, :guests_online, 0),
        invisible_users: get_val(stats, :invisible_users, 0),
        total_online: get_val(stats, :total_online, 0),
        most_online: get_val(stats, :most_online, 0),
        most_online_date: get_val(stats, :most_online_date),
        users_today: get_val(stats, :users_today, 0),
        bots_online: get_val(stats, :bots_online, 0),
        breakdown: breakdown_data(get_val(stats, :breakdown))
      }
    }
  end

  defp breakdown_data(nil), do: nil
  defp breakdown_data(breakdown) when is_map(breakdown) do
    %{
      forums: get_val(breakdown, :forums, 0),
      threads: get_val(breakdown, :threads, 0),
      members: get_val(breakdown, :members, 0),
      other: get_val(breakdown, :other, 0)
    }
  end

  # ========================================
  # WHO'S HERE
  # ========================================

  @spec whos_here(map()) :: map()
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

  @spec user_status(map()) :: map()
  def user_status(%{status: status}) do
    %{
      data: %{
        user_id: get_val(status, :user_id),
        is_online: get_val(status, :is_online, false),
        is_invisible: get_val(status, :is_invisible, false),
        last_online_at: get_val(status, :last_online_at),
        current_location: location_data(get_val(status, :current_location)),
        status_text: get_val(status, :status_text)
      }
    }
  end

  # ========================================
  # HELPERS
  # ========================================

  defp pagination_data(nil), do: nil
  defp pagination_data(pagination) do
    %{
      page: get_val(pagination, :page),
      per_page: get_val(pagination, :per_page),
      total_count: get_val(pagination, :total_count),
      total_pages: get_val(pagination, :total_pages)
    }
  end

  # Flexible key access: tries atom key, then string key, with optional default.
  # Handles maps from both Elixir contexts (atom keys) and JSON (string keys).
  defp get_val(map, key, default \\ nil) do
    map[key] || map[to_string(key)] || default
  end
end
