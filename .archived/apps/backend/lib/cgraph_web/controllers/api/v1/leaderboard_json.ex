defmodule CGraphWeb.API.V1.LeaderboardJSON do
  @moduledoc """
  JSON rendering for leaderboard responses.

  Formats leaderboard entries with consistent camelCase keys
  for frontend consumption.
  """

  @doc """
  Renders the leaderboard index with entries and metadata.
  """
  @spec index(map()) :: map()
  def index(%{entries: entries, category: category, period: period, user_rank: user_rank, meta: meta}) do
    %{
      data: %{
        category: category,
        period: period,
        entries: Enum.map(entries, &render_entry/1),
        userRank: render_user_rank(user_rank)
      },
      meta: %{
        limit: meta.limit,
        hasMore: meta.has_more,
        nextCursor: meta.next_cursor,
        lastUpdated: DateTime.to_iso8601(meta.last_updated)
      }
    }
  end

  # Renders a single leaderboard entry
  defp render_entry(entry) do
    %{
      rank: entry.rank,
      previousRank: Map.get(entry, :previous_rank),
      userId: entry.id,
      username: entry.username,
      displayName: Map.get(entry, :display_name),
      avatarUrl: Map.get(entry, :avatar_url),
      level: Map.get(entry, :level),
      value: entry.value,
      isOnline: Map.get(entry, :is_online, false),
      isPremium: Map.get(entry, :is_premium, false),
      isVerified: Map.get(entry, :is_verified, false),
      title: Map.get(entry, :title)
    }
  end

  # Renders the current user's rank entry
  defp render_user_rank(nil), do: nil
  defp render_user_rank(entry) do
    %{
      rank: entry.rank,
      previousRank: entry.previous_rank,
      userId: entry.user_id,
      username: entry.username,
      displayName: entry.display_name,
      avatarUrl: entry.avatar_url,
      level: entry.level,
      value: entry.value,
      isOnline: entry.is_online,
      isPremium: entry.is_premium,
      isVerified: entry.is_verified
    }
  end
end
