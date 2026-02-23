defmodule CGraphWeb.API.V1.ProfileJSON do
  @moduledoc """
  JSON rendering for Profile endpoints.
  """

  # ========================================
  # PROFILE
  # ========================================

  @doc "Renders a user profile as JSON."
  @spec profile(map()) :: map()
  def profile(%{profile: profile}) do
    %{data: profile_data(profile)}
  end

  defp profile_data(profile) do
    %{
      id: profile.id,
      username: profile.username,
      display_name: Map.get(profile, :display_name),
      avatar: Map.get(profile, :avatar_url) || Map.get(profile, :avatar),
      signature: Map.get(profile, :signature),
      bio: Map.get(profile, :bio),
      title: Map.get(profile, :title),
      role: Map.get(profile, :role),
      location: Map.get(profile, :location),
      website: Map.get(profile, :website),
      birthday: Map.get(profile, :birthday),
      gender: Map.get(profile, :gender),
      timezone: Map.get(profile, :timezone),
      is_online: Map.get(profile, :is_online, false),
      last_online_at: Map.get(profile, :last_online_at),
      inserted_at: Map.get(profile, :inserted_at),
      stats: profile_stats(profile),
      social_links: Map.get(profile, :social_links, %{}),
      custom_fields: Map.get(profile, :custom_fields, %{}),
      groups: groups_data(Map.get(profile, :groups, [])),
      badges: badges_data(Map.get(profile, :badges, [])),
      is_following: Map.get(profile, :is_following, false),
      is_friend: Map.get(profile, :is_friend, false),
      is_banned: Map.get(profile, :is_banned, false),
      can_pm: Map.get(profile, :can_pm, true)
    }
  end

  defp profile_stats(profile) do
    %{
      post_count: Map.get(profile, :post_count, 0),
      thread_count: Map.get(profile, :thread_count, 0),
      reputation: Map.get(profile, :reputation, 0),
      reputation_positive: Map.get(profile, :reputation_positive, 0),
      reputation_negative: Map.get(profile, :reputation_negative, 0),
      referral_count: Map.get(profile, :referral_count, 0),
      warning_level: Map.get(profile, :warning_level, 0),
      days_registered: Map.get(profile, :days_registered, 0),
      posts_per_day: Map.get(profile, :posts_per_day, 0),
      profile_views: Map.get(profile, :profile_views, 0)
    }
  end

  defp groups_data([]), do: []
  defp groups_data(nil), do: []
  defp groups_data(groups) do
    Enum.map(groups, fn group ->
      %{
        id: group.id,
        name: group.name,
        color: group.color,
        icon: group.icon
      }
    end)
  end

  defp badges_data([]), do: []
  defp badges_data(nil), do: []
  defp badges_data(badges) do
    Enum.map(badges, fn badge ->
      %{
        id: badge[:id] || badge["id"],
        name: badge[:name] || badge["name"],
        icon: badge[:icon] || badge["icon"],
        color: badge[:color] || badge["color"],
        description: badge[:description] || badge["description"]
      }
    end)
  end

  # ========================================
  # POSTS
  # ========================================

  @doc "Renders a user's posts as JSON."
  @spec posts(map()) :: map()
  def posts(%{posts: posts, pagination: pagination}) do
    %{
      data: for(post <- posts, do: post_data(post)),
      pagination: pagination_data(pagination)
    }
  end

  defp post_data(post) do
    %{
      id: post.id,
      content: post.content,
      thread_id: post.thread_id,
      thread_title: Map.get(post, :thread_title),
      forum_id: Map.get(post, :forum_id),
      forum_name: Map.get(post, :forum_name),
      inserted_at: post.inserted_at,
      updated_at: post.updated_at,
      like_count: Map.get(post, :like_count, 0)
    }
  end

  # ========================================
  # THREADS
  # ========================================

  @doc "Renders a user's threads as JSON."
  @spec threads(map()) :: map()
  def threads(%{threads: threads, pagination: pagination}) do
    %{
      data: for(thread <- threads, do: thread_data(thread)),
      pagination: pagination_data(pagination)
    }
  end

  defp thread_data(thread) do
    %{
      id: thread.id,
      title: thread.title,
      forum_id: thread.forum_id,
      forum_name: Map.get(thread, :forum_name),
      is_pinned: thread.is_pinned,
      is_locked: thread.is_locked,
      reply_count: Map.get(thread, :reply_count, 0),
      view_count: Map.get(thread, :view_count, 0),
      last_post_at: Map.get(thread, :last_post_at),
      inserted_at: thread.inserted_at
    }
  end

  # ========================================
  # REPUTATION
  # ========================================

  @doc "Renders user reputation data as JSON."
  @spec reputation(map()) :: map()
  def reputation(%{entries: entries, pagination: pagination, summary: summary}) do
    %{
      data: %{
        entries: for(entry <- entries, do: reputation_entry_data(entry)),
        summary: summary_data(summary)
      },
      pagination: pagination_data(pagination)
    }
  end

  @doc "Renders a reputation entry as JSON."
  @spec reputation_entry(map()) :: map()
  def reputation_entry(%{entry: entry}) do
    %{data: reputation_entry_data(entry)}
  end

  defp reputation_entry_data(entry) do
    %{
      id: entry.id,
      from_user: user_summary(Map.get(entry, :from_user)),
      value: entry.value,
      comment: entry.comment,
      post_id: entry.post_id,
      post: post_summary(Map.get(entry, :post)),
      inserted_at: entry.inserted_at
    }
  end

  defp user_summary(nil), do: nil
  defp user_summary(%Ecto.Association.NotLoaded{}), do: nil
  defp user_summary(user) do
    %{
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar: user.avatar
    }
  end

  defp post_summary(nil), do: nil
  defp post_summary(%Ecto.Association.NotLoaded{}), do: nil
  defp post_summary(post) do
    %{
      id: post.id,
      thread_id: post.thread_id,
      thread_title: Map.get(post, :thread_title),
      content_preview: String.slice(post.content || "", 0..100)
    }
  end

  defp summary_data(nil), do: nil
  defp summary_data(summary) do
    %{
      total: summary[:total] || summary["total"] || 0,
      positive: summary[:positive] || summary["positive"] || 0,
      negative: summary[:negative] || summary["negative"] || 0,
      neutral: summary[:neutral] || summary["neutral"] || 0
    }
  end

  # ========================================
  # ACTIVITY
  # ========================================

  @doc "Renders user activity as JSON."
  @spec activity(map()) :: map()
  def activity(%{activity: activity, pagination: pagination}) do
    %{
      data: for(item <- activity, do: activity_item_data(item)),
      pagination: pagination_data(pagination)
    }
  end

  defp activity_item_data(item) do
    %{
      type: item[:type] || item["type"],
      content: item[:content] || item["content"],
      description: item[:description] || item["description"],
      url: item[:url] || item["url"],
      resource_id: item[:resource_id] || item["resource_id"],
      resource_type: item[:resource_type] || item["resource_type"],
      timestamp: item[:timestamp] || item["timestamp"]
    }
  end

  # ========================================
  # VISITORS
  # ========================================

  @doc "Renders profile visitors as JSON."
  @spec visitors(map()) :: map()
  def visitors(%{visitors: visitors, pagination: pagination}) do
    %{
      data: for(visitor <- visitors, do: visitor_data(visitor)),
      pagination: pagination_data(pagination)
    }
  end

  defp visitor_data(visitor) do
    %{
      user: user_summary(visitor.user),
      visited_at: visitor.visited_at,
      visit_count: visitor.visit_count
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
