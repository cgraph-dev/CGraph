defmodule CgraphWeb.API.V1.MemberJSON do
  @moduledoc """
  JSON rendering for Member endpoints.
  """

  # ========================================
  # MEMBERS
  # ========================================

  def members(%{members: members, pagination: pagination}) do
    %{
      data: for(member <- members, do: member_data(member)),
      pagination: pagination_data(pagination)
    }
  end

  def member(%{member: member}) do
    %{data: member_full_data(member)}
  end

  defp member_data(member) do
    %{
      id: member.id,
      username: member.username,
      display_name: member.display_name,
      avatar: member.avatar,
      signature: member.signature,
      title: member.title,
      role: member.role,
      is_online: member.is_online,
      last_online_at: member.last_online_at,
      inserted_at: member.inserted_at,
      post_count: Map.get(member, :post_count, 0),
      thread_count: Map.get(member, :thread_count, 0),
      reputation: Map.get(member, :reputation, 0),
      group: group_summary(Map.get(member, :primary_group)),
      badges: badges_data(Map.get(member, :badges, []))
    }
  end

  defp member_full_data(member) do
    base = member_data(member)
    
    Map.merge(base, %{
      bio: member.bio,
      location: Map.get(member, :location),
      website: Map.get(member, :website),
      birthday: Map.get(member, :birthday),
      gender: Map.get(member, :gender),
      custom_fields: Map.get(member, :custom_fields, %{}),
      social_links: social_links_data(Map.get(member, :social_links)),
      groups: groups_data(Map.get(member, :groups, [])),
      stats: %{
        posts: Map.get(member, :post_count, 0),
        threads: Map.get(member, :thread_count, 0),
        reputation: Map.get(member, :reputation, 0),
        referrals: Map.get(member, :referral_count, 0),
        warnings: Map.get(member, :warning_count, 0),
        days_registered: Map.get(member, :days_registered, 0),
        posts_per_day: Map.get(member, :posts_per_day, 0)
      },
      recent_activity: activity_data(Map.get(member, :recent_activity, [])),
      is_following: Map.get(member, :is_following, false),
      is_friend: Map.get(member, :is_friend, false),
      can_pm: Map.get(member, :can_pm, true),
      is_banned: Map.get(member, :is_banned, false)
    })
  end

  defp group_summary(nil), do: nil
  defp group_summary(%Ecto.Association.NotLoaded{}), do: nil
  defp group_summary(group) do
    %{
      id: group.id,
      name: group.name,
      color: group.color,
      icon: group.icon
    }
  end

  defp badges_data([]), do: []
  defp badges_data(nil), do: []
  defp badges_data(badges) do
    Enum.map(badges, fn badge ->
      %{
        id: badge[:id] || badge["id"],
        name: badge[:name] || badge["name"],
        icon: badge[:icon] || badge["icon"],
        color: badge[:color] || badge["color"]
      }
    end)
  end

  defp social_links_data(nil), do: %{}
  defp social_links_data(links) when is_map(links), do: links
  defp social_links_data(_), do: %{}

  defp groups_data([]), do: []
  defp groups_data(nil), do: []
  defp groups_data(groups) do
    Enum.map(groups, &group_summary/1)
  end

  defp activity_data([]), do: []
  defp activity_data(nil), do: []
  defp activity_data(activities) do
    Enum.map(activities, fn activity ->
      %{
        type: activity[:type] || activity["type"],
        content: activity[:content] || activity["content"],
        timestamp: activity[:timestamp] || activity["timestamp"],
        url: activity[:url] || activity["url"]
      }
    end)
  end

  # ========================================
  # GROUPS
  # ========================================

  def groups(%{groups: groups}) do
    %{data: for(group <- groups, do: group_data(group))}
  end

  def group(%{group: group}) do
    %{data: group_data(group)}
  end

  defp group_data(group) do
    %{
      id: group.id,
      name: group.name,
      description: group.description,
      color: group.color,
      icon: group.icon,
      display_order: group.display_order,
      is_default: group.is_default,
      is_staff: Map.get(group, :is_staff, false),
      is_hidden: Map.get(group, :is_hidden, false),
      member_count: Map.get(group, :member_count, 0),
      permissions: Map.get(group, :permissions, %{})
    }
  end

  # ========================================
  # STATS
  # ========================================

  def member_stats(%{stats: stats}) do
    %{
      data: %{
        total_members: stats[:total_members] || stats["total_members"] || 0,
        members_today: stats[:members_today] || stats["members_today"] || 0,
        members_this_week: stats[:members_this_week] || stats["members_this_week"] || 0,
        members_this_month: stats[:members_this_month] || stats["members_this_month"] || 0,
        newest_member: newest_member_data(stats[:newest_member] || stats["newest_member"]),
        online_now: stats[:online_now] || stats["online_now"] || 0,
        most_online: stats[:most_online] || stats["most_online"] || 0,
        most_online_date: stats[:most_online_date] || stats["most_online_date"]
      }
    }
  end

  defp newest_member_data(nil), do: nil
  defp newest_member_data(member) do
    %{
      id: member[:id] || member["id"],
      username: member[:username] || member["username"],
      display_name: member[:display_name] || member["display_name"],
      avatar: member[:avatar] || member["avatar"],
      joined_at: member[:inserted_at] || member["inserted_at"]
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
